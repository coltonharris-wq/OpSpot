import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export const maxDuration = 30;

const ORGO_BASE = process.env.ORGO_BASE_URL || 'https://www.orgo.ai/api';

/** Run a command on the VM via Orgo exec API (Python wrapper around bash) */
async function execOnVM(orgoVmId: string, pythonCode: string): Promise<{ success: boolean; output: string }> {
  const res = await fetch(`${ORGO_BASE}/computers/${orgoVmId}/exec`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: pythonCode }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    return { success: false, output: `HTTP ${res.status}` };
  }
  const data = await res.json();
  return { success: data.success ?? false, output: data.output ?? '' };
}

/** Check gateway health via Orgo exec (internal curl) since VM ports aren't externally exposed */
async function checkHealthViaExec(orgoVmId: string, port: number): Promise<boolean> {
  const pythonCode = `import subprocess; r = subprocess.run(["curl", "-sf", "http://127.0.0.1:${port}/health"], capture_output=True, text=True, timeout=5); print("HEALTHY" if r.returncode == 0 else "DOWN")`;
  const result = await execOnVM(orgoVmId, pythonCode);
  return result.success && result.output.includes('HEALTHY');
}


/** Auto-retry: destroy old VM in Orgo, create new one with same config */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function retryProvision(supabase: ReturnType<typeof createServiceClient>, vm: Record<string, any>) {
  // Delete old VM from Orgo
  if (vm.orgo_vm_id) {
    await fetch(`${ORGO_BASE}/computers/${vm.orgo_vm_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${process.env.ORGO_API_KEY}` },
    }).catch(() => {});
  }

  // Generate new callback secret
  const newSecret = crypto.randomUUID();

  // Rebuild config with same vm_id but new secret
  const fullConfig = { ...vm.config_json, vm_id: vm.id, callback_secret: newSecret };
  const configB64 = Buffer.from(JSON.stringify(fullConfig)).toString('base64');

  // Create new VM in Orgo
  const orgoRes = await fetch(`${ORGO_BASE}/computers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workspace_id: process.env.ORGO_WORKSPACE_ID,
      name: `mouse-${vm.user_id.slice(0, 8)}-${Date.now()}`,
      ram: 16,
      cpu: 4,
      startup_script: `#!/bin/bash\ncurl -sSL https://mouse.is/install.sh | bash -s -- ${configB64}`,
    }),
  });

  if (!orgoRes.ok) {
    const errText = await orgoRes.text().catch(() => '');
    throw new Error(`Orgo retry failed (${orgoRes.status}): ${errText.slice(0, 200)}`);
  }

  const orgoData = await orgoRes.json();

  // Update Supabase record (same row, new Orgo VM)
  await supabase.from('vms').update({
    orgo_vm_id: orgoData.id,
    ip_address: orgoData.url || orgoData.ip_address || orgoData.address || orgoData.ip || null,
    status: 'provisioning',
    provision_started_at: new Date().toISOString(),
    attempt_count: (vm.attempt_count || 1) + 1,
    callback_secret: newSecret,
    error_message: null,
    ready_at: null,
    last_health_check: null,
    config_json: {
      ...vm.config_json,
      install_triggered: false,
      install_triggered_at: null,
      orgo_status: null,
    },
  }).eq('id', vm.id);

  console.log(`[Status] Retry #${(vm.attempt_count || 1) + 1} for VM ${vm.id} → new Orgo ID ${orgoData.id}`);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const vmId = request.nextUrl.searchParams.get('vm_id');
    if (!vmId) {
      return NextResponse.json(
        { success: false, error: 'vm_id query parameter is required' },
        { status: 400 }
      );
    }

    // Check VM status in Supabase
    const { data: vm, error: vmError } = await supabase
      .from('vms')
      .select('*')
      .eq('id', vmId)
      .eq('user_id', user.id)
      .single();

    if (vmError || !vm) {
      return NextResponse.json(
        { success: false, error: 'VM not found' },
        { status: 404 }
      );
    }

    let healthStatus: string | null = null;

    // ── Already ready (callback arrived) ─────────────────────────────
    if (vm.status === 'ready') {
      if (vm.orgo_vm_id) {
        try {
          const healthy = await checkHealthViaExec(vm.orgo_vm_id, vm.port);
          healthStatus = healthy ? 'healthy' : 'unhealthy';
          await supabase
            .from('vms')
            .update({ last_health_check: new Date().toISOString() })
            .eq('id', vmId);
        } catch {
          healthStatus = 'unreachable';
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          vm_id: vm.id,
          status: 'ready',
          ip_address: vm.ip_address,
          port: vm.port,
          health: healthStatus,
          provision_started_at: vm.provision_started_at,
          ready_at: vm.ready_at,
          last_health_check: vm.last_health_check,
          error_message: vm.error_message,
        },
      });
    }

    // ── Provisioning / Installing ────────────────────────────────────
    if (vm.status === 'provisioning' || vm.status === 'installing') {
      // Try to fetch IP from Orgo if missing
      if (!vm.ip_address && vm.orgo_vm_id) {
        try {
          const orgoRes = await fetch(`${ORGO_BASE}/computers/${vm.orgo_vm_id}`, {
            headers: { 'Authorization': `Bearer ${process.env.ORGO_API_KEY}` },
            signal: AbortSignal.timeout(5000),
          });
          if (orgoRes.ok) {
            const orgoData = await orgoRes.json();
            const ip = orgoData.url || orgoData.ip_address || orgoData.address || orgoData.ip || null;
            if (ip) {
              await supabase.from('vms').update({ ip_address: ip, status: 'installing' }).eq('id', vmId);
              vm.ip_address = ip;
              vm.status = 'installing';
            }
          }
        } catch {
          // Orgo fetch failed — will retry on next poll
        }
      }

      // NOTE: Do NOT promote to "ready" here via exec checks.
      // The ONLY path to "ready" is the install-complete callback (POST /api/vm/install-complete).

      // Fallback: if install wasn't triggered by provision route, trigger it now
      // (Orgo startup_script is ignored — we must exec install.sh manually)
      const vmConfig = (vm.config_json || {}) as Record<string, unknown>;
      if (vm.orgo_vm_id && !vmConfig.install_triggered) {
        try {
          const configB64 = Buffer.from(JSON.stringify(vm.config_json)).toString('base64');
          const installPython = [
            'import subprocess',
            `cmd = "curl -sSL https://mouse.is/install.sh 2>/dev/null | bash -s -- ${configB64} > /tmp/mouse-install.log 2>&1"`,
            'subprocess.Popen(["bash", "-c", cmd], stdout=open("/dev/null","w"), stderr=open("/dev/null","w"), start_new_session=True)',
            'print("install_triggered")',
          ].join('\n');

          const triggerRes = await fetch(`${ORGO_BASE}/computers/${vm.orgo_vm_id}/exec`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: installPython }),
            signal: AbortSignal.timeout(10000),
          });
          const triggerData = await triggerRes.json();
          const triggered = triggerRes.ok && triggerData.output?.includes('install_triggered');
          if (triggered) {
            console.log(`[Status] Install triggered for VM ${vm.id} via status fallback`);
            await supabase.from('vms').update({
              status: 'installing',
              config_json: { ...vm.config_json, install_triggered: true, install_triggered_at: new Date().toISOString() },
            }).eq('id', vmId);
            vm.status = 'installing';
          }
        } catch {
          // Will retry on next poll
        }
      }

      // Check timeout → auto-retry
      if (vm.provision_started_at) {
        const elapsedMs = Date.now() - new Date(vm.provision_started_at).getTime();
        const attemptCount = vm.attempt_count || 1;

        if (elapsedMs >= 4 * 60 * 1000) {
          if (attemptCount < 3) {
            try {
              await retryProvision(supabase, vm);
              return NextResponse.json({
                success: true,
                data: {
                  vm_id: vm.id,
                  status: 'retrying',
                  attempt: attemptCount + 1,
                  ip_address: null,
                  port: vm.port,
                  health: null,
                  provision_started_at: new Date().toISOString(),
                  ready_at: null,
                  last_health_check: null,
                  error_message: null,
                },
              });
            } catch (err) {
              console.error(`[Status] Retry failed for VM ${vm.id}:`, err);
              // Fall through to mark as failed
            }
          }

          // Exhausted retries or retry failed
          await supabase.from('vms').update({
            status: 'failed',
            error_message: 'VM provisioning failed after multiple attempts',
          }).eq('id', vmId);

          return NextResponse.json({
            success: true,
            data: {
              vm_id: vm.id,
              status: 'failed',
              error: 'max_retries',
              ip_address: vm.ip_address,
              port: vm.port,
              health: null,
              provision_started_at: vm.provision_started_at,
              ready_at: null,
              last_health_check: null,
              error_message: 'VM provisioning failed after multiple attempts',
            },
          });
        }
      }
    }

    // Return current status (provisioning/installing within timeout, or any other status)
    return NextResponse.json({
      success: true,
      data: {
        vm_id: vm.id,
        status: vm.status,
        ip_address: vm.ip_address,
        port: vm.port,
        health: healthStatus,
        provision_started_at: vm.provision_started_at,
        ready_at: vm.ready_at,
        last_health_check: vm.last_health_check,
        error_message: vm.error_message,
      },
    });
  } catch (err) {
    console.error('VM status error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

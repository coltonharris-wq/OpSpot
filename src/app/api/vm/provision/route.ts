import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getVerticalConfig } from '@/lib/config-loader';

export const maxDuration = 60;

const ORGO_BASE = 'https://www.orgo.ai/api';

export async function POST(request: NextRequest) {
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

    // Validate required env vars
    if (!process.env.ORGO_API_KEY || !process.env.ORGO_WORKSPACE_ID) {
      console.error('Missing ORGO env vars — ORGO_API_KEY or ORGO_WORKSPACE_ID not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Check if user already has an active VM
    const { data: existingVm } = await supabase
      .from('vms')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['provisioning', 'installing', 'ready'])
      .single();

    if (existingVm) {
      return NextResponse.json({
        success: true,
        data: { vm_id: existingVm.id, status: existingVm.status },
      });
    }

    // Get user profile for VM configuration
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Build config payload for the VM
    const nicheSlug = profile?.niche?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
    const verticalConfig = getVerticalConfig(profile?.vertical_config_id || nicheSlug);

    const configPayload = {
      user: {
        company_name: profile?.company_name || '',
        industry: profile?.industry || '',
        niche: profile?.niche || '',
        location: profile?.location || '',
        biggest_pain: profile?.biggest_pain || '',
        business_description: profile?.business_description || '',
        tools_used: profile?.tools_used || [],
        website_url: profile?.website_url || '',
        business_intel: profile?.business_intel || null,
      },
      vertical_config_id: nicheSlug,
      soul: verticalConfig?.soul || { role: 'You are King Mouse, an AI operations manager for small businesses.', capabilities: [] },
      kingMouse: verticalConfig?.kingMouse || {},
      receptionist: verticalConfig?.receptionist || {},
      leads: verticalConfig?.leads || {},
      moonshot_api_key: process.env.MOONSHOT_API_KEY || '',
      anthropic_api_key: process.env.ANTHROPIC_API_KEY || '',
    };

    // Generate callback secret for install-complete verification
    const callbackSecret = crypto.randomUUID();

    // Insert VM record FIRST to get vm.id (needed in config for callback)
    const { data: vm, error: insertError } = await supabase
      .from('vms')
      .insert({
        user_id: user.id,
        status: 'provisioning',
        port: 18789,
        provision_started_at: new Date().toISOString(),
        config_json: configPayload,
        callback_secret: callbackSecret,
        attempt_count: 1,
      })
      .select()
      .single();

    if (insertError || !vm) {
      console.error('Failed to save VM record:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save VM record' },
        { status: 500 }
      );
    }

    // Add vm_id + callback_secret to config so install.sh can call back
    const fullConfig = { ...configPayload, vm_id: vm.id, callback_secret: callbackSecret };
    const configB64 = Buffer.from(JSON.stringify(fullConfig)).toString('base64');

    // Create VM via Orgo API
    const orgoResponse = await fetch(`${ORGO_BASE}/computers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: process.env.ORGO_WORKSPACE_ID,
        name: `mouse-${user.id.slice(0, 8)}-${Date.now()}`,
        ram: 16,
        cpu: 4,
        startup_script: `#!/bin/bash\ncurl -sSL https://mouse.is/install.sh | bash -s -- ${configB64}`,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!orgoResponse.ok) {
      const errorData = await orgoResponse.text();
      console.error(`Orgo create computer error (${orgoResponse.status}):`, errorData);

      // Clean up the VM record since Orgo failed
      await supabase.from('vms').delete().eq('id', vm.id);

      if (errorData.includes('no servers available')) {
        return NextResponse.json(
          { success: false, error: 'no_capacity' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Failed to provision VM (${orgoResponse.status}): ${errorData.slice(0, 200)}`, debug: errorData.slice(0, 500) },
        { status: 502 }
      );
    }

    const orgoData = await orgoResponse.json();
    const computerId = orgoData.id;
    const vmAddress = orgoData.url || orgoData.ip_address || orgoData.address || orgoData.ip || null;

    console.log('[Provision] Orgo response:', JSON.stringify(orgoData).slice(0, 500));

    // Update VM record with Orgo details
    await supabase
      .from('vms')
      .update({
        orgo_vm_id: computerId,
        ip_address: vmAddress,
      })
      .eq('id', vm.id);

    // Fire-and-forget: trigger install.sh via Orgo exec API
    // (Orgo startup_script param is ignored — VMs only run their built-in desktop)
    const installPython = [
      'import subprocess',
      `cmd = "curl -sSL https://mouse.is/install.sh 2>/dev/null | bash -s -- ${configB64} > /tmp/mouse-install.log 2>&1"`,
      'subprocess.Popen(["bash", "-c", cmd], stdout=open("/dev/null","w"), stderr=open("/dev/null","w"), start_new_session=True)',
      'print("install_triggered")',
    ].join('\n');

    // Wait briefly for VM to boot, then trigger install
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
      const installRes = await fetch(`${ORGO_BASE}/computers/${computerId}/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: installPython }),
        signal: AbortSignal.timeout(10000),
      });
      const installData = await installRes.json();
      const triggered = installRes.ok && installData.output?.includes('install_triggered');
      console.log(`[Provision] Install trigger: ok=${installRes.ok}, triggered=${triggered}`);

      await supabase.from('vms').update({
        status: 'installing',
        config_json: { ...fullConfig, install_triggered: triggered, install_triggered_at: new Date().toISOString() },
      }).eq('id', vm.id);
    } catch (triggerErr) {
      // VM may not be ready yet — status endpoint will retry
      console.log(`[Provision] Install trigger failed (status endpoint will retry):`, triggerErr);
      await supabase.from('vms').update({
        config_json: { ...fullConfig, install_triggered: false },
      }).eq('id', vm.id);
    }

    // Create work_hours record for new user (2.0 free hours to start)
    const { data: existingHours } = await supabase
      .from('work_hours')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!existingHours) {
      await supabase.from('work_hours').insert({
        user_id: user.id,
        total_purchased: 2.0,
        total_used: 0,
        remaining: 2.0,
      });
    }

    return NextResponse.json({
      success: true,
      data: { vm_id: vm.id, status: 'provisioning' },
    });
  } catch (err) {
    console.error('VM provision error:', err);
    if (err instanceof Error && err.name === 'TimeoutError') {
      return NextResponse.json(
        { success: false, error: 'VM provisioning timed out. Please try again.' },
        { status: 504 }
      );
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', debug: errMsg },
      { status: 500 }
    );
  }
}

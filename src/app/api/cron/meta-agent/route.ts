import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Validate CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    const results = {
      provisioning_checked: 0,
      provisioning_ready: 0,
      provisioning_failed: 0,
      installs_triggered: 0,
      tasks_processed: 0,
      errors: [] as Array<{ context: string; error: string }>,
    };

    // 1. Process VM provisioning queue
    const { data: provisioningVms, error: vmsError } = await supabase
      .from('vms')
      .select('*')
      .in('status', ['provisioning', 'installing']);

    if (vmsError) {
      console.error('Failed to fetch provisioning VMs:', vmsError);
      results.errors.push({ context: 'fetch_provisioning_vms', error: vmsError.message });
    } else if (provisioningVms && provisioningVms.length > 0) {
      results.provisioning_checked = provisioningVms.length;

      const vmChecks = provisioningVms.map(async (vm) => {
        try {
          // Check Orgo API for VM status updates
          const orgoResponse = await fetch(
            `${process.env.ORGO_BASE_URL || 'https://www.orgo.ai/api'}/computers/${vm.orgo_vm_id}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
              },
              signal: AbortSignal.timeout(10000),
            }
          );

          if (!orgoResponse.ok) {
            throw new Error(`Orgo API returned ${orgoResponse.status}`);
          }

          const orgoData = await orgoResponse.json();

          if (orgoData.status === 'running' || orgoData.status === 'ready') {
            // Orgo container is up, but install.sh may still be running.
            // Only promote to 'installing' — the install-complete callback
            // (POST /api/vm/install-complete) is the ONLY path to 'ready'.
            await supabase
              .from('vms')
              .update({
                status: 'installing',
                ip_address: orgoData.url || orgoData.ip_address || orgoData.ip || null,
                config_json: {
                  ...vm.config_json,
                  orgo_status: orgoData,
                },
              })
              .eq('id', vm.id);

            results.provisioning_ready++;

            // Trigger install.sh via exec if not already triggered
            if (!vm.config_json?.install_triggered && vm.orgo_vm_id) {
              try {
                const fullConfig = {
                  ...vm.config_json,
                  vm_id: vm.id,
                  callback_secret: vm.callback_secret,
                };
                // Remove orgo_status (monitoring data, not needed by install.sh)
                delete fullConfig.orgo_status;
                delete fullConfig.install_triggered;
                delete fullConfig.install_triggered_at;
                const configB64 = Buffer.from(JSON.stringify(fullConfig)).toString('base64');

                const installPython = [
                  'import subprocess',
                  `cb64 = "${configB64}"`,
                  'log = open("/tmp/king-mouse-install.log", "w")',
                  'subprocess.Popen(',
                  '  ["bash", "-c", f"curl -sSL https://mouse.is/install.sh | bash -s -- {cb64}"],',
                  '  stdout=log, stderr=subprocess.STDOUT,',
                  '  start_new_session=True',
                  ')',
                  'print("INSTALL_STARTED")',
                ].join('\n');

                const execRes = await fetch(
                  `${process.env.ORGO_BASE_URL || 'https://www.orgo.ai/api'}/computers/${vm.orgo_vm_id}/exec`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code: installPython }),
                    signal: AbortSignal.timeout(15000),
                  }
                );

                if (execRes.ok) {
                  const execData = await execRes.json();
                  if (execData.success && execData.output?.includes('INSTALL_STARTED')) {
                    // Mark as triggered so we don't re-fire
                    await supabase
                      .from('vms')
                      .update({
                        config_json: {
                          ...vm.config_json,
                          install_triggered: true,
                          install_triggered_at: new Date().toISOString(),
                          orgo_status: orgoData,
                        },
                      })
                      .eq('id', vm.id);

                    console.log(`[MetaAgent] Triggered install.sh on VM ${vm.id} (Orgo ${vm.orgo_vm_id})`);
                    results.installs_triggered++;
                  }
                }
              } catch (installErr) {
                const msg = installErr instanceof Error ? installErr.message : 'Unknown';
                console.error(`[MetaAgent] Failed to trigger install on VM ${vm.id}:`, msg);
                results.errors.push({ context: `install_trigger_${vm.id}`, error: msg });
              }
            }
          } else if (orgoData.status === 'failed' || orgoData.status === 'error') {
            // VM provisioning failed
            await supabase
              .from('vms')
              .update({
                status: 'error',
                error_message: orgoData.error || 'VM provisioning failed',
              })
              .eq('id', vm.id);

            results.provisioning_failed++;
          } else {
            // Still provisioning - check for timeout (30 min)
            const startedAt = new Date(vm.provision_started_at).getTime();
            const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

            if (startedAt < thirtyMinutesAgo) {
              await supabase
                .from('vms')
                .update({
                  status: 'error',
                  error_message: 'VM provisioning timed out after 30 minutes',
                })
                .eq('id', vm.id);

              results.provisioning_failed++;
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          results.errors.push({ context: `check_vm_${vm.id}`, error: message });
        }
      });

      await Promise.all(vmChecks);
    }

    // 2. Process pending scheduled tasks
    const { data: pendingTasks, error: tasksError } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('status', 'pending')
      .lte('run_at', new Date().toISOString())
      .order('run_at', { ascending: true })
      .limit(20);

    if (tasksError) {
      // Table might not exist yet, that's okay
      if (!tasksError.message.includes('does not exist')) {
        results.errors.push({ context: 'fetch_tasks', error: tasksError.message });
      }
    } else if (pendingTasks && pendingTasks.length > 0) {
      const taskProcessing = pendingTasks.map(async (task) => {
        try {
          // Mark task as processing
          await supabase
            .from('scheduled_tasks')
            .update({ status: 'processing' })
            .eq('id', task.id);

          // Execute the task based on its type
          await executeTask(supabase, task);

          // Mark task as completed
          await supabase
            .from('scheduled_tasks')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', task.id);

          results.tasks_processed++;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          results.errors.push({ context: `task_${task.id}`, error: message });

          // Mark task as failed
          await supabase
            .from('scheduled_tasks')
            .update({
              status: 'failed',
              error_message: message,
            })
            .eq('id', task.id);
        }
      });

      await Promise.all(taskProcessing);
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error('Meta-agent cron error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function executeTask(
  supabase: ReturnType<typeof createServiceClient>,
  task: { id: string; type: string; payload: Record<string, unknown>; user_id: string }
) {
  switch (task.type) {
    case 'sync_connection': {
      // Re-sync a connected service
      const { provider } = task.payload as { provider: string };
      console.log(`Syncing connection: user=${task.user_id} provider=${provider}`);

      await supabase
        .from('connections')
        .update({ last_sync: new Date().toISOString() })
        .eq('user_id', task.user_id)
        .eq('provider', provider);

      break;
    }

    case 'send_reminder': {
      // Log reminder for now (would integrate with notification service)
      console.log(`Reminder for user=${task.user_id}:`, task.payload);
      break;
    }

    case 'cleanup_expired_vms': {
      // Find and clean up VMs in error state for over 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('vms')
        .update({ status: 'terminated' })
        .eq('status', 'error')
        .lt('provision_started_at', twentyFourHoursAgo);

      break;
    }

    default: {
      console.log(`Unknown task type: ${task.type}`);
    }
  }
}

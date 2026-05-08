import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { extractVmIp } from '@/lib/orgo';

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

    // Get all VMs with status='ready'
    const { data: vms, error: vmsError } = await supabase
      .from('vms')
      .select('*')
      .eq('status', 'ready');

    if (vmsError) {
      console.error('Failed to fetch VMs:', vmsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch VMs' },
        { status: 500 }
      );
    }

    if (!vms || vms.length === 0) {
      return NextResponse.json({
        success: true,
        data: { checked: 0, healthy: 0, unhealthy: 0, message: 'No active VMs to check' },
      });
    }

    const results = {
      checked: vms.length,
      healthy: 0,
      unhealthy: 0,
      errors: [] as Array<{ vm_id: string; error: string }>,
    };

    // Ping each VM health endpoint concurrently
    const healthChecks = vms.map(async (vm) => {
      if (!vm.ip_address) {
        results.unhealthy++;
        results.errors.push({ vm_id: vm.id, error: 'No IP address' });
        return;
      }

      try {
        const response = await fetch(
          `http://${extractVmIp(vm.ip_address)}:${vm.port}/health`,
          { signal: AbortSignal.timeout(10000) }
        );

        if (response.ok) {
          results.healthy++;

          // Update last_health_check
          await supabase
            .from('vms')
            .update({ last_health_check: new Date().toISOString() })
            .eq('id', vm.id);
        } else {
          results.unhealthy++;
          results.errors.push({
            vm_id: vm.id,
            error: `Health check returned status ${response.status}`,
          });

          // If VM has been unhealthy for a while, mark it as error
          if (vm.last_health_check) {
            const lastCheck = new Date(vm.last_health_check).getTime();
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

            if (lastCheck < fiveMinutesAgo) {
              await supabase
                .from('vms')
                .update({
                  status: 'error',
                  error_message: 'VM health check failed for over 5 minutes',
                })
                .eq('id', vm.id);
            }
          }
        }
      } catch (err) {
        results.unhealthy++;
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push({ vm_id: vm.id, error: message });
      }
    });

    await Promise.all(healthChecks);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error('Health check cron error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

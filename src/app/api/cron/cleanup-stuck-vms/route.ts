import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

const ORGO_BASE = process.env.ORGO_BASE_URL || 'https://www.orgo.ai/api';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find VMs stuck > 10 min with exhausted retries (attempt_count >= 3)
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: exhaustedVms } = await supabase
    .from('vms')
    .select('*')
    .in('status', ['provisioning', 'installing'])
    .lt('provision_started_at', tenMinAgo)
    .gte('attempt_count', 3);

  // Safety net: any VMs stuck > 30 min regardless of attempt_count
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: ancientVms } = await supabase
    .from('vms')
    .select('*')
    .in('status', ['provisioning', 'installing'])
    .lt('provision_started_at', thirtyMinAgo);

  const allStuck = [...(exhaustedVms || []), ...(ancientVms || [])];
  const uniqueVms = allStuck.filter((vm, i, arr) => arr.findIndex(v => v.id === vm.id) === i);

  let cleaned = 0;
  for (const vm of uniqueVms) {
    // Delete from Orgo
    if (vm.orgo_vm_id) {
      await fetch(`${ORGO_BASE}/computers/${vm.orgo_vm_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${process.env.ORGO_API_KEY}` },
      }).catch(() => {});
    }

    // Mark as failed
    await supabase.from('vms').update({
      status: 'failed',
      error_message: 'Cleaned up by cron — VM stuck too long',
    }).eq('id', vm.id);

    cleaned++;
  }

  console.log(`[Cleanup] Cleaned ${cleaned} stuck VMs`);
  return NextResponse.json({ success: true, cleaned });
}

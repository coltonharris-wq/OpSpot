import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vm_id, secret, status } = body;

    if (!vm_id || !secret || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Look up VM by id
    const { data: vm, error: vmError } = await supabase
      .from('vms')
      .select('id, callback_secret, status')
      .eq('id', vm_id)
      .single();

    if (vmError || !vm) {
      return NextResponse.json({ error: 'VM not found' }, { status: 404 });
    }

    // Verify callback secret
    if (vm.callback_secret !== secret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
    }

    if (status === 'ready') {
      await supabase
        .from('vms')
        .update({
          status: 'ready',
          ready_at: new Date().toISOString(),
        })
        .eq('id', vm_id);

      console.log(`[InstallComplete] VM ${vm_id} marked ready via callback`);
    } else if (status === 'failed') {
      await supabase
        .from('vms')
        .update({
          status: 'failed',
          error_message: 'Install script failed on VM',
        })
        .eq('id', vm_id);

      console.log(`[InstallComplete] VM ${vm_id} install failed via callback`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Install-complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

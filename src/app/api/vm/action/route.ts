import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { clickOnVM, typeOnVM, pressKeyOnVM } from '@/lib/orgo';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Auth via Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's VM
    const { data: vm } = await supabase
      .from('vms')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ready')
      .single();

    if (!vm?.orgo_vm_id) {
      return NextResponse.json({ success: false, error: 'No VM available' }, { status: 404 });
    }

    const body = await request.json();
    const { type, x, y, text, key, double } = body;

    switch (type) {
      case 'click':
        if (typeof x !== 'number' || typeof y !== 'number') {
          return NextResponse.json({ success: false, error: 'x and y required for click' }, { status: 400 });
        }
        // Clamp coordinates to VM display bounds (1920x1080)
        const clampedX = Math.max(0, Math.min(1920, Math.round(x)));
        const clampedY = Math.max(0, Math.min(1080, Math.round(y)));
        await clickOnVM(vm.orgo_vm_id, clampedX, clampedY, !!double);
        break;

      case 'type':
        if (typeof text !== 'string' || !text) {
          return NextResponse.json({ success: false, error: 'text required for type' }, { status: 400 });
        }
        await typeOnVM(vm.orgo_vm_id, text);
        break;

      case 'key':
        if (typeof key !== 'string' || !key) {
          return NextResponse.json({ success: false, error: 'key required for key action' }, { status: 400 });
        }
        await pressKeyOnVM(vm.orgo_vm_id, key);
        break;

      default:
        return NextResponse.json({ success: false, error: 'Invalid action type. Use: click, type, key' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('VM action error:', err);
    const message = err instanceof Error ? err.message : 'Action failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

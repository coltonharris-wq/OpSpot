import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { takeScreenshot } from '@/lib/orgo';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Auth via Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ image: null, status: 'offline' as const }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ image: null, status: 'offline' as const }, { status: 401 });
    }

    // Get user's VM
    const { data: vm } = await supabase
      .from('vms')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ready')
      .single();

    if (!vm?.orgo_vm_id) {
      return NextResponse.json({
        image: null,
        status: 'offline' as const,
        current_task: null,
        last_active: null,
      });
    }

    // Take screenshot via Orgo API
    let imageUrl: string | null = null;
    try {
      const result = await takeScreenshot(vm.orgo_vm_id);
      imageUrl = result.url || null;
      // If Orgo returns base64, convert to data URL
      if (!imageUrl && result.screenshot_base64) {
        imageUrl = `data:image/png;base64,${result.screenshot_base64}`;
      }
    } catch (err) {
      console.error('Screenshot failed:', err);
      return NextResponse.json({
        image: null,
        status: 'offline' as const,
        current_task: null,
        last_active: null,
      });
    }

    // Get current task from latest usage event
    const { data: latestEvent } = await supabase
      .from('usage_events')
      .select('description, service, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Determine status: if last activity was within 2 minutes, consider "working"
    let status: 'working' | 'idle' | 'offline' = 'idle';
    if (latestEvent) {
      const lastActiveTime = new Date(latestEvent.created_at).getTime();
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      if (lastActiveTime > twoMinutesAgo) {
        status = 'working';
      }
    }

    return NextResponse.json({
      image: imageUrl,
      status,
      current_task: latestEvent?.description || null,
      last_active: latestEvent?.created_at || null,
    });
  } catch (err) {
    console.error('Screenshot route error:', err);
    return NextResponse.json({
      image: null,
      status: 'offline' as const,
      current_task: null,
      last_active: null,
    }, { status: 500 });
  }
}

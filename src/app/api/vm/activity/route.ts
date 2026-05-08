import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Auth via Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ activities: [], current_step: null, elapsed_seconds: 0 }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ activities: [], current_step: null, elapsed_seconds: 0 }, { status: 401 });
    }

    // Get recent usage events as activity proxy
    const { data: events } = await supabase
      .from('usage_events')
      .select('id, service, description, hours_used, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Map usage events to activity items
    const activities = (events || []).map((evt) => {
      // Infer action type from service/description
      let action: string = 'system';
      const desc = (evt.description || '').toLowerCase();
      if (desc.includes('search') || desc.includes('research')) action = 'search';
      else if (desc.includes('brows') || desc.includes('website') || desc.includes('url')) action = 'browse';
      else if (desc.includes('type') || desc.includes('write') || desc.includes('draft')) action = 'type';
      else if (desc.includes('click') || desc.includes('navigate')) action = 'click';
      else if (desc.includes('think') || desc.includes('analyz')) action = 'think';
      else if (desc.includes('file') || desc.includes('save') || desc.includes('create')) action = 'file_op';
      else if (evt.service === 'king_mouse_chat') action = 'think';

      return {
        id: evt.id,
        action,
        description: evt.description || evt.service,
        status: 'completed' as const,
        timestamp: evt.created_at,
      };
    });

    // Calculate elapsed time from the earliest recent event
    let elapsedSeconds = 0;
    if (events && events.length > 0) {
      const earliest = events[events.length - 1];
      const latest = events[0];
      const earliestTime = new Date(earliest.created_at).getTime();
      const latestTime = new Date(latest.created_at).getTime();
      // If last activity was within 5 minutes, measure from earliest to now
      if (Date.now() - latestTime < 5 * 60 * 1000) {
        elapsedSeconds = Math.floor((Date.now() - earliestTime) / 1000);
      }
    }

    // Derive current step from most recent activities
    let currentStep = null;
    if (activities.length > 0) {
      const latestActivity = activities[0];
      const latestTime = new Date(latestActivity.timestamp).getTime();
      if (Date.now() - latestTime < 2 * 60 * 1000) {
        // Count recent activities in this "session" (last 10 minutes)
        const sessionStart = Date.now() - 10 * 60 * 1000;
        const sessionActivities = activities.filter(
          (a) => new Date(a.timestamp).getTime() > sessionStart
        );
        currentStep = {
          name: latestActivity.description,
          number: Math.min(sessionActivities.length, 5),
          total: 5,
        };
      }
    }

    return NextResponse.json({
      activities,
      current_step: currentStep,
      elapsed_seconds: elapsedSeconds,
    });
  } catch (err) {
    console.error('Activity route error:', err);
    return NextResponse.json({ activities: [], current_step: null, elapsed_seconds: 0 }, { status: 500 });
  }
}

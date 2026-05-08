import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

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

    const body = await request.json();
    const { service, description, hours_used } = body;

    if (!service || hours_used === undefined || hours_used === null) {
      return NextResponse.json(
        { success: false, error: 'service and hours_used are required' },
        { status: 400 }
      );
    }

    if (typeof hours_used !== 'number' || hours_used <= 0) {
      return NextResponse.json(
        { success: false, error: 'hours_used must be a positive number' },
        { status: 400 }
      );
    }

    // Get current work hours
    const { data: workHours, error: hoursError } = await supabase
      .from('work_hours')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (hoursError || !workHours) {
      return NextResponse.json(
        { success: false, error: 'No work hours found. Please purchase hours first.' },
        { status: 404 }
      );
    }

    if (workHours.remaining < hours_used) {
      return NextResponse.json(
        { success: false, error: 'Insufficient work hours', data: { remaining: workHours.remaining } },
        { status: 402 }
      );
    }

    // Create usage event record
    const { error: eventError } = await supabase
      .from('usage_events')
      .insert({
        user_id: user.id,
        service,
        description: description || null,
        hours_used,
      });

    if (eventError) {
      console.error('Failed to create usage event:', eventError);
      return NextResponse.json(
        { success: false, error: 'Failed to log usage event' },
        { status: 500 }
      );
    }

    // Deduct from work_hours.remaining
    const newRemaining = workHours.remaining - hours_used;
    const newTotalUsed = workHours.total_used + hours_used;

    const { error: updateError } = await supabase
      .from('work_hours')
      .update({
        total_used: newTotalUsed,
        remaining: newRemaining,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update work hours:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update work hours' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        hours_used,
        remaining: newRemaining,
        total_used: newTotalUsed,
        total_purchased: workHours.total_purchased,
      },
    });
  } catch (err) {
    console.error('Usage logging error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

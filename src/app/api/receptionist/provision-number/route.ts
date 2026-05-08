import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

const PHONE_COST_HOURS = 5.622; // $28 / $4.98 per hour

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
    const { area_code } = body;

    // 1. Check work_hours.remaining >= 5.622
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

    if (workHours.remaining < PHONE_COST_HOURS) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient work hours. Phone number requires 5.622 hours ($28).',
          data: { remaining: workHours.remaining, required: PHONE_COST_HOURS },
        },
        { status: 402 }
      );
    }

    // Twilio credentials
    const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
    const twilioAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

    // 2. Search for available local numbers
    const searchParams = new URLSearchParams({ PageSize: '1' });
    if (area_code) {
      searchParams.set('AreaCode', area_code);
    }

    const searchResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/AvailablePhoneNumbers/US/Local.json?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${twilioAuth}`,
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Twilio search error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to search for available phone numbers' },
        { status: 502 }
      );
    }

    const searchData = await searchResponse.json();
    const availableNumbers = searchData.available_phone_numbers;

    if (!availableNumbers || availableNumbers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: area_code
            ? `No phone numbers available in area code ${area_code}. Try a different area code.`
            : 'No phone numbers available. Please try again.',
        },
        { status: 404 }
      );
    }

    const phoneNumber = availableNumbers[0].phone_number;

    // 3. Buy the first available number
    const buyBody = new URLSearchParams({
      PhoneNumber: phoneNumber,
      VoiceUrl: 'https://mouse.is/api/receptionist/webhook',
      VoiceMethod: 'POST',
    });

    const buyResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/IncomingPhoneNumbers.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${twilioAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: buyBody.toString(),
      }
    );

    if (!buyResponse.ok) {
      const errorText = await buyResponse.text();
      console.error('Twilio buy error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to purchase phone number' },
        { status: 502 }
      );
    }

    const buyData = await buyResponse.json();
    const purchasedNumber = buyData.phone_number;

    // 4. Save to receptionist_config
    const { error: configError } = await supabase
      .from('receptionist_config')
      .upsert({
        user_id: user.id,
        phone_number: purchasedNumber,
        enabled: true,
      });

    if (configError) {
      console.error('Failed to save phone number to config:', configError);
      return NextResponse.json(
        { success: false, error: 'Phone purchased but failed to save configuration' },
        { status: 500 }
      );
    }

    // 5. Deduct hours from work_hours
    const newRemaining = workHours.remaining - PHONE_COST_HOURS;
    const newTotalUsed = workHours.total_used + PHONE_COST_HOURS;

    const { error: updateError } = await supabase
      .from('work_hours')
      .update({
        total_used: newTotalUsed,
        remaining: newRemaining,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to deduct work hours:', updateError);
    }

    // 6. Log usage event
    await supabase
      .from('usage_events')
      .insert({
        user_id: user.id,
        service: 'twilio_phone_number',
        description: `Purchased phone number ${purchasedNumber}`,
        hours_used: PHONE_COST_HOURS,
      });

    // 7. Return success
    return NextResponse.json({
      success: true,
      data: { phone_number: purchasedNumber },
    });
  } catch (err) {
    console.error('Phone provisioning error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

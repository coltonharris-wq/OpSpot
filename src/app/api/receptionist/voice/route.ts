import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

const HOURS_PER_MINUTE = 0.6024;  // $3.00/min at $4.98/hr

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
    const { text, voice_id } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    // Balance pre-check before calling ElevenLabs
    const { data: workHoursCheck } = await supabase
      .from('work_hours')
      .select('remaining')
      .eq('user_id', user.id)
      .single();

    const estimatedMinutes = Math.max(text.length / 750, 0.1);
    const estimatedHours = estimatedMinutes * HOURS_PER_MINUTE;

    if (!workHoursCheck || workHoursCheck.remaining < estimatedHours) {
      return NextResponse.json(
        { success: false, error: 'Insufficient hours' },
        { status: 402 }
      );
    }

    const selectedVoiceId = voice_id || 'EXAVITQu4vr4xnSDxMaL'; // Default ElevenLabs voice

    // Call ElevenLabs API
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to generate speech' },
        { status: 502 }
      );
    }

    // Use the same estimate from pre-check for billing
    const hoursUsed = estimatedHours;

    // Log usage
    await supabase
      .from('usage_events')
      .insert({
        user_id: user.id,
        service: 'receptionist_tts',
        description: `TTS generation: ${text.slice(0, 100)}...`,
        hours_used: hoursUsed,
      });

    // Deduct work hours
    const { data: workHours } = await supabase
      .from('work_hours')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (workHours) {
      await supabase
        .from('work_hours')
        .update({
          total_used: workHours.total_used + hoursUsed,
          remaining: workHours.remaining - hoursUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    // Stream audio response
    const audioBody = elevenLabsResponse.body;
    if (!audioBody) {
      return NextResponse.json(
        { success: false, error: 'No audio data received' },
        { status: 502 }
      );
    }

    return new NextResponse(audioBody, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'X-Hours-Used': hoursUsed.toFixed(4),
      },
    });
  } catch (err) {
    console.error('Voice TTS error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get user from cookies/session
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      // Try cookie-based auth
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      }
    }

    // Get form data with audio
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Get user's VM for Whisper endpoint
    let whisperUrl: string | null = null;

    if (userId) {
      const { data: vm } = await supabase
        .from('vms')
        .select('ip_address')
        .eq('user_id', userId)
        .eq('status', 'ready')
        .single();

      if (vm?.ip_address) {
        whisperUrl = `http://${vm.ip_address}:18790`;
      }
    }

    // Convert audio to WAV format for Whisper
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    if (whisperUrl) {
      // Send to Whisper on the user's VM (FREE)
      try {
        const whisperRes = await fetch(whisperUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: audioBuffer,
          signal: AbortSignal.timeout(15000),
        });

        if (whisperRes.ok) {
          const result = await whisperRes.json();
          return NextResponse.json({
            success: true,
            text: result.text,
            source: 'whisper_local',
          });
        }
      } catch (err) {
        console.error('Local Whisper failed, falling back:', err);
      }
    }

    // Fallback: Use OpenAI Whisper API if available
    if (process.env.OPENAI_API_KEY) {
      const openaiForm = new FormData();
      openaiForm.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
      openaiForm.append('model', 'whisper-1');

      const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: openaiForm,
      });

      if (openaiRes.ok) {
        const result = await openaiRes.json();
        return NextResponse.json({
          success: true,
          text: result.text,
          source: 'openai_whisper',
        });
      }
    }

    // Fallback: Use Anthropic for audio description (last resort)
    return NextResponse.json(
      { success: false, error: 'Voice transcription unavailable. No Whisper service or OpenAI API configured.' },
      { status: 503 }
    );
  } catch (err) {
    console.error('Voice-to-text error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

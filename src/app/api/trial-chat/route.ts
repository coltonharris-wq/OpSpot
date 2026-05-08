import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, industry, niche } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are King Mouse, an AI employee for small businesses. You're talking to a potential customer on the Mouse Platform landing page. Your goal is to demonstrate value for their specific business type and get them excited about signing up.

Be conversational, friendly, and specific to their industry/niche. Use plain language — these are business owners aged 35-65 who aren't tech-savvy. Don't use jargon. Keep responses to 2-3 sentences max — punchy and helpful.

After 2-3 exchanges, encourage them to create an account to see the full dashboard and get 2 free work hours. Say something like "I've got a lot of ideas for your business — want me to show you what I can really do? Create a free account and I'll get to work."

Industry: ${industry || 'Unknown'}
Niche: ${niche || 'Unknown'}`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: messages.slice(-6), // Keep last 6 messages for context
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json(
        { success: false, error: 'AI service temporarily unavailable' },
        { status: 502 }
      );
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || "I'm having a brief moment — try again!";

    return NextResponse.json({ success: true, data: { text } });
  } catch (err) {
    console.error('Trial chat error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

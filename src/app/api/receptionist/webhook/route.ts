import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';

function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  // Build the data string by sorting params and concatenating key+value
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const computed = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Parse form data from Twilio
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Validate Twilio signature
    const twilioSignature = request.headers.get('x-twilio-signature');
    if (!twilioSignature) {
      return NextResponse.json(
        { success: false, error: 'Missing Twilio signature' },
        { status: 403 }
      );
    }

    const requestUrl = request.url;
    const isValid = validateTwilioSignature(
      requestUrl,
      params,
      twilioSignature,
      process.env.TWILIO_AUTH_TOKEN!
    );

    if (!isValid) {
      console.error('Invalid Twilio signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 403 }
      );
    }

    const calledNumber = params['To'] || params['Called'];
    const callerNumber = params['From'] || params['Caller'];
    const callSid = params['CallSid'];

    // Look up user by called phone number
    const { data: receptionistConfig, error: configError } = await supabase
      .from('receptionist_config')
      .select('*, profiles!inner(id, full_name, company_name, industry, niche)')
      .eq('phone_number', calledNumber)
      .eq('enabled', true)
      .single();

    if (configError || !receptionistConfig) {
      // Return basic TwiML for unregistered numbers
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We're sorry, this number is not currently configured. Please try again later.</Say>
  <Hangup/>
</Response>`;

      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    const userId = receptionistConfig.user_id;
    const greeting = receptionistConfig.greeting || 'Thank you for calling. How can I help you today?';
    const voiceId = receptionistConfig.voice_id;

    // Log the call
    await supabase
      .from('call_log')
      .insert({
        user_id: userId,
        caller_phone: callerNumber,
        twilio_call_sid: callSid,
        result: 'in_progress',
      });

    // Build TwiML response with media stream for real-time audio
    const wsUrl = `wss://${request.nextUrl.host}/api/receptionist/stream`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(greeting)}</Say>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="user_id" value="${userId}" />
      <Parameter name="voice_id" value="${voiceId || 'default'}" />
      <Parameter name="call_sid" value="${callSid}" />
      <Parameter name="caller" value="${callerNumber || 'unknown'}" />
    </Stream>
  </Connect>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (err) {
    console.error('Receptionist webhook error:', err);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

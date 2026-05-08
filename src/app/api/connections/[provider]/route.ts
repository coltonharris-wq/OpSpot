import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { encryptCredentials } from '@/lib/connection-credentials';

const SUPPORTED_PROVIDERS = [
  'gmail',
  'google_calendar',
  'outlook',
  'yahoo-mail',
  'quickbooks',
  'freshbooks',
  'xero',
  'wave',
  'hubspot',
  'salesforce',
  'zoho-crm',
  'facebook',
  'instagram',
  'google-my-business',
  'yelp',
  'tiktok',
  'slack',
  'microsoft-teams',
  'twilio',
  'google-drive',
  'dropbox',
  'onedrive',
  'jobber',
  'servicetitan',
  'housecall_pro',
  'google-calendar',
  'housecall-pro',
  // Legacy aliases used in specs or older rows.
  'google_drive',
  'google_business',
  'teams',
  'zoho',
];

const GOOGLE_SCOPES: Record<string, string> = {
  gmail: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
  google_calendar: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
  'google-calendar': 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
};

function isGoogleProvider(provider: string): boolean {
  return provider === 'gmail' || provider === 'google_calendar' || provider === 'google-calendar';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const supabase = createServiceClient();

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { success: false, error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

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

    const action = request.nextUrl.searchParams.get('action');

    if (action === 'authorize') {
      // Build OAuth URL and redirect
      if (!isGoogleProvider(provider)) {
        return NextResponse.json(
          { success: false, error: `OAuth not supported for ${provider}. Use POST with credentials.` },
          { status: 400 }
        );
      }

      const state = Buffer.from(
        JSON.stringify({ user_id: user.id, provider })
      ).toString('base64');

      const baseUrl = request.nextUrl.origin;

      const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      oauthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
      oauthUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/callback`);
      oauthUrl.searchParams.set('response_type', 'code');
      oauthUrl.searchParams.set('scope', GOOGLE_SCOPES[provider]);
      oauthUrl.searchParams.set('state', state);
      oauthUrl.searchParams.set('access_type', 'offline');
      oauthUrl.searchParams.set('prompt', 'consent');

      if (request.headers.get('x-requested-with') === 'fetch') {
        return NextResponse.json({
          success: true,
          data: { authorize_url: oauthUrl.toString() },
        });
      }

      return NextResponse.redirect(oauthUrl.toString());
    }

    if (action === 'disconnect') {
      // Remove connection
      const { error: deleteError } = await supabase
        .from('connections')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (deleteError) {
        console.error('Failed to disconnect:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to disconnect' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { message: `${provider} disconnected successfully` },
      });
    }

    // Default: get connection status
    const { data: connection } = await supabase
      .from('connections')
      .select('id, provider, status, account_email, connected_at, last_sync')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        connected: !!connection,
        connection: connection || null,
      },
    });
  } catch (err) {
    console.error('Connection route error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const supabase = createServiceClient();

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { success: false, error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    // Google providers use OAuth, not credentials
    if (isGoogleProvider(provider)) {
      return NextResponse.json(
        { success: false, error: `Use GET with action=authorize for ${provider}` },
        { status: 400 }
      );
    }

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
    const { credentials, account_email } = body;

    if (!credentials) {
      return NextResponse.json(
        { success: false, error: 'Credentials are required' },
        { status: 400 }
      );
    }

    // Encrypt credentials before storing
    const encryptedCredentials = encryptCredentials(credentials);

    // Store encrypted credentials
    const { error: upsertError } = await supabase
      .from('connections')
      .upsert(
        {
          user_id: user.id,
          provider,
          status: 'connected',
          account_email: account_email || null,
          encrypted_credentials: encryptedCredentials,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      );

    if (upsertError) {
      console.error('Failed to store credentials:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: `${provider} connected successfully` },
    });
  } catch (err) {
    console.error('Connection POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

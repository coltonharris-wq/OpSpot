import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const baseUrl = request.nextUrl.origin;

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/connections?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/connections?error=${encodeURIComponent('Missing authorization code or state')}`
      );
    }

    // Decode state to get user_id and provider
    let stateData: { user_id: string; provider: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        `${baseUrl}/connections?error=${encodeURIComponent('Invalid state parameter')}`
      );
    }

    const { user_id, provider } = stateData;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${baseUrl}/connections?error=${encodeURIComponent('Failed to exchange authorization code')}`
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let accountEmail: string | null = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      accountEmail = userInfo.email;
    }

    // Store tokens in connections table
    const supabase = createServiceClient();

    const { error: upsertError } = await supabase
      .from('connections')
      .upsert(
        {
          user_id,
          provider,
          status: 'connected',
          account_email: accountEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null,
          scopes: tokens.scope || null,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      );

    if (upsertError) {
      console.error('Failed to store connection:', upsertError);
      return NextResponse.redirect(
        `${baseUrl}/connections?error=${encodeURIComponent('Failed to save connection')}`
      );
    }

    return NextResponse.redirect(
      `${baseUrl}/connections?success=${encodeURIComponent(`${provider} connected successfully`)}`
    );
  } catch (err) {
    console.error('Auth callback error:', err);
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(
      `${baseUrl}/connections?error=${encodeURIComponent('An unexpected error occurred')}`
    );
  }
}

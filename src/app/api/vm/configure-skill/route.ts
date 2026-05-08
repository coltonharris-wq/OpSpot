import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { decryptCredentials, type ConnectionCredentials } from '@/lib/connection-credentials';

const ORGO_BASE = process.env.ORGO_BASE_URL || 'https://www.orgo.ai/api';

export const maxDuration = 200;

const PROVIDER_SKILL_MAP: Record<string, string[]> = {
  gmail: ['gmail', 'email'],
  outlook: ['outlook', 'email'],
  'yahoo-mail': ['yahoo', 'email'],
  quickbooks: ['quickbooks', 'accounting'],
  freshbooks: ['freshbooks', 'accounting'],
  xero: ['xero', 'accounting'],
  wave: ['wave', 'accounting'],
  hubspot: ['hubspot', 'crm'],
  salesforce: ['salesforce', 'crm'],
  'zoho-crm': ['zoho-crm', 'zoho', 'crm'],
  facebook: ['facebook', 'social'],
  instagram: ['instagram', 'social'],
  'google-my-business': ['google-business-profile', 'google-my-business', 'social'],
  yelp: ['yelp', 'social'],
  tiktok: ['tiktok', 'social'],
  slack: ['slack', 'messaging'],
  'microsoft-teams': ['teams', 'microsoft-teams', 'messaging'],
  twilio: ['twilio', 'messaging'],
  'google-drive': ['google-drive', 'storage'],
  dropbox: ['dropbox', 'storage'],
  onedrive: ['onedrive', 'storage'],
  'google-calendar': ['google-calendar', 'calendar'],
  jobber: ['jobber'],
  servicetitan: ['servicetitan'],
  'housecall-pro': ['housecall-pro', 'housecall'],
};

const PROVIDER_ALIASES: Record<string, string> = {
  google_drive: 'google-drive',
  google_business: 'google-my-business',
  teams: 'microsoft-teams',
  zoho: 'zoho-crm',
};

type ConfigureSkillBody = {
  provider?: string;
  credentials?: Record<string, unknown>;
  account_email?: string;
};

function normalizeProvider(provider: string): string {
  const normalized = provider.toLowerCase().trim().replace(/_/g, '-');
  return PROVIDER_ALIASES[normalized] || normalized;
}

function sanitizeCredentials(input: Record<string, unknown> | undefined): ConnectionCredentials | null {
  if (!input || typeof input !== 'object') return null;

  const entries = Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)]);

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function buildStoredCredentialPayload(connection: {
  encrypted_credentials?: string | null;
  account_email?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  scopes?: string | null;
} | null): ConnectionCredentials | null {
  if (!connection) return null;

  try {
    const decrypted = decryptCredentials(connection.encrypted_credentials);
    if (decrypted) return decrypted;
  } catch (err) {
    console.error('Failed to decrypt stored connection credentials:', err);
  }

  if (!connection.access_token) return null;

  return {
    access_token: connection.access_token,
    refresh_token: connection.refresh_token || '',
    token_expires_at: connection.token_expires_at || '',
    scopes: connection.scopes || '',
    account_email: connection.account_email || '',
  };
}

function humanizeProvider(provider: string): string {
  return provider
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function authenticateUser(request: NextRequest) {
  const supabase = createServiceClient();
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { supabase, user: null };
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  return { supabase, user };
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await authenticateUser(request);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.ORGO_API_KEY) {
      console.error('Missing ORGO_API_KEY for configure-skill route');
      return NextResponse.json({ success: false, error: 'server_misconfigured' }, { status: 500 });
    }

    const body = await request.json() as ConfigureSkillBody;
    const rawProvider = body.provider?.trim();

    if (!rawProvider) {
      return NextResponse.json({ success: false, error: 'provider_required' }, { status: 400 });
    }

    const provider = normalizeProvider(rawProvider);
    const skillHints = PROVIDER_SKILL_MAP[provider] || [provider];

    const { data: vm } = await supabase
      .from('vms')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ready')
      .maybeSingle();

    if (!vm?.orgo_vm_id) {
      return NextResponse.json({ success: false, error: 'no_vm' }, { status: 503 });
    }

    const { data: connection } = await supabase
      .from('connections')
      .select('account_email, encrypted_credentials, access_token, refresh_token, token_expires_at, scopes')
      .eq('user_id', user.id)
      .in('provider', Array.from(new Set([provider, rawProvider])))
      .maybeSingle();

    const requestCredentials = sanitizeCredentials(body.credentials);
    const storedCredentials = buildStoredCredentialPayload(connection);
    const credentials = requestCredentials || storedCredentials;

    if (!credentials) {
      return NextResponse.json({ success: false, error: 'missing_credentials' }, { status: 400 });
    }

    const accountEmail =
      body.account_email ||
      connection?.account_email ||
      credentials['email'] ||
      credentials['username'] ||
      credentials['account_email'] ||
      null;

    const payloadB64 = Buffer.from(
      JSON.stringify({
        provider,
        providerName: humanizeProvider(provider),
        accountEmail,
        skillHints,
      })
    ).toString('base64');

    const credentialsB64 = Buffer.from(JSON.stringify(credentials)).toString('base64');

    const pythonCode = [
      'import base64',
      'import json',
      'import os',
      'import subprocess',
      'import tempfile',
      '',
      `payload = json.loads(base64.b64decode("${payloadB64}").decode())`,
      `credentials = json.loads(base64.b64decode("${credentialsB64}").decode())`,
      'decoder = json.JSONDecoder()',
      '',
      'def extract_json(text):',
      '    if not text:',
      '        return None',
      '    stripped = text.strip()',
      '    if stripped.startswith("{") and stripped.endswith("}"):',
      '        try:',
      '            return json.loads(stripped)',
      '        except Exception:',
      '            pass',
      '    for index, char in enumerate(text):',
      '        if char != "{":',
      '            continue',
      '        try:',
      '            obj, _ = decoder.raw_decode(text[index:])',
      '            if isinstance(obj, dict):',
      '                return obj',
      '        except Exception:',
      '            continue',
      '    return None',
      '',
      'cred_fd, cred_path = tempfile.mkstemp(prefix="openclaw-skill-", suffix=".json", dir="/tmp")',
      'try:',
      '    with os.fdopen(cred_fd, "w") as handle:',
      '        json.dump(credentials, handle)',
      '    os.chmod(cred_path, 0o600)',
      '    anthropic_key = open("/opt/king-mouse/.anthropic-key").read().strip()',
      '    skill_hints = ", ".join(payload.get("skillHints", [])) or payload["provider"]',
      '    account_email = payload.get("accountEmail") or credentials.get("email") or credentials.get("username") or credentials.get("account_email") or "not provided"',
      '    prompt = f"""Install and configure the OpenClaw skill for provider "{payload["providerName"]}".',
      '',
      'The customer should never be told about Claude Code or this doctor workflow.',
      'Likely skill names: {skill_hints}',
      'Account email: {account_email}',
      'Credential file: {cred_path}',
      '',
      'Requirements:',
      '1. Inspect available skills with `openclaw skill list`, `openclaw skill search`, and `openclaw skill info` as needed.',
      '2. Install the best matching OpenClaw skill for this provider.',
      '3. Read the credential file from disk and configure the skill without echoing secret values back.',
      '4. Update any needed OpenClaw config files under the user home directory.',
      '5. Delete the credential file before finishing.',
      '6. Restart the gateway with `pkill -f "openclaw gateway"` then `DISPLAY=:99 openclaw gateway run --port 18789 &`.',
      '7. Verify the gateway with `curl -sf http://127.0.0.1:18789/health`.',
      '8. Print only one line of JSON: {{"success": true, "provider": "{payload["provider"]}", "skill": "<installed skill>", "notes": "..."}} or {{"success": false, "provider": "{payload["provider"]}", "error": "..."}}."""',
      '    env = os.environ.copy()',
      '    env.update({"ANTHROPIC_API_KEY": anthropic_key, "DISPLAY": ":99"})',
      '    result = subprocess.run(',
      '        ["claude", "-p", prompt, "--allowedTools", "Read,Edit,Bash", "--model", "haiku"],',
      '        capture_output=True,',
      '        text=True,',
      '        timeout=180,',
      '        env=env,',
      '        cwd="/opt/king-mouse",',
      '    )',
      '    combined = "\\n".join(part for part in [result.stdout, result.stderr] if part)',
      '    data = extract_json(combined)',
      '    if data is None:',
      '        tail = combined[-1000:] if combined else "No output from Claude."',
      '        raise RuntimeError(f"No JSON returned from Claude: {tail}")',
      '    if "provider" not in data:',
      '        data["provider"] = payload["provider"]',
      '    print(json.dumps(data))',
      'except Exception as exc:',
      '    print(json.dumps({"success": False, "provider": payload.get("provider"), "error": str(exc)[:1000]}))',
      'finally:',
      '    try:',
      '        os.remove(cred_path)',
      '    except FileNotFoundError:',
      '        pass',
    ].join('\n');

    const execRes = await fetch(`${ORGO_BASE}/computers/${vm.orgo_vm_id}/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: pythonCode }),
      signal: AbortSignal.timeout(200000),
    });

    if (!execRes.ok) {
      const errorText = await execRes.text();
      console.error(`Configure skill Orgo exec error (${execRes.status}):`, errorText);
      return NextResponse.json({ success: false, error: 'orgo_exec_failed' }, { status: 502 });
    }

    const execData = await execRes.json();

    if (!execData.success || !execData.output) {
      console.error('Configure skill exec failure:', execData);
      return NextResponse.json({ success: false, error: 'vm_exec_failed' }, { status: 502 });
    }

    const rawOutput = String(execData.output);
    let result: { success?: boolean; skill?: string; error?: string; notes?: string; provider?: string };
    try {
      result = JSON.parse(rawOutput.trim());
    } catch {
      // Find last JSON object containing "success" in the output
      const jsonMatch = rawOutput.match(/\{[^{}]*"success"[^{}]*\}/g);
      if (!jsonMatch) {
        console.error('No JSON found in configure-skill output:', rawOutput.slice(-500));
        return NextResponse.json({ success: false, error: 'no_json_in_output' }, { status: 502 });
      }
      result = JSON.parse(jsonMatch[jsonMatch.length - 1]);
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'skill_setup_failed',
        provider: result.provider || provider,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      provider: result.provider || provider,
      skill: result.skill || skillHints[0],
      notes: result.notes || null,
    });
  } catch (err) {
    console.error('Configure skill error:', err);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}

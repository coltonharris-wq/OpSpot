import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export const maxDuration = 60;

const ORGO_BASE = process.env.ORGO_BASE_URL || 'https://www.orgo.ai/api';

async function execOnVM(orgoVmId: string, pythonCode: string, timeoutMs = 10000): Promise<{ success: boolean; output: string }> {
  try {
    const res = await fetch(`${ORGO_BASE}/computers/${orgoVmId}/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: pythonCode }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      return { success: false, output: `HTTP ${res.status}: ${await res.text().catch(() => '')}` };
    }
    const data = await res.json();
    return { success: data.success ?? false, output: data.output ?? '' };
  } catch (err) {
    return { success: false, output: `Exec error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const vmId = request.nextUrl.searchParams.get('vm_id');
    if (!vmId) {
      return NextResponse.json({ error: 'vm_id required' }, { status: 400 });
    }

    const { data: vm, error: vmError } = await supabase
      .from('vms')
      .select('*')
      .eq('id', vmId)
      .eq('user_id', user.id)
      .single();

    if (vmError || !vm) {
      return NextResponse.json({ error: 'VM not found' }, { status: 404 });
    }

    if (!vm.orgo_vm_id) {
      return NextResponse.json({ error: 'VM has no Orgo ID', vm_status: vm.status }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configJson = (vm.config_json || {}) as Record<string, any>;
    const apiKeyInConfig = !!configJson.moonshot_api_key;
    const apiKeyLength = (configJson.moonshot_api_key || '').length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const steps: Array<{ name: string; success: boolean; output: string; duration_ms: number }> = [];

    // Step 1: Basic exec test
    let t = Date.now();
    const step1 = await execOnVM(vm.orgo_vm_id, 'print("exec_ok")');
    steps.push({ name: 'exec_test', ...step1, duration_ms: Date.now() - t });

    // Step 2: Gateway health
    t = Date.now();
    const step2 = await execOnVM(vm.orgo_vm_id, [
      'import subprocess',
      'r=subprocess.run(["curl","-sf","http://127.0.0.1:18789/health"],capture_output=True,text=True,timeout=5)',
      'print(f"rc={r.returncode} out={r.stdout.strip()} err={r.stderr.strip()}")',
    ].join('\n'));
    steps.push({ name: 'gateway_health', ...step2, duration_ms: Date.now() - t });

    // Step 3: Gateway config
    t = Date.now();
    const step3 = await execOnVM(vm.orgo_vm_id, [
      'import json,os',
      'p=os.path.expanduser("~/.openclaw/openclaw.json")',
      'if not os.path.exists(p): print("CONFIG_MISSING")',
      'else:',
      '  c=json.load(open(p))',
      '  # Redact auth token to just show length',
      '  tok=c.get("gateway",{}).get("auth",{}).get("token","")',
      '  if tok: c["gateway"]["auth"]["token"]=f"[{len(tok)} chars]"',
      '  # Redact env keys',
      '  for k in list(c.get("env",{}).keys()):',
      '    v=c["env"][k]',
      '    c["env"][k]=f"[{len(v)} chars]" if v else "EMPTY"',
      '  print(json.dumps(c,indent=2))',
    ].join('\n'));
    steps.push({ name: 'gateway_config', ...step3, duration_ms: Date.now() - t });

    // Step 4: API key check
    t = Date.now();
    const step4 = await execOnVM(vm.orgo_vm_id, [
      'import os',
      'try:',
      '  k=open("/opt/king-mouse/.moonshot-key").read().strip()',
      '  print(f"key_length={len(k)} first4={k[:4]}... last4=...{k[-4:]}" if len(k)>8 else f"key_length={len(k)}")',
      'except FileNotFoundError:',
      '  print("FILE_NOT_FOUND: /opt/king-mouse/.moonshot-key")',
      'except Exception as e:',
      '  print(f"ERROR: {e}")',
    ].join('\n'));
    steps.push({ name: 'api_key_check', ...step4, duration_ms: Date.now() - t });

    // Step 5: chatCompletions test
    t = Date.now();
    const step5 = await execOnVM(vm.orgo_vm_id, [
      'import json,os',
      'try:',
      '  import urllib.request,urllib.error',
      '  # Read gateway auth token',
      '  gw_token=""',
      '  try:',
      '    cfg=json.load(open(os.path.expanduser("~/.openclaw/openclaw.json")))',
      '    gw_token=cfg.get("gateway",{}).get("auth",{}).get("token","")',
      '  except: pass',
      '  body=json.dumps({"model":"openclaw:main","messages":[{"role":"user","content":"Say hi in 3 words"}]}).encode()',
      '  headers={"Content-Type":"application/json"}',
      '  if gw_token: headers["Authorization"]=f"Bearer {gw_token}"',
      '  req=urllib.request.Request("http://127.0.0.1:18789/v1/chat/completions",data=body,headers=headers)',
      '  resp=urllib.request.urlopen(req,timeout=30)',
      '  data=json.loads(resp.read())',
      '  text=data.get("choices",[{}])[0].get("message",{}).get("content","NO_CONTENT")',
      '  print(f"SUCCESS: {text}")',
      'except urllib.error.HTTPError as e:',
      '  body=e.read().decode()[:500]',
      '  print(f"HTTP_{e.code}: {e.reason} — {body}")',
      'except Exception as e:',
      '  print(f"ERROR: {type(e).__name__}: {e}")',
    ].join('\n'), 35000);
    steps.push({ name: 'chat_test', ...step5, duration_ms: Date.now() - t });

    // Step 6: Alternative model names (only if step 5 failed)
    if (!step5.success || !step5.output.startsWith('SUCCESS')) {
      t = Date.now();
      const step6 = await execOnVM(vm.orgo_vm_id, [
        'import json,os,urllib.request,urllib.error',
        'gw_token=""',
        'try:',
        '  cfg=json.load(open(os.path.expanduser("~/.openclaw/openclaw.json")))',
        '  gw_token=cfg.get("gateway",{}).get("auth",{}).get("token","")',
        'except: pass',
        'results=[]',
        'for model in ["main","default","openclaw:main","kimi-k2-0520",None]:',
        '  try:',
        '    msg={"messages":[{"role":"user","content":"hi"}]}',
        '    if model: msg["model"]=model',
        '    body=json.dumps(msg).encode()',
        '    headers={"Content-Type":"application/json"}',
        '    if gw_token: headers["Authorization"]=f"Bearer {gw_token}"',
        '    req=urllib.request.Request("http://127.0.0.1:18789/v1/chat/completions",data=body,headers=headers)',
        '    resp=urllib.request.urlopen(req,timeout=15)',
        '    results.append(f"{model}: OK")',
        '  except urllib.error.HTTPError as e:',
        '    results.append(f"{model}: HTTP_{e.code}")',
        '  except Exception as e:',
        '    results.append(f"{model}: {type(e).__name__}")',
        'print(" | ".join(results))',
      ].join('\n'), 25000);
      steps.push({ name: 'alt_models', ...step6, duration_ms: Date.now() - t });
    }

    // Step 7: Process check
    t = Date.now();
    const step7 = await execOnVM(vm.orgo_vm_id, [
      'import subprocess',
      'r=subprocess.run(["ps","aux"],capture_output=True,text=True)',
      'lines=[l for l in r.stdout.split("\\n") if "openclaw" in l.lower() or "king-mouse" in l.lower() or "gateway" in l.lower()]',
      'print("\\n".join(lines) if lines else "NO_MATCHING_PROCESSES")',
    ].join('\n'));
    steps.push({ name: 'processes', ...step7, duration_ms: Date.now() - t });

    // Generate diagnosis
    let diagnosis = 'Unknown issue';
    const execOk = steps.find(s => s.name === 'exec_test')?.success;
    const healthOut = steps.find(s => s.name === 'gateway_health')?.output || '';
    const chatOut = steps.find(s => s.name === 'chat_test')?.output || '';
    const keyOut = steps.find(s => s.name === 'api_key_check')?.output || '';
    const configOut = steps.find(s => s.name === 'gateway_config')?.output || '';

    if (!execOk) {
      diagnosis = 'Orgo exec API is not working — VM may be down or Orgo API issues';
    } else if (healthOut.includes('rc=1') || healthOut.includes('rc=7')) {
      diagnosis = 'Gateway is not running. Self-heal should restart it on next chat attempt.';
    } else if (configOut.includes('CONFIG_MISSING')) {
      diagnosis = 'OpenClaw config file is missing. Run openclaw onboard or write config manually.';
    } else if (keyOut.includes('FILE_NOT_FOUND')) {
      diagnosis = 'Moonshot API key file not found on VM. install.sh may not have written it.';
    } else if (keyOut.includes('key_length=0')) {
      diagnosis = 'Moonshot API key on VM is empty. Check MOONSHOT_API_KEY env var in Vercel.';
    } else if (chatOut.startsWith('SUCCESS')) {
      diagnosis = 'Chat is actually working! The issue may have been transient or the deploy fixed it.';
    } else if (chatOut.includes('HTTP_401')) {
      diagnosis = 'Gateway returns 401 Unauthorized — auth token mismatch or API key invalid.';
    } else if (chatOut.includes('HTTP_403')) {
      diagnosis = 'Gateway returns 403 Forbidden — chatCompletions endpoint may not be enabled.';
    } else if (chatOut.includes('HTTP_404')) {
      diagnosis = 'Gateway returns 404 — chatCompletions endpoint not found. May need to enable it in config.';
    } else if (chatOut.includes('HTTP_500') || chatOut.includes('HTTP_502')) {
      diagnosis = 'Gateway internal error — likely Moonshot API failure (bad key, rate limit, or service down).';
    } else if (chatOut.includes('ConnectionRefused') || chatOut.includes('URLError')) {
      diagnosis = 'Cannot connect to gateway — it may have crashed. Check processes step.';
    } else if (chatOut.includes('TimeoutError') || chatOut.includes('timeout')) {
      diagnosis = 'Gateway timed out processing request — Moonshot API may be slow or unreachable.';
    }

    return NextResponse.json({
      vm_id: vm.id,
      orgo_vm_id: vm.orgo_vm_id,
      vm_status: vm.status,
      api_key_in_config: apiKeyInConfig,
      api_key_length: apiKeyLength,
      steps,
      diagnosis,
    });
  } catch (err) {
    console.error('Diagnose error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

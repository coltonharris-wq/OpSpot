import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

const ORGO_BASE = process.env.ORGO_BASE_URL || 'https://www.orgo.ai/api';

// Token-based pricing
const INPUT_COST_PER_MILLION = 6.00;   // $6.00 per 1M input tokens
const OUTPUT_COST_PER_MILLION = 30.00; // $30.00 per 1M output tokens
const DOLLARS_PER_HOUR = 4.98;         // 1 work hour = $4.98
const CHARS_PER_TOKEN = 4;             // estimation fallback when provider returns 0

// Allow up to 300s for agent CLI responses (complex tasks use tools)
export const maxDuration = 300;

async function authenticateUser(request: NextRequest) {
  const supabase = createServiceClient();
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { supabase, user: null };
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  return { supabase, user };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch completed tasks from usage_events
    const { data: usageEvents } = await supabase
      .from('usage_events')
      .select('*')
      .eq('user_id', user.id)
      .in('service', ['king_mouse_task', 'king_mouse_chat'])
      .order('created_at', { ascending: false });

    // Fetch scheduled tasks
    const { data: scheduledTasks } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('run_at', { ascending: false });

    // Merge both arrays with source markers
    const completedItems = (usageEvents || []).map((event) => ({
      id: event.id,
      title: event.service === 'king_mouse_task' ? 'Task' : 'Chat',
      description: event.description,
      status: 'completed',
      type: event.service || 'auto',
      hours_used: event.hours_used || 0,
      created_at: event.created_at,
      source: 'completed' as const,
    }));

    const scheduledItems = (scheduledTasks || []).map((task) => ({
      id: task.id,
      title: task.payload?.title || task.type || 'Scheduled Task',
      description: task.payload?.description || null,
      status: task.status || 'scheduled',
      type: task.type || 'scheduled',
      hours_used: 0,
      created_at: task.created_at,
      run_at: task.run_at,
      source: 'scheduled' as const,
    }));

    const tasks = [...completedItems, ...scheduledItems];

    return NextResponse.json({ success: true, data: { tasks } });
  } catch (err) {
    console.error('Tasks GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { title, description, schedule_at } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // --- Scheduled task ---
    if (schedule_at) {
      const { data: scheduled, error: scheduleError } = await supabase
        .from('scheduled_tasks')
        .insert({
          user_id: user.id,
          type: 'king_mouse_task',
          status: 'pending',
          run_at: schedule_at,
          payload: { title, description: description || '' },
        })
        .select()
        .single();

      if (scheduleError) {
        console.error('Failed to schedule task:', scheduleError);
        return NextResponse.json(
          { success: false, error: 'Failed to schedule task' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { task_id: scheduled.id, status: 'scheduled' },
      });
    }

    // --- Immediate execution ---

    // Check user's remaining work hours
    const { data: workHours } = await supabase
      .from('work_hours')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!workHours || workHours.remaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient work hours. Please purchase more hours.' },
        { status: 402 }
      );
    }

    // Get user's VM (must be ready)
    // NOTE: Do NOT promote pending VMs here — the install-complete callback
    // (POST /api/vm/install-complete) is the ONLY path to 'ready'.
    const vm: Record<string, unknown> | null = (await supabase
      .from('vms')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ready')
      .single()).data;

    if (!vm) {
      const { data: pendingVm } = await supabase
        .from('vms')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['provisioning', 'installing'])
        .single();

      if (pendingVm) {
        return NextResponse.json({
          success: false,
          error: 'vm_provisioning',
          message: 'Your AI employee is almost ready -- still setting up. Check back in a moment.',
        }, { status: 503 });
      }
    }

    if (!vm?.orgo_vm_id) {
      return NextResponse.json({
        success: false,
        error: 'no_vm',
        message: 'Your AI employee is still being set up. If this persists, please call (910) 515-8927 for immediate human support.',
      }, { status: 503 });
    }

    // Execute task on VM via Orgo exec API
    let result: string;
    let hoursUsed = 0;

    try {
      const taskPrompt = `Task: ${title}. ${description || ''}`.trim();
      const msgB64 = Buffer.from(taskPrompt).toString('base64');

      // Pass Moonshot API key from Supabase config for self-healing
      const vmApiKey = ((vm as Record<string, unknown>).config_json as Record<string, unknown>)?.moonshot_api_key as string || '';
      const keyB64 = Buffer.from(vmApiKey).toString('base64');
      const pythonCode = [
        'import subprocess,json,base64,os,time',
        '',
        '# Get API key from Supabase config (passed in) or local file',
        `_pk=base64.b64decode("${keyB64}").decode()`,
        'try:',
        '  _fk=open("/opt/king-mouse/.moonshot-key").read().strip()',
        '  api_key=_fk if _fk else _pk',
        'except:',
        '  api_key=_pk',
        'os.environ["MOONSHOT_API_KEY"]=api_key',
        '',
        '# Self-heal: if gateway is down, set up and start it',
        'cfg_path=os.path.expanduser("~/.openclaw/openclaw.json")',
        'try:',
        '  import urllib.request as _ur',
        '  _ur.urlopen("http://127.0.0.1:18789/health",timeout=3)',
        'except:',
        '  os.makedirs("/opt/king-mouse",exist_ok=True)',
        '  open("/opt/king-mouse/.moonshot-key","w").write(api_key)',
        '  os.makedirs(os.path.dirname(cfg_path),exist_ok=True)',
        '  if not os.path.exists(cfg_path) or os.path.getsize(cfg_path)<10:',
        '    json.dump({"gateway":{"port":18789,"bind":"lan","http":{"endpoints":{"chatCompletions":{"enabled":True}}}},"agents":{"defaults":{"timeoutSeconds":60}},"env":{"MOONSHOT_API_KEY":api_key}},open(cfg_path,"w"),indent=2)',
        '  subprocess.run(["openclaw","onboard","--non-interactive","--mode","local","--auth-choice","moonshot-api-key","--moonshot-api-key",api_key,"--gateway-port","18789","--gateway-bind","lan","--accept-risk"],capture_output=True,text=True,timeout=120)',
        '  try:',
        '    _c=json.load(open(cfg_path))',
        '    _c.setdefault("gateway",{}).setdefault("http",{}).setdefault("endpoints",{})["chatCompletions"]={"enabled":True}',
        '    _c.setdefault("agents",{}).setdefault("defaults",{})["timeoutSeconds"]=60',
        '    json.dump(_c,open(cfg_path,"w"),indent=2)',
        '  except: pass',
        '  _env=dict(os.environ)',
        '  _env["DISPLAY"]=":99"',
        '  subprocess.Popen(["openclaw","gateway","run","--port","18789"],stdout=open("/tmp/king-mouse.log","a"),stderr=subprocess.STDOUT,env=_env)',
        '  time.sleep(6)',
        '',
        '# Read config for gateway auth token',
        'gw_token=""',
        'try:',
        '  cfg=json.load(open(cfg_path))',
        '  gw_token=cfg.get("gateway",{}).get("auth",{}).get("token","")',
        '  eps=cfg.setdefault("gateway",{}).setdefault("http",{}).setdefault("endpoints",{})',
        '  if not eps.get("chatCompletions",{}).get("enabled"):',
        '    eps["chatCompletions"]={"enabled":True}',
        '    cfg.setdefault("agents",{}).setdefault("defaults",{})["timeoutSeconds"]=60',
        '    json.dump(cfg,open(cfg_path,"w"),indent=2)',
        '    time.sleep(3)',
        'except: pass',
        '',
        `msg=base64.b64decode("${msgB64}").decode()`,
        'ok=False',
        'http_err=""',
        '',
        '# Primary: HTTP API with rate-limit retry (stateless — no session accumulation)',
        'try:',
        '  import urllib.request,urllib.error',
        '  body=json.dumps({"model":"openclaw:main","messages":[{"role":"user","content":msg}]}).encode()',
        '  headers={"Content-Type":"application/json"}',
        '  if gw_token: headers["Authorization"]=f"Bearer {gw_token}"',
        '  for _retry in range(5):',
        '    try:',
        '      req=urllib.request.Request("http://127.0.0.1:18789/v1/chat/completions",data=body,headers=headers)',
        '      resp=urllib.request.urlopen(req,timeout=240)',
        '      data=json.loads(resp.read())',
        '      text=data["choices"][0]["message"]["content"]',
        '      usage=data.get("usage",{})',
        '      print(json.dumps({"response":text,"input_tokens":usage.get("prompt_tokens",0),"output_tokens":usage.get("completion_tokens",0),"system_prompt_chars":0,"response_chars":len(text),"via":"http","retries":_retry}))',
        '      ok=True',
        '      break',
        '    except urllib.error.HTTPError as e:',
        '      if e.code==429 and _retry<4:',
        '        time.sleep(3*(2**_retry))',
        '        continue',
        '      raise',
        'except Exception as e:',
        '  http_err=str(e)[:200]',
        '',
        '# Fallback: CLI with FRESH session and rate-limit retry',
        'if not ok:',
        '  subprocess.run("rm -rf $HOME/.openclaw/agents/main/sessions $HOME/.openclaw/sessions",shell=True,capture_output=True)',
        '  for attempt in range(5):',
        '    r=subprocess.run(["openclaw","agent","--agent","main","-m",msg,"--json","--timeout","240"],capture_output=True,text=True,timeout=250)',
        '    if r.returncode==0:',
        '      try:',
        '        data=json.loads(r.stdout)',
        '        payloads=data.get("result",{}).get("payloads",[])',
        '        text=payloads[0]["text"] if payloads else r.stdout.strip()',
        '        usage=data.get("result",{}).get("meta",{}).get("agentMeta",{}).get("usage",{})',
        '        print(json.dumps({"response":text,"input_tokens":usage.get("input",0),"output_tokens":usage.get("output",0),"system_prompt_chars":0,"response_chars":len(str(text)),"via":"cli","retries":attempt,"http_error":http_err}))',
        '      except:',
        '        text=r.stdout.strip()',
        '        print(json.dumps({"response":text,"input_tokens":0,"output_tokens":0,"system_prompt_chars":0,"response_chars":len(text),"via":"cli","retries":attempt,"http_error":http_err}))',
        '      break',
        '    elif attempt<4:',
        '      wait=3*(2**attempt) if "rate limit" in (r.stderr or "").lower() else 2',
        '      time.sleep(wait)',
        '      subprocess.run("rm -rf $HOME/.openclaw/agents/main/sessions $HOME/.openclaw/sessions",shell=True,capture_output=True)',
        '    else:',
        '      print(json.dumps({"error":r.stderr[-500:],"http_error":http_err}))',
        '',
        '# Last resort: Claude Code doctor — diagnose and fix, then retry',
        'if not ok:',
        '  _ak=""',
        '  try: _ak=open("/opt/king-mouse/.anthropic-key").read().strip()',
        '  except: pass',
        '  if _ak:',
        '    _env=dict(os.environ)',
        '    _env["ANTHROPIC_API_KEY"]=_ak',
        '    _env["DISPLAY"]=":99"',
        '    subprocess.run(["claude","-p",f"OpenClaw gateway error: {http_err}. Fix the gateway on port 18789. Check config, restart if needed. Verify with curl -sf http://127.0.0.1:18789/health","--allowedTools","Read,Edit,Bash","--model","haiku"],capture_output=True,text=True,timeout=120,env=_env)',
        '    time.sleep(3)',
        '    # Retry after doctor fix',
        '    try:',
        '      req=urllib.request.Request("http://127.0.0.1:18789/v1/chat/completions",data=body,headers=headers)',
        '      resp=urllib.request.urlopen(req,timeout=240)',
        '      data=json.loads(resp.read())',
        '      text=data["choices"][0]["message"]["content"]',
        '      usage=data.get("usage",{})',
        '      print(json.dumps({"response":text,"input_tokens":usage.get("prompt_tokens",0),"output_tokens":usage.get("completion_tokens",0),"system_prompt_chars":0,"response_chars":len(text),"via":"http_after_doctor"}))',
        '      ok=True',
        '    except: pass',
      ].join('\n');

      const execRes = await fetch(`${ORGO_BASE}/computers/${vm.orgo_vm_id}/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: pythonCode }),
        signal: AbortSignal.timeout(270000),
      });

      if (!execRes.ok) {
        throw new Error(`Orgo exec (${execRes.status})`);
      }

      const execData = await execRes.json();
      console.log(`[Task] Exec: success=${execData.success}, len=${execData.output?.length || 0}, preview=${execData.output?.slice(0, 400)}`);
      if (!execData.success) {
        throw new Error(`Orgo exec failed: ${execData.output?.slice(0, 200)}`);
      }

      // Extract JSON even if exec output has extra text around it
      const rawOutput = execData.output?.trim() || '';
      const jsonStart = rawOutput.indexOf('{');
      const jsonEnd = rawOutput.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error(`No JSON in exec output: ${rawOutput.slice(0, 200)}`);
      }
      const vmData = JSON.parse(rawOutput.slice(jsonStart, jsonEnd + 1));

      if (vmData.error) {
        throw new Error(`Agent error: ${vmData.error.slice(0, 200)}`);
      }
      result = vmData.response;
      if (!result || typeof result !== 'string') {
        throw new Error(`Invalid agent response: ${JSON.stringify(vmData).slice(0, 200)}`);
      }

      // Extract token usage (estimate from chars if provider returns 0)
      let inputTokens = vmData.input_tokens || 0;
      let outputTokens = vmData.output_tokens || 0;

      if (inputTokens === 0) {
        const systemChars = vmData.system_prompt_chars || 0;
        inputTokens = Math.ceil((systemChars + taskPrompt.length) / CHARS_PER_TOKEN);
      }
      if (outputTokens === 0) {
        const responseChars = vmData.response_chars || result.length;
        outputTokens = Math.ceil(responseChars / CHARS_PER_TOKEN);
      }

      // Calculate cost in dollars then convert to work hours
      const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
      const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
      hoursUsed = (inputCost + outputCost) / DOLLARS_PER_HOUR;

      // Log usage event
      await supabase
        .from('usage_events')
        .insert({
          user_id: user.id,
          service: 'king_mouse_task',
          description: `Task: ${title} (${inputTokens} in / ${outputTokens} out tokens)`,
          hours_used: hoursUsed,
        });

      // Deduct work hours
      await supabase
        .from('work_hours')
        .update({
          total_used: workHours.total_used + hoursUsed,
          remaining: workHours.remaining - hoursUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

    } catch (vmErr) {
      const errMsg = vmErr instanceof Error ? vmErr.message : String(vmErr);
      console.error('Task execution failed:', errMsg);
      return NextResponse.json({
        success: false,
        error: 'king_mouse_down',
        message: 'King Mouse is temporarily unavailable. Please call (910) 515-8927 for immediate human support.',
        debug: errMsg,
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      data: {
        task_id: crypto.randomUUID(),
        result,
        hours_used: hoursUsed,
      },
    });
  } catch (err) {
    console.error('Tasks POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

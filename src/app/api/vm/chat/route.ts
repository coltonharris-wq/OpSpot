import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getVerticalConfig } from '@/lib/config-loader';

const ORGO_BASE = process.env.ORGO_BASE_URL || 'https://www.orgo.ai/api';

// Token-based pricing
const INPUT_COST_PER_MILLION = 6.00;   // $6.00 per 1M input tokens
const OUTPUT_COST_PER_MILLION = 30.00; // $30.00 per 1M output tokens
const DOLLARS_PER_HOUR = 4.98;         // 1 work hour = $4.98
const CHARS_PER_TOKEN = 4;             // estimation fallback when provider returns 0

// Allow up to 60s for agent CLI responses
export const maxDuration = 60;

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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

    const url = new URL(request.url);

    // Config - return king mouse greeting/quick actions from vertical config
    if (url.searchParams.has('config')) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const nicheId = profile?.vertical_config_id || (profile?.niche ? slugify(profile.niche) : null);
      const config = nicheId ? getVerticalConfig(nicheId) : null;
      return NextResponse.json({ kingMouse: config?.kingMouse || null });
    }

    // Conversations list
    if (url.searchParams.has('conversations')) {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      return NextResponse.json({ conversations: conversations || [] });
    }

    // Messages for a conversation
    const conversationId = url.searchParams.get('conversation_id');
    if (conversationId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      if (!conv) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      return NextResponse.json({ messages: messages || [] });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('Chat GET error:', err);
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
    const { message, conversation_id } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

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

    // Get user's VM
    const { data: vm } = await supabase
      .from('vms')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ready')
      .single();

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get or create conversation
    let activeConversationId = conversation_id;

    if (!activeConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: message.slice(0, 100),
          niche: profile?.niche || null,
        })
        .select()
        .single();

      if (convError) {
        console.error('Failed to create conversation:', convError);
        return NextResponse.json(
          { success: false, error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      activeConversationId = newConversation.id;
    }

    let assistantResponse: string;
    let hoursUsed = 0;
    let tokenUsage = { inputTokens: 0, outputTokens: 0, inputCost: 0, outputCost: 0 };

    if (vm?.orgo_vm_id) {
      // VM is ready — try HTTP API first (avoids WebSocket handshake race), fallback to CLI
      try {
        const lastUserMsg = message;
        const sessionId = activeConversationId || 'default';

        const msgB64 = Buffer.from(lastUserMsg).toString('base64');
        const pythonCode = [
          'import subprocess,json,base64,os,urllib.request,urllib.error,time',
          'try:',
          '  os.environ["MOONSHOT_API_KEY"]=open("/opt/king-mouse/.moonshot-key").read().strip()',
          'except: pass',
          `msg=base64.b64decode("${msgB64}").decode()`,
          `sid="${sessionId}"`,
          'token=""',
          'for p in [os.path.expanduser("~/.openclaw/openclaw.json"),os.path.expanduser("~/.openclaw/config.json"),"/opt/king-mouse/openclaw.json"]:',
          '  if os.path.exists(p):',
          '    try:',
          '      c=json.load(open(p)); token=c.get("gateway",{}).get("auth",{}).get("token","") or os.environ.get("OPENCLAW_GATEWAY_TOKEN",""); break',
          '    except: pass',
          'for p in [os.path.expanduser("~/.openclaw/openclaw.json"),os.path.expanduser("~/.openclaw/config.json"),"/opt/king-mouse/openclaw.json"]:',
          '  if os.path.exists(p):',
          '    try:',
          '      c=json.load(open(p)); g=c.setdefault("gateway",{}); h=g.setdefault("http",{}); e=h.setdefault("endpoints",{});',
          '      if not e.get("chatCompletions",{}).get("enabled"): e["chatCompletions"]={"enabled":True}; json.dump(c,open(p,"w"),indent=2)',
          '      break',
          '    except: pass',
          'body=json.dumps({"model":"openclaw:main","messages":[{"role":"user","content":msg}],"user":sid})',
          'hd={"Content-Type":"application/json"}',
          'if token: hd["Authorization"]="Bearer "+token',
          'req=urllib.request.Request("http://127.0.0.1:18789/v1/chat/completions",data=body.encode(),headers=hd,method="POST")',
          'ok=False',
          'try:',
          '  with urllib.request.urlopen(req,timeout=55) as r:',
          '    d=json.loads(r.read().decode()); txt=d.get("choices",[{}])[0].get("message",{}).get("content","") or "No response"; u=d.get("usage",{}); inp=u.get("prompt_tokens",0); out=u.get("completion_tokens",0); print(json.dumps({"response":txt,"input_tokens":inp,"output_tokens":out,"system_prompt_chars":0,"response_chars":len(txt),"source":"http"})); ok=True',
          'except Exception as ex: pass',
          'if not ok:',
          '  for attempt in range(2):',
          '    r=subprocess.run(["node","/opt/king-mouse/openclaw.mjs","agent","--message",msg,"--json","--agent","main","--session-id",sid,"--timeout","45"],capture_output=True,text=True,timeout=55,cwd="/opt/king-mouse")',
          '    if r.returncode==0:',
          '      data=json.loads(r.stdout); text=data.get("payloads",[{}])[0].get("text","No response"); meta=data.get("meta",{}); usage=meta.get("agentMeta",{}).get("lastCallUsage",{}); sp=meta.get("systemPromptReport",{}).get("systemPrompt",{}); print(json.dumps({"response":text,"input_tokens":usage.get("input",0),"output_tokens":usage.get("output",0),"system_prompt_chars":sp.get("chars",0),"response_chars":len(text),"source":"cli"})); ok=True; break',
          '    if attempt<1: time.sleep(2)',
          '  if not ok: print(json.dumps({"error":r.stderr[-500:] if r else "cli failed"}))',
        ].join('\n');

        const execRes = await fetch(`${ORGO_BASE}/computers/${vm.orgo_vm_id}/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.ORGO_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: pythonCode }),
          signal: AbortSignal.timeout(90000),
        });

        if (!execRes.ok) {
          throw new Error(`Orgo exec (${execRes.status})`);
        }

        const execData = await execRes.json();
        if (!execData.success) {
          throw new Error(`Orgo exec failed: ${execData.output?.slice(0, 200)}`);
        }

        const vmData = JSON.parse(execData.output.trim());
        if (vmData.error) {
          throw new Error(`Agent error: ${vmData.error.slice(0, 200)}`);
        }
        assistantResponse = vmData.response;
        console.log(`[Chat] ${vmData.source === 'http' ? 'HTTP' : 'CLI fallback'}`);

        // Extract token usage (estimate from chars if provider returns 0)
        let inputTokens = vmData.input_tokens || 0;
        let outputTokens = vmData.output_tokens || 0;

        if (inputTokens === 0) {
          const systemChars = vmData.system_prompt_chars || 0;
          inputTokens = Math.ceil((systemChars + message.length) / CHARS_PER_TOKEN);
        }
        if (outputTokens === 0) {
          const responseChars = vmData.response_chars || assistantResponse.length;
          outputTokens = Math.ceil(responseChars / CHARS_PER_TOKEN);
        }

        // Calculate cost in dollars then convert to work hours
        const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
        const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
        hoursUsed = (inputCost + outputCost) / DOLLARS_PER_HOUR;
        tokenUsage = { inputTokens, outputTokens, inputCost, outputCost };
      } catch (vmErr) {
        const errMsg = vmErr instanceof Error ? vmErr.message : String(vmErr);
        console.error('VM chat failed:', errMsg);
        return NextResponse.json({
          reply: null,
          conversation_id: activeConversationId,
          error: 'king_mouse_down',
          support_message: 'King Mouse is temporarily unavailable. Please call (910) 515-8927 for immediate human support to get this back online for you ASAP.',
          support_phone: '9105158927',
          debug: errMsg,
        }, { status: 503 });
      }
    } else {
      // No VM ready — do not fall back to any API
      return NextResponse.json({
        reply: null,
        conversation_id: activeConversationId,
        error: 'no_vm',
        support_message: 'Your AI employee is still being set up. If this persists, please call (910) 515-8927 for immediate human support.',
        support_phone: '9105158927',
      }, { status: 503 });
    }

    // Save user message
    await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
      });

    // Save assistant message
    await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: 'assistant',
        content: assistantResponse,
      });

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeConversationId);

    // Log usage event with token details
    await supabase
      .from('usage_events')
      .insert({
        user_id: user.id,
        service: 'king_mouse_chat',
        description: `Chat message in conversation ${activeConversationId} (${tokenUsage.inputTokens} in / ${tokenUsage.outputTokens} out tokens)`,
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

    // Infer if King Mouse is doing computer work (browser, desktop, search, file ops)
    const computerKeywords = ['search', 'brows', 'website', 'click', 'open', 'navigat', 'download', 'file', 'screen', 'desktop', 'type', 'url', 'google', 'research'];
    const lowerResponse = assistantResponse.toLowerCase();
    const lowerMessage = message.toLowerCase();
    const computerActive = computerKeywords.some((kw) => lowerResponse.includes(kw) || lowerMessage.includes(kw));

    // Generate task steps from the response (parse numbered steps or infer from content)
    const steps: Array<{ name: string; status: string }> = [];
    const stepMatches = assistantResponse.match(/(?:^|\n)\s*(?:\d+[\.\)]\s*|[-*]\s+)(.+)/g);
    if (stepMatches) {
      stepMatches.slice(0, 8).forEach((match, i) => {
        const name = match.replace(/^\s*(?:\d+[\.\)]\s*|[-*]\s+)/, '').trim();
        if (name.length > 5 && name.length < 200) {
          steps.push({ name, status: i === 0 ? 'in_progress' : 'pending' });
        }
      });
    }

    return NextResponse.json({
      reply: assistantResponse,
      conversation_id: activeConversationId,
      hours_used: hoursUsed,
      hours_remaining: workHours.remaining - hoursUsed,
      computer_active: computerActive,
      steps: steps.length > 0 ? steps : undefined,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


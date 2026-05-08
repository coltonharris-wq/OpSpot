// Full-screen Chat — pick agent + session, type, send. Mirrors OpenClaw's
// own dashboard chat tab: thread on the right, picker bar on top, input at
// the bottom.
const { useState: uSt_CH, useEffect: uEf_CH, useRef: uRf_CH } = React;

function chatTextOf(m) {
  const c = m?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map(p => p.text || (p.type === 'tool_use' ? `[tool ${p.name || ''}]` : '')).filter(Boolean).join('\n');
  return '';
}

function ChatScreen() {
  const oc = (typeof useOpenClaw === 'function') ? useOpenClaw() : null;
  const agents = (oc?.agents && oc.agents.length) ? oc.agents : SEED_AGENTS;
  const [agentId, setAgentId] = uSt_CH(agents[0]?.id || '');
  const [sessions, setSessions] = uSt_CH([]);
  const [sessionKey, setSessionKey] = uSt_CH('');
  const [thinking, setThinking] = uSt_CH('adaptive');
  const [messages, setMessages] = uSt_CH([]);
  const [draft, setDraft] = uSt_CH('');
  const [sending, setSending] = uSt_CH(false);
  const scrollRef = uRf_CH(null);

  const agent = agents.find(a => a.id === agentId) || agents[0];

  // Load sessions list when agent changes; default-select cockpit:default
  // (creates it implicitly on first chat.history call).
  uEf_CH(() => {
    if (!agentId || !oc?.call) return;
    const cockpit = `agent:${agentId}:cockpit:default`;
    setSessionKey(cockpit);
    oc.call('sessions.list', { agentId, limit: 25 })
      .then(r => setSessions(r.sessions || []))
      .catch(() => setSessions([{ key: cockpit }]));
  }, [agentId]);

  // Poll history for the active session every 3s.
  uEf_CH(() => {
    if (!sessionKey || !oc?.call) return;
    let alive = true;
    const fetchIt = async () => {
      try {
        const r = await oc.call('chat.history', { sessionKey, limit: 100 });
        if (!alive) return;
        const server = r.messages || [];
        setMessages(prev => {
          const serverTexts = new Set(server.map(chatTextOf).filter(Boolean));
          const pending = prev.filter(m => m._local && !serverTexts.has(chatTextOf(m)));
          return [...server, ...pending];
        });
        // Drop the "thinking" indicator only after the assistant message
        // has actually landed in history — otherwise it disappears the
        // moment chat.send acks and you stare at silence for 30s.
        const lastServer = server[server.length - 1];
        if (lastServer?.role === 'assistant') setSending(false);
      } catch {}
    };
    fetchIt();
    const tick = setInterval(fetchIt, 3000);
    return () => { alive = false; clearInterval(tick); };
  }, [sessionKey]);

  // Auto-scroll to bottom on new messages.
  uEf_CH(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, sending]);

  const send = async () => {
    if (!draft.trim() || !oc?.call || sending) return;
    setSending(true);
    const text = draft;
    setDraft('');
    const localId = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setMessages(m => [...m, { role: 'user', content: text, _local: true, _id: localId }]);
    try {
      const idempotencyKey = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));
      await oc.call('chat.send', { sessionKey, message: text, deliver: false, idempotencyKey });
      // Don't flip sending=false here — the poll effect drops the indicator
      // when the assistant message actually lands in history.
    } catch (e) {
      console.warn('chat.send failed', e);
      setSending(false);  // only on send failure
    }
  };

  // NOTE: thinking-level dropdown is display-only for now. sessions.patch
  // looked plausible but rotates the session id and wipes history; need to
  // find the right RPC (or whether chat.send accepts it under a different
  // name) before wiring this back.

  const sessionLabel = (k) => {
    // strip "agent:<id>:" prefix to show the meaningful suffix
    const i = k.indexOf(':', k.indexOf(':') + 1);
    return i > 0 ? k.slice(i + 1) : k;
  };

  const selectStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7,
    color: 'var(--fg-primary)', height: 32, padding: '0 10px', fontSize: 12.5,
    fontFamily: 'inherit', fontWeight: 500, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
        <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{ ...selectStyle, minWidth: 200 }}>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name} · {a.role}</option>)}
        </select>
        <select value={sessionKey} onChange={e => setSessionKey(e.target.value)} style={{ ...selectStyle, minWidth: 280 }}>
          {sessions.length === 0 && <option value={`agent:${agentId}:cockpit:default`}>cockpit:default</option>}
          {sessions.map(s => <option key={s.key} value={s.key}>{sessionLabel(s.key)}</option>)}
        </select>
        <select value={thinking} onChange={e => setThinking(e.target.value)} style={selectStyle}>
          {['off','minimal','low','medium','adaptive','high','xhigh','max'].map(t => <option key={t} value={t}>thinking · {t}</option>)}
        </select>
        <div style={{ flex: 1 }}/>
        <span className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{agent ? `model · ${agent.model}` : ''}</span>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--fg-tertiary)', textAlign: 'center', marginTop: 60, fontSize: 13 }}>No messages yet — say something to {agent?.name}.</div>
        )}
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          const text = chatTextOf(m);
          if (!text) return null;
          // Stable key per message (prevents the local-echo → server-msg
          // swap from reusing a DOM node and causing a visual flash).
          const k = m._id || m.timestamp || `${m.role}:${text.slice(0, 24)}:${i}`;
          return (
            <div key={k} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
              <Avatar name={isUser ? 'You' : agent?.name} size={26} tone={isUser ? 'brand' : (agent?.tone || 'info')}/>
              <div style={{
                maxWidth: '70%', padding: '10px 14px',
                background: isUser ? 'rgba(249,115,22,0.10)' : 'var(--surface)',
                border: `1px solid ${isUser ? 'rgba(249,115,22,0.25)' : 'var(--border)'}`,
                borderRadius: 10, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-primary)',
                whiteSpace: 'pre-wrap',
              }}>
                <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', marginBottom: 4 }}>
                  {isUser ? 'YOU' : (agent?.name?.toUpperCase() || 'AGENT')}
                </div>
                {text}
              </div>
            </div>
          );
        })}
        {sending && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--fg-tertiary)', fontSize: 12 }}>
            <Avatar name={agent?.name} size={22} tone={agent?.tone || 'info'}/>
            {agent?.name} is thinking<span className="blink">▍</span>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`Message ${agent?.name || 'agent'} (Enter to send, Shift+Enter for newline)`}
          rows={2}
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '10px 12px', color: 'var(--fg-primary)', fontSize: 13, fontFamily: 'inherit',
            resize: 'none', outline: 'none', lineHeight: 1.4,
          }}
        />
        <Button variant="primary" size="md" icon={<Icons.Send size={14}/>} onClick={send} disabled={!draft.trim() || sending}>Send</Button>
      </div>
    </div>
  );
}

Object.assign(window, { ChatScreen });

// Fleet — agent grid + agent detail with live console
const { useState: uSt_F } = React;

function FleetScreen({ tasks, onOpenAgent }) {
  const [filter, setFilter] = uSt_F('all');
  const filtered = SEED_AGENTS.filter(a => filter === 'all' || a.health === filter);
  const oc = (typeof useOpenClaw === 'function') ? useOpenClaw() : null;

  // Disable every enabled cron job. Used as a global "stop" — paused
  // crons stay paused until you re-enable them per task.
  const pauseAll = async () => {
    if (!oc?.call) return;
    if (!confirm('Pause every enabled cron job?')) return;
    try {
      const list = await oc.call('cron.list', {});
      const enabled = (list?.jobs || []).filter(j => j.enabled);
      for (const j of enabled) {
        try { await oc.call('cron.update', { id: j.id, patch: { enabled: false } }); } catch {}
      }
    } catch (e) { console.warn('pause all failed', e); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
        <Icons.Filter size={13} style={{ color: 'var(--fg-tertiary)' }}/>
        {['all','working','idle','stalled'].map(f => (
          <Button key={f} variant="ghost" size="xs" active={filter===f} onClick={()=>setFilter(f)}>{f}</Button>
        ))}
        <div style={{ flex: 1 }}/>
        <Button variant="secondary" size="sm" icon={<Icons.Pause size={13}/>} onClick={pauseAll}>Pause all</Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {filtered.map(a => <AgentBigCard key={a.id} agent={a} task={tasks.find(t=>t.id===a.task)} onClick={()=>onOpenAgent(a)}/>)}
        </div>
      </div>
    </div>
  );
}

function AgentBigCard({ agent, task, onClick }) {
  const colorMap = { brand: '#f97316', info: '#3b82f6', success: '#22c55e', purple: '#a855f7', pink: '#ec4899', cyan: '#22d3ee', neutral: '#a0a0a8' };
  return (
    <div onClick={onClick} className="card-h" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
      {agent.health === 'working' && <div className="scan" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={agent.name} size={42} tone={agent.tone}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{agent.name}</div>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: agent.health==='working'?'#22c55e':agent.health==='stalled'?'#f59e0b':'var(--fg-tertiary)' }}/>
          </div>
          <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', letterSpacing: '0.05em' }}>{agent.role.toUpperCase()} · {agent.model}</div>
        </div>
        <Pill tone={agent.health==='working'?'success':agent.health==='stalled'?'warning':'neutral'}>{agent.health}</Pill>
      </div>
      <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--canvas)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12.5, color: agent.health==='working'?'var(--fg-primary)':'var(--fg-secondary)', minHeight: 38 }}>
        {agent.health === 'working' && task ? (
          <>
            <div className="term" style={{ fontSize: 10.5, color: 'var(--accent)', marginBottom: 3, letterSpacing: '0.05em' }}>NOW</div>
            {task.title} <span className="blink" style={{ color: 'var(--accent)' }}>▍</span>
          </>
        ) : agent.health === 'stalled' ? (
          <span style={{ color: 'var(--warning)' }}>{agent.mood}</span>
        ) : (
          <span style={{ color: 'var(--fg-tertiary)' }}>{agent.mood}</span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginTop: 12, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ background: 'var(--surface)', padding: '8px 10px' }}>
          <div className="section-label" style={{ marginBottom: 2 }}>CPU</div>
          <div className="mono-num" style={{ fontSize: 14, fontWeight: 700 }}>{agent.cpu}%</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '8px 10px' }}>
          <div className="section-label" style={{ marginBottom: 2 }}>$/today</div>
          <div className="mono-num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>${agent.cost.toFixed(2)}</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '8px 10px' }}>
          <div className="section-label" style={{ marginBottom: 2 }}>Tasks</div>
          <div className="mono-num" style={{ fontSize: 14, fontWeight: 700 }}>{agent.tasksDone}</div>
        </div>
      </div>
    </div>
  );
}

// Pull plain text out of an OpenClaw chat message. Assistant content is an
// array of typed parts ({type:'text'|'tool_use'|'tool_result', text|...}).
function chatText(m) {
  const c = m?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map(p => p.text || (p.type === 'tool_use' ? `[tool ${p.name || ''}]` : '')).filter(Boolean).join('\n');
  return '';
}

function AgentDetail({ agent, task, onClose }) {
  const oc = (typeof useOpenClaw === 'function') ? useOpenClaw() : null;
  const [messages, setMessages] = uSt_F([]);
  const [draft, setDraft] = uSt_F('');
  const [sending, setSending] = uSt_F(false);
  const sessionKey = agent ? `agent:${agent.id}:cockpit:default` : null;

  React.useEffect(() => {
    if (!agent || !oc?.call) return;
    let alive = true;
    const refresh = async () => {
      try {
        const r = await oc.call('chat.history', { sessionKey, limit: 50 });
        if (!alive) return;
        const server = r.messages || [];
        // Preserve optimistic local-echo bubbles until server catches up.
        setMessages(prev => {
          const seen = new Set(server.map(chatText).filter(Boolean));
          const pending = prev.filter(m => m._local && !seen.has(chatText(m)));
          return [...server, ...pending];
        });
      } catch (e) { /* ignore */ }
    };
    refresh();
    const tick = setInterval(refresh, 3000);
    return () => { alive = false; clearInterval(tick); };
  }, [agent?.id]);

  const send = async () => {
    if (!draft.trim() || !oc?.call || sending) return;
    setSending(true);
    const text = draft;
    setDraft('');
    // Optimistic local echo so the user sees the message immediately.
    setMessages(m => [...m, { role: 'user', content: text, _local: true }]);
    try {
      const idempotencyKey = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));
      await oc.call('chat.send', { sessionKey, message: text, deliver: false, idempotencyKey });
    } catch (e) { console.warn('chat.send failed', e); }
    setSending(false);
  };

  if (!agent) return null;
  return (
    <div className="backdrop" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width: 760, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={agent.name} size={36} tone={agent.tone}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{agent.name} <span style={{ color: 'var(--fg-tertiary)', fontWeight: 500 }}>· {agent.role}</span></div>
            <div className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)', letterSpacing: '0.04em' }}>MODEL {agent.model.toUpperCase()} · {agent.tasksDone} TASKS LIFETIME</div>
          </div>
          <Pill tone={agent.health==='working'?'success':agent.health==='stalled'?'warning':'neutral'}>{agent.health}</Pill>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.X size={14}/></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 18, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 18 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Chat · {sessionKey}</div>
            <div style={{ background: '#0a0a0b', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 13, color: '#d0d0d4', maxHeight: 360, minHeight: 180, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ color: '#666', fontStyle: 'italic', fontSize: 12 }}>No messages yet — say something to {agent.name}.</div>
              )}
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ width: 56, flexShrink: 0, color: isUser ? '#f97316' : '#22c55e', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', paddingTop: 2 }}>{isUser ? 'YOU' : agent.name.toUpperCase().slice(0, 8)}</span>
                    <div style={{ flex: 1, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{chatText(m)}</div>
                  </div>
                );
              })}
              {sending && <div style={{ color: '#666', fontSize: 12 }}>{agent.name} is thinking<span className="blink">▍</span></div>}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              <input
                value={draft} onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Message ${agent.name}…`}
                style={{ flex: 1, background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 6, padding: '0 10px', height: 32, color: 'var(--fg-primary)', fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }}
              />
              <Button variant="primary" size="sm" icon={<Icons.Send size={13}/>} onClick={send} disabled={!draft.trim() || sending}>Send</Button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <DetailField label="Current task">{task ? <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-primary)' }}>{task.title}</div> : <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>none</span>}</DetailField>
            <DetailField label="Spend today"><div className="mono-num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>${agent.cost.toFixed(2)}</div></DetailField>
            <DetailField label="CPU"><div className="mono-num" style={{ fontSize: 14, fontWeight: 700 }}>{agent.cpu}%</div></DetailField>
            <DetailField label="Lifetime tasks"><div className="mono-num" style={{ fontSize: 14, fontWeight: 700 }}>{agent.tasksDone}</div></DetailField>
            <DetailField label="Tools"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{['shell','edit','grep','git','web'].map(t => <Pill key={t} tone="neutral" dot={false}>{t}</Pill>)}</div></DetailField>
            <Button variant="ghost" size="sm" icon={<Icons.Pause size={13}/>} style={{ marginTop: 4 }}
              onClick={async () => {
                if (!oc?.call) return;
                try {
                  const list = await oc.call('cron.list', {});
                  const mine = (list?.jobs || []).filter(j => j.agentId === agent.id && j.enabled);
                  if (mine.length === 0) return alert(`${agent.name} has no enabled crons.`);
                  if (!confirm(`Pause ${mine.length} cron job${mine.length===1?'':'s'} for ${agent.name}?`)) return;
                  for (const j of mine) { try { await oc.call('cron.update', { id: j.id, patch: { enabled: false } }); } catch {} }
                } catch (e) { console.warn('agent pause failed', e); }
              }}
            >Pause cron jobs</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FleetScreen, AgentDetail });

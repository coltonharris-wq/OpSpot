// Command center — operator hero, fleet strip, pipeline pulse, idea queue + activity rail
const { useState: uSt_C } = React;

function CommandCenter({ tasks, onNav, onOpenTask }) {
  const live = useLive();
  const oc = (typeof useOpenClaw === 'function') ? useOpenClaw() : null;
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const inbox = tasks.filter(t => t.status === 'inbox');
  const review = tasks.filter(t => t.status === 'review');
  const totalMRR = SEED_PRODUCTS.reduce((s, p) => s + p.mrr, 0);
  const totalCostToday = SEED_AGENTS.reduce((s, a) => s + a.cost, 0);
  const workingAgents = SEED_AGENTS.filter(a => a.health === 'working');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100%', minHeight: 0 }}>
      <div style={{ overflow: 'auto', padding: 18 }}>
        {/* BUILT.md — what's been shipped recently */}
        {oc?.built && oc.built.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
            {oc.built.slice(0, 6).map((b, i) => {
              const dot = b.status === 'green' ? '#22c55e' : b.status === 'red' ? '#ef4444' : '#f59e0b';
              const date = b.date.replace(/ by .*$/, '').replace(/ \(.*\)$/, '').slice(0, 10);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, minWidth: 240, flexShrink: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: dot, flexShrink: 0 }}/>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', letterSpacing: '0.04em', marginBottom: 2 }}>{date.toUpperCase()} {i === 0 ? '· LATEST' : ''}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.headline}>{b.headline}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Hero — your status right now */}
        <div className="cockpit-grid" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div className="term" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>● MISSION CONTROL · {new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})} LOCAL</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
                Good afternoon, Colton.<br/>
                <span style={{ color: 'var(--fg-secondary)' }}>{workingAgents.length} agents working · {inbox.length + review.length} need you · </span>
                <span style={{ color: 'var(--accent)' }}>$1,891 cash today.</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <Button variant="primary" size="md" icon={<Icons.Cards size={14}/>} onClick={()=>onNav('swipe')}>Process {inbox.length} ideas</Button>
                <Button variant="secondary" size="md" icon={<Icons.Eye size={14}/>} onClick={()=>onNav('queue')}>Review {review.length} PRs</Button>
                <Button variant="ghost" size="md" icon={<Icons.Phone size={14}/>} onClick={()=>onNav('pipeline')}>3 hot leads</Button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', minWidth: 280 }}>
              <Stat label="MRR run-rate" value={<Money value={totalMRR} size="lg" tone="primary"/>} delta="+11.2%" deltaTone="success" sub="vs last 30d"/>
              <Stat label="Cash today" value={<Money value={live.money} size="lg" tone="accent" flash={!!live.bumpKeys.money}/>} delta="6 events" deltaTone="neutral" sub="live ledger"/>
              <Stat label="Agents working" value={<span className="mono-num" style={{ fontSize: 28, fontWeight: 700 }}>{workingAgents.length}<span style={{ color: 'var(--fg-tertiary)', fontSize: 16 }}>/{SEED_AGENTS.length}</span></span>} delta="2 stalled" deltaTone="warning" sub="fleet"/>
              <Stat label="Compute today" value={<span className="mono-num" style={{ fontSize: 28, fontWeight: 700 }}>${totalCostToday.toFixed(2)}</span>} delta="under cap" deltaTone="success" sub="$50.00 cap"/>
            </div>
          </div>
        </div>

        {/* Fleet strip — every agent, status at a glance */}
        <SectionHeader label="Fleet — live" count={SEED_AGENTS.length} action={<Button variant="ghost" size="xs" icon={<Icons.ArrowR size={11}/>} onClick={()=>onNav('fleet')}>All agents</Button>}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
          {SEED_AGENTS.map(a => <AgentMiniCard key={a.id} agent={a} task={tasks.find(t => t.id === a.task)} onClick={()=>onNav('fleet')}/>)}
        </div>

        {/* What's building right now */}
        <SectionHeader label="Building right now" count={inProgress.length} action={<Button variant="ghost" size="xs" icon={<Icons.ArrowR size={11}/>} onClick={()=>onNav('queue')}>Mission queue</Button>}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 18 }}>
          {inProgress.map(t => <TaskCard key={t.id} task={t} onDragStart={()=>{}} onDragEnd={()=>{}} onClick={()=>onOpenTask(t)}/>)}
        </div>

        {/* Pipeline pulse */}
        <SectionHeader label="Pipeline pulse" count={SEED_DEALS.length} action={<Button variant="ghost" size="xs" icon={<Icons.ArrowR size={11}/>} onClick={()=>onNav('pipeline')}>All deals</Button>}/>
        <Card padding={0}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {DEAL_STAGES.map((s, i) => {
              const deals = SEED_DEALS.filter(d => d.stage === s.id);
              const value = deals.reduce((sum, d) => sum + d.value, 0);
              return (
                <div key={s.id} style={{ padding: 14, borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: s.tone==='success'?'#22c55e':s.tone==='warning'?'#f59e0b':s.tone==='brand'?'var(--accent)':'#3b82f6' }}/>
                    <span className="section-label">{s.label}</span>
                  </div>
                  <div className="mono-num" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>{deals.length}</div>
                  <div className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 4 }}>${value}/mo · {deals.filter(d=>d.heat==='hot').length} hot</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Idea snapshot */}
        <div style={{ marginTop: 18 }}/>
        <SectionHeader label="Ideas waiting on you" count={SEED_IDEAS.length} action={<Button variant="primary" size="xs" icon={<Icons.Cards size={11}/>} onClick={()=>onNav('swipe')}>Open swipe deck</Button>}/>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SEED_IDEAS.slice(0, 3).map(i => <IdeaPreviewCard key={i.id} idea={i} onClick={()=>onNav('swipe')}/>)}
        </div>
      </div>

      <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ActivityRail/>
      </div>
    </div>
  );
}

function Stat({ label, value, delta, deltaTone, sub }) {
  return (
    <div style={{ background: 'var(--surface)', padding: 14 }}>
      <div className="section-label" style={{ marginBottom: 6 }}>{label}</div>
      <div>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <Pill tone={deltaTone} dot={false}>{delta}</Pill>
        <span className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{sub}</span>
      </div>
    </div>
  );
}

function AgentMiniCard({ agent, task, onClick }) {
  const colorMap = { brand: '#f97316', info: '#3b82f6', success: '#22c55e', purple: '#a855f7', pink: '#ec4899', cyan: '#22d3ee', neutral: '#a0a0a8' };
  return (
    <div onClick={onClick} className="card-h" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
      {agent.health === 'working' && <div className="scan" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Avatar name={agent.name} size={26} tone={agent.tone}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{agent.name}</div>
          <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', letterSpacing: '0.04em' }}>{agent.role.toUpperCase()} · {agent.model}</div>
        </div>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: agent.health==='working'?'#22c55e':agent.health==='stalled'?'#f59e0b':'var(--fg-tertiary)' }}/>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)', minHeight: 16, lineHeight: 1.3 }}>
        {agent.health === 'working' && task ? <>working on <span style={{ color: 'var(--fg-primary)', fontWeight: 700 }}>{task.title.slice(0, 36)}{task.title.length>36?'…':''}</span></> : agent.mood}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${agent.cpu}%`, background: colorMap[agent.tone] }}/></div>
        </div>
        <span className="term mono-num" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)' }}>{agent.cpu}%</span>
        <span className="term mono-num" style={{ fontSize: 10.5, color: 'var(--accent)' }}>${agent.cost.toFixed(2)}</span>
      </div>
    </div>
  );
}

function IdeaPreviewCard({ idea, onClick }) {
  const product = SEED_PRODUCTS.find(p => p.id === idea.product);
  return (
    <div onClick={onClick} className="card-h" style={{ flex: '1 1 280px', minWidth: 280, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(249,115,22,0.18)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{product.icon}</span>
        <span className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', letterSpacing: '0.05em' }}>{product.name.toUpperCase()}</span>
        <span style={{ flex: 1 }}/>
        <Pill tone="brand" dot={false} mono>imp {idea.impact}</Pill>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>{idea.title}</div>
      <div className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{idea.complexity} · {idea.feasibility}% feasible · {idea.tags.join(' · ')}</div>
    </div>
  );
}

Object.assign(window, { CommandCenter });

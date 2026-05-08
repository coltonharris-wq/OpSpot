// Pipeline — deals kanban + lead finder + cash ledger
const { useState: uSt_P } = React;

function PipelineScreen({ deals, setDeals, onOpenDeal }) {
  const [view, setView] = uSt_P('board'); // board | leads | cash
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tabs tabs={[
          { id: 'board', label: 'Pipeline', count: deals.length },
          { id: 'leads', label: 'Lead Finder', count: 47 },
          { id: 'cash', label: 'Cash ledger', count: 12 },
        ]} active={view} onChange={setView}/>
        <div style={{ flex: 1 }}/>
      </div>
      {view === 'board' && <DealBoard deals={deals} setDeals={setDeals} onOpenDeal={onOpenDeal}/>}
      {view === 'leads' && <LeadFinder/>}
      {view === 'cash' && <CashLedger/>}
    </div>
  );
}

function DealBoard({ deals, setDeals, onOpenDeal }) {
  const [dragId, setDragId] = uSt_P(null);
  const [hoverCol, setHoverCol] = uSt_P(null);

  // Stage → status string written back to the vault frontmatter.
  const STATUS_FROM_STAGE = { discovery: 'discovery', qualified: 'qualified', proposal: 'proposal-sent', closed_won: 'won' };

  const onDrop = (stage) => {
    if (!dragId) return;
    const dropped = deals.find(d => d.id === dragId);
    setDeals(prev => prev.map(d => d.id === dragId ? { ...d, stage } : d));
    setDragId(null); setHoverCol(null);
    if (dropped?.vaultFile && STATUS_FROM_STAGE[stage]) {
      fetch('/__vault/leads/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file: dropped.vaultFile, status: STATUS_FROM_STAGE[stage] }),
      }).catch(() => {});
    }
  };
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 10, height: '100%', minHeight: 520 }}>
        {DEAL_STAGES.map(s => {
          const stageDeals = deals.filter(d => d.stage === s.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
          return (
            <div key={s.id}
              onDragOver={(e)=>{ e.preventDefault(); setHoverCol(s.id); }}
              onDrop={(e)=>{ e.preventDefault(); onDrop(s.id); }}
              className={hoverCol===s.id&&dragId?'drop-target':''}
              style={{ width: 290, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: s.tone==='success'?'#22c55e':s.tone==='warning'?'#f59e0b':s.tone==='brand'?'var(--accent)':'#3b82f6' }}/>
                <div style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{s.label}</div>
                <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 700 }}>{stageDeals.length}</span>
                <span className="term mono-num" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, borderLeft: '1px solid var(--border)', paddingLeft: 6 }}>${stageValue}/mo</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, flex: 1, overflow: 'auto' }}>
                {stageDeals.map(d => (
                  <DealCard key={d.id} deal={d}
                    onDragStart={()=>setDragId(d.id)} onDragEnd={()=>{ setDragId(null); setHoverCol(null); }}
                    dragging={dragId===d.id}
                    onClick={()=>onOpenDeal(d)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealCard({ deal, onDragStart, onDragEnd, dragging, onClick }) {
  const heatColor = { hot: '#ef4444', warm: '#f59e0b', cold: '#3b82f6', won: '#22c55e' }[deal.heat];
  const agent = deal.agent ? SEED_AGENTS.find(a=>a.id===deal.agent) : null;
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
      className={`card-h ${dragging?'dragging':''}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: heatColor }}/>
        <div style={{ fontSize: 12.5, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.name}</div>
        <span className="mono-num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>${deal.value}</span>
      </div>
      <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)' }}>{deal.owner} · {deal.city}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {agent ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 6px 1px 1px', background: 'var(--surface-elevated)', borderRadius: 999 }}>
            <Avatar name={agent.name} size={14} tone={agent.tone}/>
            <span style={{ fontSize: 10.5, fontWeight: 700 }}>{agent.name}</span>
          </div>
        ) : <span className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)' }}>{deal.source}</span>}
        <span style={{ flex: 1 }}/>
        <span className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)' }}>{deal.lastTouch} ago</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg-secondary)', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icons.ArrowR size={10} style={{ color: 'var(--accent)' }}/> {deal.next}
      </div>
    </div>
  );
}

function LeadFinder() {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--fg-tertiary)', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icons.Target size={24} style={{ color: 'var(--accent)' }}/>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-primary)' }}>Lead Finder</div>
      <div style={{ fontSize: 13, maxWidth: 460, lineHeight: 1.5 }}>
        No raw-lead inbox wired yet. Drop scored prospects into <span className="term">~/colton-brain-vault/Leads/inbox/</span> as <span className="term">.md</span> files and they'll show up here.
      </div>
    </div>
  );
}

function ScoreRing({ value }) {
  const r = 14, c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ position: 'relative', width: 36, height: 36 }}>
      <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border)" strokeWidth="3"/>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"/>
      </svg>
      <div className="mono-num" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function CashLedger() {
  const events = [
    { t: '14:22:11', amt: 497, kind: 'subscription', who: "Sue's Roofing Co.", note: 'New — annual upfront', tone: 'success' },
    { t: '13:55:08', amt: 197, kind: 'subscription', who: 'Apex Plumbing', note: 'Monthly · auto-renew', tone: 'success' },
    { t: '12:14:33', amt: 397, kind: 'subscription', who: 'Brightway Solar', note: 'Proposal accepted', tone: 'success' },
    { t: '10:42:19', amt: -8.42, kind: 'compute', who: 'Anthropic API', note: 'Forge · Anvil cycle', tone: 'critical' },
    { t: '09:31:02', amt: 297, kind: 'subscription', who: 'Northpoint Hardware', note: 'Onboarding fee', tone: 'success' },
    { t: '08:12:55', amt: -4.20, kind: 'compute', who: 'Anthropic API', note: 'Muse ideation cycle', tone: 'critical' },
    { t: '07:55:00', amt: -12.50, kind: 'infra', who: 'Vercel · Render', note: 'Daily infra', tone: 'critical' },
    { t: '06:18:40', amt: 397, kind: 'subscription', who: 'Coastal Realty Group', note: 'Onboarding active', tone: 'success' },
  ];
  const inflow = events.filter(e=>e.amt>0).reduce((s,e)=>s+e.amt,0);
  const outflow = Math.abs(events.filter(e=>e.amt<0).reduce((s,e)=>s+e.amt,0));
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
        <Stat label="Cash in · today" value={<Money value={inflow} size="lg" tone="success"/>} delta="6 events" deltaTone="success" sub="subscriptions"/>
        <Stat label="Spend · today" value={<Money value={outflow} size="lg" tone="critical" prefix="-$"/>} delta="under cap" deltaTone="success" sub="$50 cap · 50%"/>
        <Stat label="Net · today" value={<Money value={inflow-outflow} size="lg" tone="primary"/>} delta="+11.2% MoM" deltaTone="success" sub="run rate $31.8k MRR"/>
      </div>
      <SectionHeader label="Today's ledger" count={events.length}/>
      <Card padding={0}>
        {events.map((e,i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i<events.length-1?'1px solid var(--border)':'none' }}>
            <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)', width: 70, fontWeight: 700 }}>{e.t}</span>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: e.tone==='success'?'#22c55e':'#ef4444' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{e.who}</div>
              <div className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{e.kind} · {e.note}</div>
            </div>
            <div className="mono-num" style={{ fontSize: 14, fontWeight: 700, color: e.amt>0?'#22c55e':'#ef4444' }}>{e.amt>0?'+':''}${e.amt.toFixed(2)}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function DealDetail({ deal, onClose }) {
  if (!deal) return null;
  const stage = DEAL_STAGES.find(s => s.id === deal.stage);
  const heatColor = { hot: '#ef4444', warm: '#f59e0b', cold: '#3b82f6', won: '#22c55e' }[deal.heat];
  const markDone = () => {
    if (!deal.vaultFile) return alert('No vault file linked to this deal.');
    fetch('/__vault/leads/status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ file: deal.vaultFile, status: 'won' }),
    }).then(() => onClose()).catch(e => alert('Vault write failed: ' + e.message));
  };
  return (
    <div className="backdrop" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width: 740, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(249,115,22,0.12)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{deal.name[0]}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{deal.name}</div>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: heatColor }}/>
              <span className="term" style={{ fontSize: 11, color: heatColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{deal.heat}</span>
            </div>
            <div className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{deal.owner} · {deal.city} · {deal.source}</div>
          </div>
          <Money value={deal.value} size="md" tone="accent"/>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}><Icons.X size={14}/></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 18, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>Stage</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {DEAL_STAGES.map((s, i) => {
                  const idx = DEAL_STAGES.findIndex(x=>x.id===deal.stage);
                  const passed = i <= idx;
                  return (
                    <React.Fragment key={s.id}>
                      <div style={{ flex: 1, padding: '8px 10px', background: passed?'rgba(249,115,22,0.12)':'var(--surface)', border: `1px solid ${i===idx?'var(--accent)':'var(--border)'}`, color: passed?'var(--fg-primary)':'var(--fg-tertiary)', borderRadius: 6, fontSize: 11.5, fontWeight: 700, textAlign: 'center' }}>{s.label}</div>
                      {i<DEAL_STAGES.length-1 && <span style={{ height: 1, flex: '0 0 8px', background: passed?'var(--accent)':'var(--border)' }}/>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>Next action</div>
              <Card padding={12} accent>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icons.ArrowR size={16} style={{ color: 'var(--accent)' }}/>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{deal.next}</div>
                  <Button variant="primary" size="xs" onClick={markDone} disabled={!deal.vaultFile}>Mark won</Button>
                </div>
              </Card>
            </div>
            {deal.vaultFile && (
              <div className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>
                vault file · ~/colton-brain-vault/Leads/{deal.vaultFile}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <DetailField label="Value">
              <div className="mono-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>${deal.value}<span style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: 500 }}>/mo</span></div>
            </DetailField>
            <DetailField label="Heat"><Pill tone={deal.heat==='hot'?'critical':deal.heat==='warm'?'warning':deal.heat==='won'?'success':'info'}>{deal.heat}</Pill></DetailField>
            <DetailField label="Last touch"><div className="term mono-num" style={{ fontSize: 13, fontWeight: 700 }}>{deal.lastTouch} ago</div></DetailField>
            <DetailField label="Source"><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>{deal.source}</div></DetailField>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PipelineScreen, DealDetail });

// Agent Action Catalog v1 — orchestrator-routed specialist cards, local state only.
const { useState: useState_AAC, useEffect: useEffect_AAC, useMemo: useMemo_AAC } = React;

function AgentActionCatalogScreen() {
  const [state, setState] = useState_AAC(null);
  const [receipts, setReceipts] = useState_AAC([]);
  const [filter, setFilter] = useState_AAC('all');

  const load = async () => {
    const next = await window.mcLoadState?.();
    setState(next || {});
    const rs = await window.mcReceipts?.();
    setReceipts((rs?.receipts || []).slice(-50).reverse());
  };
  useEffect_AAC(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const actions = state?.agentActionCatalog || [];
  const filtered = useMemo_AAC(() => actions.filter(a => filter === 'all' || a.category === filter || a.status === filter), [actions, filter]);
  const categories = [...new Set(actions.map(a => a.category).filter(Boolean))];
  const totals = {
    cards: actions.length,
    outputs: actions.reduce((sum, a) => sum + Number(a.outputCount || 0), 0),
    approvals: actions.filter(a => String(a.approvalPolicy || '').toLowerCase().includes('approval')).length,
    risk: actions.filter(a => ['medium','high'].includes(a.costCreditRisk)).length,
  };

  if (!state) return <div style={{ padding: 24 }}>Loading Agent Action Catalog…</div>;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 24, background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16 }}>
          <ActionCatalogHero totals={totals}/>
          <ActionCatalogOrchestrator/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <ActionMetric label="Action cards" value={totals.cards} tone="brand"/>
          <ActionMetric label="Local outputs" value={totals.outputs} tone="success"/>
          <ActionMetric label="Approval-gated" value={totals.approvals} tone="warning"/>
          <ActionMetric label="Cost/credit watch" value={totals.risk} tone="purple"/>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" variant={filter==='all'?'primary':'secondary'} onClick={()=>setFilter('all')}>All</Button>
          {categories.map(c => <Button key={c} size="sm" variant={filter===c?'primary':'secondary'} onClick={()=>setFilter(c)}>{c}</Button>)}
          {['ready','queued','blocked'].map(s => <Button key={s} size="sm" variant={filter===s?'primary':'secondary'} onClick={()=>setFilter(s)}>{s}</Button>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          {filtered.map(action => <AgentActionCard key={action.id} action={action}/>) }
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 16 }}>
          <ActionPanel title="Routing principle" icon={<Icons.Radar size={15}/>}>
            <div style={{ display: 'grid', gap: 10 }}>
              <ActionGuardrail text="Parent orchestrator routes work to specialists; it does not become a 50-tool mega-agent."/>
              <ActionGuardrail text="Each card declares owner specialist, tools/plugins, input contract, output artifact, receipts, and escalation triggers."/>
              <ActionGuardrail text="External sends, replies, calls, customer-visible changes, Apollo spend, private/financial access, and purchases remain approval-gated."/>
              <ActionGuardrail text="This v1 is local dashboard state only: no live sends, no Apollo calls, no external spend."/>
            </div>
          </ActionPanel>
          <ActionPanel title="Latest catalog receipts" icon={<Icons.Activity size={15}/>}>
            <div style={{ display: 'grid', gap: 8 }}>
              {receipts.filter(r => String(r.type || '').includes('catalog') || String(r.type || '').includes('automation')).slice(0, 8).map(r => <ActionReceiptLine key={r.id} r={r}/>) }
              {!receipts.length && <div style={{ color: 'var(--fg-tertiary)', fontSize: 14 }}>No receipts logged yet.</div>}
            </div>
          </ActionPanel>
        </div>
      </div>
    </div>
  );
}

function ActionCatalogHero({ totals }) {
  return <div style={{ background: 'linear-gradient(135deg, rgba(17,24,39,.96), rgba(249,115,22,.76))', color: '#fff', borderRadius: 24, padding: 24, minHeight: 220, boxShadow: '0 24px 80px rgba(42,34,23,0.12)' }}>
    <div className="section-label" style={{ color: 'rgba(255,255,255,.72)' }}>Agent Action Catalog v1</div>
    <div style={{ fontSize: 40, fontWeight: 950, letterSpacing: '-0.055em', marginTop: 8 }}>Specialist cards, not a mega-agent.</div>
    <div style={{ color: 'rgba(255,255,255,.86)', fontSize: 16, lineHeight: 1.45, marginTop: 10, maxWidth: 820 }}>n8n/Apify-style action cards for OpSpot lead gen, audit, enrichment, queues, reply handling, ranking, content, and briefs. Adriana/parent stays the router and decision surface.</div>
    <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
      <ActionHeroPill label={`${totals.cards} cards`}/><ActionHeroPill label="local state only"/><ActionHeroPill label="approval gates visible"/><ActionHeroPill label="receipts required"/>
    </div>
  </div>;
}
function ActionCatalogOrchestrator() { return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 20 }}><div className="section-label">Final role</div><div style={{ fontSize: 25, fontWeight: 950, letterSpacing: '-0.035em', marginTop: 6 }}>Adriana routes, specialists execute.</div><div style={{ color: 'var(--fg-secondary)', lineHeight: 1.45, marginTop: 8 }}>The catalog makes the delegation map visible: what can run alone, what drafts only, what needs Colton, and what escalates.</div><div style={{ display: 'grid', gap: 9, marginTop: 16 }}><ActionMiniRow label="Router" value="parent orchestrator"/><ActionMiniRow label="Execution" value="bounded specialist agents"/><ActionMiniRow label="State" value="dashboard/state/mission-control.json"/><ActionMiniRow label="Receipts" value="dashboard/state/receipts.jsonl"/></div></div>; }
function AgentActionCard({ action }) {
  const riskTone = action.costCreditRisk === 'high' ? 'critical' : action.costCreditRisk === 'medium' ? 'warning' : 'success';
  const statusTone = action.status === 'blocked' ? 'critical' : action.status === 'running' ? 'info' : action.status === 'ready' ? 'success' : 'brand';
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
    <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ActionIcon type={action.icon}/></div>
      <div style={{ minWidth: 0, flex: 1 }}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><div style={{ fontSize: 18, fontWeight: 950, letterSpacing: '-0.02em' }}>{action.name}</div><Pill tone={statusTone}>{action.status}</Pill><Pill tone={riskTone}>{action.costCreditRisk} risk</Pill></div><div style={{ color: 'var(--fg-secondary)', fontSize: 13.5, lineHeight: 1.45, marginTop: 5 }}>{action.summary}</div></div>
      <div style={{ textAlign: 'right' }}><div className="section-label">Output</div><div style={{ fontSize: 28, fontWeight: 950 }}>{action.outputCount ?? 0}</div></div>
    </div>
    <div style={{ padding: 14, display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}><ActionMiniMetric label="Last run" value={action.lastRun || 'not run'}/><ActionMiniMetric label="Next run" value={action.nextRun || 'manual'}/><ActionMiniMetric label="Approval" value={action.approvalShort || 'see policy'}/></div>
      <ActionCardSection label="Specialist agent" value={action.specialistAgent}/>
      <ActionCardSection label="Tools / plugins" value={(action.tools || []).join(' · ')}/>
      <ActionCardSection label="Inputs needed" value={(action.inputsNeeded || []).join(' · ')}/>
      <ActionCardSection label="Outputs" value={(action.outputs || []).join(' · ')}/>
      <ActionCardSection label="Approval policy" value={action.approvalPolicy}/>
      <ActionCardSection label="Receipts" value={(action.receipts || []).join(' · ')}/>
      <ActionCardSection label="Escalation triggers" value={(action.escalationTriggers || []).join(' · ')}/>
    </div>
  </div>;
}
function ActionIcon({ type }) { const map = { maps: Icons.Target, audit: Icons.Search, enrich: Icons.Globe, email: Icons.Mail, imessage: Icons.Send, reply: Icons.Bell, call: Icons.Phone, content: Icons.Wand, brief: Icons.Radar }; const I = map[type] || Icons.Bot; return <I size={19}/>; }
function ActionMetric({ label, value, tone }) { const colors={success:'#22c55e',brand:'#f97316',warning:'#f59e0b',purple:'#a855f7'}; return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}><div className="section-label">{label}</div><div style={{ fontSize: 30, fontWeight: 950, color: colors[tone] || 'var(--accent)', marginTop: 3 }}>{value}</div></div>; }
function ActionPanel({ title, icon, children }) { return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}><div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900 }}>{icon}{title}</div><div style={{ padding: 14 }}>{children}</div></div>; }
function ActionGuardrail({ text }) { return <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}><Icons.Check size={14} style={{ color: '#22c55e', marginTop: 2, flexShrink: 0 }}/><span>{text}</span></div>; }
function ActionMiniRow({ label, value }) { return <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 9 }}><span className="section-label">{label}</span><span style={{ fontWeight: 800, textAlign: 'right' }}>{value}</span></div>; }
function ActionMiniMetric({ label, value }) { return <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 10, background: 'var(--surface-elevated)' }}><div className="section-label">{label}</div><div style={{ fontSize: 12.5, fontWeight: 850, marginTop: 4, color: 'var(--fg-primary)' }}>{value}</div></div>; }
function ActionCardSection({ label, value }) { return <div><div className="section-label">{label}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>{value || '—'}</div></div>; }
function ActionHeroPill({ label }) { return <span style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 800 }}>{label}</span>; }
function ActionReceiptLine({ r }) { return <div style={{ borderBottom: '1px solid var(--border)', padding: '7px 0' }}><div style={{ fontSize: 13, fontWeight: 850 }}>{r.type}</div><div style={{ color: 'var(--fg-tertiary)', fontSize: 12 }}>{r.at} {r.action ? `· ${r.action}` : ''}</div>{r.meta?.summary && <div style={{ color: 'var(--fg-secondary)', fontSize: 12, marginTop: 3 }}>{r.meta.summary}</div>}</div>; }

Object.assign(window, { AgentActionCatalogScreen });

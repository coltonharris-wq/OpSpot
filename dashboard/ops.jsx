// Ops + Autopilot Tab v1 — visibility layer, no live sends.
const { useState: uSt_Ops, useEffect: uEf_Ops, useMemo: uMe_Ops } = React;

function OpsAutopilotScreen() {
  const [state, setState] = uSt_Ops(null);
  const [receipts, setReceipts] = uSt_Ops([]);

  const load = async () => {
    const next = await window.mcLoadState?.();
    setState(next || {});
    const rs = await window.mcReceipts?.();
    setReceipts((rs?.receipts || []).slice(-40).reverse());
  };
  uEf_Ops(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const policy = state?.autopilotPolicy || {};
  const runs = state?.automationRuns || [];
  const queue = state?.outboundQueue || [];
  const quiet = uMe_Ops(() => opsQuietStatus(policy), [policy?.quietHours]);
  const leadSources = state?.leadSources || [];
  const workflowMetadata = state?.workflowMetadata || [];
  const sendReceipts = receipts.filter(r => String(r.type || '').includes('outbound') || String(r.type || '').includes('automation'));

  if (!state) return <div style={{ padding: 24 }}>Loading Ops cockpit…</div>;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 24, background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 16 }}>
          <OpsHeroStatus policy={policy} quiet={quiet}/>
          <OpsPolicyCard policy={policy}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <OpsMetric label="Email cap" value={`${policy?.dailyCaps?.email?.used || 0}/${policy?.dailyCaps?.email?.limit || 0}`} tone="info"/>
          <OpsMetric label="iMessage cap" value={`${policy?.dailyCaps?.imessage?.used || 0}/${policy?.dailyCaps?.imessage?.limit || 0}`} tone="success"/>
          <OpsMetric label="Queued sends" value={queue.length} tone="brand"/>
          <OpsMetric label="Lead source rows" value={leadSources.length} tone="purple"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 16 }}>
          <OpsPanel title="Automation lanes" icon={<Icons.Activity size={15}/>}>
            <div style={{ display: 'grid', gap: 10 }}>
              {runs.map(run => <OpsAutomationLane key={run.id} run={run}/>)}
            </div>
          </OpsPanel>

          <OpsPanel title="OpsGuardrails" icon={<Icons.Check size={15}/>}>
            <OpsGuardrail text="No live sends in v1 — this tab is visibility + queued prep." good/>
            <OpsGuardrail text="No outbound or prospect/customer replies 8pm–8am ET." good/>
            <OpsGuardrail text="Only Colton gets responses during quiet hours." good/>
            <OpsGuardrail text="Opt-outs, angry replies, legal/money/account issues escalate." good/>
          </OpsPanel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 16 }}>
          <OpsPanel title="Lead Machine / source lane" icon={<Icons.Target size={15}/>}>
            <div style={{ display: 'grid', gap: 10 }}>
              {leadSources.map(lead => <OpsLeadSourceRow key={lead.id} lead={lead}/>)}
              {!leadSources.length && <OpsEmptyLine text="No lead source rows yet. Specialist research agents will feed this lane."/>}
            </div>
          </OpsPanel>
          <OpsPanel title="Orchestrator workflow metadata" icon={<Icons.Bot size={15}/>}>
            <div style={{ display: 'grid', gap: 10 }}>
              {workflowMetadata.map(flow => <OpsWorkflowMetadata key={flow.id} flow={flow}/>)}
              {!workflowMetadata.length && <OpsEmptyLine text="No workflow metadata yet."/>}
            </div>
          </OpsPanel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 16 }}>
          <OpsPanel title="Prepared outbound queue" icon={<Icons.Send size={15}/>}>
            <div style={{ display: 'grid', gap: 10 }}>
              {queue.map(item => <OpsQueuedSend key={item.id} item={item}/>) }
              {!queue.length && <OpsEmptyLine text="No queued sends yet. Research/audit agents will feed this."/>}
            </div>
          </OpsPanel>
          <OpsPanel title="Latest receipts" icon={<Icons.Activity size={15}/>}>
            <div style={{ display: 'grid', gap: 8 }}>
              {sendReceipts.slice(0, 10).map(r => <OpsReceiptLine key={r.id} r={r}/>) }
              {!sendReceipts.length && <OpsEmptyLine text="No automation receipts yet."/>}
            </div>
          </OpsPanel>
        </div>
      </div>
    </div>
  );
}

function opsQuietStatus(policy) {
  const q = policy?.quietHours || { start: 20, end: 8, tz: 'America/New_York' };
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: q.tz || 'America/New_York', hour: 'numeric', hour12: false }).formatToParts(new Date());
  const hour = Number(parts.find(p => p.type === 'hour')?.value || 0);
  const start = Number(q.start ?? 20), end = Number(q.end ?? 8);
  const cold = start > end ? (hour >= start || hour < end) : (hour >= start && hour < end);
  return { cold, label: cold ? 'COLD / QUIET HOURS' : 'SEND WINDOW OPEN', next: cold ? 'Next send window: 8:00am ET' : 'Freeze returns: 8:00pm ET' };
}

function OpsHeroStatus({ policy, quiet }) {
  return <div style={{ background: quiet.cold ? 'linear-gradient(135deg, rgba(15,23,42,.92), rgba(67,56,202,.86))' : 'linear-gradient(135deg, rgba(22,101,52,.90), rgba(249,115,22,.80))', color: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 24px 80px rgba(42,34,23,0.12)', minHeight: 210 }}>
    <div className="section-label" style={{ color: 'rgba(255,255,255,.72)' }}>Outbound autopilot</div>
    <div style={{ fontSize: 38, fontWeight: 950, letterSpacing: '-0.055em', marginTop: 8 }}>{quiet.label}</div>
    <div style={{ fontSize: 16, lineHeight: 1.45, color: 'rgba(255,255,255,.86)', maxWidth: 680, marginTop: 10 }}>{quiet.cold ? 'No outbound, no customer/prospect replies. Agents can research, audit, enrich, rank, and queue work for morning.' : 'Policy window is open. Sends still require the send runner to be deliberately enabled; v1 is visibility only.'}</div>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
      <OpsPill label={quiet.next}/><OpsPill label={`${policy?.radius || 'Wilmington + 25 miles'}`}/><OpsPill label="50 email / 50 iMessage daily cap"/>
    </div>
  </div>;
}

function OpsPolicyCard({ policy }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 20 }}>
    <div className="section-label">Approved starter policy</div>
    <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.035em', marginTop: 6 }}>Construction + home services</div>
    <div style={{ color: 'var(--fg-secondary)', lineHeight: 1.45, marginTop: 8 }}>{(policy?.verticals || []).join(', ')}</div>
    <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
      <OpsMiniRow label="Email" value={policy?.senders?.email || 'colton.harris@automioapp.com'}/>
      <OpsMiniRow label="iMessage" value={policy?.senders?.imessage || 'Personal iPhone for now'}/>
      <OpsMiniRow label="Future" value={policy?.senders?.future || 'Dedicated business iPhone on M5 Max'}/>
      <OpsMiniRow label="Mode" value="Policy-approved autopilot; receipts required"/>
    </div>
  </div>;
}

function OpsPanel({ title, icon, children }) { return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}><div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900 }}>{icon}{title}</div><div style={{ padding: 14 }}>{children}</div></div>; }
function OpsMetric({ label, value, tone }) { const colors={info:'#3b82f6',success:'#22c55e',brand:'#f97316',purple:'#a855f7'}; return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}><div className="section-label">{label}</div><div style={{ fontSize: 30, fontWeight: 950, color: colors[tone] || 'var(--accent)', marginTop: 3 }}>{value}</div></div>; }
function OpsAutomationLane({ run }) { const c = run.status === 'blocked' ? '#ef4444' : run.status === 'running' ? '#3b82f6' : run.status === 'queued' ? '#f59e0b' : '#22c55e'; return <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 13 }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: c }}/><div style={{ fontWeight: 900 }}>{run.name}</div></div><div style={{ color: 'var(--fg-secondary)', fontSize: 13, marginTop: 4 }}>{run.summary}</div><div style={{ color: 'var(--fg-tertiary)', fontSize: 12, marginTop: 5 }}>Last: {run.lastRun || 'not run'} · Next: {run.nextRun || 'manual'}</div></div><div style={{ textAlign: 'right' }}><div className="section-label">Output</div><div style={{ fontSize: 22, fontWeight: 900 }}>{run.outputCount ?? 0}</div></div></div>; }
function OpsQueuedSend({ item }) { return <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 13, background: 'var(--surface-elevated)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div style={{ fontWeight: 900 }}>{item.lead}</div><span className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{item.channel}</span></div><div style={{ color: 'var(--fg-secondary)', fontSize: 13, marginTop: 4 }}>{item.angle}</div><div style={{ color: 'var(--fg-tertiary)', fontSize: 12, marginTop: 6 }}>Scheduled: {item.scheduledFor} · Status: {item.status}</div></div>; }
function OpsLeadSourceRow({ lead }) { return <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 13, background: 'var(--surface-elevated)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div style={{ fontWeight: 900 }}>{lead.business}</div><span className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{lead.vertical}</span></div><div style={{ color: 'var(--fg-secondary)', fontSize: 13, marginTop: 4 }}>{lead.city} · {lead.distance || lead.source}</div><div style={{ color: 'var(--fg-tertiary)', fontSize: 12, marginTop: 6 }}>{lead.researchNotes}</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}><OpsTag label={`audit ${lead.auditScore ?? 'pending'}`}/><OpsTag label={lead.apolloEligible ? 'Apollo eligible' : 'Apollo false'}/><OpsTag label={lead.status}/></div></div>; }
function OpsWorkflowMetadata({ flow }) { return <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 13, background: 'var(--surface-elevated)' }}><div style={{ fontWeight: 900 }}>{flow.workflow}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 13, marginTop: 5 }}>{flow.orchestratorRole}</div><div style={{ color: 'var(--fg-tertiary)', fontSize: 12, marginTop: 7 }}>Specialists: {flow.specialistAgent}</div><div style={{ color: 'var(--fg-tertiary)', fontSize: 12, marginTop: 5 }}>Approval: {flow.approvalPolicy}</div><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 11, marginTop: 7 }}>Receipts: {flow.receiptPath}</div></div>; }
function OpsTag({ label }) { return <span className="term" style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '3px 7px', fontSize: 10.5, color: 'var(--fg-secondary)' }}>{label}</span>; }
function OpsReceiptLine({ r }) { return <div style={{ borderBottom: '1px solid var(--border)', padding: '7px 0' }}><div style={{ fontSize: 13, fontWeight: 850 }}>{r.type}</div><div style={{ color: 'var(--fg-tertiary)', fontSize: 12 }}>{r.at} {r.action ? `· ${r.action}` : ''}</div></div>; }
function OpsGuardrail({ text }) { return <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}><Icons.Check size={14} style={{ color: '#22c55e', marginTop: 2, flexShrink: 0 }}/><span>{text}</span></div>; }
function OpsMiniRow({ label, value }) { return <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 9 }}><span className="section-label">{label}</span><span style={{ fontWeight: 800, textAlign: 'right' }}>{value}</span></div>; }
function OpsPill({ label }) { return <span style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 800 }}>{label}</span>; }
function OpsEmptyLine({ text }) { return <div style={{ color: 'var(--fg-tertiary)', fontSize: 14, padding: 8 }}>{text}</div>; }

Object.assign(window, { OpsAutopilotScreen });

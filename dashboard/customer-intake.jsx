// Customer Intake / Document Agent v1 — local-only skeleton for turning a new client into setup tasks.
// No external account reads, inbox access, file uploads, or sends. This is a cockpit
// for approved docs/notes and the questions a human still needs to answer.
const { useState: uSt_CI, useEffect: uEf_CI, useMemo: uMe_CI } = React;

const CUSTOMER_INTAKE_FALLBACK = {
  version: 1,
  updatedAt: '2026-05-08T13:45:00.000Z',
  mode: 'local-placeholder-only',
  approvalPolicy: 'draft_only_until_customer_consent_and_colton_approval',
  customers: [
    {
      id: 'jarid-paperclip',
      name: 'Jarid / Paperclip',
      stage: 'setup',
      priority: 'urgent',
      consent: 'pending',
      docs: ['Telegram/OpenClaw agent goal', 'Memory/customer setup notes', 'Provider/infra cost watch'],
      missing: ['Confirm second-month payment status', 'Pick first live dopamine-producing workflow', 'Approve account/plugin access path'],
      nextAgentAction: 'Prepare customer setup checklist and access request packet; do not connect accounts or send messages.',
    },
    {
      id: 'digital-wave',
      name: 'Digital Wave',
      stage: 'brief-ready',
      priority: 'high',
      consent: 'not connected',
      docs: ['DIGITAL-WAVE-MEETING-BRIEF-2026-05-07.md'],
      missing: ['Confirm first automation wedge', 'Map approved tools/accounts', 'Define owner approval gates'],
      nextAgentAction: 'Convert meeting brief into implementation checklist and proof packet skeleton.',
    },
    {
      id: 'opspot-internal',
      name: 'OpSpot Internal Dogfood',
      stage: 'active',
      priority: 'high',
      consent: 'owned',
      docs: ['Mission Control queue', 'Outbound/content/inbound skeletons', 'Receipts ledger'],
      missing: ['Replace placeholder lead data with approved source rows', 'Attach real artifacts to approval cards'],
      nextAgentAction: 'Keep all automations local-only and surface approve/deny/defer cards before external action.',
    },
  ],
  intakeQuestions: [
    'What is the customer paying for first: reply handling, missed-call recovery, content, onboarding, or ops cleanup?',
    'Which accounts/tools are explicitly approved to connect?',
    'What must always come back to Colton before execution?',
    'What evidence proves the setup worked?',
  ],
  documentAgentSteps: [
    'Collect approved notes/docs only',
    'Extract customer goals, accounts, constraints, and approval gates',
    'Generate setup checklist + missing info questions',
    'Create queue cards for build/test/handoff',
    'Write receipt packet; wait for approval before external actions',
  ],
};

function CustomerIntakeScreen() {
  const [state, setState] = uSt_CI(CUSTOMER_INTAKE_FALLBACK);
  const [activeId, setActiveId] = uSt_CI(CUSTOMER_INTAKE_FALLBACK.customers[0].id);

  uEf_CI(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const live = await window.mcLoadState?.();
        if (!cancelled && live?.customerIntake) setState({ ...CUSTOMER_INTAKE_FALLBACK, ...live.customerIntake });
      } catch (e) { console.warn('customer intake load failed', e); }
    };
    load();
  }, []);

  const customers = state?.customers || [];
  const active = customers.find(c => c.id === activeId) || customers[0];
  const metrics = uMe_CI(() => ({
    customers: customers.length,
    urgent: customers.filter(c => c.priority === 'urgent').length,
    waitingConsent: customers.filter(c => c.consent !== 'owned' && c.consent !== 'approved').length,
    missing: customers.reduce((sum, c) => sum + (c.missing?.length || 0), 0),
  }), [customers]);

  if (!active) return <PlaceholderScreen title="Customer Intake" desc="No customer intake records loaded yet."/>;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 24, background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
          <div className="cockpit-grid" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
            <div className="term" style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 11, letterSpacing: '.08em', marginBottom: 8 }}>CUSTOMER INTAKE · DOCUMENT AGENT · LOCAL ONLY</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 8 }}>Turn messy customer context into safe setup cards.</div>
            <div style={{ color: 'var(--fg-secondary)', fontSize: 13, maxWidth: 760, lineHeight: 1.55 }}>
              The document agent can organize approved notes, briefs, and access questions. It cannot read private accounts, upload docs, send messages, or connect tools until consent + Colton approval are explicit.
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Policy</div>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.55 }}>{state.approvalPolicy}</div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['no external reads', 'no live sends', 'approval-first', 'receipts required'].map(x => <Badge key={x} tone="warning">{x}</Badge>)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <CustomerIntakeMetric label="Customers" value={metrics.customers} tone="brand"/>
          <CustomerIntakeMetric label="Urgent" value={metrics.urgent} tone="warning"/>
          <CustomerIntakeMetric label="Consent pending" value={metrics.waitingConsent} tone="purple"/>
          <CustomerIntakeMetric label="Missing answers" value={metrics.missing} tone="info"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {customers.map(c => (
              <button key={c.id} onClick={() => setActiveId(c.id)} className="card-h" style={{ textAlign: 'left', background: c.id === active.id ? 'var(--surface-elevated)' : 'var(--surface)', border: `1px solid ${c.id === active.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: 14, cursor: 'pointer', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</div>
                  <Badge tone={c.priority === 'urgent' ? 'warning' : 'brand'}>{c.priority}</Badge>
                </div>
                <div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 11 }}>{c.stage} · consent: {c.consent}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <CustomerPanel title="Approved docs / context" items={active.docs}/>
            <CustomerPanel title="Missing info" items={active.missing} tone="warning"/>
            <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>Next safe agent action</div>
              <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--fg-primary)' }}>{active.nextAgentAction}</div>
            </div>
            <CustomerPanel title="Document agent workflow" items={state.documentAgentSteps}/>
            <CustomerPanel title="Intake questions" items={state.intakeQuestions}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerIntakeMetric({ label, value, tone = 'brand' }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 10.5, marginBottom: 6 }}>{label.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color: tone === 'warning' ? 'var(--warning)' : tone === 'info' ? 'var(--info)' : tone === 'purple' ? '#a855f7' : 'var(--accent)' }}>{value}</div></div>;
}

function CustomerPanel({ title, items = [], tone = 'brand' }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}><div className="section-label" style={{ marginBottom: 12 }}>{title}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{items.map((it, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--fg-secondary)', fontSize: 13, lineHeight: 1.45 }}><span style={{ color: tone === 'warning' ? 'var(--warning)' : 'var(--accent)', fontWeight: 900 }}>•</span><span>{it}</span></div>)}</div></div>;
}

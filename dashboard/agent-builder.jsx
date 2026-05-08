// Agent Builder — Tell Me What You Want → parent orchestrator workflow proposal
const AGENT_BUILDER_EXAMPLES = [
  'Find HVAC companies that miss calls after hours and draft outreach, but do not send anything.',
  'Build a customer onboarding workflow for roofers from intake to first automation live.',
  'Audit local med spas for appointment leaks and prepare proposal packets for approval.',
];

const ORCHESTRATOR_POLICIES = {
  outbound: {
    segment: 'Local service businesses with visible revenue leakage',
    sources: ['Google Maps / Places', 'Business website', 'Public reviews', 'Public social profiles'],
    audit: ['Confirm business is active', 'Detect missed-call/contact leaks', 'Check offer-fit and exclusion rules', 'Score ROI before enrichment'],
    enrichmentGate: 'Only enrich contacts after fit score ≥ 72 and duplicate check passes.',
    channels: ['Email draft', 'Call script', 'CRM note'],
    agents: [
      ['Parent Orchestrator', 'Defines workflow, asks clarifiers, enforces policy, routes specialists'],
      ['Research Scout', 'Finds candidate accounts from approved public sources'],
      ['Audit Agent', 'Scores leaks, screenshots proof, calculates ROI hypothesis'],
      ['Enrichment Agent', 'Adds contacts only after gate passes'],
      ['Outreach Composer', 'Drafts channel-specific copy; never sends'],
      ['Receipt Clerk', 'Writes proof packet, caps ledger, and run log'],
    ],
    outputs: ['workflow.json', 'target-list.csv', 'audit-proof-pack.pdf', 'approval-queue.md', 'receipts/run-log.jsonl'],
  },
  onboarding: {
    segment: 'New customer account after close / handoff',
    sources: ['Approved intake form', 'Customer website', 'Connected inbox/CRM after consent', 'Existing proposal'],
    audit: ['Map current workflow', 'Identify permissions needed', 'Separate draft-only vs executable automations', 'Confirm owner approval points'],
    enrichmentGate: 'No private account inspection until customer consent + plugin connection is confirmed.',
    channels: ['Internal task cards', 'Customer approval note', 'Setup checklist'],
    agents: [
      ['Parent Orchestrator', 'Builds plan, permissions, gates, specialist assignments'],
      ['Intake Analyst', 'Turns rough notes into setup requirements'],
      ['Systems Mapper', 'Maps CRM/inbox/calendar/tool connections'],
      ['Automation Builder', 'Creates draft automations behind approval'],
      ['QA Auditor', 'Tests dry-run paths and rollback notes'],
      ['Receipt Clerk', 'Packages handoff and evidence'],
    ],
    outputs: ['customer-setup-plan.md', 'permissions-needed.md', 'automation-drafts.json', 'qa-checklist.md', 'receipts/handoff.md'],
  },
  audit: {
    segment: 'Prospects or customers needing an operational leak audit',
    sources: ['Public web presence', 'Reviews', 'Ads/library if public', 'Approved customer data when connected'],
    audit: ['Find response-time leaks', 'Find conversion leaks', 'Rank by revenue impact', 'Capture receipts for every claim'],
    enrichmentGate: 'Claims without source receipts stay as hypotheses and cannot enter proposal copy.',
    channels: ['Audit card', 'Proposal draft', 'Approval packet'],
    agents: [
      ['Parent Orchestrator', 'Sets audit scope and evidence standard'],
      ['Source Collector', 'Collects URLs/screenshots/transcripts'],
      ['Leak Analyst', 'Scores severity and ROI'],
      ['Proposal Drafter', 'Turns verified leaks into offer language'],
      ['QA Auditor', 'Checks claim/source alignment'],
      ['Receipt Clerk', 'Builds proof packet'],
    ],
    outputs: ['audit-card.md', 'proof-screenshots/', 'roi-notes.md', 'proposal-draft.md', 'receipts/audit-log.jsonl'],
  },
};

function inferBuilderPolicy(intent) {
  const text = (intent || '').toLowerCase();
  if (/onboard|setup|implementation|customer|handoff/.test(text)) return 'onboarding';
  if (/audit|leak|proposal|roi|proof/.test(text)) return 'audit';
  return 'outbound';
}

function WorkflowField({ label, children }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="section-label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--fg-primary)' }}>{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{items.map(i => <Pill key={i} tone="neutral" dot={false}>{i}</Pill>)}</div>;
}

function AgentBuilderScreen() {
  const [intent, setIntent] = React.useState('Find local service businesses leaking revenue from missed calls and create draft outreach for approval.');
  const policyKey = inferBuilderPolicy(intent);
  const policy = ORCHESTRATOR_POLICIES[policyKey];
  const receiptRoot = `/ops/workflows/${policyKey}-${new Date().toISOString().slice(0,10)}/`;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 0.9fr) minmax(520px, 1.1fr)', gap: 14, alignItems: 'start' }}>
        <Card padding={18} accent>
          <div className="term" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Tell Me What You Want · Parent Orchestrator</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8 }}>Rough intent in. Governed specialist workflow out.</div>
          <div style={{ color: 'var(--fg-secondary)', fontSize: 13.5, lineHeight: 1.45, marginBottom: 14 }}>The parent does not hoard 50 tools. It proposes policy, gates, specialists, caps, and receipts; Colton steers/approves; specialists execute only the approved slice.</div>
          <textarea value={intent} onChange={e=>setIntent(e.target.value)} placeholder="Example: find med spas with slow response times and draft outreach…" style={{ width: '100%', minHeight: 136, resize: 'vertical', background: 'var(--canvas)', color: 'var(--fg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.45, outline: 'none', boxSizing: 'border-box' }}/>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {AGENT_BUILDER_EXAMPLES.map((ex, i) => <Button key={i} size="xs" variant="ghost" onClick={()=>setIntent(ex)}>Use example {i+1}</Button>)}
          </div>
        </Card>

        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Brain size={18}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Workflow Proposal Card</div>
              <div className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)', letterSpacing: '0.05em' }}>STATUS: DRAFT · NEEDS COLTON APPROVAL BEFORE EXECUTION</div>
            </div>
            <Pill tone="brand" dot>Parent-led</Pill>
          </div>

          <div style={{ padding: '0 16px 14px' }}>
            <WorkflowField label="Target segment">{policy.segment}</WorkflowField>
            <WorkflowField label="Sources"><BulletList items={policy.sources}/></WorkflowField>
            <WorkflowField label="Audit steps"><BulletList items={policy.audit}/></WorkflowField>
            <WorkflowField label="Enrichment gate"><Pill tone="warning">Gate required</Pill><span style={{ marginLeft: 8 }}>{policy.enrichmentGate}</span></WorkflowField>
            <WorkflowField label="Channels"><BulletList items={policy.channels}/></WorkflowField>
            <WorkflowField label="Caps + quiet hours"><BulletList items={['Max 25 prospects/run', '$12 draft-run compute cap', 'No external sends', 'Quiet hours 19:00–09:00 local', 'Stop on 2 source failures']}/></WorkflowField>
            <WorkflowField label="Approval policy"><BulletList items={['Parent can draft plan alone', 'Research can use public sources', 'Enrichment needs gate pass', 'External send/customer mutation needs approval', 'Every claim needs a receipt']}/></WorkflowField>
            <WorkflowField label="Required tools/plugins/skills"><BulletList items={['browser/research', 'Google Places', 'CRM adapter placeholder', 'email draft composer', 'screenshot receipts', 'caps ledger']}/></WorkflowField>
            <WorkflowField label="Specialist agents">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                {policy.agents.map(([name, role]) => (
                  <div key={name} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--surface-elevated)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.35 }}>{role}</div>
                  </div>
                ))}
              </div>
            </WorkflowField>
            <WorkflowField label="Outputs + receipt paths"><BulletList items={policy.outputs.map(o => receiptRoot + o)}/></WorkflowField>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14 }}>
              <Button variant="primary" icon={<Icons.Bolt size={14}/>} onClick={()=>alert('Kickstart placeholder: next step is approval card → specialist agent run queue.')}>Kickstart approval placeholder</Button>
              <Button variant="secondary" icon={<Icons.Check size={14}/>} onClick={()=>alert('Approval placeholder: would freeze policy, caps, tools, and specialist handoff brief.')}>Approve draft</Button>
              <span className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 11 }}>No live external action wired in v1.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { AgentBuilderScreen });

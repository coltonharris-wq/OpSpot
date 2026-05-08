// Salvage Map — selective HEXT backend/workflow parts surfaced inside Mission Control.
// HEXT is a parts bin, not canonical backend. Mission Control is the canonical frontend.

const HEXT_SALVAGE_MODULES = [
  {
    id: 'guided-onboarding',
    title: 'Guided onboarding / Add Business flow',
    tab: 'Onboarding',
    status: 'salvage-first',
    tone: 'brand',
    source: [
      'docs/superpowers/specs/2026-05-03-add-business-guided-flow-design.md',
      'src/app/(portal)/onboarding/page.tsx',
      'src/app/(portal)/businesses/page.tsx',
      'src/app/(portal)/businesses/[id]/page.tsx',
    ],
    why: 'Already describes the path from business name/website → audit → recommended AI employees → proposal → demo → close → onboarding.',
    next: 'Convert into Mission Control onboarding stack: Intake, Audit, Recommend, Proposal, Demo, Close, Provision.',
  },
  {
    id: 'audit-engine',
    title: 'Audit automation',
    tab: 'Audit',
    status: 'salvage',
    tone: 'warning',
    source: [
      'src/lib/audit-stub.ts',
      'src/components/audit-report.tsx',
      'src/app/legacy/audit/actions.ts',
      'src/app/legacy/audit/intake/page.tsx',
      'src/app/legacy/audit/history/page.tsx',
    ],
    why: 'Deterministic audit scaffolding, history storage, and report UI exist. Good enough to port as a draft audit lane before real scrape/research is swapped in.',
    next: 'Expose as Audit tab + queue cards. Keep output labeled preliminary until real source checks exist.',
  },
  {
    id: 'proposal-close',
    title: 'Proposal / close workspace',
    tab: 'Proposals',
    status: 'high-value',
    tone: 'success',
    source: [
      'src/lib/proposal.ts',
      'src/components/close-workspace.tsx',
      'src/app/legacy/close/actions.ts',
      'src/app/legacy/close/page.tsx',
    ],
    why: 'Proposal markdown generation, save flow, ROI insertion, invoice draft path, and channel handoff buttons already exist.',
    next: 'Port into Mission Control as a deal close card with Approve, Save Draft, Invoice Draft, and Handoff actions.',
  },
  {
    id: 'inbound-cadence',
    title: 'Inbound + follow-up cadence',
    tab: 'Inbound',
    status: 'useful',
    tone: 'info',
    source: [
      'src/lib/inbound.ts',
      'src/lib/cadence.ts',
      'src/lib/touches.ts',
      'src/app/api/cron/cadence/route.ts',
      'src/components/inbox-panel.tsx',
    ],
    why: 'There is a SQLite-backed model for inbound rows, touches, cadence candidates, and stale lead detection.',
    next: 'Feed overdue replies and stale leads into Mission Queue as approval cards instead of a separate CRM screen.',
  },
  {
    id: 'lead-pipeline',
    title: 'Lead pipeline + vault leads',
    tab: 'Pipeline',
    status: 'selective',
    tone: 'purple',
    source: [
      'src/lib/leads.ts',
      'src/lib/leads-write.ts',
      'src/components/lead-board-shell.tsx',
      'src/components/pipeline-brief.tsx',
      'src/app/legacy/pipeline/actions.ts',
    ],
    why: 'Lead file parsing, stage movement, touch history, and projected pipeline helpers are reusable if they match the OpSpot vault model.',
    next: 'Use only the data helpers and merge into the existing Mission Control Pipeline tab.',
  },
  {
    id: 'openclaw-chat-api',
    title: 'OpenClaw chat/API bridge',
    tab: 'Agents',
    status: 'maybe',
    tone: 'neutral',
    source: [
      'src/lib/openclaw.ts',
      'src/lib/openclaw-chat.ts',
      'src/app/api/openclaw/chat/route.ts',
      'src/app/api/openclaw/history/route.ts',
      'src/components/openclaw-chat-panel.tsx',
    ],
    why: 'May help Mission Control talk to agents/sessions if cleaner than current static/live bridge.',
    next: 'Audit against current OpenClaw gateway APIs before porting. Do not duplicate live bridge blindly.',
  },
];

const PLACEHOLDER_TABS = [
  { id: 'customers', title: 'Customers', icon: Icons.Building, desc: 'Active accounts, setup state, agents, spend caps, receipts.' },
  { id: 'approvals', title: 'Approvals', icon: Icons.Check, desc: 'HEXT-style deep decision pages inside the Mission Control card language.' },
  { id: 'onboarding', title: 'Onboarding', icon: Icons.Stack, desc: 'Customer intake → audit → proposal → provision → live handoff.' },
  { id: 'audit', title: 'Audit', icon: Icons.Search, desc: 'Preliminary ops audits, leaks, ROI math, and proof packets.' },
  { id: 'proposals', title: 'Proposals', icon: Icons.Mail, desc: 'Proposal drafts, pricing, invoice drafts, and close packets.' },
  { id: 'inbound', title: 'Inbound', icon: Icons.Phone, desc: 'Lead intake, replies, missed calls, website/forms, and triage.' },
  { id: 'outbound', title: 'Outbound', icon: Icons.Send, desc: 'Draft-only outreach queues, approvals, suppression, and receipts.' },
  { id: 'support', title: 'Support', icon: Icons.Bot, desc: 'Customer support agent queue, thread summaries, fixes, escalations.' },
  { id: 'branding', title: 'Branding', icon: Icons.Wand, desc: 'Brand kit, profile kit, business cards, screenshots, public trust assets.' },
  { id: 'resources', title: 'Resources', icon: Icons.Box, desc: 'Templates, scripts, SOPs, customer setup docs, reusable assets.' },
];

function SalvageScreen({ onNav }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 16 }}>
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Icons.Spark size={18} style={{ color: 'var(--accent)' }}/>
            <div className="section-label">Canonical decision</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>
            Mission Control is the frontend. HEXT is a parts bin.
          </div>
          <div style={{ color: 'var(--fg-secondary)', fontSize: 13, lineHeight: 1.55, maxWidth: 820 }}>
            This preview does not merge anything. It surfaces what can be salvaged from HEXT — onboarding, audit, proposals, inbound/cadence, pipeline helpers, and maybe OpenClaw chat API — so Colton can approve the shape before we move it into the OpSpot project and GitHub.
          </div>
        </Card>
        <Card padding={20}>
          <div className="section-label" style={{ marginBottom: 12 }}>Merge rule</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Rule good text="Visible tab/route before backend counts as done" />
            <Rule good text="Mission Queue = required work" />
            <Rule good text="Swipe Deck = suggestions/dispatch" />
            <Rule text="Do not make all HEXT backend canonical" />
          </div>
        </Card>
      </div>

      <Card padding={0} style={{ marginBottom: 18 }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="h3" style={{ margin: 0 }}>New OpSpot tabs</div>
            <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 3 }}>Click these now — the same tabs should also appear in the left sidebar after refresh.</div>
          </div>
          <Pill tone="success">visible routes</Pill>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 0 }}>
          {PLACEHOLDER_TABS.map((t) => <MiniTab key={t.id} tab={t} onNav={onNav}/>) }
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
        {HEXT_SALVAGE_MODULES.map((m) => <SalvageCard key={m.id} module={m} onNav={onNav}/>) }
      </div>

      <Card padding={0}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="h3" style={{ margin: 0 }}>Tabs to add to Mission Control</div>
            <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 3 }}>Placeholders first, then wire real workflows behind them.</div>
          </div>
          <Pill tone="brand">preview only</Pill>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 0 }}>
          {PLACEHOLDER_TABS.map((t) => <MiniTab key={t.id} tab={t} onNav={onNav}/>) }
        </div>
      </Card>
    </div>
  );
}

function Rule({ text, good = false }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-secondary)' }}>
    {good ? <Icons.Check size={14} style={{ color: 'var(--success)' }}/> : <Icons.X size={14} style={{ color: 'var(--critical)' }}/>}<span>{text}</span>
  </div>;
}

function SalvageCard({ module, onNav }) {
  return (
    <Card padding={16} hover style={{ minHeight: 245, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Pill tone={module.tone}>{module.status}</Pill>
        <span className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)' }}>{module.tab}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{module.title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--fg-secondary)', lineHeight: 1.45, marginBottom: 12 }}>{module.why}</div>
      <div style={{ marginTop: 'auto' }}>
        <div className="section-label" style={{ marginBottom: 6 }}>Source files</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
          {module.source.slice(0, 3).map((s) => <code key={s} style={{ fontSize: 10.5, color: 'var(--fg-tertiary)' }}>{s}</code>)}
          {module.source.length > 3 && <span style={{ fontSize: 10.5, color: 'var(--fg-disabled)' }}>+{module.source.length - 3} more</span>}
        </div>
        <div style={{ padding: 10, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.4 }}>
          <b style={{ color: 'var(--fg-primary)' }}>Next:</b> {module.next}
        </div>
      </div>
    </Card>
  );
}

function MiniTab({ tab, onNav }) {
  const Icon = tab.icon;
  return (
    <div onClick={() => onNav?.(tab.id)} className="row-hover" style={{ padding: 14, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', cursor: 'pointer', minHeight: 112 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} style={{ color: 'var(--accent)' }}/>
        <div style={{ fontWeight: 800, fontSize: 13 }}>{tab.title}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.4 }}>{tab.desc}</div>
    </div>
  );
}

function ModulePlaceholderScreen({ id, title, desc }) {
  const matches = HEXT_SALVAGE_MODULES.filter(m => m.tab.toLowerCase() === title.toLowerCase() || m.id.includes(id));
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 18 }}>
      <Card padding={20} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Icons.Stack size={18} style={{ color: 'var(--accent)' }}/>
          <div className="section-label">Module placeholder</div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em' }}>{title}</div>
        <div style={{ color: 'var(--fg-secondary)', fontSize: 13, marginTop: 6, maxWidth: 760 }}>{desc}</div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card padding={16}>
          <div className="h3" style={{ marginTop: 0 }}>What goes here</div>
          <div style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.6 }}>
            This tab is intentionally visible before the backend is merged. It should get real cards, receipts, and approval actions as the salvage work lands.
          </div>
        </Card>
        <Card padding={16}>
          <div className="h3" style={{ marginTop: 0 }}>Salvage candidates</div>
          {(matches.length ? matches : HEXT_SALVAGE_MODULES.slice(0, 2)).map(m => (
            <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <Pill tone={m.tone}>{m.status}</Pill>
              <div style={{ fontWeight: 800, fontSize: 13, marginTop: 6 }}>{m.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 4 }}>{m.source[0]}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { SalvageScreen, ModulePlaceholderScreen, HEXT_SALVAGE_MODULES, PLACEHOLDER_TABS });

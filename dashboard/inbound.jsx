// Inbound / Reply Handler — local-only skeleton from the n8n agent swarm pattern.
// No inbox/iMessage reads and no live sends. This tab classifies placeholder inbound,
// shows escalation gates, and suggests next actions for the operator.
const { useState: useState_Inbound, useMemo: useMemo_Inbound } = React;

const INBOUND_CATEGORIES = [
  { id: 'interested', label: 'Interested', tone: 'success', rule: 'Positive buying signal, asks for pricing/demo, or says they want help.' },
  { id: 'question', label: 'Question', tone: 'info', rule: 'Needs factual answer before they can move forward.' },
  { id: 'objection', label: 'Objection', tone: 'warning', rule: 'Price/timing/trust/fit concern but not a hard no.' },
  { id: 'opt-out', label: 'Opt-out', tone: 'neutral', rule: 'Unsubscribe/stop/remove me. Do not reply except compliance confirmation if approved.' },
  { id: 'angry', label: 'Angry', tone: 'critical', rule: 'Threat, complaint, profanity, legal/privacy concern, or brand-risk language.' },
  { id: 'wrong person', label: 'Wrong person', tone: 'neutral', rule: 'Not the decision maker or says this is not their role/company.' },
  { id: 'booked', label: 'Booked', tone: 'success', rule: 'Meeting/demo already scheduled or asks to lock a time.' },
  { id: 'needs Colton', label: 'Needs Colton', tone: 'purple', rule: 'Strategic, sensitive, unclear, financial, partner, or high-context request.' },
];

const INBOUND_ESCALATION_RULES = [
  'Always escalate: angry, legal/privacy, refund/chargeback, press/public complaint, custom pricing, partner/channel deal, or any request to send from Colton directly.',
  'Draft-only: questions, objections, wrong-person handoffs, and opt-out confirmations. Human approval before any external send.',
  'Autopilot-safe later: classification, thread summary, CRM/task card creation, suggested next action, and reminder scheduling drafts.',
  'Never do in v1: live inbox/iMessage reads, sending replies, deleting threads, changing calendar events, or billing changes.',
];

const INBOUND_SWARM_STEPS = [
  { id: 'ingest', label: '1 · Ingest', owner: 'Watcher', desc: 'Receive local placeholder event or future inbox webhook. Normalize sender, channel, thread, and recency.' },
  { id: 'classify', label: '2 · Classify', owner: 'Triage Agent', desc: 'Assign one of 8 categories, confidence, sentiment, urgency, and reason.' },
  { id: 'policy', label: '3 · Policy Gate', owner: 'Safety Agent', desc: 'Check opt-out, angry/legal, private/financial, or Colton-only escalation rules.' },
  { id: 'suggest', label: '4 · Suggest', owner: 'Reply Agent', desc: 'Produce next-action card and draft reply only when allowed. No sends.' },
  { id: 'route', label: '5 · Route', owner: 'Router', desc: 'Create queue card, mark needs Colton, or hand to sales/support workflow.' },
];

const INBOUND_SEED_THREADS = [
  {
    id: 'inb-001',
    sender: 'Marco · Apex Plumbing',
    channel: 'email placeholder',
    received: '8m ago',
    body: 'This looks useful. What does the $197/mo include and can it answer missed calls after hours?',
    source: 'local placeholder',
  },
  {
    id: 'inb-008',
    sender: 'Sue · Roofing Co.',
    channel: 'email placeholder',
    received: '14m ago',
    body: 'Interested — send pricing and the next step for getting this live.',
    source: 'local placeholder',
  },
  {
    id: 'inb-002',
    sender: 'Unknown roofing owner',
    channel: 'sms placeholder',
    received: '22m ago',
    body: 'Stop texting me. Remove this number.',
    source: 'local placeholder',
  },
  {
    id: 'inb-003',
    sender: 'Jen · Brightway Solar',
    channel: 'website form placeholder',
    received: '41m ago',
    body: 'Friday at 2 works for the demo. Send the invite to jen@brightway.example.',
    source: 'local placeholder',
  },
  {
    id: 'inb-004',
    sender: 'Rick · Northpoint Hardware',
    channel: 'email placeholder',
    received: '1h ago',
    body: 'I am not the right person, but our operations manager would own this.',
    source: 'local placeholder',
  },
  {
    id: 'inb-005',
    sender: 'Casey · Lakeside Electrical',
    channel: 'email placeholder',
    received: '2h ago',
    body: 'Feels expensive for us right now. Why would this beat just hiring a receptionist?',
    source: 'local placeholder',
  },
  {
    id: 'inb-006',
    sender: 'Private partner lead',
    channel: 'dm placeholder',
    received: '3h ago',
    body: 'Can Colton look at this? I want to discuss reseller terms and whether we can white-label the whole system.',
    source: 'local placeholder',
  },
  {
    id: 'inb-007',
    sender: 'Anonymous',
    channel: 'form placeholder',
    received: '4h ago',
    body: 'This is spam and I am going to post about it if you contact me again.',
    source: 'local placeholder',
  },
];

function classifyInbound(text) {
  const lower = String(text || '').toLowerCase();
  const hit = (...words) => words.some(w => lower.includes(w));
  if (hit('stop', 'unsubscribe', 'remove me', 'do not contact', 'don’t contact')) return inboundResult('opt-out', 96, 'Explicit opt-out language.', 'Suppress future outreach; draft compliance confirmation only if approved.');
  if (hit('spam', 'lawyer', 'legal', 'post about it', 'angry', 'furious', 'complaint', 'sue')) return inboundResult('angry', 94, 'Brand/legal risk or angry language.', 'Escalate to Colton; do not draft a casual reply.');
  if (hit('colton', 'reseller terms', 'white-label', 'partner', 'custom pricing', 'investment', 'private')) return inboundResult('needs Colton', 88, 'Strategic or high-context request.', 'Summarize context and ask Colton for direction.');
  if (hit('works for', 'book', 'scheduled', 'invite', 'calendar', 'demo at', 'see you')) return inboundResult('booked', 92, 'Scheduling/booking confirmation.', 'Prepare calendar/CRM update draft; do not send invite without approval.');
  if (hit('not the right person', 'wrong person', 'not my role', 'operations manager', 'owner is')) return inboundResult('wrong person', 86, 'Recipient indicates another owner.', 'Ask for correct contact or create handoff task.');
  if (hit('expensive', 'cost', 'too much', 'not now', 'already have', 'hiring a receptionist', 'why would')) return inboundResult('objection', 84, 'Buying concern rather than hard no.', 'Draft short ROI/alternative response for approval.');
  if (hit('interested', 'want this', 'send pricing', 'tell me more', 'yes')) return inboundResult('interested', 80, 'Positive buying signal.', 'Create hot lead card and suggest next CTA.');
  if (hit('?', 'what', 'how', 'does it', 'include', 'can it', 'pricing', 'looks useful')) return inboundResult('question', 82, 'Prospect needs factual answer.', 'Draft answer with one CTA and approval gate.');
  return inboundResult('needs Colton', 55, 'Low-confidence / ambiguous inbound.', 'Escalate because classification is uncertain.');
}

function inboundResult(category, confidence, reason, nextAction) {
  const cfg = INBOUND_CATEGORIES.find(c => c.id === category) || INBOUND_CATEGORIES[7];
  const needsApproval = ['interested', 'question', 'objection', 'opt-out', 'wrong person', 'booked'].includes(category);
  const escalate = ['angry', 'needs Colton'].includes(category) || confidence < 70;
  return { category, label: cfg.label, tone: cfg.tone, confidence, reason, nextAction, needsApproval, escalate };
}

function draftForClassification(thread, classification) {
  const name = String(thread.sender || 'there').split('·')[0].trim();
  const drafts = {
    interested: `Thanks ${name} — yes, this is exactly the kind of workflow OpSpot can cover. Best next step is a quick setup/demo so we can map missed calls + follow-up before quoting.` ,
    question: `Great question, ${name}. The base setup covers missed-call capture, after-hours response, lead triage, and follow-up suggestions. I’d confirm the exact scope before we send anything formal.` ,
    objection: `Totally fair, ${name}. The comparison is usually receptionist hours vs. saved missed leads + faster follow-up. I’d show the simple ROI math before asking you to decide.` ,
    'opt-out': `Understood — we’ll remove this contact from future outreach.` ,
    'wrong person': `Thanks for the heads up. Who is the right operations/contact person for this, and is it okay if we reach out with context?` ,
    booked: `Perfect — we’ll prep the invite/details and make sure the demo covers the exact workflow you asked about.` ,
    angry: '',
    'needs Colton': '',
  };
  return drafts[classification.category] || '';
}

function InboundReplyHandlerScreen({ onOpenTask }) {
  const [threads, setThreads] = useState_Inbound(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mc.inboundThreads') || 'null');
      return Array.isArray(saved) && saved.length ? saved : INBOUND_SEED_THREADS;
    } catch { return INBOUND_SEED_THREADS; }
  });
  const [filter, setFilter] = useState_Inbound('all');
  const [selectedId, setSelectedId] = useState_Inbound(threads[0]?.id);
  const [composer, setComposer] = useState_Inbound('');

  const enriched = useMemo_Inbound(() => threads.map(t => {
    const classification = t.override ? inboundResult(t.override, 99, 'Manual operator override.', 'Review route and next action after manual classification.') : classifyInbound(t.body);
    return { ...t, classification, draft: draftForClassification(t, classification) };
  }), [threads]);
  const selected = enriched.find(t => t.id === selectedId) || enriched[0];
  const visible = filter === 'all' ? enriched : enriched.filter(t => t.classification.category === filter);
  const counts = INBOUND_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.id]: enriched.filter(t => t.classification.category === c.id).length }), {});
  const escalations = enriched.filter(t => t.classification.escalate).length;
  const approvals = enriched.filter(t => t.classification.needsApproval).length;

  const persist = (next) => {
    setThreads(next);
    try { localStorage.setItem('mc.inboundThreads', JSON.stringify(next)); } catch {}
  };
  const addPlaceholder = () => {
    const body = composer.trim() || 'New placeholder reply: interested, but asking whether the setup can start this week.';
    const next = [{ id: `inb-${Date.now()}`, sender: 'Manual placeholder', channel: 'local placeholder', received: 'now', body, source: 'operator typed' }, ...threads];
    persist(next);
    setSelectedId(next[0].id);
    setComposer('');
  };
  const overrideSelected = (category) => {
    if (!selected) return;
    persist(threads.map(t => t.id === selected.id ? { ...t, override: category } : t));
  };
  const makeTask = (thread) => {
    if (!thread || !window.writeAddedTask) return;
    const task = {
      id: `inbound-${Date.now()}`,
      title: `Inbound: ${thread.classification.label} · ${thread.sender}`,
      product: 'p2',
      status: thread.classification.escalate ? 'review' : 'planning',
      agent: thread.classification.escalate ? 'me' : null,
      priority: thread.classification.escalate || thread.classification.category === 'interested' ? 'high' : 'normal',
      cost: 0,
      estCost: 0,
      source: 'inbound-placeholder',
      impact: thread.classification.escalate ? 88 : 70,
      complexity: 'S',
      age: '0m',
      progress: 0,
      pr: null,
      notes: `${thread.classification.reason} Next: ${thread.classification.nextAction}`,
    };
    window.writeAddedTask(task);
    onOpenTask?.(task);
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '360px minmax(560px, 1fr) 340px', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ borderRight: '1px solid var(--border)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icons.Mail size={16} style={{ color: 'var(--accent)' }}/>
            <div className="section-label">Local reply queue</div>
            <span style={{ flex: 1 }}/>
            <Pill tone="neutral" mono>{enriched.length}</Pill>
          </div>
          <textarea value={composer} onChange={e=>setComposer(e.target.value)} placeholder="Paste placeholder inbound text… no live inbox reads." style={{ width: '100%', minHeight: 76, resize: 'vertical', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--fg-primary)', padding: 10, fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.4 }}/>
          <Button size="sm" variant="primary" icon={<Icons.Plus size={13}/>} onClick={addPlaceholder} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>Add placeholder inbound</Button>
        </div>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, overflowX: 'auto' }}>
          <Button size="xs" variant="ghost" active={filter==='all'} onClick={()=>setFilter('all')}>all</Button>
          {INBOUND_CATEGORIES.map(c => <Button key={c.id} size="xs" variant="ghost" active={filter===c.id} onClick={()=>setFilter(c.id)}>{c.label} {counts[c.id] || 0}</Button>)}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {visible.map(thread => (
            <Card key={thread.id} hover padding={12} onClick={()=>setSelectedId(thread.id)} accent={selected?.id===thread.id} style={{ marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Pill tone={thread.classification.tone}>{thread.classification.label}</Pill>
                <span className="mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{thread.classification.confidence}%</span>
                <span style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{thread.received}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 5 }}>{thread.sender}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.45 }}>{thread.body.slice(0, 128)}{thread.body.length > 128 ? '…' : ''}</div>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ minHeight: 0, overflow: 'auto', padding: 18 }}>
        <Card padding={18} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icons.Radar size={18} style={{ color: 'var(--accent)' }}/>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em' }}>Inbound / Reply Handler</div>
              <div style={{ fontSize: 12.5, color: 'var(--fg-secondary)', marginTop: 3 }}>n8n-style swarm skeleton · local placeholders only · no sends</div>
            </div>
            <span style={{ flex: 1 }}/>
            <Pill tone={escalations ? 'critical' : 'success'}>{escalations} escalations</Pill>
            <Pill tone="warning">{approvals} approval drafts</Pill>
          </div>
        </Card>

        {selected && (
          <Card padding={18} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Avatar name={selected.sender} size={38} tone={{ critical: 'pink', warning: 'brand' }[selected.classification.tone] || selected.classification.tone}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{selected.sender}</div>
                  <Pill tone={selected.classification.tone}>{selected.classification.label}</Pill>
                  {selected.classification.escalate && <Pill tone="critical">Escalate</Pill>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 14 }}>{selected.channel} · {selected.received} · {selected.source}</div>
                <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--border)', lineHeight: 1.55, fontSize: 14 }}>{selected.body}</div>
              </div>
            </div>
          </Card>
        )}

        {selected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Card padding={16}>
              <SectionHeader label="Classification"/>
              <div style={{ display: 'grid', gap: 10 }}>
                <MetricRow label="Category" value={selected.classification.label}/>
                <MetricRow label="Confidence" value={`${selected.classification.confidence}%`}/>
                <MetricRow label="Reason" value={selected.classification.reason}/>
                <MetricRow label="Next action" value={selected.classification.nextAction}/>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {INBOUND_CATEGORIES.map(c => <Button key={c.id} size="xs" variant="outline" onClick={()=>overrideSelected(c.id)}>{c.label}</Button>)}
              </div>
            </Card>
            <Card padding={16}>
              <SectionHeader label="Suggested draft" action={<Pill tone="warning">approval required</Pill>}/>
              {selected.draft ? (
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.55 }}>{selected.draft}</div>
              ) : (
                <div style={{ padding: 12, borderRadius: 10, border: '1px dashed var(--border-strong)', fontSize: 13, color: 'var(--fg-tertiary)', lineHeight: 1.55 }}>No auto-draft. This route requires Colton/context review first.</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button size="sm" variant="secondary" icon={<Icons.Plus size={13}/>} onClick={()=>makeTask(selected)}>Create queue card</Button>
                <Button size="sm" variant="ghost" disabled>Send disabled</Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <div style={{ borderLeft: '1px solid var(--border)', minHeight: 0, overflow: 'auto', padding: 14, background: 'var(--surface-elevated)' }}>
        <Card padding={14} style={{ marginBottom: 12 }}>
          <SectionHeader label="Swarm pattern"/>
          {INBOUND_SWARM_STEPS.map(step => (
            <div key={step.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--accent)', marginTop: 7, flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900 }}>{step.label}</div>
                <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>{step.owner}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.45, marginTop: 4 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </Card>
        <Card padding={14}>
          <SectionHeader label="Escalation rules"/>
          {INBOUND_ESCALATION_RULES.map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--fg-secondary)', lineHeight: 1.5, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <Icons.Flag size={13} style={{ color: i === 0 ? 'var(--critical)' : 'var(--fg-tertiary)', marginTop: 2, flexShrink: 0 }}/>
              <div>{rule}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 10, alignItems: 'start' }}>
      <div className="section-label" style={{ paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--fg-primary)', lineHeight: 1.45 }}>{value}</div>
    </div>
  );
}

Object.assign(window, { InboundReplyHandlerScreen, classifyInbound, INBOUND_CATEGORIES, INBOUND_ESCALATION_RULES });

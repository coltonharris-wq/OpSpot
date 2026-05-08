// Customer Intake / Document Agent v1 — local-only skeleton inspired by invoice OCR flows.
// Upload/file placeholder → extract fields → store original/source link → update customer/lead record → receipt.
// No external account reads, private drive access, sends, or customer-visible mutations.
const { useState: uSt_CI, useEffect: uEf_CI, useMemo: uMe_CI } = React;

const CUSTOMER_INTAKE_FALLBACK = {
  version: 2,
  updatedAt: '2026-05-08T13:50:00.000Z',
  mode: 'local-placeholder-only',
  approvalPolicy: 'draft_only_until_customer_consent_and_colton_approval',
  fields: [
    { key: 'company', label: 'Company' },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'website', label: 'Website' },
    { key: 'services', label: 'Services' },
    { key: 'currentTools', label: 'Current tools' },
    { key: 'accessNeeded', label: 'Access needed' },
    { key: 'offerPricing', label: 'Offer / pricing' },
    { key: 'approvalBlockers', label: 'Approval blockers' },
  ],
  customers: [
    {
      id: 'jarid-paperclip',
      name: 'Jarid / Paperclip',
      stage: 'setup',
      priority: 'urgent',
      consent: 'pending',
      sourceLinks: ['Telegram/OpenClaw agent goal', 'Memory/customer setup notes'],
      docs: ['Telegram/OpenClaw agent goal', 'Memory/customer setup notes', 'Provider/infra cost watch'],
      extracted: {
        company: 'Paperclip customer setup',
        contact: 'Jarid',
        services: 'Hosted Paperclip + Telegram/OpenClaw agent workflow',
        currentTools: 'Telegram, OpenClaw, Paperclip',
        accessNeeded: 'Approved account/plugin path still pending',
        approvalBlockers: 'Consent/payment/access confirmation required',
      },
      missing: ['Confirm second-month payment status', 'Pick first live dopamine-producing workflow', 'Approve account/plugin access path'],
      nextAgentAction: 'Prepare customer setup checklist and access request packet; do not connect accounts or send messages.',
      receipts: ['local-intake-seed-jarid'],
    },
    {
      id: 'digital-wave',
      name: 'Digital Wave',
      stage: 'brief-ready',
      priority: 'high',
      consent: 'not connected',
      sourceLinks: ['DIGITAL-WAVE-MEETING-BRIEF-2026-05-07.md'],
      docs: ['DIGITAL-WAVE-MEETING-BRIEF-2026-05-07.md'],
      extracted: {
        company: 'Digital Wave',
        services: 'Ops/audit automation candidate',
        accessNeeded: 'Approved tool/account map',
        approvalBlockers: 'Confirm first automation wedge and owner gates',
      },
      missing: ['Confirm first automation wedge', 'Map approved tools/accounts', 'Define owner approval gates'],
      nextAgentAction: 'Convert meeting brief into implementation checklist and proof packet skeleton.',
      receipts: ['local-intake-seed-digital-wave'],
    },
    {
      id: 'opspot-internal',
      name: 'OpSpot Internal Dogfood',
      stage: 'active',
      priority: 'high',
      consent: 'owned',
      sourceLinks: ['Mission Control state', 'Receipts ledger'],
      docs: ['Mission Control queue', 'Outbound/content/inbound skeletons', 'Receipts ledger'],
      extracted: {
        company: 'OpSpot.ai',
        contact: 'Colton',
        services: 'Mission Control + AI employee operations',
        currentTools: 'OpenClaw, Business OS, local dashboard state',
        approvalBlockers: 'External/customer-visible actions still gated',
      },
      missing: ['Replace placeholder lead data with approved source rows', 'Attach real artifacts to approval cards'],
      nextAgentAction: 'Keep all automations local-only and surface approve/deny/defer cards before external action.',
      receipts: ['local-intake-seed-opspot'],
    },
  ],
  documentQueue: [
    {
      id: 'sample-invoice-ocr-style',
      status: 'extracted',
      sourceName: 'Sample onboarding note / invoice-OCR pattern',
      sourceLink: 'local://placeholder/customer-intake/sample-onboarding-note',
      customerId: 'opspot-internal',
      extracted: {
        company: 'OpSpot.ai',
        contact: 'Colton Harris',
        website: 'https://opspot.ai',
        services: 'Customer onboarding automation, document intake, approval-gated AI employees',
        currentTools: 'OpenClaw Mission Control, Business OS, receipts ledger',
        accessNeeded: 'Only explicit customer-approved files/accounts',
        offerPricing: 'Placeholder until proposal/invoice is approved',
        approvalBlockers: 'No external sends, account connects, or customer-visible changes without Colton approval',
      },
      confidence: 0.78,
      receipt: 'receipt-local-2026-05-08-customer-intake-sample',
      createdAt: '2026-05-08T13:50:00.000Z',
    },
  ],
  intakeQuestions: [
    'What is the customer paying for first: reply handling, missed-call recovery, content, onboarding, or ops cleanup?',
    'Which document/source did this come from and can we keep a link to the original?',
    'Which accounts/tools are explicitly approved to connect?',
    'What must always come back to Colton before execution?',
    'What evidence proves the setup worked?',
  ],
  documentAgentSteps: [
    'Upload or paste an approved local file/note placeholder',
    'Extract customer, contact, website, services, tools, access needs, offer/pricing, blockers',
    'Store original file name/source link beside the extracted record',
    'Update the selected customer/lead record locally',
    'Write a receipt with before/after, missing fields, and next safe action',
  ],
};

const EMPTY_EXTRACT = Object.fromEntries(CUSTOMER_INTAKE_FALLBACK.fields.map(f => [f.key, '']));

function CustomerIntakeScreen() {
  const [state, setState] = uSt_CI(CUSTOMER_INTAKE_FALLBACK);
  const [activeId, setActiveId] = uSt_CI(CUSTOMER_INTAKE_FALLBACK.customers[0].id);
  const [sourceName, setSourceName] = uSt_CI('New customer onboarding note');
  const [sourceLink, setSourceLink] = uSt_CI('local://placeholder/customer-intake/new-note');
  const [rawText, setRawText] = uSt_CI('Company: Example Roofing Co\nContact: Sam Owner\nEmail: sam@example.com\nPhone: (555) 010-2026\nWebsite: https://example-roofing.test\nServices: missed-call recovery and quote follow-up\nCurrent tools: Gmail, Google Calendar, Housecall Pro\nAccess needed: inbox forwarding, call recordings, booking calendar\nOffer/pricing: $497/mo setup placeholder\nApproval blockers: owner approval before any customer send');
  const [draft, setDraft] = uSt_CI(EMPTY_EXTRACT);
  const [lastReceipt, setLastReceipt] = uSt_CI(null);

  uEf_CI(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const live = await window.mcLoadState?.();
        if (!cancelled && live?.customerIntake) setState(mergeCustomerIntake(live.customerIntake));
      } catch (e) { console.warn('customer intake load failed', e); }
    };
    load();
  }, []);

  const customers = state?.customers || [];
  const active = customers.find(c => c.id === activeId) || customers[0];
  const queue = state?.documentQueue || [];
  const metrics = uMe_CI(() => ({
    customers: customers.length,
    docs: queue.length,
    extracted: queue.filter(d => d.status === 'extracted' || d.status === 'applied').length,
    missing: customers.reduce((sum, c) => sum + (c.missing?.length || 0), 0),
  }), [customers, queue]);

  const runExtract = () => {
    const next = extractCustomerFields(rawText, state.fields);
    setDraft(next);
  };

  const applyDraft = () => {
    if (!active) return;
    const now = new Date().toISOString();
    const extracted = stripEmpty(draft);
    const docId = `doc-${Date.now()}`;
    const receipt = {
      id: `receipt-local-${Date.now()}`,
      createdAt: now,
      customerId: active.id,
      sourceName,
      sourceLink,
      fieldsUpdated: Object.keys(extracted),
      missing: missingFields(extracted, state.fields),
      nextSafeAction: 'Review extracted fields, fill missing answers, then create approval-gated setup card. No external actions taken.',
    };
    const doc = { id: docId, status: 'applied', sourceName, sourceLink, customerId: active.id, extracted, confidence: scoreConfidence(extracted, state.fields), receipt: receipt.id, createdAt: now };
    const nextCustomers = customers.map(c => c.id === active.id ? {
      ...c,
      stage: c.stage === 'setup' || c.stage === 'active' ? c.stage : 'intake-review',
      docs: Array.from(new Set([...(c.docs || []), sourceName])),
      sourceLinks: Array.from(new Set([...(c.sourceLinks || []), sourceLink])),
      extracted: { ...(c.extracted || {}), ...extracted },
      missing: receipt.missing.map(k => labelFor(k, state.fields)),
      receipts: [receipt.id, ...(c.receipts || [])].slice(0, 6),
      nextAgentAction: receipt.nextSafeAction,
    } : c);
    setState(prev => ({ ...prev, updatedAt: now, customers: nextCustomers, documentQueue: [doc, ...(prev.documentQueue || [])], receipts: [receipt, ...(prev.receipts || [])].slice(0, 20) }));
    setLastReceipt(receipt);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceName(file.name);
    setSourceLink(`local-file-placeholder://${file.name}`);
    const reader = new FileReader();
    reader.onload = () => setRawText(String(reader.result || '').slice(0, 8000));
    reader.readAsText(file);
  };

  if (!active) return <PlaceholderScreen title="Customer Intake" desc="No customer intake records loaded yet."/>;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 24, background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
          <div className="cockpit-grid" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
            <div className="term" style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 11, letterSpacing: '.08em', marginBottom: 8 }}>CUSTOMER INTAKE · DOCUMENT AGENT · LOCAL ONLY</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 8 }}>Turn an uploaded doc/note into a customer setup record.</div>
            <div style={{ color: 'var(--fg-secondary)', fontSize: 13, maxWidth: 820, lineHeight: 1.55 }}>
              Invoice-OCR style skeleton: accept a local placeholder, extract onboarding fields, preserve the original/source link, update the customer/lead card, and produce a receipt. This is local UI/state only.
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Policy</div>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.55 }}>{state.approvalPolicy}</div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['local file placeholder', 'no external reads', 'no live sends', 'receipt required'].map(x => <Badge key={x} tone="warning">{x}</Badge>)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <CustomerIntakeMetric label="Customers" value={metrics.customers} tone="brand"/>
          <CustomerIntakeMetric label="Docs queued" value={metrics.docs} tone="info"/>
          <CustomerIntakeMetric label="Extracted" value={metrics.extracted} tone="success"/>
          <CustomerIntakeMetric label="Missing answers" value={metrics.missing} tone="warning"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '330px 1.05fr .95fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {customers.map(c => (
              <button key={c.id} onClick={() => setActiveId(c.id)} className="card-h" style={{ textAlign: 'left', background: c.id === active.id ? 'var(--surface-elevated)' : 'var(--surface)', border: `1px solid ${c.id === active.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: 14, cursor: 'pointer', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</div>
                  <Badge tone={c.priority === 'urgent' ? 'warning' : 'brand'}>{c.priority}</Badge>
                </div>
                <div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 11 }}>{c.stage} · consent: {c.consent}</div>
                <div style={{ marginTop: 8, color: 'var(--fg-secondary)', fontSize: 12 }}>{(c.docs || []).length} docs · {(c.receipts || []).length} receipts</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>1 · Upload / file placeholder</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <CustomerInput label="Source name" value={sourceName} onChange={setSourceName}/>
                <CustomerInput label="Original/source link" value={sourceLink} onChange={setSourceLink}/>
              </div>
              <input type="file" accept=".txt,.md,.csv,.json" onChange={onFile} style={{ marginBottom: 10, color: 'var(--fg-secondary)', fontSize: 12 }}/>
              <textarea value={rawText} onChange={e=>setRawText(e.target.value)} style={inputStyle({ minHeight: 170, resize: 'vertical', fontFamily: 'var(--font-mono)' })}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>Paste text or load a local text/markdown file. Browser-only placeholder; nothing is uploaded.</div>
                <button className="btn-h" onClick={runExtract} style={buttonStyle('brand')}>Extract fields</button>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>2 · Extracted fields</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {state.fields.map(f => <CustomerInput key={f.key} label={f.label} value={draft[f.key] || ''} onChange={v=>setDraft(d => ({ ...d, [f.key]: v }))}/>) }
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>Confidence: {Math.round(scoreConfidence(stripEmpty(draft), state.fields) * 100)}% · editable before applying</div>
                <button className="btn-h" onClick={applyDraft} style={buttonStyle('success')}>Update record + receipt</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>3 · Customer / lead record</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{active.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {Object.entries(active.extracted || {}).filter(([,v]) => v).map(([k,v]) => <FieldChip key={k} label={labelFor(k, state.fields)} value={v}/>) }
              </div>
              <CustomerPanel title="Original/source links" items={active.sourceLinks || []}/>
              <div style={{ height: 12 }}/>
              <CustomerPanel title="Missing info" items={active.missing || []} tone="warning"/>
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
                <div className="section-label" style={{ marginBottom: 8 }}>Next safe action</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-secondary)' }}>{active.nextAgentAction}</div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>4 · Receipt</div>
              {lastReceipt ? <ReceiptCard receipt={lastReceipt}/> : <div style={{ color: 'var(--fg-secondary)', fontSize: 13, lineHeight: 1.5 }}>No new receipt this session yet. Apply an extracted draft to generate a local receipt.</div>}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <CustomerPanel title="Document agent workflow" items={state.documentAgentSteps}/>
          <CustomerPanel title="Intake questions" items={state.intakeQuestions}/>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Document queue</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queue.slice(0, 5).map(d => <div key={d.id} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--surface-elevated)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 13 }}>{d.sourceName}</strong><Badge tone={d.status === 'applied' ? 'success' : 'brand'}>{d.status}</Badge></div>
                <div className="term" style={{ marginTop: 6, color: 'var(--fg-tertiary)', fontSize: 10.5 }}>{d.sourceLink}</div>
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function mergeCustomerIntake(live) {
  return {
    ...CUSTOMER_INTAKE_FALLBACK,
    ...live,
    version: Math.max(live.version || 1, CUSTOMER_INTAKE_FALLBACK.version),
    fields: live.fields?.length ? live.fields : CUSTOMER_INTAKE_FALLBACK.fields,
    documentQueue: live.documentQueue?.length ? live.documentQueue : CUSTOMER_INTAKE_FALLBACK.documentQueue,
  };
}

function extractCustomerFields(text, fields) {
  const out = {};
  const aliases = {
    company: ['company', 'business', 'customer', 'client'],
    contact: ['contact', 'owner', 'name'],
    email: ['email', 'e-mail'],
    phone: ['phone', 'mobile', 'tel'],
    website: ['website', 'site', 'url'],
    services: ['services', 'service', 'need', 'workflow', 'scope'],
    currentTools: ['current tools', 'tools', 'stack', 'software'],
    accessNeeded: ['access needed', 'access', 'accounts needed', 'login'],
    offerPricing: ['offer/pricing', 'offer', 'pricing', 'price', 'invoice', 'amount'],
    approvalBlockers: ['approval blockers', 'blockers', 'approval', 'risk', 'constraints'],
  };
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const f of fields) {
    const keys = aliases[f.key] || [f.label.toLowerCase(), f.key.toLowerCase()];
    const hit = lines.find(line => keys.some(k => line.toLowerCase().startsWith(k + ':')));
    if (hit) out[f.key] = hit.slice(hit.indexOf(':') + 1).trim();
  }
  if (!out.email) out.email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || '';
  if (!out.website) out.website = (text.match(/https?:\/\/[^\s,)]+/i) || [])[0] || '';
  if (!out.phone) out.phone = (text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || [])[0] || '';
  return { ...EMPTY_EXTRACT, ...out };
}

function stripEmpty(obj = {}) { return Object.fromEntries(Object.entries(obj).filter(([,v]) => String(v || '').trim())); }
function missingFields(extracted, fields) { return fields.filter(f => !extracted[f.key]).map(f => f.key); }
function scoreConfidence(extracted, fields) { return fields.length ? Object.keys(stripEmpty(extracted)).length / fields.length : 0; }
function labelFor(key, fields = []) { return fields.find(f => f.key === key)?.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()); }

function CustomerIntakeMetric({ label, value, tone = 'brand' }) {
  const color = tone === 'warning' ? 'var(--warning)' : tone === 'info' ? 'var(--info)' : tone === 'success' ? 'var(--success)' : 'var(--accent)';
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 10.5, marginBottom: 6 }}>{label.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div></div>;
}

function CustomerInput({ label, value, onChange }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><span className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 10.5 }}>{label}</span><input value={value} onChange={e=>onChange(e.target.value)} style={inputStyle()}/></label>;
}

function CustomerPanel({ title, items = [], tone = 'brand' }) {
  return <div><div className="section-label" style={{ marginBottom: 10 }}>{title}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{items.length ? items.map((it, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--fg-secondary)', fontSize: 13, lineHeight: 1.45 }}><span style={{ color: tone === 'warning' ? 'var(--warning)' : 'var(--accent)', fontWeight: 900 }}>•</span><span>{it}</span></div>) : <div style={{ color: 'var(--fg-tertiary)', fontSize: 13 }}>None yet.</div>}</div></div>;
}

function FieldChip({ label, value }) {
  return <div style={{ border: '1px solid var(--border)', background: 'var(--surface-elevated)', borderRadius: 9, padding: 9 }}><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 10 }}>{label}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 12.5, lineHeight: 1.35, marginTop: 4 }}>{value}</div></div>;
}

function ReceiptCard({ receipt }) {
  return <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-elevated)', padding: 12 }}>
    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>{receipt.id}</div>
    <div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 10.5, marginBottom: 8 }}>{receipt.createdAt}</div>
    <div style={{ color: 'var(--fg-secondary)', fontSize: 13, lineHeight: 1.5 }}>Source preserved: <strong>{receipt.sourceName}</strong><br/>{receipt.sourceLink}</div>
    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>{receipt.fieldsUpdated.map(f => <Badge key={f} tone="success">{f}</Badge>)}</div>
    <div style={{ marginTop: 8, color: 'var(--fg-secondary)', fontSize: 13 }}>Next: {receipt.nextSafeAction}</div>
  </div>;
}

function inputStyle(extra = {}) {
  return { width: '100%', boxSizing: 'border-box', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg-primary)', padding: '9px 10px', fontSize: 12.5, outline: 'none', ...extra };
}
function buttonStyle(tone = 'brand') {
  const bg = tone === 'success' ? 'rgba(34,197,94,0.16)' : 'var(--accent-soft)';
  const color = tone === 'success' ? 'var(--success)' : 'var(--accent)';
  return { border: '1px solid var(--border)', borderRadius: 8, background: bg, color, padding: '8px 11px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' };
}

Object.assign(window, { CustomerIntakeScreen });

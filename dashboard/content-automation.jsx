// Content Automation v1 — orchestrator-led, specialist-agent executed, local-only skeleton.
const { useState: useState_CA, useEffect: useEffect_CA } = React;

const CONTENT_V1_FALLBACK = {
  status: 'youtube_hitl_ready_for_colton_review',
  policyMode: 'local_draft_only_no_uploads_no_account_changes_no_spend',
  criticalArchitecturePrinciple: 'Parent orchestrator routes to YouTube/content specialists. No mega-agent with broad tools.',
  workflow: ['tell_me_what_you_want_intake', 'parent_workflow_policy_proposal', 'colton_swipe_approval', 'youtube_strategy_packet', 'ideas_research_packet', 'title_thumbnail_packet', 'hooks_scripts_longform_packet', 'producer_recording_packet', 'shorts_extraction_packet', 'metadata_publishing_checklist', 'human_final_upload_gate', 'receipts'],
  specialists: [
    { id: 'parent-orchestrator', name: 'Parent content orchestrator', role: 'Turns rough intent into a YouTube workflow/policy proposal, routes bounded specialists, tracks approvals/receipts, and escalates only true blockers.', tools: ['Mission Control state', 'Tell Me What You Want builder', 'approval queue', 'Business OS/vault', 'receipts ledger'], canDo: ['classify rough intent', 'propose workflow/policy', 'route specialists', 'continue after approved info/clicks', 'log receipts'], needsApproval: ['publishing policy', 'account/plugin/API connection', 'external mutation', 'spend', 'customer proof use'] },
    { id: 'youtube-strategy', name: 'YouTube strategy specialist', role: 'Viewer, offer angle, pillars, cadence, channel lane, and review gates.', tools: ['OpSpot profile kit', 'Hormozi reference note', 'YouTube reference log'], canDo: ['draft strategy', 'suggest cadence', 'rank pillars'], needsApproval: ['brand/channel lane', 'public positioning changes'] },
    { id: 'ideas-research', name: 'Ideas / research specialist', role: 'Mines OpSpot queue, Business OS, references, demos, and safe public examples.', tools: ['Business OS/vault search', 'YouTube reference log', 'repo/docs search'], canDo: ['cluster ideas', 'draft topic backlog', 'identify proof/examples'], needsApproval: ['private/customer proof', 'claims without sources'] },
    { id: 'title-thumbnail', name: 'Title / thumbnail specialist', role: 'Title variants, thumbnail concepts, promise clarity, and click-risk checks.', tools: ['title template', 'thumbnail brief', 'brand kit placeholder'], canDo: ['draft 10 titles', 'draft 3 thumbnail concepts', 'score clarity/curiosity'], needsApproval: ['final public title/thumbnail', 'misleading/high-claim promise'] },
    { id: 'hook-script', name: 'Hook / script specialist', role: 'Hormozi-style Hook + Meat + CTA, first 30 seconds, long-form outline, Shorts scripts.', tools: ['Hook/Meat/CTA template', 'script template', 'proof checker'], canDo: ['draft hooks', 'draft long-form structure', 'draft Shorts scripts', 'write CTA options'], needsApproval: ['strong claims', 'customer stories', 'final publish script'] },
    { id: 'producer-recording', name: 'Producer / recording specialist', role: 'Camera/mic checklist, shot list, screen recording prompts, b-roll/proof needs.', tools: ['camera/mic checklist', 'screen-recording checklist', 'file intake placeholder'], canDo: ['draft shot lists', 'request samples', 'prep recording prompts'], needsApproval: ['camera/mic choice', 'raw clip access', 'human recording/clicks'] },
    { id: 'editor-shorts', name: 'Editor / Shorts extraction specialist', role: 'Long-form chapters, cutdowns, Shorts candidates, captions, subtitle/style notes.', tools: ['transcript/clip tooling placeholder', 'video-frames placeholder', 'shorts extraction template'], canDo: ['draft cutdown plan', 'write captions', 'mark chapters'], needsApproval: ['external editor/tool use', 'export/upload', 'private footage handling'] },
    { id: 'metadata-publishing', name: 'Metadata / publishing specialist', role: 'Description, tags, chapters, pinned comment, end-screen checklist, schedule placeholder, upload approval card.', tools: ['YouTube metadata template', 'publishing checklist', 'approval card', 'YouTube plugin placeholder disabled'], canDo: ['draft metadata', 'prepare checklist', 'package final review card'], needsApproval: ['upload/schedule', 'public metadata changes', 'comments/replies', 'API/scheduler connection'] },
    { id: 'compliance-proof', name: 'Compliance / proof checker', role: 'Claims, permissions, private data, channel/account changes, spend, and scope creep.', tools: ['approval policy ledger', 'customer permission checklist', 'claim/source checklist'], canDo: ['flag risk', 'mark claims unsupported', 'request proof'], needsApproval: ['customer names/logos/results', 'private screenshots', 'spend', 'account changes'] },
  ],
  intakeQuestions: [
    'What rough idea, customer pain, demo, clip, or reference are we starting from?',
    'Should this become a Short, long-form, or both?',
    'Which channel lane: OpSpot brand, Colton founder, client/project, or undecided?',
    'What proof/receipt can we safely show?',
    'What CTA should this drive: audit, comment, DM, book, subscribe, or no hard CTA?',
  ],
  queueCards: [
    { id: 'intake', label: 'Tell Me What You Want intake', status: 'ready', output: 'structured rough-intent brief', owner: 'Parent content orchestrator' },
    { id: 'policy', label: 'Workflow + policy proposal', status: 'human_gate', output: 'specialists, tools, approvals, risks, next automation step', owner: 'Parent content orchestrator' },
    { id: 'strategy', label: 'YouTube strategy packet', status: 'ready', output: 'viewer, pain, offer angle, cadence, pillars', owner: 'YouTube strategy specialist' },
    { id: 'titles', label: 'Titles + thumbnails', status: 'ready', output: '10 titles + 3 thumbnail concepts + click-risk check', owner: 'Title / thumbnail specialist' },
    { id: 'script', label: 'Hooks + script', status: 'ready', output: 'hooks, first 30s, long-form outline, Shorts scripts, CTA', owner: 'Hook / script specialist' },
    { id: 'recording', label: 'Recording inputs', status: 'human_gate', output: 'camera/mic, sample videos, screen-recording checklist', owner: 'Producer / recording specialist' },
    { id: 'shorts', label: 'Shorts extraction', status: 'ready', output: '3-7 cutdowns, captions, chapter map', owner: 'Editor / Shorts extraction specialist' },
    { id: 'metadata', label: 'Metadata + publish checklist', status: 'human_gate', output: 'description, tags, chapters, pinned comment, upload approval card', owner: 'Metadata / publishing specialist' },
    { id: 'receipts', label: 'Receipts', status: 'ready', output: 'files changed, artifacts, blockers, next automation step', owner: 'Receipt clerk' },
  ],
  receipts: ['dashboard/state/receipts.jsonl', 'Business-OS/OPSPOT-YOUTUBE-HITL-WORKFLOW-2026-05-08.md'],
};

function ContentAutomationScreen() {
  const [state, setState] = useState_CA(null);
  const [intent, setIntent] = useState_CA('I have a rough OpSpot YouTube idea: business owners do not need another dashboard — they need the follow-up sent. Turn it into a long-form outline, Shorts cutdowns, title/thumbnail packet, proof list, CTA, metadata, and publishing checklist.');
  const [channel, setChannel] = useState_CA('hook-script');

  useEffect_CA(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const next = await window.mcLoadState?.();
        if (!cancelled) setState(next || {});
      } catch (e) {
        if (!cancelled) setState({});
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const data = state?.contentAutomationV1 || CONTENT_V1_FALLBACK;
  const specialists = data.specialists || CONTENT_V1_FALLBACK.specialists;
  const queueCards = data.queueCards || CONTENT_V1_FALLBACK.queueCards;
  const roughProposal = buildContentWorkflowProposal(intent, channel, specialists);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 24, background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 1420, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) 420px', gap: 16 }}>
          <ContentAutomationHero/>
          <ContentPolicyCard data={data}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {queueCards.map(card => <ContentQueueCard key={card.id} card={card}/>) }
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, .9fr) minmax(560px, 1.1fr)', gap: 16, alignItems: 'start' }}>
          <Card padding={18} accent>
            <div className="term" style={{ color: 'var(--accent)', fontWeight: 900, letterSpacing: '.08em', marginBottom: 8 }}>TELL ME WHAT YOU WANT · CONTENT BUILDER HOOK</div>
            <div style={{ fontSize: 25, fontWeight: 950, letterSpacing: '-.04em', lineHeight: 1.08 }}>Rough intent in. Workflow + policy proposal out.</div>
            <div style={{ color: 'var(--fg-secondary)', lineHeight: 1.45, marginTop: 8, marginBottom: 12 }}>Colton can talk messy. The parent orchestrator turns it into a safe YouTube workflow/policy proposal, then routes bounded specialists. No mega-agent, no uploads or external mutations in v1.</div>
            <textarea value={intent} onChange={e=>setIntent(e.target.value)} style={{ width: '100%', minHeight: 150, resize: 'vertical', boxSizing: 'border-box', background: 'var(--canvas)', color: 'var(--fg-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.45, outline: 'none' }}/>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {['youtube-strategy','ideas-research','title-thumbnail','hook-script','producer-recording','editor-shorts','metadata-publishing','compliance-proof'].map(c => <Button key={c} size="xs" variant={channel===c?'primary':'secondary'} onClick={()=>setChannel(c)}>{c}</Button>)}
            </div>
          </Card>

          <ContentProposalCard proposal={roughProposal}/>
        </div>

        <SectionHeader label="Specialist agent execution map" count={specialists.length}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          {specialists.map(s => <ContentSpecialistCard key={s.id} specialist={s}/>) }
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ContentChecklist title="YouTube v1 checklist" items={[
            'Tell Me What You Want intake captures raw idea/reference/demo/customer pain.',
            'Parent proposes workflow/policy before specialists execute.',
            'Separate YouTube specialists own strategy, research, titles/thumbnails, hooks/scripts, recording, Shorts, metadata, and proof checks.',
            'Publishing/upload policy is placeholder-only until Colton approves live platform rules.',
            'Receipts point to local state, Business OS spec, changed files, blockers, and next automation step.'
          ]}/>
          <ContentChecklist title="Human gates" items={[
            'Never upload, schedule, comment, or mutate public metadata without explicit approval.',
            'Never use customer names/logos/results without permission.',
            'Never connect YouTube API/scheduler, billing, paid tools, or account logins without approval.',
            'Unsourced claims stay as hypotheses or examples.',
            'After approved info/clicks, specialists continue automatically until the next real gate.'
          ]}/>
        </div>
      </div>
    </div>
  );
}

function buildContentWorkflowProposal(intent, channel, specialists) {
  const selected = specialists.find(s => s.id === channel) || specialists.find(s => s.id === 'youtube-strategy') || specialists[0];
  const text = (intent || '').trim();
  return {
    channel,
    owner: selected?.name || 'Channel specialist',
    status: 'draft_needs_colton_approval_before_publish',
    brief: text || 'No intent yet.',
    steps: ['Intake brief', 'Workflow + policy proposal', 'Title/thumbnail packet', 'Hook/script/long-form draft', 'Shorts extraction plan', 'Metadata + upload checklist', 'Receipt log'],
    outputs: ['10 title variants', '3 thumbnail concepts', 'first 30 seconds', 'long-form structure', '3-7 Shorts candidates', 'CTA + metadata packet', 'approval card'],
    policy: 'Draft locally now. Uploads, scheduling, account/API connection, public metadata changes, comments, spend, and customer proof require explicit approval.',
  };
}

function ContentAutomationHero() {
  return <div style={{ background: 'linear-gradient(135deg, rgba(17,24,39,.96), rgba(249,115,22,.78))', color: '#fff', borderRadius: 26, padding: 26, minHeight: 230, boxShadow: '0 24px 80px rgba(42,34,23,0.14)' }}>
    <div className="section-label" style={{ color: 'rgba(255,255,255,.72)' }}>YouTube Content Automation v1 · HITL workflow</div>
    <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: '-.058em', lineHeight: 1.03, marginTop: 8 }}>Parent orchestrator. YouTube specialists. Human gates.</div>
    <div style={{ color: 'rgba(255,255,255,.86)', fontSize: 16, lineHeight: 1.45, marginTop: 12, maxWidth: 860 }}>Tell Me What You Want → workflow/policy proposal → YouTube strategy → ideas/research → titles/thumbnails → hooks/scripts → recording inputs → Shorts extraction → metadata/publish checklist → receipts. The parent routes; bounded specialists execute.</div>
    <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
      <ActionHeroPill label="local only"/><ActionHeroPill label="no uploads"/><ActionHeroPill label="receipts required"/><ActionHeroPill label="Tell Me What You Want ready"/>
    </div>
  </div>;
}

function ContentPolicyCard({ data }) { return <Card padding={20} radius={24}><div className="section-label">YouTube publishing policy</div><div style={{ fontSize: 27, fontWeight: 950, letterSpacing: '-.04em', marginTop: 6 }}>Disabled placeholder.</div><div style={{ color: 'var(--fg-secondary)', lineHeight: 1.45, marginTop: 8 }}>Drafting is safe locally. Uploading stays off until Colton approves account/channel lane, title, thumbnail, metadata, schedule, claims rules, and kill switch.</div><div style={{ display: 'grid', gap: 9, marginTop: 16 }}><ActionMiniRow label="Mode" value={data.policyMode || 'local_draft_only_no_uploads_no_account_changes_no_spend'}/><ActionMiniRow label="Status" value={data.status || 'ready_for_colton_review'}/><ActionMiniRow label="Receipt" value={(data.receipts || [])[0] || 'dashboard/state/receipts.jsonl'}/></div></Card>; }
function ContentQueueCard({ card }) { const tone = card.status === 'human_gate' ? 'warning' : card.status === 'ready' ? 'success' : 'brand'; return <Card padding={14} radius={16}><Pill tone={tone}>{card.status}</Pill><div style={{ fontSize: 16, fontWeight: 950, marginTop: 10 }}>{card.label}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 12.5, lineHeight: 1.4, marginTop: 6 }}>{card.output}</div><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 10.5, marginTop: 10 }}>{card.owner}</div></Card>; }
function ContentProposalCard({ proposal }) { return <Card padding={0} radius={20} style={{ overflow: 'hidden' }}><div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Wand size={18}/></div><div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 950 }}>Generated workflow proposal</div><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 11 }}>DRAFT · APPROVAL REQUIRED BEFORE PUBLIC ACTION</div></div><Pill tone="brand">{proposal.channel}</Pill></div><div style={{ padding: 16, display: 'grid', gap: 12 }}><ActionCardSection label="Owner specialist" value={proposal.owner}/><ActionCardSection label="Brief" value={proposal.brief}/><ActionCardSection label="Steps" value={proposal.steps.join(' → ')}/><ActionCardSection label="Outputs" value={proposal.outputs.join(' · ')}/><ActionCardSection label="Policy" value={proposal.policy}/><div><Button variant="primary" icon={<Icons.Check size={14}/>} onClick={()=>alert('Placeholder only: this would create a YouTube approval card and local draft packet. No upload, account/API connection, or external publishing is wired.')}>Create approval card placeholder</Button></div></div></Card>; }
function ContentSpecialistCard({ specialist }) { return <Card padding={16} radius={18}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}><Avatar name={specialist.name} tone={specialist.id === 'parent-orchestrator' ? 'brand' : 'info'} size={34}/><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 16, fontWeight: 950 }}>{specialist.name}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 13, lineHeight: 1.4, marginTop: 4 }}>{specialist.role}</div></div></div><ActionCardSection label="Tools / plugins" value={(specialist.tools || []).join(' · ')}/><ActionCardSection label="Can do alone" value={(specialist.canDo || []).join(' · ')}/><ActionCardSection label="Needs approval" value={(specialist.needsApproval || []).join(' · ')}/></Card>; }
function ContentChecklist({ title, items }) { return <Card padding={16} radius={20}><div style={{ fontSize: 17, fontWeight: 950, marginBottom: 8 }}>{title}</div><div style={{ display: 'grid', gap: 8 }}>{items.map(i => <ActionGuardrail key={i} text={i}/>)}</div></Card>; }

Object.assign(window, { ContentAutomationScreen });

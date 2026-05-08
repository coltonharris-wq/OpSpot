// Content Automation v1 — orchestrator-led, specialist-agent executed, local-only skeleton.
const { useState: useState_CA, useEffect: useEffect_CA } = React;

const CONTENT_V1_FALLBACK = {
  status: 'ready_for_colton_review',
  policyMode: 'placeholder_only_no_external_posts',
  workflow: ['idea_intake', 'script_hooks', 'draft_assets', 'human_approval', 'publish_placeholder', 'receipts'],
  specialists: [
    { id: 'parent-orchestrator', name: 'Parent content orchestrator', role: 'Turns rough intent into policy, tasks, gates, and specialist handoffs.', tools: ['Mission Control state', 'Tell Me What You Want builder', 'approval queue', 'receipts ledger'], canDo: ['classify intent', 'ask clarifiers', 'route specialists', 'freeze policy'], needsApproval: ['publishing policy', 'external account/plugin connection'] },
    { id: 'instagram', name: 'Instagram specialist', role: 'Reels/carousels/captions from approved hooks and visual direction.', tools: ['hook bank', 'caption drafts', 'asset checklist', 'Instagram plugin placeholder'], canDo: ['draft captions', 'draft Reel beats', 'suggest hashtags'], needsApproval: ['post, DM, comment, account/profile changes'] },
    { id: 'youtube', name: 'YouTube specialist', role: 'Shorts scripts, titles, descriptions, thumbnail notes, long-form outlines.', tools: ['YouTube reference log', 'Shorts template', 'title/description draft', 'YouTube plugin placeholder'], canDo: ['draft Shorts', 'repurpose demos', 'title variants'], needsApproval: ['upload, schedule, public metadata changes'] },
    { id: 'twitch-streaming', name: 'Twitch / streaming specialist', role: 'Stream plans, run-of-show, segments, clips-to-capture, post-stream checklist.', tools: ['stream runbook', 'OBS/Twitch placeholder', 'clip marker sheet'], canDo: ['draft stream plan', 'prep talking points', 'mark clip opportunities'], needsApproval: ['go live, account changes, public chat actions'] },
    { id: 'clip-repurpose', name: 'Clip / repurpose specialist', role: 'Turns one recording or idea into platform-specific variants.', tools: ['transcript/clip input', 'Hook-Meat-CTA template', 'caption formatter', 'asset export checklist'], canDo: ['cutdown plan', 'caption variants', 'cross-platform package'], needsApproval: ['publish/export to external tools with account access'] },
    { id: 'approval-publishing', name: 'Approval / publishing specialist', role: 'Maintains human gates, autopost policy placeholder, receipts, and kill switch.', tools: ['approval queue', 'policy ledger', 'receipts.jsonl', 'platform plugin placeholders'], canDo: ['package approval cards', 'log decisions', 'prepare upload checklist'], needsApproval: ['enable autopost, publish, spend/boost, use customer proof'] },
  ],
  intakeQuestions: [
    'What rough idea, customer pain, demo, clip, or reference are we starting from?',
    'Which channel matters first: Instagram, YouTube, Twitch/stream, or multi-platform?',
    'What should the AI draft versus what must wait for Colton?',
    'What proof/receipt should make this safe to publish?',
  ],
  queueCards: [
    { id: 'intake', label: 'Idea intake', status: 'ready', output: 'structured content brief', owner: 'Parent content orchestrator' },
    { id: 'hooks', label: 'Script + hooks', status: 'ready', output: '5 hooks + Hook/Meat/CTA draft', owner: 'YouTube or Instagram specialist' },
    { id: 'drafts', label: 'Draft captions/video/stream plan', status: 'ready', output: 'platform draft packet', owner: 'channel specialist' },
    { id: 'approval', label: 'Approval / autopost policy placeholder', status: 'human_gate', output: 'approve/reject/send-back card', owner: 'Approval / publishing specialist' },
    { id: 'receipts', label: 'Receipts', status: 'ready', output: 'local run log + artifact links', owner: 'Receipt clerk' },
  ],
  receipts: ['dashboard/state/receipts.jsonl', 'Business-OS/OPSPOT-CONTENT-AUTOMATION-V1-SKELETON-2026-05-08.md'],
};

function ContentAutomationScreen() {
  const [state, setState] = useState_CA(null);
  const [intent, setIntent] = useState_CA('I have a rough OpSpot idea: business owners do not need another dashboard — they need the follow-up sent. Turn it into Shorts/Reels and a stream segment.');
  const [channel, setChannel] = useState_CA('youtube');

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
            <div style={{ color: 'var(--fg-secondary)', lineHeight: 1.45, marginTop: 8, marginBottom: 12 }}>Colton can talk messy. The parent orchestrator turns it into a safe content workflow, then routes specialists. No mega-agent, no external posting in v1.</div>
            <textarea value={intent} onChange={e=>setIntent(e.target.value)} style={{ width: '100%', minHeight: 150, resize: 'vertical', boxSizing: 'border-box', background: 'var(--canvas)', color: 'var(--fg-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.45, outline: 'none' }}/>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {['youtube','instagram','twitch-streaming','clip-repurpose'].map(c => <Button key={c} size="xs" variant={channel===c?'primary':'secondary'} onClick={()=>setChannel(c)}>{c}</Button>)}
            </div>
          </Card>

          <ContentProposalCard proposal={roughProposal}/>
        </div>

        <SectionHeader label="Specialist agent execution map" count={specialists.length}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          {specialists.map(s => <ContentSpecialistCard key={s.id} specialist={s}/>) }
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ContentChecklist title="Friday EOD v1 checklist" items={[
            'Idea intake captures raw idea/reference/demo/customer pain.',
            'Script/hooks specialist drafts Hook / Meat / CTA variants.',
            'Instagram, YouTube, Twitch/streaming, and clip/repurpose lanes are separate specialist cards.',
            'Approval/publishing policy is placeholder-only until Colton approves live platform rules.',
            'Receipts point to local state, Business OS spec, and draft artifact paths.'
          ]}/>
          <ContentChecklist title="Human gates" items={[
            'Never publish externally without explicit approval.',
            'Never use customer names/logos/results without permission.',
            'Never connect billing, boost posts, or create accounts without approval.',
            'Unsourced claims stay as hypotheses or examples.',
            'Autopost stays disabled until policy/sender/channel/account boundaries are approved.'
          ]}/>
        </div>
      </div>
    </div>
  );
}

function buildContentWorkflowProposal(intent, channel, specialists) {
  const selected = specialists.find(s => s.id === channel) || specialists.find(s => s.id === 'youtube') || specialists[0];
  const text = (intent || '').trim();
  return {
    channel,
    owner: selected?.name || 'Channel specialist',
    status: 'draft_needs_colton_approval_before_publish',
    brief: text || 'No intent yet.',
    steps: ['Intake brief', 'Hook bank', 'Script/caption/stream plan draft', 'Approval card', 'Publish placeholder', 'Receipt log'],
    outputs: channel === 'twitch-streaming'
      ? ['stream run-of-show', '3 clip markers', 'post-stream repurpose checklist']
      : ['5 hook variants', 'short-form script', 'caption/title draft', 'approval card'],
    policy: 'Draft locally now. Publishing, account connection, public metadata changes, comments/DMs, boosting, and customer proof require explicit approval.',
  };
}

function ContentAutomationHero() {
  return <div style={{ background: 'linear-gradient(135deg, rgba(17,24,39,.96), rgba(249,115,22,.78))', color: '#fff', borderRadius: 26, padding: 26, minHeight: 230, boxShadow: '0 24px 80px rgba(42,34,23,0.14)' }}>
    <div className="section-label" style={{ color: 'rgba(255,255,255,.72)' }}>Content Automation v1 · Friday EOD skeleton</div>
    <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: '-.058em', lineHeight: 1.03, marginTop: 8 }}>Parent orchestrator. Specialist channels. Human gates.</div>
    <div style={{ color: 'rgba(255,255,255,.86)', fontSize: 16, lineHeight: 1.45, marginTop: 12, maxWidth: 860 }}>Idea intake → script/hooks → draft captions/videos/stream plans → approval/autopost policy placeholder → receipts. The parent routes; Instagram, YouTube, Twitch/streaming, clip/repurpose, and approval/publishing specialists execute bounded work.</div>
    <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
      <ActionHeroPill label="local only"/><ActionHeroPill label="no external posts"/><ActionHeroPill label="receipts required"/><ActionHeroPill label="Tell Me What You Want ready"/>
    </div>
  </div>;
}

function ContentPolicyCard({ data }) { return <Card padding={20} radius={24}><div className="section-label">Autopost policy</div><div style={{ fontSize: 27, fontWeight: 950, letterSpacing: '-.04em', marginTop: 6 }}>Disabled placeholder.</div><div style={{ color: 'var(--fg-secondary)', lineHeight: 1.45, marginTop: 8 }}>Drafting is safe locally. Publishing stays off until Colton approves account, channel, policy, quiet hours, claims rules, and kill switch.</div><div style={{ display: 'grid', gap: 9, marginTop: 16 }}><ActionMiniRow label="Mode" value={data.policyMode || 'placeholder_only_no_external_posts'}/><ActionMiniRow label="Status" value={data.status || 'ready_for_colton_review'}/><ActionMiniRow label="Receipt" value={(data.receipts || [])[0] || 'dashboard/state/receipts.jsonl'}/></div></Card>; }
function ContentQueueCard({ card }) { const tone = card.status === 'human_gate' ? 'warning' : card.status === 'ready' ? 'success' : 'brand'; return <Card padding={14} radius={16}><Pill tone={tone}>{card.status}</Pill><div style={{ fontSize: 16, fontWeight: 950, marginTop: 10 }}>{card.label}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 12.5, lineHeight: 1.4, marginTop: 6 }}>{card.output}</div><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 10.5, marginTop: 10 }}>{card.owner}</div></Card>; }
function ContentProposalCard({ proposal }) { return <Card padding={0} radius={20} style={{ overflow: 'hidden' }}><div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Wand size={18}/></div><div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 950 }}>Generated workflow proposal</div><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 11 }}>DRAFT · APPROVAL REQUIRED BEFORE PUBLIC ACTION</div></div><Pill tone="brand">{proposal.channel}</Pill></div><div style={{ padding: 16, display: 'grid', gap: 12 }}><ActionCardSection label="Owner specialist" value={proposal.owner}/><ActionCardSection label="Brief" value={proposal.brief}/><ActionCardSection label="Steps" value={proposal.steps.join(' → ')}/><ActionCardSection label="Outputs" value={proposal.outputs.join(' · ')}/><ActionCardSection label="Policy" value={proposal.policy}/><div><Button variant="primary" icon={<Icons.Check size={14}/>} onClick={()=>alert('Placeholder only: this would create an approval card and local draft packet. No external publishing is wired.')}>Create approval card placeholder</Button></div></div></Card>; }
function ContentSpecialistCard({ specialist }) { return <Card padding={16} radius={18}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}><Avatar name={specialist.name} tone={specialist.id === 'parent-orchestrator' ? 'brand' : 'info'} size={34}/><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 16, fontWeight: 950 }}>{specialist.name}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 13, lineHeight: 1.4, marginTop: 4 }}>{specialist.role}</div></div></div><ActionCardSection label="Tools / plugins" value={(specialist.tools || []).join(' · ')}/><ActionCardSection label="Can do alone" value={(specialist.canDo || []).join(' · ')}/><ActionCardSection label="Needs approval" value={(specialist.needsApproval || []).join(' · ')}/></Card>; }
function ContentChecklist({ title, items }) { return <Card padding={16} radius={20}><div style={{ fontSize: 17, fontWeight: 950, marginBottom: 8 }}>{title}</div><div style={{ display: 'grid', gap: 8 }}>{items.map(i => <ActionGuardrail key={i} text={i}/>)}</div></Card>; }

Object.assign(window, { ContentAutomationScreen });

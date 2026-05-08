// Content Automation v1 — Twitch HITL workflow. Orchestrator-led, specialist-agent executed, local-only.
const { useState: useState_CA, useEffect: useEffect_CA } = React;

const CONTENT_V1_FALLBACK = {
  status: 'twitch_hitl_ready_for_colton_review',
  policyMode: 'local_draft_only_no_live_streams_no_account_changes_no_spend',
  criticalArchitecturePrinciple: 'Parent orchestrator routes to Twitch/streaming/content specialists. No mega-agent with broad OBS/Twitch/moderation/publishing tools.',
  workflow: ['tell_me_what_you_want_intake', 'parent_workflow_policy_proposal', 'colton_swipe_approval', 'stream_positioning_packet', 'run_of_show_packet', 'obs_camera_mic_setup_packet', 'chat_moderation_safety_packet', 'clip_marker_packet', 'instagram_youtube_repurpose_packet', 'human_final_go_live_gate', 'receipts'],
  specialists: [
    { id: 'parent-orchestrator', name: 'Parent content orchestrator', role: 'Turns rough stream intent into a Twitch workflow/policy proposal, routes bounded specialists, tracks approvals/receipts, and escalates true blockers.', tools: ['Mission Control state', 'Tell Me What You Want builder', 'approval queue', 'Business OS/vault', 'receipts ledger'], canDo: ['classify rough intent', 'propose workflow/policy', 'route specialists', 'continue after approved info/clicks', 'log receipts'], needsApproval: ['go-live policy', 'account/plugin/API connection', 'external mutation', 'spend', 'customer proof use'] },
    { id: 'stream-positioning', name: 'Stream positioning specialist', role: 'Audience, transformation, offer angle, stream promise, CTA, cadence, and format lane.', tools: ['OpSpot profile kit', 'Hormozi reference note', 'content pillar template', 'Business OS queue'], canDo: ['draft positioning', 'suggest cadence', 'rank stream formats'], needsApproval: ['brand/account lane', 'public positioning changes', 'cadence implying live streaming'] },
    { id: 'run-of-show', name: 'Run-of-show specialist', role: 'Title options, live hook, 3–5 segments, transitions, proof beats, chat prompts, and close/CTA.', tools: ['rundown template', 'hook bank', 'proof checker', 'CTA template'], canDo: ['draft rundown', 'draft talking points', 'mark intentional clip moments'], needsApproval: ['strong claims', 'customer stories', 'final live script'] },
    { id: 'obs-production', name: 'OBS / production specialist', role: 'Scenes checklist, camera/mic checklist, screen-share privacy, local recording test, and go-live readiness checklist.', tools: ['OBS/Twitch placeholder disabled', 'scene checklist', 'camera/mic checklist', 'local recording test checklist'], canDo: ['draft setup checklist', 'request setup confirmations', 'prep test plan'], needsApproval: ['Twitch/OBS connection', 'camera/mic choice', 'go-live action', 'screen-share boundaries'] },
    { id: 'moderation-safety', name: 'Chat moderation / safety specialist', role: 'Chat policy, banned topics, response boundaries, escalation rules, and kill switch.', tools: ['chat policy template', 'privacy checklist', 'escalation rulebook'], canDo: ['draft moderation policy', 'flag risk', 'request human mod decision'], needsApproval: ['public chat actions', 'ban/delete/reply', 'moderator/tool connection'] },
    { id: 'clip-marker', name: 'Clip marker specialist', role: 'Live clip moments, timestamp sheet, highlight labels, and post-stream extraction notes.', tools: ['timestamp sheet', 'clip extraction checklist', 'transcript placeholder'], canDo: ['draft clip plan', 'mark expected moments', 'write extraction notes'], needsApproval: ['clip export to external tools', 'private footage handling'] },
    { id: 'repurpose', name: 'Instagram / YouTube repurpose specialist', role: 'Reels, Shorts, captions, titles, thumbnails, recap drafts, and post-stream approval cards.', tools: ['Instagram HITL spec', 'YouTube HITL spec', 'Shorts/Reels extraction template'], canDo: ['draft repurpose packet', 'write captions/titles', 'prepare approval cards'], needsApproval: ['publish/upload/schedule', 'public metadata changes', 'customer proof use'] },
    { id: 'approval-publishing', name: 'Approval / publishing specialist', role: 'Account/setup/privacy/moderation/money/go-live cards and receipts.', tools: ['swipe-deck card writer', 'approval policy ledger', 'receipts.jsonl', 'Twitch plugin placeholder disabled'], canDo: ['create approval cards', 'log decisions', 'prepare final go-live checklist'], needsApproval: ['go live', 'account settings', 'plugin/API connection', 'spend'] },
    { id: 'compliance-proof', name: 'Compliance / proof checker', role: 'Customer proof, private data, claims, permissions, unsupported metrics, and screen-share privacy.', tools: ['customer permission ledger', 'claim/source checklist', 'screen-share privacy checklist'], canDo: ['flag risk', 'mark claims unsupported', 'request proof/permission'], needsApproval: ['customer names/logos/results', 'private screenshots/data', 'spend', 'account changes'] },
  ],
  intakeQuestions: [
    'What rough stream topic, business pain, demo, build, or reference are we starting from?',
    'Which stream format: build-in-public, audit teardown, Q&A, workflow walkthrough, whiteboard, or clip-first mini stream?',
    'Which lane: OpSpot brand, Colton founder, or parked?',
    'What proof/receipt can we safely show on screen?',
    'What CTA should this drive: audit, follow, checklist, book, or no hard CTA?',
  ],
  queueCards: [
    { id: 'intake', label: 'Tell Me What You Want intake', status: 'ready', output: 'structured stream-intent brief', owner: 'Parent content orchestrator' },
    { id: 'policy', label: 'Workflow + policy proposal', status: 'human_gate', output: 'specialists, tools, approvals, risks, next automation step', owner: 'Parent content orchestrator' },
    { id: 'positioning', label: 'Stream positioning packet', status: 'ready', output: 'audience, transformation, offer angle, CTA, cadence', owner: 'Stream positioning specialist' },
    { id: 'rundown', label: 'Run-of-show', status: 'ready', output: 'live hook, segments, talking points, proof beats, close/CTA', owner: 'Run-of-show specialist' },
    { id: 'obs', label: 'OBS + scenes setup', status: 'human_gate', output: 'scenes, screen-share privacy, local recording, setup blockers', owner: 'OBS / production specialist' },
    { id: 'camera', label: 'Camera/mic confirmation', status: 'human_gate', output: 'device choices, audio levels, test recording, raw path', owner: 'OBS / production specialist' },
    { id: 'moderation', label: 'Chat moderation + safety', status: 'human_gate', output: 'chat rules, banned topics, mod owner, kill switch', owner: 'Moderation / safety specialist' },
    { id: 'clips', label: 'Clip marker sheet', status: 'ready', output: 'intentional clip moments, timestamp sheet, extraction notes', owner: 'Clip marker specialist' },
    { id: 'repurpose', label: 'Instagram/YouTube repurpose', status: 'ready', output: 'Reels/Shorts candidates, captions, titles, CTA variants', owner: 'Repurpose specialist' },
    { id: 'golive', label: 'Final go-live checklist', status: 'human_gate', output: 'title/category/account/OBS/privacy/moderation approval card', owner: 'Approval / publishing specialist' },
    { id: 'receipts', label: 'Receipts', status: 'ready', output: 'files changed, artifacts, blockers, next automation step', owner: 'Receipt clerk' },
  ],
  receipts: ['dashboard/state/receipts.jsonl', 'Business-OS/OPSPOT-TWITCH-HITL-WORKFLOW-2026-05-08.md'],
};

function ContentAutomationScreen() {
  const [state, setState] = useState_CA(null);
  const [intent, setIntent] = useState_CA('I have a rough OpSpot Twitch idea: stream a build-in-public workflow where a dropped follow-up becomes an AI employee. Turn it into positioning, run-of-show, OBS/camera/mic checklist, moderation/privacy policy, clip markers, Instagram/YouTube repurpose packet, CTA, and go-live approval checklist.');
  const [channel, setChannel] = useState_CA('run-of-show');

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
            <div className="term" style={{ color: 'var(--accent)', fontWeight: 900, letterSpacing: '.08em', marginBottom: 8 }}>TELL ME WHAT YOU WANT · TWITCH BUILDER HOOK</div>
            <div style={{ fontSize: 25, fontWeight: 950, letterSpacing: '-.04em', lineHeight: 1.08 }}>Rough stream intent in. Workflow + policy proposal out.</div>
            <div style={{ color: 'var(--fg-secondary)', lineHeight: 1.45, marginTop: 8, marginBottom: 12 }}>Colton can talk messy. The parent orchestrator turns it into a safe Twitch workflow/policy proposal, then routes bounded specialists. No mega-agent, no live streams, public chat actions, account changes, or external mutations in v1.</div>
            <textarea value={intent} onChange={e=>setIntent(e.target.value)} style={{ width: '100%', minHeight: 150, resize: 'vertical', boxSizing: 'border-box', background: 'var(--canvas)', color: 'var(--fg-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.45, outline: 'none' }}/>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {['stream-positioning','run-of-show','obs-production','moderation-safety','clip-marker','repurpose','approval-publishing','compliance-proof'].map(c => <Button key={c} size="xs" variant={channel===c?'primary':'secondary'} onClick={()=>setChannel(c)}>{c}</Button>)}
            </div>
          </Card>

          <ContentProposalCard proposal={roughProposal}/>
        </div>

        <SectionHeader label="Specialist agent execution map" count={specialists.length}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          {specialists.map(s => <ContentSpecialistCard key={s.id} specialist={s}/>) }
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ContentChecklist title="Twitch v1 checklist" items={[
            'Tell Me What You Want intake captures raw stream intent/topic/demo/customer pain.',
            'Parent proposes workflow/policy before specialists execute.',
            'Separate Twitch specialists own positioning, run-of-show, OBS/production, moderation/safety, clips, repurpose, approvals, and proof checks.',
            'Go-live policy is placeholder-only until Colton approves live platform rules.',
            'Receipts point to local state, Business OS spec, changed files, blockers, and next automation step.'
          ]}/>
          <ContentChecklist title="Human gates" items={[
            'Never go live, schedule, change Twitch account settings, or act in public chat without explicit approval.',
            'Never screen-share customer/private data, credentials, inboxes, calendars, CRM, docs, billing, or messages.',
            'Never use customer names/logos/results without permission.',
            'Never connect Twitch/OBS plugins, billing, paid tools, moderators, or editors without approval.',
            'After approved info/clicks, specialists continue automatically until the next real gate.'
          ]}/>
        </div>
      </div>
    </div>
  );
}

function buildContentWorkflowProposal(intent, channel, specialists) {
  const selected = specialists.find(s => s.id === channel) || specialists.find(s => s.id === 'run-of-show') || specialists[0];
  const text = (intent || '').trim();
  return {
    channel,
    owner: selected?.name || 'Twitch specialist',
    status: 'draft_needs_colton_approval_before_go_live',
    brief: text || 'No intent yet.',
    steps: ['Intake brief', 'Workflow + policy proposal', 'Stream positioning', 'Run-of-show', 'OBS/camera/mic setup', 'Moderation/safety policy', 'Clip marker sheet', 'Instagram/YouTube repurpose packet', 'Go-live checklist', 'Receipt log'],
    outputs: ['stream promise', 'live hook', '3–5 segment rundown', 'OBS scene checklist', 'privacy/moderation rules', 'clip moments', 'Reels/Shorts candidates', 'CTA options', 'go-live approval card'],
    policy: 'Draft locally now. Go-live, scheduling, account/plugin connection, public chat actions, spend, screen-share of private data, customer proof, and external publishing require explicit approval.',
  };
}

function ContentAutomationHero() {
  return <div style={{ background: 'linear-gradient(135deg, rgba(17,24,39,.96), rgba(147,51,234,.78))', color: '#fff', borderRadius: 26, padding: 26, minHeight: 230, boxShadow: '0 24px 80px rgba(42,34,23,0.14)' }}>
    <div className="section-label" style={{ color: 'rgba(255,255,255,.72)' }}>Twitch Streaming Automation v1 · HITL workflow</div>
    <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: '-.058em', lineHeight: 1.03, marginTop: 8 }}>Parent orchestrator. Twitch specialists. Human gates.</div>
    <div style={{ color: 'rgba(255,255,255,.86)', fontSize: 16, lineHeight: 1.45, marginTop: 12, maxWidth: 900 }}>Tell Me What You Want → workflow/policy proposal → stream positioning → run-of-show → OBS/camera/mic setup → moderation/safety → clip markers → Instagram/YouTube repurpose → go-live checklist → receipts.</div>
    <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
      <ActionHeroPill label="local only"/><ActionHeroPill label="no live streams"/><ActionHeroPill label="receipts required"/><ActionHeroPill label="Tell Me What You Want ready"/>
    </div>
  </div>;
}

function ContentPolicyCard({ data }) { return <Card padding={20} radius={24}><div className="section-label">Twitch go-live policy</div><div style={{ fontSize: 27, fontWeight: 950, letterSpacing: '-.04em', marginTop: 6 }}>Disabled placeholder.</div><div style={{ color: 'var(--fg-secondary)', lineHeight: 1.45, marginTop: 8 }}>Go-live stays off until Colton approves account/lane, stream title/category, OBS scene, camera/mic, privacy checklist, moderation policy, and kill switch.</div><div style={{ display: 'grid', gap: 9, marginTop: 16 }}><ActionMiniRow label="Mode" value={data.policyMode || 'local_draft_only_no_live_streams_no_account_changes_no_spend'}/><ActionMiniRow label="Status" value={data.status || 'ready_for_colton_review'}/><ActionMiniRow label="Receipt" value={(data.receipts || [])[0] || 'dashboard/state/receipts.jsonl'}/></div></Card>; }
function ContentQueueCard({ card }) { const tone = card.status === 'human_gate' ? 'warning' : card.status === 'ready' ? 'success' : 'brand'; return <Card padding={14} radius={16}><Pill tone={tone}>{card.status}</Pill><div style={{ fontSize: 16, fontWeight: 950, marginTop: 10 }}>{card.label}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 12.5, lineHeight: 1.4, marginTop: 6 }}>{card.output}</div><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 10.5, marginTop: 10 }}>{card.owner}</div></Card>; }
function ContentProposalCard({ proposal }) { return <Card padding={0} radius={20} style={{ overflow: 'hidden' }}><div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Wand size={18}/></div><div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 950 }}>Generated workflow proposal</div><div className="term" style={{ color: 'var(--fg-tertiary)', fontSize: 11 }}>DRAFT · APPROVAL REQUIRED BEFORE PUBLIC ACTION</div></div><Pill tone="brand">{proposal.channel}</Pill></div><div style={{ padding: 16, display: 'grid', gap: 12 }}><ActionCardSection label="Owner specialist" value={proposal.owner}/><ActionCardSection label="Brief" value={proposal.brief}/><ActionCardSection label="Steps" value={proposal.steps.join(' → ')}/><ActionCardSection label="Outputs" value={proposal.outputs.join(' · ')}/><ActionCardSection label="Policy" value={proposal.policy}/><div><Button variant="primary" icon={<Icons.Check size={14}/>} onClick={()=>alert('Placeholder only: this would create a Twitch approval card and local draft packet. No go-live, account/plugin connection, public chat action, or external publishing is wired.')}>Create approval card placeholder</Button></div></div></Card>; }
function ContentSpecialistCard({ specialist }) { return <Card padding={16} radius={18}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}><Avatar name={specialist.name} tone={specialist.id === 'parent-orchestrator' ? 'brand' : 'info'} size={34}/><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 16, fontWeight: 950 }}>{specialist.name}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 13, lineHeight: 1.4, marginTop: 4 }}>{specialist.role}</div></div></div><ActionCardSection label="Tools / plugins" value={(specialist.tools || []).join(' · ')}/><ActionCardSection label="Can do alone" value={(specialist.canDo || []).join(' · ')}/><ActionCardSection label="Needs approval" value={(specialist.needsApproval || []).join(' · ')}/></Card>; }
function ContentChecklist({ title, items }) { return <Card padding={16} radius={20}><div style={{ fontSize: 17, fontWeight: 950, marginBottom: 8 }}>{title}</div><div style={{ display: 'grid', gap: 8 }}>{items.map(i => <ActionGuardrail key={i} text={i}/>)}</div></Card>; }

Object.assign(window, { ContentAutomationScreen });

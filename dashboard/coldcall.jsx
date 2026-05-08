// Cold Call Tab v1 — one best lead, context, call notes, receipts.
const { useState: uSt_CC, useEffect: uEf_CC, useMemo: uMe_CC } = React;

function ColdCallScreen() {
  const [leads, setLeads] = uSt_CC([]);
  const [receipts, setReceipts] = uSt_CC([]);
  const [idx, setIdx] = uSt_CC(0);
  const [note, setNote] = uSt_CC('');
  const [loading, setLoading] = uSt_CC(true);

  const load = async () => {
    try {
      const state = await window.mcLoadState?.();
      setLeads((state?.coldCallLeads || []).filter(l => l.status !== 'closed_lost'));
      const rs = await window.mcReceipts?.();
      setReceipts(rs?.receipts || []);
    } catch (e) { console.warn('cold call load failed', e); }
    setLoading(false);
  };

  uEf_CC(() => { load(); }, []);

  const ordered = uMe_CC(() => leads.slice().sort((a,b)=>(b.warmthScore||b.score||0)-(a.warmthScore||a.score||0)), [leads]);
  const lead = ordered[idx] || ordered[0];
  const log = receipts.filter(r => r.leadId === lead?.id || r.meta?.leadId === lead?.id).slice(-8).reverse();

  const outcome = async (action) => {
    if (!lead) return;
    try {
      await window.mcColdCallOutcome?.(lead.id, action, { note, actor: 'colton', recording: action === 'record_call' ? 'started_placeholder' : undefined });
      setNote('');
      await load();
      if (action === 'not_fit' || action === 'meeting_booked') setIdx(i => Math.min(i + 1, Math.max(0, ordered.length - 2)));
    } catch (e) { console.warn('cold call outcome failed', e); }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading cold call cockpit…</div>;
  if (!lead) return <PlaceholderScreen title="Cold Call" desc="No leads loaded yet. Agents will feed this tab from research/outbound."/>;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 24, background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 24, boxShadow: '0 18px 50px rgba(42,34,23,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Phone size={22}/></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="section-label">Best lead to call now · ranked lead machine</div>
                <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1.05 }}>{lead.business}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="section-label">Warmth</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--accent)' }}>{lead.warmthScore || lead.score}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <InfoTile label="Phone" value={lead.phone || 'Needs number'} strong/>
              <InfoTile label="Audit score" value={`${lead.auditScore ?? '—'}${lead.auditRank ? ` · rank #${lead.auditRank}` : ''}`} />
              <InfoTile label="Apollo" value={`${lead.apolloStatus || 'not ranked'}${lead.apolloEligible ? ' · eligible' : ''}`} />
              <InfoTile label="Last touch" value={lead.lastTouch || 'No touch yet'} />
              <InfoTile label="Stage" value={lead.stage || 'researched'} />
              <InfoTile label="Next ask" value={lead.nextAsk || 'Book a 15-min audit call'} />
            </div>

            <BigBlock title="Why Colton should call" body={lead.whyColtonShouldCall || lead.why}/>
            <BigBlock title="Warmth / rank reason" body={lead.rankReason}/>
            <BigBlock title="Angle to hit" body={lead.angle}/>
            <BigBlock title="Simple opener" body={lead.opener}/>

            <div style={{ marginTop: 16 }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Call notes</div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Type quick notes while/on after call. If not recorded, write NO RECORDING." rows={4} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 14, padding: 14, fontSize: 15, fontFamily: 'inherit', background: 'var(--surface-elevated)', color: 'var(--fg-primary)', outline: 'none', resize: 'vertical' }}/>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <Button variant="primary" size="lg" icon={<Icons.Mic size={15}/>} onClick={()=>outcome('record_call')}>Record Call</Button>
              <Button variant="secondary" size="lg" onClick={()=>outcome('called')}>Called</Button>
              <Button variant="secondary" size="lg" onClick={()=>outcome('no_answer')}>No answer</Button>
              <Button variant="success" size="lg" onClick={()=>outcome('interested')}>Interested</Button>
              <Button variant="success" size="lg" onClick={()=>outcome('meeting_booked')}>Meeting booked</Button>
              <Button variant="danger" size="lg" onClick={()=>outcome('not_fit')}>Not fit</Button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SidePanel title="Prior touches">
            {(lead.touches || []).map((t,i)=><Touch key={i} {...t}/>) }
            {(!lead.touches || !lead.touches.length) && <div style={{ color: 'var(--fg-tertiary)' }}>No outbound touches logged yet.</div>}
          </SidePanel>
          <SidePanel title="Apollo gate">
            <div style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--fg-secondary)' }}>{lead.apolloReason || 'No Apollo reason logged yet.'}</div>
            <div className="section-label" style={{ marginTop: 10 }}>Credits</div>
            <div style={{ fontWeight: 850 }}>{lead.apolloCreditsEstimate || '0'}</div>
          </SidePanel>
          <SidePanel title="Likely objections">
            {(lead.objections || []).map((o,i)=><div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>{o}</div>)}
          </SidePanel>
          <SidePanel title="Task log / receipts">
            {log.map(r=><div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><div style={{ fontWeight: 800, fontSize: 13 }}>{r.type}</div><div style={{ color: 'var(--fg-tertiary)', fontSize: 12 }}>{r.at} · {r.action || r.meta?.action || ''}</div></div>)}
            {!log.length && <div style={{ color: 'var(--fg-tertiary)' }}>No call receipts yet.</div>}
          </SidePanel>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="sm" onClick={()=>setIdx(i=>Math.max(0,i-1))}>Previous</Button>
            <Button variant="outline" size="sm" onClick={()=>setIdx(i=>Math.min(ordered.length-1,i+1))}>Next lead</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value, strong }) {
  return <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}><div className="section-label">{label}</div><div style={{ fontSize: strong ? 20 : 15, fontWeight: 850, marginTop: 4, overflowWrap: 'anywhere' }}>{value}</div></div>;
}
function BigBlock({ title, body }) {
  return <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}><div className="section-label" style={{ marginBottom: 6 }}>{title}</div><div style={{ fontSize: 17, lineHeight: 1.45, fontWeight: 650 }}>{body}</div></div>;
}
function SidePanel({ title, children }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}><div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>{title}</div>{children}</div>;
}
function Touch({ channel, status, summary, at }) {
  return <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><div style={{ fontWeight: 850, fontSize: 13 }}>{channel} · {status}</div><div style={{ color: 'var(--fg-secondary)', fontSize: 13 }}>{summary}</div>{at && <div className="section-label" style={{ marginTop: 3 }}>{at}</div>}</div>;
}
Object.assign(window, { ColdCallScreen });

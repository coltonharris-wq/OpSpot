// Swipe Deck — Tinder-for-ideas. Card stack with keyboard swipe + maybe pool.
const { useState: uSt_S, useEffect: uEf_S, useRef: uRf_S } = React;

function SwipeDeck({ ideas, setIdeas, onPushTask }) {
  const [cards, setCards] = uSt_S(ideas);
  const [history, setHistory] = uSt_S([]); // {idea, action}
  const [drag, setDrag] = uSt_S({ x: 0, y: 0, dragging: false });
  const top = cards[0];

  uEf_S(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') swipe('skip');
      else if (e.key === 'ArrowRight') swipe('approve');
      else if (e.key === 'ArrowDown') swipe('maybe');
      else if (e.key === 'z' && (e.metaKey||e.ctrlKey)) undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const swipe = (action) => {
    if (!top) return;
    setHistory(h => [{ idea: top, action }, ...h].slice(0, 10));
    setCards(c => c.slice(1));
    if (action === 'approve') onPushTask?.(top);
    setDrag({ x: 0, y: 0, dragging: false });
  };
  const undo = () => {
    if (history.length === 0) return;
    const [last, ...rest] = history;
    setCards(c => [last.idea, ...c]);
    setHistory(rest);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', minHeight: 0 }}>
        <div style={{ position: 'absolute', top: 16, left: 18, right: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="section-label">Swipe deck</span>
          <span className="mono-num" style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontWeight: 700 }}>{cards.length} remaining · {history.length} processed</span>
          <span style={{ flex: 1 }}/>
          <Button variant="ghost" size="xs" icon={<Icons.Refresh size={11}/>} onClick={undo}>Undo</Button>
        </div>

        <div style={{ position: 'relative', width: 480, height: 540, marginTop: 28 }}>
          {cards.slice(0, 3).reverse().map((idea, i, arr) => {
            const isTop = i === arr.length - 1;
            const depth = arr.length - 1 - i;
            return (
              <SwipeCard key={idea.id} idea={idea} depth={depth}
                onSwipe={isTop ? swipe : null}
                drag={isTop ? drag : { x: 0, y: 0, dragging: false }}
                setDrag={isTop ? setDrag : ()=>{}}
              />
            );
          })}
          {cards.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-strong)', borderRadius: 14, color: 'var(--fg-tertiary)' }}>
              <Icons.Check size={28}/>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Inbox zero.</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Muse will surface more after the next ideation cycle.</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 28 }}>
          <SwipeAction icon={<Icons.X size={18}/>} label="Skip" hint="←" tone="neutral" onClick={()=>swipe('skip')}/>
          <SwipeAction icon={<Icons.ArrDn size={18}/>} label="Maybe" hint="↓" tone="info" onClick={()=>swipe('maybe')}/>
          <SwipeAction icon={<Icons.Heart size={18}/>} label="Approve" hint="→" tone="brand" big onClick={()=>swipe('approve')}/>
          <div style={{ width: 1, height: 36, background: 'var(--border)', margin: '0 4px' }}/>
          <SwipeAction icon={<Icons.Bolt size={18}/>} label="Dispatch" hint="→ +" tone="success" onClick={()=>swipe('approve')}/>
        </div>
      </div>

      <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <div className="section-label">Maybe pool</div>
          <div className="mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{history.filter(h=>h.action==='maybe').length} parked · resurface in 7d</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {history.length === 0 && <div style={{ padding: 20, fontSize: 12, color: 'var(--fg-tertiary)' }}>Swipe ideas to populate.</div>}
          {history.map((h, i) => {
            const product = SEED_PRODUCTS.find(p=>p.id===h.idea.product);
            const colors = { approve: ['rgba(34,197,94,0.14)', '#22c55e'], maybe: ['rgba(59,130,246,0.14)', '#3b82f6'], skip: ['var(--surface-elevated)', 'var(--fg-tertiary)'] }[h.action];
            return (
              <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: 5, background: colors[0], color: colors[1], display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {h.action==='approve' ? <Icons.Check size={12}/> : h.action==='maybe' ? <Icons.ArrDn size={12}/> : <Icons.X size={12}/>}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>{h.idea.title}</div>
                  <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>{product.name} · {h.action}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SwipeAction({ icon, label, hint, tone, onClick, big }) {
  const tones = { neutral: ['var(--surface-elevated)', 'var(--fg-secondary)', 'var(--border)'], info: ['rgba(59,130,246,0.12)', '#3b82f6', 'rgba(59,130,246,0.3)'], brand: ['var(--accent)', '#1a0a02', 'var(--accent)'], success: ['rgba(34,197,94,0.12)', '#22c55e', 'rgba(34,197,94,0.3)'] };
  const [bg, fg, bc] = tones[tone];
  return (
    <button onClick={onClick} className="btn-h" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: big?44:38, padding: big?'0 18px':'0 14px', background: bg, color: fg, border: `1px solid ${bc}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
      {icon}{label}
      <Kbd>{hint}</Kbd>
    </button>
  );
}

function SwipeCard({ idea, depth, onSwipe, drag, setDrag }) {
  const ref = uRf_S(null);
  const product = SEED_PRODUCTS.find(p=>p.id===idea.product);
  const startRef = uRf_S({x:0,y:0});
  const onDown = (e) => {
    if (!onSwipe) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, dragging: true });
  };
  const onMove = (e) => {
    if (!drag.dragging || !onSwipe) return;
    setDrag({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y, dragging: true });
  };
  const onUp = () => {
    if (!drag.dragging || !onSwipe) return;
    if (drag.x > 110) onSwipe('approve');
    else if (drag.x < -110) onSwipe('skip');
    else if (drag.y > 110) onSwipe('maybe');
    else setDrag({ x: 0, y: 0, dragging: false });
  };
  uEf_S(() => {
    if (drag.dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }
  }, [drag.dragging, drag.x, drag.y]);

  const rot = drag.x * 0.05;
  const scale = 1 - depth * 0.04;
  const yOff = depth * 8;
  const opacity = depth === 0 ? 1 : 0.7;
  const overlayOpacity = Math.min(Math.abs(drag.x) / 100, 1);
  const action = drag.x > 30 ? 'approve' : drag.x < -30 ? 'skip' : drag.y > 30 ? 'maybe' : null;

  return (
    <div ref={ref} onMouseDown={onDown}
      style={{ position: 'absolute', inset: 0, transform: `translate(${onSwipe?drag.x:0}px, ${(onSwipe?drag.y:0)+yOff}px) rotate(${onSwipe?rot:0}deg) scale(${scale})`, opacity, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, cursor: onSwipe ? (drag.dragging?'grabbing':'grab') : 'default', userSelect: 'none', display: 'flex', flexDirection: 'column', boxShadow: depth===0?'var(--shadow-popover)':'none', transition: drag.dragging?'none':'transform var(--dur-base) var(--ease)', zIndex: 10 - depth }}>
      {action && (
        <div style={{ position: 'absolute', top: 18, [action==='approve'?'right':action==='skip'?'left':'left']: action==='maybe'?'50%':18, transform: action==='maybe'?'translateX(-50%)':'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', border: `2px solid ${action==='approve'?'#22c55e':action==='skip'?'#ef4444':'#3b82f6'}`, color: action==='approve'?'#22c55e':action==='skip'?'#ef4444':'#3b82f6', opacity: overlayOpacity, fontFamily: 'var(--font-mono)' }}>
          {action === 'approve' ? '✓ APPROVE' : action === 'skip' ? '✕ SKIP' : '↓ MAYBE'}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(249,115,22,0.18)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{product.icon}</span>
        <span className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)', letterSpacing: '0.06em' }}>{product.name.toUpperCase()} · {idea.category.toUpperCase()}</span>
        <span style={{ flex: 1 }}/>
        <Pill tone="brand" mono>{idea.source==='research'?'Scout':'Manual'}</Pill>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.015em', marginBottom: 12 }}>{idea.title}</div>
      <div style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.55, marginBottom: 14 }}>{idea.desc}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
        <ScoreCell label="Impact" value={idea.impact} accent/>
        <ScoreCell label="Feasibility" value={idea.feasibility}/>
        <ScoreCell label="Complexity" value={idea.complexity} text/>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {idea.tags.map(t => <span key={t} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-elevated)', color: 'var(--fg-secondary)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border)' }}>{t}</span>)}
      </div>
      <div style={{ marginTop: 'auto', padding: '10px 12px', background: 'var(--canvas)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--fg-tertiary)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <Icons.Brain size={12} style={{ marginTop: 2, flexShrink: 0, color: 'var(--accent)' }}/>
        <span><b style={{ color: 'var(--fg-secondary)' }}>Why this:</b> {idea.research}</span>
      </div>
    </div>
  );
}

function ScoreCell({ label, value, accent, text }) {
  return (
    <div style={{ background: 'var(--surface)', padding: '8px 10px' }}>
      <div className="section-label" style={{ marginBottom: 2 }}>{label}</div>
      <div className="mono-num" style={{ fontSize: 18, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--fg-primary)' }}>{value}{!text && '%'}</div>
    </div>
  );
}

Object.assign(window, { SwipeDeck });

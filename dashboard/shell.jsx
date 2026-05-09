// Shell — sidebar, topbar, command palette, live activity rail
const { useState: useS_S, useEffect: useE_S, useRef: useR_S } = React;

// ---------------- Live State Store (the heartbeat) ----------------
const LiveCtx = React.createContext(null);
function LiveProvider({ children }) {
  const [activity, setActivity] = useS_S(SEED_ACTIVITY);
  const [money, setMoney] = useS_S(31891.73);
  const [paused, setPaused] = useS_S(false);
  const [bumpKeys, setBumpKeys] = useS_S({});
  const idxRef = useR_S(0);

  useE_S(() => {
    if (paused) return;
    const tick = setInterval(() => {
      const ev = LIVE_STREAM[idxRef.current % LIVE_STREAM.length];
      idxRef.current++;
      const now = new Date();
      const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      setActivity(prev => [{ id: 'live-'+Date.now(), t, ...ev }, ...prev].slice(0, 40));
      if (ev.type === 'cash') {
        const m = ev.msg.match(/\$(\d+)/);
        if (m) {
          const inc = parseInt(m[1], 10);
          setMoney(v => v + inc);
          setBumpKeys(k => ({ ...k, money: Date.now() }));
        }
      }
      if (ev.type === 'idea_arrived') setBumpKeys(k => ({ ...k, ideas: Date.now() }));
      if (ev.type === 'lead_arrived') setBumpKeys(k => ({ ...k, leads: Date.now() }));
    }, 4200);
    return () => clearInterval(tick);
  }, [paused]);

  return <LiveCtx.Provider value={{ activity, money, paused, setPaused, bumpKeys }}>{children}</LiveCtx.Provider>;
}
function useLive() { return React.useContext(LiveCtx); }

// ---------------- Sidebar ----------------
function Sidebar({ active, onNav, counts }) {
  const items = [
    { id: 'cmd', label: 'Command', Icon: Icons.Radar },
    { id: 'queue', label: 'Mission Queue', Icon: Icons.Layers, badge: counts.queue },
    { id: 'coldcall', label: 'Cold Call', Icon: Icons.Phone, badge: counts.coldcall, badgeTone: 'success' },
    { id: 'ops', label: 'Ops + Autopilot', Icon: Icons.Activity, badge: counts.ops, badgeTone: 'success' },
    { id: 'actions', label: 'Action Catalog', Icon: Icons.Stack, badge: counts.actions, badgeTone: 'success' },
    { id: 'builder', label: 'Agent Builder', Icon: Icons.Brain, badge: counts.builder, badgeTone: 'success' },
    { id: 'content', label: 'Content Automation', Icon: Icons.Wand, badge: counts.content, badgeTone: 'success' },
    { id: 'onboarding', label: 'Customer Intake', Icon: Icons.Box, badge: counts.customerIntake, badgeTone: 'success' },
    { id: 'crons', label: 'Crons', Icon: Icons.Refresh, badge: counts.crons },
    { id: 'fleet', label: 'Fleet', Icon: Icons.Bot, badge: counts.fleet, badgeTone: 'success' },
    { id: 'swipe', label: 'Swipe Deck', Icon: Icons.Cards, badge: counts.swipe, badgePulse: true },
    { id: 'pipeline', label: 'Pipeline', Icon: Icons.Pipeline, badge: counts.pipeline },
    { id: 'products', label: 'Products', Icon: Icons.Box },
  ];
  return (
    <aside style={{
      width: 252, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)',
      height: '100vh', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0,
    }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icons.Radar size={16} style={{ color: '#1a0a02' }}/>
        </div>
        <div style={{ lineHeight: 1.1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>OpSpot</div>
          <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 700, letterSpacing: '0.04em' }}>MISSION CONTROL</div>
        </div>
      </div>
      <nav style={{ padding: 6, flex: 1, overflow: 'auto' }}>
        <div className="section-label" style={{ padding: '12px 10px 6px' }}>Chat</div>
        <SidebarItem id="chat" label="Chat" Icon={Icons.Send} active={active==='chat'} onClick={()=>onNav('chat')}/>
        <div className="section-label" style={{ padding: '14px 10px 6px' }}>Workspace</div>
        {items.map(it => <SidebarItem key={it.id} {...it} active={active === it.id} onClick={() => onNav(it.id)}/>)}
        <div className="section-label" style={{ padding: '14px 10px 6px' }}>OpSpot</div>
        <SidebarItem id="salvage" label="HEXT Salvage" Icon={Icons.Spark} active={active==='salvage'} onClick={()=>onNav('salvage')}/>
        <SidebarItem id="customers" label="Customers" Icon={Icons.Building} active={active==='customers'} onClick={()=>onNav('customers')}/>
        <SidebarItem id="approvals" label="Approvals" Icon={Icons.Check} active={active==='approvals'} onClick={()=>onNav('approvals')}/>
        <SidebarItem id="onboarding" label="Onboarding" Icon={Icons.Stack} active={active==='onboarding'} onClick={()=>onNav('onboarding')}/>
        <SidebarItem id="audit" label="Audit" Icon={Icons.Search} active={active==='audit'} onClick={()=>onNav('audit')}/>
        <SidebarItem id="proposals" label="Proposals" Icon={Icons.Mail} active={active==='proposals'} onClick={()=>onNav('proposals')}/>
        <SidebarItem id="inbound" label="Inbound" Icon={Icons.Mail} badge={counts.inbound} badgeTone="success" active={active==='inbound'} onClick={()=>onNav('inbound')}/>
        <SidebarItem id="outbound" label="Outbound" Icon={Icons.Send} active={active==='outbound'} onClick={()=>onNav('outbound')}/>
        <SidebarItem id="support" label="Support" Icon={Icons.Bot} active={active==='support'} onClick={()=>onNav('support')}/>
        <SidebarItem id="branding" label="Branding" Icon={Icons.Wand} active={active==='branding'} onClick={()=>onNav('branding')}/>
        <SidebarItem id="resources" label="Resources" Icon={Icons.Box} active={active==='resources'} onClick={()=>onNav('resources')}/>
        <div className="section-label" style={{ padding: '14px 10px 6px' }}>Reseller</div>
        <SidebarItem id="leads" label="Lead Finder" Icon={Icons.Target} active={active==='leads'} onClick={()=>onNav('leads')}/>
        <SidebarItem id="cash" label="Cash & Caps" Icon={Icons.Cash} active={active==='cash'} onClick={()=>onNav('cash')}/>
        <SidebarItem id="brand" label="White-label" Icon={Icons.Wand} active={active==='brand'} onClick={()=>onNav('brand')}/>
      </nav>
      <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
        <SidebarItem id="settings" label="Settings" Icon={Icons.Settings} active={active==='settings'} onClick={()=>onNav('settings')}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginTop: 4 }}>
          <Avatar name="Colton Harris" size={26} tone="brand"/>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>Colton Harris</div>
            <div style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', fontWeight: 700, letterSpacing: '0.03em' }}>OPSPOT · OPERATOR</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ label, Icon, badge, badgeTone = 'neutral', badgePulse, active, onClick }) {
  const [hover, setHover] = useS_S(false);
  const bg = active || hover ? 'var(--surface-hover)' : 'transparent';
  const color = active || hover ? 'var(--fg-primary)' : 'var(--fg-secondary)';
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{
      display: 'flex', alignItems: 'center', gap: 10, height: 32, padding: '0 10px', borderRadius: 7,
      background: bg, color, fontSize: 13, fontWeight: 500, cursor: 'pointer', position: 'relative',
      transition: 'background var(--dur-fast), color var(--dur-fast)',
    }}>
      {active && <div style={{ position: 'absolute', left: -6, top: 6, bottom: 6, width: 2, background: 'var(--accent)', borderRadius: '0 2px 2px 0' }}/>}
      <Icon size={14}/>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && (
        <span className="mono-num" style={{
          fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
          background: badgeTone==='success'?'rgba(34,197,94,0.14)':'var(--surface-elevated)',
          color: badgeTone==='success'?'#22c55e':'var(--fg-secondary)',
          border: `1px solid ${badgeTone==='success'?'rgba(34,197,94,0.25)':'var(--border)'}`,
          position: 'relative',
        }}>
          {badge}
          {badgePulse && <span className="pulse-dot" style={{ position: 'absolute', top: -2, right: -3, width: 6, height: 6 }}/>}
        </span>
      )}
    </div>
  );
}

// ---------------- Topbar ----------------
function Topbar({ title, breadcrumb, onCmdK }) {
  const live = useLive();
  return (
    <div style={{
      height: 60, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
      padding: '0 18px', gap: 14, background: 'var(--canvas)', position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {breadcrumb && <><span className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{breadcrumb}</span><span style={{ color: 'var(--fg-disabled)' }}>›</span></>}
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</span>
      </div>
      <button onClick={onCmdK} className="btn-h" style={{
        marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8,
        height: 30, padding: '0 10px 0 10px', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 7, color: 'var(--fg-tertiary)',
        fontSize: 12, fontWeight: 500, cursor: 'pointer', minWidth: 220, textAlign: 'left',
      }}>
        <Icons.Search size={13}/>
        <span style={{ flex: 1, textAlign: 'left' }}>Jump to anything</span>
        <Kbd>⌘</Kbd><Kbd>K</Kbd>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', height: 30, borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className={live.paused?'':'pulse-dot ok'} style={{ width: 7, height: 7, borderRadius: 999, background: live.paused?'var(--fg-tertiary)':'#22c55e' }}/>
        <span className="term" style={{ fontSize: 11, color: live.paused?'var(--fg-tertiary)':'var(--success)', fontWeight: 700, letterSpacing: '0.05em' }}>{live.paused?'PAUSED':'LIVE'}</span>
        <button onClick={()=>live.setPaused(p=>!p)} style={{ background: 'transparent', border: 'none', color: 'var(--fg-tertiary)', cursor: 'pointer', display: 'flex', padding: 0, marginLeft: 4 }}>
          {live.paused ? <Icons.Play size={11}/> : <Icons.Pause size={11}/>}
        </button>
      </div>
    </div>
  );
}

// ---------------- Activity Rail (right column on Command screen) ----------------
function ActivityRail({ height = '100%' }) {
  const live = useLive();
  const oc = (typeof useOpenClaw === 'function') ? useOpenClaw() : null;
  // Prefer real OpenClaw cron events if any have streamed in.
  const rawItems = (oc?.events && oc.events.length) ? oc.events : live.activity;
  const items = rawItems.map(enrichActivityItem).filter(ev => ev.major !== false);
  const groups = [
    { id: 'needs', label: 'Needs you', desc: 'Approvals, blockers, failures', tone: 'warning' },
    { id: 'sales', label: 'Sales + leads', desc: 'Inbound, booked calls, cash', tone: 'success' },
    { id: 'build', label: 'Build + onboarding', desc: 'Customer setup, PRs, shipped work', tone: 'brand' },
    { id: 'content', label: 'Content', desc: 'Ideas, posts, scripts, channels', tone: 'purple' },
    { id: 'ops', label: 'Ops + system', desc: 'Crons, watchdogs, health', tone: 'info' },
  ].map(g => ({ ...g, items: items.filter(i => i.group === g.id).slice(0, g.id === 'needs' ? 8 : 6) })).filter(g => g.items.length);
  const toneColor = (tone) => tone==='success'?'#22c55e':tone==='warning'?'#f59e0b':tone==='info'?'#3b82f6':tone==='brand'?'#f97316':tone==='purple'?'#a855f7':tone==='pink'?'#ec4899':tone==='critical'?'#ef4444':'var(--fg-tertiary)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icons.Activity size={14} style={{ color: 'var(--accent)' }}/>
        <div style={{ flex: 1 }}>
          <div className="section-label">Live activity {oc?.events?.length ? '· OpenClaw' : ''}</div>
          <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>Major events only · live + 5s safety refresh.</div>
        </div>
        <span className={live.paused?'':'pulse-dot ok'} style={{ width: 6, height: 6, borderRadius: 999, background: live.paused?'var(--fg-tertiary)':'#22c55e' }}/>
      </div>
      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', padding: '10px 10px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!groups.length && (
          <div style={{ border: '1px dashed var(--border)', borderRadius: 12, padding: 14, color: 'var(--fg-secondary)', fontSize: 12.5, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 900, color: 'var(--fg-primary)', marginBottom: 4 }}>Quiet right now</div>
            <div className="term" style={{ fontSize: 10.5 }}>Waiting for a major lead, onboarding, build, approval, watchdog, or failure event.</div>
          </div>
        )}
        {groups.map(group => (
          <div key={group.id} style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--canvas)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: toneColor(group.tone), flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '-.01em' }}>{group.label}</div>
                <div className="term" style={{ fontSize: 10, color: 'var(--fg-tertiary)', marginTop: 1 }}>{group.desc}</div>
              </div>
              <Pill tone={group.tone} dot={false} mono>{group.items.length}</Pill>
            </div>
            {group.items.map(ev => (
              <div key={ev.id} className="fade-up" style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 9, padding: '9px 10px', borderBottom: '1px solid var(--border)', alignItems: 'start' }}>
                <span className="term mono-num" style={{ fontSize: 10.5, color: 'var(--fg-disabled)', whiteSpace: 'nowrap', paddingTop: 2, fontWeight: 800, letterSpacing: '0.02em' }}>{ev.t}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 999, flexShrink: 0, background: toneColor(ev.tone) }}/>
                    <span className="term" style={{ fontSize: 10, color: toneColor(ev.tone), fontWeight: 900, letterSpacing: '.07em' }}>{ev.label}</span>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.35, color: 'var(--fg-primary)' }}>{ev.cleanMsg}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function enrichActivityItem(ev) {
  const msg = String(ev.msg || '');
  const lower = msg.toLowerCase();
  const major = !/heartbeat|session|chat|message|poll|routine|started/.test(lower) || /failed|error|blocked|approval|customer|onboard|lead|cash|proposal|shipped|built|deployed|watchdog/.test(lower);
  let group = 'ops';
  let label = 'SYSTEM';
  if (/fail|failed|error|stalled|blocked|denied|missing|needs you|approval|review/.test(lower) || ev.tone === 'warning' || ev.tone === 'critical') {
    group = 'needs'; label = /approval|review/.test(lower) ? 'APPROVAL' : 'CHECK';
  } else if (/lead|reply|demo|book|call|cash|paid|proposal|subscription|inbound|outbound/.test(lower)) {
    group = 'sales'; label = /cash|paid|subscription/.test(lower) ? 'CASH' : /lead|reply|book|demo/.test(lower) ? 'LEAD' : 'SALES';
  } else if (/content|instagram|youtube|twitch|post|script|hook|idea/.test(lower)) {
    group = 'content'; label = /idea/.test(lower) ? 'IDEA' : 'CONTENT';
  } else if (/build|built|ship|shipped|pr opened|merged|onboard|customer|setup|tests passing/.test(lower)) {
    group = 'build'; label = /onboard|customer|setup/.test(lower) ? 'ONBOARD' : /test/.test(lower) ? 'QA' : 'BUILD';
  } else if (/cron|watchdog|gateway|agent|health|tokens|cost|compute|research/.test(lower)) {
    group = 'ops'; label = /watchdog|cron/.test(lower) ? 'WATCHDOG' : /cost|compute|token/.test(lower) ? 'COST' : 'OPS';
  }
  return { ...ev, major, group, label, cleanMsg: msg.replace(/^([^·]+) · /, '').trim() };
}

// ---------------- Command Palette ----------------
function CommandPalette({ open, onClose, onNav }) {
  const [q, setQ] = useS_S('');
  useE_S(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  const items = [
    { id: 'cmd', icon: <Icons.Radar size={14}/>, label: 'Go to Command', kind: 'nav' },
    { id: 'chat', icon: <Icons.Send size={14}/>, label: 'Open Chat', kind: 'nav' },
    { id: 'queue', icon: <Icons.Layers size={14}/>, label: 'Go to Mission Queue', kind: 'nav' },
    { id: 'ops', icon: <Icons.Activity size={14}/>, label: 'Ops + Autopilot', kind: 'nav' },
    { id: 'actions', icon: <Icons.Stack size={14}/>, label: 'Agent Action Catalog', kind: 'nav' },
    { id: 'builder', icon: <Icons.Brain size={14}/>, label: 'Agent Builder · Tell Me What You Want', kind: 'nav' },
    { id: 'content', icon: <Icons.Wand size={14}/>, label: 'Content Automation · idea to approval', kind: 'nav' },
    { id: 'crons', icon: <Icons.Refresh size={14}/>, label: 'Go to Crons', kind: 'nav' },
    { id: 'fleet', icon: <Icons.Bot size={14}/>, label: 'Go to Fleet', kind: 'nav' },
    { id: 'swipe', icon: <Icons.Cards size={14}/>, label: 'Open Swipe Deck', kind: 'nav' },
    { id: 'pipeline', icon: <Icons.Pipeline size={14}/>, label: 'Go to Pipeline', kind: 'nav' },
    { id: 'products', icon: <Icons.Box size={14}/>, label: 'Go to Products', kind: 'nav' },
    { id: 'leads', icon: <Icons.Target size={14}/>, label: 'Lead Finder', kind: 'nav' },
    { id: 'cash', icon: <Icons.Cash size={14}/>, label: 'Cash & Caps', kind: 'nav' },
    { id: 'salvage', icon: <Icons.Spark size={14}/>, label: 'HEXT Salvage Map', kind: 'nav' },
    { id: 'customers', icon: <Icons.Building size={14}/>, label: 'Customers', kind: 'nav' },
    { id: 'approvals', icon: <Icons.Check size={14}/>, label: 'Approvals', kind: 'nav' },
    { id: 'onboarding', icon: <Icons.Stack size={14}/>, label: 'Onboarding', kind: 'nav' },
    { id: 'audit', icon: <Icons.Search size={14}/>, label: 'Audit', kind: 'nav' },
    { id: 'proposals', icon: <Icons.Mail size={14}/>, label: 'Proposals', kind: 'nav' },
    { id: 'inbound', icon: <Icons.Phone size={14}/>, label: 'Inbound', kind: 'nav' },
    { id: 'outbound', icon: <Icons.Send size={14}/>, label: 'Outbound', kind: 'nav' },
    { id: 'support', icon: <Icons.Bot size={14}/>, label: 'Support', kind: 'nav' },
    { id: 'branding', icon: <Icons.Wand size={14}/>, label: 'Branding', kind: 'nav' },
    { id: 'resources', icon: <Icons.Box size={14}/>, label: 'Resources', kind: 'nav' },
  ];
  const filtered = items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="backdrop" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width: 540, background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-popover)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <Icons.Search size={15} style={{ color: 'var(--fg-tertiary)' }}/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Jump to anything…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-primary)', fontSize: 14, fontFamily: 'inherit', fontWeight: 500 }}/>
          <Kbd>esc</Kbd>
        </div>
        <div style={{ maxHeight: 360, overflow: 'auto', padding: 6 }}>
          {filtered.map((it,i) => (
            <div key={it.id} onClick={() => { if (it.kind==='nav') onNav(it.id); onClose(); }} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', color: 'var(--fg-primary)', fontSize: 13 }}>
              <span style={{ color: 'var(--fg-secondary)' }}>{it.icon}</span>
              <span style={{ flex: 1 }}>{it.label}</span>
              <span className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{it.kind}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LiveProvider, useLive, Sidebar, Topbar, ActivityRail, CommandPalette });

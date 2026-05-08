// Primitives — cockpit-flavored Automio dark
const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// ---------------- Icons (Lucide-style inline SVGs, 1.75 stroke) ----------------
const Icon = ({ d, size = 16, fill = false, strokeWidth = 1.75, viewBox = "0 0 24 24", style, className }) => (
  <svg className={className} width={size} height={size} viewBox={viewBox} fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === 'string' ? <path d={d}/> : d}
  </svg>
);

const Icons = {
  Command: (p)=> <Icon {...p} d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>,
  Radar: (p)=> <Icon {...p} d={<g><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 17.34 14.16"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/></g>}/>,
  Layers: (p)=> <Icon {...p} d={<g><path d="m12.83 2.18 8.57 4.84a1 1 0 0 1 0 1.74l-8.57 4.84a2 2 0 0 1-1.66 0L2.6 8.76a1 1 0 0 1 0-1.74l8.57-4.84a2 2 0 0 1 1.66 0z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></g>}/>,
  Bot: (p)=> <Icon {...p} d={<g><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></g>}/>,
  Cards: (p)=> <Icon {...p} d={<g><rect x="3" y="3" width="14" height="18" rx="2" transform="rotate(-6 10 12)"/></g>}/>,
  Pipeline: (p)=> <Icon {...p} d={<g><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="11.5" x2="9" y2="11.5"/><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="18" x2="20" y2="18"/></g>}/>,
  Cash: (p)=> <Icon {...p} d={<g><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></g>}/>,
  Activity: (p)=> <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
  Bell: (p)=> <Icon {...p} d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M13.73 21a2 2 0 0 1-3.46 0"/>,
  Settings: (p)=> <Icon {...p} d={<g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></g>}/>,
  Plus: (p)=> <Icon {...p} d="M12 5v14M5 12h14"/>,
  Search: (p)=> <Icon {...p} d={<g><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></g>}/>,
  ArrowR: (p)=> <Icon {...p} d="M5 12h14M12 5l7 7-7 7"/>,
  ChevR: (p)=> <Icon {...p} d="m9 6 6 6-6 6"/>,
  ChevD: (p)=> <Icon {...p} d="m6 9 6 6 6-6"/>,
  Check: (p)=> <Icon {...p} d="m5 12 5 5L20 7"/>,
  X: (p)=> <Icon {...p} d="M18 6 6 18M6 6l12 12"/>,
  Heart: (p)=> <Icon {...p} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>,
  Bolt: (p)=> <Icon {...p} d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>,
  Pause: (p)=> <Icon {...p} d="M6 4h4v16H6zM14 4h4v16h-4z"/>,
  Play: (p)=> <Icon {...p} d="M8 5v14l11-7z"/>,
  Eye: (p)=> <Icon {...p} d={<g><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></g>}/>,
  Git: (p)=> <Icon {...p} d={<g><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9v6"/><path d="M9 18h6"/><path d="M18 15V9a4 4 0 0 0-4-4h-1"/><path d="m13 8 2-3-2-3"/></g>}/>,
  GitPR: (p)=> <Icon {...p} d={<g><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="m7 21 5-5-5-5"/></g>}/>,
  Brain: (p)=> <Icon {...p} d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 0 0 12 18Zm0 0a3 3 0 1 1 5.997.142 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 0 1 12 18Z"/>,
  Wand: (p)=> <Icon {...p} d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.5 1.5M15 12l-2-2M11 6l-2-2M5 16l-2 2M14 7l-1 1M3 22l8-8"/>,
  Mic: (p)=> <Icon {...p} d={<g><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3"/></g>}/>,
  Send: (p)=> <Icon {...p} d="m22 2-7 20-4-9-9-4 20-7z"/>,
  Phone: (p)=> <Icon {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>,
  Mail: (p)=> <Icon {...p} d={<g><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></g>}/>,
  ArrUp: (p)=> <Icon {...p} d="m18 15-6-6-6 6"/>,
  ArrDn: (p)=> <Icon {...p} d="m6 9 6 6 6-6"/>,
  TrendUp: (p)=> <Icon {...p} d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6"/>,
  Building: (p)=> <Icon {...p} d={<g><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/></g>}/>,
  Target: (p)=> <Icon {...p} d={<g><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></g>}/>,
  Skull: (p)=> <Icon {...p} d={<g><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2M12.5 17l-.5-1-.5 1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></g>}/>,
  Box: (p)=> <Icon {...p} d={<g><path d="m21 16-9 5-9-5V8l9-5 9 5z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></g>}/>,
  Flag: (p)=> <Icon {...p} d={<g><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></g>}/>,
  Filter: (p)=> <Icon {...p} d="M22 3H2l8 9.46V19l4 2v-8.54z"/>,
  Refresh: (p)=> <Icon {...p} d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>,
  Pin: (p)=> <Icon {...p} d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>,
  Spark: (p)=> <Icon {...p} d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>,
  More: (p)=> <Icon {...p} d={<g><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></g>}/>,
  Power: (p)=> <Icon {...p} d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>,
  Cpu: (p)=> <Icon {...p} d={<g><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></g>}/>,
  Stack: (p)=> <Icon {...p} d={<g><path d="M2 12h20M2 18h20M2 6h20"/></g>}/>,
  Globe: (p)=> <Icon {...p} d={<g><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></g>}/>,
  Coin: (p)=> <Icon {...p} d={<g><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9.5C9 8 10.34 7 12 7s3 1 3 2.5-1.34 2.5-3 2.5-3 1-3 2.5S10.34 17 12 17s3-1 3-2.5"/></g>}/>,
  Clock: (p)=> <Icon {...p} d={<g><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></g>}/>,
  Cmd: (p)=> <Icon {...p} d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>,
  Sliders: (p)=> <Icon {...p} d={<g><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></g>}/>,
};

// ---------------- Button ----------------
function Button({ variant = 'secondary', size = 'md', icon, children, onClick, style, active, ...rest }) {
  const sizes = { xs: { h: 26, px: 8, fs: 12 }, sm: { h: 30, px: 10, fs: 12.5 }, md: { h: 34, px: 12, fs: 13 }, lg: { h: 40, px: 16, fs: 14 } };
  const s = sizes[size];
  const variants = {
    primary: { background: 'var(--accent)', color: '#1a0a02', border: '1px solid transparent' },
    accent:  { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(249,115,22,0.25)' },
    secondary: { background: 'var(--surface-elevated)', color: 'var(--fg-primary)', border: '1px solid var(--border)' },
    ghost: { background: active ? 'var(--surface-hover)' : 'transparent', color: active ? 'var(--fg-primary)' : 'var(--fg-secondary)', border: '1px solid transparent' },
    outline: { background: 'transparent', color: 'var(--fg-primary)', border: '1px solid var(--border)' },
    danger: { background: 'transparent', color: 'var(--critical)', border: '1px solid rgba(239,68,68,0.3)' },
    success: { background: 'rgba(34,197,94,0.12)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.3)' },
  };
  return (
    <button onClick={onClick} className="btn-h" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: s.h, padding: `0 ${s.px}px`,
      borderRadius: 8, fontSize: s.fs, fontWeight: 700, cursor: 'pointer',
      transition: 'background var(--dur-fast), border-color var(--dur-fast)', whiteSpace: 'nowrap',
      ...variants[variant], ...style,
    }} {...rest}>
      {icon}{children}
    </button>
  );
}

// ---------------- Pill ----------------
function Pill({ tone = 'neutral', children, dot = true, mono = false }) {
  const map = {
    success: ['rgba(34,197,94,0.12)', '#22c55e', 'rgba(34,197,94,0.25)'],
    warning: ['rgba(245,158,11,0.12)', '#f59e0b', 'rgba(245,158,11,0.25)'],
    critical: ['rgba(239,68,68,0.12)', '#ef4444', 'rgba(239,68,68,0.25)'],
    info: ['rgba(59,130,246,0.12)', '#3b82f6', 'rgba(59,130,246,0.25)'],
    brand: ['rgba(249,115,22,0.12)', '#f97316', 'rgba(249,115,22,0.3)'],
    neutral: ['var(--surface-elevated)', 'var(--fg-secondary)', 'var(--border)'],
    purple: ['rgba(168,85,247,0.12)', '#a855f7', 'rgba(168,85,247,0.25)'],
  };
  const [bg, fg, bc] = map[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, background: bg, color: fg, lineHeight: 1.4, whiteSpace: 'nowrap',
      border: `1px solid ${bc}`, fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontVariantNumeric: 'tabular-nums',
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 999, background: fg }}/>}
      {children}
    </span>
  );
}

// ---------------- Card ----------------
function Card({ children, padding = 16, radius = 12, style, hover = false, accent, ...rest }) {
  return (
    <div {...rest} className={`${rest.className || ''} ${hover ? 'card-h' : ''}`} style={{
      background: 'var(--surface)', border: `1px solid ${accent ? 'rgba(249,115,22,0.4)' : 'var(--border)'}`,
      borderRadius: radius, padding,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ---------------- Money ----------------
function Money({ value, size = 'md', tone = 'primary', flash, prefix = '$' }) {
  const sizes = { xs: 12, sm: 14, md: 18, lg: 28, xl: 48, hero: 72 };
  const colors = { primary: 'var(--fg-primary)', accent: 'var(--accent)', success: 'var(--success)', critical: 'var(--critical)', secondary: 'var(--fg-secondary)' };
  const s = sizes[size];
  const formatted = value.toLocaleString('en-US', { minimumFractionDigits: s >= 28 ? 2 : 0, maximumFractionDigits: 2 });
  return (
    <span className={flash ? 'mono-num flash' : 'mono-num'} style={{ fontSize: s, fontWeight: 700, color: colors[tone], lineHeight: 1, letterSpacing: '-0.025em' }}>
      <span style={{ fontSize: s * 0.6, opacity: 0.55, marginRight: 1 }}>{prefix}</span>{formatted}
    </span>
  );
}

// ---------------- Section header ----------------
function SectionHeader({ label, count, action, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 8px' }}>
      <div className="section-label" style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{label}</div>
      {count != null && <div className="mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 700 }}>· {count}</div>}
      <div style={{ flex: 1, height: 1, background: 'var(--border)', marginLeft: 4 }}/>
      {action}
    </div>
  );
}

// ---------------- KBD ----------------
function Kbd({ children }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18,
      padding: '0 5px', borderRadius: 4, background: 'var(--surface-elevated)', color: 'var(--fg-secondary)',
      fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--font-mono)', border: '1px solid var(--border)',
    }}>{children}</kbd>
  );
}

// ---------------- Sparkline ----------------
function Sparkline({ data, color = 'var(--accent)', height = 28, width = 80, fill = true }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - ((v - min) / range) * height]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  const id = useMemo(() => 'g-' + Math.random().toString(36).slice(2, 9), []);
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`}/>}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ---------------- Avatar ----------------
function Avatar({ name, size = 28, tone = 'brand', src }) {
  const initials = name?.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || '??';
  const tones = { brand: ['rgba(249,115,22,0.18)', 'var(--accent)'], info: ['rgba(59,130,246,0.18)', '#3b82f6'], success: ['rgba(34,197,94,0.18)', '#22c55e'], purple: ['rgba(168,85,247,0.18)', '#a855f7'], pink: ['rgba(236,72,153,0.18)', '#ec4899'], cyan: ['rgba(34,211,238,0.18)', '#22d3ee'], neutral: ['var(--surface-elevated)', 'var(--fg-secondary)'] };
  const [bg, fg] = tones[tone] || tones.brand;
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0, border: '1px solid var(--border)' }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', borderRadius: 999 }}/> : initials}
    </div>
  );
}

// ---------------- Tabs ----------------
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'transparent', border: 'none', padding: '10px 14px', cursor: 'pointer',
            color: isActive ? 'var(--fg-primary)' : 'var(--fg-secondary)',
            borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
            fontSize: 13, fontWeight: 700, marginBottom: -1, fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {t.label}
            {t.count != null && <span className="mono-num" style={{ fontSize: 11, color: isActive ? 'var(--accent)' : 'var(--fg-tertiary)', fontWeight: 700 }}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { Icon, Icons, Button, Pill, Card, Money, SectionHeader, Kbd, Sparkline, Avatar, Tabs });

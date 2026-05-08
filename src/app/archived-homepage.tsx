'use client';

import { useState, useRef, useEffect } from 'react';

/* ─── DATA ──────────────────────────────────────────── */
const INDUSTRIES = [
  { name: 'Construction', niches: ['Roofing','General contractor','Electrical','Plumbing','HVAC','Concrete','Painting','Framing','Landscaping','Fencing','Drywall','Flooring','Solar installation'] },
  { name: 'Healthcare', niches: ['Dental','Chiropractic','Med spa','Veterinary','Optometry','Physical therapy','Mental health','Primary care','Dermatology','Orthodontics','Podiatry','Urgent care','Cosmetic surgery'] },
  { name: 'Home services', niches: ['Cleaning','Pest control','Lawn care','Pool service','Handyman','Locksmith','Moving','Junk removal','Pressure washing','Window cleaning','Carpet cleaning','Appliance repair','Tree service'] },
  { name: 'Food & Drink', niches: ['Restaurant','Catering','Food truck','Bakery','Bar/lounge','Coffee shop','Meal prep','Ghost kitchen','Brewery','Juice bar','Pizzeria','BBQ','Fine dining'] },
  { name: 'Legal', niches: ['Personal injury','Family law','Criminal defense','Estate planning','Immigration','Business law','Real estate law','Bankruptcy','Tax law','DUI defense','Employment law','Civil litigation'] },
  { name: 'Automotive', niches: ['Auto repair','Body shop','Detailing','Tire shop','Dealership','Towing','Oil change','Transmission','Auto glass','Diesel repair','Fleet maintenance','EV service'] },
  { name: 'Real estate', niches: ['Residential agent','Commercial agent','Property management','Mortgage broker','Home staging','Appraisal','Title company','Inspector','Vacation rental','HOA management'] },
  { name: 'Retail', niches: ['Clothing','Electronics','Jewelry','Pet store','Sporting goods','Furniture','Gift shop','Hardware','Florist','Bookstore','Toy store','Thrift/consignment'] },
];

const NICHE_GREETINGS: Record<string, string> = {};
INDUSTRIES.forEach(ind => {
  ind.niches.forEach(n => {
    const key = `${ind.name}::${n}`;
    NICHE_GREETINGS[key] = `${n} — awesome. I work with a lot of ${n.toLowerCase()} businesses. I can answer your phones while you're busy, follow up on estimates that haven't closed yet, manage your Google reviews, and run your ads. What's eating up most of your time right now?`;
  });
});

const QUICK_ACTIONS = [
  'Follow up on my estimates',
  'Answer my phones 24/7',
  'Help me get more leads',
  'Manage my Google reviews',
];

const TESTIMONIALS = [
  { name: 'Mike R.', role: 'Roofing contractor, Dallas TX', text: "King Mouse answers my calls while I'm on the roof. I've closed 3 extra jobs this month just from callbacks I would've missed." },
  { name: 'Sarah L.', role: 'Dental office manager, Austin TX', text: "We stopped losing patients to voicemail. King Mouse books appointments, sends reminders, and asks for Google reviews automatically." },
  { name: 'James T.', role: 'Auto repair shop owner, Phoenix AZ', text: "I was paying $22/hr for a receptionist who called in sick half the time. King Mouse works 24/7 for $4.98/hr. No brainer." },
];

const FEATURES = [
  { title: 'AI Receptionist', desc: 'Answers every call, books appointments, captures leads. Never misses a ring.', icon: '📞' },
  { title: 'Smart Follow-ups', desc: 'Automatically follows up on quotes, estimates, and leads that went cold.', icon: '🔁' },
  { title: 'Review Manager', desc: 'Requests Google reviews from happy customers. Responds to new reviews.', icon: '⭐' },
  { title: 'App Connections', desc: 'Connects to QuickBooks, Gmail, Google Calendar, Jobber, and 50+ more.', icon: '🔗' },
  { title: 'Full Dashboard', desc: 'See calls, leads, revenue, tasks, and everything in one place.', icon: '📊' },
  { title: 'Voice Chat', desc: 'Talk to King Mouse like a real employee. He understands your business.', icon: '🎤' },
];

type ChatMsg = { role: 'user' | 'assistant'; content: string };

/* ─── COMPONENT ──────────────────────────────────────── */
export default function LandingPage() {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: "Hey! I'm King Mouse. I help business owners like you answer phones, follow up on quotes, book appointments, and send invoices — for $4.98/hr instead of $35. What type of business do you run?" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [showFirewall, setShowFirewall] = useState(false);
  const [chatLocked, setChatLocked] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Industry/niche state
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [nichesVisible, setNichesVisible] = useState(false);

  // Dashboard preview state
  const [previewIndustry, setPreviewIndustry] = useState('Construction');
  const [previewNiche, setPreviewNiche] = useState('Roofing');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const dashRef = useRef<HTMLDivElement>(null);

  const hasInteracted = useRef(false);
  useEffect(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      return; // skip initial mount scroll
    }
    // scroll only the chat container, not the page
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /* ─── CHAT HANDLERS ─── */
  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || sending || chatLocked) return;

    const userMsg: ChatMsg = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);
    const newCount = msgCount + 1;
    setMsgCount(newCount);

    // After 3 user messages, show firewall
    if (newCount >= 3) {
      try {
        const res = await fetch('/api/trial-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            industry: selectedIndustry || '',
            niche: selectedNiche || '',
          }),
        });
        const data = await res.json();
        if (data.success) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.data.text }]);
        }
      } catch { /* ignore */ }
      setSending(false);
      setChatLocked(true);
      setTimeout(() => setShowFirewall(true), 1500);
      return;
    }

    try {
      const res = await fetch('/api/trial-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          industry: selectedIndustry || '',
          niche: selectedNiche || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a brief technical moment — try again!" }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection hiccup — try again!" }]);
    }
    setSending(false);
  }

  function handleIndustryClick(name: string) {
    if (selectedIndustry === name) {
      setSelectedIndustry(null);
      setNichesVisible(false);
      return;
    }
    setSelectedIndustry(name);
    setSelectedNiche(null);
    setNichesVisible(false);
    setTimeout(() => setNichesVisible(true), 50);
    // King Mouse acknowledges the industry
    setMessages(prev => [...prev, { role: 'assistant', content: `Great — ${name.toLowerCase()}! What's your specialty?` }]);
  }

  function handleNicheClick(niche: string) {
    setSelectedNiche(niche);
    const greeting = NICHE_GREETINGS[`${selectedIndustry}::${niche}`] || `${niche} — great choice! I can help with phones, follow-ups, reviews, and more. What's your biggest headache right now?`;
    setMessages(prev => [...prev, { role: 'assistant', content: greeting }]);
  }

  function handleDashboardMouse(e: React.MouseEvent) {
    if (!dashRef.current) return;
    const rect = dashRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 12,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * -12,
    });
  }

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const previewData = getPreviewData(previewIndustry);

  return (
    <div style={{ backgroundColor: '#FAF8F4', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ─── NAV ─── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e4df' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#1e2a3a', letterSpacing: '-0.5px' }}>Mouse<span style={{ color: '#F07020' }}>.</span></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#how-it-works" style={{ fontSize: 15, fontWeight: 500, color: '#5a6a7a', textDecoration: 'none' }}>How it works</a>
            <a href="#features" style={{ fontSize: 15, fontWeight: 500, color: '#5a6a7a', textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ fontSize: 15, fontWeight: 500, color: '#5a6a7a', textDecoration: 'none' }}>Pricing</a>
            <a href="/login" style={{ fontSize: 15, fontWeight: 600, color: '#1e2a3a', textDecoration: 'none' }}>Log in</a>
            <a href="/signup" style={{ fontSize: 15, fontWeight: 700, color: '#fff', backgroundColor: '#F07020', padding: '10px 22px', borderRadius: 10, textDecoration: 'none' }}>Get started free</a>
          </div>
        </div>
      </nav>

      {/* ─── HERO CHAT ─── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 40, backgroundColor: '#FFFDF9' }}>
        {/* Logo */}
        <div style={{ fontSize: 42, fontWeight: 800, color: '#1e2a3a', marginBottom: 12, letterSpacing: '-1px' }}>
          Mouse<span style={{ color: '#F07020' }}>.</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#1e2a3a', textAlign: 'center', marginBottom: 32, lineHeight: 1.15 }}>
          What can I do for{' '}
          <span style={{ fontFamily: "var(--font-instrument), 'Instrument Serif', serif", fontStyle: 'italic', color: '#F07020' }}>your business</span>
          ?
        </h1>

        {/* Chat area */}
        <div style={{ width: '100%', maxWidth: 680, padding: '0 24px' }}>
          {/* Messages */}
          <div ref={chatContainerRef} style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '14px 18px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.role === 'user' ? '#F07020' : '#f0ede8',
                  color: msg.role === 'user' ? '#fff' : '#1e2a3a',
                  fontSize: 15,
                  lineHeight: 1.55,
                  fontWeight: 500,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '14px 18px', borderRadius: '18px 18px 18px 4px', backgroundColor: '#f0ede8', color: '#5a6a7a', fontSize: 15 }}>
                  <span className="typing-dots">Thinking</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions (show after niche selected) */}
          {selectedNiche && msgCount === 0 && !chatLocked && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
              {QUICK_ACTIONS.map(action => (
                <button key={action} onClick={() => sendMessage(action)} style={{
                  padding: '10px 18px', fontSize: 14, fontWeight: 600, borderRadius: 20,
                  border: '1.5px solid #e8e4df', backgroundColor: '#fff', color: '#1e2a3a',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#F07020'; e.currentTarget.style.color = '#F07020'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e4df'; e.currentTarget.style.color = '#1e2a3a'; }}
                >{action}</button>
              ))}
            </div>
          )}

          {/* Input box */}
          <div style={{ position: 'relative', backgroundColor: '#fff', borderRadius: 16, border: '2px solid #e8e4df', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { if (!chatLocked) setInput(e.target.value); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              placeholder={chatLocked ? "Create a free account to keep chatting..." : "Tell me about your business or pick your industry below..."}
              disabled={chatLocked}
              rows={1}
              style={{ width: '100%', padding: '18px 60px 18px 20px', fontSize: 16, border: 'none', outline: 'none', resize: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", color: chatLocked ? '#999' : '#1e2a3a', backgroundColor: 'transparent', cursor: chatLocked ? 'not-allowed' : 'text' }}
            />
            <button onClick={() => chatLocked ? setShowFirewall(true) : sendMessage()} disabled={sending || (!chatLocked && !input.trim())} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: 10, border: 'none',
              backgroundColor: input.trim() ? '#F07020' : '#e8e4df',
              color: '#fff', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
              fontSize: 20,
            }}>↑</button>
          </div>
        </div>

        {/* Industry pills */}
        <div style={{ maxWidth: 720, padding: '0 24px', marginTop: 28, width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {INDUSTRIES.map(ind => (
              <button
                key={ind.name}
                onClick={() => handleIndustryClick(ind.name)}
                style={{
                  padding: '11px 22px', fontSize: 15, fontWeight: 600, borderRadius: 24,
                  border: '2px solid transparent',
                  backgroundColor: selectedIndustry === ind.name ? '#F07020' : '#fff',
                  color: selectedIndustry === ind.name ? '#fff' : '#1e2a3a',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: selectedIndustry === ind.name ? '0 2px 12px rgba(240,112,32,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >{ind.name}</button>
            ))}
          </div>

          {/* Niche pills - animated */}
          <div style={{
            maxHeight: nichesVisible && selectedIndustry ? 200 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.4s ease, opacity 0.3s ease',
            opacity: nichesVisible && selectedIndustry ? 1 : 0,
            marginTop: nichesVisible && selectedIndustry ? 16 : 0,
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {INDUSTRIES.find(i => i.name === selectedIndustry)?.niches.map(niche => (
                <button
                  key={niche}
                  onClick={() => handleNicheClick(niche)}
                  style={{
                    padding: '8px 16px', fontSize: 14, fontWeight: 500, borderRadius: 20,
                    border: selectedNiche === niche ? '2px solid #F07020' : '1.5px solid #e8e4df',
                    backgroundColor: selectedNiche === niche ? '#FFF3EB' : '#fff',
                    color: selectedNiche === niche ? '#F07020' : '#5a6a7a',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >{niche}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.5 }}>
          <span style={{ fontSize: 13, color: '#5a6a7a', fontWeight: 500 }}>Scroll to learn more</span>
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M1 1L10 10L19 1" stroke="#5a6a7a" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      </section>

      {/* ─── FIREWALL MODAL ─── */}
      {showFirewall && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 440, width: '90%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setShowFirewall(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#999', cursor: 'pointer' }}>×</button>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🐭</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1e2a3a', marginBottom: 12 }}>Want to keep going?</h3>
            <p style={{ fontSize: 16, color: '#5a6a7a', lineHeight: 1.6, marginBottom: 28 }}>
              Create your free account and get <strong>2 work hours</strong> to test King Mouse with your real business.
            </p>
            <a href={`/signup?niche=${slugify(selectedNiche || '')}&industry=${slugify(selectedIndustry || '')}`} style={{
              display: 'block', padding: '16px 32px', fontSize: 18, fontWeight: 700,
              backgroundColor: '#F07020', color: '#fff', borderRadius: 12,
              textDecoration: 'none', marginBottom: 12,
            }}>Create free account</a>
            <p style={{ fontSize: 13, color: '#999' }}>No credit card required</p>
          </div>
        </div>
      )}

      {/* ─── PRICE STRIP ─── */}
      <section style={{ backgroundColor: '#1e2a3a', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 28, color: '#fff', opacity: 0.4, textDecoration: 'line-through', fontWeight: 600 }}>$35/hr</span>
            <span style={{ fontSize: 14, color: '#fff', opacity: 0.4, marginLeft: 8 }}>typical employee</span>
          </div>
          <svg width="32" height="2"><rect width="32" height="2" fill="#fff" opacity="0.2"/></svg>
          <div>
            <span style={{ fontSize: 44, fontWeight: 800, color: '#F07020' }}>$4.98</span>
            <span style={{ fontSize: 18, color: '#F07020', fontWeight: 600 }}>/hr</span>
          </div>
          <div style={{ backgroundColor: '#1D9E75', padding: '8px 20px', borderRadius: 20, fontSize: 15, fontWeight: 700, color: '#fff' }}>
            Save 86%
          </div>
        </div>
      </section>

      {/* ─── DASHBOARD PREVIEW ─── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#FAF8F4' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1e2a3a', textAlign: 'center', marginBottom: 8 }}>
            Your AI employee&apos;s{' '}
            <span style={{ fontFamily: "var(--font-instrument), 'Instrument Serif', serif", fontStyle: 'italic', color: '#F07020' }}>command center</span>
          </h2>
          <p style={{ textAlign: 'center', color: '#5a6a7a', fontSize: 18, marginBottom: 32 }}>Pick an industry to see a live preview</p>

          {/* Industry pills for preview */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {INDUSTRIES.map(ind => (
              <button key={ind.name} onClick={() => { setPreviewIndustry(ind.name); setPreviewNiche(ind.niches[0]); }} style={{
                padding: '9px 18px', fontSize: 14, fontWeight: 600, borderRadius: 20,
                border: previewIndustry === ind.name ? '2px solid #F07020' : '1.5px solid #e8e4df',
                backgroundColor: previewIndustry === ind.name ? '#FFF3EB' : '#fff',
                color: previewIndustry === ind.name ? '#F07020' : '#5a6a7a',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{ind.name}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 40 }}>
            {INDUSTRIES.find(i => i.name === previewIndustry)?.niches.slice(0, 8).map(n => (
              <button key={n} onClick={() => setPreviewNiche(n)} style={{
                padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 16,
                border: previewNiche === n ? '1.5px solid #1D9E75' : '1px solid #e8e4df',
                backgroundColor: previewNiche === n ? '#e6f7f1' : '#fff',
                color: previewNiche === n ? '#1D9E75' : '#5a6a7a',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{n}</button>
            ))}
          </div>

          {/* 3D Dashboard card */}
          <div ref={dashRef} onMouseMove={handleDashboardMouse} onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
            style={{ maxWidth: 900, margin: '0 auto', perspective: '1200px' }}>
            <div style={{
              transform: `rotateY(${mousePos.x}deg) rotateX(${mousePos.y}deg)`,
              transition: 'transform 0.1s ease-out',
              borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              border: '1px solid #e8e4df',
            }}>
              {/* Dashboard mock */}
              <div style={{ display: 'flex', minHeight: 400 }}>
                {/* Sidebar */}
                <div style={{ width: 220, backgroundColor: '#1e2a3a', padding: '24px 0', flexShrink: 0 }}>
                  <div style={{ padding: '0 20px', marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', opacity: 0.9 }}>{previewNiche} Co.</div>
                    <div style={{ fontSize: 11, color: '#fff', opacity: 0.4, marginTop: 2 }}>{previewIndustry}</div>
                  </div>
                  {['King Mouse', 'Dashboard', ...previewData.tabs].map((tab, i) => (
                    <div key={tab} style={{
                      padding: '10px 20px', fontSize: 13, fontWeight: i === 0 ? 700 : 500,
                      color: '#fff', opacity: i === 0 ? 1 : 0.5,
                      backgroundColor: i === 0 ? 'rgba(29,158,117,0.2)' : 'transparent',
                      borderLeft: i === 0 ? '3px solid #1D9E75' : '3px solid transparent',
                    }}>{tab}</div>
                  ))}
                </div>
                {/* Main content */}
                <div style={{ flex: 1, backgroundColor: '#f6f6f4', padding: 24 }}>
                  {/* Metrics row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {previewData.metrics.map(m => (
                      <div key={m.label} style={{ backgroundColor: '#fff', borderRadius: 10, padding: '16px 14px', border: '1px solid #e8e4df' }}>
                        <div style={{ fontSize: 11, color: '#5a6a7a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e2a3a', marginTop: 4 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Activity */}
                  <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e8e4df' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2a3a', marginBottom: 12 }}>Recent activity</div>
                    {previewData.activity.map((a, i) => (
                      <div key={i} style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid #f0ede8' : 'none', fontSize: 13, color: '#5a6a7a' }}>
                        <span style={{ color: '#1D9E75', fontWeight: 600 }}>King Mouse</span> {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" style={{ padding: '80px 24px', backgroundColor: '#FFFDF9' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1e2a3a', textAlign: 'center', marginBottom: 48 }}>
            Up and running in{' '}
            <span style={{ fontFamily: "var(--font-instrument), 'Instrument Serif', serif", fontStyle: 'italic', color: '#F07020' }}>5 minutes</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
            {[
              { step: '1', title: 'Pick your industry', desc: 'Select your niche. King Mouse loads tools, templates, and knowledge specific to your business.' },
              { step: '2', title: 'Answer a few questions', desc: 'Company name, location, biggest headache. Takes 60 seconds. King Mouse learns your business.' },
              { step: '3', title: 'Start working', desc: 'King Mouse answers calls, follows up on leads, manages reviews, and handles operations. 24/7.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#F07020', color: '#fff', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{s.step}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e2a3a', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: '#5a6a7a', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: '80px 24px', backgroundColor: '#FAF8F4' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1e2a3a', textAlign: 'center', marginBottom: 48 }}>
            Everything a $35/hr employee does.{' '}
            <span style={{ fontFamily: "var(--font-instrument), 'Instrument Serif', serif", fontStyle: 'italic', color: '#F07020' }}>For $4.98.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ backgroundColor: '#fff', borderRadius: 14, padding: '28px 24px', border: '1px solid #e8e4df' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e2a3a', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: '#5a6a7a', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INDUSTRY TICKER ─── */}
      <section style={{ padding: '32px 0', backgroundColor: '#1e2a3a', overflow: 'hidden' }}>
        <div className="ticker-track" style={{ display: 'flex', gap: 32, whiteSpace: 'nowrap' }}>
          {[...INDUSTRIES.flatMap(i => i.niches), ...INDUSTRIES.flatMap(i => i.niches)].map((n, i) => (
            <span key={i} style={{ fontSize: 14, fontWeight: 500, color: '#fff', opacity: 0.4 }}>{n}</span>
          ))}
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ padding: '64px 24px', backgroundColor: '#FFFDF9' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, textAlign: 'center' }}>
          {[
            { value: '86%', label: 'cheaper than hiring' },
            { value: '24/7', label: 'always available' },
            { value: '22hrs', label: 'saved per week avg' },
            { value: '5min', label: 'setup time' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#F07020' }}>{s.value}</div>
              <div style={{ fontSize: 15, color: '#5a6a7a', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#FAF8F4' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1e2a3a', textAlign: 'center', marginBottom: 48 }}>
            Business owners{' '}
            <span style={{ fontFamily: "var(--font-instrument), 'Instrument Serif', serif", fontStyle: 'italic', color: '#F07020' }}>love</span>{' '}
            King Mouse
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ backgroundColor: '#fff', borderRadius: 14, padding: '28px 24px', border: '1px solid #e8e4df' }}>
                <p style={{ fontSize: 15, color: '#1e2a3a', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e2a3a' }}>{t.name}</div>
                <div style={{ fontSize: 13, color: '#5a6a7a' }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ padding: '80px 24px', backgroundColor: '#FFFDF9' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1e2a3a', marginBottom: 12 }}>
            Simple{' '}
            <span style={{ fontFamily: "var(--font-instrument), 'Instrument Serif', serif", fontStyle: 'italic', color: '#F07020' }}>pricing</span>
          </h2>
          <p style={{ color: '#5a6a7a', fontSize: 16, marginBottom: 32 }}>Pay only for the hours King Mouse works. No contracts.</p>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '40px 32px', border: '2px solid #F07020', boxShadow: '0 8px 32px rgba(240,112,32,0.1)' }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: '#F07020' }}>$4.98<span style={{ fontSize: 20, fontWeight: 600 }}>/hr</span></div>
            <p style={{ color: '#5a6a7a', fontSize: 15, margin: '16px 0 24px', lineHeight: 1.6 }}>Includes AI receptionist, lead follow-up, review management, full dashboard, and all 150+ integrations.</p>
            <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
              {['2 free hours to start', 'No credit card required', 'Cancel anytime', 'Works 24/7', '150+ industry configs'].map(item => (
                <li key={item} style={{ padding: '8px 0', fontSize: 15, color: '#1e2a3a', fontWeight: 500 }}>
                  <span style={{ color: '#1D9E75', marginRight: 10 }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <a href="/signup" style={{ display: 'block', padding: '16px 32px', fontSize: 18, fontWeight: 700, backgroundColor: '#F07020', color: '#fff', borderRadius: 12, textDecoration: 'none' }}>
              Start free — no credit card
            </a>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#1e2a3a', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Ready to hire your{' '}
          <span style={{ fontFamily: "var(--font-instrument), 'Instrument Serif', serif", fontStyle: 'italic', color: '#F07020' }}>AI employee</span>?
        </h2>
        <p style={{ color: '#fff', opacity: 0.7, fontSize: 18, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
          2 free work hours. No credit card. Setup takes 5 minutes.
        </p>
        <a href="/signup" style={{ display: 'inline-block', padding: '18px 40px', fontSize: 20, fontWeight: 700, backgroundColor: '#F07020', color: '#fff', borderRadius: 12, textDecoration: 'none' }}>
          Get started free
        </a>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: '40px 24px', backgroundColor: '#161e2a', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Mouse<span style={{ color: '#F07020' }}>.</span></div>
        <p style={{ color: '#fff', opacity: 0.4, fontSize: 14 }}>AI employees for small business. 150+ industries. $4.98/hr.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
          <a href="/login" style={{ color: '#fff', opacity: 0.5, fontSize: 14, textDecoration: 'none' }}>Log in</a>
          <a href="/signup" style={{ color: '#fff', opacity: 0.5, fontSize: 14, textDecoration: 'none' }}>Sign up</a>
          <a href="mailto:colton.harris@automioapp.com" style={{ color: '#fff', opacity: 0.5, fontSize: 14, textDecoration: 'none' }}>Contact</a>
        </div>
        <p style={{ color: '#fff', opacity: 0.25, fontSize: 12, marginTop: 24 }}>© 2026 Mouse Platform. All rights reserved.</p>
      </footer>

      {/* ─── GLOBAL STYLES ─── */}
      <style>{`
        .typing-dots::after { content: '...'; animation: dots 1.5s infinite; }
        @keyframes dots { 0%,20% { content: '.'; } 40% { content: '..'; } 60%,100% { content: '...'; } }
        .ticker-track { animation: ticker 60s linear infinite; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @media (max-width: 768px) {
          nav > div > div:nth-child(2) a:not(:last-child):not(:nth-last-child(2)) { display: none; }
        }
        textarea::placeholder { color: #999; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

/* ─── DASHBOARD PREVIEW DATA ─── */
function getPreviewData(industry: string) {
  const configs: Record<string, { tabs: string[]; metrics: { label: string; value: string }[]; activity: string[] }> = {
    Construction: { tabs: ['Lead funnel', 'Estimates', 'Job scheduler', 'Reviews', 'Ads'], metrics: [{ label: 'Calls', value: '12' }, { label: 'Leads', value: '8' }, { label: 'Jobs', value: '3' }, { label: 'Revenue', value: '$14.2k' }], activity: ['followed up on estimate for Smith residence', 'answered call from new lead — roof inspection', 'sent Google review request to Johnson family', 'scheduled crew for Monday 8am — 742 Oak St'] },
    Healthcare: { tabs: ['Appointments', 'Patient intake', 'Billing', 'Reviews', 'Referrals'], metrics: [{ label: 'Appointments', value: '24' }, { label: 'Patients', value: '18' }, { label: 'No-shows', value: '1' }, { label: 'Billings', value: '$8.4k' }], activity: ['confirmed appointment for Sarah M. — 2pm', 'sent intake forms to new patient', 'requested review from completed visit', 'rescheduled cancellation to Thursday'] },
    'Home services': { tabs: ['Lead funnel', 'Scheduling', 'Estimates', 'Reviews', 'Route planner'], metrics: [{ label: 'Calls', value: '9' }, { label: 'Bookings', value: '6' }, { label: 'Reviews', value: '4.8', }, { label: 'Revenue', value: '$3.2k' }], activity: ['booked cleaning for 123 Main St — Friday', 'sent follow-up estimate to Williams household', 'responded to 5-star Google review', 'optimized tomorrow\'s route — 3 stops'] },
    'Food & Drink': { tabs: ['Reservations', 'Orders', 'Menu builder', 'Reviews', 'Social media'], metrics: [{ label: 'Reservations', value: '32' }, { label: 'Orders', value: '47' }, { label: 'Rating', value: '4.7' }, { label: 'Revenue', value: '$6.8k' }], activity: ['confirmed 8pm reservation for party of 6', 'responded to Yelp review — 4 stars', 'posted daily special to Instagram', 'sent catering quote to corporate client'] },
    Legal: { tabs: ['Case intake', 'Client portal', 'Billing', 'Calendar', 'Documents'], metrics: [{ label: 'Inquiries', value: '7' }, { label: 'Consults', value: '4' }, { label: 'Active cases', value: '12' }, { label: 'Billings', value: '$18k' }], activity: ['scheduled free consultation — personal injury', 'sent retainer agreement to new client', 'followed up on outstanding invoice', 'filed motion deadline reminder — Thursday'] },
    Automotive: { tabs: ['Work orders', 'Estimates', 'Parts inventory', 'Reviews', 'Scheduling'], metrics: [{ label: 'Calls', value: '14' }, { label: 'Work orders', value: '8' }, { label: 'Reviews', value: '4.6' }, { label: 'Revenue', value: '$9.1k' }], activity: ['created estimate — brake job, 2018 Camry', 'texted customer: vehicle ready for pickup', 'ordered parts from AutoZone — alternator', 'requested Google review from satisfied customer'] },
    'Real estate': { tabs: ['Listings', 'Showings', 'Client CRM', 'Market reports', 'Marketing'], metrics: [{ label: 'Showings', value: '6' }, { label: 'Leads', value: '11' }, { label: 'Listings', value: '4' }, { label: 'Volume', value: '$1.2M' }], activity: ['scheduled showing for 456 Elm — Saturday 2pm', 'sent market report to seller lead', 'followed up with buyer from open house', 'posted new listing to MLS and Zillow'] },
    Retail: { tabs: ['Inventory', 'Orders', 'Customers', 'Reviews', 'Promotions'], metrics: [{ label: 'Orders', value: '28' }, { label: 'Customers', value: '19' }, { label: 'Rating', value: '4.8' }, { label: 'Revenue', value: '$4.5k' }], activity: ['processed online order #1847 — shipped', 'sent loyalty discount to returning customer', 'restocked low-inventory alert — 3 items', 'posted new arrivals to social media'] },
  };
  return configs[industry] || configs.Construction;
}

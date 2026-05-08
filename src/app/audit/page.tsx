'use client';

import { useState, useEffect, useRef } from 'react';
import { Map, BarChart3, Route, Phone, Mail, Share2, Settings, TrendingUp, Bot, Check, ChevronDown } from 'lucide-react';

/* ─── CONSTANTS ──────────────────────────────────────── */
const COLORS = {
  navy: '#1e2a3a',
  orange: '#F07020',
  cream: '#FAF8F4',
  creamAlt: '#FFFDF9',
  muted: '#5a6a7a',
  border: '#e8e4df',
  green: '#1D9E75',
  white: '#fff',
};

const SERIF = "var(--font-instrument), 'Instrument Serif', serif";
const SANS = "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif";

const DELIVERABLES = [
  { icon: Map, title: 'Operations Map', desc: 'A visual breakdown of every task your team handles manually today.' },
  { icon: BarChart3, title: 'AI Opportunity Score', desc: 'Each process ranked by automation potential and ROI.' },
  { icon: Route, title: 'Custom Roadmap', desc: 'A prioritized plan showing what to automate first and expected savings.' },
];

const QUALIFIERS = [
  'You have 1\u201350 employees',
  'Your team wastes hours on repetitive tasks',
  'You\u2019re spending too much on headcount for manual work',
  'You know AI can help but don\u2019t know where to start',
];

const STEPS = [
  { num: '1', title: 'Book a Call', desc: 'Pick a 30-minute slot. We come prepared with preliminary research on your business.' },
  { num: '2', title: 'We Diagnose', desc: 'Walk through your operations together and identify the highest-impact automation opportunities.' },
  { num: '3', title: 'Get Your Roadmap', desc: 'Receive a custom AI implementation plan with clear ROI projections within 24 hours.' },
];

const CAPABILITIES = [
  { icon: TrendingUp, title: 'Lead Generation', desc: 'Capture, score, and follow up with leads automatically.' },
  { icon: Phone, title: 'Customer Communication', desc: 'AI phone, email, and chat that sounds like your best employee.' },
  { icon: Share2, title: 'Social Media & Content', desc: 'Consistent posting and engagement on autopilot.' },
  { icon: Settings, title: 'Operations & Workflow', desc: 'Scheduling, invoicing, inventory tracking, reporting \u2014 automated.' },
  { icon: Mail, title: 'Marketing', desc: 'Never let a warm lead go cold again.' },
  { icon: Bot, title: 'Custom AI Agents', desc: 'Purpose-built AI for whatever your business needs.' },
];

const STATS = [
  { value: '10,000+', label: 'Hours Saved' },
  { value: '200+', label: 'Businesses Audited' },
  { value: '$50M+', label: 'In Identified Savings' },
];

const FAQS = [
  { q: 'What exactly is an AI Business Audit?', a: 'It\u2019s a free 30-minute call where we map out your day-to-day operations, identify which tasks can be automated with AI, and deliver a custom roadmap showing exactly what to automate, in what order, and the expected ROI.' },
  { q: 'How long does it take?', a: '30 minutes for the call itself. You\u2019ll receive your full written roadmap within 24 hours.' },
  { q: 'Is it really free?', a: 'Yes. No credit card, no obligation, no hidden fees. The audit is designed to give you clarity \u2014 whether you work with us or not.' },
  { q: 'What happens after the audit?', a: 'We\u2019ll present a recommended plan tailored to your business. You decide if and when you want to move forward. There\u2019s no pressure and no hard sell.' },
  { q: 'Do I need technical knowledge?', a: 'Not at all. We handle everything \u2014 from strategy to implementation to ongoing management. You just tell us about your business.' },
  { q: 'What size business is this for?', a: 'We work best with businesses that have 1\u201350 employees across any industry. If your team is doing repetitive work, we can probably help.' },
  { q: 'Do you offer in-person audits?', a: 'Yes! We\u2019re based in Wilmington, NC and offer free in-person audits for local businesses. We\u2019ll come to your office, walk through your operations firsthand, and deliver a hands-on roadmap tailored to exactly how your team works.' },
];

/* ─── COMPONENT ──────────────────────────────────────── */
export default function AuditPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const calendlyRef = useRef<HTMLDivElement>(null);

  // Load Calendly embed script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div style={{ backgroundColor: COLORS.cream, minHeight: '100vh', fontFamily: SANS }}>

      {/* ─── NAV ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: COLORS.navy, letterSpacing: '-0.5px', cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Mouse<span style={{ color: COLORS.orange }}>.</span>
          </span>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
            <a onClick={() => scrollTo('what-you-get')} style={{ fontSize: 15, fontWeight: 500, color: COLORS.muted, textDecoration: 'none', cursor: 'pointer' }}>What You Get</a>
            <a onClick={() => scrollTo('how-it-works')} style={{ fontSize: 15, fontWeight: 500, color: COLORS.muted, textDecoration: 'none', cursor: 'pointer' }}>How It Works</a>
            <a onClick={() => scrollTo('faq')} style={{ fontSize: 15, fontWeight: 500, color: COLORS.muted, textDecoration: 'none', cursor: 'pointer' }}>FAQ</a>
            <button onClick={() => scrollTo('book')} style={{
              fontSize: 15, fontWeight: 700, color: COLORS.white, backgroundColor: COLORS.orange,
              padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
            }}>Book Your Free Audit</button>
          </div>

          {/* Mobile CTA */}
          <button onClick={() => scrollTo('book')} style={{
            fontSize: 14, fontWeight: 700, color: COLORS.white, backgroundColor: COLORS.orange,
            padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
          }} className="nav-mobile">Book Free Audit</button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.creamAlt,
        textAlign: 'center', padding: '120px 24px 40px',
      }}>
        <div style={{
          fontSize: 13, fontWeight: 700, letterSpacing: '2.5px', color: COLORS.orange,
          textTransform: 'uppercase' as const, marginBottom: 20,
        }}>
          Free AI Business Audit
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: COLORS.navy,
          lineHeight: 1.12, marginBottom: 20, maxWidth: 800,
        }}>
          Find out exactly where AI can{' '}
          <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: COLORS.orange }}>
            save you 20+ hours a week
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)', color: COLORS.muted, lineHeight: 1.6,
          maxWidth: 620, marginBottom: 36,
        }}>
          A 30-minute diagnostic where we map your operations and show you which tasks AI can handle &mdash; delivered as a custom roadmap within 24 hours.
        </p>

        <button onClick={() => scrollTo('book')} style={{
          fontSize: 18, fontWeight: 700, color: COLORS.white, backgroundColor: COLORS.orange,
          padding: '16px 40px', borderRadius: 12, border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(240,112,32,0.3)', transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(240,112,32,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(240,112,32,0.3)'; }}
        >
          Book Your Free Audit
        </button>

        <p style={{ fontSize: 14, color: COLORS.muted, marginTop: 16, letterSpacing: '0.3px' }}>
          No commitment &middot; No sales pitch &middot; Just clarity
        </p>

        <div style={{
          marginTop: 32, padding: '14px 24px', borderRadius: 12,
          backgroundColor: 'rgba(30,42,58,0.06)', display: 'inline-flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <span style={{ fontSize: 15, color: COLORS.navy, fontWeight: 600 }}>
            Based in Wilmington, NC &mdash; we offer free in-person audits for local businesses
          </span>
        </div>
      </section>

      {/* ─── WHAT YOU GET ─── */}
      <section id="what-you-get" style={{ padding: '64px 24px 80px', backgroundColor: COLORS.cream }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: COLORS.navy,
            textAlign: 'center', marginBottom: 12,
          }}>
            What you{' '}
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: COLORS.orange }}>walk away with</span>
          </h2>
          <p style={{ textAlign: 'center', color: COLORS.muted, fontSize: 17, marginBottom: 48, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
            Every audit includes three concrete deliverables &mdash; yours to keep regardless of next steps.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {DELIVERABLES.map((d, i) => (
              <div key={i} style={{
                backgroundColor: COLORS.white, borderRadius: 16, padding: '32px 28px',
                border: `1px solid ${COLORS.border}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF3EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                }}>
                  <d.icon size={24} color={COLORS.orange} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>{d.title}</h3>
                <p style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.6 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO IT'S FOR ─── */}
      <section style={{ padding: '80px 24px', backgroundColor: COLORS.creamAlt }}>
        <div style={{
          maxWidth: 960, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48,
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{
              fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: COLORS.navy,
              marginBottom: 16, lineHeight: 1.15,
            }}>
              Built for business owners who are{' '}
              <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: COLORS.orange }}>stretched thin</span>
            </h2>
            <p style={{ fontSize: 17, color: COLORS.muted, lineHeight: 1.7 }}>
              You didn&apos;t start a business to spend your days on admin work. If your team is drowning in repetitive tasks, this audit will show you exactly what to hand off to AI.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {QUALIFIERS.map((q, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', backgroundColor: '#E8F8F1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  <Check size={16} color={COLORS.green} strokeWidth={3} />
                </div>
                <span style={{ fontSize: 16, color: COLORS.navy, fontWeight: 500, lineHeight: 1.5 }}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" style={{ padding: '80px 24px', backgroundColor: COLORS.cream }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: COLORS.navy,
            textAlign: 'center', marginBottom: 48,
          }}>
            Three steps to{' '}
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: COLORS.orange }}>clarity</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', backgroundColor: COLORS.orange,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: 22, fontWeight: 800, color: COLORS.white,
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CAPABILITIES ─── */}
      <section style={{ padding: '80px 24px', backgroundColor: COLORS.creamAlt }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: COLORS.navy,
            textAlign: 'center', marginBottom: 12,
          }}>
            AI that works{' '}
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: COLORS.orange }}>across your business</span>
          </h2>
          <p style={{ textAlign: 'center', color: COLORS.muted, fontSize: 17, marginBottom: 48, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            We don&apos;t just automate one thing. We look at your entire operation and find every opportunity.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {CAPABILITIES.map((c, i) => (
              <div key={i} style={{
                backgroundColor: COLORS.white, borderRadius: 14, padding: '28px 24px',
                border: `1px solid ${COLORS.border}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex', alignItems: 'flex-start', gap: 16,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10, backgroundColor: '#FFF3EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <c.icon size={22} color={COLORS.orange} strokeWidth={2} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.navy, marginBottom: 4 }}>{c.title}</h3>
                  <p style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.55 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section style={{ backgroundColor: COLORS.navy, padding: '64px 24px' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 160 }}>
              <div style={{ fontSize: 'clamp(36px, 5vw, 48px)', fontWeight: 800, color: COLORS.orange, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" style={{ padding: '80px 24px', backgroundColor: COLORS.cream }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: COLORS.navy,
            textAlign: 'center', marginBottom: 48,
          }}>
            Frequently asked{' '}
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: COLORS.orange }}>questions</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '20px 0', border: 'none', backgroundColor: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', textAlign: 'left', gap: 16,
                  }}
                >
                  <span style={{ fontSize: 17, fontWeight: 600, color: COLORS.navy }}>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    color={COLORS.muted}
                    style={{
                      transition: 'transform 0.25s ease',
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                  />
                </button>
                <div style={{
                  maxHeight: openFaq === i ? 200 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease, opacity 0.25s ease',
                  opacity: openFaq === i ? 1 : 0,
                }}>
                  <p style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.7, paddingBottom: 20 }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA + CALENDLY ─── */}
      <section id="book" style={{ backgroundColor: COLORS.navy, padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: COLORS.white,
            marginBottom: 12, lineHeight: 1.15,
          }}>
            Ready to see what AI can do for{' '}
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: COLORS.orange }}>your business</span>
            ?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', marginBottom: 40 }}>
            Book your free 30-minute AI Business Audit
          </p>

          <div
            ref={calendlyRef}
            className="calendly-inline-widget"
            data-url="https://calendly.com/harriscolton29/30min"
            style={{
              minWidth: 280, height: 660,
              backgroundColor: COLORS.white, borderRadius: 16,
              overflow: 'hidden',
            }}
          />
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ backgroundColor: COLORS.navy, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto', padding: '64px 24px 32px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48,
        }}>
          {/* Brand column */}
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.white }}>
              Mouse<span style={{ color: COLORS.orange }}>.</span>
            </span>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 12, lineHeight: 1.6 }}>
              AI employees for small businesses. Based in Wilmington, NC.
            </p>
          </div>

          {/* Company column */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'About', href: '#' },
                { label: 'Free AI Audit', href: '/audit' },
                { label: 'Pricing', href: '#' },
                { label: 'Contact', href: 'mailto:colton@mouse.is' },
              ].map((link, i) => (
                <a key={i} href={link.href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = COLORS.white)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >{link.label}</a>
              ))}
            </div>
          </div>

          {/* Legal column */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Terms of Service', href: '#' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Cookie Policy', href: '#' },
              ].map((link, i) => (
                <a key={i} href={link.href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = COLORS.white)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >{link.label}</a>
              ))}
            </div>
          </div>

          {/* Contact column */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Get in Touch</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="mailto:colton@mouse.is" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = COLORS.white)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              >colton@mouse.is</a>
              <a href="tel:+19105158927" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = COLORS.white)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              >(910) 515-8927</a>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Wilmington, NC</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          maxWidth: 1000, margin: '0 auto', padding: '24px 24px 32px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            &copy; {new Date().getFullYear()} Mouse Technologies, LLC. All rights reserved.
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Made with AI in Wilmington, NC
          </p>
        </div>
      </footer>

      {/* ─── RESPONSIVE STYLES ─── */}
      <style>{`
        .nav-mobile { display: none; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
}

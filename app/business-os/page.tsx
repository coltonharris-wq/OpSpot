'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Flame,
  LayoutDashboard,
  Plus,
  ReceiptText,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  WalletCards,
  } from 'lucide-react';

const css = String.raw`
*{box-sizing:border-box}html,body{margin:0;background:#07080c;color:#fff;font-family:var(--font-jakarta),Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}button,input,select,textarea{font:inherit}button{cursor:pointer}.os{min-height:100vh;background:radial-gradient(circle at 16% 0%,rgba(255,107,42,.24),transparent 26%),radial-gradient(circle at 78% 12%,rgba(60,120,255,.22),transparent 32%),linear-gradient(180deg,#07080c,#0b0d14 48%,#050609);padding:24px;position:relative;overflow:hidden}.os:before{content:'';position:fixed;inset:0;background-image:radial-gradient(rgba(255,255,255,.09) .8px,transparent .8px);background-size:18px 18px;mask-image:radial-gradient(circle at 50% 22%,black,transparent 74%);opacity:.22;pointer-events:none}.shell{position:relative;z-index:1;max-width:1480px;margin:0 auto;display:grid;grid-template-columns:250px minmax(0,1fr);gap:18px}.sidebar{position:sticky;top:24px;height:calc(100vh - 48px);border:1px solid rgba(255,255,255,.1);border-radius:30px;background:rgba(11,13,20,.72);backdrop-filter:blur(24px);padding:18px;box-shadow:0 30px 100px rgba(0,0,0,.32)}.brand{display:flex;align-items:center;gap:11px;margin-bottom:24px}.mark{width:40px;height:40px;border-radius:16px;background:radial-gradient(circle at 30% 22%,#fff,transparent 23%),linear-gradient(135deg,#ff6b2a,#7a5cff 62%,#3c78ff);box-shadow:0 0 34px rgba(255,107,42,.42)}.brand b{display:block;font-size:17px;letter-spacing:-.04em}.brand span{display:block;color:rgba(255,255,255,.42);font-size:12px;margin-top:2px}.navlabel{font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:rgba(255,255,255,.32);font-weight:950;margin:18px 10px 8px}.navitem{height:44px;border-radius:16px;padding:0 12px;display:flex;align-items:center;gap:11px;color:rgba(255,255,255,.58);font-weight:850;font-size:14px}.navitem.active{background:rgba(255,255,255,.09);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}.sidecard{margin-top:22px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.025));padding:16px;position:relative;overflow:hidden}.sidecard:before{content:'';position:absolute;right:-45px;top:-45px;width:130px;height:130px;border-radius:50%;background:#ff6b2a;filter:blur(38px);opacity:.24}.sidecard b{display:block;font-size:18px;letter-spacing:-.04em;margin:10px 0 6px}.sidecard p{position:relative;margin:0;color:rgba(255,255,255,.48);font-size:12px;line-height:1.5}.main{min-width:0}.topbar{height:70px;border:1px solid rgba(255,255,255,.1);border-radius:30px;background:rgba(11,13,20,.62);backdrop-filter:blur(24px);display:flex;align-items:center;justify-content:space-between;padding:0 18px 0 24px;margin-bottom:18px}.headline h1{margin:0;font-size:28px;letter-spacing:-.05em}.headline p{margin:4px 0 0;color:rgba(255,255,255,.45);font-size:13px}.top-actions{display:flex;align-items:center;gap:10px}.ghost,.primary{border:0;border-radius:999px;height:42px;padding:0 15px;display:inline-flex;align-items:center;gap:8px;font-weight:950}.ghost{background:rgba(255,255,255,.07);color:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.1)}.primary{background:#fff;color:#07080c;box-shadow:0 16px 52px rgba(255,255,255,.12)}.grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:18px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.metric{position:relative;min-height:142px;border:1px solid rgba(255,255,255,.1);border-radius:28px;background:rgba(255,255,255,.055);padding:18px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}.metric:after{content:'';position:absolute;right:-44px;top:-44px;width:135px;height:135px;border-radius:50%;background:var(--g);filter:blur(36px);opacity:.34}.metric small{position:relative;z-index:1;color:rgba(255,255,255,.42);font-size:11px;text-transform:uppercase;letter-spacing:.16em;font-weight:950}.metric b{position:relative;z-index:1;display:block;font-size:34px;letter-spacing:-.06em;margin-top:16px}.metric span{position:relative;z-index:1;display:inline-flex;align-items:center;gap:5px;color:#8ff0bd;font-size:12px;font-weight:850;margin-top:10px}.section{border:1px solid rgba(255,255,255,.1);border-radius:30px;background:rgba(255,255,255,.045);backdrop-filter:blur(18px);padding:20px;margin-bottom:18px;box-shadow:0 24px 80px rgba(0,0,0,.18)}.section-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:16px}.section h2{font-size:22px;letter-spacing:-.045em;margin:0}.section-head p{margin:5px 0 0;color:rgba(255,255,255,.44);font-size:13px}.quick{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.quick button{border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(0,0,0,.2);color:#fff;padding:18px;text-align:left;min-height:124px;position:relative;overflow:hidden;transition:.18s}.quick button:hover{transform:translateY(-3px);background:rgba(255,255,255,.075)}.quick button:after{content:'';position:absolute;right:-46px;bottom:-52px;width:150px;height:150px;border-radius:50%;background:var(--g);filter:blur(38px);opacity:.22}.quick svg{position:relative;z-index:1}.quick b{position:relative;z-index:1;display:block;font-size:17px;letter-spacing:-.035em;margin:13px 0 6px}.quick span{position:relative;z-index:1;color:rgba(255,255,255,.46);font-size:12px;line-height:1.45}.pipeline{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stage{border:1px solid rgba(255,255,255,.09);border-radius:24px;background:rgba(0,0,0,.2);padding:13px;min-height:310px}.stage-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.stage-head b{font-size:13px;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.55)}.count{font-size:12px;color:rgba(255,255,255,.45);background:rgba(255,255,255,.07);border-radius:999px;padding:5px 8px}.deal{border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(255,255,255,.045);padding:13px;margin-bottom:10px}.deal b{display:block;font-size:14px;margin-bottom:7px}.deal p{margin:0;color:rgba(255,255,255,.45);font-size:12px;line-height:1.35}.deal-foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;color:rgba(255,255,255,.45);font-size:12px}.value{color:#fff;font-weight:950}.split{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.table{display:grid;gap:9px}.row{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(0,0,0,.18);padding:13px}.row b{font-size:14px}.row small{display:block;color:rgba(255,255,255,.4);font-size:12px;margin-top:3px}.badge{border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:6px 9px;color:rgba(255,255,255,.64);font-size:11px;font-weight:900}.rightcol{min-width:0}.operator{position:sticky;top:112px}.ai{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:30px;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.032));padding:20px;margin-bottom:18px}.ai:before{content:'';position:absolute;right:-62px;top:-62px;width:180px;height:180px;border-radius:50%;background:#ff6b2a;filter:blur(48px);opacity:.24}.ai h2{position:relative;margin:12px 0 8px;font-size:25px;letter-spacing:-.05em}.ai p{position:relative;color:rgba(255,255,255,.52);font-size:13px;line-height:1.55;margin:0 0 16px}.ai-actions{position:relative;display:grid;gap:9px}.ai-actions button{height:42px;border-radius:15px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.22);color:#fff;text-align:left;padding:0 12px;display:flex;align-items:center;justify-content:space-between;font-weight:850}.form{border:1px solid rgba(255,255,255,.1);border-radius:30px;background:rgba(255,255,255,.045);padding:20px}.form h2{font-size:22px;margin:0 0 14px;letter-spacing:-.045em}.fields{display:grid;gap:10px}.field{display:grid;gap:6px}.field label{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.4);font-weight:950}.field input,.field select,.field textarea{width:100%;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(0,0,0,.24);color:#fff;padding:12px;outline:none}.field textarea{min-height:88px;resize:vertical}.save{width:100%;margin-top:12px;border:0;height:46px;border-radius:16px;background:linear-gradient(90deg,#ff6b2a,#ffb15d);color:#130a04;font-weight:950}.toast{position:fixed;right:24px;bottom:24px;z-index:20;border:1px solid rgba(255,255,255,.13);border-radius:22px;background:rgba(12,14,20,.82);backdrop-filter:blur(20px);box-shadow:0 22px 80px rgba(0,0,0,.35);padding:14px 16px;display:flex;align-items:center;gap:10px;animation:pop .2s ease-out}.toast b{display:block;font-size:13px}.toast span{display:block;color:rgba(255,255,255,.48);font-size:12px;margin-top:2px}.finance{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.finance-card{border:1px solid rgba(255,255,255,.08);border-radius:22px;background:rgba(0,0,0,.18);padding:16px}.finance-card small{color:rgba(255,255,255,.42);text-transform:uppercase;letter-spacing:.14em;font-size:11px;font-weight:950}.finance-card b{display:block;font-size:28px;letter-spacing:-.05em;margin-top:10px}.finance-card p{color:rgba(255,255,255,.44);font-size:12px;line-height:1.45;margin:8px 0 0}.decision-queue{display:grid;gap:12px}.decision-card{border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(0,0,0,.22);padding:16px;display:grid;grid-template-columns:70px 1fr auto;gap:14px;align-items:start;position:relative;overflow:hidden}.decision-card:before{content:'';position:absolute;left:-70px;top:-80px;width:190px;height:190px;border-radius:50%;background:var(--pglow,#ff6b2a);filter:blur(52px);opacity:.18}.prio{position:relative;z-index:1;width:54px;height:54px;border-radius:18px;display:grid;place-items:center;background:rgba(255,255,255,.08);font-weight:950;color:#fff}.decision-main{position:relative;z-index:1}.decision-main small{display:inline-flex;border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:5px 8px;color:rgba(255,255,255,.62);font-size:11px;font-weight:950;margin-bottom:9px}.decision-main h3{margin:0 0 7px;font-size:18px;letter-spacing:-.035em}.decision-main p{margin:0;color:rgba(255,255,255,.5);font-size:13px;line-height:1.45}.decision-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.decision-meta span{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);border-radius:999px;padding:6px 9px;color:rgba(255,255,255,.62);font-size:11px;font-weight:850}.decision-actions{position:relative;z-index:1;display:grid;gap:8px;min-width:112px}.decision-actions button{height:34px;border-radius:12px;border:1px solid rgba(255,255,255,.1);font-weight:950;color:#fff}.approve{background:linear-gradient(90deg,#2ee59d,#8ff0bd);color:#06120b!important}.defer{background:rgba(255,255,255,.07)}.deny{background:rgba(255,80,80,.12);color:#ffb4b4!important}.modebar{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}.mode{border:1px solid rgba(255,255,255,.1);border-radius:22px;background:rgba(255,255,255,.045);padding:14px}.mode b{display:block;font-size:15px}.mode span{display:block;color:rgba(255,255,255,.43);font-size:12px;line-height:1.4;margin-top:5px}@media(max-width:720px){.decision-card{grid-template-columns:1fr}.decision-actions{grid-template-columns:repeat(3,1fr);min-width:0}.modebar{grid-template-columns:1fr}}@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@media(max-width:1180px){.shell{grid-template-columns:1fr}.sidebar{position:relative;height:auto;top:0}.grid{grid-template-columns:1fr}.operator{position:relative;top:0}.metrics{grid-template-columns:repeat(2,1fr)}.pipeline,.quick{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.os{padding:12px}.topbar{height:auto;align-items:flex-start;gap:14px;flex-direction:column;padding:18px}.metrics,.pipeline,.quick,.split,.finance{grid-template-columns:1fr}.row{grid-template-columns:1fr}.shell{gap:12px}.sidebar,.section,.ai,.form,.topbar{border-radius:24px}}
`;

const metrics = [
  ['Cash on hand', '$18,420', '+$2.1k this week', '#ff6b2a'],
  ['Monthly revenue', '$12,750', '+18% vs last month', '#3c78ff'],
  ['Runway', '7.4 mo', 'safe if burn stays flat', '#7a5cff'],
  ['Tax bucket', '$3,825', '30% reserved', '#ffb15d'],
];

const actions = [
  ['Add Lead', 'Capture name, source, value, next step.', UserPlus, '#3c78ff'],
  ['Book Demo', 'Create prep task and follow-up reminders.', CalendarCheck, '#7a5cff'],
  ['Mark Deal Won', 'Start invoice + onboarding checklist.', CheckCircle2, '#2ee59d'],
  ['Add Expense', 'Categorize spend and update tax view.', ReceiptText, '#ff6b2a'],
  ['Send Follow-up', 'Draft short human message for approval.', Send, '#ffb15d'],
  ['Weekly Report', 'Summarize sales, cash, tasks, blockers.', FileText, '#60a5fa'],
];

const stages = [
  ['New', [['Cape Fear Dental', '$2.5k/mo', 'Website form'], ['Pier 33 Marina', '$1.8k/mo', 'Referral']]],
  ['Demo Booked', [['Wilmington HVAC', '$3.5k/mo', 'Thu 2:00 PM'], ['Coastal Med Spa', '$2.2k/mo', 'Fri 11:30 AM']]],
  ['Proposal', [['Beachside Roofing', '$4.0k/mo', 'Needs follow-up'], ['Local Gym', '$1.5k/mo', 'Sent today']]],
  ['Won', [['Aaron Auto', '$2.0k/mo', 'Onboarding'], ['Paperclip', '$1.2k/mo', 'M5 handoff']]],
];

const retainers = [
  ['Aaron Auto', '$2,000/mo', 'Paid'],
  ['Wilmington HVAC', '$3,500/mo', 'Pending'],
  ['Paperclip', '$1,200/mo', 'Trial'],
  ['Coastal Med Spa', '$2,200/mo', 'Proposal'],
];

const expenses = [
  ['OpenClaw / AI tools', '$486', 'Software'],
  ['Vercel + infra', '$89', 'Hosting'],
  ['Client lunch', '$64', 'Meals'],
  ['Design assets', '$38', 'Marketing'],
];

const decisions = [
  { priority: 'P0', type: 'Approve', title: 'Send HVAC proposal follow-up', reason: 'Hot lead opened proposal 3 times and has not replied.', impact: '$3.5k/mo', touch: 'Human tone recommended', action: 'Approve send' },
  { priority: 'P0', type: 'Decide', title: 'Owner draw vs tax bucket', reason: 'Cash is safe, but tax reserve is under target by $620.', impact: '$620 risk', touch: 'Decision needed', action: 'Move money' },
  { priority: 'P1', type: 'Approve', title: 'Book Cape Fear Dental demo slot', reason: 'Lead replied yes. M5 found two calendar openings.', impact: '$2.5k/mo', touch: 'Approval only', action: 'Book demo' },
  { priority: 'P1', type: 'Deny?', title: 'Cancel unused design subscription', reason: 'No usage in 21 days. Saves $38/mo.', impact: '+$456/yr', touch: 'One-click deny keeps it', action: 'Cancel it' },
  { priority: 'P2', type: 'Human touch', title: 'Text Aaron after onboarding win', reason: 'High-trust client moment. Automation drafted it, but personal touch matters.', impact: 'Retention', touch: 'You should send', action: 'Open draft' },
];

export default function BusinessOSMock() {
  const [activeAction, setActiveAction] = useState(actions[0][0] as string);
  const [toast, setToast] = useState('');
  const active = useMemo(() => actions.find((a) => a[0] === activeAction) || actions[0], [activeAction]);
  const ActiveIcon = active[2] as typeof UserPlus;

  const save = () => {
    setToast(`${activeAction} saved to mock queue`);
    setTimeout(() => setToast(''), 2400);
  };

  return (
    <main className="os">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="shell">
        <aside className="sidebar">
          <div className="brand"><span className="mark" /><div><b>Automio OS</b><span>Sales + finance cockpit</span></div></div>
          <div className="navlabel">Command</div>
          {[
            [LayoutDashboard, 'Dashboard'], [Target, 'Pipeline'], [WalletCards, 'Finance'], [ClipboardCheck, 'Follow-ups'], [Bot, 'M5 Queue'],
          ].map(([Icon, label], i) => <div className={`navitem ${i === 0 ? 'active' : ''}`} key={label as string}><Icon size={17} /> {label as string}</div>)}
          <div className="navlabel">Today</div>
          {['3 demos to prep', '7 leads need touch', '2 expenses uncategorized'].map((x) => <div className="navitem" key={x}><Flame size={16} /> {x}</div>)}
          <div className="sidecard"><Sparkles size={22} /><b>M5-ready handoff</b><p>This should be the home screen: important decisions first, everything else automated or hidden until it needs you.</p></div>
        </aside>

        <section className="main">
          <div className="topbar">
            <div className="headline"><h1>Decision queue cockpit</h1><p>Automation does the follow-up. You only approve, defer, deny, or add human touch.</p></div>
            <div className="top-actions"><button className="ghost"><RefreshCw size={16} /> Sync mock data</button><button className="primary"><Plus size={16} /> New action</button></div>
          </div>

          <div className="grid">
            <div>
              <div className="metrics">{metrics.map(([label, value, note, color]) => <div className="metric" style={{ ['--g' as string]: color }} key={label}><small>{label}</small><b>{value}</b><span><TrendingUp size={13} /> {note}</span></div>)}</div>

              <section className="section">
                <div className="section-head"><div><h2>Decision queue</h2><p>Ranked by importance. M5 does the work; you only touch what needs judgment.</p></div><span className="badge">5 decisions</span></div>
                <div className="modebar"><div className="mode"><b>Automated</b><span>Follow-ups, reminders, summaries, categorization.</span></div><div className="mode"><b>Approval</b><span>Money, proposals, bookings, client messages.</span></div><div className="mode"><b>Human touch</b><span>Relationship moments worth sounding like you.</span></div></div>
                <div className="decision-queue">{decisions.map((d, i) => <div className="decision-card" style={{ ['--pglow' as string]: i < 2 ? '#ff6b2a' : '#3c78ff' }} key={d.title}><div className="prio">{d.priority}</div><div className="decision-main"><small>{d.type}</small><h3>{d.title}</h3><p>{d.reason}</p><div className="decision-meta"><span>{d.impact}</span><span>{d.touch}</span></div></div><div className="decision-actions"><button className="approve" onClick={() => setToast(`${d.action} approved`)}>{d.action}</button><button className="defer" onClick={() => setToast(`${d.title} deferred`)}>Defer</button><button className="deny" onClick={() => setToast(`${d.title} denied`)}>Deny</button></div></div>)}</div>
              </section>

              <section className="section">
                <div className="section-head"><div><h2>Manual add buttons</h2><p>Only for when something new enters the system manually. Not your daily workflow.</p></div><span className="badge">backup input</span></div>
                <div className="quick">{actions.map(([label, text, Icon, color]) => <button key={label as string} style={{ ['--g' as string]: color as string }} onClick={() => setActiveAction(label as string)}><Icon size={24} /><b>{label as string}</b><span>{text as string}</span></button>)}</div>
              </section>

              <section className="section">
                <div className="section-head"><div><h2>Sales pipeline</h2><p>Drag-and-drop later. For now: visual status and next action clarity.</p></div><button className="ghost">View CRM <ArrowUpRight size={15} /></button></div>
                <div className="pipeline">{stages.map(([stage, deals]) => <div className="stage" key={stage as string}><div className="stage-head"><b>{stage as string}</b><span className="count">{(deals as string[][]).length}</span></div>{(deals as string[][]).map(([name, value, note]) => <div className="deal" key={name}><b>{name}</b><p>{note}</p><div className="deal-foot"><span>Next touch</span><span className="value">{value}</span></div></div>)}</div>)}</div>
              </section>

              <div className="split">
                <section className="section">
                  <div className="section-head"><div><h2>Retainers</h2><p>Who pays, how much, and what needs attention.</p></div></div>
                  <div className="table">{retainers.map(([name, amount, status]) => <div className="row" key={name}><div><b>{name}</b><small>Monthly AI ops retainer</small></div><span className="value">{amount}</span><span className="badge">{status}</span></div>)}</div>
                </section>
                <section className="section">
                  <div className="section-head"><div><h2>Expenses</h2><p>Fast category view for taxes + cleanup.</p></div></div>
                  <div className="table">{expenses.map(([name, amount, cat]) => <div className="row" key={name}><div><b>{name}</b><small>{cat}</small></div><span className="value">{amount}</span><span className="badge">Categorized</span></div>)}</div>
                </section>
              </div>

              <section className="section">
                <div className="section-head"><div><h2>Finance snapshot</h2><p>Enough clarity to make decisions without doing accounting cosplay.</p></div></div>
                <div className="finance"><div className="finance-card"><small>Monthly burn</small><b>$4,680</b><p>Software, infra, meals, contractors, experiments.</p></div><div className="finance-card"><small>Profit estimate</small><b>$8,070</b><p>Before tax bucket and owner draw.</p></div><div className="finance-card"><small>Suggested owner draw</small><b>$3,200</b><p>Keep runway safe while sales catches up.</p></div></div>
              </section>
            </div>

            <aside className="rightcol">
              <div className="operator">
                <div className="ai"><Bot size={28} /><h2>M5 operator queue</h2><p>M5 should run the background work, then surface only decisions, approvals, denials, and human-touch moments here.</p><div className="ai-actions">{['Draft 7 follow-ups', 'Prep tomorrow demos', 'Categorize 2 expenses', 'Generate weekly report'].map((x) => <button key={x}>{x}<ChevronRight size={16} /></button>)}</div></div>

                <div className="form">
                  <h2>{activeAction}</h2>
                  <div className="fields">
                    <div className="field"><label>Name / Client</label><input placeholder="e.g. Wilmington HVAC" /></div>
                    <div className="field"><label>Amount / Value</label><input placeholder="$2,500/mo" /></div>
                    <div className="field"><label>Status</label><select value="next" onChange={() => {}}><option value="next">Needs next action</option><option>Waiting on client</option><option>Ready for M5</option><option>Done</option></select></div>
                    <div className="field"><label>Notes</label><textarea placeholder="What happened? What should M5 do next?" /></div>
                  </div>
                  <button className="save" onClick={save}><ActiveIcon size={16} /> Save mock action</button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
      {toast && <div className="toast"><CheckCircle2 color="#8ff0bd" /><div><b>{toast}</b><span>This is fake data, ready for M5 wiring later.</span></div></div>}
    </main>
  );
}

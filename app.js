const ICONS = {
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6M9 5h6M7 12h10v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5C8 7.5 5 11 5 15a7 7 0 0014 0c0-4-3-7.5-7-12.5z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
};

(function () {
  const sp = document.getElementById('spotlight');
  let raf = 0, x = window.innerWidth / 2, y = 200;
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      sp.style.setProperty('--mx', x + 'px');
      sp.style.setProperty('--my', y + 'px');
      raf = 0;
    });
  });

  const mockWrap = document.querySelector('.hero-mock-wrap');
  if (mockWrap) {
    let mraf = 0;
    mockWrap.addEventListener('pointermove', (e) => {
      if (mraf) return;
      mraf = requestAnimationFrame(() => {
        const rect = mockWrap.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        mockWrap.style.setProperty('--mockX', (x * 100) + '%');
        mockWrap.style.setProperty('--mockY', (y * 100) + '%');
        mockWrap.style.setProperty('--tiltX', (x - 0.5) * 2);
        mockWrap.style.setProperty('--tiltY', (y - 0.5) * 2);
        mraf = 0;
      });
    });
    mockWrap.addEventListener('pointerleave', () => {
      mockWrap.style.setProperty('--tiltX', 0);
      mockWrap.style.setProperty('--tiltY', 0);
    });
  }

  const nav = document.querySelector('.nav');
  if (nav) {
    let nraf = 0;
    const updateNav = () => {
      nav.classList.toggle('scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', () => {
      if (nraf) return;
      nraf = requestAnimationFrame(() => { updateNav(); nraf = 0; });
    }, { passive: true });
    updateNav();
  }

  document.querySelectorAll('.bento .tile').forEach(tile => {
    let traf = 0;
    tile.addEventListener('pointermove', (e) => {
      if (traf) return;
      traf = requestAnimationFrame(() => {
        const r = tile.getBoundingClientRect();
        tile.style.setProperty('--tx', ((e.clientX - r.left) / r.width * 100) + '%');
        tile.style.setProperty('--ty', ((e.clientY - r.top) / r.height * 100) + '%');
        traf = 0;
      });
    });
  });


  const backTop = document.querySelector('.back-top');
  if (backTop) {
    let braf = 0;
    window.addEventListener('scroll', () => {
      if (braf) return;
      braf = requestAnimationFrame(() => {
        backTop.classList.toggle('show', window.scrollY > window.innerHeight * 0.6);
        braf = 0;
      });
    }, { passive: true });
  }

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();

(function () {
  const tiles = [
    {
      cls: 't-tall',
      eyebrow: 'Front desk',
      title: 'Answers calls, texts, and DMs in your voice.',
      body: 'Trained on your services, prices, and the way your team actually talks. No "I\'m a bot."',
      visual: () => `
        <div style="display:flex; flex-direction:column; gap:0.4rem; margin-top: 1.2rem;">
          <div class="msg from-customer" style="font-size:12.5px; max-width:90%;">"Do you guys do drain camera inspections?"</div>
          <div class="msg from-ai" style="font-size:12.5px; max-width:90%;">"We do — $189 flat, can usually get out in 48 hrs. Want me to grab your address?"</div>
        </div>
      `
    },
    {
      cls: 't-wide',
      eyebrow: 'Lead chase',
      title: 'No quote ghosted. Ever.',
      body: 'Estimates get followed up on day 1, 3, 7, 14 — politely, with context, until they say yes or no.',
      visual: () => `
        <div class="mini-list">
          <div class="row"><span>Estimate · Carter ($4,180)</span><span class="tag info">DAY 3 · SENT</span></div>
          <div class="row"><span>Estimate · Romero ($3,640)</span><span class="tag good">BOOKED ✓</span></div>
          <div class="row"><span>Estimate · Han ($1,920)</span><span class="tag warn">DAY 7 · QUEUED</span></div>
        </div>
      `
    },
    {
      cls: 't-sq',
      eyebrow: 'Job docs',
      title: 'Photos, notes & proof — filed.',
      body: 'Tech sends a photo, OpSpot tags it to the right job, customer, and stage.',
      visual: () => {
        const thumbs = [
          { c: 'thumb-1', l: 'BEFORE', g: ICONS.wrench },
          { c: 'thumb-2', l: 'INSTALL', g: ICONS.tool },
          { c: 'thumb-3', l: 'METER', g: ICONS.bolt },
          { c: 'thumb-4', l: 'LEAK', g: ICONS.drop },
          { c: 'thumb-5', l: 'AFTER', g: ICONS.check },
          { c: 'thumb-6', l: 'INVOICE', g: ICONS.doc },
        ];
        return `
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 1rem;">
          ${thumbs.map(t => `<div class="thumb ${t.c}"><span class="glyph">${t.g}</span><span class="lbl">${t.l}</span></div>`).join('')}
        </div>`;
      }
    },
    {
      cls: 't-md',
      eyebrow: 'Ops audit',
      title: 'Finds the next thing worth automating.',
      body: 'Every Friday: a one-page memo of where time is leaking, ranked by hours saved.',
      visual: () => `
        <div class="mini-list">
          <div class="row"><span>Reschedule SMS thread</span><span class="tag warn">~6.2 hr/wk</span></div>
          <div class="row"><span>After-hours intake</span><span class="tag info">~4.1 hr/wk</span></div>
          <div class="row"><span>Photo → invoice match</span><span class="tag good">~2.8 hr/wk</span></div>
        </div>
      `
    },
    {
      cls: 't-md',
      eyebrow: 'Escalation',
      title: 'Knows when to hand off to a human.',
      body: 'Anger, ambiguity, money over a threshold — straight to your phone with full context.',
      visual: () => `
        <div style="margin-top: 1rem; padding: 0.8rem; border: 1px dashed var(--accent); border-radius: 10px; background: var(--accent-soft); display: flex; gap: 0.6rem; align-items: center;">
          <div style="width: 28px; height: 28px; border-radius: 999px; background: var(--accent); color: white; display: grid; place-items: center; font-weight: 600;">!</div>
          <div style="font-size: 13px;"><strong>Escalating to Mike</strong><div style="color:var(--ink-3); font-size: 11.5px;">Customer asking about $9,200 dispute · summary attached</div></div>
        </div>
      `
    },
  ];

  const root = document.getElementById('bento');
  root.innerHTML = tiles.map(t => `
    <div class="tile ${t.cls}">
      <div class="eyebrow">${t.eyebrow}</div>
      <h3 class="display">${t.title}</h3>
      <p>${t.body}</p>
      ${t.visual()}
    </div>
  `).join('');
})();

(function () {
  const employees = [
    { num: '01', name: 'Maya', role: 'Front desk', tag: 'Customer-facing',
      desc: 'Picks up texts, DMs and missed calls. Answers FAQs, gives ballpark pricing, books site visits.',
      stage: () => `
        <div><div class="stage-sub">Maya — Front desk</div><div class="stage-title">Booking a tankless install</div></div>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <div class="stage-bubble cust">Hey what's the lead time on a tankless install?</div>
          <div class="stage-bubble ai">About 1–2 weeks once we permit. Want a free walkthrough? Got Friday 2pm or Monday 9am.</div>
          <div class="stage-bubble cust">Friday works.</div>
        </div>
        <div style="margin-top:auto; padding: 0.6rem; background: var(--bg-2); border-radius: 8px; font-size: 12px; color: var(--ink-2);">✓ Booked Fri 2:00 PM · Synced to ServiceTitan</div>
      ` },
    { num: '02', name: 'Theo', role: 'Estimator', tag: 'Revenue',
      desc: 'Drafts proposals, follows up on quotes, knows your standard scopes and add-ons cold.',
      stage: () => `
        <div><div class="stage-sub">Theo — Estimator</div><div class="stage-title">Day-3 follow-up</div></div>
        <div class="email-card">
          <div class="hd">To · jorge.r@gmail.com</div>
          <div class="hd">From · theo@northbeam-hvac.com</div>
          <div class="subj">Tankless quote — quick check-in</div>
          <div class="body">Hey Jorge — circling back on the tankless quote ($3,640). Happy to walk it on the phone, or knock $150 off if we book this week.</div>
          <div class="sig">— Theo · Northbeam HVAC</div>
        </div>
        <div class="mini-list">
          <div class="row"><span>Carter — $4,180</span><span class="tag info">DAY 3</span></div>
          <div class="row"><span>Han — $1,920</span><span class="tag warn">DAY 7</span></div>
        </div>
      ` },
    { num: '03', name: 'Robin', role: 'Dispatch', tag: 'Operations',
      desc: 'Routes jobs, handles reschedules, keeps techs and customers in sync without the phone tag.',
      stage: () => `
        <div><div class="stage-sub">Robin — Dispatch</div><div class="stage-title">Today's board</div></div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; align-items:center; gap:0.6rem; padding:8px 10px; background: var(--bg-2); border:1px solid var(--line); border-radius:8px; font-size:12.5px;"><span class="stat-dot good"></span><span style="flex:1;">8:00 — Mike · Romero</span><span style="color:var(--good); font-weight:500;">en route</span></div>
          <div style="display:flex; align-items:center; gap:0.6rem; padding:8px 10px; background: var(--bg-2); border:1px solid var(--line); border-radius:8px; font-size:12.5px;"><span class="stat-dot info"></span><span style="flex:1;">10:30 — Sara · Carter</span><span style="color:var(--info); font-weight:500;">queued</span></div>
          <div style="display:flex; align-items:center; gap:0.6rem; padding:8px 10px; background: var(--bg-2); border:1px solid var(--line); border-radius:8px; font-size:12.5px;"><span class="stat-dot mute"></span><span style="flex:1;">14:00 — Mike · Romero</span><span style="color:var(--ink-3);">site walk</span></div>
        </div>
        <div style="margin-top:auto; font-size:12px; color: var(--ink-2);">Auto-reshuffled 2 jobs after Sara's morning call ran long.</div>
      ` },
    { num: '04', name: 'Iris', role: 'Records', tag: 'Operations',
      desc: 'Files photos, signed forms, parts receipts to the right job. Builds the invoice while the truck rolls.',
      stage: () => {
        const thumbs = [
          { c: 'thumb-1', l: 'ARRIVAL', g: ICONS.pin },
          { c: 'thumb-3', l: 'METER', g: ICONS.bolt },
          { c: 'thumb-2', l: 'PARTS', g: ICONS.cog },
          { c: 'thumb-5', l: 'TEST', g: ICONS.check },
          { c: 'thumb-4', l: 'LEAK', g: ICONS.drop },
          { c: 'thumb-6', l: 'SIGNED', g: ICONS.pen },
        ];
        return `
        <div><div class="stage-sub">Iris — Records</div><div class="stage-title">Job #4421 · Romero</div></div>
        <div style="display:grid; grid-template-columns: repeat(3,1fr); gap: 6px;">
          ${thumbs.map(t => `<div class="thumb ${t.c}"><span class="glyph">${t.g}</span><span class="lbl">${t.l}</span></div>`).join('')}
        </div>
        <div style="font-size:12px; color: var(--ink-2);">6 photos · 1 signed scope · 2 parts receipts → invoice draft ready.</div>
      `;
      } },
    { num: '05', name: 'August', role: 'Ops auditor', tag: 'Strategy',
      desc: 'Watches everything happening across the team and tells you what to automate next, in plain English.',
      stage: () => `
        <div><div class="stage-sub">August — Ops auditor</div><div class="stage-title">This week's memo</div></div>
        <div style="font-size:13px; color: var(--ink-2); line-height:1.5;">
          You're losing ~6.2 hrs/week on reschedule SMS threads. I drafted a workflow that handles the 3 most common patterns — review on Mon?
        </div>
        <div class="mini-list">
          <div class="row"><span>Reschedule SMS</span><span class="tag warn">6.2 hr</span></div>
          <div class="row"><span>After-hours intake</span><span class="tag info">4.1 hr</span></div>
        </div>
      ` },
  ];

  const empList = document.getElementById('empList');
  const stage = document.getElementById('stage');

  empList.innerHTML = employees.map((e, i) => `
    <div class="emp-card${i === 0 ? ' active' : ''}" data-idx="${i}">
      <div class="num">EMPLOYEE / ${e.num}</div>
      <h3 class="display">${e.name}</h3>
      <span class="role-tag">${e.role}</span>
      <p>${e.desc}</p>
    </div>
  `).join('');

  stage.innerHTML = employees.map((e, i) => `
    <div class="stage-card${i === 0 ? ' active' : ''}" data-idx="${i}">${e.stage()}</div>
  `).join('');

  let activeIdx = 0;
  function setActive(i) {
    if (i === activeIdx) return;
    activeIdx = i;
    document.querySelectorAll('.emp-card').forEach((el, idx) => el.classList.toggle('active', idx === i));
    document.querySelectorAll('.stage-card').forEach((el, idx) => el.classList.toggle('active', idx === i));
  }

  document.querySelectorAll('.emp-card').forEach((el, idx) => {
    el.addEventListener('mouseenter', () => setActive(idx));
    el.addEventListener('click', () => setActive(idx));
  });

  const cards = [...document.querySelectorAll('.emp-card')];
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const targetY = window.innerHeight * 0.45;
      let best = -1, bestDist = Infinity;
      cards.forEach((el, idx) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const center = (r.top + r.bottom) / 2;
        const d = Math.abs(center - targetY);
        if (d < bestDist) { bestDist = d; best = idx; }
      });
      if (best >= 0) setActive(best);
      ticking = false;
    });
  }, { passive: true });
})();

(function () {
  const items = [
    { q: "Maya picks up everything that hits the site after 6pm. Owner reads the morning summary in two minutes — no missed leads.", scenario: "After-hours intake", role: "HVAC / plumbing shop", stat: "EXAMPLE · what after-hours looks like once Maya's running" },
    { q: "Theo runs the day-3 / day-7 / day-14 follow-up on every quote. Owner approves outliers, the rest go automatically.", scenario: "Quote follow-up loop", role: "Estimator-heavy shops", stat: "EXAMPLE · what quote chasing looks like with Theo" },
    { q: "August reads the week and sends one page on Friday: dollars saved, hours back, what to fix next. Owner reads it over coffee.", scenario: "Friday memo", role: "Any service shop with leakage", stat: "EXAMPLE · what the Friday memo looks like" },
  ];
  document.getElementById('testiGrid').innerHTML = items.map(t => `
    <div class="testi">
      <div class="testi-stat">${t.stat}</div>
      <div class="quote">"${t.q}"</div>
      <div class="who">
        <div><strong>${t.scenario}</strong><small>${t.role}</small></div>
      </div>
    </div>
  `).join('');
})();

(function () {
  const items = [
    ["How does an AI employee actually 'install'?", "We connect to your existing tools (phone/SMS, email, your CRM or scheduling software) and train each role on your services, prices and SOPs in a 30-min walkthrough. You see the first live reply before we hang up."],
    ["Will customers know they're talking to AI?", "Yes by default — each employee has a name and a line in their signature. You can tune the tone, signature, and how clear that line is."],
    ["What happens when something goes wrong?", "Every employee has clear handoff rules: anger, confusion, dollar-amount thresholds, anything outside their lane. You get a text with full context, not just a transcript."],
    ["Which tools does OpSpot work with?", "ServiceTitan, Jobber, Housecall Pro, Google Voice, OpenPhone, Gmail, plain SMS — and we'll wire up anything else over a 20-min call."],
    ["What does it cost?", "Flat per-employee per month. No usage gotchas, no per-message fees. Pricing's on the walkthrough so we can match it to your call volume."],
    ["Is my customer data safe?", "SOC 2 Type II, encrypted everywhere, US data only. We never use your data to train other people's AI."],
  ];
  document.getElementById('faqList').innerHTML = items.map(([q, a], i) => `
    <details>
      <summary><span class="q-num">Q · ${String(i + 1).padStart(2, '0')}</span><span class="q-text">${q}</span></summary>
      <div class="ans">${a}</div>
    </details>
  `).join('');
})();

(function () {
  const fmt = (n, decimals = 0) => {
    const x = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
    const [intp, dec] = x.split('.');
    return intp.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (dec ? '.' + dec : '');
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || '0');
    if (reduced) {
      el.textContent = prefix + fmt(target, decimals) + suffix;
      return;
    }
    const dur = 1400;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      animate(e.target);
      cio.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  counters.forEach(el => cio.observe(el));
})();

(function () {
  ['.testi', '.emp-card', '.bento .tile'].forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.style.transitionDelay = (i * 80) + 'ms';
    });
  });
})();

(function () {
  const links = {};
  document.querySelectorAll('.nav a.link').forEach(a => {
    const id = a.getAttribute('href').replace('#', '');
    if (id) links[id] = a;
  });
  const setActive = (id) => {
    Object.entries(links).forEach(([k, a]) => a.classList.toggle('nav-active', k === id));
  };
  let active = null;
  const targets = Object.keys(links).map(id => document.getElementById(id)).filter(Boolean);
  if (!targets.length) return;
  const onScroll = () => {
    const y = window.scrollY + 120;
    let cur = null;
    for (const t of targets) {
      if (t.offsetTop <= y) cur = t.id;
    }
    if (cur && cur !== active) { active = cur; setActive(cur); }
  };
  let s = false;
  window.addEventListener('scroll', () => {
    if (s) return; s = true;
    requestAnimationFrame(() => { onScroll(); s = false; });
  }, { passive: true });
  onScroll();
})();

(function () {
  const els = document.querySelectorAll('.section, .testi, .emp-card, .bento .tile');
  els.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(el => io.observe(el));
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  });
})();

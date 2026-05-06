(function () {
  const items = [
    { tag: 'AFTER-HOURS', q: "Maya picks up everything that hits the site after 6pm. Owner reads the morning summary in two minutes — no missed leads.", scenario: "After-hours intake", role: "HVAC / plumbing shop" },
    { tag: 'QUOTE FOLLOW-UP', q: "Theo runs the day-3 / day-7 / day-14 follow-up on every quote. Owner approves outliers, the rest go automatically.", scenario: "Quote follow-up loop", role: "Estimator-heavy shops" },
    { tag: 'WEEKLY MEMO', q: "August reads the week and sends one page on Friday: dollars saved, hours back, what to fix next. Owner reads it over coffee.", scenario: "Friday memo", role: "Any service shop" },
  ];
  const grid = document.getElementById('workGrid');
  if (grid) {
    grid.innerHTML = items.map(t => `
      <div class="work-card">
        <span class="work-tag">EXAMPLE · ${t.tag}</span>
        <div class="quote">“${t.q}”</div>
        <div class="who"><strong>${t.scenario}</strong><small>${t.role}</small></div>
      </div>
    `).join('');
  }
})();

(function () {
  const items = [
    ["How does an AI employee actually 'install'?", "We connect to your existing tools — phone/SMS, email, your CRM or scheduling software — and train each role on your services, prices, and SOPs in a 30-min audit. You see the first live reply before we hang up."],
    ["Will customers know they're talking to AI?", "Yes by default — each employee has a name and a line in their signature. You can tune the tone, signature, and how clear that line is."],
    ["What happens when something goes wrong?", "Every employee has clear handoff rules: anger, confusion, dollar-amount thresholds, anything outside their lane. You get a text with full context, not just a transcript."],
    ["Which tools does OpSpot work with?", "ServiceTitan, Jobber, Housecall Pro, Google Voice, OpenPhone, Gmail, plain SMS — and we'll wire up anything else over a 20-min call."],
    ["What does it cost?", "Flat per-employee per month. No usage gotchas, no per-message fees. Pricing's on the audit so we can match it to your call volume."],
    ["Is my customer data safe?", "SOC 2 Type II, encrypted everywhere, US data only. We never use your data to train other people's AI."],
  ];
  const list = document.getElementById('faqList');
  if (list) {
    list.innerHTML = items.map(([q, a]) => `
      <details>
        <summary>${q}</summary>
        <div class="ans">${a}</div>
      </details>
    `).join('');
  }
})();

(function () {
  const els = document.querySelectorAll('.section, .work-card, .humans-card, .install-row, .how-step, .hero-visual, .wilmington-card, .memo-frame, .logos');
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

(function () {
  const links = {};
  document.querySelectorAll('.nav-links a').forEach(a => {
    const id = a.getAttribute('href').replace('#', '');
    if (id) links[id] = a;
  });
  const setActive = (id) => {
    Object.entries(links).forEach(([k, a]) => a.classList.toggle('active', k === id));
  };
  const targets = Object.keys(links).map(id => document.getElementById(id)).filter(Boolean);
  if (!targets.length) return;
  let active = null, s = false;
  const onScroll = () => {
    const y = window.scrollY + 140;
    let cur = null;
    for (const t of targets) {
      if (t.offsetTop <= y) cur = t.id;
    }
    if (cur && cur !== active) { active = cur; setActive(cur); }
  };
  window.addEventListener('scroll', () => {
    if (s) return; s = true;
    requestAnimationFrame(() => { onScroll(); s = false; });
  }, { passive: true });
  onScroll();
})();

(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  let s = false;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', () => {
    if (s) return; s = true;
    requestAnimationFrame(() => { update(); s = false; });
  }, { passive: true });
  update();
})();

(function () {
  const back = document.querySelector('.back-top');
  if (!back) return;
  let s = false;
  window.addEventListener('scroll', () => {
    if (s) return; s = true;
    requestAnimationFrame(() => {
      back.classList.toggle('show', window.scrollY > window.innerHeight * 0.6);
      s = false;
    });
  }, { passive: true });
})();

(function () {
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();

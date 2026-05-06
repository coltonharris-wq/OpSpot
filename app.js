/* ============================================================
   Automio — landing page interactions
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

/* ----------- FAQ list ----------- */
(function () {
  const items = [
    [
      "How long does an Automio install actually take?",
      "Five business days, end-to-end. Day one is a 30-minute audit. Days two and three we wire into your phone, calendar, and CRM. Day four is a soft launch with one employee while you watch. Day five the rest of the team goes live."
    ],
    [
      "Will my customers know they're talking to AI?",
      "Yes — by default each employee introduces itself by name and mentions it's AI. You can tune the script, the tone, and how upfront the disclosure is. Every transcript is logged and visible to you in the dashboard."
    ],
    [
      "What happens when something goes wrong?",
      "Each AI employee has handoff rules — on confusion, anger, dollar-thresholds, or anything outside their lane, the conversation pings a human on your team with full context. You're never reading a wall of transcript at 9pm."
    ],
    [
      "Which tools do you integrate with?",
      "Out of the box: Google Voice, OpenPhone, Twilio, Gmail, ServiceTitan, Jobber, Housecall Pro, HubSpot, Calendly, Square, Stripe, Slack. Anything else, we'll build the integration in a week."
    ],
    [
      "What does it cost?",
      "Flat per-employee, per month — no per-message or per-minute gotchas. You'll see exact pricing in the audit so we can match it to your call volume and which roles you actually need."
    ],
    [
      "Is my customer data safe?",
      "SOC 2 Type II, encrypted at rest and in transit, US data residency. We never use your conversations to train other people's models. You own and can export everything."
    ],
    [
      "Can I start with just one AI employee?",
      "Yes — most customers start with the AI Receptionist and missed-call follow-up, then add roles every few weeks as they see the lift. There's no minimum bundle."
    ],
    [
      "What if it doesn't work for my business?",
      "First 30 days are no-questions-asked. If it isn't earning its keep, we pull it out and you keep what we built. We've never had a small-business operator we couldn't help, but we'd rather you walk away clean."
    ],
  ];
  const list = document.getElementById('faqList');
  if (!list) return;
  list.innerHTML = items.map(([q, a]) => `
    <details>
      <summary>${q}</summary>
      <div class="ans">${a}</div>
    </details>
  `).join('');
})();

/* ----------- Sticky nav scrolled state ----------- */
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

/* ----------- Mobile burger menu ----------- */
(function () {
  const burger = document.querySelector('.nav-burger');
  const menu   = document.getElementById('mobile-menu');
  if (!burger || !menu) return;
  const toggle = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
    menu.hidden = !open;
  };
  burger.addEventListener('click', () => {
    toggle(burger.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') toggle(false);
  });
})();

/* ----------- Scroll reveal (IntersectionObserver) ----------- */
(function () {
  const sels = [
    '.section-head',
    '.hero-pill', '.hero-title', '.hero-lede', '.hero-cta', '.hero-meta',
    '.logos',
    '.emp-card', '.how-step', '.metric',
    '.demo-text', '.demo-video',
    '.gs-panel',
    '.quote-card', '.faq-list',
    '.cta-final',
    '.reveal-stage'
  ];
  const els = document.querySelectorAll(sels.join(','));
  els.forEach(el => el.classList.add('reveal-fx'));

  const grids = document.querySelectorAll('.emp-grid, .how-rail, .metrics-grid, .quotes-grid, .logos-row');
  grids.forEach(g => g.classList.add('reveal-fx-stagger'));

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal-fx, .reveal-fx-stagger').forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal-fx, .reveal-fx-stagger').forEach(el => io.observe(el));

  // First-paint: anything already in view should reveal without waiting for scroll
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal-fx, .reveal-fx-stagger').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  });
})();

/* ----------- Active nav link on scroll ----------- */
(function () {
  const links = {};
  document.querySelectorAll('.nav-links a').forEach(a => {
    const id = a.getAttribute('href').replace('#', '');
    if (id) links[id] = a;
  });
  const targets = Object.keys(links).map(id => document.getElementById(id)).filter(Boolean);
  if (!targets.length) return;
  let active = null, s = false;
  const onScroll = () => {
    const y = window.scrollY + 160;
    let cur = null;
    for (const t of targets) if (t.offsetTop <= y) cur = t.id;
    if (cur && cur !== active) {
      active = cur;
      Object.entries(links).forEach(([k, a]) => a.classList.toggle('active', k === cur));
    }
  };
  window.addEventListener('scroll', () => {
    if (s) return; s = true;
    requestAnimationFrame(() => { onScroll(); s = false; });
  }, { passive: true });
  onScroll();
})();

/* ----------- Back-to-top ----------- */
(function () {
  const back = document.querySelector('.back-top');
  if (!back) return;
  let s = false;
  window.addEventListener('scroll', () => {
    if (s) return; s = true;
    requestAnimationFrame(() => {
      back.classList.toggle('show', window.scrollY > window.innerHeight * 0.7);
      s = false;
    });
  }, { passive: true });
  back.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
})();

/* ----------- Year stamps ----------- */
(function () {
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();

/* ----------- Cursor-reveal mask (radial) ----------- */
(function () {
  const stage = document.querySelector('[data-cursor-reveal]');
  if (!stage) return;

  // Skip JS-driven reveal on touch — CSS handles auto-cycle
  if (isCoarse) return;

  const target = stage;
  let raf = 0;
  let mx = 50, my = 50; // %
  let tx = 50, ty = 50;
  let active = false;

  const tick = () => {
    raf = 0;
    // ease toward target
    mx += (tx - mx) * 0.18;
    my += (ty - my) * 0.18;
    target.style.setProperty('--mx', mx + '%');
    target.style.setProperty('--my', my + '%');
    if (Math.abs(tx - mx) > 0.1 || Math.abs(ty - my) > 0.1) {
      raf = requestAnimationFrame(tick);
    }
  };

  stage.addEventListener('pointerenter', () => {
    active = true;
    stage.style.setProperty('--r', '320px');
  });
  stage.addEventListener('pointerleave', () => {
    active = false;
    // shrink the reveal back to nothing
    stage.style.setProperty('--r', '0px');
  });
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width)  * 100;
    ty = ((e.clientY - r.top)  / r.height) * 100;
    if (!raf) raf = requestAnimationFrame(tick);
  });

  // start collapsed
  stage.style.setProperty('--r', '0px');
})();

/* ----------- Parallax tilt on hero dash + demo frame ----------- */
(function () {
  if (reduceMotion || isCoarse) return;
  const els = document.querySelectorAll('[data-tilt]');
  els.forEach(el => {
    let raf = 0;
    let tX = 0, tY = 0, cX = 0, cY = 0;

    const apply = () => {
      raf = 0;
      cX += (tX - cX) * 0.12;
      cY += (tY - cY) * 0.12;
      el.style.transform = `perspective(2000px) rotateX(${cY.toFixed(2)}deg) rotateY(${cX.toFixed(2)}deg)`;
      if (Math.abs(tX - cX) > 0.05 || Math.abs(tY - cY) > 0.05) raf = requestAnimationFrame(apply);
    };

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width)  - 0.5;
      const py = ((e.clientY - r.top)  / r.height) - 0.5;
      tX = px * 6;
      tY = -py * 4;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    el.addEventListener('pointerleave', () => {
      tX = 0; tY = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  });
})();

/* ----------- Mouse-follow accent on cards ----------- */
(function () {
  const cards = document.querySelectorAll('.emp-card');
  cards.forEach(card => {
    let raf = 0;
    card.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
        raf = 0;
      });
    });
  });
})();

/* ----------- Hero parallax (scroll) ----------- */
(function () {
  if (reduceMotion) return;
  const stage = document.querySelector('.hero-stage');
  const aurora = document.querySelector('.hero-aurora');
  if (!stage && !aurora) return;
  let s = false;
  const update = () => {
    const y = window.scrollY;
    if (stage)  stage.style.transform  = `translateY(${y * -0.04}px)`;
    if (aurora) aurora.style.transform = `translateY(${y * 0.10}px)`;
  };
  window.addEventListener('scroll', () => {
    if (s) return; s = true;
    requestAnimationFrame(() => { update(); s = false; });
  }, { passive: true });
})();

/* ----------- Pause heavy animations when tab is hidden ----------- */
(function () {
  const heavy = document.querySelector('.page-plasma');
  if (!heavy) return;
  document.addEventListener('visibilitychange', () => {
    heavy.style.animationPlayState = document.hidden ? 'paused' : 'running';
  });
})();

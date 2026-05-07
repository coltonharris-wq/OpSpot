// =============================================================
// OpSpot landing — interactivity bundle
// =============================================================

// ---------- 1. canvas lava ----------
//
// layered light field rendered on canvas:
//   • base concentrated near center-bottom (cone source)
//   • cone of light fanning down + out from the central beam top
//   • soft drifting "smoke" blobs in the upper area
//   • bright hot core right where the beam meets the dashboard
//
(function () {
  const canvas = document.getElementById('lava');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, raf = 0, t0 = performance.now();

  // bottom blobs (concentrated around center-bottom, fanning slightly)
  const baseBlobs = [
    { color: '155, 170, 255', amp: 0.55, ox: 0.00, oy: 0.96, drift: 0.10, rk: 0.30 },
    { color: '125, 140, 240', amp: 0.50, ox: 0.00, oy: 0.92, drift: 0.18, rk: 0.40 },
    { color: '180, 160, 255', amp: 0.42, ox: 0.00, oy: 0.94, drift: 0.22, rk: 0.36 },
    { color: '110, 130, 230', amp: 0.45, ox: 0.00, oy: 0.98, drift: 0.30, rk: 0.42 },
    { color: '200, 210, 255', amp: 0.32, ox: 0.00, oy: 0.86, drift: 0.14, rk: 0.24 },
  ];

  // upper smoke (very subtle, dim, slow)
  const smokeBlobs = [
    { color: '90, 100, 160',  amp: 0.10, ox: -0.30, oy: 0.20, drift: 0.04, rk: 0.45 },
    { color: '80, 90, 150',   amp: 0.08, ox:  0.30, oy: 0.16, drift: 0.05, rk: 0.40 },
    { color: '120, 130, 200', amp: 0.06, ox:  0.10, oy: 0.30, drift: 0.06, rk: 0.50 },
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = canvas.width  = Math.max(1, Math.floor(rect.width  * dpr));
    h = canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  }

  function paintBlob(b, t, freqX, freqY, freqR) {
    const x = w / 2 + (b.ox * w) + Math.sin(t * freqX + b.amp * 7) * w * b.drift;
    const y = h * b.oy + Math.cos(t * freqY + b.amp * 9) * h * 0.04;
    const r = w * (b.rk + Math.sin(t * freqR + b.amp) * 0.04);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0,    `rgba(${b.color}, ${b.amp})`);
    g.addColorStop(0.45, `rgba(${b.color}, ${b.amp * 0.4})`);
    g.addColorStop(1,    `rgba(${b.color}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function paintCone(t) {
    // Cone of light from beam apex (top center) fanning down + out
    const ax = w / 2;
    const ay = h * 0.10;
    const grow = 1 + Math.sin(t * 0.0009) * 0.03;
    const conePts = [
      [ax,                                  ay],
      [ax - w * 0.55 * grow,                h],
      [ax + w * 0.55 * grow,                h],
    ];
    const g = ctx.createLinearGradient(ax, ay, ax, h);
    g.addColorStop(0,    'rgba(220, 225, 255, 0.22)');
    g.addColorStop(0.5,  'rgba(150, 165, 245, 0.12)');
    g.addColorStop(1,    'rgba(110, 130, 230, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(conePts[0][0], conePts[0][1]);
    ctx.lineTo(conePts[1][0], conePts[1][1]);
    ctx.lineTo(conePts[2][0], conePts[2][1]);
    ctx.closePath();
    ctx.fill();
  }

  function paintHotCore(t) {
    // Bright hot core at the beam base (where it meets the dashboard).
    const x = w / 2;
    const y = h * 0.78;
    const pulse = 1 + Math.sin(t * 0.0022) * 0.12;
    const r = w * 0.10 * pulse;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0,   'rgba(255, 255, 255, 0.85)');
    g.addColorStop(0.3, 'rgba(220, 230, 255, 0.40)');
    g.addColorStop(1,   'rgba(180, 200, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function frame(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    // upper soft smoke (slow, dim)
    smokeBlobs.forEach((b) => paintBlob(b, t, 0.00010, 0.00012, 0.00009));

    // cone of beam light
    paintCone(t);

    // dense base blobs
    baseBlobs.forEach((b) => paintBlob(b, t, 0.00030, 0.00045, 0.00020));

    // bright hot core
    paintHotCore(t);

    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }

  resize();
  raf = requestAnimationFrame(frame);
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    raf = requestAnimationFrame(frame);
  }, { passive: true });
})();

// ---------- 2. hero beam pulse ----------
(function () {
  const beam = document.querySelector('.hero-beam');
  if (!beam) return;
  let raf = 0, t0 = performance.now();
  function tick(now) {
    const t = (now - t0) / 1000;
    const o = 0.7 + Math.sin(t * 1.4) * 0.18;
    const y = 1 + Math.sin(t * 0.9) * 0.06;
    beam.style.setProperty('--beam-o', o.toFixed(3));
    beam.style.setProperty('--beam-y', y.toFixed(3));
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
})();

// ---------- 3. mouse parallax on hero copy ----------
(function () {
  const root = document.querySelector('[data-parallax-root]');
  if (!root) return;
  const targets = Array.from(document.querySelectorAll('[data-parallax]'));
  let raf = 0;
  let tx = 0, ty = 0, cx = 0, cy = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  function loop() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    targets.forEach((el) => {
      const k = parseFloat(el.dataset.parallax) || 0.1;
      el.style.transform = `translate(${cx * k * 12}px, ${cy * k * 12}px)`;
    });
    raf = requestAnimationFrame(loop);
  }
  window.addEventListener('mousemove', (e) => {
    const r = root.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width  - 0.5;
    ty = (e.clientY - r.top)  / r.height - 0.5;
  }, { passive: true });
  raf = requestAnimationFrame(loop);
})();

// ---------- 4. scroll reveals (.reveal + staggered .reveal-row) ----------
(function () {
  const reveals = document.querySelectorAll('.reveal, .reveal-row');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
    return;
  }
  reveals.forEach((el) => {
    const s = el.dataset.stagger;
    if (s) el.style.setProperty('--stagger', s);
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  reveals.forEach((el) => io.observe(el));
})();

// ---------- 5. cursor spotlight on dark cards ----------
(function () {
  const cards = document.querySelectorAll('.bento-card, .brain-card');
  cards.forEach((card) => {
    let raf = 0;
    card.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top)  + 'px');
        raf = 0;
      });
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--mx', '-50%');
      card.style.setProperty('--my', '-50%');
    });
  });
})();

// ---------- 6. nav background on scroll ----------
(function () {
  const nav = document.querySelector('header.nav');
  if (!nav) return;
  let s = false;
  function update() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', () => {
    if (s) return; s = true;
    requestAnimationFrame(() => { update(); s = false; });
  }, { passive: true });
  update();
})();

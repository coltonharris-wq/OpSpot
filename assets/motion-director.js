// Evidence-driven motion layer inspired by Huly's public runtime patterns.

(function motionDirector() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const isMobile = () => window.innerWidth < 768;

  function observe(element, options, callback) {
    if (!element || !("IntersectionObserver" in window)) {
      callback(true);
      return () => {};
    }
    const observer = new IntersectionObserver(([entry]) => callback(entry.isIntersecting), options);
    observer.observe(element);
    return () => observer.disconnect();
  }

  function driveHeroMask() {
    const hero = document.querySelector(".hero");
    const layer = document.querySelector(".hero-water");
    if (!hero || !layer) return;

    const routes = [
      (p, box) => ({ x: box.width * (0.2 + 0.28 * p), y: box.height * (0.68 - 0.42 * Math.sin(p * Math.PI)) }),
      (p, box) => ({ x: box.width * (0.5 + 0.28 * p), y: box.height * (0.18 + 0.48 * p) }),
      (p, box) => ({ x: box.width * (0.72 - 0.42 * p), y: box.height * (0.74 - 0.2 * Math.sin(p * Math.PI)) }),
    ];
    let auto = true;
    let routeStarted = performance.now() - 6900;
    let frame = 0;
    let resumeTimer = 0;

    function setMask(x, y) {
      const px = `${Math.max(0, x).toFixed(1)}px`;
      const py = `${Math.max(0, y).toFixed(1)}px`;
      layer.style.setProperty("--hero-mask-x", px);
      layer.style.setProperty("--hero-mask-y", py);
      document.documentElement.style.setProperty("--hero-mask-x", px);
      document.documentElement.style.setProperty("--hero-mask-y", py);
    }

    function tick(now) {
      if (auto) {
        const box = layer.getBoundingClientRect();
        const elapsed = Number.isFinite(now - routeStarted) ? (now - routeStarted) % 7000 : 0;
        const active = Math.min(elapsed / 6000, 1);
        const segment = Math.floor(clamp(active * routes.length, 0, routes.length - 0.001));
        const local = active * routes.length - segment;
        const point = (routes[segment] || routes[0])(ease(local), box);
        setMask(point.x, point.y);
        if (elapsed > 6900) routeStarted = now;
      }
      frame = requestAnimationFrame(tick);
    }

    hero.addEventListener(
      "pointermove",
      (event) => {
        const box = layer.getBoundingClientRect();
        auto = false;
        clearTimeout(resumeTimer);
        setMask(event.clientX - box.left, event.clientY - box.top);
        resumeTimer = setTimeout(() => {
          auto = true;
          routeStarted = performance.now();
        }, 2400);
      },
      { passive: true }
    );
    frame = requestAnimationFrame(tick);
    window.addEventListener("pagehide", () => cancelAnimationFrame(frame));
  }

  function createCanvas(parent, className) {
    const canvas = document.createElement("canvas");
    canvas.className = className;
    canvas.setAttribute("aria-hidden", "true");
    parent.prepend(canvas);
    const ctx = canvas.getContext("2d", { alpha: true });
    const state = { canvas, ctx, width: 1, height: 1, dpr: Math.min(window.devicePixelRatio || 1, 2) };
    function resize() {
      const box = parent.getBoundingClientRect();
      state.width = Math.max(1, Math.floor(box.width * state.dpr));
      state.height = Math.max(1, Math.floor(box.height * state.dpr));
      canvas.width = state.width;
      canvas.height = state.height;
    }
    resize();
    return { state, resize };
  }

  function glow(ctx, x, y, radius, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${color}, ${alpha})`);
    g.addColorStop(0.42, `rgba(${color}, ${alpha * 0.35})`);
    g.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function drawLine(ctx, points, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
    ctx.stroke();
  }

  function drawProductivity(ctx, w, h, t, type) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, w * (0.35 + Math.sin(t * 0.55) * 0.12), h * 0.22, w * 0.38, "255,125,66", 0.18);
    glow(ctx, w * (0.72 + Math.cos(t * 0.43) * 0.1), h * 0.48, w * 0.44, "69,198,255", 0.13);

    if (type === "command") {
      const y = h * (0.27 + (Math.floor(t * 0.82) % 3) * 0.105);
      glow(ctx, w * 0.48, y, w * 0.16, "255,255,255", 0.13);
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.25, y - 12, w * 0.5, 34);
      ctx.fillStyle = "rgba(255,255,255,.82)";
      ctx.beginPath();
      ctx.arc(w * (0.7 + Math.sin(t * 1.8) * 0.05), h * (0.36 + Math.cos(t * 1.35) * 0.18), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (type === "planner") {
      const p = (t * 0.12) % 1;
      const route = [
        { x: w * 0.18, y: h * 0.68 },
        { x: w * 0.34, y: h * 0.42 },
        { x: w * 0.58, y: h * 0.52 },
        { x: w * 0.82, y: h * 0.24 },
      ];
      drawLine(ctx, route, "rgba(114,213,255,.42)", 3);
      route.forEach((point, index) => {
        glow(ctx, point.x, point.y, w * 0.08, index % 2 ? "255,132,78" : "74,200,255", 0.2);
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
      });
      const a = Math.floor(p * (route.length - 1));
      const b = route[Math.min(a + 1, route.length - 1)];
      const start = route[a];
      const local = p * (route.length - 1) - a;
      glow(ctx, start.x + (b.x - start.x) * local, start.y + (b.y - start.y) * local, w * 0.16, "255,255,255", 0.22);
    }

    if (type === "follow") {
      for (let i = 0; i < 18; i += 1) {
        const x = ((i * 71 + t * 24) % (w + 80)) - 40;
        const y = h * (0.18 + ((i * 19) % 62) / 100);
        ctx.fillStyle = `rgba(${i % 2 ? "255,134,80" : "92,210,255"}, ${0.18 + 0.08 * Math.sin(t + i)})`;
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (type === "signal") {
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < 4; i += 1) {
        ctx.strokeStyle = `rgba(${i % 2 ? "255,132,78" : "83,203,255"}, ${0.18 + i * 0.08})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 42 + i * 36 + Math.sin(t + i) * 4, t * (0.6 + i * 0.12), t * (0.6 + i * 0.12) + Math.PI * 0.72);
        ctx.stroke();
      }
      glow(ctx, cx + Math.cos(t * 1.7) * w * 0.22, cy + Math.sin(t * 1.7) * h * 0.22, w * 0.13, "255,255,255", 0.2);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function drawSync(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, w * 0.08, h * (0.45 + Math.sin(t * 0.6) * 0.18), w * 0.5, "68,205,255", 0.18);
    glow(ctx, w * 0.92, h * (0.52 + Math.cos(t * 0.5) * 0.16), w * 0.5, "255,116,55", 0.18);
    for (let i = 0; i < 16; i += 1) {
      const y = ((i * 43 + t * 28) % (h + 60)) - 30;
      drawLine(ctx, [{ x: w * 0.08, y }, { x: w * 0.92, y: y + Math.sin(i + t) * 16 }], "rgba(255,255,255,.035)", 1);
    }
    const scan = (t * 0.11) % 1;
    const x = w * (0.08 + scan * 0.84);
    drawLine(ctx, [{ x, y: h * 0.12 }, { x: x + w * 0.05, y: h * 0.88 }], "rgba(255,255,255,.22)", 3);
    ctx.globalCompositeOperation = "source-over";
  }

  function drawCall(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (let row = 0; row < 5; row += 1) {
      const y = h * (0.22 + row * 0.12);
      const points = [];
      for (let i = 0; i < 40; i += 1) {
        const x = (w / 39) * i;
        points.push({ x, y: y + Math.sin(i * 0.6 + t * (1.1 + row * 0.1)) * (8 + row * 2) });
      }
      drawLine(ctx, points, row % 2 ? "rgba(255,126,72,.16)" : "rgba(70,200,255,.18)", 2);
    }
    glow(ctx, w * (0.32 + Math.sin(t * 0.7) * 0.12), h * 0.46, w * 0.34, "70,200,255", 0.14);
    glow(ctx, w * (0.68 + Math.cos(t * 0.6) * 0.1), h * 0.42, w * 0.28, "255,132,78", 0.12);
    ctx.globalCompositeOperation = "source-over";
  }

  function driveCanvases() {
    const stages = [];
    document.querySelectorAll(".media-card .card-visual").forEach((stage) => {
      const card = stage.closest(".media-card");
      const type = card.classList.contains("planner-card")
        ? "planner"
        : card.classList.contains("follow-card")
          ? "follow"
          : card.classList.contains("signal-card")
            ? "signal"
            : "command";
      const item = { ...createCanvas(stage, "motion-canvas"), type, active: false, draw: drawProductivity };
      stages.push(item);
      observe(stage, { threshold: 0.12 }, (active) => {
        card.classList.toggle("is-rive-active", active);
        item.active = active;
      });
    });

    const sync = document.querySelector(".sync-frame");
    if (sync) {
      const item = { ...createCanvas(sync, "sync-glow-canvas"), type: "sync", active: false, draw: drawSync };
      stages.push(item);
      observe(sync, { threshold: 0.05, rootMargin: "0px 0px 500px 0px" }, (active) => {
        sync.classList.toggle("is-video-playing", active);
        item.active = active;
      });
    }

    const call = document.querySelector(".call-window");
    if (call) {
      const item = { ...createCanvas(call, "call-wave-canvas"), type: "call", active: false, draw: drawCall };
      stages.push(item);
      observe(call, { threshold: 0.05, rootMargin: "0px 0px 400px 0px" }, (active) => {
        call.classList.toggle("is-video-playing", active);
        item.active = active;
      });
    }

    window.addEventListener("resize", () => stages.forEach((stage) => stage.resize()), { passive: true });

    function loop(now) {
      const t = now / 1000;
      stages.forEach((stage) => {
        if (!stage.active && !isMobile()) return;
        stage.draw(stage.state.ctx, stage.state.width, stage.state.height, t, stage.type);
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function driveDocumentMotion() {
    const target = document.querySelector("[data-typewriter]");
    const doc = document.querySelector("[data-document-motion]");
    if (!target && !doc) return;
    const live = target;
    const text = live ? live.dataset.typewriter || "" : "";
    const timings = [0, 110, 220, 470, 480, 540, 650, 760, 870, 1120, 1130, 1190, 1300, 1410, 1520, 1650, 1760, 1880];
    let typed = false;

    function runType() {
      if (!live || typed) return;
      typed = true;
      live.textContent = "";
      text.split("").forEach((_, index) => {
        setTimeout(() => {
          live.textContent = text.slice(0, index + 1);
          if (index === text.length - 1) live.closest(".typed-line")?.classList.add("is-complete");
        }, timings[index] || index * 90);
      });
    }

    observe(live || doc, { threshold: 0.5, rootMargin: "40px 0px 0px 0px" }, (active) => {
      if (!active) return;
      runType();
      doc?.classList.add("is-annotating");
    });
  }

  if (reduce) return;
  driveHeroMask();
  driveCanvases();
  driveDocumentMotion();
})();

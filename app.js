// OpSpot landing interactions and canvas motion.

(function drawWaterField() {
  const canvas = document.getElementById("water-field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0;
  let height = 0;
  let raf = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const start = performance.now();

  const clouds = [
    { x: 0.22, y: 0.18, r: 0.34, c: "54,78,126", a: 0.2, s: 0.18 },
    { x: 0.73, y: 0.23, r: 0.42, c: "58,85,158", a: 0.28, s: 0.14 },
    { x: 0.83, y: 0.55, r: 0.32, c: "44,112,220", a: 0.32, s: 0.22 },
    { x: 0.53, y: 0.76, r: 0.46, c: "92,104,255", a: 0.28, s: 0.16 },
    { x: 0.42, y: 0.8, r: 0.36, c: "76,210,255", a: 0.34, s: 0.2 },
  ];

  function resize() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(box.width * dpr));
    height = Math.max(1, Math.floor(box.height * dpr));
    canvas.width = width;
    canvas.height = height;
  }

  function radial(x, y, r, color, alpha) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.45, `rgba(${color}, ${alpha * 0.38})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function beamBase(t) {
    const beamX = window.innerWidth <= 900 ? 0.92 : 0.555;
    const x = width * beamX;
    const y = height * 0.63;
    const pulse = 1 + Math.sin(t * 1.7) * 0.08;
    radial(x, y, width * 0.18 * pulse, "255,255,255", 0.62);
    radial(x, y, width * 0.34 * pulse, "74,200,255", 0.2);
  }

  function frame(now) {
    const t = (now - start) / 1000;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    clouds.forEach((cloud, index) => {
      const driftX = Math.sin(t * cloud.s + index * 1.8) * width * 0.035;
      const driftY = Math.cos(t * cloud.s * 0.7 + index) * height * 0.025;
      radial(
        width * cloud.x + driftX,
        height * cloud.y + driftY,
        width * cloud.r,
        cloud.c,
        cloud.a
      );
    });

    const beamX = window.innerWidth <= 900 ? 0.92 : 0.555;
    const cone = ctx.createLinearGradient(width * beamX, height * 0.1, width * beamX, height);
    cone.addColorStop(0, "rgba(255,255,255,0.08)");
    cone.addColorStop(0.52, "rgba(80,200,255,0.09)");
    cone.addColorStop(1, "rgba(80,105,255,0)");
    ctx.filter = "blur(38px)";
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(width * beamX, height * 0.08);
    ctx.lineTo(width * (beamX - 0.38), height);
    ctx.lineTo(width * 0.96, height);
    ctx.closePath();
    ctx.fill();
    ctx.filter = "none";

    beamBase(t);
    ctx.globalCompositeOperation = "source-over";
    raf = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  if (!reduce) raf = requestAnimationFrame(frame);
  else frame(start);
  window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
})();

(function pulseBeam() {
  const beam = document.querySelector(".water-beam");
  if (!beam || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const start = performance.now();

  function tick(now) {
    const t = (now - start) / 1000;
    beam.style.setProperty("--beam-alpha", String(0.82 + Math.sin(t * 1.45) * 0.16));
    beam.style.setProperty("--beam-scale", String(0.98 + Math.sin(t * 0.9) * 0.035));
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

(function revealOnScroll() {
  const elements = Array.from(document.querySelectorAll(".reveal"));
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );

  elements.forEach((element) => observer.observe(element));
})();

(function navState() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;
  let busy = false;

  function update() {
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }

  window.addEventListener(
    "scroll",
    () => {
      if (busy) return;
      busy = true;
      requestAnimationFrame(() => {
        update();
        busy = false;
      });
    },
    { passive: true }
  );
  update();
})();

(function parallaxHero() {
  const root = document.querySelector("[data-parallax-root]");
  const targets = Array.from(document.querySelectorAll("[data-parallax]"));
  if (!root || !targets.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener(
    "pointermove",
    (event) => {
      const box = root.getBoundingClientRect();
      targetX = (event.clientX - box.left) / box.width - 0.5;
      targetY = (event.clientY - box.top) / box.height - 0.5;
    },
    { passive: true }
  );

  function loop() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    targets.forEach((element) => {
      const power = Number(element.dataset.parallax || 0.1);
      element.style.transform = `translate3d(${currentX * power * 26}px, ${currentY * power * 20}px, 0)`;
    });
    requestAnimationFrame(loop);
  }

  loop();
})();

# Huly Reference Pass - OpSpot Landing

Date: 2026-05-06

## Inputs

- Desktop screenshots: `~/Desktop/Screenshot 2026-05-06 at 9.12-9.13 PM*.png`
- Live Playwright pass: `https://huly.io` at `1470x956`
- Generated evidence folders:
  - `/tmp/huly-live-playwright`
  - `/tmp/opspot-playwright-2`

## Huly Motion Findings

- Hero background is a 4s looping muted MP4 at `1920x1438` in the viewport. It supplies the beam, bloom, smoke, grain, and dashboard reveal feel.
- Public runtime inspection shows the page is a Next.js app using Framer Motion, Rive canvas files, HLS/MP4 video gates, and IntersectionObserver-driven play/pause.
- Huly preloads `rive.b8b719dae3c2060a.wasm` and mounts `.riv` files for the card/interface animations:
  - `/animations/pages/home/stay-productive/hotkeys.riv`
  - `/animations/pages/home/stay-productive/notifications.riv`
  - `/animations/pages/home/stay-productive/team-planner.riv`
  - `/animations/pages/home/stay-productive/time-blocking.riv`
  - `/animations/pages/home/sync-with-github/interface-github.riv`
  - `/animations/pages/home/knowledge/cards.riv`
- Video layers are mounted only near viewport and played/paused around `threshold: .05`, including hero, work-together call/waves, and sync glow videos.
- The hero mask is not just CSS decoration. It has a JavaScript autopilot that moves CSS variables `--hero-mask-x` and `--hero-mask-y` through three path segments over ~6s, repeats every ~7s, and hands control to pointer movement.
- Knowledge text uses timed typewriter arrays, delayed Framer Motion CSS variables `--highlight-position` and `--cursor-position`, and draggable pin components.
- Scroll rhythm at `1470x956`:
  - Hero dashboard peeks around the first viewport bottom.
  - Productivity cards fill the next two viewports.
  - Office/video section is light, airy, and centered.
  - Dark sync section uses a single glowing application frame.
  - MetaBrain uses asymmetric dark cards on a light surface.
  - Knowledge section uses annotation cards and document-like content.
  - Final CTA uses a dark scene with a rotating dial/clock-like object.

## OpSpot Implementation

- Replaced placeholder "video slot" blocks with code-native animated modules.
- Hero uses a canvas water field plus CSS beam instead of Huly lava/video assets.
- Cards, office call panel, CRM sync frame, OpsBrain bento, document annotation, and final dial are original OpSpot assets built in HTML/CSS.
- Added a second motion pass in `assets/motion.css`:
  - faint hero UI float panels
  - dashboard scan sweep and breathing glow
  - card hover spotlights and internal visual drift
  - office call float, avatar pulse, and participant wake sequence
  - CRM frame edge glow and row reveal loop
  - OpsBrain card float/grain movement
  - knowledge annotation cursor/tag motion
  - final dial halos and moving blue/orange beams
- Added the deeper Huly-pattern pass in `assets/motion-director.js`:
  - hero mask autopilot plus pointer takeover
  - canvas-driven card animation layers as a Rive-style substitute
  - viewport-gated sync glow and call wave canvas layers
  - typewriter heading, document highlight, and pin annotation motion
- Files are split to stay under 500 lines:
  - `index.html`
  - `assets/styles.css`
  - `assets/motion.css`
  - `assets/motion-director.js`
  - `app.js`

## Boundaries

Do not copy Huly HTML, CSS, text, logo, MP4 files, screenshots, or product UI directly into production. Match the motion architecture and cinematic rhythm with original OpSpot visuals.

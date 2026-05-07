# Landing Page Handoff

Date: 2026-05-07
Branch at handoff: main
Baseline tag: landing-page

## Summary

The OpSpot.ai landing page is in a good-enough baseline state for review and future product work. The page was rebuilt as an original OpSpot.ai marketing surface for selling AI operations help to SMBs, using Huly-inspired motion structure without copying Huly assets, copy, videos, or trade dress.

Recent landing commits:

- `e0cfc93` - rebuilt the OpSpot landing page animations and content baseline.
- `7806683` - added the first Huly-style motion pass.
- `a77e4e7` - added deeper runtime motion patterns after inspecting Huly behavior.

## Runtime Findings

Huly's public site uses a Next.js frontend with Framer Motion, Rive `.riv` canvas animations, viewport-gated video playback, HLS/MP4 media, scroll-tied reveals, pointer-responsive masking, sticky scenes, and staggered copy/card entrances.

The OpSpot page mirrors the motion language at a high level:

- Pointer-following hero spotlight/mask.
- Scroll-driven parallax and section reveal timing.
- Viewport-gated video/card activation.
- Rive-like canvas motion cards implemented locally.
- Water/ops-themed visual language instead of Huly lava/space motifs.
- OpSpot.ai copy, color system, and SMB AI sales positioning.

## Main Files

- `index.html`
- `assets/styles.css`
- `assets/motion.css`
- `assets/motion-director.js`
- `app.js`
- `docs/huly-animation-reference.md`

## Verification

Local server used:

- `http://127.0.0.1:4173/`

Playwright verification evidence:

- `/tmp/opspot-deep-motion-verify-2`

Validated:

- Desktop and mobile pages loaded without console errors.
- No horizontal overflow in tested viewports.
- Hero mask moved automatically and responded to pointer movement.
- Typewriter animation completed.
- Motion cards mounted canvas-based animations.
- Sync and call sections activated only when in viewport.
- Mobile nav and layout remained usable.

## Next Work

Start the actual product work from the `dashboard` branch created from this landing baseline. Avoid editing the landing page unless dashboard routing or shared assets require it.

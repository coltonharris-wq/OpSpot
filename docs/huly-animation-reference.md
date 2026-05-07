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
- Playwright did not report active DOM animations for the captured elements; most movement is video playback, scroll position, and reveal timing.
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
- Files are split to stay under 500 lines:
  - `index.html`
  - `assets/styles.css`
  - `app.js`

## Boundaries

Do not copy Huly HTML, CSS, text, logo, MP4 files, screenshots, or product UI directly into production. Match the motion architecture and cinematic rhythm with original OpSpot visuals.

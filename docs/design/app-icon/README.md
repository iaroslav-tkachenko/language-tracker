# Language Tracker app icon

## Directory structure

- `current/concepts/` contains the active concept directions, design rationale,
  and any prompts used during visual exploration.
- `current/source/` is reserved for editable source artwork for the selected
  icon.
- `current/exports/` is reserved for production SVG and PNG exports.
- `current/previews/` is reserved for comparison sheets, mask checks, and
  small-size previews.
- `archive/YYYY-MM-DD-<version-or-concept>/` will contain concepts or asset sets
  that have been rejected, superseded, or replaced. An existing current set
  must be moved there before a replacement is introduced.

## Status

Stage 3 production artwork is complete and approved by the product owner. The
selected v7 concept has been manually reconstructed as a clean 1024-unit SVG,
exported in every requested size, and checked in square, circular, squircle,
rounded-square, background, small-size, and maskable-safe-zone previews. The
approved asset set is ready for PWA application integration.

## Selected concept

The selected production concept is **Chat Text Clock v7**: a primary-blue field,
an off-white dialogue outline with two text strokes, an overlapping emerald
clock, and the two-line `Language Tracker` title. The 32 px favicon intentionally
uses the symbol without the title so it remains recognizable at favicon scale.

## Working palette

The final artwork uses colors already established in the application:

| Role         | Color     | Use                            |
| ------------ | --------- | ------------------------------ |
| Primary blue | `#155DFC` | Full-bleed opaque background   |
| Emerald      | `#10B981` | Clock face                     |
| Off-white    | `#F8FAFC` | Symbol, clock hands, and title |

## Current files

- `current/concepts/concept-01-chat-text-clock-v7.md` — approved concept prompt
  and assessment.
- `current/concepts/concept-01-chat-text-clock-v7.png` — approved raster concept
  reference.
- `current/source/language-tracker-icon-master.svg` — editable production SVG,
  `viewBox="0 0 1024 1024"`.
- `current/source/render-app-icon-assets.mjs` — deterministic export and preview
  renderer.
- `current/source/verify-app-icon-assets.mjs` — file and metadata verification.
- `current/exports/language-tracker-icon-master.svg` — distribution copy of the
  production SVG.
- `current/exports/language-tracker-icon-1024.png` — 1024 px master PNG.
- `current/exports/language-tracker-icon-512.png` — 512 px `any` PNG.
- `current/exports/language-tracker-icon-192.png` — 192 px `any` PNG.
- `current/exports/language-tracker-icon-maskable-512.png` — 512 px maskable PNG
  with scaled safe-zone artwork.
- `current/exports/apple-touch-icon-180.png` — 180 px Apple touch icon.
- `current/exports/favicon-32.png` — 32 px symbol-only favicon adaptation.
- `current/exports/favicon.svg` — scalable symbol-only favicon with enlarged
  dialogue-and-clock artwork and no title.
- `current/exports/language-tracker-symbol.ico` — multi-size symbol-only Windows
  desktop icon with embedded 16, 24, 32, 48, 64, 128, and 256 px images.
- `public/icons/language-tracker-symbol.ico` — downloadable production copy of
  the Windows desktop icon.
- `current/previews/icon-preview-sheet.png` — 1800×1600 visual QA sheet.
- `current/previews/validation-report.md` — programmatic and visual verification
  results.

## Replacement history

- 2026-09-05: Established the app-icon workspace and completed the first
  concept-direction study. No prior app-icon asset set existed in this
  workspace, so nothing was moved to `archive/`.
- 2026-09-05: Generated one basic visual study for each direction after the
  product owner requested all four concepts. Nothing was replaced or archived.
- 2026-09-05: The product owner rejected all four initial directions and
  explicitly removed heatmap imagery from consideration. The complete initial
  set was moved to `archive/2026-09-05-initial-four-directions/`, and four new
  title-led v2 studies were generated from supplied composition references.
- 2026-09-05: The product owner selected v2 concepts 1 and 4 for refinement,
  requested a blue base, removed the dialogue window from concept 1, and chose
  `Ä`, `文`, and `Й` for concept 4. The complete v2 set was moved to
  `archive/2026-09-05-title-led-v2/` before generating v3.
- 2026-09-05: The product owner retained concept 4 v3 and requested more icon
  treatments for concept 1, with a larger main mark and a small corner clock.
  The standalone clock concept was moved to
  `archive/2026-09-05-clock-title-v3/`, and three v4 variants were generated.
- 2026-09-05: The product owner supplied a more precise symbol reference and
  requested two text strokes inside the dialogue window. The v4 set was moved
  to `archive/2026-09-05-chat-clock-v4/`, and the focused v5 candidate was
  generated.
- 2026-09-05: The product owner requested a smaller upper symbol and thinner
  linework matched to the title's stroke weight. The v5 candidate was moved to
  `archive/2026-09-05-chat-text-clock-v5/`, and the proportionally refined v6
  candidate was generated.
- 2026-09-05: The product owner requested that the complete symbol-and-title
  lockup use more of the canvas while preserving its internal proportions. The
  v6 candidate was moved to `archive/2026-09-05-chat-text-clock-v6/`, and the
  uniformly enlarged v7 candidate was generated.
- 2026-09-05: The product owner selected v7 as final. The unselected language
  glyph concept was moved to `archive/2026-09-05-language-glyphs-v3/`. The v7
  geometry was manually reconstructed in SVG and exported as the production
  icon set. No current production asset was replaced or archived because this
  is the first production set.

## Prompts and tools

The built-in OpenAI image-generation tool was used only for concept exploration;
no CLI, external API, or API key was used. The final concept prompt and decisions
are recorded in `current/concepts/concept-01-chat-text-clock-v7.md`. Production
artwork was manually reconstructed in SVG using simple paths, circles, text, and
flat fills. The bundled workspace Node.js runtime and Sharp were used to render
and inspect PNG exports and the preview sheet. The source renderer deliberately
creates a reduced maskable lockup and a symbol-only 32 px favicon.

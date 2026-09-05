# Selected direction refinements — v3

- Date: 2026-09-05
- Status: Two refinements generated; awaiting product-owner review
- Tool: Built-in OpenAI image generation
- Input references: The corresponding v2 images were used as edit targets.
- Shared changes: primary-blue `#155DFC` full-bleed background, no heatmap.

## 1. Clock + Title

File: `concept-01-clock-title-v3.png`

Prompt: preserve the symbol-over-title hierarchy and exact two-line title
`Language Tracker`; replace the coral background with primary blue `#155DFC`;
remove the speech bubble and every speech-tail shape; replace it with a bold open
clock ring whose hands form a subtle L; add one restrained emerald `#34D399`
progress segment; render the symbol and title in off-white `#F8FAFC`; exclude
flags, heatmaps, effects, mockups, and generic alarm-clock details.

Assessment: the speech metaphor is fully removed and the mark now reads clearly
as time tracking. The open ring and green segment add motion without requiring
small details. If selected, the ring proportions, segment length, and hand
position should be compared in controlled variants.

## 4. Language Glyphs + Title

File: `concept-04-language-glyphs-blue-v3.png`

Prompt: preserve the large exact stacked title `LANGUAGE TRACKER`; change the
background to primary blue `#155DFC`; replace the bottom row with exactly `Ä`,
`文`, `Й`, and `+` in that order; use simple circular outlines with no speech
tails; render the title in off-white `#F8FAFC`; use warm yellow `#F7C95E`, light
cyan `#67E8F9`, soft coral `#FDA4AF`, and off-white `#F8FAFC` for the four
medallions; preserve both dots on `Ä` and the breve on Cyrillic `Й`; exclude
flags, heatmaps, effects, and mockups.

Assessment: all requested glyphs are present and the outline colors remain
distinct against blue. The concept communicates multilingual scope strongly,
but the glyph row will need explicit 32 px testing before production because
diacritics are semantically important.

## Decision gate

Neither v3 concept is final. The next step is to select one direction or request
specific proportional/color changes. Production SVG construction and exports
remain blocked until a concrete visual is explicitly approved.

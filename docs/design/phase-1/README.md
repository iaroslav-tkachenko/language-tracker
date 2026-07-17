# Phase 1 design review

## Milestone 1A — Above-the-fold board experience

These screenshots capture the implemented clickable prototype on July 17, 2026.

- [Desktop — 1366 × 768](milestone-1a-desktop-final.png)
- [Mobile — 390 × 844](milestone-1a-mobile-final.png)

The preview uses in-memory demonstration data. Entries and settings reset when the page is refreshed. Production persistence and authenticated ownership remain separate implementation work.

The approved direction includes the soft Study Time heatmap palette, labelled tracker navigation, no redundant Home icon, no `Top activity` card, a circular current-level badge, emphasized selected-day total, one-day navigation arrows, and activity-specific icons.

## Milestone 1B — Mobile and selected-day workflow

- [Updated desktop overview](milestone-1b-desktop.png)
- [Mobile overview](milestone-1b-mobile-top.png)
- [Mobile selected-day section](milestone-1b-mobile-bottom.png)
- [Mobile create form](milestone-1b-mobile-create.png)
- [Mobile edit form with saved values selected](milestone-1b-mobile-edit.png)
- [Mobile non-today heading and empty state](milestone-1b-mobile-selected-date.png)

The mobile year is split into `Jan–Jun` and `Jul–Dec`. Dates before the board's first entry remain white; missed past dates after that entry are red, while yellow and green always indicate positive study time.

The compact mobile CEFR card uses two lines: `B1 → B2` and `Estimated in ≈ 6 months`. The yellow and green cells in these prototype screenshots contain synthetic positive study sessions; they never represent empty past dates. Production data follows the same invariant: empty past gaps are red only after the board's first session, while earlier empty dates, today, and future dates are white.

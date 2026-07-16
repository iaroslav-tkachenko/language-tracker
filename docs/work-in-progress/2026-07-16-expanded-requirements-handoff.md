# Expanded Requirements Update — Work Handoff

## Status

**Paused safely on July 16, 2026 at the project owner's request.**

This is a checkpoint, not the final approved documentation baseline. No expanded-scope feature implementation is authorized until the documents listed below are completed, validated, reviewed by the project owner, and explicitly approved for Phase 1.

## Approved product decisions captured

- Delivery order: Phase 1 revised Study Time UX; Phase 2 batch study entries; Phase 3 Vocabulary; Phase 4 CEFR and expanded analytics.
- At 1366×768 and 100% zoom, the primary screen must show the heatmap, summary, selected-day heading, and first entry or `Add study session` without page scrolling.
- Empty selected days initially show a collapsed `Add study session` action.
- `Save` requires both valid duration and activity; edit uses `Update`/`Cancel`; delete requires confirmation.
- Study Time fixed levels remain 0, 1–14, 15–29, 30–59, 60–119, 120–180, and 181+ minutes.
- Past zero-minute Study Time days are red; empty today/future dates are white; sub-hour positive levels use yellow-family colors; 60+ levels use progressively darker greens.
- Batch creation covers an inclusive, same-calendar-year range of at most 366 dates and adds an independent entry even when a matching entry already exists.
- Vocabulary stores one editable final positive-integer total per board/date.
- Vocabulary levels are 0, 1–2, 3–5, 6–9, 10–14, 15–19, 20–39, and 40+ words. The originally overlapping `3–5`/`5–9` wording was normalized to `3–5`/`6–9`.
- CEFR declarations are manual, board-specific historical events with past/current effective dates and optional comments.
- Forecasts use one approximate Cambridge English guided-learning-hours model across languages with an explicit limitation warning.
- Forecast pace uses seven calendar dates ending today, includes zero-study dates, and excludes future entries.
- Vocabulary-to-CEFR word cutoffs and ideal activity distributions will be immutable but their values remain deferred until the owner supplies them.

## Files updated in this checkpoint

- `AGENTS.md`
- `docs/README.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/requirements/PRODUCT_VISION.md`
- `docs/requirements/BUSINESS_REQUIREMENTS.md`
- `docs/requirements/FUNCTIONAL_REQUIREMENTS.md`
- `docs/requirements/NON_FUNCTIONAL_REQUIREMENTS.md`
- `docs/requirements/USE_CASES.md`
- `docs/requirements/GLOSSARY.md`

## Resume plan

1. Re-read `AGENTS.md`, this handoff, and the current Git status; preserve the unrelated `pnpm-workspace.yaml` change.
2. Complete the architecture calculation section for Cambridge midpoint targets and verify all new table/function descriptions.
3. Replace `docs/IMPLEMENTATION_PLAN.md` with the re-baselined Phase 0–4 plan described above.
4. Update `docs/requirements/TRACEABILITY_MATRIX.md` for `BR-011`–`BR-015`, `FR-ENTRY-013`–`FR-ENTRY-022`, `FR-VOCAB-*`, `FR-CEFR-*`, new statistics/UI requirements, and new verification IDs.
5. Review `docs/README.md`, root `README.md`, and `AGENTS.md` for final scope/status wording.
6. Check requirement identifiers, Markdown links, terminology, deferred-model gates, and cross-document consistency.
7. Run Prettier on changed Markdown, `git diff --check`, link/duplicate-ID checks, and a staged secret-like-token scan.
8. Create a final documentation commit and push it to GitHub.
9. Present the completed documentation to the project owner and wait for explicit Phase 1 implementation approval.

## Implementation prohibition

Do not change application functionality, database migrations, or tests for the expanded requirements while this handoff remains incomplete. The next work session is documentation-only until the final review gate is satisfied.

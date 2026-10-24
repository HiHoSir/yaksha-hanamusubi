# Editor and approved Jizo integration plan

> Execute inline; use verification-before-completion and one final branch review.

**Goal:** Approved B Jizo replaces the field sprite and becomes a palette chip; the accepted settlement editor is available from main Pages.
**Architecture:** Import only additive editor runtime/assets/tests/docs from preview 734a81b. Preserve main afe3268 game, NPCs, maps and battle. Share existing catalog/model/render APIs; add approved chips without migrating authored maps.
**Tech Stack:** Static JS/Canvas, node:test, canvas, jsdom, Playwright, GitHub Git data API and Pages Actions.
**Spec:** User request of 2026-10-25; AGENTS.md; docs/topview-map-standard.md.

## Constraints and review focus
- Preserve game/save/field-guide behavior and current battle changes.
- Approved B bytes are SHA256 5014bcaeb80d3cc01ce940552a50a9cfd19f7a37fb2d492d450b8a5532b74b95.
- The editor uses its existing yaksha.settlementEditor.v1 key; never game storage keys.
- Explicit one-cell Jizo occupancy; a field guide keeps its authored pass-through policy.
- Old preview JSON, undo/redo, export and real image loading must continue working.
- main BETA and all index cache versions update to 16.1.39; editor dependencies get matching cache versions.

## Tasks
- [x] Inspect main/preview differences, read rules; isolate the work and import additive editor dependencies.
- [x] Add failing integration tests for approved Jizo pixels, palette loading and unchanged guides; implement replacement/catalog.
- [x] Add the approved seasonal tree variants and preserve existing palette/model compatibility.
- [x] Run editor suites and Chromium export/restore/walk/game smoke tests (78 unit tests pass; full canvas runtime suite not claimed).
- [ ] Review the exact change set; create an atomic commit through GitHub blobs/tree/ref with main HEAD lease.
- [ ] Verify remote bytes, Actions publication and live root editor/game assets; report Safari separately.

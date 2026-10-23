# SDD ledger — plan: docs/superpowers/plans/2026-10-24-settlement-map-editor.md
Baseline: main 74234d9d038a9c0b65fdda39fd4fe2a69e5abdc8; improvement plan commit bbdbf9ae39b93a899e34bba42dac4e49f7c630f8.
Execution: native, approved by user.
Ruling: use a scoped connector-backed workspace, not a synthetic local git repository — the authoritative improvement branch is remote and no checkout exists; local git task scripts do not apply. Cost: remote SHA/tree checks and ledger replace local git helper bookkeeping.
Pre-flight Task 1→2: model/schema and catalog are consumed directly by editor/render. Task 1→3: collision/path are the only walk rules. No interface conflict.
Ruling: bridge passages remain explicitly painted cells, not automatic sprite-derived passability. Cost: bridge placement requires marking passage cells.
Task 1: complete locally; node --test qa/settlement-map-editor.test.cjs → 12/12 PASS (initial missing-module RED observed).
Task 2/3: export and walk tests initially RED; core render/walk implementations now PASS. UI wiring pending.
Task 2/3: source implementation complete locally; combined feature suite 21/21 PASS, 0 failures. 25 PNG blobs uploaded with exact SHA checks, remote tree registration pending.
Ruling: commit Tasks 2 and 3 atomically — the editor directly uses walking modules; publishing them together avoids a broken intermediate entry point. Cost: less granular commit separation, separate tests remain.
Final review: fresh read-only reviewer, gpt-6-astra. Five Important findings plus multi-pointer Undo risk reproduced before fixes.
Final: fixed startup mutation lock and failed-save preservation — 2 wiring tests RED→GREEN.
Final: fixed free-standing exit selection/deletion — wiring regression RED→GREEN; entrance list and marker edits added.
Final: fixed building approach adjacency — model regression RED→GREEN. Marker movement translates its approach to retain adjacency.
Final: fixed native background clipping on resize — canvas landmark regression RED→GREEN.
Final: regraded multi-pointer stroke ownership as Important (mobile Undo loses part of the command); wiring regression RED→GREEN.
Final: minor (deferred): visibility/blur releases held keys but queued tap route resumes after return. No real browser scheduling check performed.
Final: tests now include editor wiring at a fake browser I/O boundary; these are unit tests, not actual browser QA.
Final declined-to-judge rulings: visual art/seams remain candidates, terrain warns that auto-tiling is unverified; actual browser/Safari and hidden-tab scheduling remain unverified; publication is a separate gate; game integration is intentionally outside scope. Cost: tool needs live-page/device testing before merge/use as a production guarantee.
Task 4: BLOCKED for publication/browser/device QA. Connector exposes no workflow_dispatch action. Local Playwright browser unavailable; official browser download failed. Cloud browser explicitly rejected file://; no workaround attempted.

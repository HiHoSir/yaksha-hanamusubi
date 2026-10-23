# SDD ledger — plan: docs/superpowers/plans/2026-10-24-settlement-map-editor.md
Baseline: main 74234d9d038a9c0b65fdda39fd4fe2a69e5abdc8; improvement plan commit bbdbf9ae39b93a899e34bba42dac4e49f7c630f8.
Execution: native, approved by user.
Ruling: use a scoped connector-backed workspace, not a synthetic local git repository — the authoritative improvement branch is remote and no checkout exists; local git task scripts do not apply. Cost: remote SHA/tree checks and ledger replace local git helper bookkeeping.
Pre-flight Task 1→2: model/schema and catalog are consumed directly by editor/render. Task 1→3: collision/path are the only walk rules. No interface conflict.
Ruling: bridge passages remain explicitly painted cells, not automatic sprite-derived passability. Cost: bridge placement requires marking passage cells.
Task 1: complete locally; node --test qa/settlement-map-editor.test.cjs → 12/12 PASS (initial missing-module RED observed).
Task 2/3: export and walk tests initially RED; core render/walk implementations now PASS. UI wiring pending.

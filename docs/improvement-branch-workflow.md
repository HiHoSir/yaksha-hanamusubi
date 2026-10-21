# Improvement branch workflow

Production branch: `main`. All improvement work starts from the current `main` HEAD on a dedicated `improve/<topic>` branch. Infrastructure changes use `chore/<topic>`.

## Isolation and approval
- Do not modify `main` while implementing an improvement. Do not merge without explicit user approval.
- One independently testable improvement per branch; limit changes to its relevant files.
- Record baseline SHA, changed paths, test results, and conflicts against current `main`.
- Before merging, compare against the latest `main`; resolve conflicts without force-updating either branch. Re-run affected tests.
- Existing production Pages and saved games must remain unaffected by preview/testing.
- Never claim that a branch commit is deployed to production.
- After approval, merge through a reviewed non-force update, obeying repository branch protection. On `main`, bump displayed BETA version and all HTML cache-busting versions in the same delivery as required by AGENTS.md.
- Validate Actions, Pages deployment, and iPhone Safari separately; only report checks actually performed.

## Preview policy
- Branch previews must not overwrite production Pages. Prefer isolated preview deployment with a distinct base path and distinct save-storage namespace.
- Do not expose protected or private assets on a public preview.
- Verify asset URLs, JS startup, save isolation, and access policy before distributing a preview link.
- If preview infrastructure is not yet configured, mark preview unavailable; do not invent a URL.

## Recommended branch names
- `improve/field-<task>`
- `improve/battle-<task>`
- `improve/ui-<task>`
- `improve/audio-<task>`

This workflow supersedes the previous default direct-to-main policy for improvement work. Asset production and GitHub delivery skills still apply.

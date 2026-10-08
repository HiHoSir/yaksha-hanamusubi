# 夜叉姫の花結び奇譚 — Project agent instructions

This repository contains reusable task skills in `.agents/skills/`. Read relevant SKILL.md files **before** coding, creating images or changing deployed assets.

## Skill registry
| Work | Skill |
| --- | --- |
| GitHub binary uploads, commits, CI, deployment | [github-artifact-delivery](.agents/skills/github-artifact-delivery/SKILL.md) |
| High-resolution enemy sprites (intact/worn) | [battle-enemy-hd-assets](.agents/skills/battle-enemy-hd-assets/SKILL.md) |
| Background removal and alpha/outline repair | [image-cutout-and-repair](.agents/skills/image-cutout-and-repair/SKILL.md) |
| Battle screen and mobile QA | [battle-debug-qa](.agents/skills/battle-debug-qa/SKILL.md) |
| Yaksha-hime battle poses and outfits | [yaksha-battle-sprites](.agents/skills/yaksha-battle-sprites/SKILL.md) |
| Field/mapchip artwork and terrain | [field-mapchip-art](.agents/skills/field-mapchip-art/SKILL.md) |
| Isolated private internal validation site | [sites-private-debug](.agents/skills/sites-private-debug/SKILL.md) |

## Standing rules
- Repository: `HiHoSir/yaksha-hanamusubi`, production branch `main`. Preserve existing save data, maps, controls and game-start flow.
- For any game asset task, read **github-artifact-delivery** and the relevant art/QA skill together. Do not automatically ask the user to upload files manually; verify the actual remote PNG and commit before declaring implementation complete.
- For battle-only work, do not modify heroine field movement sheets, world tiles or unrelated enemy graphics.
- Battle sprites are not constrained to 128×128px. Use optimized independent high-resolution assets where appropriate; field mapchips retain their own 32×32px rule.
- Preserve originals, verify transparency/edges and intact/worn anchoring, avoid improvised runtime alpha corrections and duplicate shadows.
- Perform battle debug and actual battle checks when feasible; distinguish source checks, code tests, deployment and iPhone Safari confirmation.
- For private Sites/ROM research, do not release protected source graphics on public GitHub Pages.
- Report verified facts and unresolved blockers precisely; a successful source-code commit does not mean generated binary assets were transferred.

## GitHub branch and artifact handoff
- This project normally commits **directly to `main`** using the connected GitHub tools. Do not assume a pull request is needed.
- GitHub `create_file` / `update_file` on main create actual remote commits. Verify the resulting SHA on main.
- For asset changes, reuse conversation-uploaded or already-generated files before asking for uploads. Never repeatedly delegate GitHub commit/push to the user.
- For binary PNG/ZIP integration, read [github-artifact-delivery](.agents/skills/github-artifact-delivery/SKILL.md) and verify actual remote bytes before claiming completion.

## GitHub connection preference
- Use the connected GitHub tools for repository operations and confirm changes on main.
- Local DNS issues do not prove the GitHub connector is unavailable.
- Verify binary files exist remotely before reporting successful asset deployment.

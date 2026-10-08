---
name: github-asset-delivery
description: Deliver generated game assets directly to HiHoSir/yaksha-hanamusubi, verify the change and report status without repeatedly asking the user to upload.
---

# GitHub asset delivery skill

## Established project facts
- Repository: `HiHoSir/yaksha-hanamusubi`, release branch: `main`.
- The GitHub connector has previously confirmed write permission. Never assume the user must upload files just because a previous assistant claimed so.
- Game: `夜叉姫の花結び奇譚`. Do not modify field character sprites when tasked with battle-only assets.
- Current HD enemy path: `assets/enemies/hd512/<stem>-<intact|worn>-512.png`.
- The 10 stems are `oni,tanuki,lantern_fox,crab,jelly,tree,spider,snake,falls,ninefox`.
- Keep the 128px fallback unless a tested migration explicitly retires it.

## Required workflow (do not skip steps)
1. **Check real capabilities each turn.** Discover currently available GitHub actions and their required arguments, check repository rights if needed. Do not assert write access is unavailable without checking.
2. **Locate source assets** in conversation files, project files and the working container; validate dimensions, RGBA and file count.
3. **Bridge binary bytes to GitHub** by choosing a *working* path:
   - If the tool runtime supports local binary file handoff to GitHub, use it.
   - Otherwise, if base64 can be supplied within tool limits, use `create_blob(encoding="base64")`, then `create_tree`, `create_commit`, and `update_ref` with an expected HEAD.
   - Alternatively use an authorized execution environment with GitHub network access to push using a valid available token (never print or commit the token).
   - A GitHub Action can generate/copy files already *inside the GitHub repository*; it **cannot read files in ChatGPT's isolated /mnt/data by itself**. Do not claim that a workflow alone uploads locally generated images.
   - Do not substitute an external public-hosting step without explicit authorization.
4. **Verify real repository objects**: fetch the actual uploaded PNGs (or tree entries), check size and dimensions; check commit SHA, Actions, then page deployment.
5. **Truthfully distinguish**: local asset generated; GitHub binary transferred; code integrated; CI passed; deployed; Safari tested.
6. **Only when every available transfer route is genuinely blocked**, explain precisely which bridge is unavailable and suggest the smallest possible user action **once**, rather than saying GitHub lacks write permission.
7. Avoid repeated calls asking the user to manually upload after their request to handle GitHub directly. Try the direct path first.

## Quality gates
- Preserve original files and save formats; modify only intended battle assets.
- Validate every image; inspect a transparency checkerboard and normal/worn consistency.
- Do not mark complete when only the loader code or an empty folder exists.
- Avoid runtime alpha patches for broken art; fix the source images.
- Never falsely claim tests, commits, or links exist. Provide exact verified commit and CI state.

## Current known limitation
The Code Mode GitHub connector accepts base64 image content, but local files under `/mnt/data` are not automatically shared with that connector's JavaScript isolate. Before asking for a user upload, search for a file-transfer-capable connector or handoff. Reconfirm this limitation on every new runtime rather than treating it as permanent.

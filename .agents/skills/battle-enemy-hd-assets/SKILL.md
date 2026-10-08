---
name: battle-enemy-hd-assets
description: Produce and integrate high-resolution enemy battle sprites, including intact and worn variants.
---
# Battle enemy HD assets
- Scope: battle sprites only; never change field sprites without a request.
- Prefer independent RGBA PNGs, typically 256–512px, not hardcoded 128px. Maintain source originals separately.
- Ten known rare stems: oni, tanuki, lantern_fox, crab, jelly, tree, spider, snake, falls, ninefox.
- Convention: `assets/enemies/hd512/<stem>-intact-512.png` and `<stem>-worn-512.png`.
- Both states must share canvas extent, visual scale and foot baseline. Do not substitute an intact sprite for a worn one without recording it as a temporary fallback.
- A baked-in contact shadow should not be duplicated by a runtime shadow. Never apply broad alpha normalization to repair broken art.
- Inspect actual RGBA values and checkerboard render, especially dark hair and outline edges.
- Build/validate files, transfer them to GitHub using github-artifact-delivery, then update loader; preserve legacy atlas fallback until new files are verified remotely.
- Validate all ten intact/worn pairs using battle-debug-qa and in a real battle. Record what was not tested. Preserve rollback.

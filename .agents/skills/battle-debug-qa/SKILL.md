---
name: battle-debug-qa
description: Verify battle enemy and heroine sprite appearance, rendering logic, and iPhone layout using BATTLE DEBUG.
---
# Battle debug QA
- Check BATTLE DEBUG first: normal enemy, each rare intact/worn pair, heroine outfits and each battle pose.
- Confirm the debug screen uses the *same source images and draw path* as production battle; otherwise correct instrumentation.
- Verify transparency on a high-contrast checkerboard, dark outlines, shadows, scale, foot anchors, clipping, damage transition, and image-load fallback.
- Measure source dimensions/alpha distribution separately from final canvas pixels; never infer correct visuals from alpha counts alone.
- Exercise actual battle start, attacks, broken clothing state, and battle end. Check touch layout and Safari behavior when tools allow.
- Run JS syntax and available regression/smoke tests after changes. Check CI and Pages separately.
- Report per-state PASS/FAIL/NOT TESTED; a passed Boot Smoke Test is not visual validation.
- Avoid broad changes to enemy rendering to repair a single sprite. Capture exact regression and revert if necessary.

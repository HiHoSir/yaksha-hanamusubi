---
name: yaksha-battle-sprites
description: Produce and validate Yaksha-hime battle-only outfit and pose sprites while preserving field sprites.
---
# Yaksha-hime battle sprites
- Scope: battle sprites ONLY. Field walking, movement and map assets are excluded unless explicitly requested.
- Outfits include normal and 星屑の姫君; preserve existing outfits and save compatibility.
- Pose inventory: idle, attack, hit, guard, skill, victory (check actual game identifiers before editing).
- Use independent high-resolution artwork when useful; preserve stylistic identity, consistent anatomy, outfit silhouette, facing direction and hand/finger count.
- Align identical foot anchor, head/body scale, and subject center across poses without forcing artificial equal bounding boxes.
- Record pose-to-file mapping and fallback; never replace working sprites with missing paths.
- Review each image on checkerboard, then verify every pose in BATTLE DEBUG and actual battle. Check iPhone Safari performance and memory.
- Keep sources and finished PNGs traceable. Use github-artifact-delivery for remote binary upload and verification.

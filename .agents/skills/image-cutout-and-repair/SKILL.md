---
name: image-cutout-and-repair
description: Safely extract character illustrations from backgrounds and diagnose transparency, edges, and baked shadows.
---
# Image cutout and repair
1. Inspect original source dimensions, mode, corners and alpha histogram *before* processing. Do not assume a black or gray background means true transparency.
2. For dark backgrounds, protect black hair, dark clothing and outlines; naive threshold-to-transparent and color-key removal are forbidden as final-quality solutions.
3. Make a tentative foreground mask using connected-background analysis or segmentation; review all edges at native size and on contrasting checkerboards. Keep original source untouched.
4. Separate shadow from character only when segmentation can be visually validated. If retaining a baked-in shadow, never add a duplicate runtime shadow.
5. Validate opaque body/outline regions, intentional translucent effects, holes, edge halos and connected components. Alpha statistics are diagnostic, not proof of correctness.
6. For intact/worn paired sprites, use a shared crop and foot anchor; do not nonuniformly stretch either sprite.
7. Resize with suitable resampling for illustrated art; for true pixel art use nearest-neighbor. Never silently mix both.
8. Produce original, mask, result, side-by-side and checkerboard previews; mark uncertain contours for review.
9. Implement only reviewed assets, inspect in BATTLE DEBUG and preserve rollback.

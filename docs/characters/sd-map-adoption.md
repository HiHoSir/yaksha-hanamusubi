# SD map presentation adoption — 2026-10-23

User decision: use the existing SD Hizuki consistently across exploration maps. Do not select a different body proportion merely because the area is field, village, shrine or interior. Battle illustration is a separate presentation and is outside this walking-art change.

Canonical walking source: `assets/characters/hizuki/field-sd-v1/walk-atlas-32.png`, 96×128px, 3 columns × 4 directions. Use the existing stable direction bounds and foot anchor. Its nominal visible height is 28px at renderer z=.56 before shared map projection, not the HD heroine's 58px. Preserve 32px movement, explicit occupied cells, saves, dialogue and camera transforms.

Implementation: remove the field-only condition in the common hero renderer; preload the existing SD atlas at startup; keep the approved HD fallback for loading failures and comparison. Test the actual hero function across 11 areas, 4 directions, 3 frames and 3 input scales, plus the loading fallback. No new image generation is required for this step.

NPC migration: existing village and shrine NPC illustrations are NOT SD replacements. Do not call shrinking those images an SD redesign. Inventory and compare them with the actual SD heroine before creating replacement art. Preserve role, appearance, direction, stationary/walking behavior and authored occupied cells.

Map/furniture migration: use actual SD height and 32px ground cells for proportions. Existing occupancy is not inferred from the sprite rectangle. Reuse art where its style remains suitable. The cyamise layout is a design candidate; its earlier 58px SD comparison is superseded and must be corrected before production approval.

Delivery status: isolated improvement branch; runtime renderer unit verification only. Production, Pages preview, actual browser movement/occlusion and iPhone Safari remain unverified until separately completed. NPC/terrain redesign is pending.

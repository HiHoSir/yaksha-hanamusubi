# Cyamise top-view walking candidate

Entry: `cyamise-walk-test.html`. Approved top-view concept is the new reference for this isolated preview; it is not integrated into the production teahouse. No production saves are read or written.

## Asset and layout contract
- Source: the accepted overhead tea-shop illustration generated2026-10-23. Runtime candidate: `assets/interiors/cyamise-v1/topview-preview.png`,384×320 PNG with preserved source aspect and nearest-neighbor resizing. Keep the previous scene-preview.png for comparison/history.
- Logical grid:12×10,32px cells, visual origin (11.5,3). SD heroine is28px high and its complete silhouette stays in one cell when stopped. Spawn (5,7); south entrance (5,8).
- Rear wall/equipment remain the north background band. Row2 columns1..9 are walkable directly in front of the equipment. Side walls remain mirrored around column5; south wall is blocked except the centered opening.
- Back benches: row3,2×1 contacts; tables: rows4..5,2×2 contacts; front benches: row6,2×1 contacts. Two groups at columns2..3 and7..8. The overhead reference shows broad table surfaces; this preview explicitly changes the earlier2×1 table contact to2×2 to match that approved visual design.
- Furniture contacts are authored integer cells, never inferred from image bounds. Visual clipping bounds are used only to fit the separate furniture sprites inside their explicitly declared surface cells.
- Floor patches and furniture silhouettes reuse the accepted source without another image generation. Cutout outlines and floor seams remain provisional art. The prototype uses no additional camera perspective.

## Verification
Local checks passed: declared contacts/bounds, left/right reflection, all legal cells reachable by cardinal steps, blocked furniture and south walls, actual input/reset/tap handlers with native Canvas rendering, all12 heroine alpha bounds inside a32px cell and stable boot line. Actual Chromium and iPhone Safari remain untested. Pages publication and exact live asset bytes must be verified independently.

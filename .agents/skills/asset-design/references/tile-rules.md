# Tile contracts
- Base cell: **32×32** pixels. Approved sheets: **128×128 / 4×4** cells; no labels, embedded grid or margins.
- View: top-down world-ground before the village camera projects it. Late-SFC-style hard pixels; no accidental blur.
- For a repeatable center tile, constrain left/right and upper/lower boundaries. Design true continuity before generating: plank direction, board seams, grain and lighting must line up.
- Check a 3×3 repeat and mixed 4×4 variant arrangement. An edge-pixel equality test alone does not guarantee visually natural repetition.
- Decorative multi-tile variants should share boundary structure but vary interior microtexture. Avoid prominent repeated knots.
- Multicell/autotile: spell out cells (center/edge/corner/T/cross) and allowed neighbors, check every required adjacency.
- Keep tiles independent of characters, shadows and furniture. World-floor walking state belongs to map metadata.
- Existing village road is authoritative for teahouse dirt floor; reuse `assets/terrain/landscape-v3/road.png`.
- Output acceptance: exact pixel dimensions, valid mode/palette, seam checks, native-scale preview, no extraneous pixels; only then import.

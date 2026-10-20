# Reference field composition — β16.0.110

The user's 2026-10-20 map is the composition reference. This replaces the sparse roadside scenery experiment with authored forest masses, mountain ridges, an inland lake, rivers and four bridges, using existing images. It is an approximation on the existing 80×80 world, not a pixel-identical reproduction.

## Destinations (32px movement cells)

| Place | Cell |
| --- | --- |
| 鬼灯の里 | 37,70 |
| 天妖の社 | 20,45 |
| 海の入り江 | 49,50 |
| 忘れの森 | 60,33 |
| 龍神の滝 | 67,20 |
| 月見の湯 | 22,17 |
| 九尾の祠 | 40,5 |

Four existing rest stops retain their IDs and facility types. Seven main destinations retain story IDs. Eleven route legs connect destinations, rest stops and the central valley. Bridges have explicit deck and water cells; bridge sprite bounds never grant passage through adjacent water.

## Existing art and placement

Uses field-map-objects-v3 trees, small/large mountains, village, shrine, torii and house; existing bridge, waterfall, jizo and village flower art. No new raster files are added. Forests contain 794 tree placements; mountain ridges contain 148 objects. Explicit integer contact and blocking cells are separate from image dimensions and depth anchors. Trees remain walkable. Large mountain images overhang their four blocked contact cells. Automatic procedural scenery is disabled only for this authored map, avoiding duplicate objects.

## Remaining art needs

| Need | Available material / gap |
| --- | --- |
| Northern snow mountains | Legacy landscape-v2/snowMountain.png exists; requires size/style/contact review before adoption with current v3 mountain set. |
| Brown exposed ranges | Current v3 mountain set is green; a compatible bare-rock variant is needed. |
| Cherry / conifer differentiation | Current tree group is reused. Old forest-tree-a/b/c candidates exist; no matching variants adopted in this composition. |
| Coastal cliff connections | Illustrated straight, corner and transition faces are needed; current shoreline relief is retained. |
| Harbor | Distinct pier/boat/harbor marker needed; current house and bridge assets are interim. |
| Hot spring and waterfall landmarks | Current house and 80×96 waterfall are reused; distinct hot-spring building and larger connected waterfall/cliff assembly remain needed. |

## Generation and verification

Use js/field-terrain.js from commit e60b7541c5c2beaf6af7bc8d739543fa390bf8aa as the baseline, then run `python3 tools/build-reference-field.py <baseline-file>` from the repository root. This bakes authored cells, routes and placements into js/field-terrain.js. Do not use the generated output itself as the baseline.

`node qa/reference-field.cjs` checks cell bounds, occupied-cell overlap, dry contacts, every destination/rest/guide, every 4px along all route segments with a 12px radius, save repair, and absence of duplicate scenery. `node qa/save-compat-unit.cjs` checks persistence and revision-108 field repair while retaining progress.

`node qa/reference-field-render.cjs <place-id>` uses @napi-rs/canvas and real production art/projection for a cropped visual check. Cropped views were inspected for forest, fox shrine, waterfall and hot spring. This harness does not draw the heroine and is not evidence of full-world browser performance or device QA. Full-world native canvas rendering exceeded the local process memory budget. iPhone Safari remains unverified.

Old field saves preserve valid positions; obstructed positions move to a nearby open cell. Inventory, quests and local-map positions are retained. Existing unrelated battle/interior test failures must be reported separately from field validation.


## Terrain fidelity audit — β16.0.111

Compared the user's 1312×1199 reference with the actual 80×80 baked terrain. The earlier coastline merged the northwest cliff island into the mainland, simplified the harbor inlet, omitted dry beach tiles, and left some new water cells carrying old land elevations. The inland lake was too tall and its eastern outlet was missing. Route waypoints also caused short repeated excursions.

Changes:
- Added a reviewed 80×80 sea-connected coast trace in tools/reference-coast-80.json, retaining the two-cell shallow-water fringe. Broad blue regions were classified from the reference and reviewed at map scale; the northwest island channel received explicit cell corrections because perspective cliffs merge when downsampled. This is a layout approximation, not a pixel-perfect or measured overall similarity score.
- Restored northwest-island separation and refined western/southeastern offshore islands and the harbor inlet. Added 286 dry beach cells selected from yellow reference shoreline regions. Reused existing sand artwork.
- Made the lake wider and shallower, retained its wooded island, and added the eastern outlet/basin. Existing walkable bridges and destination cells remain reachable.
- Removed repeated route excursions and the unnecessary southern-lake detour on the waterfall/hot-spring route. Forests recover in areas no longer cleared for redundant roads.
- Set water and bridge elevations to zero while preserving other authored height values. Kept camera and rendering scale unchanged.
- Incremented world revision to 111 and extended data-only save-position repair through prior revisions. Progress and inventory are retained.

Validation: explicit occupancy, 11 traversable route legs, all seven destinations, all rest stops/guides, separated reference islands, dry beaches, water elevations, loop-free route legs and save compatibility pass. Actual existing art was inspected with the production projection in cropped harbor and hot-spring renders. Full-world browser and iPhone Safari visual approval remain distinct and unverified by these cropped tests.

Remaining fidelity limits: 80×80 resolution simplifies narrow channels; current green mountain sprites cannot reproduce the reference's brown/snow ranges; illustrated coastal cliff faces, conifers/cherry trees and landmark-specific architecture remain art gaps. No new art was generated in this audit.

## Watercourse adjustment — β16.0.112

The channel centerlines now use four-neighbor connected movement cells instead of diagonal-only raster contacts. Central river reaches widen to two cells and narrow at existing bridge crossings. The eastern lake basin joins the lake through a continuous channel; its northern bridge now crosses water at its center. The estuary crossing runs horizontally underneath the north/south bridge instead of meeting one side diagonally.

Water is authored after destination clearings. The waterfall pool and outlet remain east of the dry visitor landing, so the plaza no longer erases the flow. The western tributary bends north of the shrine contact cells and joins the central river. Existing buildings, sprite sizes and destination points are retained.

Ground tile adjacency and shore relief both consult the water beneath bridge decks. Bridge decks remain walkable terrain for collision; the water-only visual layer never grants walking on neighboring river cells.

QA adds independent four-neighbor channel continuity, drainage to the ocean, wet bridge-center/upstream/downstream cells and retained route traversal. These checks and save migration through world revision 111 pass. Cropped production renders of the waterfall and estuary were inspected. No new image assets or camera changes. iPhone Safari device verification remains pending.


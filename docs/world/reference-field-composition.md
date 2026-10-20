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

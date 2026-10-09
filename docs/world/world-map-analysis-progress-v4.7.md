# World map analysis progress and east-candidate overlap v4.7

Date: 2026-10-09. Source: private 4096x4096 ROM reconstruction. No ROM image/contour is included here.

## Estimated progress (planning heuristic, NOT a measured completion percentage)
| Workstream | Progress estimate | Notes |
|---|---:|---|
| Six named geographic anchors | 100% | Confirmed with the user |
| Ocean/land color classification | 85% | Palette-based; false connections possible |
| Bridge/isthmus/strait classification | 60% | Local bridges inspected; full coverage incomplete |
| Whole-landmass topology | 55% | Bridge connections still mixed with land |
| Illustrated-map geometry QA | 45% | Discrepancies measured; illustration not approved |
| Added New Continent placement | 20% | Starting village precise coordinates needed |

Weighted heuristic: 15% x 100 + 20% x 85 + 25% x 60 + 20% x 55 + 15% x 45 + 5% x 20 = **65.75%, rounded to ~65%**. These weights are project management judgments, not image measurement or final production quality.

## New quantitative work: overlap of four east inspection windows
Window dimensions: 760x760 original-resolution pixels, centered at E05=(3210,1514), E06=(3784,1438), E07=(3512,1322), E08=(3712,1154).

| Pair | Intersection pixels (width x height) | Fraction of ONE inspection window |
|---|---|---:|
| E05 / E06 | 186 x 684 | 22.0% |
| E05 / E07 | 458 x 568 | 45.0% |
| E05 / E08 | 258 x 400 | 17.9% |
| E06 / E07 | 488 x 644 | 54.4% |
| E06 / E08 | 688 x 476 | 56.7% |
| E07 / E08 | 560 x 592 | 57.4% |

**Interpretation:** These numbers describe overlapping REVIEW AREAS, not overlapping bridge objects. Therefore neither the 4 candidate windows nor their number of detected pixel necks identifies the number of unique bridge crossings. v4.6 visually suggested at least three bank-pair crossings; endpoints and unique ID assignment remain to be verified.

## Next acceptance gate
1. Establish a private bank-pair registry for candidate crossings, naming north and south/east shores independently.
2. For each confirmed crossing, mark only bridge material in original-resolution private data and distinguish water and natural shore from the bridge footprint.
3. Recalculate a natural-ground-only connectivity graph and compare with the unedited mask. No broad square/circle deletion should be called "bridge removal".
4. Evaluate western/ eastern landmass outlines, Oni Island, Bamboo Island against fixed normalized positions and dimensions.
5. Fix New Continent location only after identifying Departure Village (旅立ちの村) coordinates.

Do not regenerate illustrative maps, add decorations, or alter live world/save code before geometry acceptance. No ROM-sourced maps, pixels, or traced coastlines in the public game.

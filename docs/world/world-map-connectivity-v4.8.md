# World geography bridge audit v4.8 — reproducible findings and gates

## Status: approximately 67% (management estimate only)
Prior status ~65%. This increase is a heuristic judgment reflecting expanded comparison and verification, NOT a coastline match score. The illustrated map still fails geometry acceptance.

## Dataset
Private ROM world map: 4096x4096; nearest-neighbor scale to 1024x1024. Four ocean colors excluded from a non-sea mask; 4-neighbor connectivity. Tests below delete small hypothetical squares near possible bridges; **these are NOT identified bridge pixels**. ROM imagery/masks stay private.

| Hypothetical areas removed | Width | NW–NE | NE–EastMid | EastMid–SE | Large components |
|---|---:|---|---|---|---:|
| None | any | joined | joined | joined | 13 |
| E05,E06,E07,E08 | 4px | joined | joined | joined | 14 |
| E05,E06,E07,E08 | 6px | joined | separate | joined | 15 |
| E05,E06,E07,E08 | 8px | joined | separate | joined | 15 |
| N01,E05,E06,E07,E08 | 6px | separate | separate | joined | 16 |

Anchors: NW(250,300), NE(840,220), EastMid(875,420), SE(750,740). Candidate cut centers: N01(572,134), E05(803,379), E06(946,360), E07(878,331), E08(928,289).

## Limits
Detection windows overlap; candidate count is not bridge count. Square cuts may erase natural ground. Non-sea color mask includes structures and decoration. **No conclusion about all-natural versus bridge-only East-side connectivity is yet justified.**

## Next acceptance gates
1. Identify the TWO banks and bank-pair ID of each bridge; deduplicate overlapping candidate windows.
2. Distinguish exact bridge material from shoreline and water using original-resolution private crops; mark uncertain areas as unverified.
3. Recompute a natural-ground-only connectivity graph, excluding only verified bridge materials.
4. Quantify center/extent errors for Oni and Bamboo islands and then western/eastern mainland outlines.
5. Locate Departure Village precisely before deciding New Continent ocean position.

Do NOT generate another watercolor image before geographic coastline acceptance. Do not publish ROM map pixels/contours/tiles. Preserve existing 80x80 playable New Continent, game logic and saved data.

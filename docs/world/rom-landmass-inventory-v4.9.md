# ROM geographic component inventory v4.9

## Purpose
Establish measured reference areas for source geography rather than creating speculative coastlines. **Private** reference image: world_map_4096.png (4096×4096). Working map: 1024×1024 by nearest-neighbor downscale. Water is identified only by exact known RGB values (16,90,98), (24,115,123), (32,139,148), (8,65,74). All other pixels are classified as *non-sea*, **NOT guaranteed natural ground or walkable land**. 4-neighbor connected components.

## Reference inventory (working-map coordinates)
| Component | Area pixels | Bounding box x,y,width,height | Centroid x,y | Interpretation |
|---|---:|---|---|---|
| Largest non-sea component | 307820 | 31,87,942,831 | 561.7,413.8 | NW+NE+EastMid+SE anchors together; includes pixel crossings or constructed bridges |
| Southwest long landmass | 51060 | 67,511,250,467 | 187.9,719.3 | southwest extended landmass |
| Bamboo Island | 16727 | 419,659,186,165 | 514.7,747.9 | Love and Courage |
| Oni Island | 2871 | 483,467,58,61 | 511.2,500.5 | Onigashima |
| Other medium region | 1675 | 267,511,54,63 | 294.8,535.9 | not yet geographically named |
| Southernmost east islet | 599 | 951,963,30,27 | 965.4,976.1 | unassigned |
| Northwest small islet | 520 | 275,123,30,31 | 288.1,135.0 | unassigned |
| Northern small islet | 334 | 631,3,22,23 | 642.3,13.3 | unassigned |

Sea occupies approximately 63.50% of working image. 13 non-sea connected components have area at least 100 pixels.

## Anchor labels from component mask
- NW=(250,300): large component
- NE=(840,220): same large component
- EastMid=(875,420): same large component
- SE=(750,740): same large component
- SW=(150,750): southwest component
- Bamboo=(510,745): Bamboo Island component
- Oni=(510,500): Oni Island component

## Geographic acceptance gates
1. Preserve independently measured island sizes and relative locations as *reference constraints*, not pixel-exact templates for public artwork.
2. Identify bridge-pixel regions and separate them from the natural shoreline classification. Do not infer that NW/NE/EastMid/SE are freely walkable as one continent.
3. Verify narrow shoreline/isthmus connections using full-resolution image. Record unknowns explicitly.
4. Fix port and New Continent location after the departure village position has been confirmed.
5. Public art must be original; no ROM image, extracted coastline, contour masks, or tile graphics are to be committed to public GitHub. Keep existing 80×80 New Continent world, story, and save migration unchanged.

## Current status
Landmass inventory: **PASS as a reproducible measurement**. Natural landmass connectivity: **PENDING**. Existing illustrative map coastline: **FAIL**. This is not a completion of the world-map design.

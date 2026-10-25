# Native-grid Shirotae front study

**Design study only, not adopted or used by the game.**

The image generator's output did not follow an exact32×32 grid, so that output
is not used as this sprite's source. This study is authored directly as32×32
palette cells in `scripts/draw-shirotae-native-grid.py`. No face is transplanted
from Hizuki or another candidate. The16-color RGBA palette and all native cells
are preserved in `native-pixels.json`, including the integer centering offset.

- `shirotae-32.png`: native32×32 RGBA artwork, <=28px visible.
- `shirotae-source-512.png`: exact16× nearest enlargement. Every16×16 block
  contains one solid RGBA color.
- `shirotae-review.png`: native size above and16× below, on a preview backdrop.

Build: `python scripts/draw-shirotae-native-grid.py`.
The build checks all1024 blocks for uniform color and compares complete RGBA
bytes after512→32 reduction. This verifies pixel preservation, not artistic
approval. Guardian and other directions are not part of this front study.

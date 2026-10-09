# ROM bridge sensitivity v4.4

Internal analytical notes only. No ROM images or map assets are included.

Using 1024-square nearest-neighbor preview of world_map_4096.png, four known ocean palette colors, 4-connected non-sea mask, and separate 6x6-pixel hypothetical deletions at candidate positions:

| Site | (x,y) | Components >=100px | Largest area | NW/NE/SE connectivity |
|---|---|---:|---:|---|
| Baseline | - | 13 | 307820 | together |
| N01 | (572,134) | 14 | 159086 | NW separated from NE/SE |
| E01 | (734,555) | 13 | 307784 | together |
| E02 | (825,841) | 13 | 307784 | together |
| E05 | (803,379) | 13 | 307791 | together |
| E06 | (946,360) | 14 | 305971 | together; a smaller component split |
| E07 | (878,331) | 13 | 307787 | together |
| E08 | (928,289) | 13 | 307801 | together |

**Scope:** This removes small square patches, not accurately identified bridge pixels. Thus the test measures sensitivity, not natural land connectivity. NW, NE, SE anchor points were (250,300), (840,220), (750,740). The SW, Bamboo and Oni anchor components remained separate in all tested cases.

**Conclusion:** Only N01 separates the major western and eastern non-sea clusters under this test. E06 changes total component count but does not sever the major east group. Original-resolution local terrain identification is still required before external geography is finalized. Do not redraw the map from guesses, re-generate illustrations, transfer ROM pixels to the public game, or modify the existing game/save.

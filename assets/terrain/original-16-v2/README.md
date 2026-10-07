# Original 16px terrain v2

Original generated artwork, not ROM-extracted graphics. Only the role grammar comes from the supplied analysis: four 16px quadrants per 32px cell, nine forest roles, and ridge/core/foot mountain bands.

- grass.png: 16×16, quiet base without scattered blades.
- forest.png: 48×48, 3×3 roles ordered spatially.
- mountain.png: 64×48, four columns (left cap, middle-left, middle-right, right cap), three rows (ridge, core, foot).

The generated original sheet was cropped by semantic band rather than equal-height cutting: mountain ridge y=0..319, core y=356..451, foot y=480..599 of the selected 1254px master. Each band is nearest-neighbor sampled to 64×16. Forest is sampled to 48×48. A shared 16-color palette is used without dithering. These are provisional game-resolution assets, not claims of native 16px AI generation.

Used in the beta's DEBUG MAP only. The main world retains its current terrain pending visual review. The four-neighbor forest scheme cannot draw diagonal inner corners. Large mountain faces still have regular repeated vertical patterns; this version removes repeated peaks inside those faces but does not claim final art quality.

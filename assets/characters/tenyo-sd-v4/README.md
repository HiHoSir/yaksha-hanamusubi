# Tenyo SD face review

Unapproved front review only. Runtime NPCs remain unchanged.

The face-edit source retains the same two characters and is sampled into the
existing native sprites. Only authored face regions are retained, followed by
native-pixel cleanup of skin, eye whites/iris, eyebrows, closed mouth and facial
hair. Head silhouette, hair perimeter, clothing, hands, feet, body proportions,
visible bounds and alpha are byte-identical to revision3.

Shirotae uses a calm closed mouth with warm brown pupils and distinct skin/white
colors. Guardian separates brows from eyes by skin, and retains small separated
moustache/mouth clusters. Eyes have matched white/pupil locations at rows15/16.
Both retain32×32 cells, <=28px visible and <=16 opaque colors.

`scripts/build-tenyo-face-review.py EDIT_SOURCE` rebuilds the PNGs and asserts
that all changed pixels stay inside each authored face region, alpha stays
unchanged, eye samples mirror and palettes stay within16 colors. The manifest
lists every changed native pixel and the source hash. Neither4 directions nor
game integration is included in this review candidate.

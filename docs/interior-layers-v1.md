# Interior layers pilot: armory counter

The approved original image remains unchanged. `armory-clean.webp` is a counter-removal clean plate made with the built-in imagegen tool, at the original 1536 x 1024 size. The prompt removed only the central counter and its lamp, book and tray, continuing the wood floor, step and earth.

Only the polygon occupied by the counter is sampled from the clean plate. The same polygon samples the **original** image for the depth-sorted foreground object. All layers use the exact mapping x/2, y/2+128, so recomposition without actors reproduces the original. No runtime color-key/alpha removal.

The counter footprint is [249,340,520,370] in room coordinates. Visual depth is 370; the top/lamp silhouette does not block walking. Actor sort uses interpolated foot y. The merchant stands at [384,312]. Left/right approaches remain open. If either image is not ready, the original single background remains visible.

This pilot separates only the central armory counter. Wall displays, side armor, entrance posts and other rooms retain their prior rendering and collision geometry. Extend via objects/footprints after visual approval. Source art is preserved in design-reference/interiors/base-v1/armory.png.

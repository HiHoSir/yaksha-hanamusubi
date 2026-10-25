# Exterior shrine props

The exterior map tool (`settlement-map-editor.html`) reuses the village catalog,
placement, depth sorting, collision, and JSON format. Its existing save key is
retained, so renaming the UI does not discard maps.

| ID | Artwork | Contact cells relative to front-left anchor | Source |
| --- | --- | --- | --- |
| torii | 96×96, 3×3 visual cells | (0,0), (2,0); center remains open | shrine-v1/torii.png |
| temizu | 32×32 per frame, two vertical frames | (0,0) | shrine-v1/temizu.png |
| stone_lantern | existing 32×32 PNG, visible crop (8,1,17,30) | (0,0) | interior-editor/completion-v1/stone_lantern.png |

The new torii and basin were generated using the actual village shrine and
komainu as style references. `scripts/build-shrine-exterior-assets.py` trims
source alpha, keeps aspect ratio, normalizes to the declared dimensions and
hard alpha, and makes the basin's second water frame. Only blue water pixels
change; stone, dipper, alpha, contact and collision remain fixed. Static PNG
exports always select frame zero. The generated alternate lantern is not used;
the existing approved stone lantern is shared without changing its source.

The torii is one depth-sorted arch object, with transparent central passage;
its visible rectangle does not imply a blocked 3×3 footprint. No destination
or teleport marker is automatically attached to it.

This change adds editor assets. It does not yet replace the playable Tenyo map.
Preview branch: `improve/exterior-shrine-tiles`, baseline `bc4c9be`.

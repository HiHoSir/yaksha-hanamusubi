---
name: field-mapchip-art
description: Build late-SFC Japanese RPG field tiles and environmental assets with reliable adjacency.
---
# Field mapchip art
- This skill applies to mapchips, NOT to high-resolution battle sprites. Current base tile size is 32×32px.
- Visual direction: late-SFC-style pixel art, no blur/anti-aliasing, coherent pseudo-quarter-view.
- Lighting from upper left; shadows lower right. Mountains, forests, settlements show a little front and top face.
- Prefer bright restrained green flats, low visual noise, subtle tile variation; roads are optional and minimal.
- Ensure obvious grass/forest/mountain/sea/snow/barren borders at playing zoom.
- Design tile roles and adjacency first; never accept isolated nice tiles with bad seams, missing corners, or visibly repeating artifacts.
- Validate grid dimensions, actual 32px resolution, transparency requirements, tile index mapping, and layer ordering.
- Inspect assembled debug map, full field and iPhone screen scale. Preserve passability, camera, 8-direction movement and save migration.
- Do not copy ROM-derived assets into the public release; use original artwork.

# Reusable elevation prototype — β16.0.115

Open `elevation-lab.html` (also linked from main game Settings → development checks).

This is an isolated playable verification map, not a terrain migration of the main
world. Existing routes and saved positions need a full height-aware audit before
worldwide activation. It does not access localStorage or alter a save.

## Shared data

`YK_ELEVATION` accepts the existing row-based 32px terrain array, plus `heights`
(integer base levels), `ramps` (`n/s/e/w`, one level rise toward that direction),
and `occupiedTiles` (explicit authored integer cells). Ground material does not
determine height. Adjacent tiles connect only when both endpoints and midpoint
of their shared elevation edge match. Water and occupied object cells block.
The same sampler positions terrain, road, actor feet and object anchors.

`YK_ELEVATION_VIEW` uses production `YK_LANDSCAPE.project/unproject`, the approved
32px field heroine and existing original terrain/object PNGs. Surfaces follow
height; exposed neighbor edges create textured cliff faces. North/south ramps
use perspective strips, east/west slopes use textured triangles. Wall bands
repeat the selected material. Draw order uses world depth, including actors and
wall segments. No collision is inferred from sprite bounds or alpha.

Ground (grass/sand/snow), face texture (rock/sand/snow), and visual level rise
(16/20/28px) can be changed independently. The fixture includes two northward
ramps, a westward ramp, two terraces, a concave boundary, a tree and a shrine.
The automatic round trip uses the same connectivity function as manual movement.
Animation samples continuous height during each 32px/192ms stride.

## Asset contract / limitations

- No new image generation, binary files or production asset replacements.
- Existing ground tiles retain world-space texture phase. Roads share the slope.
- Existing rock/soil/snow textures are provisional face materials, not finished
  connected cliff artwork. Dedicated rim/middle/base/corner art is still needed.
- Material bands deliberately use hard boundaries for comparison; this prototype
  does not yet blend grass/sand/snow with production autotile masks.
- Fixed forward-facing production field camera; yaw and stacked walkable bridges
  are outside this height-field prototype. One surface per world x/y coordinate.
- World deployment still needs route/entrance migration, coastal material joins,
  camera performance testing on device and iPhone Safari verification.

## Verification

`node qa/elevation.cjs`: grass/sand/snow/mixed topology, terrace access and return,
blocked cliff/ramp sides, water/object occupancy, all four ramp orientations and
invalid ramp endpoints. `node qa/elevation-render.cjs`: four material scenes with
the production camera and heroine for visual inspection. Browser interaction and
deployment are checked separately from these local tests; no iPhone-device pass
is implied.

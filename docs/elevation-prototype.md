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


## Diagonal corners — β16.0.116

The corner selector compares 0px, 8px (default) and 12px cuts on the same map.
`outline` supplies one retained-top polygon and removed-corner triangles. The
renderer shortens straight faces and inserts diagonal walls from those exact
vertices; lower ground fills the removed area. The grid option marks removed
triangles red. Ground material and cliff material remain independent.

Removed triangles, diagonal boundaries and a 2px foot clearance are blocked from
both elevations. `pointWalkable` checks adjacent cells at exact grid edges, and
`canMove` samples the complete stride. Manual input and automatic routing both
use it. Only convex corners with equal lower neighbors are cut; ramps, corners
adjoining ramps, concave corners and unequal lower joins retain square geometry.

Run `node qa/elevation-corners.cjs` in addition to the existing tests. It covers
all four corner directions, three ground materials, 8/12px cuts, forbidden entry
from high/low ground, exact boundaries, retained tops and all fixture routes.
Reusable instructions are in `.agents/skills/terrain-elevation/SKILL.md` and the
root `AGENTS.md` registry. These changes remain isolated to the elevation lab.

## Bolder silhouette — β16.0.117
Default corner cut is now 24px (3/4 cell), alongside 0/8/12px comparisons.
Adjacent eligible corners sharing an edge are capped at 15px each to prevent
overlap and preserve a 2px straight segment. The same effective width drives
the top, wall, lower triangle and forbidden region. Full route checks remain
required because a wide cut can close a cell-edge midpoint.

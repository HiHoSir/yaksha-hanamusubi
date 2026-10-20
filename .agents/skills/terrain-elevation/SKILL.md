---
name: terrain-elevation
description: Build or revise material-independent terrain heights, ramps, cliff faces and diagonal clipped corners in HiHoSir/yaksha-hanamusubi. Use for 高低差, 段丘, 坂, 斜めの崖, corner smoothing, terrain collision or elevation-prototype integration, including cross-chat handoffs.
---
# Terrain elevation and clipped cliff corners

## Read the actual implementation first
- Read root `AGENTS.md`, `.agents/skills/field-mapchip-art/SKILL.md`, and `.agents/skills/github-artifact-delivery/SKILL.md`.
- Fetch current `main` before editing. Inspect `js/elevation-model.js`, `js/elevation-view.js`, `js/elevation-lab.js` and `docs/elevation-prototype.md`. Treat this skill as the contract; consult current code for details and version numbers.
- Open `elevation-lab.html` for a playable comparison. The prototype is not yet the main world's height renderer. Do not claim world-wide integration from a demo or a successful deployment.

## Preserve the data contract
- Keep 1 movement cell = 32 world pixels. Store ground material, integer base height, ramp direction, cliff material and corner cut independently.
- Use one model for geometry and movement: `level` for authored top vertices; `height` for the actual surface; `outline` for the retained top polygon and removed triangles; `pointWalkable` for feet; `canMove` for a full stride. Use `canMove` for both player input and route planning.
- Retain explicit integer object `occupiedTiles`. Do not derive object occupancy from sprite size, alpha, the terrain polygon or rounded pixel footprints.
- Apply the same height and production camera projection to ground, roads, objects and feet. Preserve the approved field heroine's scale and atlas anchoring.
- Permit a ramp only when both shared-edge endpoints and midpoint agree with neighboring heights. Check all four orientations. Do not permit stepping up a cliff or across a ramp's disconnected side.

## Author diagonal corners
- Default to a 30px cut: its right triangle removes 450/1024 = 43.95% of a tile, matching the requested roughly 45% area. Retain 0/8/12/24px comparisons. When two eligible corners share a tile edge, cap both at 15px so cuts do not overlap and a 2px straight segment survives. Recheck actual cell-center routes with collision; do not assume every edge remains traversable.
- Detect convex corners from height topology, independent of ground material. In the present implementation, cut only flat tiles with two equally low orthogonal neighbors and a diagonal no higher than that lower floor.
- Keep ramp tiles and corners adjoining ramps square. Keep unequal lower floors and concave corners square until a separately validated join is implemented; do not quietly create an unsupported join.
- Generate the top polygon, shortened straight cliff edges, diagonal wall and exposed lower triangle from the same corner endpoints. Never mask just the top while leaving a square wall or an empty hole underneath.
- Treat the removed triangle and its diagonal boundary as NON-WALKABLE from either elevation. Retain a 2px foot clearance. Check adjoining cells at exact 32px boundaries so an endpoint cannot become walkable through floor division.
- Check every movement segment, not only its destination, to prevent crossing a forbidden wedge. Reject blocked strides atomically. Do not repair this by moving the actor after rendering.
- Preserve each tile's texture phase when clipping. Use neighboring lower-surface material for exposed cut ground and independently chosen material for the cliff. Reuse existing assets; label provisional cliff textures as provisional.
- Subdivide wall segments by world depth for actor occlusion. Split tall walls into repeatable height bands. Do not sort by raised screen y alone.

## Verify and deliver
Run from the repository root:

```sh
node qa/elevation.cjs
node qa/elevation-corners.cjs
node qa/elevation-render.cjs
```

- Inspect straight versus cut corners, all four corner orientations, all material choices, 8/12/24/30px cuts, raised object feet and the automatic ramp round trip.
- Test entry from both higher and lower ground, exact grid endpoints, retained walkable tops, water/object occupancy, and unchanged entry/return routes. Rendered appearance and collision tests are separate gates.
- Check the live page: corner selector, material selectors, grid/forbidden overlays, manual movement and automatic round trip. Report iPhone Safari separately; never infer a device pass from desktop Chrome.
- Before applying to the main field, audit existing height data, every destination approach, ramp placement, saved positions and performance. Until then, state explicitly that this is a prototype.
- Bump visible BETA and all index asset cache versions in the same main commit, preserve unrelated concurrent changes, and verify Pages. Use the repository's proven GitHub binary skill if adding images; do not generate artwork to solve a geometry bug.
- Keep this skill and its `AGENTS.md` entry committed together so another chat can discover the rules without conversation history.

---
name: interior-occlusion-layers
description: Preserve approved room artwork while separating floor, depth-sorted objects and floor-only collision footprints. Use for interior layer separation, counter or pillar occlusion, walking behind furniture, or reusing the yaksha armory prototype in another chat.
---

# Interior layers with fixed alignment

## Start from the approved composition

- Read AGENTS.md and inspect the actual current source image and renderer before editing.
- Keep the approved artwork, camera, character scale, movement controls and save format. Do not regenerate a whole room or unrelated objects to add occlusion.
- Start with one isolated object, such as a sales counter. Confirm the result visually before expanding to the entire room.
- Preserve the original asset. Reuse it for the foreground, so shape, decoration, color and placement cannot drift independently.

## Separate three kinds of data

1. **Clean background**: floor/wall behind the object, including previously hidden areas.
2. **Visual silhouette**: full object outline including top, lamp, book and other attached props. Use a real alpha layer or an explicit polygon clip sampling the original image.
3. **Floor footprint and depth anchor**: occupied floor area and front contact edge. Do not derive these from the visual bounding rectangle or opaque pixel extent.

Keep these geometries independent. A tall lamp affects occlusion but does not create a tall impassable floor area. Account for character foot radius in one place only, if the engine uses one.

## Create and composite the clean background

- Use the image-generation/editing tool only to reconstruct missing floor behind the chosen object; ask to remove that object and its attached props while preserving framing, dimensions, lighting and nearby structures.
- Treat generated pixels outside the required repair area as untrusted, even if the prompt says to preserve them.
- Preserve the exact source canvas size and the same coordinate transform for every layer. Do not independently crop, recenter, resize or perspective-warp foreground and background.
- For the pilot, draw the original background first, replace only the object's silhouette with the clean plate, then insert the original-image foreground silhouette into the actor depth queue.
- For a reusable fully separated scene, export floor and foreground assets with their original canvas origin (or explicit crop offsets). Preserve the same transform and verify recomposition.
- Do not use color-key transparency, rectangular cutouts around irregular shapes, or runtime alpha fixes to conceal bad art. Inspect contour edges, prop gaps and corners at native size.
- A polygon can include small background slivers that wrongly hide an actor. Check the outline against a contrasting actor/test marker and refine it when visible.
- Avoid duplicate shadows. Keep a floor shadow in the background rather than depth-sorting it with a tall object when possible.

## Render and collide

- Sort actors and objects in one queue by world-space foot/contact depth; include NPCs.
- Use the actor's interpolated **rendered** foot position during movement, not the final destination cell, or sorting will jump at the start of a stride.
- Draw an actor behind the object when its foot is beyond the contact edge; draw it in front when nearer the camera. Maintain deterministic ties.
- Leave the silhouette's upper area walkable; block only the footprint. Validate routes around both sides and behind it, including NPC access and interactions.
- Reuse whole-stride collision preflight to prevent half-step stops or crossing thin footprints. Keep existing recovery for old saves inside blockers.
- Split long walls, L-shaped furniture or intersecting objects into coherent depth segments when one anchor is insufficient. Do not assume a single y-sort solves intersecting geometry.
- Fall back to the original scene until all required layers are loaded; do not display a missing counter or a blank room during loading.

## Verify before reporting completion

- Recompose background plus objects without actors and compare with the original. Check seams, halos, duplicated props and shifts; quantify interior pixels separately from antialiased boundary pixels.
- Inspect real character screenshots behind, in front, beside and during a crossing near the object. Ensure the NPC's face/upper body is visible naturally.
- Test depth order with a solid contrasting marker rendered through the production actor queue. Verify that it is hidden behind and visible in front/at the side.
- Test an unobstructed visual-top point and a blocked floor point. Test actual movement that stops a whole stride at the footprint and passes beside it.
- Confirm all affected door routes, return exits, NPC dialogue and shop/inn operations.
- In browser tests, enter/load the village before waiting for settlement readiness. Update old interaction coordinates after changing placement; do not weaken interaction assertions.
- Distinguish native-canvas checks, Chromium checks, deployment and iPhone Safari visual confirmation. Never call unperformed Safari tests passed.
- Upload via skills/github-image-atlas/SKILL.md; verify actual binary blobs, cache version, CI and Pages. Preserve concurrent main changes.

## Yaksha reference implementation

Repository: HiHoSir/yaksha-hanamusubi. Paths are repository-relative.

- Original: design-reference/interiors/base-v1/armory.png
- Original runtime image: assets/interiors/base-v1/armory.webp
- Clean plate: assets/interiors/layers-v1/armory-clean.webp
- Geometry, background patch and object rendering: js/interior-base.js
- Actor/object queue: drawActorsOn in js/game.js
- Acceptance checks: qa/interior-base.cjs
- Scope and source notes: docs/interior-layers-v1.md

The 1536x1024 source maps to room coordinates with x'=x/2, y'=128+y/2. The central counter has footprint [249,340,520,370] and depth anchor 370. These are room-specific measured values, not defaults for other furniture. The initial pilot separates only this counter; other objects/rooms are not yet layered.

# Destination illustrations / β16.0.114

Six temporary single-background illustrations replace primitive backgrounds in shrine, cove, forest, waterfall, fox and hotspring. Village and approved interiors are unchanged. Sources were generated separately with built-in image_gen; prompts are in destination-scenes-v1-prompts.json. Runtime exports are opaque 768×768 WebP, loaded on first visit; original backgrounds remain as loading/error fallback. The originals remain in the generated-image collection. These are scene concepts, not reusable 32px mapchips or layered architecture.

Hand-authored local-coordinate walk polygons keep actors off water and buildings, with west exit corridors. NPCs, chests, dialogue and quest coordinates are unchanged. Entry coordinates follow the new artwork; old saves inside blocked scenery return to the location entrance. These illustrations have no foreground occlusion: the blocked backdrop cannot be entered. No save-format changes.

The field repeats its existing 64px sea texture in projected world coordinates across the visible space beyond map bounds. This does not expand walkable terrain, change map geometry, or allocate a padded world-sized canvas. Field-only option; village/interior projection is unchanged. Clipped ground strips keep their actual vertical placement at the map edge.

## Prioritized missing field assets (proposals, not generated/approved)

| Priority | Asset | Proposed production contract | Purpose |
|---|---|---|---|
| 1 | Coastal cliff straight, outer/inner corners, end pieces | 32px cells, explicit connecting pieces, transparent cliff overlays | Raised coast and offshore islands matching the reference |
| 1 | Brown rocky and snow-capped mountain variants | Match existing 128×64 mountain sprite; authored occupiedTiles independent of image | Differentiate southern ridges and northern snow range |
| 2 | Cherry trees and conifer groups | RGBA sprites, separate 32px-grid contact occupancy and foot anchors | Shrine blossoms and forest variety |
| 2 | Pier straight/end/corner, small moored boat | Pier 32px connection cells; boat independent RGBA object | Cove identity; explicit pier traversal and boat blocking |
| 3 | Hot-spring inn, steam, bath perimeter | Separate architecture/decoration layers with authored contacts | Recognizable field landmark |
| 3 | Large waterfall top/drop/pool/cliff joins | Connected 32px assembly with separate water and cliff layers | Reference's northeastern waterfall |

Existing ocean/grass/road tiles, bridges and shrine/torii sprites should be reused. Each new tile set still needs connection/repetition checks and each object needs explicit occupiedTiles before production adoption.

## Validation

- Six exports decoded at 768×768; source artwork inspected; production heroine atlas composited at its existing 58px height for scale/entrance review.
- All six entrance/exit routes, NPC and chest approaches pass collision flood-fill tests.
- Four map corners retain opaque textured ocean beyond bounds; rendered corner sheet visually inspected.
- Existing reference-field, movement, camera interpolation and save compatibility tests pass.
- Live browser interaction and iPhone Safari device validation are not covered by these local checks.

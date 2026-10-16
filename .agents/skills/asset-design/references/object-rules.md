# Floor decorations, furniture and architecture
## Walkable floor decoration
- Examples: green zabuton 1×1 (32×32), low horizontal stepping stone 2×1 (64×32).
- True-alpha PNG, trimmed visible shape + explicit placement origin. Top-down, low profile, no forced furniture perspective.
- Bake into ground canvas before village projection; keep the source RGBA asset for reuse.
- Normally walkable; elevation/step transition specified separately. No actor-depth sort/occlusion.

## Furniture
- Teahouse table: exactly **2×1 cells** of blocked contact (64×32 ground world). Rendering can exceed contact for height only when defined explicitly.
- True alpha, trimmed source and explicit anchor, believable village-camera viewing angle, no heavy double-applied perspective.
- Same actor/object depth queue, collisions from footprint only, soft contact shadow separately.
- Tea set should remain legible at 64px; remove busy decorative details that become noise.

## Architecture
- Pillar and wall: base/contact + continuous middle + upper dark ceiling connection, ideally separate alpha images with consistent offsets.
- One tile is a placement unit, not a ceiling height limit. Avoid exposed top faces of freestanding posts.
- Wall connection roles: center, left end, right end, internal/external corners, doorway jambs.
- Test seam continuity and depth with actual game protagonist, including behind/front and lateral movement.
- Upper-dark layer must not obscure more of the character than necessary.

## Rules common to objects
- Distinguish sprite bounds, visible silhouette, world foot, occupancy/collision and occlusion.
- Reuse approved candidates before generating. Confirm exact scale via scene preview using current native hero, not made-up silhouettes.
- If required source transparency cannot be obtained reliably by generation, treat source as a reference; perform deterministic cutout/alpha work where possible without spending another image call.

## Upper-wall fade convention (adopted prototype)
- For interior plaster walls, reuse the same plaster source on the top band and middle band. Overlay a black-to-transparent mask **only on the top band**; no mask on middle plaster or wood wainscot.
- Source of truth for ratios and reference behavior: `skills/interior-occlusion-layers/SKILL.md`, section `Adopted upper-wall fade convention`; generic helper `js/interior-wall-shade.js`.
- This visual effect is a render-time mask, not a new generated tile; do not use image generation for this effect.

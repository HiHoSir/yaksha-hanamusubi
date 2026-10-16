---
name: asset-design
description: Preflight, author and deliver 32px game tiles, walkable floor decorations, furniture and architecture for yaksha-hanamusubi while minimizing image-generation attempts. Invoke explicitly as $asset-design in compatible coding agents; in ChatGPT ask to follow asset-design.
---
# Asset Design — generation-first quality and cost discipline

## Mandatory entry gate — before calling any image generator
1. **Read** repository `AGENTS.md`, this SKILL.md, the category-specific skill and approved source assets. If inaccessible, say so; DO NOT pretend to have read them.
2. Classify the request as **repeatable tile**, **walkable floor decoration**, **independent furniture**, or **3-part architecture**. Choose the matching template in `templates/` and rules in `references/`.
3. Define an **asset contract** with: type, approved reference, width×height in 32px cells, exact intended rendered footprint, viewing angle, alpha, tile connection needs, contact/collision, foot-depth anchor and required output paths.
4. Inventory approved/previously generated candidates first. If crop/resize/alpha correction/recombination can solve the problem, **DO NOT GENERATE**. Use deterministic editing.
5. Before image generation, create one constrained prompt using the appropriate template. **Check the prompt against all contract fields**. Exclude presentation sheets, surrounding scenery, shadows outside requested contact and extraneous versions. Only then call the generator, once for the actual asset. Never generate a “test picture” just to discover requirements already known.
6. After generation, apply deterministic postprocessing to ensure dimensions and alpha, and inspect visual style. If unsuitable, repair/edit first. **Do not auto-regenerate** after failure; identify whether another generation is necessary and explain why.
7. Execute `scripts/validate_assets.py` for file-level checks. A postflight failure is *not* an acceptable substitute for doing the preflight correctly.
8. Only say **completed** after the artifact passes QA and is genuinely integrated/deployed where requested. State separately what was generated, verified, uploaded and visually tested.

## Decision rule
- **Assets already approved or plausibly reusable?** Reuse or edit; skip generation.
- **Prompt cannot specify exact cell footprint, viewpoint, transparency or connections?** Stop and resolve before generation.
- **Procedural pixel tiling or deterministic recoloring sufficient?** Use scripts; skip generation.
- **Image generation genuinely needed for new illustration?** Use the contract, ONE prompt and ONE primary output; use scripts for cleanup.
- **Failed dimensional/alpha check?** Repair deterministically. Only regenerate if core geometry/art content cannot be corrected.
- **Failed gameplay look?** Diagnose size, camera, color, and layer mapping *before* considering regeneration.

## Category routing
- Repeatable 32×32 pixel map tiles: `references/tile-rules.md` + `templates/tile-prompt.md` + `.agents/skills/field-mapchip-art/SKILL.md`.
- Walkable low floor decorations: `references/object-rules.md` + `templates/object-prompt.md`.
- Furniture: `references/object-rules.md` + `templates/object-prompt.md` + `skills/interior-occlusion-layers/SKILL.md`.
- Architectural walls/pillars: `references/object-rules.md` + `templates/object-prompt.md` + `docs/interior-architecture-asset-standard.md` + `docs/interior-pillar-asset-standard.md`.
- Binary delivery: `.agents/skills/github-artifact-delivery/SKILL.md` and `skills/github-image-atlas/SKILL.md`.

## Output status terminology
- `DESIGN REFERENCE`: image resembles intent but is not a validated game asset.
- `ASSET CANDIDATE`: dimensions/alpha prepared; visual/repeat/scene tests pending.
- `QA-PASSED LOCAL`: local objective tests and required composition previews passed.
- `INTEGRATED / DEPLOYED`: verified remote binary, renderer usage and deployment as applicable.
Never claim Safari QA without an actual device run.

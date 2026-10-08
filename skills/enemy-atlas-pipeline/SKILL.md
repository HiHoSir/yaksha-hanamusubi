# Enemy Atlas Pipeline

Purpose: Convert a paired enemy artwork set (intact/worn) into game-ready transparent 512px sprites and 128px atlases, then upload them to GitHub atomically.

## Inputs
- PNG pairs in a stable order matching `YK_DATA.rareKinds[*].variantAtlas`.
- Each pair has `intact` and `worn` states.
- Manifest order for this game:
  0 oni
  1 tanuki
  2 lantern_fox
  3 crab
  4 jelly
  5 tree
  6 spider
  7 snake
  8 falls
  9 ninefox

## Required outputs
- `assets/enemies/hd512/<stem>-intact-512.png`
- `assets/enemies/hd512/<stem>-worn-512.png`
- `assets/enemies/enemy-variant-atlas-128.png`
- `assets/enemies/enemy-variant-worn-atlas-128.png`

Atlas format: 4 columns × 3 rows, cell 128×128, first 10 cells used.

## Processing rules
1. Open as RGBA. Allow truncated PNG recovery only if Pillow can decode it cleanly.
2. If the edge is already transparent, preserve alpha.
3. If the image has a black/dark background, remove only dark pixels connected to the canvas edge. Do not globally key black because dark hair/outlines may be destroyed.
4. Keep the character's existing ground shadow when it is part of the artwork.
5. Crop to nontransparent bounds.
6. Fit into a 512×512 transparent canvas with consistent bottom anchoring.
7. Build each atlas from the 512px outputs. Fit each sprite into a 128×128 cell with padding and consistent bottom anchoring.
8. Verify the atlas visually and verify that each used cell contains transparent pixels around the subject.

## GitHub binary upload
Do not try to send local paths to GitHub.

For every PNG:
1. Read PNG bytes locally.
2. Base64 encode them.
3. Call GitHub create_blob with `encoding=base64`.
4. Record returned blob SHA.

After all blobs exist:
1. Read the current main branch head and tree SHA.
2. Create one tree using the current tree as `base_tree_sha`.
3. Add/replace all PNG paths plus any code/version changes.
4. Create one commit with current main as parent.
5. Update main using fast-forward with `expected_sha`.
6. Re-read main and verify every expected path.

## Game integration
The game first tries `HD_RARE_ART` 512px sprites, then falls back to variant atlases.
When replacing artwork, bump the query version for:
- `enemy-variant-atlas-128.png`
- `enemy-variant-worn-atlas-128.png`
- `assets/enemies/hd512/*.png`
and bump the visible BETA version in `index.html`.

## Acceptance checks
- 20/20 HD sprites exist.
- Both atlases exist and are 512×384.
- Atlas indices 0–9 match `variantAtlas`.
- No black rectangle/background is visible.
- Intact and worn switch correctly at the clothing-break threshold.
- Existing normal enemy atlas remains untouched.
- main update is fast-forward, not force.

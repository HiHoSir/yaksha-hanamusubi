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
3. Do not perform color-keying, black removal, flood-fill transparency, or automatic background removal on any approved sprite. These operations can destroy dark outlines and interior dark details. If a source is not genuinely transparent, mark it as requiring manual source reconstruction rather than silently converting pixels to alpha.
4. Keep the character's existing ground shadow when it is part of the artwork.
5. If a source is already an approved 512×512 RGBA sprite, preserve its pixels byte-for-byte at the decoded RGBA level (do not crop, rescale, or re-composite).
6. For other images, stop for source validation before cropping or fitting into a 512×512 canvas with consistent bottom anchoring.
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

## Rebuild gate after alpha-damage regression (2026-10-09)
- Start from archived `assets/enemies/variants/source/{intact,worn}/`, not from an atlas-derived sprite.
- Source files in GitHub are confirmed to exist, but their decoded pixels must be inspected before replacing runtime assets.
- Compare outline and interiors over at least two contrasting checkerboard/background colors.
- Detect fully enclosed transparent components; review visually because deliberate gaps are possible.
- Do not deploy replacements until every one of the 20 images passes pixel inspection and the 10 state pairs match.
- If binary extraction is unavailable, do not fabricate a replacement or claim deployment; preserve existing runtime images.

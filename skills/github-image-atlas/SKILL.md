# GitHub Image Atlas Upload Skill

## Purpose
Use this workflow when game artwork exists locally/container-side as PNG files and must be:
1. validated,
2. normalized into game-ready sprites,
3. packed into one or more atlases,
4. transferred to GitHub as binary files,
5. committed atomically,
6. verified from main.

This skill is designed for the 夜叉姫 project, especially rare-enemy intact/worn artwork.

## Canonical rare-enemy order
Atlas index must remain stable:

0. oni
1. tanuki
2. lantern_fox
3. crab
4. jelly
5. tree
6. spider
7. snake
8. falls
9. ninefox

The runtime mapping in js/data.js depends on this order.

## Canonical output
HD sprites:
- assets/enemies/hd512/{stem}-intact-512.png
- assets/enemies/hd512/{stem}-worn-512.png

Atlases:
- assets/enemies/enemy-variant-atlas-128.png
- assets/enemies/enemy-variant-worn-atlas-128.png

Atlas format:
- RGBA PNG
- 128x128 per cell
- 4 columns x 3 rows
- indices 0..9 filled; remaining cells transparent
- sprite aspect ratio preserved
- sprite centered horizontally
- sprite visually bottom-aligned
- transparent background

## Local build
Use:

```bash
python3 tools/build_variant_enemy_atlas.py \
  --input /path/to/variant_enemy_pairs \
  --output /tmp/variant_game_ready \
  --emit-base64
```

Expected input:

```
variant_enemy_pairs/
  intact/
    01_oni.png
    02_tanuki.png
    ...
    10_ninefox.png
  worn/
    01_oni.png
    ...
    10_ninefox.png
```

The script creates:
- hd512/*.png
- enemy-variant-atlas-128.png
- enemy-variant-worn-atlas-128.png
- manifest.json
- b64/*.png.b64 when --emit-base64 is used

## Validation before upload
Reject or stop if:
- any of the 20 paired sprites is missing,
- a PNG cannot be decoded,
- alpha bounding box is empty,
- image dimensions are zero,
- either atlas is not exactly 512x384 RGBA,
- atlas order differs from the canonical list.

Inspect a preview if artwork changed materially.

## Binary GitHub transfer method
Do NOT use GitHub create_file/update_file for PNG bytes. Those wrappers accept UTF-8 text.

Use the Git data flow:

1. Base64-encode every PNG without line breaks.
2. If the GitHub tool cannot read the container directly, upload each .b64 text file to temporary Library storage.
3. Read the full .b64 text.
4. Call GitHub create_blob with:
   - repository_full_name: HiHoSir/yaksha-hanamusubi
   - encoding: base64
   - content: exact base64 string
5. Read current main head and its tree immediately before commit.
6. Create one tree with all PNG paths and blob SHAs, using the current main tree as base_tree_sha.
7. Create one commit with parent_sha=current main head.
8. Fast-forward main with update_ref:
   - branch_name: main
   - expected_sha: the head used as parent
   - force: false
9. If expected_sha fails, fetch the new main head and reconcile. Never force-overwrite concurrent work.
10. Fetch the uploaded paths from main and verify presence/file sizes.

Recommended tree entry shape:

```json
{
  "path": "assets/enemies/hd512/oni-intact-512.png",
  "mode": "100644",
  "type": "blob",
  "sha": "<blob sha>"
}
```

## Runtime integration
js/game.js should load:
- assets/enemies/enemy-variant-atlas-128.png
- assets/enemies/enemy-variant-worn-atlas-128.png
- assets/enemies/hd512/{stem}-{state}-512.png

Prefer HD_RARE_ART when available. Fall back to atlas when an HD sprite is missing.

The intact/worn state is selected from battle.clothingBroken.

After replacing binary assets, update the query-string cache version used in js/game.js so iPhone Safari does not keep stale PNGs.

## Verification checklist
- main contains all 20 hd512 PNGs.
- both atlases exist.
- atlas dimensions are 512x384.
- js/data.js rareKinds variantAtlas indices remain 0..9 in canonical order.
- js/game.js points to both atlas files.
- js/game.js HD_RARE_STEMS maps lantern -> lantern_fox and shell -> crab.
- intact enemies display before break threshold.
- worn enemies display after clothingBroken becomes true.
- no missing-image fallback is visible.
- iPhone Safari reload shows the new assets after cache-version bump.

## Safety / recovery
- Build first; upload only after validation.
- Use a single tree/commit for one asset batch.
- Never force-update main.
- Keep original source images outside the runtime paths when needed for later reprocessing.
- If runtime code is already correct, do not change gameplay logic merely to register new source art.

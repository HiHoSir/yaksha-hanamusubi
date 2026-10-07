# Enemy asset integration status

Branch: `enemy-art-integration`

## Integrated generated standard enemy art

Generated enemy artwork is packed into one lightweight transparent atlas:

- `assets/enemies/enemy-standard-atlas-128.png`
- 512×384 PNG, 4 columns × 3 rows, 128px per cell
- 10 generated enemies, about 38 KB total
- canvas rendering uses nearest-neighbor scaling for a late-SFC-like crisp look

Atlas order:
0. 野の小鬼
1. 化け狸
2. 灯火狐
3. 磯妖
4. 泡くらげ
5. 木霊
6. 迷い蜘蛛
7. 水蛇
8. 滝童
9. 影九尾

`js/data.js` stores each integrated enemy's `atlas` index. `js/game.js` crops the corresponding cell at battle render time.

## Not replaced in this pass

- 妖狐: no dedicated individual generated image was produced in this pass, so it intentionally keeps the existing `ninefox.png` fallback rather than reusing the wrong artwork.

## Legacy fallbacks kept

- redoni.png
- crowtengu.png
- umibozu.png
- ninefox.png
- yokai_flower.png

These remain as safe fallbacks if the generated atlas fails to load.

## Dedicated rare variant assets

Already complete and unchanged:
- variants/oni-woman.png
- variants/oni-woman-worn.png

Remaining rare variants stay disabled until both intact and worn images exist. `rareReady()` remains the gate, so a rare variant cannot enter the encounter pool with missing artwork.

## Visual rule

- one still image per enemy
- battle effects are rendered at runtime
- transparent source art
- chibi Japanese fantasy look aligned with the approved early-enemy direction
- generated standard art is scaled with image smoothing disabled to retain a retro/SFC-like edge

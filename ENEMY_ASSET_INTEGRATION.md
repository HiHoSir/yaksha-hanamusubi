# Enemy asset integration status

Branch: `enemy-art-integration`

## Current production assets

### Legacy / fallback
- redoni.png
- crowtengu.png
- umibozu.png
- ninefox.png
- yokai_flower.png

### Dedicated rare variant assets
- variants/oni-woman.png
- variants/oni-woman-worn.png

## Standard enemies requiring dedicated final PNGs

Target directory: `assets/enemies/standard/`

- field-oni.png — 野の小鬼
- field-tanuki.png — 化け狸
- lantern-fox.png — 灯火狐
- shore-yokai.png — 磯妖
- bubble-jelly.png — 泡くらげ
- kodama.png — 木霊
- lost-spider.png — 迷い蜘蛛
- water-snake.png — 水蛇
- waterfall-child.png — 滝童
- dusk-fox.png — 妖狐
- shadow-ninefox.png — 影九尾

Dedicated art must be declared in `YK_DATA.enemyProfiles[name].art` only after the PNG exists.

## Rare variants requiring both states before encounters are enabled

Target directory: `assets/enemies/variants/`

Already complete:
- oni-woman.png
- oni-woman-worn.png

Missing pairs:
- tanuki-woman.png / tanuki-woman-worn.png
- lantern-woman.png / lantern-woman-worn.png
- shell-woman.png / shell-woman-worn.png
- jelly-woman.png / jelly-woman-worn.png
- tree-woman.png / tree-woman-worn.png
- spider-woman.png / spider-woman-worn.png
- snake-woman.png / snake-woman-worn.png
- falls-woman.png / falls-woman-worn.png
- fox-woman.png / fox-woman-worn.png
- ninefox-woman.png / ninefox-woman-worn.png

## Runtime rule

Rare encounters remain gated by `rareReady()`; a rare variant does not enter the encounter pool unless both intact and worn images load successfully.

## Visual spec

Follow `design-reference/enemies/DESIGN.md`:
- static full-body battle art
- left-facing 3/4 pose
- transparent PNG
- late-SFC-inspired Japanese fantasy rendering
- attacks/hits expressed with runtime effects, not animation frames
- do not treat palette swaps as final dedicated variants

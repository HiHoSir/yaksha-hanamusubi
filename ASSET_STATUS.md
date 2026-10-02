# Asset status — β14.1

## Production-ready
- 夜叉姫 通常和装: 4方向×3歩行 = 12 PNG

## Background engine
- 鬼灯の里: 4-layer production loader implemented
- `assets/tiles/village-ground.png`: not yet final
- `assets/buildings/village-buildings.png`: not yet final
- `assets/nature/village-nature.png`: not yet final
- `assets/objects/village-objects.png`: not yet final
- Missing layers fall back to β14.1 Canvas drawing; this is explicitly temporary.

## WIP
- 夜叉姫 remaining 5 outfits
- NPC final sprites
- Other maps/backgrounds

## β14.1
- `assets/tiles/village-ground.png`: 実生成背景を実装（768×768）。中央参道・横道・下部水路。建物/人物/UIなし。


## β14.1
- 3棟の実表示位置に合わせて建物当たり判定を全面再設計。
- 茶屋・民家の玄関前に幅広い進入路と旋回スペースを確保。
- 茶屋娘NPCを玄関正面から退避。
- 室内から出た際の復帰座標と入口判定を新配置へ同期。
- 旧4棟前提の衝突矩形を廃止。


## β14.1
- 夜叉姫の衝突半径を12pxとして経路探索監査。
- 建物3棟は矩形＋半径で侵入防止。
- 川は中央橋の通路のみ通行可能。
- 茶屋・民家の入口判定を到達可能な玄関前座標へ同期。

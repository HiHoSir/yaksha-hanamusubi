# Asset status — β15.1

## Production-ready
- 夜叉姫 通常和装: 4方向×3歩行 = 12 PNG

## Background engine
- 鬼灯の里: 4-layer production loader implemented
- `assets/tiles/village-ground.png`: not yet final
- `assets/buildings/village-buildings.png`: not yet final
- `assets/nature/village-nature.png`: not yet final
- `assets/objects/village-objects.png`: not yet final
- Missing layers fall back to β15.1 Canvas drawing; this is explicitly temporary.

## WIP
- 夜叉姫 remaining 5 outfits
- NPC final sprites
- Other maps/backgrounds

## β15.1
- `assets/tiles/village-ground.png`: 実生成背景を実装（768×768）。中央参道・横道・下部水路。建物/人物/UIなし。


## β15.1
- 3棟の実表示位置に合わせて建物当たり判定を全面再設計。
- 茶屋・民家の玄関前に幅広い進入路と旋回スペースを確保。
- 茶屋娘NPCを玄関正面から退避。
- 室内から出た際の復帰座標と入口判定を新配置へ同期。
- 旧4棟前提の衝突矩形を廃止。


## β15.1
- 夜叉姫の衝突半径を12pxとして経路探索監査。
- 建物3棟は矩形＋半径で侵入防止。
- 川は中央橋の通路のみ通行可能。
- 茶屋・民家の入口判定を到達可能な玄関前座標へ同期。


## β15.1
- 実機確認用「鬼灯の里テスト」ボタンを追加。
- タップすると鬼灯の里中央広場 (384,420) へ即時移動。
- 手動セーブスロットは上書きしない。


## β15.1
- ChatGPT生成の鬼灯の里完成レイアウトを `assets/maps/village-composite.png` として実ゲーム描画へ組み込み。
- 768×768へ変換し、キャラクター/NPC/UIは従来どおりゲーム側で上描画。
- 現段階はビジュアル統合版。新背景に対する当たり判定の最終同期は未実施。
- 旧4レイヤーはフォールバックとして保持。


## β15.1
- `leaveInterior()` 後方に残っていた旧コード断片を除去。
- 新しい鬼灯の里背景に合わせて屋外NPC5名を安全な歩行領域へ再配置。
- 鬼灯の里テスト開始座標を中央広場 (382,405) へ同期。
- JavaScript構文チェックを実施。


## β15.1
- フィールドの歩行可能領域を実画像に合わせたルート帯へ変更。
- 海・山・崖側へ自由に侵入できたβ15.0の暫定判定を廃止。
- フィールド北側から天妖の社へ入る入口を追加。
- 天妖の社からフィールドへ戻る復帰導線を追加。
- 鬼灯の里、天妖の社、西分岐、海岸分岐、南道への経路探索PASS。

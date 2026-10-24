# 室内タイル統一 — 実装経路と移行仕様

## 現行実装の確認（main 867c635）
- `js/interior-base.js`: `teahouse`, `inn`, `armory`, `home` の `base-v1/*.webp` を各1枚描画。画面座標の矩形 `solids` で衝突判定。旧画面座標のため新32pxグリッドへそのまま流用不可。
- `js/interior-native-debug.js`: 10×8セル、32pxタイルの木床4×4候補、road、壁、柱、卓の試作描画を実装。デバッグ専用であり本編の室内共通レンダラではない。
- `assets/interiors/structured-v1/teahouse.scene.json`: geometry provisional、runtime非アクティブ。
- `assets/interiors/tea-collision.v2.json`: screen-footの多角形。新トップビューの occupiedTiles の正本にしない。
- `design-reference/maps/topview-v1/cyamise-approved.png`: 新規約での茶店トップビュー採用基準。

## 新レンダラ設計（まだ実装しない）
- `tileSize:32`, `camera:topdown-orthographic`、原点・倍率は地面、家具、キャラ共通。
- `ground[y][x]` に床タイルID、`architecture` に壁・建具・敷居、`objects` に独立RGBA家具と明示 `occupiedTiles` を保持。
- `collision` は壁と家具の occupiedTiles の和集合＋出入口セルの通行規則。描画アルファから生成しない。
- 奥の家具前・出入口・NPC対話セルは予約セルとして経路到達性検査。
- 家具は通常背景＋キャラ。セルを超える遮蔽のみ前景、必要時はキャラの補間済み可視足元で深度ソート。
- 旧室内レンダラを残し、新方式の素材・構造・経路・QAが揃うまで切替しない。
- 室内IDとイベント・NPC・ショップ操作の互換レイヤーを設け、セーブ座標の変換が必要な場合は明示的移行。

## 制作優先度
1. 茶店の床・壁・角・出入口・敷居を32px単位で確定。既存プロトタイプを画素検査して採否判定。
2. 卓2×2、腰掛け2×1を承認トップビューから確定。旧64×40卓を無条件採用しない。
3. 茶器、行灯、収納など実際の承認絵にある不足分を個別に調査。
4. 共通タイルを民家・宿・武具屋へ再利用し、固有家具のみ追加。

## 品質ゲート
- 画像: 32pxグリッド、真のRGBA、反復3×3、境界接続、ピクセル密度、実キャラ28px基準。
- ゲーム: 占有整数、出入口到達、NPC会話、四方向歩行、半マス停止なし、遮蔽、セーブ再開。
- 配布: 改善ブランチ→隔離Pagesプレビュー→Safari実機→承認→mainへ統合→BETA/cache更新。
- 現状: **設計・ソース調査のみ**。素材の画像画素検査・生成・本編描画変更・Pages公開・Safari確認は未実施。

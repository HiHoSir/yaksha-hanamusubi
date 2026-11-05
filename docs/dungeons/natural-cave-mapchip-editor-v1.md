# 自然洞窟・マップチップ専用エディタ（試作）

- 改善ブランチ `improve/natural-cave-tiles`、本編 main には未採用。
- `previews/natural-cave-walk.html` は従来の歩行検査を統合した編集可能なページ。
- 12×7=84枚の32×32px原画由来チップ、RGBA装飾、独立2×2アーチ。
- 既存の32×22試作を初期ロード。編集・判定・出現点・試し歩き・JSON/PNG出力・自動保存。
- 出力JSONは `tileIds`, `decorations`, `archOverlays`, `walkable`, `blockedProps`, `start` を保持。
- `heightLevels` と `elevation` は null。高さ演算・カメラ投影は使用しない。
- マップチップの接続性・視覚品質は未承認。Safari実機は別途確認。
- 元の生成原画は会話添付 `cave_corrected_mapchips_v7.zip` に保管。ここでは抽出したゲーム用PNGを正確に保存。

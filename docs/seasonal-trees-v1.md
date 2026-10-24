# 季節の木パーツ

桜（淡桃・濃桃）、紅葉（赤・橙・黄）を既存の広葉樹と1マスの木から色替えした独立素材。新規画像生成は使用していない。

| 系統 | 元画像 | PNG | 表示セル | sourceRect | 明示占有 |
| --- | --- | --- | --- | --- | --- |
| 広葉樹 `tree_*` | `assets/settlement-editor/chips/tree_broadleaf.png` | 32×64 | 1×2 | 2,17,28,30 | [[0,0]] |
| 1マス `trees_1cell_*` | `assets/field-map-objects-v3/trees.png` | 32×32 | 1×1 | 0,7,32,25 | [[0,0]] |

元画像の輪郭、RGBAアルファ、幹、非緑色画素をそのまま保持。緑色の葉のみ明暗に応じた4色のランプで変換する。桜は既存樹冠の色替えであり、枝ぶりや花びら形状を描き直した新規イラストではない。

分類は独立オブジェクト。接続・反復不要。村の既存視点を継承し、可視下辺を接地セルの下辺へ合わせ、既存の物体・キャラ共通深度順を用いる。樹冠へ追加の通行不可を設けない。地形・高さ・崖面・既存の配置は変更しない。

再構築: `python3 tools/build-seasonal-trees.py`。
出力先: `assets/settlement-editor/seasonal-trees-v1/`。
カタログ: `js/settlement-map/catalog.js`、各素材を独立IDとして追加。
検査図: `qa/seasonal-trees-preview.png`。

元の木は置換せず、マップへの新規配置は未実施。GitHub登録・Pages公開・実機Safari検査をそれぞれ区別する。

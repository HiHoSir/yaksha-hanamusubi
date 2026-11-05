# 自然洞窟：108チップによる配置試験（未採用候補）

- 対象ブランチ: `improve/natural-cave-tiles`（`main`は未変更）
- 正本マップ: `assets/dungeons/natural-cave-v1/cave-map-108-layout.json`
- 実チップ合成画像: `assets/dungeons/natural-cave-v1/cave-map-108-layout-preview.png`（1024×704px）
- 再現可能な生成コード: `tools/build-natural-cave-108-layout.py`
- 操作可能エディタ: `previews/natural-cave-walk.html?layout=wall108`

## 配置の意図

元の32×22セル・二つの洞窟室・中央連絡通路・アーチを維持。
横壁は上段にID84–88、下段にID90–94を配置し、二段の岩壁にする。
縦壁は左側のID96–98、右側のID99–101、中央境界のID105–106を配置する。
既存84種のタイルIDと画像は変更せず、新規ID84–107を利用する。
岩・水場・鉱石・結晶・松明などの装飾15個を別レイヤーに配置する。

## 衝突と品質

- 基準セル: 32×32px、正投影トップビュー、4方向セル単位移動。
- 壁の新規配置は明示的に通行不可。小物の接地判定もJSONに明示する。
- 開始地点は(10,7)。通行可能293マス、BFS到達可能293マス。
- 高低差投影は使用しない。実際のチップ画像をそのまま配置する。
- 既存のエディタ保存データを保護するため、`?layout=wall108` は別のlocalStorage領域を使う。
- このマップは見た目の試験配置であり、継ぎ目の美術的な合格や実機Safariの確認は未実施。本編へは未統合。

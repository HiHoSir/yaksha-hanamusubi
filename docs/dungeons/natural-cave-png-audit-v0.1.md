# 自然洞窟PNG実寸調査・一次判定（2026-10-28）

GitHub `fetch_file(encoding=base64)` で画像実データのPNG IHDRを確認。**画像の視認やα分布、接続辺の画素一致は未検査**。色替えや切り出し後のゲーム品質を保証しない。

| 既存ファイル | 実寸 | PNG | 色形式 | 現時点の判定 |
| --- | ---: | --- | --- | --- |
| `assets/terrain/landscape-v1/barren.png` | 64×64 | OK | RGBA8 | 土床候補。既存4象限の32px描画方式を参照 |
| `assets/terrain/cliffs-v1/grass-cliff-32.png` | 32×32 | OK | RGBA8 | 岩壁陰影の候補。草の色・継ぎ目を実検査 |
| `assets/settlement-editor/chips/rocks.png` | 32×32 | OK | RGBA8 | 1セル岩候補。実透明画素と接地の検査待ち |
| `assets/settlements/common-v1/rocks.png` | 112×67 | OK | RGBA8 | 複合画像。無条件に32pxタイルへ分割不可 |
| `assets/settlement-editor/rock-pieces-v1/rock_group_a.png` | 48×48 | OK | RGBA8 | 独立岩オブジェクト候補。1セル占有とは別に表示寸法を契約 |
| `assets/settlement-editor/clear-water-v1/shallow.png` | 32×128 | OK | RGBA8 | 32×32が縦4枚。水面アニメーションの候補 |
| `assets/field-map-objects-v3/cave-small.png` | 32×32 | OK | RGBA8 | 洞窟入口・フィールド接続に利用可能性 |
| `assets/terrain/water-autotile-32-v5.png` | 256×256 | OK | RGBA8 | 8×8セル相当。マスクとタイル対応の照合待ち |

## 実装可否

- 既存の `js/settlement-map/autotile.js` はN/E/S/W/斜め8方向を正規化する47状態のロジックを持つ。新規アルゴリズムは不要と考えられるが、既存の地形カタログと壁境界への適用は個別に検証する。
- 洞窟入口・土・崖・岩・水が存在するため、**新規画像生成前に再利用・加工を優先**。ただし洞窟壁として繰り返せると確認したPNGはまだない。
- 現行のPNG確認はIHDRのみ。PNGピクセルの直接検査・描画合成・3×3シーム・最終カラーの採否は未完了。
- 洞窟壁と岩床の新規画素が必要と実証されるまで image_gen は呼ばない。

## 次の検査ゲート
1. RGBA実画素の透明分布・配色・境界画素・既存レンダラー表示を取得。
2. 64px荒地と32px岩・崖・水を各1セルの同一倍率で重ねて、画風と接続を検査。
3. 原画の加工だけで成立する場合は別PNGへ複製して新規洞窟素材化。原画の上書き禁止。
4. 47接続と3×3床の反復を検査した場合のみ「アセット完成候補」とする。

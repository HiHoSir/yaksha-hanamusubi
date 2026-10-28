# 自然洞窟・汎用マップチップ設計 v0.1

Status: DESIGN / INVENTORY ONLY（画像未制作・本編未統合）
Branch: `improve/natural-cave-tiles`
Reference: `AGENTS.md`, `docs/topview-map-standard.md`, `.agents/skills/asset-design/SKILL.md`, `.agents/skills/create-grid-map-art/SKILL.md`.

## 目的
正投影トップビュー・32px単位で、入口、曲がり、T字、十字、広間、水辺、宝箱、出口を自由に構築できる自然洞窟の共通素材群。フィールドの洞窟入口画像は入口演出に限定し、内部床／壁へ無条件で引き伸ばさない。旧素材の実ピクセル評価前に生成しない。

## 既存素材の調査（mainリポジトリ内のパス存在を確認）
| パス | 種別 | 判定・注意 |
| --- | --- | --- |
| `assets/field-map-objects-v3/cave-small.png` / `cave-large.png` | 洞窟外観 | 入口として再利用候補。内部壁に転用しない |
| `assets/terrain/cliffs-v1/grass-cliff-32.png` | 崖面 | 岩壁の陰影・輪郭の参照候補。草接続の除去と反復検査が必要 |
| `assets/terrain/landscape-v1/barren.png` | 荒地 | 土床の地色／石粒表現の再利用候補。64px原画から32px四分割を検証 |
| `assets/terrain/landscape-v1/mountain.png` / `assets/terrain/mountain-range-v15.53.3.png` | 山 | 岩色・塊形の参考。地面用と混同禁止 |
| `assets/settlement-editor/chips/rocks.png` / `assets/settlements/common-v1/rocks.png` | 岩 | 小岩オブジェクトの切り出し候補。実寸とα要実測 |
| `assets/settlement-editor/rock-pieces-v1/rock_group_{a,b,c,d}.png` | 岩群 | 岩柱・瓦礫候補。occupiedTilesを別指定する |
| `assets/settlement-editor/clear-water-v1/{shallow,mid,deep}.png` | 水 | 地下水の色替え候補。既存接続画像と同じ規則を使えるか確認 |
| `assets/terrain/water-autotile-32-v5.png` | 水接続 | 水辺表示の既存素材・方式候補 |
| `assets/animation/fluid-v1/water-surface.png` | 水面 | 先読み・アニメーション負荷を確認してから採否判断 |
| `js/settlement-map/autotile.js` | 接続計算 | N/E/S/W + 条件付斜めの正規化47状態を再利用候補 |
| `js/settlement-map/model.js` | マップモデル | 32px占有・入口・手動/自動通行の仕様を参照。既存モデルを無断で変更しない |

上記はファイル存在と一部コード・READMEの確認結果。実際のPNG視認、色／アルファ／寸法評価、ゲーム表示評価を通過したという意味ではない。

## アセット契約
- 単位: 1地形セル = 32×32px。床タイルは32×32不透明PNG、または4×4の128×128アトラス。追加バリエーションは同じ座標規則。
- 視点: topdown-orthographic、正方格子、1990年代後期SFC風の明確なドット塊。描画時はnearest-neighbor、左上光源。
- 地面: `cave_floor_base`（通行可）、`floor_pebbles`（通行可）、`floor_cracks`（通行可）。地面の細部は反復しても不自然な境界を作らない。
- 壁: `cave_wall` は独立した**占有地形セル**（通行不可）。壁/床境界の装飾は床の接続とは別の表示レイヤーで合成。壁表面を床の一部と誤判定しない。
- オートタイル: 床集合のN=1,E=2,S=4,W=8と斜めNE=16,SE=32,SW=64,NW=128。斜めbitは両隣の直交bitがあるときだけ有効。既存の `SMAutotile.normalize/maskAt` の47状態へ対応。岩壁境界の太さと角落としは表示ルールで統一。
- 接続役割: 塗りつぶし、孤立、片端4、直線2、曲がり4、T字4、十字1、凹角4、凸角4に加え、斜めbitの条件付きバリエーションを47状態として網羅。具体的な出力PNGインデックスは実画素の素材化時に固定。
- 水: 地下水`cave_water_shallow`（初期は通行不可）、`cave_water_deep`（通行不可）。浅瀬を通行可能に変更するときはマップイベント／移動規則で明示し、見た目で自動変更しない。
- 独立小物: 小岩1×1・岩柱1×1・宝箱1×1（画像はRGBA・余白最小）。画像の表示範囲と占有セルは別指定。岩柱が隣セルに張り出す場合のみ必要最小の前景レイヤーを作成。
- 出入口: 1マス幅の明示的なwalkable triggerセル。入場は移動完了後に重なりを描画して自動遷移。帰還セルを入口とは分離し再入場ループを防止。
- キャラ: 本編で実際に使う緋月SDアトラス。可視全体をセル内原則28px以内、中央配置。キャラの足元を物体と同じ下端揃えへ変更しない。

## 通行・接続モデル（アセットに先行する正本）
```json
{
  "id": "cave-demo-01",
  "tileSize": 32,
  "camera": "topdown-orthographic",
  "width": 24,
  "height": 18,
  "ground": "cave_floor_base",
  "terrainBlocks": [[0,0]],
  "terrainPassages": [],
  "objects": [
    {
      "id": "rock-01",
      "templateId": "cave_rock_small",
      "x": 8,
      "y": 6,
      "displayCells": [1,1],
      "occupiedTiles": [[8,6]],
      "layer": "object",
      "footAnchor": [8,6]
    }
  ],
  "entrances": [
    {"id": "entry", "marker": [2,16], "approach": [2,16], "kind": "transition"},
    {"id": "exit", "marker": [21,1], "approach": [21,1], "kind": "transition"}
  ],
  "spawn": [2,15]
}
```
※上は規格の例であり、現行エディタのJSONへそのまま投入する完成データではない。既存モデルのversion/catalogRevisionに合わせる変換アダプタが必要。四辺を閉じた実マップの完全なterrainBlocksは制作時に生成する。

## QA（必須）
1. 既存候補PNGの実寸・RGBA・色数・画風・最終ゲーム倍率を測定し、採用／加工／新作を決める。ROM由来素材を公開へ流用しない。
2. 床・壁の縦横3×3反復と、47接続マスク全パターンを検査。割れ目・境界食い違い・色のジャンプ禁止。
3. 矩形・L字・T字・十字・斜め凹角を含む24×18試作マップをチップで構成。通路は最小1セル、必須到達点まで4近傍BFS。
4. 到着セル判定は移動開始前に行い、通行不可セルへ半マス進入しない。全障害物のoccupiedTilesは整数・範囲内・重複なし。
5. 入口・出口・宝箱前接近・水辺・岩柱の前後遮蔽・マップ端カメラ・セーブ復帰を確認。
6. 検査図はグリッド／判定を切替可能にし、本編用画像に焼き込まない。
7. 画像制作後は`validate_assets.py`、実SDキャラ等倍比較、実本編経路参照確認。Actions、Pages、iPhone Safariは独立した検査とする。

## 次工程
既存PNGを実バイトで取得して比較、切り出し／パレット調整で成立する床・岩・水から先に32px素材化。岩壁用に適切な連結原画が存在しないと判定されたときだけ、`asset-design/templates/tile-prompt.md`に基づき、規約に適合した原画を一度生成する。採用品はアトラス・ID・マスク対応・配置JSONをまとめて管理。本編の既存仕様はデザイン承認まで変更しない。

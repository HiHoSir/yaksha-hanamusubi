# AI・iPhone共用マップチップエディタ（試作 v1）

## 目的と境界

- 入口: `/mapchip-editor.html`（GitHub Pages／iPhone Safari、外部ライブラリ不要）
- 編集エンジン: `js/mapchip-core.js`（ブラウザ・Node共通）
- AI用CLI: `node tools/mapchip-ai.cjs`（Node標準モジュールのみ）
- 自動検査: `node qa/mapchip-ai-smoke.cjs`
- **本編のマップ・既存チップ・セーブを自動上書きしない。** 絵と衝突を切り離した制作専用ツール。素材の本編採用は別途承認・実装・回帰検査が必要。

## 仕様

- 単位は真の32×32 RGBAピクセル。表示は最近傍のみ。グリッド・検査UIはPNGに出力しない。
- デフォルトは4列×4行、256チップまでの任意の32px整数倍PNGを読み込んで再編集できる。
- JSON形式 `yaksha-mapchip-v1` は各チップの `pixels`（32×32×4バイトをBase64化。空文字は全面透明）、`id`、`label`、`connections`（top/right/bottom/leftの4真偽値）、`passable` と試験マップを含む。
- 接続情報は「このタイルはこの方向へ接続させたい」という設計メタデータ。隣同士の真偽が異なる場合は **error**、接続宣言が双方trueで境界の32画素RGBAが異なる場合は **warning**。ピクセル一致だけでは見た目の自然さを保証しないため実寸目視が必要。
- `passable` は製作用メタデータであり、本編 `occupiedTiles` を推定・更新しない。
- UIの自動復元は `localStorage` に **URLパスごと** に保存する。本編のセーブを触らない。端末間同期・GitHub自動pushは行わないため、成果物はJSON/PNGとして保存する。

## iPhone操作（カーソル＋PUSH方式）

1. Safariで `mapchip-editor.html` を開く。下部の「選択」から既存のアトラスPNG（32px整数倍）または編集JSONを読み込む。新規4×4も利用可能。
2. 画面中央の32×32グリッドを**スワイプすると赤枠カーソルだけが相対的に移動する**。指を置いた位置を勝手に描かない。座標は0〜31でクランプ。
3. 下部の「パレット」から色、ペン／消しゴム／スポイト／塗りつぶし／直線を選び、**PUSHで現在のカーソル位置に実行**する。ペンと消しゴムのみPUSHを押しながら別の指でスワイプすると、途中の画素も連続して描く。
4. 直線はPUSHで始点確定→カーソル移動→再びPUSHで終点確定。スポイトはPUSHで色取得、塗りつぶしはPUSHで1回実行。
5. 「戻る」「進む」で取り消し／やり直し。「選択」で各チップと接続方向・通行可否を編集。「配置」で3×3反復、9×9試験配置、接続検査、AI命令、PNG／JSON出力。
6. 「設定」からグリッド切替・反転・回転・クリア・複製・PNG／JSON保存が可能。

狭い画面ではドット編集を最優先表示し、補助パネルをシートで開く。PCなど通常のポインタ環境では既存のキャンバス直接描画を維持する。カーソル枠や補助UIはPNGに出力しない。保存データの形式は変更しない。

## AIコマンドの実行

編集JSONを正本とし、**コマンドはJSON配列**で作成する。AIは同じエンジンを呼び、コードで画素を確定的に操作する。ブラウザの「AI命令」欄へ貼り付けてもよい。

```json
[
  {"op":"paint","tile":0,"x":16,"y":16,"color":"#9d9a82"},
  {"op":"line","tile":0,"x1":0,"y1":4,"x2":31,"y2":4,"color":"#6e6b5c"},
  {"op":"rect","tile":0,"x":2,"y":2,"width":8,"height":5,"filled":true,"color":"#574f49"},
  {"op":"copy","tile":1,"from":0},
  {"op":"flip","tile":1,"axis":"x"},
  {"op":"connections","tile":0,"top":true,"right":true},
  {"op":"passable","tile":0,"value":false},
  {"op":"mapCell","x":4,"y":4,"tile":0}
]
```

```bash
node tools/mapchip-ai.cjs --new commands.json candidate.json --png candidate.png --report candidate-report.json
node tools/mapchip-ai.cjs candidate.json correction.json candidate-v2.json --png candidate-v2.png
node qa/mapchip-ai-smoke.cjs
```

その他の操作: `clear`, `fill`（連結同色領域を塗る）, `replace`（`from`カラー→`color`）, `rotate`（`direction:"cw"|"ccw"`）, `label`（`value`文字列）, `mapResize`（`width`, `height`）, `mapCell`（`tile:null`で除去）。画素座標は0〜31。透明は `"transparent"` または `#00000000`。CLIは失敗したコマンドでプロジェクト出力しない（エラー番号を報告）。

## 制作契約とQA

- 対象: タイルエディタ基盤（承認済み作品の新規画素は今回作らない）。32×32真上視点、出力RGBA、接続4方向メタデータ。テストマップは通行判定プレビュー用データのみでゲームランタイムと未結合。
- 既存画像をPNGインポートでそのまま使う方式なので、新たな画像生成は行わない。
- 最低限の自動検査: JSON形式/サイズ/カラー/画素演算/接続エラー検出/CLI→PNG書出し/編集JSON往復。
- 追加の確認: 読み込んだ実洞窟チップと隣接組み合わせの目視、iPhoneでの指操作・ダウンロード・復元、本編インポート経路は別途必要。
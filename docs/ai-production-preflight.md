# AI制作の正本取得と自動ゲート（2026-11-07 実証版）

## 目的

AIが過去のスキル・旧版ドキュメントから間違った素材を採用したり、用途の違う素材（縮約ワールドマップ記号と村の実寸オブジェクト）を同じ探索場面へ混ぜたりする失敗を、**制作前とGitHub Actionsの両方で検出する**。

このゲートは**美術品質そのものの採点器ではない**。AIが指示を読んだと自己申告しても、機械検査で不整合を検出するための仕組み。

## 正本と優先順位

1. 実際の稼働コード・採用PNG・動画と `config/production-canon.json` の一致が、**現在の実装状況**を確定する。矛盾したら成功として進めない。
2. `AGENTS.md` とカテゴリ別 `SKILL.md` は制作方法と生成前確認に必須。現行コードに合わせて更新された正本情報を優先し、古い資料の一文だけで版を決定しない。
3. 個別シーンのオブジェクト規格は `config/scene-contracts/<scene>.json` に定義。異なる画風を混ぜてしまう前に、使用画像の役割と視点を固定する。
4. 「明示的な不採用」も記録対象。新しい案が既に不採用となった方式なら、何が変わったから今回は可能なのかを検査できる根拠と一緒に示す。説明なく旧案に戻さない。

## 実行方法（Node.jsのみ／無料）

```sh
node qa/production-preflight.cjs --check
node qa/production-preflight.cjs --profile village-exploration
node qa/production-preflight.cjs --scene config/scene-contracts/hozuki-exploration.json
node qa/production-preflight.test.cjs
```

- **通常制作前**：`--check` で現行の緋月・ゲーム本体・ムービー・保護済み描画系と実ファイルの一致を照合する。次に `--profile` でシーンに許された素材系統を取得する。
- **素材配置を編集する場合**：対象シーンのJSONで `profile` / `tileSize` / `viewpoint` / `hero` / `objects` / `ground` を列挙して `--scene`。素材が役割外・未登録・未存在なら停止する。
- **GitHub Actions**：`.github/workflows/production-canon.yml` が `improve/**` と `main`、main宛PRで同じ検査と不合格例テストを実行。iPhone側でNode実行は不要。
- **不合格のとき**：まず目的・世代・正本を見直す。検査だけを回避するために、承認済みハッシュや例外リストを黙って変えない。

## 今回の具体的な再現（`qa/production-preflight.test.cjs`）

正しいヒヅキSD v3と、村探索用 `assets/settlements/common-v1/` を使った契約は通る。

一方、旧v2ヒヅキ、村への `assets/field-map-objects-v3/trees.png` の流用、旧 `landscape-v2/bridge.png` の流用、未登録素材、地面画像を家具として使う誤り、間違った視点・セルサイズ・シーン登録、悪意のある相対パスは**必ず不合格**にする。以前のパイロットの誤ったHTML素材指定も、フィールド専用オブジェクトや旧ヒヅキが入っていれば不合格。

`world-field` は旧来の多系統の素材を使う**既存採用フィールドとして例外的に区別**する。これは現状のフィールド描画を破壊しないためであり、村や新ダンジョンでも自由に混ぜてよいという意味ではない。

## 守る成功例

- **新桃太郎伝説風のフィールド**：`js/landscape.js`, `js/world.js`, `js/field-terrain.js`, `js/field-elevation.js`, `js/elevation-view.js`、地面・水平線・流れる水の元画像。
- **PCエンジン風のゲーム開始ムービー**：`js/prologue.js`, `assets/prologue/pixel-v2/prologue-pixel-v2-complete.mp4`。終了・スキップ後のゲーム開始処理は別の `qa/prologue-unit.cjs` で検査。
- **採用済み主人公**：`assets/characters/hizuki/field-sd-v3/walk-atlas-32.png`。保護した画像は再生成・画素改変しない。

保護ファイルの現在のGit blob SHAは `config/production-canon.json` に記録。承認された改良で保護対象を変更する場合は、実ファイル検査と新ハッシュの照合を行ったうえで明示的に更新する。**ハッシュが違った＝新ハッシュへ自動書換え**を禁止する。

## 限界・次の改善条件

- 実画像の色彩・ドット密度・世界観が合うか、草花や建物が魅力的に見えるかは自動判定していない。
- オブジェクトの設置セル・遮蔽・通行判定、人物との画面比率、タイルの継ぎ目は**別のQA**が必要。
- この初版は登録されたシーン契約・指定したHTML・現行コードの重要な呼び出しを監査する。全リポジトリの任意の試作ファイルを自動分類する仕組みではない。**新しい探索シーンは契約を登録してから検証する**。
- GitHub Actionsの成功とPages公開・iPhone Safariでの確認は別扱い。新しい画像を生成したわけではないため、今回は新しい美術成果の採用判定ではない。

## 配送と承認

現時点では `improve/ai-production-preflight` ブランチのみ。ユーザー承認までは本編の `main` とGitHub Pagesに合流しない。既存の成功例のデータは一切変更しない。

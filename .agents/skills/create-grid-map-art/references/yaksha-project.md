# 『新生 鬼哭の花契り』への接続

## 正本と取得

リポジトリは `HiHoSir/yaksha-hanamusubi`。現在の独立エディタは `improve/settlement-map-editor`。作業開始時にブランチHEADとファイルを再取得し、mainへ統合済みかも確認する。ここに記すパスはリポジトリルート基準。古いコミットの内容で新しい作業を上書きしない。

最低限読むもの：

- `AGENTS.md`
- `.agents/skills/asset-design/SKILL.md`
- `docs/topview-map-standard.md`
- `skills/github-image-atlas/SKILL.md`
- `.agents/skills/github-artifact-delivery/SKILL.md`
- `js/settlement-map/{catalog,model,render,walk}.js`

このスキルは共通規約を補う村用の具体手順。旧資料の58pxキャラ、足をセル中央、建物の旧占有、2セル橋、畑不可などを現行仕様に戻さない。実カタログと現行規約が食い違う場合は対象差分を確認し、黙って片方を変更しない。

## 参照の選び方

- 実SD緋月：`assets/characters/hizuki/field-sd-v1/walk-atlas-32.png`。エディタの検査は `assets/settlement-editor/hizuki.png` と実レンダラーを使用する。
- 茶店の画風・トップビュー：`design-reference/maps/topview-v1/cyamise-approved.png`。村の画風は採用済み村素材と `qa/village-pack-scene.png` を確認する。後者は素材検査図であり採用済み村配置ではない。
- 読み込む背景PNGと独立チップを混同しない。前後関係は `docs/settlement-editor-contact-placement.md`、現行初期値と手動修正は `docs/settlement-editor-manual-collision.md` を優先する。
- 小型店舗・看板・装飾・地表は `docs/settlement-editor-pack-v1.md`。新規店舗は通常3×2セルを用い、既存の5×3店舗は互換のため保持する。旧文書の5セル幅を全店舗の新規既定値へ流用しない。
- 祠・鐘撞堂・神社は `docs/settlement-editor-religious-buildings.md`、狛犬は `docs/settlement-editor-komainu.md`。既存祠を追加建物へ置換しない。

## 再構築・QAの入口

| 対象 | スクリプト／資料 |
| --- | --- |
| 地形原画・道・川 | `tools/build-village-autotiles.cjs`、`docs/settlement-editor-autotiles.md` |
| 現行橋 | `tools/build-village-bridges.cjs`、`docs/settlement-editor-bridge-autotiles.md`（sm-8/v2） |
| 汎用素材・小型店・看板 | `tools/prepare-village-pack.py`、`tools/build-village-pack.cjs` |
| 鐘撞堂・神社 | `tools/prepare-religious-buildings.py`、`tools/preview-religious-buildings.cjs` |
| 左右狛犬 | `tools/prepare-komainu.py`、`tools/preview-komainu.cjs` |
| ファイル構造 | `.agents/skills/asset-design/scripts/validate_assets.py` |
| 行動・画素・保存 | `qa/settlement-map-*.cjs`、同ディレクトリの実SD合成画像 |

Python画像処理はPillow、Node描画は `@napi-rs/canvas`、UI検査はjsdomを使う。実行環境に合うnodeと依存パスを確認し、プロジェクトルートで `node --test qa/*.cjs` を実行する。元の生成ファイルがなくても、保存済みの規格化sourceから再構築する。原画の絶対パスだけに依存させない。

## 登録・公開

GitHub連携を優先し、PNG/ZIPは実バイトをBase64化→create_blob→create_tree→create_commit→expected-head update_ref→remote SHA/size照合。原画・メタデータ・参照先を一つの整合したコミットへまとめる。ローカルDNS障害から連携不可と結論しない。

改善ブランチを維持し、mainマージは別途承認範囲に従う。文書のみなら不要なゲームバージョン・PNG・HTMLを変更しない。mainに届く変更ではAGENTS.mdのBETA/cache更新に従う。

公開手段は毎回ツールの機能を確認する。現行ワークフロー `.github/workflows/improvement-preview.yml` は main から実行し、input `source_branch` に改善ブランチを指定する。公開開始APIがなければ登録・検査まで済ませた上で、この実行だけ案内する。同じrunの再実行はartifact重複の失敗例があるため、新しい実行を使う。

実行成功後に新しいcache queryで配信HTML・JS・PNGと登録ファイルを比較し、公開エディタの素材読込・配置・到達検査を行う。Actions成功、ブラウザ検査、iPhone Safariの実機確認を同じ「PASS」にまとめない。

# 室内タイル統一 — 茶店先行調査（作業中）

基準: main 867c635c40e5992ab487d3b9de90ab7cb96319b2（2026-10-25 調査）。
対象ブランチ: improve/interior-tile-unification。
この文書は素材棚卸しであり、画像の採用・ゲーム本編の切替を意味しない。

## 規約
- docs/topview-map-standard.md を優先。32×32、正投影トップビュー、SDキャラ可視全体原則28px。
- 既存の承認済み茶店トップビュー参照 design-reference/maps/topview-v1/cyamise-approved.png を画風・配置基準とする。
- 旧 base-v1 は色・道具などの参照に留め、旧パースを復活させない。
- 反復床は32×32、または4×4の128×128シート。接続を3×3反復で検査。
- 独立家具は透明RGBA、occupiedTilesを明示。床・接地・遮蔽を別データにする。
- デザイン承認と実装・公開・実機検査を別ゲートとする。

## リポジトリに存在する素材（採用確定ではない）
| 用途 | 既存パス | 判定 |
| --- | --- | --- |
| 茶店基準画像 | design-reference/maps/topview-v1/cyamise-approved.png | 承認済み視点参照。直接タイルとして使わない |
| 旧室内 | assets/interiors/base-v1/teahouse.webp | 旧方式のフォールバック |
| 木床4×4 | assets/interiors/prototypes/teahouse-wood-floor-4x4-preview.png | 未承認。継ぎ目・ピクセル密度要検査 |
| 漆喰壁 | assets/interiors/prototypes/plaster-wall-32-candidate.png | 候補。接続とトップビュー適合要検査 |
| 腰板 | assets/interiors/prototypes/wood-wainscot-32-candidate.png | 候補。接続要検査 |
| 柱 | assets/interiors/prototypes/pillar-32x160.png | 旧プロトタイプ。トップビューでは要再判定 |
| 分割柱 | assets/interiors/prototypes/pillar-repeat-v2-*.png | 候補。必要な箇所のみ利用 |
| 卓 | assets/interiors/prototypes/teahouse-table-dango-64x40.png | 旧寸法。新茶店2×2占有と別に再評価 |
| 地面 | assets/terrain/landscape-v3/road.png | 土間への再利用候補 |
| 旧茶店構造 | assets/interiors/structured-v1/teahouse.scene.json | provisional。旧座標・判定を移植しない |

## 追加が必要か確認する部品
1. 床: 木床の反復中心・境界、土間との切替、敷居。
2. 壁: 上辺、左右辺、角、建具接続。
3. 建具: 出入口、引き戸・障子（承認画像に存在するもののみ）。
4. 家具: 採用トップビューの卓2×2、腰掛け2×1、茶器など。既存画像からの加工を先行。
5. 遮蔽: 32pxセル外へ張り出す物体のみ前景分割。

## 次の実装ゲート
1. 実際の茶店描画コードと承認画像を比較し、占有マス・配置・出入口を確定する。
2. 各候補の寸法・透過・色・接続を検査し、再利用／加工／新規制作を分類する。
3. 必要な新規素材のみ asset-design のカテゴリ別テンプレートに基づき制作する。
4. 1室の表示、衝突、NPC、会話、出入口、セーブ復帰を検証する。
5. Pages公開を確認した後に実機確認・承認を受ける。承認前はmainにマージしない。


## PNGヘッダ実測（2026-10-25）
GitHubのバイナリ本体を読み、PNG IHDRを確認。**画像の見た目・シーム・透明画素は未検査**。
| 画像 | IHDRサイズ | 色形式 | 用途判定 |
| --- | --- | --- | --- |
| teahouse-wood-floor-4x4-preview.png | 128×128 | indexed / 2bit | 4×4タイルの寸法に適合、配色と繰返し要確認 |
| plaster-wall-32-candidate.png | 32×32 | RGB / 8bit | 壁候補。透明素材ではない |
| wood-wainscot-32-candidate.png | 32×32 | RGB / 8bit | 腰板候補。透明素材ではない |
| teahouse-table-dango-64x40.png | 64×40 | RGBA / 8bit | 透過形式。占有2×2との整合を要確認 |
| pillar-32x160.png | 32×160 | indexed / 8bit | 旧縦長柱。新トップビューには直接採用しない |
| pillar-repeat-v2-top-32.png | 32×32 | indexed / 8bit | 分割柱候補 |
| teahouse-back-wall-clean-256x96-v2.png | 256×96 | indexed / 8bit | 8×3タイル相当だが一枚壁。切断・接続検査が必要 |

## 旧試作コードの具体的な問題
`js/interior-native-debug.js` の `W=10,H=8,S=32` はセル構成として利用可能。
ただし `YK_LANDSCAPE.drawQuarter` と `YK_LANDSCAPE.project`、`elevation`、1.5倍の画面変換を使うため、新しい正投影トップビューをそのまま満たさない。
`blocked` は四卓の左上セルを起点に横2セルのみ占有しており、採用トップビューの卓2×2と食い違う可能性がある。
床の画像ロード失敗時は単色矩形へフォールバックするが、制作規約では単色ブロックを完成画として採用しない。
新規共通描画は `YK_LANDSCAPE.drawQuarter` を転用せず、独立した32pxセル座標のレンダラとする。

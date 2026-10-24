---
name: hizuki-walk-assets
description: Generate, repair, audit and integrate Hizuki character illustrations and four-direction walking sprites. Use for missing walk poses, contralateral arm corrections, pixel-art variants, transparency, foot anchors and character art switches in yaksha-hanamusubi.
---
# 緋月の歩行素材

## 固定条件
- 対象を HiHoSir/yaksha-hanamusubi の main に限定する。凍結リポジトリを参照しない。
- 水色ショートボブ、中央の金角1本、赤桃色の瞳、約2.5頭身、左右対称の赤白旅装、中央帯飾り、つま先が隠れる短靴を維持する。
- 髪の跳ね方や小さな衣装差を許容する。腕と脚の対応を優先する。
- 32pxの移動格子・1マスの衝突領域と、58pxの表示身長を分離する。移動やセーブの仕様を変えない。

## 元画像と承認を確定する
1. 既存画像を検索して再利用する。ファイル名だけで採用を判断せず画像とSHA256を照合する。
2. `assets/characters/hizuki/bluebob-v1/manifest.json` と `docs/hizuki-bluebob-v1.md` を読む。ここにイラスト採用版の出典と配置がある。
3. 元絵を保存し、生成・修復候補は別名にする。「合ってる」というユーザー承認を後の清書で上書きしない。
4. 追加生成は不足ポーズか具体的な修正箇所に限定する。直す必要のない顔・脚・衣装を再設計しない。

## 歩行の前後関係を指定する
- 7基本ポーズを用意する：正面直立/A、背面直立/A、右直立/A/B。
- 正面と背面のBをAの反転で作る。左3枚を右3枚の反転で作る。
- 「右手」「左足」だけに依存しない。画面の前後とカメラ手前/奥を明示する。
- 肩から袖、手、腰から膝、靴までつなげて同じ側の手足を特定する。手の画面位置だけで判定しない。
- 右向きBでは、カメラ手前の腕を前（画面右）、手前の脚を後ろ（画面左）。奥の腕は後ろ、奥の脚は前。Aは逆にする。
- ユーザーが「腕だけ直せば使える」と言ったら、脚の交差・靴・顔・頭身を固定し、腕と袖だけ修正する。
- プロンプトだけで正しさを保証しない。出力と反転後の輪郭・交差を目視で検査する。
- [references/prompts.md](references/prompts.md) の再利用用指定を使う。これは検証済み関係を文章化したテンプレートで、過去の完全一致プロンプトではない。

## 素材を監査・配置する
1. 寸法、RGBA、透明/半透明/不透明の分布、輪郭の青赤にじみ、身体の透けを測る。黒いプレビューを黒背景と断定しない。
2. `.agents/skills/image-cutout-and-repair/SKILL.md` を読み、色キーで髪・衣装を削らず外側背景と身体を分離する。
3. 頭身と縦横比を保ち、足元中央を合わせる。HD版は256pxセル、可視高232px、足元(128,248)。実表示58px。
4. 12セルを列A/直立/B、行正面/背面/右/左で配置する。反転で足元xが1pxずれる場合も実際のブーツ底で確認する。
5. 元寸法・58px・アニメの3通りで確認する。NPC、遠景、橋、坂、建物の重なりを確認する。
6. ドット版は別アセットにし、nearest-neighborで扱う。64pxセル・可視高58px・足元(32,62)を使う。通常版の選択とセーブを保つ。

## 実装・反映
- 旧素材を削除せず設定で比較できるようにする。歩行の見た目選択を装備能力や戦闘素材に結びつけない。
- `.agents/skills/github-artifact-delivery/SKILL.md` と `skills/github-image-atlas/SKILL.md` に従いバイナリを実転送する。
- mainの最新HEADを確認し、更新リースを使う。PNGの実体・コード参照・Actions・Pagesを別々に確認する。
- テストは12セル、方向、58px、足元、新旧切替を確認する。設定画面を開いてからselectを操作する。状態比較から自然増加するplaytimeだけを除く。
- CI成功を手足の美術的正しさやiPhone Safari検証済みと混同しない。実機未確認事項を明示する。

## 現行SDの優先契約（2026-10-25）
現行SDは承認済み候補3 field-sd-v2/walk-atlas-32.png。上記の旧HD用2.5頭身・58px・A/静止/BをSDへ適用しない。SDは32px、列 静止/A/B、行 正面/背面/右/左。両側歩行を使う。制作前に [共通手順](../asset-design/references/low-resolution-graphics.md) を読み、断片混入・白目・方向別全体高・足元・村とロードを含む全参照を確認する。輪郭は js/sprite-outline.js の外側1pxキャッシュ処理を使い、カメラや本体サイズを変更しない。

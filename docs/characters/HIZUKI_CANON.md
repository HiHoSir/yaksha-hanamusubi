# 緋月 正式デザイン正本（2026-10-17）

**現在の正式な緋月は、フィールドで使用中の水色ショートボブ。** 旧紫髪・旧長髪・旧夜叉姫画像を新素材の外見参照にしない。

## 正式な外見
- 水色（シアン／ライトブルー）のショートボブ、フィールドと同じ頭身と髪の跳ね
- 額の中央上に金色の一本角、赤桃色の瞳
- フィールド画像と一致する赤白の和風旅装、中央の帯飾り、黒系短靴
- 旧大きな赤い髪リボンの勝手な追加は禁止

## GitHub正本
- [水色ボブ歩行アトラス](../../assets/characters/hizuki/bluebob-v1/walk-atlas-256.png)
- [素材manifest](../../assets/characters/hizuki/bluebob-v1/manifest.json)
- [実装寸法・採用記録](../hizuki-bluebob-v1.md)

## 2026-10-15の設定資料（Libraryで画像実体を確認済み）
ChatGPT Library `/新生鬼哭の花契り/` に以下が保存されている：
- `ヒヅキ キャラクターデザイン設定画.png`：正面、表情、配色、各方向
- `水色髪の金角巫女少女・四面図.png`：前・後・左右の大型参考。輪郭の色残りがあるため完成スプライト扱いしない
- `hizuki_audit_contact.png`：素材監査資料

**上記のLibrary画像はまだGitHubにアップロードできていない。** 回収済み設定画を新規生成で作り直さず、転送経路が整い次第保存する。

## 旧資料（歴史資料・非正本）
- `docs/production-bible/assets/hizuki_character_sheet.webp`
- `docs/production-bible/assets/hizuki_reference_approved.jpg`
- `assets/characters/yashahime/**` と紫髪の旧バトルスプライト

旧素材は互換性のため残す。ゲームの戦闘描画が旧素材を参照していても、正式キャラクターデザインが旧版という意味ではない。参照を調査せず削除・移動しない。

## 戦闘素材
[戦闘構図仕様](../battle/battle-visual-direction-v1.md)に従い、左手前に水色ボブの斜め背面の全身立ち絵を配置する。現行 `js/game.js` は `battle-v2/{idle,windup,strike}-pixel.png` を描画し、足元アンカーを固定している。オープニングのデザインと整合させる際も、少数の動作差分と演出を使い、現行フィールドの顔・衣装・角・体格を維持。新スプライトは別パスで制作し透過、アンカー、実機QA合格後に旧バトル参照から切り替える。

このファイルを全ドキュメント・画像生成プロンプトの単一正本として扱う。
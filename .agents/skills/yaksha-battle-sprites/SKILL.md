---
name: yaksha-battle-sprites
description: Create current cyan-bob Hizuki battle-only sprites preserving field art and legacy runtime until tested migration.
---
# 緋月 バトル専用スプライト
- 制作前に`AGENTS.md`、`.agents/skills/asset-design/SKILL.md`、`docs/characters/HIZUKI_CANON.md`、`.agents/skills/github-artifact-delivery/SKILL.md`、`.agents/skills/battle-debug-qa/SKILL.md`を読む。
- 唯一の外見正本は**現行フィールドの水色ショートボブ**。金角一本（額中央上）、赤桃の目、赤白旅装、頭身、帯飾り、短靴を保つ。現在の`bluebob-v1`アトラスと10月15日の回収済みLibrary設定画を照合。
- 旧`assets/characters/yashahime/**`は未移行の戦闘互換／履歴資料。紫髪、巨大な赤髪リボン、旧衣装、星屑衣装を新作に持ち込まない。
- 既存ゲームの旧バトル参照を未検査の新画像で差し替えない。フィールド移動画像やセーブは変更しない。
- 画面左手前の**背面〜斜め背面バストアップ**を基本に、少数の差分と演出で待機・攻撃・術・被弾・防御・勝利を表現する。上半身アンカー、輪郭、真正RGBAを検査。
- BATTLE DEBUG、実戦、Actions、Pages、iPhone Safariを独立にQA。承認とGitHubバイナリ転送完了を混同しない。

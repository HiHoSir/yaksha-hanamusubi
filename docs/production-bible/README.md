# 鬼哭の花契り — AI制作バイブル
最終更新: 2026-10-10。対象: グラフィック生成、イベント・シナリオ改稿、実装・検査。
## 権威順位
1. 最新のユーザー明示決定
2. 承認済みの画像・参考資料（ただし版と用途を明記）
3. 本バイブルの「確定」設定
4. GitHub main の現行実装（現在の振る舞いを記述するが、正式設定と同義ではない）
5. 提案・未確定事項
矛盾時は勝手に統合せず、差分を記録する。
## 使用手順
制作前に本READMEと該当するバイブル、既存のゲーム素材を参照。新規提案は「提案」と明記。画像は輪郭・角・方向・衣装・背景透過を検査。シナリオは現行js/data.jsの進行順・セーブ互換を保つ。変更後は局所QA + タイトル入口検査。
## 収録
- CHARACTER_BIBLE.md — 主人公・NPCと外見/声のルール
- SCENARIO_BIBLE.md — 章の進行、伏線、改稿の約束
- WORLD_BIBLE.md — 世界設定と地理
- STYLE_GUIDE.md — 画風・文章・色と音
- ASSET_GUIDE.md — スプライト・背景・遮蔽・変異種
- EVENT_DESIGN_RULES.md — イベント/オブジェクトの動作
- UI_UX_RULES.md — iPhone Safari 操作
- PROMPT_GUIDE.md — AI生成テンプレートと品質ゲート
- CHANGELOG_POLICY.md — 承認/変更/互換性
## 基準資料
`CHARACTER_RULES.md`, `js/data.js`, `js/settlement.js`, `AGENTS.md` および同リポジトリの関連スキル。ROM由来画像・音源を公開成果物へ転用しない。

# Story Event Flags Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** 自由探索を保ち、6イベントの会話・報酬を前提フラグで制御する。
**Architecture:** story-events.jsが完了・前提・会話選択・移行を管理。data.jsに固定IDと会話を置き、save.jsとgame.jsが同じ規則を呼ぶ。
**Tech Stack:** JavaScript Canvas game, Node VM tests, GitHub connector.
**Spec:** docs/superpowers/specs/2026-10-23-story-event-flags-design.md

## Global Constraints

- BETA16.1.22。探索・移動・地形・既存所持品は維持。
- フラグなし旧セーブのquestを尊重する。報酬は再付与しない。
- 改善ブランチ、Pagesプレビュー、ユーザー承認、mainの順。

## Review Focus

- 読了前の保存・再開で進行しないこと。
- 2回目のコールバック・会話で報酬が重複しないこと。
- フラグの欠落・不正型・未来の単独フラグでイベントを飛ばせないこと。
- ボス勝利後、会話前に再開しても再戦しないこと。
- 通常NPC・店・宿・マップ進入の機能が変わらないこと。

### Task 1: 進行規則と会話

Files: js/story-events.js, js/data.js, qa/story-events-unit.cjs.
Interfaces: restore(state,story,raw), resolve(state,story,speaker,fallback), match(state,story,speaker), complete(state,event,stage,story), recordBattleWin(state,story,battleId).

- [ ] 実データ6イベントで先回り、前提、読了、再実行、全順序、ボス勝利の失敗テストを書く。
- [ ] `node qa/story-events-unit.cjs`でREDを確認。
- [ ] 固定ID・前提・前後会話と純粋な進行規則を実装し同テストでGREENを確認。

### Task 2: 保存と本編接続

Files: js/save.js, js/game.js, qa/save-compat-unit.cjs, qa/story-action-unit.cjs, .github/workflows/boot-smoke.yml.
Interfaces: Task 1のrestore/resolve/completeを利用。

- [ ] 旧セーブの0〜6段階、通常保存・スロット、不正フラグ、実際のaction/endBattleのテストを追加しREDを確認。
- [ ] freshにstoryFlags、migrateにrestoreを接続。actionでresolveし、endBattleで勝利を保存。
- [ ] 会話終了時だけcompleteし、自動保存。フラグからquestと目的地を復元。
- [ ] story/save/interaction/dialogue/boot/build/既存マップの検査を実行しGREENを確認。

### Task 3: 登録と確認

- [ ] BETA/cacheタグを16.1.22へ揃える。
- [ ] 最新mainとの差分を照合、独立レビュー、関連検査、GitHubのtree/hashを確認。
- [ ] 改善ブランチにコミットしてPRを作り、CIを確認。Pagesの手動実行値をコピー可能な形で提示。

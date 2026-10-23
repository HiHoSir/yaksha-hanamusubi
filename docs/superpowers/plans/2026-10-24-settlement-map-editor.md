# Settlement Map Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 24種類の素材を配置・検査して一枚背景PNGと判定JSONを出力する里マップエディタを作る。
**Architecture:** 既存の室内エディタは変更せず、新規ページと小さな独立モジュールで実装する。描画・編集モデル・試し歩きが同じ明示占有データを参照し、本編へは統合しない。
**Tech Stack:** Vanilla HTML/CSS/JavaScript, Canvas2D, Node node:test。
**Spec:** docs/settlement-map-editor-spec.md

## Global Constraints
- 基点 main 74234d9d038a9c0b65fdda39fd4fe2a69e5abdc8、改善ブランチ improve/settlement-map-editor。
- 32pxセル、初期17×15。原点(0,0)。全体の表示倍率は地面・素材・キャラへ共通適用する。
- occupiedTilesは直接記述した整数セル列。PNG寸法・alphaから推測しない。
- 緋月は現行SD、可視全体28px以内、方向ごとのunion bounds。背景PNGにキャラ・検査色を含めない。
- main、既存室内エディタ、本編セーブ、フィールド用タイルは変更しない。
- 作成済み24素材を再利用。地形断片は自動接続未検証と表示する。新規画像生成はしない。

## Review Focus
- 不正JSON・未知素材・巨大寸法を拒否しても編集内容を失わないこと → Task 1。
- サイズ縮小で物体・判定・入口が範囲外になる場合、黙って削除しないこと → Task 1。
- 複数マス物体、橋、水上の手動判定、入口接近セルを同じルールで扱うこと → Task 1/3。
- タップ操作、ドラッグ終了の取りこぼし、ズーム後の座標、選択とパンの競合 → Task 2。
- 保存容量不足、画像未読込、歩行中の編集、非表示タブからの復帰 → Task 2/3。

---

### Task 1: 明示セルの編集モデルと安全な入出力
**Files:** Create js/settlement-map/model.js, js/settlement-map/catalog.js, qa/settlement-map-editor.test.cjs。
**Interfaces:**
- catalog exports templates[{id,src,displayCells,occupiedTiles,entranceLocal,approachLocal,kind}]。全セル列を素材ごとに記述し、描画寸法から生成しない。
- model exports createMap(width=17,height=15), validate(map,catalog), place(map,templateId,x,y), resize(map,w,h), collision(map,catalog), path(map,from,to), serialize(map), parse(text,catalog)。
- map schema: version=1,tileSize=32,width,height,background,terrainBlocks,terrainPassages,objects[{id,templateId,x,y,occupiedTiles}],entrances[{id,marker,approach}],spawn。

- [ ] **Step 1:** testsを先に作る。createMap()の17×15/32、4〜96の寸法制限、明示占有重複、整数/境界、不正JSON/未知素材、不正出現点、原子的なparse失敗、縮小拒否、JSON往復をassertする。
- [ ] **Step 2:** node --test qa/settlement-map-editor.test.cjs を実行し、モジュール未実装によるFAILを確認する。
- [ ] **Step 3:** catalogとmodelを実装。更新は検証成功後に新状態を返す。歩行可否とBFSはcollision()の結果のみを使う。
- [ ] **Step 4:** 同コマンドで全PASS。空占有、横2セルの橋、手動の川の通行不可、terrainPassages（橋などの明示通行セル）がterrainBlocksだけを解除し、物体のoccupiedTilesを解除しないケースを追加する。
- [ ] **Step 5:** 変更差分を検査して改善ブランチへコミット。mainは変更しない。

### Task 2: 素材配置UIとPNG/JSON保存
**Files:** Create settlement-map-editor.html, js/settlement-map/editor.js, js/settlement-map/render.js, assets/settlement-editor/chips/*.png, qa/settlement-map-export.cjs。
**Interfaces:**
- render.draw(ctx,map,{grid,collision,selection,actor,forExport})。export時は背景と素材だけを描く。
- editor consumes Task 1 model/catalog。入力座標はcanvasの実寸と表示rectから一度だけ変換する。PNG読込完了を待って出力ボタンを有効化する。
- editor storage key: yaksha.settlementEditor.v1。自動保存、Undo/Redo、JSON入出力、PNG出力、サイズ変更。

- [ ] **Step 1:** exportテストを先に作る。17×15のPNGが544×480、画像レイヤー順、透過保持、grid/選択色/判定色/actorの非混入をassertする。画像未読込時の出力拒否も固定する。
- [ ] **Step 2:** 未実装によるFAILを確認する。
- [ ] **Step 3:** 24種類をパレット表示し、配置・選択・移動・複製・削除・明示占有セル/入口接近セルの編集、ズーム、パンモードを実装する。地形断片に未検証表示を付ける。任意背景PNGは縦横比を保ち、JSONへ再読込可能な形で保存する。
- [ ] **Step 4:** Undo/Redoは地図全体のコマンド単位で管理。importとresizeも対象。保存失敗を表示し、成功したと偽らない。pointercancel/lostcapture/blurで操作を確実に終了する。
- [ ] **Step 5:** node --test qa/settlement-map-editor.test.cjs と node qa/settlement-map-export.cjs をPASSさせる。native32px・ズーム表示の書き出しを目視確認する。配置色を完成素材に使わない。
- [ ] **Step 6:** 改善ブランチへ24個の実PNGを登録し、ローカルGit blob SHA・サイズとリモートtreeを照合。コード参照先が全て存在することを確認する。

### Task 3: 到達検査とSD緋月の試し歩き
**Files:** Create js/settlement-map/walk.js, qa/settlement-map-walk.cjs; extend editor.js/render.js。
**Interfaces:**
- walk.create(map,collision) returns start(dx,dy,now),tick(now),walkTo(cell),hold(dx,dy),release(),reset(cell),sample(now)。
- 4方向一歩144ms、移動開始前に到着セル判定。sampleは補間表示だけを返し、整数の確定位置と混同しない。
- 検査結果は各入口approachの到達可否・占有の不備・出現点の不備を区別してUIへ表示する。

- [ ] **Step 1:** 壁への一歩拒否、斜め拒否、連続4方向歩行、通路幅1セル、入口接近セル、孤立セル、橋の通行、移動中に編集した場合の停止をテストとして先に書く。
- [ ] **Step 2:** walk.js未実装のFAILを確認する。
- [ ] **Step 3:** 試し歩き・到達塗り分け・タップ経路・十字キーを追加。実SDアトラスを再利用し、方向ごとに12フレームのalphaを検査してセル内収容を確認する。画像読込失敗は代替キャラを出さずエラー表示する。
- [ ] **Step 4:** node qa/settlement-map-walk.cjs と全モデル/出力テストをPASSさせる。グラフの連結検査と画像上の道幅/接地の目視確認を別項目として記録する。
- [ ] **Step 5:** 改善ブランチへコミット。背景PNGとJSONを実際に書き出して再読込し、配置・占有・出現点が維持されることを確認する。

### Task 4: 隔離公開と実画面確認
**Files:** Create docs/qa/settlement-map-editor.md。必要時のみ既存プレビュー登録方式を利用。mainの許可リスト変更や本編統合は承認なしに行わない。
**Interfaces:** exact commit SHA → Actions deployment → 実PagesのHTML/JS/PNG → ブラウザ操作 → user iPhone Safari QA。

- [ ] **Step 1:** 最新mainとの変更範囲を確認し、既存室内ページ・本編・セーブに差分がないことを記録する。
- [ ] **Step 2:** 既存の改善プレビューを公開し、対象SHAのHTML/JS/PNGと公開バイトを照合する。workflow_dispatch手段が使えなければ公開未完了と報告し、ソースコミットのみで公開済みとしない。
- [ ] **Step 3:** 実ブラウザで24素材読込、タップ配置、ズーム、パン、移動/削除、Undo/Redo、resize拒否、JSON往復、PNG出力、試し歩きを確認する。
- [ ] **Step 4:** Pages検証後に限りiPhone Safariの実機確認を依頼する。計画・実装・自動テスト・公開・ブラウザ・実機の状態を個別に報告し、main統合は別の承認を待つ。

# SDD ledger — plan: docs/superpowers/plans/2026-10-24-settlement-map-editor.md
Baseline: main 74234d9d038a9c0b65fdda39fd4fe2a69e5abdc8; improvement plan commit bbdbf9ae39b93a899e34bba42dac4e49f7c630f8.
Execution: native, approved by user.
Ruling: use a scoped connector-backed workspace, not a synthetic local git repository — the authoritative improvement branch is remote and no checkout exists; local git task scripts do not apply. Cost: remote SHA/tree checks and ledger replace local git helper bookkeeping.
Pre-flight Task 1→2: model/schema and catalog are consumed directly by editor/render. Task 1→3: collision/path are the only walk rules. No interface conflict.
Ruling: bridge passages remain explicitly painted cells, not automatic sprite-derived passability. Cost: bridge placement requires marking passage cells.
Task 1: complete locally; node --test qa/settlement-map-editor.test.cjs → 12/12 PASS (initial missing-module RED observed).
Task 2/3: export and walk tests initially RED; core render/walk implementations now PASS. UI wiring pending.
Task 2/3: source implementation complete locally; combined feature suite 21/21 PASS, 0 failures. 25 PNG blobs uploaded with exact SHA checks, remote tree registration pending.
Ruling: commit Tasks 2 and 3 atomically — the editor directly uses walking modules; publishing them together avoids a broken intermediate entry point. Cost: less granular commit separation, separate tests remain.
Final review: fresh read-only reviewer, gpt-6-astra. Five Important findings plus multi-pointer Undo risk reproduced before fixes.
Final: fixed startup mutation lock and failed-save preservation — 2 wiring tests RED→GREEN.
Final: fixed free-standing exit selection/deletion — wiring regression RED→GREEN; entrance list and marker edits added.
Final: fixed building approach adjacency — model regression RED→GREEN. Marker movement translates its approach to retain adjacency.
Final: fixed native background clipping on resize — canvas landmark regression RED→GREEN.
Final: regraded multi-pointer stroke ownership as Important (mobile Undo loses part of the command); wiring regression RED→GREEN.
Final: minor (deferred): visibility/blur releases held keys but queued tap route resumes after return. No real browser scheduling check performed.
Final: tests now include editor wiring at a fake browser I/O boundary; these are unit tests, not actual browser QA.
Final declined-to-judge rulings: visual art/seams remain candidates, terrain warns that auto-tiling is unverified; actual browser/Safari and hidden-tab scheduling remain unverified; publication is a separate gate; game integration is intentionally outside scope. Cost: tool needs live-page/device testing before merge/use as a production guarantee.
Task 4: BLOCKED for publication/browser/device QA. Connector exposes no workflow_dispatch action. Local Playwright browser unavailable; official browser download failed. Cloud browser explicitly rejected file://; no workaround attempted.
Task 2/3: remote complete at 4459106f447d31b8f0b442e2f8136fe7d9623ac1. All 39 delivered source/test/doc/PNG files match local SHA and byte size; 25 PNGs present. Diff against main is restricted to editor assets/modules/page/tests/spec/QA; production files unchanged.
Task 4: public Actions workflow page verified. Browser is signed out and has no Run workflow control; no login or credential probing attempted. User-side manual dispatch on main with source_branch=improve/settlement-map-editor is the verified remaining publication step. Improvement branch is retained; no merge approved or performed.
# sm-2 接地配置・可変グリッド更新（2026-10-24）

既存ブランチecdeaa05を更新。接地左下座標、木1セル・小住宅3セルなど明示接地占有、下辺描画、深度ソート、version1読込移行、縦横4〜96セルと1マス16〜64px、地面PNG出力を実装。31検査PASS。元PNG25点は変更なし。詳細は docs/settlement-editor-contact-placement.md。

# sm-3 店の建物・入口更新（2026-10-24）

a1151c03から更新。宿を原型に看板だけ「店」へ変更し、160×96px・描画5×3・接地5×2・中央入口へ統一。旧sm-1/2の標準店舗入口・接近セルを移行。茶店ほか既存PNGは維持。36件PASS。詳細 docs/settlement-editor-building-signs.md。Pagesは新しい公開ワークフロー実行が必要（前回の同一run再実行ではartifact重複が生じたため繰り返さない）。

# sm-4 スマホ操作更新（2026-10-24）

c14b0cbbからUIのみ更新。操作・倍率・入口のプルダウンを直接ボタン化。狭い画面／タッチ入力では素材・選択中・保存設定・歩行を下部から開くパネルに変更。移動・複製の物体未選択時の誘導を追加。40検査PASS（新規DOM統合4件）。画像・判定・保存形式は維持。詳細 docs/settlement-editor-touch-ui.md。Pages・ブラウザ・実機検査は未実施。

# sm-5 村用地形更新（2026-10-24）

04f427f8から更新。全面32px・二列6株の畑、村用草地、47パターンずつの道と川、縦横2セルの橋を追加。なぞる配置・4方向補間・1ストロークUndo・川と橋の自動通行判定に対応。50検査PASS。共有辺4,096組の全画素一致、橋の移動・削除時の判定復元も確認。docs/settlement-editor-autotiles.md参照。Pages・実機は未検査。


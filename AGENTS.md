# 鬼哭の花契り — Project agent instructions

This repository contains reusable task skills in `.agents/skills/`. Read relevant SKILL.md files **before** coding, creating images or changing deployed assets.

## 新規・再制作マップの共通基準（2026-10-23）
- 屋内・村・フィールドなどの探索マップを新規作成／再制作する際は、最初に [共通マップ制作規約](docs/topview-map-standard.md) と [asset-design](.agents/skills/asset-design/SKILL.md) を読む。生成には [トップビュープロンプト](.agents/skills/asset-design/templates/topview-map-prompt.md) を使う。
- 採用基準は正投影トップビュー、32pxマス、SDキャラの可視全体を原則28px以内でセル中央へ配置、上下左右のセル単位移動、明示した整数 `occupiedTiles`。前景分割は実際に張り出して遮蔽が必要な物体だけに使う。
- この対象では、下記や旧資料の「室内約58px」「足元をマス中央」「旧base-v1の構図・斜め視点を維持」「常に建築3分割」より新規約を優先する。外見の正本は維持する。既存マップ・戦闘・セーブを規約登録だけで自動移行しない。
- 歩行範囲のみを修正する依頼では、家具・椅子の配置、部屋寸法、床の行数を維持する。奥の家具の手前の床など、空いている接近セルの不要な通行不可を直す。間取り変更へ読み替えない。
- トップビューの基準画像は `design-reference/maps/topview-v1/cyamise-approved.png`。旧内装資料は配色・世界観の資料として使い、新しいカメラを旧パースへ戻さない。

## Skill registry
| Work | Skill |
| --- | --- |
| New/rebuilt exploration maps: top view, SD cell movement and collision | [共通規約](docs/topview-map-standard.md) + [asset-design](.agents/skills/asset-design/SKILL.md) |
| GitHub binary uploads, commits, CI, deployment | [github-artifact-delivery](.agents/skills/github-artifact-delivery/SKILL.md) |
| Hizuki walking illustrations, limb corrections and pixel variants | [hizuki-walk-assets](.agents/skills/hizuki-walk-assets/SKILL.md) |
| High-resolution enemy sprites (intact/worn) | [battle-enemy-hd-assets](.agents/skills/battle-enemy-hd-assets/SKILL.md) |
| Background removal and alpha/outline repair | [image-cutout-and-repair](.agents/skills/image-cutout-and-repair/SKILL.md) |
| Battle screen and mobile QA | [battle-debug-qa](.agents/skills/battle-debug-qa/SKILL.md) |
| Yaksha-hime battle poses and outfits | [yaksha-battle-sprites](.agents/skills/yaksha-battle-sprites/SKILL.md) |
| Interior object layers, occlusion and floor footprints | [interior-occlusion-layers](skills/interior-occlusion-layers/SKILL.md) |
| Terrain heights, ramps, diagonal cliff corners and collision | [terrain-elevation](.agents/skills/terrain-elevation/SKILL.md) |
| Field/mapchip artwork and terrain | [field-mapchip-art](.agents/skills/field-mapchip-art/SKILL.md) |
| New tile, floor decoration, furniture or architecture generation preflight | [asset-design](.agents/skills/asset-design/SKILL.md) |
| Isolated private internal validation site | [sites-private-debug](.agents/skills/sites-private-debug/SKILL.md) |
| Proven image-to-GitHub binary transfer, atlas and main commit | [github-image-atlas](skills/github-image-atlas/SKILL.md) |
| Paired intact/worn enemy preprocessing and atlas build | [enemy-atlas-pipeline](skills/enemy-atlas-pipeline/SKILL.md) |

## Standing rules
- **Beta-first integration policy:** This is an actively playable beta. Implement accepted features and improvements in the actual main game by default, not only in isolated demos, previews or labs. Use a demo-only approach only for a concrete reason (e.g. risk to save data, incompatible controls, unapproved art, technical uncertainty requiring isolation); explicitly state that reason and what is not yet integrated. Before reporting completion, verify the main game's real entry point, asset references, rendering path, and relevant tests. A successful demo alone is never evidence of main-game integration.
- **Mandatory version bump for every change:** Every change committed to `main`, however small (code, assets, documentation, configuration, or QA fixes), MUST update the displayed BETA version and all corresponding HTML asset cache-busting query versions in `index.html` in the same delivery. Never report a change as delivered without a version bump; confirm the new version and commit SHA. If changes require separate commits, complete the version bump before reporting delivery.
- **現行緋月の単一正本（2026-10-17）:** `docs/characters/HIZUKI_CANON.md`。正式外見は現行フィールドの水色ショートボブ（`assets/characters/hizuki/bluebob-v1/walk-atlas-256.png`）。現行フィールド・鬼灯村の実表示は採用済み候補3のSD版 `assets/characters/hizuki/field-sd-v2/walk-atlas-32.png`（`game.js` の共通足元・スケールを維持）。外見正本とフィールド用描画アセットを混同しない。旧紫髪・長髪の設定画、旧 `yashahime` 戦闘画像は歴史資料・移行待ち。新素材の外見参照に使わず、ゲームの既存参照はQAなしに削除しない。
- Repository: `HiHoSir/yaksha-hanamusubi`, production branch `main`. Preserve existing save data, maps, controls and game-start flow.
- For any game asset task, read **github-artifact-delivery** and the relevant art/QA skill together. Do not automatically ask the user to upload files manually; verify the actual remote PNG and commit before declaring implementation complete.
- For battle-only work, do not modify heroine field movement sheets, world tiles or unrelated enemy graphics.
- Battle sprites are not constrained to 128×128px. Use optimized independent high-resolution assets where appropriate; field mapchips retain their own 32×32px rule.
- Preserve originals, verify transparency/edges and intact/worn anchoring, avoid improvised runtime alpha corrections and duplicate shadows.
- Perform battle debug and actual battle checks when feasible; distinguish source checks, code tests, deployment and iPhone Safari confirmation.
- For private Sites/ROM research, do not release protected source graphics on public GitHub Pages.
- Report verified facts and unresolved blockers precisely; a successful source-code commit does not mean generated binary assets were transferred.

## Improvement branch policy (2026-10-21)
- For improvement tasks, create a dedicated branch from latest `main`; never directly modify `main` before user approval.
- Follow [improvement branch workflow](docs/improvement-branch-workflow.md) for conflict checks, preview isolation, merge approval, and separate QA gates.
- This improvement-specific policy overrides the older direct-to-main default below. The mandatory BETA/cache-version bump still applies when the approved change reaches `main`.

## GitHub branch and artifact handoff
- This project normally commits **directly to `main`** using the connected GitHub tools. Do not assume a pull request is needed.
- GitHub `create_file` / `update_file` on main create actual remote commits. Verify the resulting SHA on main.
- For asset changes, reuse conversation-uploaded or already-generated files before asking for uploads. Never repeatedly delegate GitHub commit/push to the user.
- For binary PNG/ZIP integration, read [github-artifact-delivery](.agents/skills/github-artifact-delivery/SKILL.md) and verify actual remote bytes before claiming completion.

## GitHub connection preference
- Use the connected GitHub tools for repository operations and confirm changes on main.
- Local DNS issues do not prove the GitHub connector is unavailable.
- Verify binary files exist remotely before reporting successful asset deployment.

## Reusable verified image delivery
- Before working on PNG/ZIP asset integration, read `skills/github-image-atlas/SKILL.md`, `skills/enemy-atlas-pipeline/SKILL.md`, and `.agents/skills/github-artifact-delivery/SKILL.md` as relevant.
- Reuse the proven Base64 Git blob -> tree -> commit -> fast-forward main -> verify workflow. When required, bridge encoded text via supported Library tools. Never conclude that DNS limitations prevent connector-based GitHub commits.
- Treat source files, uploaded binaries, runtime references, CI status, and mobile visual QA as distinct checkpoints. Preserve original source assets and record what is verified.


## Interior visual quality gate (mandatory)
- Finished game artwork must **never** use plain filled rectangles, geometric color blocks, or other primitive placeholder rendering in place of illustrated architecture or furniture. These are permitted **only** for explicitly labeled temporary debug/layout prototypes, not production presentation.
- The approved concept illustrations in `design-reference/interiors/base-v1/` are the visual canon. Preserve their palette, material texture, detail, and room-specific composition while rebuilding physically consistent room geometry.
- Floor/base architecture and separate foreground assets must be real illustrated art, with fixed original-canvas coordinates (or explicit exact crop offsets); maintain independent visual silhouettes, world-space depth anchors, and floor-contact footprints. Primitive polygons/rectangles are valid for non-visible collision and QA overlays only.
- Do not enable a redesigned interior in production until side-by-side character-scale and original-art comparison, clean re-composition, movement/collision/occlusion regression checks pass. Keep the approved original as runtime fallback until that point.
- Do not reuse earlier `tea-*.webp` / `tea-*.json` experimental scene data as if it matched `base-v1/teahouse.webp`; verify the artwork and coordinate alignment first.


## Mandatory tile and object asset production contract (read BEFORE generating)

These rules apply whenever the user requests a game **tile, floor decoration, furniture/object, wall, pillar, or asset revision**. They are binding whether the request uses Japanese terms such as 「タイル」「床板」「座布団」「踏み石」「オブジェクト」「柱」or an English equivalent. A generic image-generation request must not bypass the asset contract. Read this section and applicable skill files at the **beginning of every such task**, even across chat sessions. Never claim compliance without checking the actual output.

### 1. Classify before creating

Classify each deliverable into one category, then state the target footprint, image dimensions, viewpoint, transparency, connections, collision and occlusion rules before creating:

- **Terrain/floor tile**: continuous and repeatable walkable ground, such as road, wood plank flooring or tatami.
- **Walkable floor decoration**: an individual low item baked into the floor texture, such as a zabuton cushion, stepping stone or floor mat.
- **Independent object**: furniture/equipment such as a low table, shelf or counter, with an independent sprite, footprint and depth ordering.
- **Architecture**: pillars, walls, wall corners and doors, potentially assembled from base/middle/upper-dark image layers.

A footprint (world cells), a sprite's rendered pixel rectangle, its visual silhouette, its world-space foot/depth anchor, and its collision polygon are **different concepts**. Never infer collision from the PNG bounding box.

### 2. Mandatory common constraints

1. **1 map tile = 32×32 world pixels**. Enforce user-approved footprints such as 1×1 or 2×1 cells; a 2×1 footprint spans **64×32 world pixels**. Actual sprite height may exceed footprint for tall furniture and architecture.
2. Preserve approved character proportions and visual scale; test alongside the actual game protagonist (interior reference: approximately 58px tall, subject to game projection), not a newly invented character.
3. Match this project's current **actual** village/interior camera and art canon. For horizontal floors use top-down map-space art, not isometric perspective. Furniture/architecture must match the game's established apparent viewing angle; do not introduce unapproved oblique/isometric views.
4. Reuse the latest **approved** existing art and repository assets first. Do not repeatedly generate images merely to crop, resize, remove backgrounds, rotate or divide layers where deterministic editing would suffice.
5. Give game assets true RGBA transparency where needed; alpha must be real, **not a checkerboard or white/black painted background**. Trim unused margins, retaining exact anchor/crop-offset metadata, and preserve aspect ratio unless the approved tile specification deliberately uses another form.
6. Do not present a large unconstrained illustration/texture/specification poster as an approved gameplay asset. Concept images and debug diagrams must be labeled as such.
7. No plain filled-color rectangles, crude flat placeholder sprites or arbitrary primitive shapes as final visual game art. They may be used in **explicitly labeled debug/layout prototypes**, never reported as complete assets.
8. Treat image generation as a **source-art stage**, not evidence that a finished file matches exact dimensions, tiling or alpha constraints. Programmatically process and inspect it before declaring completion. Never assume a generator obeyed exact pixel dimensions.
9. Record which checks actually passed, what remains untested, and whether GitHub commit/Pages deployment/Safari QA really occurred. No made-up verification.

### 3. Terrain and repeating floor tiles (strict)

- Deliverable baseline: **individual 32×32px tiles**, or an explicit **128×128px sheet with 4×4 cells of 32×32px**, per the existing field-mapchip specification. When an alternative sheet is justified, declare tile grid/cell size and preserve exact cell boundaries. Do not substitute an arbitrary 1024px texture.
- Ground graphics are top-down, orthogonal, grid-aligned **late-SFC-style pixel art**, without unintended antialiasing or perspective distortion. Preserve the user's existing art canon.
- **Seamless, genuinely repeatable connections** are required for base flooring. Test top-bottom and left-right edge pixel continuity, including a 3×3 repetition preview. Plank lines, grain and knots must align without conspicuous boundaries or obviously identical repeating artifacts.
- For multi-piece autotiles, list roles explicitly (center, edge, corners, junctions/T/crossings as applicable), and test all permitted neighbor combinations. No feature may inadvertently cross a 32px cell boundary unless a documented multi-cell assembly defines it.
- Never generate arbitrary seams or plank offsets that do not connect at a cell edge. The repeated-floor behavior is more important than the beauty of a standalone large image.
- Do not add canvas padding, grid lines, labels or tile separators inside the exported production PNG.
- **Before approval**: inspect pixel dimensions, actual cell count, tile boundary continuity and repeated view at the intended game's native scale. If the source image cannot pass, correct deterministically or identify it as a **reference/rejected candidate**, not a finished tile.
- For a new floor, first check whether an existing repository tile (e.g. the village road) already meets the request. Reuse it rather than regenerate.

### 4. Walkable floor decoration

- Examples: green zabuton, horizontal low stepping stone, floor mat. The decoration is **walkable by default only if explicitly intended as such**; any elevation/transition rules are separate movement metadata.
- Use approved dimensions (e.g. cushion **1×1=32×32px**; low stepping stone **2×1=64×32px**). A high-resolution source may be larger but final ground tile composition must obey its target world footprint.
- Create a top-down/near-top-down sprite with **true alpha**, trim transparent padding, preserve proportions and place it within the specified footprint. A very low-profile stone should not become a raised furniture sprite.
- Prefer precompositing walkable decoration into the **floor/ground layer** before passing the surface to the existing village projection; do not sort it with actors or add fake collision/occlusion.
- The original transparent sprite should remain independently stored for reuse and editing; the baked ground is a runtime representation, not loss of source data.
- Use the same world-space placement system for decoration and ground; explicitly test walk-through and foot alignment.

### 5. Independent furniture and equipment objects

- Produce a transparent, trimmed sprite, with world footprint and rendered extent independently specified. A 2×1 table is **2 occupied ground cells**, even when its top silhouette overhangs the footprint.
- Explicitly define passability/collision from **floor contact**; approved teahouse table: **2×1 cells are blocked**. Other furniture may have a smaller contact footprint.
- Draw independent furniture and the actual protagonist/NPCs through the same **rendered-foot depth sort**, using the interpolated actor foot during movement. Do not change physical scale arbitrarily with screen position separately from the shared projection.
- Ensure the selected visual angle is consistent with the game camera; inspect front/back/side occlusion and contact shadows. Keep silhouettes, ground shadows and hitboxes separated.
- Never equate trimmed PNG edges with the collision shape; do not use a bounding rectangle image as a permanent replacement for finished art.

### 6. Wall/pillar architecture

- Prefer **3 compatible layers**: (1) ground-contact base, (2) continuously connected middle, (3) upper section fading/connecting into dark roof/ceiling. The dark top is **not a visibly exposed freestanding post top**.
- Ground contact determines collision. Middle/upper visual images do not gain collision merely because they are tall.
- The **visual joins** must share one image-space/world-space basis and maintain grain, contour, lighting, scale and offsets without cracks or double edges. A three-column explanation poster is NOT three separately usable RGBA assets.
- Pillar base: 1×1 tile as an initial footprint limit; confirm actual contact shape against movement tests. Scale total visual height against the real protagonist, rather than assuming a universal 160px or 256px.
- Wall pieces must connect horizontally, including straight middle units, left/right ends, inside/outside corners and door jambs. Verify each allowed connection at projected scale.
- Use depth/visibility consciously: **do not force upper dark portions to the foreground** if doing so hides characters excessively. Corner walls and intersecting structures may need independent depth sections.
- Teahouse path from dirt floor to raised timber uses the **approved stepping stone**. The rejected separate 「上がり框」 asset is NOT to be created.
- Follow `docs/interior-pillar-asset-standard.md`, `docs/interior-architecture-asset-standard.md` and `skills/interior-occlusion-layers/SKILL.md` for full geometry and QA requirements.

### 7. Mandatory preflight / acceptance checklist

**Before any generation or editing**
1. Read `AGENTS.md` and the appropriate art/occlusion/delivery SKILL.md, inspect currently approved reference sprites and renderer.
2. Identify category, target 32px-based tile dimensions and footprint, viewpoint, actual alpha requirements and whether the image must tile or connect.
3. Decide whether source regeneration is necessary; reuse/transform approved art when possible.
4. Write down passability, contact footprint, depth anchor and occlusion treatment where relevant.

**After generating, before presenting as completed**
1. Verify actual PNG/atlas dimensions and RGBA alpha; detect painted fake transparency, excess blank margins and clipped contour.
2. For tiles, verify grid, cell alignment, top/bottom/left/right edge joins and **a repeated multi-tile preview**. For connected architecture, verify part recomposition.
3. Place in an actual 32px-grid prototype beside the production protagonist, using current game camera, and check scale, contact and projected placement.
4. For independent objects/architecture, check contact-only collision and full-footstep blocking, front/behind occlusion, and actor visibility. For walkable floor objects, verify walking through without sorting them as tall sprites.
5. Report individually whether the **source image**, **game-ready PNG**, **repetition/composite check**, **GitHub asset commit**, **Pages deploy**, **browser QA** and **iPhone Safari device QA** have each been done.
6. If any gate is unverified, label the output **candidate / concept / prototype**, never completed or approved. If a required gate fails, fix it or explicitly stop—do not silently present a failed asset as final.

### 8. Explicit prohibited shortcuts

- Responding to a request for a **32×32 tile** with a large unsegmented repeating texture.
- Generating a nonseamless floor image and calling it tile-ready without repetition tests.
- Painting a solid background/checkerboard into an asset that requires genuine alpha.
- Delivering artwork from a camera angle inconsistent with the approved room.
- Ignoring the user's approved 1×1 / 2×1 world footprint.
- Calling crude colored placement rectangles complete artwork.
- Generating multiple speculative replacements where cropping/compositing the approved original would be sufficient.
- Calling a concept sheet or rough layer sample **finished three-layer sprites** without separate source files and verified joins.
- Claiming a file is integrated, the GitHub commit is deployed, or Safari passed without actually verifying those steps.

**If a request conflicts with an existing rule:** explicitly flag the exact conflict, propose a compatible modification, and request confirmation only where the user's intent cannot be resolved from project history. A user may override a default deliberately; do not override silently.


## Asset-design skill entry (mandatory)
- For any user-requested tile/object illustration, follow `.agents/skills/asset-design/SKILL.md` **before invoking image generation**. Use its category templates and preflight reuse decision. Never bypass its pre-generation contract just because the user says 'make it'.
- This repository skill is not guaranteed to auto-load in ordinary ChatGPT chats: explicitly read it each time. On compatible coding clients invoke `$asset-design`; in ChatGPT users may explicitly ask 'asset-design スキルに従って'.
- The validator is a structural support tool, not a replacement for the generation-time contract or gameplay QA. Use it for file metadata after deterministic processing.

## Mandatory image upload preflight
- For every generated PNG/ZIP GitHub delivery, **first read** `skills/github-image-atlas/SKILL.md` and `.agents/skills/github-artifact-delivery/SKILL.md`. The proven route is local PNG → Base64 `.b64` → temporary Library upload/read → GitHub `create_blob` (base64) → `create_tree` → `create_commit` → `update_ref` with expected head → remote SHA verification. Do not stop at a local-file access limitation or ask for manual upload before trying this workflow.
- After uploading, separately verify actual runtime asset references, Actions, Pages, and user-performed iPhone Safari QA. Do not conflate them.

## Mandatory field-object occupancy contract (32×32 movement grid)

This is a **hard rule** for every field-map object, including buildings, torii, trees, mountains, caves, and decorations:

1. Define blocking/contact occupancy **directly as explicit integer tile coordinates** (`occupiedTiles: [[tx,ty], ...]`) on the same 32×32 grid used by character movement. Multiple cells are allowed. Empty occupancy means passable.
2. **Never derive, round, infer, or quantize occupied tiles from sprite bounds, pixel coordinates, visual width/height, foot anchors, proportional rectangles, shadows, or image alpha.** Sprite dimensions and render position are visual-only.
3. Object placement and route/pathfinding must consult the **same explicit occupancy** as runtime collision. Never use a full sprite rectangle as an overlap prohibition. Occupied/contact cells must not overlap other occupied cells; visual images, especially mountains and crowns, **may overlap freely** with depth ordering.
4. Keep approved sprite dimensions, visual offsets, existing terrain, and authored coordinates unchanged unless the user explicitly requests a change. Place and inspect every occupied cell intentionally. Entrances and passable gaps must remain reachable.
5. New or changed field objects require validation for: integer/in-bounds occupied tiles; duplicate or overlapping occupied tiles; passable entry approaches; alignment of visible ground contact with occupied tiles; and no newly invisible walls. Test actual collision and routing. Do not treat a GitHub commit or successful Pages deployment as gameplay QA or Safari device validation.
6. Do not use a transitional pixel-footprint conversion as a substitute for explicit occupancy. If an existing object lacks authored occupancy, inspect the intended tile layout and add the explicit cells; do not guess based on image size. If the correct occupied cells cannot be established, report the unresolved object rather than silently fabricating them.

## Shared terrain elevation and diagonal-corner contract

For terrain height, ramp, cliff smoothing or diagonal-corner work, read `.agents/skills/terrain-elevation/SKILL.md` before editing. Preserve the 32px movement grid and keep materials separate from height. Use one world-space outline for elevated tops, straight/diagonal cliff faces, exposed lower ground and foot collision. Cut-off corner triangles and their boundaries are non-walkable from either elevation; check the full stride and adjacent cells at exact grid edges. Do not derive object `occupiedTiles` from those polygons or sprite bounds. Preserve valid ramp/entrance routes and show a straight-versus-cut comparison. The elevation lab is a comparison fixture; the main field uses the same geometry via `field-elevation.js`. Every subsequent height revision requires a route/save/camera audit. Record source tests, live-page checks, Pages and device QA separately.



## Future field assets and elevation handoff
Before making or placing any field mapchip/object, read `docs/field-elevation-assets.md` and the terrain-elevation skill. The adopted default removes approximately 45% of a convex tile corner (30px legs in a 32px cell); removed regions are forbidden. Keep tile material, height/ramp topology, cliff texture, object contact cells, occupancy and visual size independent. Test production routes and saved-position recovery on every terrain revision.

## 低解像度グラフィックの共通制作・検査
キャラ・NPC・タイル・オブジェクトを制作または再加工する際は [.agents/skills/asset-design/references/low-resolution-graphics.md](.agents/skills/asset-design/references/low-resolution-graphics.md) を読む。生成画像を正確な32px資産と見なさず、頭身・色面・実寸、切り抜き混入、方向共通アンカー、カテゴリ別検査、全実描画参照とPagesを確認する。

## 流動素材のアニメーション（2026-10-25）
- 水面・海・川・池・滝・炎など、流動を表す素材は原則最小限の2コマでアニメーションする。必要性が確認できた場合のみコマ数を増やす。
- 岸・石囲い・器具・接地・occupiedTiles・衝突・入口は固定し、水や火の見える領域だけを変える。複数マス素材は全体を同位相で切り替え、1素材として配置する。
- 原画の再生成より既存素材の加工を優先する。コマ切替で重い地面キャッシュや判定を再構築しない。海・川のタイル接続、静止時と移動時、非表示時、保存往復、Pages実体を検査する。静止PNG出力は1コマ目に固定する。

## 室内の左右外周壁（2026-10-25）
- 左外周の全行には左側壁、右外周の全行には右側壁を敷く。上下端・四隅も例外にせず、奥壁／手前壁で左右端セルを置き換えない。
- 奥壁・手前壁は左右外周の内側から配置する。左側壁はセル右側、右側壁はセル左側の既存8px帯を維持する。

## 室内の描画品質とサイズ（2026-10-25 ユーザー訂正）
- 室内の家具・装飾を1マス／2マスへ一律に押し込む制約は撤廃。部屋も既定の列行数を優先しない。32px移動グリッドは保ち、実際の村と緋月に合う見た目・比率・細部を先に決め、整数の占有を別途明示する。
- ムシロ／ゴザ・畳を均一な市松模様や2色の反復だけで完成扱いしない。繊維、織り、縁、微妙な材質差を実画像で確認する。
- 座布団に長椅子の切り抜きを流用するなど、別の物を似た色の代用品として登録しない。畳んだ布団は今回の室内配置から除外。
- 囲炉裏は最新指示により、真上から見た32×32px・1マス表示／1マス占有へ戻す。これは他の家具のマス数制約撤廃とは別の個別指定。四隅の柱・脚を付けず、床に埋め込む四方枠にする。炎は2コマを維持。
- 新しい原画だけを見せて改善済みと判断せず、実寸の室内＋緋月と村の見た目を比較する。

- ムシロは枠・太い縁で囲わず、切りっぱなしの敷物をつぎはぎする。中央と上下左右の端を基本とし、四隅は端を組み合わせる。部屋全体を縁付きの一枚物として強制しない。

- ムシロの正本参照はIMG_6724(2).pngの民家上半分の床。細かな整った編み目の敷物ではなく、粗い短い横方向の藁目、重ねた切り口の濃い不規則な継ぎ目で表す。参照画素は転用せず独自原画を使う。

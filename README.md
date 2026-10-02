# 夜叉姫の花結び奇譚 — β15.1 core

β15.1 switches 鬼灯の里 to a production 4-layer background architecture while preserving existing collision coordinates. Final background PNGs are not yet complete; missing layers intentionally fall back to the β15.1 procedural rendering.

See `assets/BACKGROUND_ASSET_SPEC.md` and `ASSET_STATUS.md`.

# 夜叉姫の花結び奇譚 — β12 core

ゲーム本体の修正版。β11で発生していた主人公スプライト参照不具合を修正。

## β12 core 修正
- 主人公の4方向スプライト参照を `down / left / right / up` 配列へ修正
- 3歩行フレームを正しく循環
- `white / navy` 衣装キーを `swimWhite / swimNavy` アセットへ正しく対応
- β11のゲームロジック・セーブ互換を維持

## グラフィックについて
現行グラフィックは最終採用ではありません。簡易SVG/Pillow素材は順次、専用の高品質ゲーム素材へ置換します。


## beta12.1 core
- NPC definitions centralized by area and role.
- Interaction now targets the nearest NPC instead of triggering one area-wide dialogue from anywhere.
- Female NPC role uses its own asset key and is intentionally kept distinct from Yasha-hime.
- Hot-spring keeper uses the dedicated hotkeeper asset.

## beta12.3
NPC renderer now accepts independent 4-direction x 3-frame assets per role with safe legacy fallback. Woman and tea-house girl have separate identity rules and facing state.


## β12.4 NPC differentiation
- 里の女・お澄 and 茶屋娘・お団子 now have stable NPC IDs and distinct roles.
- Interaction makes player/NPC face each other before dialogue.
- Dedicated 4-direction x 3-frame paths remain the production target; legacy PNG is fallback only.
- No concept-board crops are included as game assets.


## β12.5 core changes
- NPCs now block movement so the heroine no longer walks through villagers.
- Interaction favors NPCs in front of the heroine and uses a tighter range.
- 茶屋娘・お団子 has a functional tea/dango service: when injured and carrying 5文, talking restores 30 HP and records the visit.
- Tea service state is save-compatible (`teaVisits`) and migrates older saves safely.
- Existing design separation rules for 夜叉姫 / 里の女 / 茶屋娘 remain mandatory.


## β12.6
- 鬼灯の里の見た目と移動判定を同期。4軒の建物と道路外を通過不可に変更。
- 茶屋娘・お団子を北東の茶屋入口前へ移動。
- 里の女・お澄を南側生活区へ移動し、茶屋娘と役割・配置・向きを分離。
- 里長を中央参道へ移し、NPC同士の重なりを軽減。
- 旧 village.png は品質未達のため完成グラフィック扱いにしない。


## β12.8
- 鬼灯の里の北東茶屋と南東民家に入れる室内マップを追加。
- 茶屋娘・お団子は茶屋内にも配置し、5文の回復サービスを利用可能。
- 里の女・お澄の民家内会話を追加。
- 室内家具と移動当たり判定、入口からの退出を実装。
- 既存セーブ互換を維持（saveVersion 8）。

## β12.9
- 茶屋・お澄の民家の室内描画を全面改修。畳、障子、木組み、棚、照明を共通部品化。
- 茶屋は暖簾・カウンター・茶釜・座卓・座布団で専用内装化。
- 民家は囲炉裏・野菜置場・作業台・籠・干し草で生活感を分離。
- 描画家具と当たり判定の座標を同期し、見た目と移動可能範囲の食い違いを軽減。
- コンセプトボードの切り抜き素材は使用していない。

## β13 outdoor village pass
- 鬼灯の里の屋外描画を再構成（青瓦4棟、茶屋暖簾、宿看板、鳥居、石畳、水路、橋、桜、石灯籠、花壇・柵）。
- 茶屋と民家の入口導線を視覚的に分離。
- 屋外の描画座標と `villageBlocked()` の通行領域を同期。
- コンセプトボードの切り抜きは使用していません。


## β15.1 character readability pass
- Hero field render enlarged and anchored consistently at the feet.
- Hero/NPC ground shadows added to improve separation from busy village scenery.
- Woman and teahouse-girl NPC render scale/anchor unified while preserving separate assets.
- NPC name labels strengthened for iPhone-size readability.
- No concept-board crops were added as runtime assets.


## β15.1
- Replaced the normal-outfit Yashahime placeholder with 12 high-resolution production-candidate frames (down/left/right/up × 3).
- Standardized transparent canvas, baseline and margins for all 12 frames.
- Enabled high-quality downscaling for high-resolution hero art.

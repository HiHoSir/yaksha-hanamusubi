# プロローグ場面1 — 花咲く鬼灯の里の日常

状態: ゲーム寄りの比較保存版（ユーザー指定で保持）。音声付き26秒。全編完成ではない。新規開始には未接続。

2026-10-18方針修正: 本採用方向はアニメ専用に描き直すセルアニメ版。こちらの原画・レイヤー・MP4・コードは比較用として上書きせず保持する。アニメ版は ../anime-v1/ に分離する。

## 正本と再利用
- `docs/characters/HIZUKI_CANON.md`、`SCENARIO_BIBLE.md`、`js/data.js`、`js/settlement.js`を参照。
- 緋月は `assets/characters/hizuki/bluebob-v1/walk-atlas-256.png` の正式セルを無改変で参照。
- NPCは `npc-v3/{satoko,merchant,teagirl}.png`。歩行6セル/秒、足元アンカーと縦横比を保持。
- BGMは採用済み `audio/hoozuki-v13.mp3`。新規BGMは生成していない。
- 原画はBuilt-in ImageGen 1回。既存960×540候補の構図を、人物なしのセルアニメ背景へ描き直した。
- 花びらは既存 `hozuki_prologue_scene01_layers.zip` の独立アルファ素材を再利用。

## レイヤー
全体座標960×540。`source/village-painting.png`が未加工原画。
`layers/background.png`は全画面の連続した背景。
`layers/foreground.png`は同じ原画から抜いた手前の草・柵の固定遮蔽用ホールドアウト。背景の裏は残している。前景を独立移動してはいけない。
`layers/petals.png`は実アルファの独立FX。
人物は正本アトラスを参照し、scene.jsが共通キャンバス座標へ描く。セルを重複保存しない。
空・山・家屋・川はこの版では同一の静止背景であり、独立したパララックス層とは称さない。

## 再生成
`node tools/prologue/render-scene01.cjs /tmp/scene01-silent.mp4`
Nodeの `@napi-rs/canvas`、ffmpeg、日本語フォントが必要。`PROLOGUE_FONT` にNoto Sans CJK JP等のフォント絶対パスを指定。
`python3 tools/prologue/scene01-audio.py` は朝の鐘の音源を合成。
BGMと鐘をミックスし約-18 LUFSに正規化、H.264 Main / yuv420p / 960×540 / 24fps + AAC-LC 48kHzでMP4化。faststart有効。
字幕はscene.jsに時刻と話者を保持し映像へ焼き込み。

## 検査と限界
- 原画・正式緋月・NPCを目視確認。13秒/23秒等の合成フレームで接地、字幕、日本語表示を確認。
- 歩行・停止・振り向き・会話の寄り画面を実装。口パク、まばたき、表情差分は未実装。
- 前景の透明部分をゼロRGB化し、人物より後に同じ変換で合成。固定位置での重ね合わせが前提。
- 音声測定: ミックス約-18.15 LUFS / true peak -6.07 dBTP。実機での聴感は未検証。
- MP4の音声/映像トラックと26秒尺をffprobeで確認。ブラウザ起動環境は未整備、ダウンロードしたChromiumアーカイブの展開に失敗。ブラウザ再生は未検証。
- iPhone Safari実機で、横画面・音量・再生開始・末尾までの再生を要確認。

## 続きと本編接続
残り: 昔語り、鐘が鳴らない朝、道/約束を忘れる人々、緋月の気づきと決意。
現在の `newGame` は `village (768,760), dir=u, frame=1, quest=0` を作り、自動保存後に既存導入会話を開始する。
全編が揃った段階で、終了/スキップ共通の一度きりの完了関数へこの初期化を移す。冒頭の子どもとの会話はムービーとの重複を整理する。里長イベントのstageは進めない。
本候補だけを新規開始に差し込むと平穏な日常から既存異変会話へ説明なく飛ぶため、今は専用試聴ページ `prologue-scene01.html` で確認する。セーブ/ゲームロジックは変更なし。

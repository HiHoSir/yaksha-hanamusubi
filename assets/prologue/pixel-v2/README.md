# ピクセル描き直し・男性ナレーション候補

- source/hizuki-redrawn.png: built-in image generationによる独立透過セルの描き直し。2026-10-18、ユーザー「いい感じ」と描画方向を承認。元のセル・縮小減色版は保存。厳密な単一ピクセル格子や限定色数は未検証、背景・他人物・動画への反映は未実施。
- 制作指定: 既存緋月の姿・衣装・挨拶ポーズを維持し、輪郭の階段状の線、髪のまとまり、少数色の明確な陰影を描く。フィルター・縮小処理のみで代替しない。image_genへの参照はanime-v1/cels/idle.png。
- audio/male-narration.mp3: 男性声の試聴用。VOICEVOX Core 0.17.0 / VVM 0.16.4 / 玄野武宏・ノーマル（style 11）。速度0.92、抑揚1.05、音高は標準。冒頭二文、間0.65秒。ユーザーが「良さそう」と音声方向を承認。
- 合成元テキスト・設定はaudio/male-narration.json、再生成はtools/prologue/voice-pixel-v2.py。モデル・ライブラリ本体はリポジトリに含めない。

## 必須音声クレジット
VOICEVOX:玄野武宏

https://voicevox.hiroshiba.jp/term/
https://www.virvoxproject.com/voicevoxの利用規約
https://github.com/VOICEVOX/voicevox_vvm/blob/main/TERMS.txt

音声を再利用・再配布する際は上記クレジットを表示し、各音声ライブラリの利用規約に従ってください。音声素材として配布する場合も受領者に同じ遵守を義務付けてください。

まだゲーム未接続・GitHub未登録。男性音声は試聴承認済み。今回の合成動画は確認待ち。


## 32秒の描き直し合成版
opening-redrawn-review.mp4。0–10秒は昔語り音声付きの里背景、10–32秒は挨拶の場面。本編108秒の全場面置換ではない。昔語りの専用絵、鐘楼、村人が忘れる場面、後半の人物セルは今後の描き直し対象。

新規生成3点: source/village.png（人物なし背景）、source/hero-cels.png（緋月表情）、source/child-cels.png（さとこ）。すべて既存採用イメージを参照し、ピクセル表現で描き直し。生成後に位置を補正し、会話時は口の領域のみ置換して髪・衣装の変動を抑えた。cels/は1040×1040の同一キャンバス透過PNG。描画位置はrendererで指定。背景は独立一枚で前景分離未実施、花びらは独立のピクセル描画。厳密な単一グリッドの手打ちドット絵ではなく、生成によるドット表現。

再生成: python3 tools/prologue/prepare-pixel-v2.py → node tools/prologue/render-pixel-v2.cjs → bash tools/prologue/mix-pixel-v2.sh
前景分割・後半の再制作・ゲームへの接続は未完了。iPhone Safari実機未検査。GitHub・Actions・Pages未反映。

## 再生修正と44秒版
提示した32秒版にmoovの欠落が見つかったため、完成済みの中間映像から再合成した。旧リンクの実体も修正し、新しいprologue-pixel-v2-playable.mp4は640×360 H.264 Constrained Baseline level 3.0 / AAC-LC / faststartで保存。提示する実ファイルについて全フレームデコード、moov位置、ハッシュを再確認。過去のQA報告だけでリンク先の健全性を保証しない。

prologue-pixel-v2-44s.mp4は、32秒版の後に鐘が鳴らない朝・緋月の気づき12秒を追加した確認版。source/bell.pngとsource/hizuki-concern.pngを参照画像から新規に描き直し。後半12秒はBGMと鐘を止め、川の実録音を残す。人物の困惑セルは静止。村人の記憶異常、決意など残りの場面は未追加。ゲーム接続・GitHub登録・実機確認は未完了。

再生成: bash tools/prologue/join-pixel-v2-silence.sh


## 全体つなぎ版106秒
prologue-pixel-v2-complete.mp4。前半44秒＋後半62秒（道と約束を忘れる村人、緋月の気づき、里の不安、調査への決意）。後半の会話はassembly-v2の既存内容を使用し、人物は新規にドット表現で描き直した独立セル。音声は冒頭のみVOICEVOX:玄野武宏、人物会話は字幕と口パク。BGMを決意に合わせて戻す。iPhone実機、ゲーム起動・スキップ・セーブ・本編への接続は未確認／未実装。映像と素材はまだGitHub未登録。元のゲーム寄り版・セルアニメ版・ピクセル処理試作を保持。

後半再生成: python3 tools/prologue/prepare-pixel-v2-tail.py → bash tools/prologue/join-pixel-v2-full.sh
完成時のコンテナ／音量検査はprologue-pixel-v2-complete.QA.json。

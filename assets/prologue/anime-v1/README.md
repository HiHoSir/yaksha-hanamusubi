# アニメ専用版 — 制作候補

ユーザーの2026-10-18修正: 『天外魔境II』のようなセルアニメのイベントムービーとして、現行導入に代わる映像を作る。ゲームの小さな歩行素材の拡大・移動ではない。ゲーム内の緋月と鬼灯の里は外見と世界観の参考とし、映像用に描き起こす。

ゲーム寄りの26秒比較版は ../scene01/ に完全保存。上書きしない。

今回の実素材: source/hizuki-greeting-cels.png は新規生成1回の透過原画。cels/idle.png を固定身体とし、口と瞼だけを他セルから同じ座標へ転写。3セルとも724×724 RGBA。身体・髪・衣装をフレームごとに揺らさない。prepare-anime-cels.pyで再作成できる。

greeting-cut.mp4: 8秒、960×540、24fps、H.264 yuv420p + AAC。口パク/まばたき候補。発話音声なし、採用済み里BGMのみ。背景は前版の原画から暫定的に切り出しており、最終的にはアニメカメラに合わせた専用背景が必要。

未完了: 真の振り向き中割り、腕の芝居、他人物との切り返し、90〜120秒全編、開始/終了/スキップの本編接続、iPhone Safari実機。画風・演技の採用確認前。完成作品と扱わない。

生成指定: cyan short bob / one golden horn / red-pink eyes / red-white traveling costume; original character reinterpreted for early-1990s hand-inked cel animation; waist-up greeting, same-camera closed mouth/open mouth/blink, true alpha, no scenery/text. Reference: canonical bluebob-v1 atlas. Tool: built-in imagegen. Current candidate retains soft highlights; stronger flat-cell stylization remains a possible refinement after visual review.

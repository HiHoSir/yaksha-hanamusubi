# 採用プロローグ β15.57.200

承認映像: prologue-pixel-v2-complete.mp4（106.1秒、640×360、H.264 Baseline + AAC）。ユーザーが2026-10-18に採用・ゲーム組み込みを承認。

index.html → js/prologue.js → js/game.js の startNewGame。
新規開始の操作からplaysinline動画を再生。再生中はbusyとBGM停止を維持し、fresh状態の生成・自動保存は終了／スキップ後に一度だけ実行する。開始位置 village (768,760), dir=u, quest=0。里長イベントは変更しない。旧冒頭会話は映像と重複するため置換。つづきから・手動セーブ・既存イベントは変更しない。

動画の音声は現在のsound設定を初期値にする。動画内消音は一時設定で、ゲームのsoundを変更しない。自動再生拒否・読み込みエラー時は再生／再試行とスキップを提示。バックグラウンドで一時停止し、復帰後は再生ボタンから継続。

検査: qa/prologue-unit.cjs（終了／スキップ／エラー／重複操作／消音／終了前セーブなし／初期座標）、映像の全編デコード・moov・音量検査。ブラウザー・iPhone Safari実機での自動再生、音声、スキップ、終了後の移動は別途確認。ローカルChromiumはダウンロード破損のため実行できなかった。

原画source/と透過セルcels/、音源audio/を保存。制作仕様はREADME.md、クレジットはCREDITS.md。旧版は削除しない。レンダラーはtools/prologue/配下。文字用フォントNoto Sans CJK JP、ffmpeg、@napi-rs/canvas、Pillow/numpyが必要。FFmpeg出力は完成後の管理情報を検証してから提示パスへコピーする。後半の再合成にはassets/prologue/assembly-v2/timeline.jsonを使用。

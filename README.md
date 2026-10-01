# 夜叉姫の花結び奇譚 β6.1 ASSET BUILD

β6.1では assets/ を実データ化し、生成した完成イメージをゲーム内背景・キャラクター参照素材として読み込む方式へ移行しました。

## 実アセット
- assets/backgrounds/title-art.jpg
- village.jpg / world-map.jpg / shrine.jpg / waterfall.jpg / cove.jpg / forest.jpg / battle.jpg / dialogue.jpg
- assets/characters/yashahime.png / yashahime-battle.png / yashahime-menu.png
- assets/ui/outfits.jpg / visual-reference.jpg

`game.js` は Image + drawImage() を使用し、画像ロード失敗時のみ従来のCanvas描画へフォールバックします。旧セーブ互換を維持しています。

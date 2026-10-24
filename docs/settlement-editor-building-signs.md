# 店舗の共通建物と看板（sm-3）

2026-10-24。ユーザー指定「宿屋の看板を店に書き換えて流用」「茶店は問題ないので、それ以外は看板でなんの店かを判別」「店は出入り口判定的にもNG」に対応。

- 茶店以外の通常店舗は宿屋の承認済み建物を共通の原型とし、用途は中央看板で区別する。現カタログは宿＝「宿」、店＝「店」。未指定の新しい店舗種別を勝手に追加しない。民家・祠を店舗へ変更しない。
- 店の新素材は `assets/settlement-editor/chips/building_shop_inn.png`。160×96px、描画5×3セル、接地5×2セル。宿と同じsourceRect `[9,2,142,92]`。旧縦長店舗PNGは原本として保持するが、カタログからは参照しない。
- 接地基準 `(x,y)` に対し、入口は `(x+2,y)`、接近は `(x+2,y+1)`。両者ともマス中央。新規配置・移動・複製・試し歩きは同じ整数座標を使う。
- 入口は隣接する接近セルまで歩いて調べる方式。戸口自体は接地占有に含む。戸口を通り抜けて屋根へ進入させない。
- 編集JSONはversion=2を維持し、catalogRevision=3を追加。旧sm-2（revision未記録）の標準店舗入口・接近セルだけを右寄り列3から中央列2へ移行する。接地座標と手動占有は保持し、独自に編集された入口は保持する。
- 旧version=1店舗の描画寸法は5×4として解釈し、旧接地行を維持して移行する。新テンプレートの高さ3を旧データの座標変換に流用しない。
- 茶店 `building_tea.png`、宿 `building_inn.png`、その他既存PNGは変更していない。

## 素材編集と検査

内蔵画像編集で、承認済み宿を対象に「中央の宿だけを店に交換、建物・入口・色・輪郭・ピクセル密度・透過を維持」と指定。旧店舗は文字の参考にだけ使用した。全体の再描画結果は採用せず、生成結果の看板内側だけを取り出して原本宿へ合成した。

`tools/reuse-inn-shop.cjs` は `source/shop-sign.png` の27×18pxを宿の `[66,48,27,18]` に合成する。看板内側以外の全画素と全アルファが宿と完全一致することを検査する。生成された高解像度の全体画像をゲームで読み込まない。

生成用指示（要約）: “Image 1 is the approved inn edit target; image 2 is only the 店 character reference. Replace only central 宿 with 店. Preserve central doorway, exact architecture, framing, proportions, colors, silhouette, margins and SFC pixel-art density; genuine transparency; no extra props or text.”

36件PASS。中央接近セルまでの歩行と戸口での停止、旧2形式の移行、移行後再読込、手動入口保持、看板以外の画素・アルファ完全一致、全7入口への到達を確認した。新素材のGitHub登録、Pages公開、ブラウザ、実機Safariはそれぞれ別工程として記録する。

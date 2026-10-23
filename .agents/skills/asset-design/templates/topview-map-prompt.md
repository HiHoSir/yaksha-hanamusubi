# Top-view map source-art prompt

先に `docs/topview-map-standard.md` の制作仕様を記録する。以下は採用方向を再現するための英語プロンプトの核とする。対象マップの種類・寸法・明示した物体のセル数・通路・参照画像の役割を続けて記述し、確定仕様と照合してから主生成を1回行う。

```text
Create one original top-down 16-bit Japanese RPG exploration-map source illustration.
Use the supplied actual SD character atlas only for pixel density and object scale.
Use the supplied approved top-view reference for camera and material language.
Draw the floor as a rectangle of identical square ground cells, with horizontal north/south edges and parallel vertical west/east boundaries. Apply no vanishing-point shrinkage, trapezoidal floor or isometric axes.
Look DOWN at tabletops, bench seats, worktops and kettle lids. Represent walls mainly by narrow overhead cap/thickness strips and a small front lip. Keep the rear wall low; do not produce a huge front-facing wall panorama or tall exposed furniture legs.
Build authentic intentional pixel clusters, stepped dark colored contours and a few material shade ramps at the declared native resolution. Match a 28px-high SD actor inside a 32px ground cell. Avoid painterly gradients, photoreal grain, glow and anti-aliasing. Pixelating a smooth painting is not the requested source style.
Use the exact authored layout, object counts and footprint sizes from the accompanying map contract. Keep the declared approach cells directly in front of rear equipment, entrances and NPCs open. Keep the approved chair/table/building positions. Do not create new corridors by moving them or adding room rows.
Keep ordinary low objects visually inside their declared ground cells so a character in the next cell stays readable. Identify only the explicitly declared tall overhangs for later foreground separation. Retain complete silhouettes, source alignment and contact positions.
Show all room/map boundaries inside the canvas with the declared exterior margin. Do not crop the left/right walls. Add no character, grid, text, UI, comparison panel or annotation to the clean source illustration.
```

- 屋外では低い壁の説明を地形・建物・樹木の仕様に置き換え、カメラ・正方マス・SD比率は維持する。地面と高さ・衝突は分ける。
- キャラを絵の中に描き直さず、後で実アトラスを重ねて比較する。
- 旧パース画像を併用する場合は、配色・持ち物だけの参照と明記する。元の強い正面構図を維持する指示を加えない。
- 一枚の参考絵・個別タイル・独立透過物体のどれを生成するかを明記する。参考絵だけでゲーム用タイルや前景分離が完成したとは扱わない。
- 床タイルの生成には従来のtile-prompt、独立物体にはobject-promptを併用し、寸法・透過・接続・出力形式を確定する。

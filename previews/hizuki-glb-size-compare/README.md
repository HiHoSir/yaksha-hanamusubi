# 緋月 96px/128px 実寸比較プレビュー

- 開く: `index.html`（同梱 `assets/` を維持）。静的ホストの `/previews/hizuki-glb-size-compare/` にそのまま配置可能。
- 96px/128pxはセルサイズ（キャラクター実高さはそれぞれ約80px/約105px）。
- 8方向: front, front_right, right, back_right, back, back_left, left, front_left。
- 立ち姿1コマ、歩行8コマ、走行8コマ × 各8方向。
- `atlas-v2.json` にアトラス位置、透明領域検査・フレーム境界・fps等の情報を含む。
- 各PNGはRGBA、透過状態。
- 本番採用前にiPhone Safari上で実際の歩行感、衣装の一貫性、足の着地位置を確認すること。
- 現時点ではドット絵化未実施、GLB由来レンダリングのまま。
- 256pxの原版は既存マスターZIPを保持して利用してください。

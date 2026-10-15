# 緋月のおまけ・ドット絵

設定 → 主人公の素材 → おまけ・ドット絵。標準は承認済み水色髪のイラスト版のまま。装備能力・セーブ形式・移動・衝突は変更しない。選択は既存のheroArt URLパラメータに保存される。

- ImageGenのstyle-transferで承認済みbluebob-v1の12セルを変換。元出力はpixel-v1/source.pngに保存。
- 指定：16-bit RPG pixel art、顔・衣装・頭身・手足の所属を維持、透明背景、3列4行、64px論理セル・身長58px。
- tools/build_hizuki_pixel.cjsで各セルの主成分境界を採り、nearest-neighborで64pxセルに配置。頭頂y4、足元y62、中央x32。
- 正面/背面のBはAの反転。左3枚は右3枚の反転。独立生成した左右の違いを排除。
- 実行にはNode.jsと@napi-rs/canvasが必要。環境変数CODEX_PRIMARY_RUNTIME_NODE_MODULESも使用可能。
- レンダラーはドット絵のみスムージング無効。遠近投影と既存の影は共通。
- 顔の表情・衣装の細部はドット表現で簡略化される。実機での馴染みはユーザー確認対象。

生成プロンプトの再利用指定は .agents/skills/hizuki-walk-assets/references/prompts.md を参照。

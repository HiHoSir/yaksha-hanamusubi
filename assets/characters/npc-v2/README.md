# NPC v2 — β15.57.6

Built-in ImageGen regenerated five shared village archetypes. Each transparent WebP atlas is 576×896, with twelve 192×224 cells. Rows: front, back, left, right. Columns: stride A, neutral, stride B. Foot anchor: (96,212). The full visible body is normalized to 192px high without changing aspect ratio. Largest-character bounds exclude neighboring-row fragments. manifest.json records source-cell selection and any mirroring. Original NPC assets remain available in the previous directory.

## Generation prompt set
Common prompt: production RPG transparent sprite sheet, exactly 3 columns × 4 rows, 12 separate full-body sprites; charming Japanese fantasy chibi, approximately 2.3 heads tall, clean fine outlines, restrained cel shading, slightly overhead, upper-left light, simple readable clothing. Identical identity, scale and clothing throughout. Rows front / full back / left / right. Columns opposite walking strides around neutral. No scenery, floor shadow, text or overlap. Heroine normal-v10/front-neutral.png used as style reference.

- elder: elderly man, white eyebrows and small moustache, bald crown and grey side hair, olive haori, cream kimono, brown trousers, sandals; no staff or backpack.
- merchant: village man, dark topknot, indigo work kimono, ochre sash, grey trousers, sandals; empty hands; reusable farmer and traveler.
- osumi: adult woman, black low bun, muted plum kimono, ivory apron, dusty violet skirt, sandals.
- teagirl: young adult woman, brown tied hair and green ribbon, sage kimono, cream apron, russet skirt, sandals.
- satoko: child, black bob, mustard jacket, teal trousers, red sash, sandals; no horns.

Generated sheets were visually inspected, their direction cells arranged explicitly, and packed as game atlases. Left-facing satoko stride B uses a mirrored right-facing generated cell. No change to NPC identities, dialogue, collision or wandering behavior.

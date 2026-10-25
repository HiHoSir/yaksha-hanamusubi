# Tenyo SD front candidates

Status: **front candidates awaiting visual review**, not runtime replacement.
The approved `tenyo-npc-v1` four-direction images remain unchanged and active.

- Shirotae retains dark long hair, white/lavender sleeves, red hakama and charm.
- Guardian retains a small topknot, tan face, navy clothing, brown armor and sword.
- Each PNG is 32×32 RGBA, binary alpha, visible whole body <=28px centered in
  the cell. A fixed 16-color palette reserves eye whites, skin, garment and gold
  colors. `front-native.png` is native scale; `front-comparison.png` includes
  native and 6× nearest-neighbor comparison against actual adopted Hizuki.
- The first generated candidates were too narrow; corrected source art widened
  the head/body silhouette. The guardian's tall topknot alone was compacted so
  the main face/body would not be shrunk. The body is not stretched sideways.
- `scripts/build-tenyo-sd-candidates.py SOURCE_SHIROTAE SOURCE_GUARDIAN` performs
  trim, palette conversion, placement, pixel-roundtrip and alpha checks. The
  manifest records original source hashes and crop bounds. Generated originals
  are preserved separately from these normalized candidates.
- Follow `.agents/skills/asset-design/references/low-resolution-graphics.md`:
  review the actual 32px fronts before four-direction expansion. Neither walking
  frames nor new NPC identities, conversations or event logic are introduced.

References: actual `tenyo-npc-v1` appearances and
`hizuki/field-sd-v2/walk-atlas-32.png` for the SD proportions/style.

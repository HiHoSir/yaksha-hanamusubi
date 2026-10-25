# Tenyo SD native front review, revision 3

These are **unapproved front candidates**. The rejected v2 candidates are not
used as sources. Existing runtime NPCs, dialogue and map remain unchanged.

Workflow: develop the source silhouette using actual SD Hizuki as the scale
reference, then preserve aspect ratio while reducing by nearest sampling,
apply fixed16 palettes with explicit eye-white/iris/costume colors, hard alpha,
and visible-whole-center placement within32×32 (<=28px visible).

The initially approved-style source reduced to a head/body ratio taller than
Hizuki. Revised source increases the head toward two thirds of total height.
The guardian's topknot remains part of that total; no body/head stretching is
applied. Paired front-face sampling retains the source's actual eyelid, iris
and white shapes, rather than drawing synthetic3×3 eye patches.

`front-native.png` shows native sprites, left Shirotae, center actual Hizuki,
right Guardian. `front-comparison.png` includes native and6× nearest views.
No direction expansion or runtime replacement occurs until native review.

Rebuild with `scripts/build-tenyo-native-fronts.py SHIROTAE_SOURCE GUARDIAN_SOURCE`.
Original generated source hashes and crop bounds are recorded in manifest.json;
palettes.json records the16 fixed colors for each character. Originals are
preserved separately from the normalized files.

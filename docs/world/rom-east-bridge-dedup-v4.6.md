# East bridge review v4.6 — deduplicate detection candidates

## Source and method
Internal-only original-resolution visual review of `world_map_4096.png` (4096-square). Four 760×760 crops centered at E05 (3210,1514), E06 (3784,1438), E07 (3512,1322), E08 (3712,1154) were arranged together and compared. Cropped ROM imagery remains internal and is NOT committed to GitHub.

## Finding
The four erosion-derived candidate records are **not four distinct physical bridges**. Their original-resolution inspection windows overlap.
- E05 and E07 show overlapping parts of the western/central coastal waterway and bridges.
- E06 and E08 show overlapping parts of the eastern narrow island/channel and bridges.
- The overall inspected area visibly contains at least three distinct bridges, connecting different shore pairs:
  - Western mainland coast to a southern green area across a narrow water gap.
  - Mainland-side shore to an eastern elongated island across a narrow channel.
  - Southern end of that elongated island to a land area below, across another narrow channel.
- Where no bridge is present, the original visibly contains uninterrupted water between banks. Preserve those channels in the geographical structure.

## Significance
- The v4.5 simultaneous square deletion was performed at *candidate centers*, not at unique bridge-pixel masks. It could double-count the same crossing or remove nearby land. Its graph disconnection is a **sensitivity signal**, not a proof of three/four separate bridges or of natural coastal connectivity.
- Represent confirmed crossings by **bank-pair IDs**, not erosion-candidate IDs. The exact bridge end pixels and map tile IDs remain unverified.
- Natural isthmus versus crossing is still to be checked for other, non-bridge passages; do not proclaim the world coastline passed.
- Original geography remains separate from public game art: no ROM tiles, images, pixel contours, or tracing are committed.
- Do not regenerate watercolor maps until geography checks pass. Keep `js/world.js`, existing 80x80 New Continent, and save compatibility unchanged.

## Next targeted test
Assign three inspected crossings bank-pair labels in a *private* original-resolution working image, isolate bridge materials (not circular/square neighborhoods), and recompute land connectivity. Then audit any remaining continuous coastal necks.

Status: localized visual bridge-count deduplication PASS; complete original-world coastline PENDING; current watercolor coastline FAIL.

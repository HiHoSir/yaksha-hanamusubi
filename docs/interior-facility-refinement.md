# Four facility furniture refinement

The home mushiro was accepted at335a4d6. Its floor images, tile IDs, panel arrangement, room dimensions and objects are preserved.

- Doctor: original3×1 apothecary counter with mortar, medicine jars and herbs; original hibachi remains a hibachi.
- Inn: original3×1 reception desk with ledger, inkstone and key tray; existing tatami rooms, futons, doors and garden retained.
- Armory: original3×2 flat display table with two blades and spearhead on cloth, replacing the tea-service counter; additional approaches at(9,7) and(8,8) verified.
- Teahouse: existing village bench cutout retains more vertical detail and wooden feet; kitchen keeps the metal hagama and wooden lid.
- Shared riser: the existing7px visual face now samples illustrated village beam grain. Height, stair and collision data are unchanged.

Native32px furniture footprints and explicit occupiedTiles are in `assets/interior-editor/facility-v1/catalog.json`. No collision is inferred from alpha. Grouped items remain atomic when painted, selected, copied or erased.

Rebuild: `python3 tools/build-interior-facilities.py`, then `python3 tools/build-interior-examples.py`. Source checkpoints, contracts and prompt records are beside the assets. The three new counter sources are original generated artwork. Benches and beams reuse adopted original village artwork. No reference-game screenshot pixels are used.

Validation: `node qa/interior-completion.cjs`, `node qa/interior-quality.cjs`, `node qa/interior-map-visit.cjs`, `node qa/interior-fire.cjs`. Native Canvas scene composites and VM viewer behavior have been checked; these are separate from actual browser and iPhone Safari checks. User visual approval is pending. Changes stay on improve/interior-map-editor-32px, with main unchanged.

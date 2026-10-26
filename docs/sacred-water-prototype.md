# 水鏡の聖域 — independent reconstruction study

This is a visual and walking prototype requested on 2026-10-27. It is deliberately isolated because this new sanctuary's visual design is not approved for a production map replacement. No production entry point, save, existing map, or BETA version is changed.

Open `sacred-water.html` through an HTTP server. The initial whole-map view shows the composition; 追従 follows the interpolated heroine at the center of the screen. Arrow keys, the touch D-pad and adjacent direction taps support 4-direction movement. 判定 shows authored passable cells and blocked gate posts. The prototype uses no localStorage.

## Scene contract

32×26 cells at 32px (1024×832 world pixels), orthographic camera; visible-center SD heroine using the production 96×128 atlas and SMRender bounds/actor functions. Water, terrain and independent depth-sorted objects are separate. Surface animation is two precomputed frames, 360ms; immutable geometry is never regenerated on frame changes. Walking uses the shared `YK_ELEVATION.canMove` and the same explicit authored causeway cells. Gate occupation is the two posts at [13,7], [18,7], [13,23], [18,23]. Spawn [15,25], goal [15,5]. The 108 passable cells form one connected component.

Ground material and height are independent; raised shores use the production model's approximately 45% corner outlines and 22px display displacement per height. Low terraces cannot be accessed from the water causeway. All generated PNGs here are deterministic edits/compositions of existing repository illustrations; image generation was not used. Runtime does not infer collision from alpha.

## Reused artwork

- `assets/maps/world-atlas-v15.32.png`: forest groves, conifers, flowering cherry trees, rock groups, waterfall scenes, illustrated lantern islands. Crops are recorded in the builder.
- `assets/maps/tenyo/layer-torii-{upper,base}.png`: cropped and recombined gate, preserving genuine alpha.
- `assets/animation/fluid-v1/field-water.png`: two water phases, recolored for this scene.
- `assets/settlement-editor/pack-v1/{cobble,stepping_stone}.png`: shallow stone bed, entrance.
- `assets/terrain/{grass-v1/grass,cliffs-v1/grass-cliff-32}.png`: shore surfaces, recolored stone faces.
- Production `field-sd-v2/walk-atlas-32.png`: actual walking heroine.

Rebuild with `python3 tools/build-sacred-water.py` from repository root (Pillow, NumPy and Node required). Builder calls the real elevation model for polygons. The source PNG and JSON layers remain independent and inspectable. `overview.png` shows frame zero without a heroine, because it is a composition review image.

## Current limits

The source reference's sunset horizon, ornate gold gate, lotus foliage and large continuous vertical rock escarpments are not fully reproduced. Current available art is used without inventing substitute illustrations. Lantern reflections are a provisional visual effect. The side cliffs and rock islands need aesthetic review. This is not the existing Tenyo map, and is not a production integration or Safari acceptance result. Pages publication and real-device validation are independent later gates.

# Field Map Objects v2

New isolated field symbols (11 PNG sprites), independent from existing `assets/field-map-objects-v1/` and `assets/terrain/places-v1/`.

- 1 world tile = 32x32 px; sprite image size is separate from ground footprint.
- All images are RGBA with transparent backgrounds; use bottom-center anchor.
- This is an **asset archive / visual candidate**, not wired into runtime. Existing assets and gameplay remain unchanged.
- Source: user-reviewed ChatGPT-generated sprite sheet, cropped and scaled deterministically.
- Known QA limitations: pagoda top and multi-peak large mountain need further review.
- See `manifest.json` for ground cells, render size and collision footprint.

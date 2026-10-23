# cyamise walking candidate

Entry: `cyamise-walk-test.html`. Isolated 12×8 authored movement-cell fixture using 32px cells and the existing 28px SD Hizuki. It does not read or write production saves and is not activated as the production teahouse.

Grid display origin (11.5,2.5) is a visual offset only. Contacts are explicit integer cells in `CYAMISE_RULES.occupiedTiles`, not inferred from image bounds. Each table/bench is2×1 blocked cells. The complete visible heroine graphic is centered inside the selected passable cell. All12 direction/frame silhouettes fit inside32×32px at28px visible height, with the boots2px above the cell's bottom edge. The logical movement center and visible foot are distinct. Cardinal whole-cell checks apply before a140ms visual interpolation. Arrow/dpad input and BFS tap paths share the same cell predicate. Foreground sorting uses the interpolated foot.

Existing accepted pixel design is resampled at4:1 nearest-neighbor for this prototype only; the original generated source remains preserved. Six furniture silhouettes reuse the existing left seating source art. Right seating is snapped to the same grid; source floor samples repair the old baked seating areas. The cutout contours and floor patch joins are provisional, not production-finished sprites. The earlier full-room design grid is superseded by the calibrated32px grid here.

Checks: authored contacts/bounds, blocked whole-step movement, four-direction routing, every passable cell reachable, cell centers, all12 actual sprite alpha bounds, actual key/reset/tap handlers and native Canvas renderer passed. Browser installation failed because the downloaded Chromium archive was invalid. Chromium/Safari and Pages are UNVERIFIED. The screenshot is rendered with the prototype renderer and native Canvas, not captured from Safari.

Preview must be deployed via the existing improvement-preview workflow before device QA. Production remains unchanged.

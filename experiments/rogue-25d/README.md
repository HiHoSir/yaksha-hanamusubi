# Rogue 2.5D Lab — 深層の回廊

A stand-alone mobile-first 2.5D technology experiment inspired by the dungeon exploration structure of **Rogue**. It uses original HTML, CSS and JavaScript, with an orthographic isometric projector and painter-ordered 2D sprites. There are no third-party runtime dependencies and no original game code or game art is incorporated.

## Play

Open `index.html` in a browser. On desktop use arrows or WASD (Q/E/Z/C for diagonal), M for map, H for healing, Enter for inspect; on mobile use the eight-way D-pad. Bumping into an enemy attacks. Find and inspect a staircase to move to the next level. You can hold movement buttons for repeated turns.

## Techniques tested

- Wall extrusion, top/front/side faces and depth-ordered actor occlusion.
- Orthographic 2.5D projection and camera follow.
- Independently drawn 2D character/enemy sprites.
- Procedural rooms and corridors, line-of-sight fog of war.
- Turn-based monster AI, combat, potions, loot, map exploration.
- Responsive Safari-oriented virtual controls.

## Legal provenance

Original game referenced for historical inspiration: **Rogue 5.4.4** by Michael Toy, Ken Arnold and Glenn Wichman. A BSD-style-licensed source distribution is available at https://github.com/Davidslv/rogue (see https://github.com/Davidslv/rogue/blob/master/LICENSE.TXT). This experiment **does not incorporate any code, sprites, music, story text or other original game assets from that distribution**. It is a new demonstration implementing general genre mechanics and should not be presented as an official Rogue port. The source distribution's BSD license applies if code or other copyrightable parts of it are incorporated in a future iteration; review and retain the license text and third-party notices at that time.

## Limitations

The rendering is an isometric software Canvas projection, not a WebGL/Three.js scene. All sprites are placeholder original vector illustrations; there is no 3D model or imported atlas yet. This is a visual and controls prototype, not an accuracy-verified port of Rogue's original rules or map algorithms.

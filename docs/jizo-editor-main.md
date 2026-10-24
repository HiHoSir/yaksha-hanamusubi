# Approved Jizo and settlement editor on main

BETA 16.1.40 imports the additive editor files from 734a81b while preserving the game at afe3268. Open `settlement-map-editor.html` from the root; the previous preview URL redirects there.

The approved B Jizo is copied byte-for-byte to the field sprite and editor chip. SHA256: `5014bcaeb80d3cc01ce940552a50a9cfd19f7a37fb2d492d450b8a5532b74b95`. Both are 32×32. Field guides keep their foot position, conversations and pass-through behavior. The editor chip occupies one cell. Ten approved sakura/autumn variants bring the palette to 71 assets.

Validation: 78 editor/game unit tests; standalone sprite, export, walk, field-hint and collision checks; real Chromium placement, undo/redo, PNG/JSON export/import/reload, walk mode, mobile palette, save isolation and field Jizo smoke. iPhone Safari has not been tested. The full native canvas runtime suite did not complete in this environment and is not counted as passing.

CI dependency correction: jsdom 26 does not dispatch the editor’s `onpointerdown` handlers. The minimal reproducer and six failing touch tests reproduce this; pin jsdom 30.1.3 on Node 24, matching the verified local environment. No editor behavior changes.

// Protect established field/village rendering and save contracts during refactoring.
// This is a structural regression guard, not a visual or Safari acceptance test.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const game = read('js/game.js');
const landscape = read('js/landscape.js');
const settlement = read('js/settlement.js');
const world = read('js/world.js');
const save = read('js/save.js');
const css = read('css/game.css');
const checks = [
  ['existing canvas', () => assert.match(html, /<canvas id="game" width="768" height="768"/)],
  ['field quarter-view renderer', () => assert.match(landscape, /function drawQuarter\(/)],
  ['quarter-view projection', () => assert.match(landscape, /function project\(/)],
  ['quarter-view depth sorting', () => assert.match(landscape, /\.sort\(\(a,b\)=>a\.p\.depth-b\.p\.depth\)/)],
  ['field renderer integration', () => assert.match(game, /YK_LANDSCAPE\.drawQuarter\(/)],
  ['village renderer integration', () => assert.match(settlement, /YK_LANDSCAPE\.drawQuarter\(/)],
  ['village data and elevations', () => { assert.match(settlement, /const size=\[1536,1280\]/); assert.match(settlement, /const upland=/); }],
  ['world map dimensions', () => { const m=world.match(/const tileSize=32,size=2560,viewSize=640,revision=(\d+)/); assert(m,'world geometry contract'); assert(Number(m[1])>=88,'world revision must not regress'); }],
  ['world collision API', () => assert.match(world, /const walkable=/)],
  ['existing save migration', () => { assert.match(save, /function migrate\(raw\)/); assert.match(save, /worldRevision/); }],
  ['existing save storage', () => { assert.match(save, /function loadAuto\(\)/); assert.match(save, /function saveSlot\(/); }],
  ['responsive phone UI', () => assert.match(css, /@media\(max-height:640px\)/)]
];
let failed = 0;
for (const [name, fn] of checks) {
  try { fn(); console.log('PASS', name); }
  catch (error) { failed++; console.error('FAIL', name, error.message); }
}
if (failed) process.exitCode = 1;
else console.log(`Architecture baseline: ${checks.length} checks passed`);

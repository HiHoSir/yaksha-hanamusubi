// Structural contract check: painted interiors remain unchanged until calibration.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const scene=JSON.parse(fs.readFileSync(path.join(root,'assets/interiors/structured-v1/teahouse.scene.json'),'utf8'));
const room=fs.readFileSync(path.join(root,'js/interior-base.js'),'utf8');
assert.equal(scene.scene,'teahouse');
assert.deepEqual(scene.coordinateSystem.original,[1536,1024]);
assert.deepEqual(scene.coordinateSystem.render,[768,512]);
assert.deepEqual(scene.coordinateSystem.canvasOrigin,[0,128]);
assert.equal(scene.referenceActor.nominalHeroVisibleHeightAtZ056,58);
assert.equal(scene.objects.length,4);
assert(scene.objects.every(o=>o.verified===false&&o.footprint===null&&o.depthAnchor===null));
assert(scene.constraints.noRectangularFinalArtwork);
assert.match(room,/assets\/interiors\/base-v1\/['"]?\+name/);
assert.doesNotMatch(room,/teaRect\(|drawTeaTable\(/);
console.log('Teahouse structure contract OK: 4 tables catalogued, coordinates and reference actor pinned.');
console.log('Artwork reconstruction and measured footprints are intentionally NOT certified.');

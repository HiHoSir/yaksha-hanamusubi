'use strict';
// Regression demonstration: reject exactly the v0.1 causes rather than trusting AI self-evaluation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {canon,profile,validateScene,validatePilotHtml,verifyCanon}=require('./production-preflight.cjs');
const ROOT=path.resolve(__dirname,'..');
const scene=JSON.parse(fs.readFileSync(path.join(ROOT,'config/scene-contracts/hozuki-exploration.json'),'utf8'));
let checks=0;
function pass(label,fn){fn();checks++;console.log('PASS',label)}
function fail(label,fn,pattern){assert.throws(fn,pattern);checks++;console.log('PASS blocked',label)}
pass('current runtime and protected art',()=>assert.equal(verifyCanon(),Object.keys(canon.protectedArt).length));
pass('village scene example is accepted',()=>assert(validateScene(scene).length===6));
pass('field scene has a separate (grandfathered) visual profile',()=>assert(profile('world-field').objectRoots.includes('assets/field-map-objects-v3/')));
fail('obsolete Hizuki v2',()=>validateScene({...scene,hero:'assets/characters/hizuki/field-sd-v2/walk-atlas-32.png'},{checkFiles:false}),/Stale\/wrong hero/);
fail('field world-icon trees placed inside village',()=>validateScene({...scene,objects:['assets/field-map-objects-v3/trees.png']},{checkFiles:false}),/Wrong art family/);
fail('cross-era bridge placed inside village',()=>validateScene({...scene,objects:['assets/terrain/landscape-v2/bridge.png']},{checkFiles:false}),/Wrong art family/);
fail('unknown or unregistered object source',()=>validateScene({...scene,objects:['assets/misc/unknown.png']},{checkFiles:false}),/Wrong art family/);
fail('ground source used as a building object',()=>validateScene({...scene,objects:['assets/terrain/grass-v1/grass.png']},{checkFiles:false}),/Wrong art family/);
fail('old camera rule slipped into village',()=>validateScene({...scene,viewpoint:'field-quarter-view'},{checkFiles:false}),/Wrong camera/);
fail('wrong tile size',()=>validateScene({...scene,tileSize:64},{checkFiles:false}),/Wrong tile size/);
fail('undocumented scene type',()=>validateScene({...scene,profile:'new-scene-type'},{checkFiles:false}),/Unknown scene profile/);
fail('path traversal in object input',()=>validateScene({...scene,objects:['assets/settlements/common-v1/../other.png']},{checkFiles:false}),/Unsafe\/unqualified/);
const goodHtml='const OBJECT_FAMILY='+"'assets/settlements/common-v1/'"+'; hero: '+"'assets/characters/hizuki/field-sd-v3/walk-atlas-32.png'"+';';
pass('matching pilot HTML sources',()=>assert.equal(validatePilotHtml(goodHtml).objectFamily,'assets/settlements/common-v1/'));
fail('pilot mixed with world icons',()=>validatePilotHtml(goodHtml+" 'assets/field-map-objects-v3/trees.png';"),/cross-era/);
fail('pilot stale heroine',()=>validatePilotHtml(goodHtml.replace('field-sd-v3','field-sd-v2')),/stale hero/);
fail('pilot missing explicit family',()=>validatePilotHtml(goodHtml.replace('OBJECT_FAMILY','OTHER_FAMILY')),/OBJECT_FAMILY/);
console.log('Production preflight regression:',checks,'tests passed');

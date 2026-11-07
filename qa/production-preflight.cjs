#!/usr/bin/env node
// Deterministic art/canon preflight. No image generation, no external dependencies.
// Does not judge visual beauty; it prevents known wrong-version and wrong-role inputs.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const canon=JSON.parse(fs.readFileSync(path.join(ROOT,'config/production-canon.json'),'utf8'));
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
function gitBlobSha(p){
  const buf=fs.readFileSync(path.join(ROOT,p));
  return crypto.createHash('sha1').update('blob '+buf.length+'\0').update(buf).digest('hex');
}
function safeAsset(p){
  return typeof p==='string'&&/^assets\/[A-Za-z0-9._/-]+\.(png|webp|jpg|jpeg|mp4)$/i.test(p)&&
    !p.split('/').includes('..')&&!path.isAbsolute(p);
}
function profile(id){
  const p=canon.sceneProfiles[id];
  assert(p,'Unknown scene profile: '+id);
  if(!p.inherits)return p;
  const parent=profile(p.inherits);
  return {...parent,...p};
}
function validateScene(scene, options={}){
  assert(scene&&typeof scene==='object'&&!Array.isArray(scene),'Scene contract must be an object');
  const p=profile(scene.profile);
  assert.equal(scene.tileSize,canon.tileSize,'Wrong tile size');
  assert.equal(scene.hero,p.hero,'Stale/wrong hero sprite for '+scene.profile);
  assert.equal(scene.viewpoint,p.viewpoint,'Wrong camera/viewpoint for '+scene.profile);
  assert(Array.isArray(scene.objects),'objects must be explicitly declared');
  assert(Array.isArray(scene.ground),'ground assets must be explicitly declared');
  const out=[];
  for(const [role,arr,roots] of [['object',scene.objects,p.objectRoots],['ground',scene.ground,p.groundRoots]]){
    for(const a of arr){
      assert(safeAsset(a),'Unsafe/unqualified '+role+' asset: '+a);
      assert(roots.some(root=>a.startsWith(root)), 'Wrong art family for '+scene.profile+': '+a+' used as '+role);
      if(options.checkFiles!==false)assert(exists(a),'Missing '+role+' image: '+a);
      out.push(a);
    }
  }
  assert(safeAsset(scene.hero),'Invalid hero asset');
  if(options.checkFiles!==false)assert(exists(scene.hero),'Missing hero asset');
  return out;
}
function validatePilotHtml(html){
  // Catch accidental reintroduction of v0.1 world icon assets and the old hero.
  const p=profile('field-vista-pilot');
  const heroPaths=[...html.matchAll(/assets\/characters\/hizuki\/field-sd-v\d+\/walk-atlas-32\.png/g)].map(x=>x[0]);
  assert(heroPaths.length>0,'Pilot hero source not declared');
  assert(heroPaths.every(x=>x===p.hero),'Pilot references a stale hero version: '+heroPaths.join(', '));
  const match=html.match(/(?:const|let)\s+OBJECT_FAMILY\s*=\s*['"](assets\/[A-Za-z0-9._/-]+\/)['"]/);
  assert(match,'Pilot must declare OBJECT_FAMILY explicitly');
  assert(p.objectRoots.includes(match[1]),'Pilot object family mismatch: '+match[1]);
  const forbidden=['assets/field-map-objects-v3/','assets/terrain/places-v1/','assets/terrain/quarter-v1/',
    'assets/terrain/landscape-v2/','assets/animation/fluid-v1/'];
  for(const root of forbidden)assert(!html.includes(root),'Pilot reintroduced cross-era assets: '+root);
  return {hero:heroPaths[0],objectFamily:match[1]};
}
function verifyCanon(){
  assert.equal(canon.schemaVersion,1);
  assert.equal(canon.tileSize,32);
  const walk=canon.current.hizukiWalkAtlas;
  assert.equal(walk,'assets/characters/hizuki/field-sd-v3/walk-atlas-32.png');
  const man=JSON.parse(read(canon.current.hizukiManifest));
  assert.equal(man.atlas,path.basename(walk));
  assert.deepEqual(man.cell,[32,32]);
  const game=read('js/game.js');
  const src=game.match(/HIZUKI_FIELD_SD\.datasetSrc\s*=\s*["']([^"']+)["']/);
  assert(src,'Game must declare HIZUKI_FIELD_SD');
  assert.equal(src[1].split('?')[0],walk,'Actual runtime heroine is not current canon');
  const attract=read('js/title-attract-demo.js');
  assert(attract.includes(walk),'Title attract demo uses the wrong heroine');
  const prologue=read(canon.current.approvedPrologueRuntime);
  const movie=prologue.match(/const SRC=['"]([^'"]+)['"]/);
  assert(movie,'Prologue movie source missing');
  assert.equal(movie[1].split('?')[0],canon.current.prologueMovie);
  const start=game.match(/YK_PROLOGUE\.play\(\{sound,onComplete:enterStory\}\)/);
  assert(start,'Approved movie no longer invoked from new game flow');
  assert(game.includes('YK_LANDSCAPE.drawQuarter('),'Approved field drawing path missing');
  const settlement=read('js/settlement.js');
  assert(settlement.includes('assets/settlements/common-v1/'),'Village asset family changed unexpectedly');
  for(const [file,sha] of Object.entries(canon.protectedArt)){
    assert(exists(file),'Protected source missing: '+file);
    assert.equal(gitBlobSha(file),sha,'Approved baseline changed without contract review: '+file);
  }
  if(exists('previews/field-art-pilot.html'))validatePilotHtml(read('previews/field-art-pilot.html'));
  if(exists('config/scene-contracts')){
    for(const file of fs.readdirSync(path.join(ROOT,'config/scene-contracts')).filter(x=>x.endsWith('.json'))){
      validateScene(JSON.parse(read('config/scene-contracts/'+file)));
    }
  }
  return Object.keys(canon.protectedArt).length;
}
function main(args){
  if(args[0]==='--scene'){
    assert(args[1],'Usage: --scene config/scene-contracts/example.json');
    const file=path.resolve(ROOT,args[1]);
    assert(file.startsWith(ROOT+path.sep),'Scene path must remain in repository');
    const result=validateScene(JSON.parse(fs.readFileSync(file,'utf8')));
    console.log('PASS scene contract: '+args[1]+' ('+result.length+' assets)');
  }else if(args[0]==='--profile'){
    const id=args[1];assert(id,'Usage: --profile village-exploration');
    console.log(JSON.stringify({id,hero:canon.current.hizukiWalkAtlas,tileSize:canon.tileSize,...profile(id)},null,2));
  }else if(args.length===0||args[0]==='--check'){
    const count=verifyCanon();
    console.log('PASS production preflight: hero v3, movie, field entry points, '+count+' protected blobs, scene profiles');
  }else throw Error('Unknown option: '+args[0]);
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){console.error('FAIL production preflight:',e.message);process.exitCode=1;}}
module.exports={canon,profile,validateScene,validatePilotHtml,verifyCanon,gitBlobSha};

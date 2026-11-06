#!/usr/bin/env node
'use strict';
/* Structural UI regression + shared pixel-engine smoke checks.
   Browser touch gesture and Safari layout remain separate device QA gates. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('mapchip-editor.html');
const mobile=read('js/mapchip-mobile-dock.js');
const css=read('css/mapchip-mobile-dock.css');
const core=require('../js/mapchip-core.js');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(Boolean);
for(const script of scripts)new Function(script);
new Function(mobile);
assert.match(html,/css\/mapchip-mobile-dock\.css/);
assert.match(html,/js\/mapchip-mobile-dock\.js/);
assert.match(html,/YakshaMapchipEditorBridge/);
assert.match(html,/beginPush\(x,y\)/);
assert.match(html,/dragPush\(x1,y1,x2,y2\)/);
assert.match(mobile,/stopImmediatePropagation\(\)/);
assert.match(mobile,/addEventListener\('pointerdown'/);
assert.match(mobile,/addEventListener\('pointermove'/);
assert.match(mobile,/bridge\.beginPush\(cursor\.x, cursor\.y\)/);
assert.match(mobile,/pushHeld &&/);
assert.match(mobile,/bridge\.dragPush/);
assert.match(mobile,/event\.detail !== 0/);
assert.match(mobile,/pushPointer/);
assert.match(css,/#mobilePush/);
assert.match(css,/#mobileCursor/);
assert.match(css,/#mobileDock/);
assert.match(css,/pointer:coarse/);
assert.ok(!mobile.includes("assets/enemies/"));
const p=core.newProject();
core.apply(p,{op:'paint',tile:0,x:16,y:16,color:'#ef6498'});
core.apply(p,{op:'line',tile:0,x1:16,y1:16,x2:18,y2:16,color:'#ef6498'});
const bytes=core.data(p,0);
for(const x of [16,17,18]){
  const i=(16*32+x)*4;
  assert.deepEqual(Array.from(bytes.slice(i,i+4)),[239,100,152,255]);
}
console.log('PASS: mobile editor wiring, gesture guards, shared RGBA edit semantics');

'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const M=require('../js/mapchip-core.js');const CLI=require('../tools/mapchip-ai.cjs');
const p=M.newProject(2,2);
assert.equal(p.tileSize,32);assert.equal(p.tiles.length,4);assert.equal(M.atlas(p).width,64);
assert.deepEqual(M.rgba('#aabbcc'),[170,187,204,255]);assert.deepEqual(M.rgba('transparent'),[0,0,0,0]);
const cmds=[
  {op:'paint',tile:0,x:0,y:0,color:'#ff0000'},
  {op:'line',tile:0,x1:0,y1:31,x2:31,y2:31,color:'#00ff00'},
  {op:'copy',tile:1,from:0},
  {op:'flip',tile:1,axis:'x'},
  {op:'connections',tile:0,right:true},
  {op:'mapCell',x:0,y:0,tile:0},
  {op:'mapCell',x:1,y:0,tile:1}
];
const edited=M.run(p,cmds);
assert.notEqual(edited.tiles[0].pixels,p.tiles[0].pixels);
assert.deepEqual(Array.from(M.data(edited,0).slice(0,4)),[255,0,0,255]);
assert.deepEqual(Array.from(M.data(edited,1).slice(31*4,32*4)),[255,0,0,255]);
assert.deepEqual(Array.from(M.data(p,0).slice(0,4)),[0,0,0,0]);
const rep=M.inspect(edited);assert.equal(rep.errors.length,1);assert.equal(rep.errors[0].type,'connection');
const stable=JSON.stringify(edited);assert.throws(()=>M.run(edited,[{op:'paint',tile:0,x:32,y:0,color:'#fff000'}]),/out of range/);assert.equal(JSON.stringify(edited),stable);
const e=M.run(edited,[{op:'fill',tile:2,x:2,y:2,color:'#123456'},{op:'rect',tile:2,x:0,y:0,width:2,height:2,color:'transparent',filled:true}]);
assert.deepEqual(Array.from(M.data(e,2).slice(0,4)),[0,0,0,0]);assert.deepEqual(Array.from(M.data(e,2).slice((10*32+10)*4,(10*32+10)*4+4)),[18,52,86,255]);
const png=CLI.pngFromAtlas(M.atlas(e));assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),64);assert.equal(png.readUInt32BE(20),64);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mapchip-'));try{
  const src=path.join(dir,'in.json'),commands=path.join(dir,'commands.json'),output=path.join(dir,'out.json'),pngFile=path.join(dir,'atlas.png'),report=path.join(dir,'report.json');
  fs.writeFileSync(src,JSON.stringify(p));fs.writeFileSync(commands,JSON.stringify(cmds));
  const res=CLI.run([src,commands,output,'--png',pngFile,'--report',report]);assert.equal(res.errors,1);assert.equal(M.verify(JSON.parse(fs.readFileSync(output,'utf8'))).tiles.length,4);assert.ok(fs.statSync(pngFile).size>100);assert.equal(JSON.parse(fs.readFileSync(report)).errors.length,1);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('mapchip-ai-smoke: PASS (core + commands + valid PNG header + CLI round-trip)');
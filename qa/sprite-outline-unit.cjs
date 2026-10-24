const assert=require('node:assert/strict'),O=require('../js/sprite-outline.js');
const a=new Uint8Array(25);for(let y=1;y<4;y++)for(let x=1;x<4;x++)a[y*5+x]=255;a[12]=0;
const ring=O.exteriorRing(a,5,5);assert.equal(ring[3*7+3],0,'enclosed hole is not outlined');
assert.equal(ring.reduce((a,b)=>a+b,0),12,'one-pixel four-connected exterior');
assert.equal(O.exteriorRing(new Uint8Array(4),2,2).some(Boolean),false);
const edge=O.exteriorRing(new Uint8Array([255]),1,1);assert.equal(edge.reduce((a,b)=>a+b,0),4,'edge padding retained');
console.log('PASS exterior only, no interior fill, one-pixel ring, empty and edge frames');

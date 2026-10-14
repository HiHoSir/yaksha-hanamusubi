const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c={};c.window=c;vm.runInNewContext(fs.readFileSync('js/interaction.js','utf8'),c);
const find=(p,ns,max)=>c.YK_INTERACTION.nearestFacingNPC(p,ns,max);
const p={x:0,y:0,dir:'u'},front={x:0,y:-10},back={x:0,y:10};
assert.equal(find(p,[back,front]),front);
assert.equal(find(p,[{x:0,y:-93}]),null);
assert.equal(find(p,[front],10),null);
assert.equal(find({...p,dir:'invalid'},[back]),back);
console.log('NPC-facing selection contract OK');

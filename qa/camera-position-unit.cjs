const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={};ctx.window=ctx;vm.runInNewContext(fs.readFileSync('js/camera-position.js','utf8'),ctx);
const position=ctx.YK_CAMERA.position;
const state={x:140,y:250},motion={x:100,y:200,at:1000};
const at=t=>position(state,motion,t);
assert.equal(at(1000).x,100);assert.equal(at(1000).y,200);
assert.equal(at(1072).x,120);assert.equal(at(1072).y,225);
assert.equal(at(1144).x,140);assert.equal(at(1144).y,250);
assert.equal(at(999).x,100);assert.equal(at(1300).x,140);
assert.equal(position(state,null,1000).x,140);
assert.equal(state.x,140);assert.equal(motion.x,100);
// Both scenes share this calculation; validate uninterrupted motion and unchanged state.
for(const duration of [144,288]){
 let lastX=-Infinity,lastY=-Infinity;
 for(let time=1000;time<=1000+duration;time+=duration/16){
  const p=position(state,motion,time,duration);
  assert.ok(p.x>=100&&p.x<=140&&p.y>=200&&p.y<=250);
  assert.ok(p.x>=lastX&&p.y>=lastY,'camera must not jump backward');
  lastX=p.x;lastY=p.y;
 }
 assert.equal(position(state,motion,1000+duration,duration).x,140);
}
const reversed=position({x:50,y:70},{x:150,y:170,at:1000},1072);
assert.equal(reversed.x,100);assert.equal(reversed.y,120);
const stationary=position({x:80,y:90},{x:80,y:90,at:1000},1072);
assert.equal(stationary.x,80);assert.equal(stationary.y,90);
assert.equal(position(state,motion,1000).x,100,'motion must begin at prior position');
assert.equal(state.y,250);assert.equal(motion.y,200);
console.log('Field/village render interpolation contracts OK');

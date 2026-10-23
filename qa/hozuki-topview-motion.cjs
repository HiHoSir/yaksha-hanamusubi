const assert=require('assert/strict'),R=require('../js/hozuki-topview-rules.js'),M=require('../js/hozuki-topview-motion.js');
let m=M.create();assert(m.start(0,-1,0));assert(!m.start(1,0,30),'cannot overlap strides');let p=m.tick(72);assert.equal(p.y,36.5);assert.equal(m.position.y,37);m.tick(144);assert.equal(m.position.y,36);
assert(m.walkTo(44,10));for(let t=200;t<20000&&(m.pending||m.moving);t+=16)m.tick(t);assert.deepEqual(m.position,{x:44,y:10},'tap route reaches shrine landing');
m.reset({x:24,y:35});m.hold(0,-1);for(let t=0;t<=800;t+=16)m.tick(t);m.release();if(m.moving)m.tick(1000);assert(m.position.y<30,'held input crosses south bridge');assert(R.walkable(m.position.x,m.position.y));
m.reset({x:23,y:28});assert(!m.start(0,1,0)||m.moving);m.reset({x:14,y:23});assert(!m.start(-1,0,0),'blocked building step is rejected');assert.deepEqual(m.position,{x:14,y:23});assert(!m.walkTo(6,24),'no path into building');
console.log('PASS atomic strides, midpoint interpolation, no cumulative drift, tap route, held input, blocked targets');

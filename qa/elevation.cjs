const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');const env={};env.window=env;vm.runInNewContext(fs.readFileSync('js/elevation-model.js','utf8'),env);const E=env.YK_ELEVATION;
for(const material of ['mixed','grass','sand','snow']){
 const m=E.fixture(material);assert.deepEqual(Array.from(E.validate(m)),[]);
 assert.equal(E.height(m,240,400),.5);assert.equal(E.height(m,240,384),1);assert.equal(E.height(m,240,416),0);
 assert(E.connected(m,7,13,7,12));assert(E.connected(m,7,12,7,11));assert(!E.connected(m,6,12,6,11),'cannot climb cliff');assert(!E.connected(m,7,12,8,12),'ramp side blocked');
 assert(!E.walkable(m,5,7));assert(!E.walkable(m,0,5));
 const queue=[[7,15]],seen=new Set(['7,15']);for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of Object.values(E.dirs)){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&E.connected(m,x,y,nx,ny)){seen.add(k);queue.push([nx,ny]);}}}
 assert(seen.has('8,7'),'both slopes reach upper terrace');
 assert.equal(E.connected(m,8,8,8,9),E.connected(m,8,9,8,8),'symmetric descent');
 console.log(material+': two ramps, cliffs, side blocking, water, objects and return route pass');
}
for(const [dir,[dx,dy]] of Object.entries(E.dirs)){
 const m=Array.from({length:5},()=>Array(5).fill('grass'));m.heights=m.map(r=>r.map(()=>0));m.ramps=m.map(r=>r.map(()=>null));m.ramps[2][2]=dir;m.heights[2+dy][2+dx]=1;
 assert.deepEqual(Array.from(E.validate(m)),[]);assert(E.connected(m,2-dx,2-dy,2,2));assert(E.connected(m,2,2,2+dx,2+dy));
 m.heights[2+dy][2+dx]=2;assert(E.validate(m).length,'bad ramp endpoint detected');
}
console.log('All four ramp orientations and invalid endpoint validation pass');

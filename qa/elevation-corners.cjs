const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');const w={};w.window=w;vm.runInNewContext(fs.readFileSync('js/elevation-model.js','utf8'),w);const E=w.YK_ELEVATION;
function island(material,cut=8){const m=Array.from({length:5},()=>Array(5).fill(material));m.heights=m.map(r=>r.map(()=>0));m.ramps=m.map(r=>r.map(()=>null));m.heights[2][2]=1;m.cornerCut=cut;return m;}
for(const material of ['grass','sand','snow'])for(const amount of [8,12]){
 const m=island(material,amount),shape=E.outline(m,2,2);assert.equal(shape.cuts.length,4);assert.equal(shape.polygon.length,8);
 const area=Math.abs(shape.polygon.reduce((sum,p,i)=>{const q=shape.polygon[(i+1)%shape.polygon.length];return sum+p[0]*q[1]-p[1]*q[0];},0))/2;
 assert.equal(area+4*amount*amount/2,32*32,'retained top and cut triangles exactly partition the tile');
 for(const cut of shape.cuts){
  const [cx,cy]=cut.corner,px=64+(cx?31:1),py=64+(cy?31:1);
  assert.equal(E.height(m,px,py),0,'cut reveals lower surface');
  assert(!E.pointWalkable(m,px,py),'cut triangle is forbidden');
  assert(!E.canMove(m,80,py,px,py),'cannot enter cut from high surface');
  assert(!E.canMove(m,cx?100:60,py,px,py),'cannot enter cut from low surface');
  for(const p of cut.ends)assert(shape.polygon.some(q=>q[0]===p[0]&&q[1]===p[1]),'diagonal endpoints shared with top');
 }
 assert(E.pointWalkable(m,80,80));assert(E.canMove(m,80,80,80,70),'retained top remains accessible');
 for(const cut of shape.cuts){const p=cut.ends[0];assert(!E.pointWalkable(m,64+p[0],64+p[1]),'diagonal boundary has foot clearance');}
}
const square=island('grass',0);assert.equal(E.outline(square,2,2).cuts.length,0);assert(E.pointWalkable(square,65,65));
const unequal=island('grass');unequal.heights[2][2]=2;unequal.heights[1][2]=1;assert(!E.outline(unequal,2,2).cuts.some(c=>c.name==='nw'),'unequal neighboring floors stay square');
const ramp=island('grass');ramp.ramps[2][2]='n';assert.equal(E.outline(ramp,2,2).cuts.length,0,'ramp geometry remains intact');
for(const material of ['mixed','grass','sand','snow'])for(const cut of [0,8,12]){
 const m=E.fixture(material);m.cornerCut=cut;assert.deepEqual(Array.from(E.validate(m)),[]);
 const queue=[[7,15]],seen=new Set(['7,15']);for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of Object.values(E.dirs)){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&E.canMove(m,x*32+16,y*32+16,nx*32+16,ny*32+16)){seen.add(key);queue.push([nx,ny]);}}}
 assert(seen.has('8,7'),'upper shrine approach remains reachable');
}
console.log('PASS: 4 corners × 3 materials × 2 cuts; shared vertices; blocked high/low entry and borders; all 12 fixture route variants');

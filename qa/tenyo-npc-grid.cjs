const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const env={console,Image:class{constructor(){this.complete=true;this.naturalWidth=1536}},fetch:()=>new Promise(()=>{})};env.window=env;
vm.runInNewContext(fs.readFileSync('js/tenyo-main-scene.js','utf8'),env);const scene=env.YK_TENYO;
const game=fs.readFileSync('js/game.js','utf8'),start=game.indexOf(' shrine:['),end=game.indexOf('\n cove:',start);
const residents=vm.runInNewContext('('+game.slice(start+' shrine:'.length,end).trim().replace(/,$/,'')+')',{YK_TENYO:scene});
for(const n of residents){assert.equal(n.x%scene.WALK_CELL,scene.WALK_CELL/2,'NPC must be centered in the movement grid');assert.equal(n.y%scene.WALK_CELL,scene.WALK_CELL/2);assert(!scene.blocked(n.x,n.y),'NPC stands in an authored open cell');}
assert.deepEqual(Array.from(residents,n=>[n.x,n.y]),[[588,156],[708,372]],'maiden at stair center, guard near original location');
const runtime={S:{area:'shrine'},YK_TENYO:scene,areaNPCs:()=>residents,YK_INTERIOR_BASE:{area:()=>false},YK_INTERACTION:{sameTile:(a,b)=>Math.floor(a.x/32)===Math.floor(b.x/32)&&Math.floor(a.y/32)===Math.floor(b.y/32)}};
vm.runInNewContext(game.slice(game.indexOf('function npcBlocked('),game.indexOf('function faceNPC(')),runtime);
for(const n of residents){
 assert(runtime.npcBlocked(n.x,n.y));
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const from={x:n.x+dx*24,y:n.y+dy*24};
  assert(!runtime.npcBlocked(from.x,from.y),'adjacent cell must not be blocked by NPC');
  assert.deepEqual(JSON.parse(JSON.stringify(scene.step(from.x,from.y,-dx,-dy,runtime.npcBlocked))),from,'cannot step into the occupied NPC cell');
 }
 // Every pixel in this authored cell, and only this cell, is NPC occupancy.
 for(const ox of [-11.9,11.9])for(const oy of [-11.9,11.9])assert(runtime.npcBlocked(n.x+ox,n.y+oy));
}
runtime.window=runtime;
vm.runInNewContext(fs.readFileSync('js/interaction.js','utf8'),runtime);
vm.runInNewContext(game.slice(game.indexOf('function nearestNPC('),game.indexOf('function npcBlocked(')),runtime);
const n=residents[0];for(const [dx,dy,dir] of [[0,24,'u'],[0,-24,'d'],[24,0,'l'],[-24,0,'r']]){Object.assign(runtime.S,{x:n.x+dx,y:n.y+dy,dir});assert.equal(runtime.nearestNPC(),n,'talk from each facing adjacent cell');}
Object.assign(runtime.S,{x:n.x,y:n.y+48,dir:'u'});assert.equal(runtime.nearestNPC(),null,'do not talk through an empty cell');
const drawn=[],ctx={save(){},restore(){},setTransform(){},drawImage(){}};
const moved=residents.map(n=>({...n,x:n.x+24,y:n.y+24}));scene.draw(ctx,{x:600,y:300,npcs:moved},()=>{},(i,x,y)=>drawn.push([x,y]),()=>{});
assert.deepEqual(drawn,Array.from(moved,n=>[n.x,n.y]),'render queue uses the same live NPC positions as collision');
console.log('PASS Tenyo NPC grid: centered placement, stair center, exact one-cell occupancy, four-way approach/talk and shared render positions');

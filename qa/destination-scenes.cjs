const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const walkability=JSON.parse(fs.readFileSync('assets/maps/tenyo/walkability-48x32.json','utf8'));
const env={Image:class{},fetch:async()=>({ok:true,json:async()=>walkability}),console};env.window=env;for(const file of ['tenyo-main-scene','destination-scenes','collision','equipment'])vm.runInNewContext(fs.readFileSync('js/'+file+'.js','utf8'),env);
const scenes=env.YK_DESTINATION_SCENES;
const npcs={cove:[[585,570],[190,450]],forest:[[530,390]],waterfall:[[150,590]],fox:[[535,650]],hotspring:[[620,650]]};
// Tenyo uses its own map extent, authored grid and south exit, not the old
// 768px illustration's west exit. Exercise the production step function.
const tenyo=env.YK_TENYO,cell=tenyo.WALK_CELL;
assert.equal(walkability.columns*cell,tenyo.WIDTH);
assert.equal(walkability.rows*cell,tenyo.HEIGHT);
assert(!scenes.blocked('shrine',...tenyo.spawn),'shrine spawn');
let openCells=0,checkedMoves=0;
for(let row=0;row<walkability.rows;row++)for(let col=0;col<walkability.columns;col++){
 const x=(col+.5)*cell,y=(row+.5)*cell,blocked=walkability.grid[row][col]!=='.';
 assert.equal(tenyo.blocked(x,y),blocked,'embedded grid agrees with authored JSON');
 if(blocked)continue;
 openCells++;
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const p=tenyo.step(x,y,dx,dy,()=>false);
  assert(!tenyo.blocked(p.x,p.y),'step cannot enter a blocked cell');
  assert.equal(Math.hypot(p.x-x,p.y-y),tenyo.blocked(x+dx*cell,y+dy*cell)?0:cell,'one input moves exactly one cell');
  checkedMoves++;
 }
 const rejected=tenyo.step(x,y,1,0,()=>true);
 assert.equal(rejected.x,x);assert.equal(rejected.y,y);
 const diagonal=tenyo.step(x,y,1,1,()=>false);
 assert.equal(diagonal.x,x);assert.equal(diagonal.y,y);
}
const visited=new Set([tenyo.spawn.join(',')]),route=[tenyo.spawn];
for(let i=0;i<route.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
 const p=tenyo.step(...route[i],dx,dy,()=>false),key=[p.x,p.y].join(',');
 if(!visited.has(key)){visited.add(key);route.push([p.x,p.y]);}
}
assert.equal(route.length,openCells,'all authored walkable cells connect to entrance');
assert(route.some(p=>tenyo.exit(...p)),'shrine south exit');
for(const p of [...tenyo.npcs.map(n=>[n.x,n.y]),tenyo.chest]){
 assert(!tenyo.blocked(...p),'shrine target stands on walkable ground');
 assert(route.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<cell*1.5),'shrine target approach '+p);
}
for(const layer of ['background','torii','trees','shrine'])assert(fs.existsSync('assets/maps/tenyo/layer-'+layer+'.webp'));
console.log('shrine: '+openCells+' connected cells, '+checkedMoves+' moves, south exit and NPC/chest approaches reachable');
for(const [id,l] of Object.entries(scenes.layouts)){
 if(id==='shrine')continue;
 assert(!scenes.blocked(id,...l.spawn),id+' spawn');
 const seen=new Set(),queue=[l.spawn],blocked=(x,y)=>env.YK_COLLISION.blocked(id,x,y,true,{});
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(seen.has(key)||blocked(nx,ny))continue;seen.add(key);queue.push([nx,ny]);}}
 assert(queue.some(([x])=>x<40),id+' exit');
 const targets=[...npcs[id],...env.YK_EQUIPMENT.chests.filter(c=>c.area===id).map(c=>[c.x,c.y])];
 for(const p of targets)assert(queue.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<30),id+' interaction '+p);
 assert(fs.existsSync('assets/scenes/destinations-v1/'+id+'.webp'));
 console.log(id+': entrance, exit, all NPC and chest approaches reachable');
}

for(const layer of ['torii-base','torii-upper','trees-back','trees-front'])assert(fs.existsSync('assets/maps/tenyo/layer-'+layer+'.png'));

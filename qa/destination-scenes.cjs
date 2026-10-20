const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const env={};env.window=env;for(const file of ['destination-scenes','collision','equipment'])vm.runInNewContext(fs.readFileSync('js/'+file+'.js','utf8'),env);
const scenes=env.YK_DESTINATION_SCENES;
const npcs={shrine:[[515,370],[210,530]],cove:[[585,570],[190,450]],forest:[[530,390]],waterfall:[[150,590]],fox:[[535,650]],hotspring:[[620,650]]};
for(const [id,l] of Object.entries(scenes.layouts)){
 assert(!scenes.blocked(id,...l.spawn),id+' spawn');
 const seen=new Set(),queue=[l.spawn],blocked=(x,y)=>env.YK_COLLISION.blocked(id,x,y,true,{});
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(seen.has(key)||blocked(nx,ny))continue;seen.add(key);queue.push([nx,ny]);}}
 assert(queue.some(([x])=>x<40),id+' exit');
 const targets=[...npcs[id],...env.YK_EQUIPMENT.chests.filter(c=>c.area===id).map(c=>[c.x,c.y])];
 for(const p of targets)assert(queue.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<30),id+' interaction '+p);
 assert(fs.existsSync('assets/scenes/destinations-v1/'+id+'.webp'));
 console.log(id+': entrance, exit, all NPC and chest approaches reachable');
}

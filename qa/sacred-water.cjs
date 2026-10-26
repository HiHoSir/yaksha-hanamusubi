const assert=require('node:assert/strict'),fs=require('node:fs');global.window=global;require('../js/elevation-model.js');
const d=JSON.parse(fs.readFileSync('assets/maps/sacred-water-v1/scene.json'));const E=YK_ELEVATION,m=d.tiles;m.heights=d.heights;m.cornerCut=d.cornerCut;m.occupiedTiles=new Set(d.occupiedTiles.map(p=>p.join(',')));E.prepare(m);assert.deepEqual(E.validate(m),[]);
const allowed=new Set(d.walkableCells.map(p=>p.join(','))),q=[d.spawn],seen=new Set([d.spawn.join(',')]);
for(const [x,y] of q)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(allowed.has(k)&&!seen.has(k)&&E.canMove(m,x*32+16,y*32+16,nx*32+16,ny*32+16)){seen.add(k);q.push([nx,ny]);}}
assert(seen.has(d.goal.join(',')));assert.equal(seen.size,allowed.size);for(const[x,y]of d.occupiedTiles){assert(!E.pointWalkable(m,x*32+16,y*32+16));assert(!allowed.has(x+','+y));}
for(const o of d.objects){assert(fs.existsSync(o.src),o.src);assert(o.occupiedTiles.every(p=>p.every(Number.isInteger)));}
for(const file of ['water-0.png','water-1.png','terrain.png','overview.png']){const p=fs.readFileSync('assets/maps/sacred-water-v1/'+file);assert.equal(p.readUInt32BE(16),1024);assert.equal(p.readUInt32BE(20),832);}
assert(!fs.readFileSync('js/sacred-water.js','utf8').includes('localStorage'));
console.log('PASS: 108 reachable causeway cells, goal, gate post collision, shared elevation, image references/dimensions, save isolation');

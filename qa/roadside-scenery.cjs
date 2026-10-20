const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const env={};env.window=env;
for(const name of ['field-terrain','world','landscape'])vm.runInNewContext(fs.readFileSync('js/'+name+'.js','utf8'),env);
const w=env.YK_WORLD,m=w.mapData,art=env.YK_LANDSCAPE;
const added=m.decorations.filter(o=>o.sceneryId),base=m.map(r=>r.slice());
base.decorations=m.decorations.filter(o=>!o.sceneryId);
const occupied=new Set();
for(const o of m.decorations)for(const [x,y] of o.occupiedTiles||[]){
 assert(Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<80&&y<80);
 assert(!occupied.has(x+','+y),'duplicate occupancy');occupied.add(x+','+y);
}
assert.equal(added.length,35);
assert.equal(added.filter(o=>o.kind==='stoneMonument').length,4);
assert.equal(new Set(added.map(o=>o.sceneryLeg)).size,6);
for(const o of added){
 const [[tx,ty]]=o.contactTiles;
 assert.equal(m[ty][tx],'grass','ground contact must remain on dry grass');
 assert.equal(o.x,tx*32);assert.equal(o.y,ty*32);assert.equal(o.foot,(ty+1)*32);
 assert.equal(o.width,32);assert.equal(o.height,32);
 assert.deepEqual(JSON.parse(JSON.stringify(o.occupiedTiles)),o.kind==='stoneMonument'?[[tx,ty]]:[]);
 for(const p of Object.values(w.places))assert(Math.max(Math.abs(tx+.5-p.point[0]/32),Math.abs(ty+.5-p.point[1]/32))>=4,'entrance clearance');
 for(const road of w.roads)for(const [x,y] of road)assert(Math.max(Math.abs(tx-Math.floor(x/32)),Math.abs(ty-Math.floor(y/32)))>=2,'road clearance');
 assert.equal(art.walkable(m,tx*32+16,ty*32+16,12),o.kind==='newTrees');
}
assert.equal(w.roads.length,6);
for(const path of w.roads)for(let i=1;i<path.length;i++){
 const [ax,ay]=path[i-1],[bx,by]=path[i];
 for(let t=0;t<=8;t++)assert(art.walkable(m,ax+(bx-ax)*t/8,ay+(by-ay)*t/8,12),'route blocked between grid centers');
}
// Every previously walkable center remains walkable except the four visible stones.
const stones=new Set(added.filter(o=>o.kind==='stoneMonument').map(o=>o.contactTiles[0].join(',')));
for(let y=0;y<80;y++)for(let x=0;x<80;x++)if(art.walkable(base,x*32+16,y*32+16,12)&&!stones.has(x+','+y))assert(art.walkable(m,x*32+16,y*32+16,12),'unexpected loss of walkable cell');
console.log('PASS: 35 accents / 6 legs; dry ground, grid alignment, explicit occupancy, entrances and continuous routes');

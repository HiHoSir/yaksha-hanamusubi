const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const env={};env.window=env;
for(const name of ['field-terrain','world','landscape'])vm.runInNewContext(fs.readFileSync('js/'+name+'.js','utf8'),env);
const w=env.YK_WORLD,m=w.mapData,a=env.YK_LANDSCAPE,g=env.YK_FIELD_TERRAIN.referenceComposition;
assert.equal(m.length,80);assert(m.every(r=>r.length===80));assert.equal(w.roads.length,11);
const occupied=new Set();
for(const o of m.decorations){
 for(const [x,y] of [...o.contactTiles,...o.occupiedTiles])assert(Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<80&&y<80,'invalid cell '+o.kind);
 for(const [x,y] of o.occupiedTiles){assert(!occupied.has(x+','+y),'overlapping occupancy '+o.kind);occupied.add(x+','+y);}
 if(!['bridge','bridgeNS','waterfall'].includes(o.kind))for(const [x,y] of o.contactTiles)assert(!['sea','river'].includes(m[y][x]),'water contact '+o.kind+' '+x+','+y);
 if(o.kind==='newMountainLarge')assert.equal(o.occupiedTiles.length,4);
 if(o.kind==='newTrees')assert.equal(o.occupiedTiles.length,0);
}
for(const [id,p] of Object.entries(w.places))assert(a.walkable(m,...p.point,12),'blocked destination '+id);
for(const p of w.restStops)assert(a.walkable(m,...p.point,12),'blocked rest stop '+p.id);
for(const p of w.guides)assert(a.walkable(m,p.x,p.y,12),'blocked guide '+p.name);
for(const [leg,path] of w.roads.entries())for(let i=1;i<path.length;i++){
 const [x,y]=path[i-1],[xx,yy]=path[i];assert.equal(Math.abs(xx-x)+Math.abs(yy-y),32);
 for(let t=0;t<=8;t++)assert(a.walkable(m,x+(xx-x)*t/8,y+(yy-y)*t/8,12),'blocked route '+leg+' at '+[x/32,y/32,xx/32,yy/32]);
}
const before=w.start.slice();assert.deepEqual(w.safePosition(before),before);
for(const o of m.decorations.filter(o=>o.occupiedTiles.length).slice(0,20)){
 const [x,y]=o.occupiedTiles[0],p=w.safePosition([x*32+16,y*32+16]);assert(a.walkable(m,...p,8),'save repair blocked');
}
assert(m.flat().filter(t=>t==='forest').length>500);assert(m.flat().filter(t=>t==='mountain').length>250);
assert.equal(a.objects(m).length,m.decorations.filter(o=>!o.ground).length,'duplicate procedural scenery');
const coastalMountains=m.decorations.filter(o=>o.biome==='mountain'&&o.contactTiles.some(([x,y])=>x>=28&&x<=48&&y>=64&&y<=77));
assert(coastalMountains.length>=20,'missing village coastal ridges');
assert(a.walkable(m,...w.start,12),'village field spawn blocked by coastal ridges');
// Reference geography: islands must stay separate, beach is actual dry land,
// water cannot retain an elevation from the old coastline, and route legs must
// not backtrack to a previously visited cell.
const water=t=>t==='sea'||t==='river';
function landComponent(x,y){const q=[[x,y]],seen=new Set([x+','+y]);assert(!water(m[y][x]));for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&yy>=0&&xx<80&&yy<80&&!water(m[yy][xx])&&!seen.has(xx+','+yy)){seen.add(xx+','+yy);q.push([xx,yy]);}}return seen;}
const mainland=landComponent(37,70);
for(const [x,y] of [[8,10],[13,7],[34,17],[66,48],[23,68]]){
 assert(!water(m[y][x]),'reference island lost '+[x,y]);
 assert(!mainland.has(x+','+y),'reference island merged into mainland '+[x,y]);
}
for(let y=0;y<80;y++)for(let x=0;x<80;x++)if(water(m[y][x])||m[y][x]==='bridge')assert.equal(m.heights[y][x],0,'elevated water '+[x,y]);
assert(m.flat().filter(t=>t==='sand').length>=200,'missing reference beaches');
assert.equal(m[18][30],'river');assert.equal(m[18][34],'forest');
for(const r of w.roads)assert.equal(new Set(r.map(c=>c.join(','))).size,r.length,'route doubles back');
// Channels must be four-neighbor continuous, including the water below bridge
// decks. A dry plaza or abutment must never erase a channel cell.
const wet=(x,y)=>water(m[y]?.[x])||m.bridgeWaterCells.has(x+','+y);
const ocean=new Set(['0,0']),queue=[[0,0]];
for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&yy>=0&&xx<80&&yy<80&&wet(xx,yy)&&!ocean.has(xx+','+yy)){ocean.add(xx+','+yy);queue.push([xx,yy]);}}
for(const [name,cells] of Object.entries(g.watercourses)){
 const keys=new Set(cells.map(c=>c.join(','))),seen=new Set([cells[0].join(',')]),q=[cells[0]];
 for(let i=0;i<q.length;i++){const [x,y]=q[i];assert(wet(x,y),'dry channel '+name+' '+[x,y]);for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const k=xx+','+yy;if(keys.has(k)&&!seen.has(k)){seen.add(k);q.push([xx,yy]);}}}
 assert.equal(seen.size,keys.size,'diagonal-only channel '+name);
 for(const p of cells)assert(ocean.has(p.join(',')),'disconnected drainage '+name+' '+p);
}
for(const b of m.decorations.filter(o=>o.kind==='bridge'||o.kind==='bridgeNS')){
 const [x,y]=b.contactTiles[1];assert(m.bridgeWaterCells.has(x+','+y),'bridge center is not over water');
 const sides=b.kind==='bridge'?[[x,y-1],[x,y+1]]:[[x-1,y],[x+1,y]];
 assert(sides.every(([xx,yy])=>wet(xx,yy)),'water interrupted at bridge '+[x,y]);
}
console.log('PASS reference field: explicit contacts, all destinations, 11 continuous routes, bridge traversal, save repair and no duplicated scenery');



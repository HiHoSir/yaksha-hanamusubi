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
console.log('PASS reference field: explicit contacts, all destinations, 11 continuous routes, bridge traversal, save repair and no duplicated scenery');

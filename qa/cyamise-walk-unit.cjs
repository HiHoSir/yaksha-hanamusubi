const assert=require('assert/strict');
const R=require('../js/cyamise-walk-rules.js');
// Mirror the adopted left wall and walking corridor around center column5.
for(let y=0;y<R.height;y++)for(let x=0;x<=10;x++)assert.equal(R.walkable(x,y),R.walkable(10-x,y),`mirror cell (${x},${y})`);
assert.equal(R.step({x:9,y:4},1,0),null,'right wall matches the left wall');
assert(R.walkable(5,6));assert(R.walkable(1,4));
for(const o of R.objects){assert.equal(o.occupiedTiles.length,2);for(const [x,y] of o.occupiedTiles)assert.equal(R.walkable(x,y),false,o.id);}
for(const p of [[-1,4],[12,4],[5,-1],[5,R.height],[0,4],[11,4],[1,2]])assert.equal(R.walkable(...p),false);
let p={x:1,y:5};const before=JSON.stringify(p);assert.equal(R.step(p,1,0),null);assert.equal(JSON.stringify(p),before);
assert.deepEqual(R.step(p,0,1),{x:1,y:6});
assert.equal(R.step(p,1,1),null);assert.equal(R.step(p,2,0),null);
for(let y=0;y<R.height;y++)for(let x=0;x<12;x++)if(R.walkable(x,y)){
 const route=R.path(R.spawn,{x,y});assert(route,'all legal cells reachable');
 let prev=R.spawn;for(const n of route){assert.equal(Math.abs(n.x-prev.x)+Math.abs(n.y-prev.y),1);assert(R.walkable(n.x,n.y));prev=n;}
 assert.deepEqual(prev,{x,y});
 const foot=R.foot(x,y);assert.equal(foot.x,11.5+x*32+16);assert.equal(foot.y,2.5+y*32+16);
}
assert.equal(R.path(R.spawn,{x:2,y:5}),null);
console.log('PASS authored 2x1 contacts, bounds, whole-cell blocking, four-direction routes and centered feet');

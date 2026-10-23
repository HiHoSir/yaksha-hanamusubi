const assert=require('assert/strict'),R=require('../js/hozuki-topview-rules.js');
assert.equal(R.buildings.length,8);assert.equal(R.trees.length,6);assert.equal(R.bridges.length,2);
assert.equal(R.width*32,1536);assert.equal(R.height*32,1280);
assert.equal(new Set(R.occupiedTiles.map(p=>p.join(','))).size,R.occupiedTiles.length);
for(const [x,y] of R.occupiedTiles)assert(Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<48&&y>=0&&y<40);
for(const t of R.targets){assert(R.walkable(...t.cell),t.id+' must be open');const route=R.path(R.spawn,{x:t.cell[0],y:t.cell[1]});assert(route,t.id+' reachable');let p=R.spawn;for(const n of route){assert(R.canStep(p,n.x-p.x,n.y-p.y));p=n;}console.log('PASS route',t.id,route.length,'steps');}
assert(!R.canStep(R.spawn,1,1),'no diagonal step');assert(!R.canStep(R.spawn,.5,0),'no fractional step');
for(const [x,y] of R.occupiedTiles)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const p={x:x-dx,y:y-dy};if(R.walkable(p.x,p.y))assert(!R.canStep(p,dx,dy),'reject blocked stride atomically');}
for(let y=0;y<40;y++)for(let x=3;x<47;x++)if(R.cliff(x,y))assert(!R.walkable(x,y),'cliff not climbable');
assert(R.path({x:24,y:35},{x:24,y:28}),'south bridge crosses water');assert(R.path({x:37,y:12},{x:43,y:12}),'east bridge crosses water');
assert(!R.canStep({x:20,y:18},1,0),'cannot enter a ramp through its disconnected side');
assert(R.canStep({x:22,y:14},0,1),'upper ramp join');assert(R.canStep({x:22,y:19},0,1),'lower ramp join');
for(const [x,y] of R.bridgeRails)assert(!R.walkable(x,y),'rail cells blocked');
console.log('PASS authored integer occupancy, all required routes, both crossings, blocked strides, 4 directions');

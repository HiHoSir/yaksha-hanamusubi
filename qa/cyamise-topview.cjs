const assert=require('assert/strict'),R=require('../js/cyamise-walk-rules.js');
assert.deepEqual(R.viewport,{width:384,height:320});
for(const o of R.objects)assert.equal(o.occupiedTiles.length,o.type==='table'?4:2,'overhead surface occupancy');
for(let x=1;x<=9;x++)assert(R.walkable(x,2),'rear furniture approach row');
assert(R.walkable(5,8));assert(!R.walkable(1,8),'south wall must block walking out of the artwork');
console.log('PASS top-view surface contacts, rear approach row and centered south entrance');

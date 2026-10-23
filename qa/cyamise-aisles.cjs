const assert=require('assert/strict'),R=require('../js/cyamise-walk-rules.js');
assert.equal(R.height,10,'preserve original room dimensions');
for(const o of R.objects)assert.equal(o.occupiedTiles[0][1],{'bench-back':3,table:4,'bench-front':6}[o.type],'do not move chairs or tables');
for(let x=1;x<=9;x++)assert(R.walkable(x,2),`walk in front of rear furniture (${x},2)`);
for(let x=0;x<R.width;x++)assert(!R.walkable(x,1),'rear wall stays blocked');
console.log('PASS original furniture layout and walkable row in front of rear equipment');

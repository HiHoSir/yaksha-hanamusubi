const assert=require('assert/strict'),R=require('../js/cyamise-walk-rules.js');
assert.equal(R.height,10,'add two floor rows without shrinking the hero or furniture');
for(const y of [4,6])for(let x=1;x<=9;x++)assert(R.walkable(x,y),`cross aisle (${x},${y})`);
for(const o of R.objects)assert.equal(o.occupiedTiles[0][1],{'bench-back':3,table:5,'bench-front':7}[o.type]);
assert.deepEqual(R.spawn,{x:5,y:8});
console.log('PASS two continuous cross aisles, preserved 2x1 furniture contacts and entrance spawn');

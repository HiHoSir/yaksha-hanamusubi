'use strict';
// Natural cave logical map preflight. No image, renderer, or production game changes.
const assert = require('node:assert/strict');
const test = require('node:test');
const A = require('../js/settlement-map/autotile.js');
const rows = [
  '####################',
  '#..........#.......#',
  '#.####.....#.......#',
  '#.#..#.............#',
  '#.#..#####..#####..#',
  '#.#.............#..#',
  '#.######.######.#..#',
  '#........#......#..#',
  '#..#######..#####..#',
  '#..................#',
  '#..................#',
  '####################'
];
const width=20,height=12,entry=[1,10],exit=[18,1],treasure=[11,7];
const key=(x,y)=>x+','+y;
const floor=new Set(),blocks=[];
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(rows[y][x]==='.')floor.add(key(x,y));else blocks.push([x,y]);
}
function reachable(from,to){
  const q=[from],seen=new Set([key(...from)]);
  for(let i=0;i<q.length;i++){
    const [x,y]=q[i];if(x===to[0]&&y===to[1])return true;
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
      const nx=x+dx,ny=y+dy,k=key(nx,ny);
      if(floor.has(k)&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}
    }
  }
  return false;
}
test('24? no: 20x12 fixture, uniform cells, closed boundary',()=>{
  assert.equal(rows.length,height);
  assert.ok(rows.every(r=>r.length===width));
  for(let x=0;x<width;x++){assert.equal(rows[0][x],'#');assert.equal(rows[height-1][x],'#');}
  for(const r of rows){assert.equal(r[0],'#');assert.equal(r[width-1],'#');}
});
test('entry, exit and treasure are physically reachable via cardinal movement',()=>{
  for(const p of [entry,exit,treasure])assert.ok(floor.has(key(...p)));
  assert.ok(reachable(entry,exit));assert.ok(reachable(entry,treasure));
});
test('explicit collision cells are integers, unique and disjoint from floor',()=>{
  const seen=new Set();
  for(const [x,y] of blocks){
    assert.ok(Number.isInteger(x)&&Number.isInteger(y));
    assert.ok(x>=0&&x<width&&y>=0&&y<height);
    assert.ok(!seen.has(key(x,y)));seen.add(key(x,y));
    assert.ok(!floor.has(key(x,y)));
  }
  assert.equal(seen.size+floor.size,width*height);
});
test('existing autotile normalization produces 47 unique masks',()=>{
  assert.equal(A.masks.length,47);
  assert.equal(new Set(A.masks).size,47);
  for(let i=0;i<256;i++)assert.ok(A.indices[A.normalize(i)]!==undefined);
});

// Exercise the *production* texture-chunk cache in isolation without a GPU,
// image loading, or timing-sensitive browser fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/landscape.js','utf8');
const start=source.indexOf(' const ELEVATION_CHUNK_LIMIT=');
const end=source.indexOf(' function drawQuarter(',start);
assert(start>0&&end>start,'production cache extraction points changed');
let builds=0;
const sandbox={
 WeakMap,Map,Set,Math,
 floors:new WeakMap(),roads:new WeakMap(),shadows:new WeakMap(),
 groundLayer:()=>({generation:++builds}),
};
vm.createContext(sandbox);
vm.runInContext(source.slice(start,end)+
 '\\nwindowCache={get:elevationTexture,stats:elevationChunkStats};',sandbox);
const {get,stats}=sandbox.windowCache;
const map=Array.from({length:80},()=>Array(80).fill('grass'));
map.bridgeWaterCells=new Set();map.paths=[];map.decorations=[];
assert.equal(stats(map).count,0);
const resident=get(map,16,16);
assert.strictEqual(get(map,17,18).surface,resident.surface,'same authored chunk reuses exactly one canvas');
assert.equal(get(map,17,18).x,64);
assert.equal(get(map,17,18).y,64);
// Cover 100 unique 8x8 source chunks, deliberately beyond the cache ceiling.
for(let y=0;y<80;y+=8)for(let x=0;x<80;x+=8){
 const t=get(map,x,y);
 assert(t.surface&&t.x>=0&&t.y>=0,'valid ground source');
 assert(stats(map).count<=64,'cache must never exceed its memory budget');
}
assert.equal(stats(map).count,64,'full traversal must reach but not exceed budget');
const built=builds;
const last=get(map,72,72);
assert.strictEqual(get(map,72,72).surface,last.surface,'recent visible chunk stays cached');
assert.equal(builds,built,'cache hit does not recomposite terrain');
const firstAgain=get(map,16,16);
assert.notStrictEqual(firstAgain.surface,resident.surface,'oldest unseen chunk can be evicted');
assert.equal(stats(map).count,64);
assert.equal(firstAgain.x,resident.x);
assert.equal(firstAgain.y,resident.y);
assert.equal(resident.surface.generation>0,true,'eviction must NOT clear in-flight canvas references');
console.log('PASS chunk cache limit: 64, LRU reuse, eviction and world-space texture offsets');

const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/settlement-map/catalog.js'),M=require('../js/settlement-map/model.js'),R=require('../js/settlement-map/render.js');
const {createCanvas,loadImage}=require('@napi-rs/canvas');

test('approved torii reuses PNG with only bottom left/right posts blocked',async()=>{
 const t=C.byId.torii_gate;assert(t);
 assert.equal(t.src,'assets/terrain/places-v1/torii.png');
 assert.deepEqual(t.sourceRect,[0,0,64,64]);
 assert.deepEqual(t.displayCells,[4,4]);
 assert.deepEqual(t.renderCells,[4,4]);
 assert.deepEqual(t.occupiedTiles,[[0,0],[3,0]]);
 const im=await loadImage(t.src);assert.equal(im.width,64);assert.equal(im.height,64);
 const m=M.place(M.createMap(12,12),t.id,3,5);
 const placed=m.objects[0];assert.deepEqual(placed.occupiedTiles,[[3,5],[6,5]]);
 assert.deepEqual(M.visualRect(m,placed),{x:96,y:64,width:128,height:128});
 const blocked=M.collision(m);
 for(const p of [[3,5],[6,5]])assert(blocked.has(M.key(p)));
 for(const p of [[4,5],[5,5],[3,4],[4,4],[5,4],[6,4],[4,3]])assert(!blocked.has(M.key(p)));
 assert(M.path(m,[4,6],[4,1]),'center passage should be reachable');
 assert.deepEqual(M.parse(M.serialize(m)),m,'JSON roundtrip retains exactly two posts');
 const cv=createCanvas(384,384),ctx=cv.getContext('2d');R.draw(ctx,m,{images:{torii_gate:im},forExport:false});
 const rgba=ctx.getImageData(0,0,384,384).data;
 let colored=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i])colored++;
 assert(colored>200,'object renders at target size');
});
test('unrelated visualRects remain unchanged',()=>{
 const m=M.createMap();
 const w=C.byId.well,house=C.byId.building_tea;
 assert.deepEqual(M.visualRect(m,{templateId:'well',x:5,y:5}),{x:165,y:164,width:22,height:28});
 assert.deepEqual(M.visualRect(m,{templateId:'building_tea',x:5,y:5}),{x:162,y:127,width:92,height:65});
});

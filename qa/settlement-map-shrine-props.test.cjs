const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const C=require('../js/settlement-map/catalog.js'),M=require('../js/settlement-map/model.js'),R=require('../js/settlement-map/render.js');
test('torii blocks its two posts, retains a north-south passage and round-trips edits',()=>{
  let m=M.place(M.createMap(),'torii',4,5);
  a.deepEqual(m.objects[0].occupiedTiles,[[4,5],[6,5]]);
  a(M.path(m,[5,7],[5,2]));a(!M.path(m,[4,6],[4,5]));
  m=M.move(m,m.objects[0].id,8,7);a.deepEqual(m.objects[0].occupiedTiles,[[8,7],[10,7]]);
  a.deepEqual(M.parse(M.serialize(m)),m);
});
test('hand basin and reused stone lantern have separate single-cell contacts and valid PNGs',()=>{
  for(const [id,size]of [['temizu',[1,1]],['stone_lantern',[1,1]]]){
    const t=C.byId[id];a(t);a.deepEqual(t.displayCells,size);
    const m=M.place(M.createMap(),id,4,5);a.deepEqual(m.objects[0].occupiedTiles,[[4,5]]);
    a.deepEqual(M.parse(M.serialize(m)),m);
    const png=fs.readFileSync(__dirname+'/../'+t.src);a.equal(png.subarray(1,4).toString(),'PNG');
    a.equal(png.readUInt32BE(16),32);a.equal(png.readUInt32BE(20),id==='temizu'?64:32);
  }
  a.equal(C.byId.stone_lantern.src,'assets/interior-editor/completion-v1/stone_lantern.png');
});
test('basin animates only its source frame; static export always takes frame zero',()=>{
  const m=M.place(M.createMap(),'temizu',4,5),images={temizu:{}},calls=[];
  const c={clearRect(){},drawImage(...args){calls.push(args)}};
  for(const [options,sy]of [[{animationTime:0},0],[{animationTime:360},32],[{animationTime:360,forExport:true},0]]){
    calls.length=0;R.draw(c,m,{images,...options});a.equal(calls.length,1);a.equal(calls[0][2],sy);
    a.deepEqual(calls[0].slice(5),[128,160,32,32]);
  }
});

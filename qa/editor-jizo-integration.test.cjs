const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{loadImage}=require('@napi-rs/canvas'),C=require('../js/settlement-map/catalog'),M=require('../js/settlement-map/model');
test('approved B pixels are shared by the field replacement and the one-cell editor chip',async()=>{
 const field=fs.readFileSync('assets/terrain/places-v1/jizo.png'),chip=fs.readFileSync(C.byId.jizo.src.split('?')[0]);
 a.equal(crypto.createHash('sha256').update(field).digest('hex'),'5014bcaeb80d3cc01ce940552a50a9cfd19f7a37fb2d492d450b8a5532b74b95');a.deepEqual(field,chip);
 const im=await loadImage(field);a.deepEqual([im.width,im.height],[32,32]);a.deepEqual(C.byId.jizo.occupiedTiles,[[0,0]]);
 const map=M.place(M.createMap(),'jizo',2,2);a(M.collision(map).has('2,2'));a(M.flood(map,[0,0]).has('2,1'));a(M.flood(map,[0,0]).has('2,3'));a.deepEqual(M.parse(M.serialize(map)),map);
});
test('every visible editor palette entry resolves to real artwork and a valid source rectangle',async()=>{
 for(const t of C.templates.filter(t=>!t.hidden)){
  const im=await loadImage(fs.readFileSync(t.src.split('?')[0]));a(im.width&&im.height,t.id);
  if(!t.autotile){const [x,y,w,h]=t.sourceRect;a(x>=0&&y>=0&&x+w<=im.width&&y+h<=im.height,t.id);}
  if(t.preview)a(fs.existsSync(t.preview.split('?')[0]),t.preview);
 }
});
test('field guides retain their authored pass-through contract while loading 32px Jizo',()=>{
 const world=fs.readFileSync('js/world.js','utf8'),land=fs.readFileSync('js/landscape.js','utf8');
 a(world.includes("kind:'jizo',x:tx*32,y:ty*32,width:32,height:32,foot:(ty+1)*32,contactTiles:[[tx,ty]],occupiedTiles:[],walkThrough:true"));
 a(land.includes('jizo:[32,32]'));a(!/kind:'jizo'[^\n]*width:24,height:40/.test(land));
});

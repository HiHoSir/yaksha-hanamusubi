const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const O=require('../js/sprite-outline.js'),P=require('../js/hozuki-village-core.js'),R=require('../js/settlement-map/render.js');
(async()=>{
 const atlas=await loadImage('assets/characters/hizuki/field-sd-v3/walk-atlas-32.png');
 const game=fs.readFileSync('js/game.js','utf8'),calls=[];
 const ctx=createCanvas(160,160).getContext('2d');
 const nativeDraw=ctx.drawImage.bind(ctx);ctx.drawImage=(...args)=>{calls.push([ctx,...args]);nativeDraw(...args)};
 const env={HIZUKI_FIELD_SD:atlas,HIZUKI_4DIR_ROW:{d:0,u:1,r:2,l:3},SD_FIELD_BOUNDS_CACHE:new Map(),hizukiArt:'sd',characterScale:()=>1,ensureImage(){},layerReady:()=>true,document:{createElement:()=>createCanvas(32,32)},YKSpriteOutline:{draw(){throw Error('Hizuki must not receive a second outline')}}};
 vm.createContext(env);
 vm.runInContext(game.slice(game.indexOf('function sdFieldBounds('),game.indexOf('// Approved SD atlas shared')),env);
 vm.runInContext(game.slice(game.indexOf('function shadow('),game.indexOf('// Measure opaque character bounds')),env);
 for(const [row,dir]of ['d','u','r','l'].entries()){
  const transforms=[];
  for(const [col,frame]of [1,0,2].entries()){
   env.hero(ctx,80,80,dir,frame,'normal',.56);const a=calls.at(-1);
   assert.equal(a[2],col*32);assert.equal(a[3],row*32);transforms.push(a.slice(6));
  }
  assert.deepEqual(transforms[0],transforms[1],'field must preserve authored bounce');
  assert.deepEqual(transforms[0],transforms[2],'field must preserve authored bounce');
 }
 const bounds=P.fieldBounds(atlas,createCanvas);
 for(const dir of ['d','u','r','l']){
  const transforms=[];
  for(const frame of [1,0,2])R.actor(ctx,P.spriteState({x:1,y:1,dir,frame}),atlas,bounds,32,(...a)=>transforms.push(a.slice(6)));
  assert.deepEqual(transforms[0],transforms[1]);assert.deepEqual(transforms[0],transforms[2]);
 }
 const images=[];class Image{constructor(){images.push(this)}set src(v){this.srcValue=v;this.complete=true;this.naturalWidth=96;this.onload?.()}}
 const npc={Image};npc.window=npc;vm.runInNewContext(fs.readFileSync('js/tenyo-npc-art.js','utf8'),npc);
 await npc.YK_TENYO_NPC.whenReady();assert(images[0].srcValue.includes('tenyo-npc-v3/'));
 const drawCalls=[],nc={save(){},restore(){},beginPath(){},ellipse(){},fill(){},drawImage(...a){drawCalls.push(a)}};
 for(const dir of ['d','u','r','l']){
  assert(npc.YK_TENYO_NPC.draw(nc,80,80,'miko',dir));const a=drawCalls.at(-1);
  assert.equal(a[1],0,'NPC remains stationary');assert.equal(a[2],({d:0,u:1,r:2,l:3})[dir]*32);
  assert(Math.abs(a[8]*27/32-28)<1e-9,'white shrine resident matches 28px SD scale');
 }
 for(const f of ['js/game.js','js/hozuki-village-game.js','js/interior-maps.js','js/settlement-map/editor.js','interior-map-editor.html'])assert(fs.readFileSync(f,'utf8').includes('field-sd-v3/walk-atlas-32.png?v=16.1.62'),f);
 console.log('PASS runtime: 4 directions / 3 poses keep one transform, white shrine NPC idle directions and 28px scale, 5 asset consumers');
})().catch(e=>{console.error(e);process.exit(1)});

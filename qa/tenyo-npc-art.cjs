const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let canvas;try{canvas=require('@napi-rs/canvas')}catch{canvas=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}))}
const {createCanvas,loadImage}=canvas;
const moduleSource=fs.readFileSync('js/tenyo-npc-art.js','utf8');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('assets/characters/tenyo-npc-v1/manifest.json'));
 const images=[];class Image{constructor(){images.push(this);this.complete=false}set src(value){this.srcValue=value;loadImage(value.split('?')[0]).then(im=>{this.image=im;this.complete=true;this.naturalWidth=im.width;this.naturalHeight=im.height;this.onload?.()},()=>this.onerror?.())}}
 const env={Image,console};env.window=env;vm.runInNewContext(moduleSource,env);const art=env.YK_TENYO_NPC;
 assert.equal(images.length,0,'other areas do not preload shrine NPCs');
 let redrawn=0;await art.whenReady(()=>redrawn++);assert.equal(images.length,2);assert.equal(redrawn,2);await art.whenReady();assert.equal(images.length,2,'no duplicate image requests');
 const calls=[],ctx={save(){},restore(){},beginPath(){},ellipse(){},fill(){},drawImage(...args){calls.push(args)}};
 for(const type of ['miko','guard'])for(const [row,dir] of ['d','u','l','r'].entries()){
  assert(art.draw(ctx,552,264,type,dir,1));const args=calls.at(-1);
  assert.equal(args[2],row*256,'correct four-direction source row');assert.equal(args[3],256);assert.equal(args[4],256);
  assert.equal(args[6]+248*args[8]/256,264+9*.56,'ground foot matches heroine');
  assert.equal(args[8]*232/256,58*.96,'adult visible height matches existing NPC policy');
 }
 assert.equal(art.draw(ctx,0,0,'traveler','d',1),false,'unrelated NPCs stay on their existing path');
 for(const entry of manifest.characters){
  const im=await loadImage('assets/characters/tenyo-npc-v1/'+entry.id+'.png');assert.equal(im.width,256);assert.equal(im.height,1024);
  for(let row=0;row<4;row++){
   const c=createCanvas(256,256),g=c.getContext('2d');g.drawImage(im,0,row*256,256,256,0,0,256,256);const p=g.getImageData(0,0,256,256).data;
   let top=256,bottom=-1,solid=0,clear=0;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){const a=p[(y*256+x)*4+3];if(a>32){top=Math.min(top,y);bottom=Math.max(bottom,y);solid++}if(a===0)clear++}
   assert(Math.abs((bottom-top+1)-232)<=3,'consistent visible height');assert(Math.abs(bottom+1-248)<=2,'aligned sole');assert(solid>4000&&clear>25000,'real illustrated body with transparent surroundings');
  }
 }
 // The actual main NPC function must choose the new static art before its legacy path.
 const game=fs.readFileSync('js/game.js','utf8');const npcSource=game.slice(game.indexOf('function npc(c,'),game.indexOf('function drawVillageCollisionDebug'));
 const runtime={...env,S:{area:'shrine'},YK_TENYO_NPC:art,characterScale:()=>1};vm.createContext(runtime);vm.runInContext(npcSource,runtime);
 for(const frame of [0,1,2])runtime.npc(ctx,552,264,'miko','白妙','l',frame);
 assert(calls.slice(-3).every(c=>c[2]===512),'static pose ignores walk frame');
 const actual=JSON.parse(JSON.stringify(manifest.characters.find(c=>c.id==='guardian').frames));assert.deepEqual(actual.map(f=>f.sourceCell),[[0,0],[1,0],[1,1],[0,1]],'guardian left/right cells are reordered');
 // Render both real main-game NPC callbacks beside the canonical hero through
 // the shared shrine layer queue, at their shared authored cell centers.
 env.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('assets/maps/tenyo/walkability-48x32.json'))});
 vm.runInNewContext(fs.readFileSync('js/tenyo-main-scene.js','utf8'),env);await env.YK_TENYO.whenReady();
 Object.assign(env,{characterScale:()=>1,hizukiArt:'sd',S:{area:'shrine'},HIZUKI_4DIR:await loadImage('assets/characters/hizuki/bluebob-v1/walk-atlas-256.png'),HIZUKI_4DIR_ROW:{d:0,u:1,r:2,l:3},ensureImage(){},layerReady:im=>!!im});
 vm.runInNewContext(game.slice(game.indexOf('function shadow('),game.indexOf('// Measure opaque character bounds')),env);
 const out='qa/results/tenyo-npc';fs.mkdirSync(out,{recursive:true});
 for(const direction of ['d','u','l','r']){
  const c=createCanvas(768,768),g=c.getContext('2d');
  const wrapped=new Proxy(g,{get(t,k){if(k==='drawImage')return(im,...args)=>t.drawImage(im.image||im,...args);const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true}});
  env.YK_TENYO.draw(wrapped,{x:600,y:300},(x,y)=>env.hero(wrapped,x,y,'d',1,'normal',.56),(i,x,y)=>runtime.npc(wrapped,x,y,['miko','guard'][i],['白妙','社守'][i],direction,1),()=>{});
  fs.writeFileSync(out+'/'+direction+'.png',c.toBuffer('image/png'));
 }
 // Delayed/error assets must not advance a transition into missing NPC graphics.
 const pending=[];const broken={console,Image:class{constructor(){pending.push(this)}}};broken.window=broken;vm.runInNewContext(moduleSource,broken);
 const readiness=broken.YK_TENYO_NPC.whenReady();pending[1].onerror();await assert.rejects(readiness,/社.*画像/);assert(broken.YK_TENYO_NPC.failed());
 assert.equal(broken.YK_TENYO_NPC.draw(ctx,0,0,'guard','d'),false,'old art remains available on failure');
 const start=game.indexOf(' shrine:[');const end=game.indexOf('\n cove:',start);
 const residents=vm.runInNewContext('('+game.slice(start+' shrine:'.length,end).trim().replace(/,$/,'')+')',{YK_TENYO:env.YK_TENYO});
 assert.deepEqual(Array.from(residents,n=>[n.x,n.y,n.name]),[[588,156,'白妙'],[708,372,'社守']]);
 assert(residents.every(n=>n.stationary),'no wandering without walking artwork');
 const settlement=fs.readFileSync('js/settlement.js','utf8');
 const wanderContext={previousTick:0};
 vm.runInNewContext(settlement.slice(settlement.indexOf(' function updateResidents('),settlement.indexOf('\nconst floweringTreeCache')),wanderContext);
 residents[0].dir='l';residents[1].dir='r';
 for(let t=50;t<=20000;t+=50)assert.equal(wanderContext.updateResidents(t,{area:'shrine',x:1000,y:700},residents,()=>false,true,()=>.5),false);
 assert.deepEqual(Array.from(residents,n=>[n.x,n.y,n.dir]),[[588,156,'l'],[708,372,'r']],'standing residents keep positions and conversation facing');
 const wait=game.match(/function waitAreaAssets\(destination\)\{([\s\S]*?)\n\}/)[0];const context={YK_TENYO:{whenReady:()=>Promise.resolve()},YK_TENYO_NPC:{whenReady:()=>Promise.reject(Error('NPC load error'))},assetLoaded(){}};
 vm.runInNewContext(wait+';this.wait=waitAreaAssets',context);await assert.rejects(context.wait('shrine'),/NPC load error/);
 console.log('PASS Tenyo NPC art: eight static directions, source-cell order, alpha, size/sole, real main path, lazy loading and failure safety');
})().catch(e=>{console.error(e);process.exit(1)});

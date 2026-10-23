// Real image regression: fixed-origin partitions and fractional-camera seams.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let canvas;try{canvas=require('@napi-rs/canvas')}catch{canvas=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}))}
const {createCanvas,loadImage}=canvas;
(async()=>{
 const names=['background','shrine','trees','torii','trees-back','trees-front','torii-base','torii-upper'];
 const images={};
 for(const name of names){const extension=name.includes('-')?'png':'webp';images[name]=await loadImage('assets/maps/tenyo/layer-'+name+'.'+extension);assert.equal(images[name].width,1536);assert.equal(images[name].height,1024)}
 function pixels(im){const c=createCanvas(1536,1024),g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,1536,1024).data}
 for(const [original,a,b] of [['trees','trees-back','trees-front'],['torii','torii-base','torii-upper']]){
  const source=pixels(images[original]),parts=[pixels(images[a]),pixels(images[b])];
  for(let i=0;i<source.length;i+=4){
   assert(!(parts[0][i+3]&&parts[1][i+3]),'cutouts must not duplicate visible pixels');
   assert.equal(parts[0][i+3]+parts[1][i+3],source[i+3],'source alpha retained');

  }
 }
 // The native WebP and Pillow decoders use different YUV upsampling. Compare
 // camera sampling against a full-canvas PNG reconstruction of these exact
 // cutouts; the Python splitter separately checks source RGBA preservation.
 for(const [name,parts] of [['trees',['trees-back','trees-front']],['torii',['torii-base','torii-upper']]]){
  const c=createCanvas(1536,1024),g=c.getContext('2d');for(const part of parts)g.drawImage(images[part],0,0);images[name]=c;
 }
 class LocalImage{set src(value){this.image=images[value.match(/layer-([\w-]+)/)[1]];this.complete=true;this.naturalWidth=1536;this.srcValue=value}get src(){return this.srcValue}}
 const env={console,Image:LocalImage,fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('assets/maps/tenyo/walkability-48x32.json'))})};env.window=env;
 vm.runInNewContext(fs.readFileSync('js/tenyo-main-scene.js','utf8'),env);
 // IMG_6683: the standing cell is column 14,row 6 (world 348,156).
 // Its head overlaps a tree trunk at source (464,168); that trunk belongs
 // behind actors. A southern forest pixel must still cover an actor.
 function marker(x,y){
  const c=createCanvas(768,768),g=c.getContext('2d');
  const wrapped=new Proxy(g,{get(t,k){if(k==='drawImage')return(im,...args)=>t.drawImage(im.image||im,...args);const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true}});
  env.YK_TENYO.draw(wrapped,{x,y},(px,py)=>{g.fillStyle='#ff00ff';g.fillRect(px-20,py-58,40,58)},()=>{},()=>{});
  return g;
 }
 assert.deepEqual(Array.from(marker(348,156).getImageData(384,189,1,1).data),[255,0,255,255],'northern trunk must be behind the actor head');
 assert.notDeepEqual(Array.from(marker(420,420).getImageData(384,360,1,1).data),[255,0,255,255],'southern foreground foliage must still cover the actor');
 const results='qa/results/tenyo';fs.mkdirSync(results,{recursive:true});
 // Compare the actual renderer to a full-image reference without actors.
 for(const [x,y] of [[564,708],[588.25,503.9],[588.5,504.1],[300.3,300.7],[564,180]]){
  const actual=createCanvas(768,768),a=actual.getContext('2d');
  const wrapped=new Proxy(a,{get(t,k){if(k==='drawImage')return (im,...args)=>t.drawImage(im.image||im,...args);const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true}});
  env.YK_TENYO.draw(wrapped,{x,y},()=>{},()=>{},()=>{});
  const ref=createCanvas(768,768),r=ref.getContext('2d');r.imageSmoothingEnabled=false;
  const cx=Math.max(0,Math.min(640,x-256)),cy=Math.max(0,Math.min(256,y-256));
  r.setTransform(1.5,0,0,1.5,-cx*1.5,-cy*1.5);
  // The tree mask is hidden underneath shrine support, so this is the original
  // full-layer scenery with the intended torii-base/foliage relation.
  for(const name of ['background','torii-base','trees','shrine','torii-upper'])r.drawImage(images[name],0,0,1152,768);
  const p=a.getImageData(0,0,768,768).data,q=r.getImageData(0,0,768,768).data;
  let max=0,changed=0;for(let i=0;i<p.length;i++){const d=Math.abs(p[i]-q[i]);max=Math.max(max,d);if(d>1)changed++}
  assert.equal(changed,0,`camera ${x},${y}: no seam/color drift (max ${max})`);
 }
 // Use the actual main-game shrine hero/shadow functions and adopted 58px
 // canonical atlas. The 32px SD sheet is only selected by hero() in field.
 const heroAtlas=await loadImage('assets/characters/hizuki/bluebob-v1/walk-atlas-256.png');
 Object.assign(env,{characterScale:()=>1,hizukiArt:'sd',S:{area:'shrine'},HIZUKI_4DIR:heroAtlas,HIZUKI_4DIR_ROW:{d:0,u:1,r:2,l:3},ensureImage:()=>{},layerReady:im=>!!im});
 const game=fs.readFileSync('js/game.js','utf8');
 vm.runInNewContext(game.slice(game.indexOf('function shadow('),game.indexOf('// Measure opaque character bounds')),env);
 for(const [label,x,y] of [['north-head',348,156],['north-boundary',348,180],['forest-edge',420,420],['gate-behind',588,492],['gate-front',588,516],['shrine',564,180]]){
  const c=createCanvas(768,768),g=c.getContext('2d');
  const wrapped=new Proxy(g,{get(t,k){if(k==='drawImage')return(im,...args)=>t.drawImage(im.image||im,...args);const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true}});
  env.YK_TENYO.draw(wrapped,{x,y},(px,py)=>env.hero(g,px,py,'u',0,'normal',.56),()=>{},()=>{});
  fs.writeFileSync(results+'/'+label+'.png',c.toBuffer('image/png'));
 }
 console.log('PASS Tenyo cutouts: disjoint source alpha; five fractional cameras without seams; northern head visible / southern foliage foreground; actual main-game hero renders saved');
})().catch(e=>{console.error(e);process.exit(1)});

// Real image regression: fixed-origin partitions and fractional-camera seams.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let canvas;try{canvas=require('@napi-rs/canvas')}catch{canvas=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}))}
const {createCanvas,loadImage}=canvas;
(async()=>{
 const spec=JSON.parse(fs.readFileSync('assets/maps/tenyo/forest-occlusion.json'));
 const groups=spec.groups;
 const treeParts=['trees-back',...groups.map(g=>g.name),'trees-front'];
 const names=[...groups.map(g=>g.name),'background','shrine','trees','torii','trees-back','trees-front','torii-base','torii-upper'];
 const images={};
 for(const name of names){const extension=name.includes('-')?'png':'webp';images[name]=await loadImage('assets/maps/tenyo/layer-'+name+'.'+extension);assert.equal(images[name].width,1536);assert.equal(images[name].height,1024)}
 function pixels(im){const c=createCanvas(1536,1024),g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,1536,1024).data}
 for(const [original,names] of [['trees',treeParts],['torii',['torii-base','torii-upper']]]){
  const source=pixels(images[original]),parts=names.map(n=>pixels(images[n]));
  for(let i=0;i<source.length;i+=4){
   assert(parts.filter(p=>p[i+3]>0).length<=1,'no duplicated visible tree pixels');
   assert.equal(parts.reduce((sum,p)=>sum+p[i+3],0),source[i+3],'every original alpha pixel retained once');
  }
 }
 // The native WebP and Pillow decoders use different YUV upsampling. Compare
 // camera sampling against a full-canvas PNG reconstruction of these exact
 // cutouts; the Python splitter separately checks source RGBA preservation.
 for(const [name,parts] of [['trees',treeParts],['torii',['torii-base','torii-upper']]]){
  const c=createCanvas(1536,1024),g=c.getContext('2d');for(const part of parts)g.drawImage(images[part],0,0);images[name]=c;
 }
 class LocalImage{set src(value){this.image=images[value.match(/layer-([\w-]+)/)[1]];this.complete=true;this.naturalWidth=1536;this.srcValue=value}get src(){return this.srcValue}}
 const env={console,Image:LocalImage,fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('assets/maps/tenyo/walkability-48x32.json'))})};env.window=env;
 vm.runInNewContext(fs.readFileSync('js/tenyo-main-scene.js','utf8'),env);
 assert.equal(JSON.stringify(env.YK_TENYO.forestGroups),JSON.stringify(groups.map(g=>({name:g.name,sourceFootY:g.sourceFootY}))),'renderer uses the authored visual depths');
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
 for(const group of groups){
  const data=pixels(images[group.name]);let chosen=null;
  // A visible source pixel below the canopy and above the authored root edge.
  for(let sy=group.sourceFootY-64;sy<group.sourceFootY-8;sy++)for(let sx=0;sx<1536;sx++){
   if(data[(sy*1536+sx)*4+3]>220&&(!chosen||sx>chosen.x))chosen={x:sx,y:sy};
  }
  assert(chosen,'visible lower crown sample '+group.name);
  const x=(chosen.x+.5)*.75,worldY=(chosen.y+.5)*.75,depth=group.sourceFootY*.75;
  // Use an isolated opaque actor covering the selected source pixel. Read its
  // actual projected location (camera clamp also covers edge-of-map clusters).
  for(const offset of [-.1,0,.1]){
   const y=depth+offset,g=marker(x,y),cx=Math.max(0,Math.min(640,x-256)),cy=Math.max(0,Math.min(256,y-256));
   const px=Math.floor((x-cx)*1.5),py=Math.floor((worldY-cy)*1.5);
   const value=Array.from(g.getImageData(px,py,1,1).data);
   if(offset<0)assert.notDeepEqual(value,[255,0,255,255],group.name+' covers an actor behind its roots');
   else assert.deepEqual(value,[255,0,255,255],group.name+' yields to actor at/in front of roots');
  }
 }
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
 const samples=[['north-head',348,156],['north-boundary',348,180],['west-upper',300,252],['east-upper',900,252],['forest-edge',420,420],['gate-behind',588,492],['gate-front',588,516],['shrine',564,180]];
 const grid=JSON.parse(fs.readFileSync('assets/maps/tenyo/walkability-48x32.json')).grid;
 for(const row of [4,6,8,10,12,14,16]){
  const cols=[grid[row].indexOf('.'),grid[row].lastIndexOf('.')];
  for(let side=0;side<2;side++)if(cols[side]>=0)samples.push(['walk-edge-'+row+'-'+side,cols[side]*24+12,row*24+12]);
 }
 for(const [label,x,y] of samples){
  const c=createCanvas(768,768),g=c.getContext('2d');
  const wrapped=new Proxy(g,{get(t,k){if(k==='drawImage')return(im,...args)=>t.drawImage(im.image||im,...args);const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true}});
  env.YK_TENYO.draw(wrapped,{x,y},(px,py)=>env.hero(g,px,py,'u',0,'normal',.56),()=>{},()=>{});
  fs.writeFileSync(results+'/'+label+'.png',c.toBuffer('image/png'));
 }
 console.log('PASS Tenyo cutouts: disjoint source alpha; five fractional cameras without seams; all 8 surrounding clusters sort at fractional rendered feet / southern foliage foreground; actual main-game hero renders saved');
})().catch(e=>{console.error(e);process.exit(1)});

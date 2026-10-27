const assert=require('node:assert/strict'),fs=require('node:fs'),{createCanvas,loadImage}=require('@napi-rs/canvas'),M=require('../js/settlement-map/model.js'),R=require('../js/settlement-map/render.js'),C=require('../js/settlement-map/catalog.js');
global.document={createElement:()=>createCanvas(32,32)};
(async()=>{
 const m=M.parse(fs.readFileSync('assets/settlement-editor/maps/tenyo-sanctuary-water-v5.json','utf8')),blocked=M.collision(m),reachable=M.flood(m,m.spawn);
 for(const [x,y] of [[8,2],[19,2],[8,21],[10,21],[17,21],[19,21],[11,23],[16,23],[11,24],[16,24]])assert(blocked.has(x+','+y),`rock at ${x},${y} should block`);
 for(const p of ['13,24','13,22','13,19','13,8'])assert(reachable.has(p),`approach ${p} should remain reachable`);
 const images={};for(const id of new Set([...m.objects.map(o=>o.templateId),...C.templates.filter(t=>t.id.startsWith('clear_water_')).map(t=>t.id)]))images[id]=await loadImage(C.byId[id].src);
 const cv=createCanvas(896,800),c=cv.getContext('2d'),hero=createCanvas(96,128);hero.getContext('2d').fillStyle='#ef4020';hero.getContext('2d').fillRect(0,0,96,128);const bounds={d:{left:0,top:0,width:32,height:32}},opts={images,hero,bounds,actor:{x:13,y:15,dir:'d',frame:0},lighting:false,atmosphere:false,reflections:false,depthOfField:false,objectShading:true};
 R.draw(c,m,opts);const a=c.getImageData(432,490,1,1).data,b=c.getImageData(432,500,1,1).data;assert(Math.abs(a[0]-b[0])<4,`scene lighting should shade the hero uniformly at the same location (${a[0]}, ${b[0]})`);
 const front=Array.from(c.getImageData(448,760,1,1).data);R.draw(c,m,{...opts,objectShading:false});const clear=Array.from(c.getImageData(448,760,1,1).data);assert(clear[0]-front[0]>=30,`foreground scene shadow should be strong (${clear[0]} to ${front[0]})`);
 console.log('PASS: rock collision, open approach and unified scene shading');
})();

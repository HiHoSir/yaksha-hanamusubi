((root,f)=>{const api=f(typeof module==='object'&&module.exports?require('./catalog.js'):root.SMCatalog,typeof module==='object'&&module.exports?require('./model.js'):root.SMModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.SMRender=api;})(globalThis,(C,M)=>{
'use strict';const rows={d:0,u:1,r:2,l:3};
function actorBounds(image,createCanvas){const cv=createCanvas(96,128),c=cv.getContext('2d');c.drawImage(image,0,0);const p=c.getImageData(0,0,96,128).data,out={};for(const [d,row]of Object.entries(rows)){let left=32,top=32,right=-1,bottom=-1;for(let f=0;f<3;f++)for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(p[((row*32+y)*96+f*32+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}if(right<left)throw Error('緋月のフレームが空です');out[d]={left,top,width:right-left+1,height:bottom-top+1};}return out;}
function actor(c,s,image,bounds,tile=32,drawSprite=null){const b=bounds[s.dir],scale=Math.min(28/b.width,28/b.height)*tile/32;(drawSprite||((ctx,...args)=>ctx.drawImage(...args)))(c,image,(s.frame||0)*32,rows[s.dir]*32,32,32,(s.x+.5)*tile-(b.left+b.width/2)*scale,(s.y+.5)*tile-(b.top+b.height/2)*scale,32*scale,32*scale);}
function actorDepth(s,bounds,tile){const b=bounds[s.dir],scale=Math.min(28/b.width,28/b.height)*tile/32;return (s.y+.5)*tile+b.height*scale/2;}
function depthQueue(m,actorState,bounds){const q=m.objects.filter(v=>C.byId[v.templateId].layer==='object').map(v=>({object:v,depth:(v.y+(C.byId[v.templateId].wallSign?2:1))*m.tileSize}));if(actorState&&bounds)q.push({actor:actorState,depth:actorDepth(actorState,bounds,m.tileSize)});return q.sort((a,b)=>a.depth-b.depth||Number(!!C.byId[a.object?.templateId]?.wallSign)-Number(!!C.byId[b.object?.templateId]?.wallSign)||Number(!!C.byId[b.object?.templateId]?.supportSurface)-Number(!!C.byId[a.object?.templateId]?.supportSurface));}
function phase(o,t){return o.forExport?0:Number.isInteger(o.animationFrame)?((o.animationFrame%2)+2)%2:Math.floor((o.animationTime||0)/(t.animation?.frameMs||360))%(t.animation?.frames||2)}
function drawWater(c,m,o={}){const frames=M.autotileLayout(m);for(const v of m.objects.filter(v=>C.byId[v.templateId].water||C.byId[v.templateId].bridgePassages).sort((a,b)=>Number(!!C.byId[a.templateId].bridgePassages)-Number(!!C.byId[b.templateId].bridgePassages))){const t=C.byId[v.templateId],im=o.images?.[v.templateId];if(!im)continue;const index=frames.get(v.id),r=M.visualRect(m,v),source=t.autotile?[index%8*32,Math.floor(index/8)*32+(t.animation?phase(o,t)*t.animation.frameHeight:0),32,32]:t.sourceRect;c.drawImage(im,...source,r.x,r.y,r.width,r.height)}}
const clearCache=new WeakMap();
function waterTile(images,depth,neighbours,frame){
 const main=images.clear_water_deep;if(!main||!images.clear_water_mid||!images.clear_water_shallow)return null;
 let cache=clearCache.get(main);if(!cache){cache=new Map();clearCache.set(main,cache);}const key=depth+':'+frame+':'+neighbours.join('');if(cache.has(key))return cache.get(key);
 const make=()=>{if(typeof document!=='undefined')return document.createElement('canvas');throw Error('Canvas unavailable');};
 const source=make();source.width=32;source.height=32;const sc=source.getContext('2d',{willReadFrequently:true}),samples=[];
 for(const kind of ['shallow','mid','deep']){sc.clearRect(0,0,32,32);sc.drawImage(images['clear_water_'+kind],0,frame*32,32,32,0,0,32,32);samples.push(sc.getImageData(0,0,32,32).data);}
 // Sample the supplied directional transition frames for foam colours.
 const foam={};for(const dir of ['N','E','S','W']){const pair=depth===2?'deep_mid':'mid_shallow',im=images['clear_water_shore_'+pair+'_'+dir];if(!im)continue;sc.clearRect(0,0,32,32);sc.drawImage(im,0,frame*32,32,32,0,0,32,32);foam[dir]=sc.getImageData(0,0,32,32).data;}
 const surface=make();surface.width=32;surface.height=32;const ctx=surface.getContext('2d'),result=ctx.createImageData(32,32),n=neighbours;
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const gx=(x+.5)/32-.5,gy=(y+.5)/32-.5,ix=Math.floor(gx),iy=Math.floor(gy),u=gx-ix,v=gy-iy;
  const at=(dx,dy)=>n[(dy+1)*3+dx+1];
  const f=(1-u)*(1-v)*at(ix,iy)+u*(1-v)*at(ix+1,iy)+(1-u)*v*at(ix,iy+1)+u*v*at(ix+1,iy+1);
  // Each boundary belongs to the deeper cell; direct deep-to-shallow is
  // treated as a single transition and samples the shallower neighbour.
  const min=Math.min(...n),delta=depth-f,selected=delta>.18?Math.max(min,Math.min(depth-1,Math.round(f))):depth;
  const i=(y*32+x)*4,src=samples[selected];for(let k=0;k<4;k++)result.data[i+k]=src[i+k];
  if(delta>.14&&delta<.23&&depth>min){const dir=Math.abs(gx)>Math.abs(gy)?(gx<0?'W':'E'):(gy<0?'N':'S'),fdata=foam[dir];if(fdata){let best=0,score=-1;for(let k=0;k<32;k++){const j=(dir==='N'||dir==='S'?(k*32+x):(y*32+k))*4,brightness=fdata[j]+fdata[j+1]+fdata[j+2];if(brightness>score){score=brightness;best=j;}}for(let k=0;k<3;k++)result.data[i+k]=fdata[best+k];}}
 }
 ctx.putImageData(result,0,0);if(cache.size>=1024)cache.clear();cache.set(key,surface);return surface;
}
function draw(c,m,o={}){const images=o.images||{},tile=m.tileSize,objects=o.groundOnly?m.objects.filter(v=>C.byId[v.templateId].layer==='ground'):m.objects;if(o.forExport){if(m.background&&!o.backgroundImage)throw Error('背景画像が未読込です');for(const v of objects)if(!images[v.templateId])throw Error('素材画像が未読込です');}
c.imageSmoothingEnabled=false;c.clearRect(0,0,m.width*tile,m.height*tile);
if(o.backgroundImage)c.drawImage(o.backgroundImage,0,0);
// Additional water-specific layers preserve the pre-existing object catalog.
const waterFrame=o.forExport?0:Math.floor((o.animationTime||0)/360)%4;
const auto=typeof module==='object'&&module.exports?require('./autotile.js'):globalThis.SMAutotile;
const bottomSets=new Map();for(const v of m.waterBottom||[]){if(!bottomSets.has(v.tileId))bottomSets.set(v.tileId,new Set());bottomSets.get(v.tileId).add(v.x+','+v.y);}
function layerTiles(entries,mode){for(const v of entries||[]){const id=mode==='bottom'?v.tileId:'clear_water_'+v.depth;const t=C.byId[id],im=images[id];if(!t||!im)continue;const x=v.x*tile,y=v.y*tile;let sr=t.sourceRect;if(t.autotile){const mask=auto.maskAt(bottomSets.get(id)||new Set(),v.x,v.y),index=auto.indices[mask];sr=[index%8*32,Math.floor(index/8)*32,32,32];}else if(t.animation){sr=[0,waterFrame*t.animation.frameHeight,32,32];}c.save();if(mode==='surface')c.globalAlpha=v.opacity??.65;c.drawImage(im,...sr,x,y,tile,tile);c.restore();}}
const waterDepth=new Map((m.waterSurface||[]).map(v=>[v.x+','+v.y,v.depth]));
const waterCells=new Map((m.waterSurface||[]).map(v=>[v.x+','+v.y,v]));
const depths=['shallow','mid','deep'],order={shallow:0,mid:1,deep:2};
function surfaceTile(v){const d=order[v.depth],neighbours=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const k=waterDepth.get((v.x+dx)+','+(v.y+dy));neighbours.push(order[k]===undefined?d:order[k]);}return waterTile(images,d,neighbours,waterFrame);}
// Water blends only with the opaque pixels of the submerged part of each sprite.
function sprite(im,source,r,waterline,height){if(!height||!waterCells.size){c.drawImage(im,...source,r.x,r.y,r.width,r.height);return;}
const cv=document.createElement('canvas');cv.width=Math.ceil(r.width);cv.height=Math.ceil(r.height);const sc=cv.getContext('2d');sc.imageSmoothingEnabled=false;sc.drawImage(im,...source,0,0,r.width,r.height);sc.save();sc.beginPath();sc.rect(0,waterline-height-r.y,r.width,height);sc.clip();sc.globalCompositeOperation='source-atop';
for(let y=Math.floor((waterline-height)/tile);y<Math.ceil(waterline/tile);y++)for(let x=Math.floor(r.x/tile);x<Math.ceil((r.x+r.width)/tile);x++){const cell=waterCells.get(x+','+y);if(!cell)continue;const surface=surfaceTile(cell);if(!surface)continue;sc.globalAlpha=(cell.opacity??.65)*.55;sc.drawImage(surface,0,0,32,32,x*tile-r.x,y*tile-r.y,tile,tile);}sc.restore();c.drawImage(cv,r.x,r.y);}
const frames=M.autotileLayout(m),object=v=>{const im=images[v.templateId],t=C.byId[v.templateId],r=M.visualRect(m,v),index=frames.get(v.id),source=t.autotile?[index%8*32,Math.floor(index/8)*32+(t.animation?phase(o,t)*t.animation.frameHeight:0),32,32]:t.animation?.frameWidth?[t.sourceRect[0]+phase(o,t)*t.animation.frameWidth,...t.sourceRect.slice(1)]:t.sourceRect;if(!im)return;
// Elevated objects stand on their support rather than in the water below it.
const elevated=r.y+r.height<(v.y+1)*tile-.01,depth=t.layer==='object'&&!t.bridgePassages&&!elevated?(t.submergedHeight??8)*tile/32:0;sprite(im,source,r,r.y+r.height,depth);};
const groundOrder=v=>{const t=C.byId[v.templateId];return t.bridgePassages?3:t.paintGroup==='base'?0:t.shallow?1:t.autotile?1:2;};
for(const v of objects.filter(v=>C.byId[v.templateId].layer==='ground').sort((a,b)=>groundOrder(a)-groundOrder(b)))object(v);
layerTiles(m.waterBottom,'bottom');
// Clear water uses a continuous field of neighbouring depth values. The
// boundary is sampled on the 32px world grid, including diagonal cells.
// Frame and neighbour topology are cached; editing never alters collision.
for(const v of m.waterSurface||[]){const d=order[v.depth];if(d===undefined)continue;
const im=surfaceTile(v);if(!im)continue;
c.save();c.globalAlpha=v.opacity??.65;c.drawImage(im,0,0,32,32,v.x*tile,v.y*tile,tile,tile);c.restore();}
if(!o.groundOnly)for(const item of depthQueue(m,!o.forExport&&o.hero?o.actor:null,o.bounds)){if(item.object)object(item.object);else actor(c,item.actor,o.hero,o.bounds,tile,(ctx,im,sx,sy,sw,sh,x,y,width,height)=>sprite(im,[sx,sy,sw,sh],{x,y,width,height},actorDepth(item.actor,o.bounds,tile),6*tile/32));}
if(!o.forExport&&o.actor&&images.tenyo_ripple_fx){const s=o.actor;if(m.objects.some(v=>v.templateId==='tenyo_shallows'&&v.x===Math.round(s.x)&&v.y===Math.round(s.y))){const f=Math.floor((o.animationTime||0)/170)%4;c.drawImage(images.tenyo_ripple_fx,0,f*32,32,32,Math.round(s.x*tile),Math.round(s.y*tile),tile,tile);}}
if(o.forExport)return;
if(o.collision){const b=M.collision(m);for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){const k=x+','+y;c.fillStyle=b.has(k)?'#ef4e5277':o.reachable?.has(k)?'#30e88444':'#f3b52c22';c.fillRect(x*tile,y*tile,tile,tile);}}
if(o.grid){c.strokeStyle='#ffffff90';c.lineWidth=.7;for(let x=0;x<=m.width;x++){c.beginPath();c.moveTo(x*tile+.5,0);c.lineTo(x*tile+.5,m.height*tile);c.stroke();}for(let y=0;y<=m.height;y++){c.beginPath();c.moveTo(0,y*tile+.5);c.lineTo(m.width*tile,y*tile+.5);c.stroke();}}
if(o.markers){c.font=Math.max(8,tile*.31)+'px sans-serif';c.textAlign='center';for(const e of m.entrances){c.fillStyle='#ffc250';c.fillRect((e.marker[0]+.375)*tile,(e.marker[1]+.375)*tile,tile*.25,tile*.25);c.strokeStyle='#ffe3a0';c.strokeRect(e.approach[0]*tile+2,e.approach[1]*tile+2,tile-4,tile-4);c.fillText('入口',(e.approach[0]+.5)*tile,(e.approach[1]+.625)*tile);}c.fillStyle='#b4edff';c.fillText('始',(m.spawn[0]+.5)*tile,(m.spawn[1]+.625)*tile);}
if(o.selection){const v=m.objects.find(v=>v.id===o.selection);if(v){const r=M.visualRect(m,v);c.strokeStyle='#fff0a6';c.lineWidth=2;c.strokeRect(r.x,r.y,r.width,r.height);c.fillStyle='#fff0a6';c.fillRect(v.x*tile,(v.y+1)*tile-2,C.byId[v.templateId].displayCells[0]*tile,2);}}
}
return {draw,drawWater,actorBounds,actor,actorDepth,depthQueue};
});


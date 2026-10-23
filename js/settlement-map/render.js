((root,f)=>{const api=f(typeof module==='object'&&module.exports?require('./catalog.js'):root.SMCatalog,typeof module==='object'&&module.exports?require('./model.js'):root.SMModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.SMRender=api;})(globalThis,(C,M)=>{
'use strict';const rows={d:0,u:1,r:2,l:3};
function actorBounds(image,createCanvas){const cv=createCanvas(96,128),c=cv.getContext('2d');c.drawImage(image,0,0);const p=c.getImageData(0,0,96,128).data,out={};for(const [d,row]of Object.entries(rows)){let left=32,top=32,right=-1,bottom=-1;for(let f=0;f<3;f++)for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(p[((row*32+y)*96+f*32+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}if(right<left)throw Error('緋月のフレームが空です');out[d]={left,top,width:right-left+1,height:bottom-top+1};}return out;}
function actor(c,s,image,bounds){const b=bounds[s.dir],scale=Math.min(28/b.width,28/b.height);c.drawImage(image,(s.frame||0)*32,rows[s.dir]*32,32,32,(s.x+.5)*32-(b.left+b.width/2)*scale,(s.y+.5)*32-(b.top+b.height/2)*scale,32*scale,32*scale);}
function draw(c,m,o={}){const images=o.images||{},objects=[...m.objects.filter(v=>C.byId[v.templateId].kind==='terrain'),...m.objects.filter(v=>C.byId[v.templateId].kind!=='terrain')];if(o.forExport){if(m.background&&!o.backgroundImage)throw Error('背景画像が未読込です');for(const v of objects)if(!images[v.templateId])throw Error('素材画像が未読込です');}
c.imageSmoothingEnabled=false;c.clearRect(0,0,m.width*32,m.height*32);
if(o.backgroundImage){c.drawImage(o.backgroundImage,0,0);}
for(const v of objects){const im=images[v.templateId],t=C.byId[v.templateId];if(im)c.drawImage(im,v.x*32,v.y*32,t.displayCells[0]*32,t.displayCells[1]*32);}
if(o.forExport)return;
if(o.collision){const b=M.collision(m);for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){const k=x+','+y;c.fillStyle=b.has(k)?'#ef4e5277':o.reachable?.has(k)?'#30e88444':'#f3b52c22';c.fillRect(x*32,y*32,32,32);}}
if(o.grid){c.strokeStyle='#ffffff90';c.lineWidth=.7;for(let x=0;x<=m.width;x++){c.beginPath();c.moveTo(x*32+.5,0);c.lineTo(x*32+.5,m.height*32);c.stroke();}for(let y=0;y<=m.height;y++){c.beginPath();c.moveTo(0,y*32+.5);c.lineTo(m.width*32,y*32+.5);c.stroke();}}
if(o.markers){c.font='10px sans-serif';c.textAlign='center';for(const e of m.entrances){c.fillStyle='#ffc250';c.fillRect(e.marker[0]*32+12,e.marker[1]*32+12,8,8);c.strokeStyle='#ffe3a0';c.strokeRect(e.approach[0]*32+3,e.approach[1]*32+3,26,26);c.fillText('入口',e.approach[0]*32+16,e.approach[1]*32+20);}c.fillStyle='#b4edff';c.fillText('始',m.spawn[0]*32+16,m.spawn[1]*32+20);}
if(o.selection){const v=m.objects.find(v=>v.id===o.selection);if(v){const t=C.byId[v.templateId];c.strokeStyle='#fff0a6';c.lineWidth=2;c.strokeRect(v.x*32+1,v.y*32+1,t.displayCells[0]*32-2,t.displayCells[1]*32-2);}}
if(o.actor&&o.hero&&o.bounds)actor(c,o.actor,o.hero,o.bounds);
}
return {draw,actorBounds,actor};
});

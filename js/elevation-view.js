// Texture mapping uses the production field's perspective projection.
// The same elevation sampler positions terrain vertices, roads, feet and objects.
window.YK_ELEVATION_VIEW=(()=>{
 const E=window.YK_ELEVATION;
 const sources={grass:'assets/terrain/grass-v1/grass.png',sand:'assets/terrain/landscape-v1/sand.png',snow:'assets/terrain/landscape-v1/snow.png',rock:'assets/terrain/landscape-v1/barren.png',sea:'assets/terrain/landscape-v1/water.png',road:'assets/terrain/landscape-v3/road.png',horizon:'assets/terrain/quarter-v1/horizon.png',trees:'assets/field-map-objects-v3/trees.png',shrine:'assets/field-map-objects-v3/shrine.png',hero:'assets/characters/hizuki/field-sd-v1/walk-atlas-32.png'};
 async function load(){const pairs=await Promise.all(Object.entries(sources).map(([k,src])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve([k,im]);im.onerror=()=>reject(Error(src));im.src=src;})));return Object.fromEntries(pairs);}
 const padded=new WeakMap();
 function repeatPadding(im){
  if(padded.has(im))return padded.get(im);
  const surface=document.createElement('canvas');surface.width=im.width*3;surface.height=im.height*3;
  const q=surface.getContext('2d');for(let y=0;y<3;y++)for(let x=0;x<3;x++)q.drawImage(im,x*im.width,y*im.height);
  padded.set(im,surface);return surface;
 }
 function triangle(c,im,uv,p){
  const [a,b,d]=uv,[A,B,D]=p,den=(b.x-a.x)*(d.y-a.y)-(d.x-a.x)*(b.y-a.y);if(Math.abs(den)<1e-8)return;
  const xx=((B.x-A.x)*(d.y-a.y)-(D.x-A.x)*(b.y-a.y))/den;
  const xy=((D.x-A.x)*(b.x-a.x)-(B.x-A.x)*(d.x-a.x))/den;
  const yx=((B.y-A.y)*(d.y-a.y)-(D.y-A.y)*(b.y-a.y))/den;
  const yy=((D.y-A.y)*(b.x-a.x)-(B.y-A.y)*(d.x-a.x))/den;
  // Subpixel overlap closes rasterization hairlines; repeated padding keeps edge
  // samples valid without stretching the tile or exposing the sea behind it.
  const cx=(A.x+B.x+D.x)/3,cy=(A.y+B.y+D.y)/3;
  c.save();c.beginPath();p.forEach((v,i)=>{const len=Math.hypot(v.x-cx,v.y-cy)||1,x=v.x+(v.x-cx)/len*.65,y=v.y+(v.y-cy)/len*.65;i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.clip();
  c.transform(xx,yx,xy,yy,A.x-xx*a.x-xy*a.y,A.y-yx*a.x-yy*a.y);c.drawImage(repeatPadding(im),-im.width,-im.height);c.restore();
 }
 function quad(c,im,sx,sy,sw,sh,p,shade=0){
  const uv=[{x:sx,y:sy},{x:sx+sw,y:sy},{x:sx+sw,y:sy+sh},{x:sx,y:sy+sh}];
  triangle(c,im,[uv[0],uv[1],uv[2]],[p[0],p[1],p[2]]);triangle(c,im,[uv[0],uv[2],uv[3]],[p[0],p[2],p[3]]);
  if(shade){c.save();c.fillStyle='rgba(12,24,34,'+shade+')';c.beginPath();p.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fill();c.restore();}
 }
 function render(c,m,art,actor,options={}){
  const rise=options.rise||20,zoom=1.4,camera={x:256,y:options.cameraY||400,preset:0},items=[];
  const point=(x,y,h)=>{const p=YK_LANDSCAPE.project(x,y,camera,zoom);return p&&{...p,y:p.y-h*rise*p.scale};};
  c.save();c.imageSmoothingEnabled=false;c.clearRect(0,0,640,544);c.drawImage(art.horizon,0,0,640,240);
  // Continue the same sea texture beyond the test map, as in the main field.
  const ocean=c.createPattern(art.sea,'repeat');
  for(let sy=136;sy<544;sy+=4){
   const a=YK_LANDSCAPE.unproject(0,sy,camera,zoom),b=YK_LANDSCAPE.unproject(640,sy,camera,zoom),d=YK_LANDSCAPE.unproject(0,sy+4,camera,zoom);
   c.save();c.beginPath();c.rect(0,sy,640,4);c.clip();c.translate(0,sy);c.scale(640/(b.x-a.x),4/(d.y-a.y));c.translate(-a.x,-a.y);c.fillStyle=ocean;
   c.fillRect(a.x-4,a.y-4,b.x-a.x+8,d.y-a.y+8);c.restore();
  }
  // Tile tops are sampled in short world-space strips to follow perspective and slopes.
  for(let ty=0;ty<m.length;ty++)for(let tx=0;tx<m[0].length;tx++){
   const kind=m[ty][tx],im=art[kind]||art.grass,road=m.roads?.has(tx+','+ty),texture=road?art.road:im;
   for(let v=0;v<32;v+=8){const py=ty*32+v;
    items.push({depth:py+8,order:0,draw:()=>{
     const p=[[0,v],[32,v],[32,v+8],[0,v+8]].map(([u,w])=>point(tx*32+u,ty*32+w,E.level(m,tx,ty,u/32,w/32)));
     if(p.every(Boolean)){
      const sx=tx*32%texture.width,sy=(ty*32+v)%texture.height;
      if(Math.abs(p[0].y-p[1].y)<1e-6&&Math.abs(p[2].y-p[3].y)<1e-6){
       const left=Math.min(p[0].x,p[3].x),right=Math.max(p[1].x,p[2].x);
       c.drawImage(texture,sx,sy,32,8,left,p[0].y,right-left+.3,p[3].y-p[0].y+.6);
      }else quad(c,texture,sx,sy,32,8,p);
     }
    }});
   }
   for(const [side,[dx,dy]] of Object.entries(E.dirs)){
    const ends=side==='s'?[[0,1],[1,1]]:side==='n'?[[0,0],[1,0]]:side==='e'?[[1,0],[1,1]]:[[0,0],[0,1]];
    const top=ends.map(([u,v])=>E.level(m,tx,ty,u,v));
    const bottom=ends.map(([u,v],i)=>Math.min(top[i],E.level(m,tx+dx,ty+dy,u-dx,v-dy)));
    if(top.every((h,i)=>h-bottom[i]<1e-6))continue;
    const coords=ends.map(([u,v])=>[(tx+u)*32,(ty+v)*32]);
    // Side walls are split by height band and world depth, sharing corner vertices.
    const segments=dx?4:1;
    for(let segment=0;segment<segments;segment++){
    const t0=segment/segments,t1=(segment+1)/segments;
    const mix=(a,t)=>a[0]+(a[1]-a[0])*t;
    const span=[t0,t1].map(t=>[mix(coords.map(p=>p[0]),t),mix(coords.map(p=>p[1]),t)]);
    const high=[mix(top,t0),mix(top,t1)],low=[mix(bottom,t0),mix(bottom,t1)];
    const wallDepth=side==='n'?ty*32:side==='s'?(ty+1)*32:ty*32+(segment+1)*8;
    items.push({depth:wallDepth,order:1,draw:()=>{
     const bands=Math.max(1,Math.ceil(Math.max(...high.map((h,i)=>h-low[i]))));
     for(let b=0;b<bands;b++){
      const hi=high.map((h,i)=>h+(low[i]-h)*b/bands),lo=high.map((h,i)=>h+(low[i]-h)*(b+1)/bands);
      const p=[point(...span[0],hi[0]),point(...span[1],hi[1]),point(...span[1],lo[1]),point(...span[0],lo[0])];
      const face=art[options.cliffMaterial||'rock']||art.rock;
      if(p.every(Boolean))quad(c,face,tx%2*32,ty%2*32,32,32,p,side==='w'?.12:side==='e'?.35:.22);
     }
    }});
    }
   }
  }
  for(const o of m.objects||[])items.push({depth:o.y,order:2,draw:()=>{const p=point(o.x,o.y,E.height(m,o.x,o.y));if(p)c.drawImage(art[o.kind],p.x-o.width*p.scale/2,p.y-o.height*p.scale,o.width*p.scale,o.height*p.scale);}});
  if(actor)items.push({depth:actor.y,order:3,draw:()=>{
   const p=point(actor.x,actor.y,E.height(m,actor.x,actor.y));if(!p)return;
   const row={d:0,u:1,r:2,l:3}[actor.dir||'d'],col=row>=2?Math.min(1,actor.frame||0):actor.frame||0;
   // Approved 32px field atlas, one shared projection/foot anchor.
   c.fillStyle='rgba(0,0,0,.24)';c.beginPath();c.ellipse(p.x,p.y,9*p.scale,3*p.scale,0,0,Math.PI*2);c.fill();
   const bounds=heroBounds(art.hero,row,col),scale=28/bounds.height*p.scale;
   c.drawImage(art.hero,col*32,row*32,32,32,p.x-(bounds.left+bounds.width/2)*scale,p.y-(bounds.bottom+1)*scale,32*scale,32*scale);
  }});
  items.sort((a,b)=>a.depth-b.depth||a.order-b.order);for(const item of items)item.draw();
  for(let y=136;y<208;y+=4){const t=(y-136)/72;c.globalAlpha=1-t*t*(3-2*t);c.drawImage(art.horizon,0,y,640,4,0,y,640,4);}c.globalAlpha=1;
  if(options.grid){for(let ty=0;ty<m.length;ty++)for(let tx=0;tx<m[0].length;tx++){
   const p=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>point((tx+u)*32,(ty+v)*32,E.level(m,tx,ty,u,v)));if(!p.every(Boolean))continue;
   c.strokeStyle='rgba(255,255,255,.25)';c.beginPath();p.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.stroke();
  }}c.restore();return {point};
 }
 const heroCache=new WeakMap();
 function heroBounds(im,row,col){
  if(!heroCache.has(im))heroCache.set(im,new Map());const cache=heroCache.get(im),key=row+','+col;if(cache.has(key))return cache.get(key);
  const tile=document.createElement('canvas');tile.width=tile.height=32;const q=tile.getContext('2d');q.drawImage(im,col*32,row*32,32,32,0,0,32,32);
  const data=q.getImageData(0,0,32,32).data;let left=31,right=0,top=31,bottom=0;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(data[(y*32+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const bounds={left,bottom,width:right-left+1,height:bottom-top+1};cache.set(key,bounds);return bounds;
 }
 return {load,render,sources};
})();

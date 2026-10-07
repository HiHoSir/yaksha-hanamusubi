// Original terrain art. Display sizes are independent of the 32px movement grid.
window.YK_LANDSCAPE=(()=>{
 const specs={greenMountain:[96,88],rockMountain:[96,88],snowMountain:[96,88],water:[64,64],snow:[64,64],barren:[64,64],sand:[64,64],shrine:[64,64],lantern:[24,40],bridge:[96,40],flowers:[40,24],road:[64,64],village:[112,80],town:[144,104],hermit:[72,72],jizo:[24,40],cave:[80,64],torii:[64,64]},art={},errors={};
 const placeKeys=['village','town','hermit','jizo','cave','torii'];
 const oldKeys=['water','snow','barren','sand'];
 const keys=Object.keys(specs),water=t=>t==='sea'||t==='river';let started=false;
 function ready(){return keys.every(k=>art[k]?.complete&&art[k].naturalWidth===specs[k][0]&&art[k].naturalHeight===specs[k][1]&&!errors[k]);}
 function load(change=()=>{}){
  if(started)return;started=true;
  for(const k of keys){const im=art[k]=new Image();im.onload=()=>{if(im.naturalWidth!==specs[k][0]||im.naturalHeight!==specs[k][1])errors[k]='size';change();};im.onerror=()=>{errors[k]='load';change();};im.src=placeKeys.includes(k)?'assets/terrain/places-v1/'+k+'.png':k==='road'?'assets/terrain/landscape-v3/road.png':k==='rockMountain'?'assets/terrain/landscape-v1/mountain.png':'assets/terrain/'+(oldKeys.includes(k)?'landscape-v1/':'landscape-v2/')+k+'.png';}
 }
 function fixture(){
  const m=Array.from({length:17},()=>Array(20).fill('grass'));
  for(let y=0;y<17;y++)for(let x=(y<6?17:y<11?16:y<14?15:13);x<20;x++)m[y][x]='sea';
  for(let y=0;y<5;y++)for(let x=9;x<14;x++)if(!(y===4&&(x===9||x===13)))m[y][x]='snow';
  for(let y=1;y<4;y++)for(let x=1;x<7;x++)m[y][x]='mountain';
  m[1][11]=m[1][12]=m[2][11]=m[2][12]='snowMountain';
  for(let y=6;y<10;y++)for(let x=1;x<6;x++)if(!(y===6&&x===1))m[y][x]='forest';
  for(let y=12;y<17;y++)for(let x=0;x<(y===12?5:6);x++)m[y][x]='barren';
  for(const [x,y] of [[10,4],[10,5],[10,6],[11,6],[11,7],[11,8],[11,9],[12,9],[13,9],[14,9],[15,9]])m[y][x]='river';
  m[7][10]=m[8][10]='river';
  for(let y=13;y<=14;y++)for(let x=1;x<=4;x++)m[y][x]='rockMountain';
  // A walkable beach occupies actual land cells, outside the waterline.
  for(let y=0;y<17;y++){
   const coast=m[y].indexOf('sea');
   for(let x=Math.max(0,coast-2);x<coast;x++)if(m[y][x]==='grass')m[y][x]='sand';
  }
  m.paths=[
   [[304,520],[304,448],[272,416],[272,336],[256,304],[256,192]],
   [[256,252],[432,252],[464,224],[480,192]],
   [[272,416],[352,416],[432,416],[392,464]],
   [[272,416],[224,416],[208,464],[176,496]],
   [[256,304],[208,304]]
  ];
  // Object positions use world pixels; flowers and bridge lie under actors.
  m.decorations=[
   {kind:'shrine',x:216,y:112,width:80,height:80,foot:192},
   {kind:'lantern',x:198,y:184,width:24,height:40,foot:224},
   {kind:'lantern',x:294,y:184,width:24,height:40,foot:224},
   {kind:'bridge',x:288,y:224,width:128,height:56,foot:280,ground:true},
   {kind:'flowers',x:210,y:338,width:40,height:24,foot:362,ground:true},
   {kind:'flowers',x:312,y:340,width:40,height:24,foot:364,ground:true},
   {kind:'flowers',x:388,y:360,width:40,height:24,foot:384,ground:true},
   {kind:'flowers',x:232,y:462,width:40,height:24,foot:486,ground:true}
  ];
  return m;
 }
 function placesFixture(){
  const m=Array.from({length:17},()=>Array(20).fill('grass'));
  for(let y=1;y<4;y++)for(let x=1;x<7;x++)m[y][x]='mountain';
  for(let y=1;y<5;y++)for(let x=14;x<19;x++)m[y][x]='forest';
  for(let y=4;y<14;y++)m[y][10]='river';
  for(let x=10;x<20;x++)m[13][x]='river';
  for(let y=14;y<17;y++)for(let x=15;x<20;x++)m[y][x]='sea';
  for(let y=14;y<17;y++)for(let x=13;x<15;x++)m[y][x]='sand';
  m.decorations=[
   {kind:'cave',x:84,y:88,width:80,height:64,foot:152},
   {kind:'hermit',x:226,y:92,width:72,height:72,foot:164},
   {kind:'village',x:64,y:244,width:112,height:80,foot:324},
   {kind:'town',x:410,y:228,width:144,height:104,foot:332},
   {kind:'torii',x:420,y:134,width:64,height:64,foot:198},
   {kind:'jizo',x:218,y:320,width:24,height:40,foot:360},
   {kind:'jizo',x:368,y:296,width:24,height:40,foot:336},
   {kind:'bridge',x:288,y:332,width:96,height:56,foot:388,ground:true},
   {kind:'flowers',x:168,y:370,width:40,height:24,foot:394,ground:true},
   {kind:'flowers',x:542,y:372,width:40,height:24,foot:396,ground:true}
  ];
  m.paths=[
   [[272,524],[272,360],[120,360],[120,324]],
   [[272,360],[482,360],[482,332]],
   [[272,360],[272,208],[262,164]],
   [[272,208],[124,208],[124,152]],
   [[400,360],[400,204],[452,204],[452,198]],
   [[400,360],[400,408]]
  ];
  return m;
 }
 function adjacent(map,x,y,predicate){return {n:predicate(map[y-1]?.[x]),e:predicate(map[y]?.[x+1]),s:predicate(map[y+1]?.[x]),w:predicate(map[y]?.[x-1])};}
 // Stepped pixel contours, including diagonal indentations at water junctions.
 function contains(px,py,n,diag,inset=0){
  const l=n.w?0:inset,r=n.e?32:32-inset,t=n.n?0:inset,b=n.s?32:32-inset;
  if(px<l||px>=r||py<t||py>=b)return false;
  const near=(u,v)=>u<2&&v<8||u<4&&v<4||u<8&&v<2;
  if(!n.w&&!n.n&&near(px-l,py-t)||!n.e&&!n.n&&near(r-1-px,py-t)||!n.w&&!n.s&&near(px-l,b-1-py)||!n.e&&!n.s&&near(r-1-px,b-1-py))return false;
  if(n.w&&n.n&&!diag.nw&&near(px,py)||n.e&&n.n&&!diag.ne&&near(31-px,py)||n.w&&n.s&&!diag.sw&&near(px,31-py)||n.e&&n.s&&!diag.se&&near(31-px,31-py))return false;
  return true;
 }
 function groundInside(x,y,n,diag,sx,sy){
  if(!contains(x,y,n,diag))return false;
  const edge=[1,1,2,2,2,3,3,2,1,1,0,0,1,1,2,1];
  const dx=edge[((y+sy)>>1)%16],dy=edge[((x+sx)>>1)%16];
  return !(!n.w&&x<dx||!n.e&&31-x<dx||!n.n&&y<dy||!n.s&&31-y<dy);
 }
 const masks=new Map();
 function maskTile(kind,n,diag,sx,sy){
  const key=kind+sx+','+sy+Object.values(n).map(Number).join('')+Object.values(diag).map(Number).join('');
  if(masks.has(key))return masks.get(key);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  // Generated artwork supplies surface detail; this mask only determines joins.
  c.drawImage(art[kind==='water'?'sand':kind],sx,sy,32,32,0,0,32,32);
  const base=c.getImageData(0,0,32,32),surface=document.createElement('canvas');surface.width=surface.height=32;
  const q=surface.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(art[kind],sx,sy,32,32,0,0,32,32);const source=q.getImageData(0,0,32,32).data;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   const i=(y*32+x)*4;
   if(!(kind==='water'?contains(x,y,n,diag):groundInside(x,y,n,diag,sx,sy))){base.data[i+3]=0;continue;}
   if(kind!=='water'||contains(x,y,n,diag,5)){for(let j=0;j<4;j++)base.data[i+j]=source[i+j];
    if(kind==='water'&&!contains(x,y,n,diag,7)){base.data[i]=112;base.data[i+1]=195;base.data[i+2]=197;}
   }
  }
  c.putImageData(base,0,0);masks.set(key,canvas);return canvas;
 }
 function drawFloor(c,map){
  const a=window.YK_AUTOTILE;
  for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++){
   a.drawCell(c,'grass',{},x*32,y*32);
   const t=map[y][x],kind=water(t)?'water':t==='snowMountain'?'snow':t==='rockMountain'?'barren':t;
   if(!['water','snow','barren','sand'].includes(kind))continue;
   const same=v=>v===undefined||(kind==='water'?water(v):kind==='snow'?(v==='snow'||v==='snowMountain'):kind==='barren'?(v==='barren'||v==='rockMountain'):kind==='sand'?(v==='sand'||water(v)):v===kind);
   if(t==='sea')c.drawImage(art.sand,x%2*32,y%2*32,32,32,x*32,y*32,32,32);
   const n=adjacent(map,x,y,same),diag={nw:same(map[y-1]?.[x-1]),ne:same(map[y-1]?.[x+1]),sw:same(map[y+1]?.[x-1]),se:same(map[y+1]?.[x+1])};
   c.drawImage(maskTile(kind,n,diag,x%2*32,y%2*32),x*32,y*32);
  }
 }
 function pathDistance(x,y,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy;
  const t=d?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/d)):0;
  return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
 }
 function onBridge(map,x,y){return (map.decorations||[]).some(o=>o.kind==='bridge'&&x>=o.x&&x<o.x+o.width&&y>=o.y&&y<o.y+o.height);}
 function roadAllowed(map,x,y){const t=map[Math.floor(y/32)]?.[Math.floor(x/32)];return ['grass','sand','snow','barren'].includes(t)||water(t)&&onBridge(map,x,y);}
 const roads=new WeakMap();
 function roadLayer(map){
  if(roads.has(map))return roads.get(map);
  const canvas=document.createElement('canvas');canvas.width=map[0].length*32;canvas.height=map.length*32;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  for(let y=0;y<canvas.height;y+=64)for(let x=0;x<canvas.width;x+=64)c.drawImage(art.road,x,y);
  const pixels=c.getImageData(0,0,canvas.width,canvas.height),covered=new Uint8Array(canvas.width*canvas.height);
  for(const path of map.paths||[])for(let j=1;j<path.length;j++){
   const a=path[j-1],b=path[j];
   for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1])-22));y<Math.min(canvas.height,Math.ceil(Math.max(a[1],b[1])+22));y++)
    for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0])-22));x<Math.min(canvas.width,Math.ceil(Math.max(a[0],b[0])+22));x++){
     const edge=20-((Math.floor(x/4)+Math.floor(y/4)*3)%5===0?1:0);
     if(pathDistance(x+.5,y+.5,a,b)<=edge&&roadAllowed(map,x,y))covered[y*canvas.width+x]=1;
    }
  }
  for(let i=0;i<covered.length;i++)if(!covered[i])pixels.data[i*4+3]=0;
  c.putImageData(pixels,0,0);roads.set(map,canvas);return canvas;
 }
 function objects(map){
  const a=window.YK_AUTOTILE,trees=a.forestObjects(map).map(t=>({...t,kind:'forest'}));
  const mountains=[];
  for(const [terrain,kind] of [['mountain','greenMountain'],['rockMountain','rockMountain'],['snowMountain','snowMountain']]){
   const cells=map.map(row=>row.map(t=>t===terrain?'forest':'grass'));
   mountains.push(...a.forestObjects(cells).map(t=>({...t,kind,x:t.x-8,y:t.foot-88,width:96,height:88})));
  }
  return [...trees,...mountains,...(map.decorations||[]).filter(o=>!o.ground)].sort((a,b)=>a.foot-b.foot||a.x-b.x);
 }
 function draw(c,map,actor){
  if(!ready()||!window.YK_AUTOTILE.ready())return false;c.imageSmoothingEnabled=false;drawFloor(c,map);c.drawImage(roadLayer(map),0,0);
  for(const o of (map.decorations||[]).filter(o=>o.ground))c.drawImage(art[o.kind],o.x,o.y,o.width,o.height);
  let drawn=false;
  for(const o of objects(map)){
   if(actor&&!drawn&&actor.foot<o.foot){actor.draw();drawn=true;}
   if(o.kind==='forest')window.YK_AUTOTILE.drawCrown(c,o.x,o.y,o.width,o.height);
   else c.drawImage(art[o.kind],o.x,o.y,o.width,o.height);
  }
  if(actor&&!drawn)actor.draw();return true;
 }
 function drawAsset(c,k,x,y,w,h){if(!ready())return false;c.imageSmoothingEnabled=false;c.drawImage(art[k],x,y,w,h);return true;}
 return {specs,keys,placeKeys,placesFixture,errors,load,ready,fixture,draw,objects,drawAsset,contains,adjacent,roadAllowed,roadLayer,groundInside};
})();

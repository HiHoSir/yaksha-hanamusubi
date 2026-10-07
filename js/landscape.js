// Original terrain art. Display sizes are independent of the 32px movement grid.
window.YK_LANDSCAPE=(()=>{
 const specs={greenMountain:[96,88],rockMountain:[96,88],snowMountain:[96,88],water:[64,64],snow:[64,64],barren:[64,64],sand:[64,64],shrine:[64,64],lantern:[24,40],bridge:[96,40],flowers:[40,24]},art={},errors={};
 const oldKeys=['water','snow','barren','sand'];
 const keys=Object.keys(specs),water=t=>t==='sea'||t==='river';let started=false;
 function ready(){return keys.every(k=>art[k]?.complete&&art[k].naturalWidth===specs[k][0]&&art[k].naturalHeight===specs[k][1]&&!errors[k]);}
 function load(change=()=>{}){
  if(started)return;started=true;
  for(const k of keys){const im=art[k]=new Image();im.onload=()=>{if(im.naturalWidth!==specs[k][0]||im.naturalHeight!==specs[k][1])errors[k]='size';change();};im.onerror=()=>{errors[k]='load';change();};im.src=k==='rockMountain'?'assets/terrain/landscape-v1/mountain.png':'assets/terrain/'+(oldKeys.includes(k)?'landscape-v1/':'landscape-v2/')+k+'.png';}
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
  // Object positions use world pixels; flowers and bridge lie under actors.
  m.decorations=[
   {kind:'shrine',x:224,y:176,width:64,height:64,foot:240},
   {kind:'lantern',x:198,y:224,width:24,height:40,foot:264},
   {kind:'lantern',x:294,y:224,width:24,height:40,foot:264},
   {kind:'bridge',x:288,y:152,width:96,height:40,foot:184,ground:true},
   {kind:'flowers',x:210,y:298,width:40,height:24,foot:322,ground:true},
   {kind:'flowers',x:260,y:340,width:40,height:24,foot:364,ground:true},
   {kind:'flowers',x:424,y:360,width:40,height:24,foot:384,ground:true},
   {kind:'flowers',x:236,y:436,width:40,height:24,foot:460,ground:true}
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
   if(!contains(x,y,n,diag)){base.data[i+3]=0;continue;}
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
   if(!['water','snow','barren'].includes(kind))continue;
   const same=v=>v===undefined||(kind==='water'?water(v):kind==='snow'?(v==='snow'||v==='snowMountain'):kind==='barren'?(v==='barren'||v==='rockMountain'):v===kind);
   const n=adjacent(map,x,y,same),diag={nw:same(map[y-1]?.[x-1]),ne:same(map[y-1]?.[x+1]),sw:same(map[y+1]?.[x-1]),se:same(map[y+1]?.[x+1])};
   c.drawImage(maskTile(kind,n,diag,x%2*32,y%2*32),x*32,y*32);
  }
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
  if(!ready()||!window.YK_AUTOTILE.ready())return false;c.imageSmoothingEnabled=false;drawFloor(c,map);
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
 return {specs,keys,errors,load,ready,fixture,draw,objects,drawAsset,contains,adjacent};
})();

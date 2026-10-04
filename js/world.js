// A journey along one connected road, with roadside stops and a hot-spring detour.
window.YK_WORLD=(()=>{
 const start=[230,534],hub=start; // hub retained only as a save/test compatibility alias.
 const places={
  village:{point:[211,565],name:"鬼灯の里",note:"旅の出発点。北へ歩いて天妖の社へ。"},
  shrine:{point:[194,366],name:"天妖の社",note:"里の北の社。参拝したら東の川沿いを浜へ。"},
  cove:{point:[467,610],name:"海の入り江",note:"川沿いの橋を渡った先の浜。北東の森へ道が続く。"},
  forest:{point:[661,405],name:"忘れの森",note:"東の森を抜け、北の龍神の滝を目指そう。"},
  waterfall:{point:[637,191],name:"龍神の滝",note:"旅路の北端。滝を訪ねたら西の祠へ。"},
  hotspring:{point:[431,214],name:"月見の湯",note:"滝から祠へ向かう道中の寄り道。湯でひと休み。"},
  fox:{point:[171,111],name:"九尾の祠",note:"北の街道の先、紅葉に囲まれた祠。"}
 };
 const shrineJunction=[289,415],springJunction=[458,138];
 const roads=[
  [places.village.point,start,[231,489],[241,471],[265,460],[284,445],shrineJunction],
  [shrineJunction,[246,405],[216,398],[197,382],places.shrine.point],
  [shrineJunction,[330,423],[348,435],[348,473],[357,489],[378,503],[379,542],[385,565],[407,581],[429,590],[448,607],places.cove.point],
  [places.cove.point,[485,587],[507,576],[524,560],[524,551],[549,539],[582,534],[591,515],[591,492],[608,478],[634,468],[660,451],[661,422],places.forest.point],
  [places.forest.point,[655,386],[638,368],[628,341],[629,326],[647,307],[662,291],[675,274],[678,253],[676,242],[659,225],[657,208],[657,190],places.waterfall.point],
  [places.waterfall.point,[600,192],[572,188],[555,170],[544,154],[514,142],springJunction,[412,139],[370,131],[318,138],[261,138],[225,138],[203,132],[183,124],places.fox.point],
  [springJunction,[457,179],[438,199],places.hotspring.point]
 ];
 const distance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
 const tileSize=8,size=768,viewSize=256;
 const roadDistance=(x,y)=>Math.min(...roads.flatMap(r=>r.slice(1).map((b,i)=>distance(x,y,r[i],b))));
 const river=[[388,325],[433,338],[458,366],[417,391],[396,429],[429,466],[413,508],[401,558],[398,610],[454,652]];
 const riverDistance=(x,y)=>Math.min(...river.slice(1).map((b,i)=>distance(x,y,river[i],b)));
 const tiles=[];
 for(let ty=0;ty<96;ty++)for(let tx=0;tx<96;tx++){
  const x=tx*8+4,y=ty*8+4,d=roadDistance(x,y),r=riverDistance(x,y),noise=((tx*31+ty*17+tx*ty*7)%19)/19;
  const coast=((x-384)/354)**2+((y-379)/354)**2;
  let type=coast>1+Math.sin(y/43)*.06?'water':d<6?'road':d<24+Math.sin(x/51)*5+Math.cos(y/43)*5?'grass':Math.sin(x/43)+Math.cos(y/37)>.35&&d>42?'mountain':'forest';
  if(r<9)type=d<9?'bridge':'water';
  if(d<12&&type==='water')type='bridge';
  // Small clearings around each settlement, joined to the same road system.
  if(Object.values(places).some(p=>Math.hypot(x-p.point[0],y-p.point[1])<15))type='grass';
  tiles.push(type);
 }
 const tileAt=(x,y)=>x<0||y<0||x>=size||y>=size?'water':tiles[Math.floor(y/8)*96+Math.floor(x/8)];
 const walkable=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&['grass','road','bridge'].includes(tileAt(x,y));
 const near=(x,y)=>Object.keys(places).find(k=>Math.hypot(x-places[k].point[0],y-places[k].point[1])<=18)||null;
 const camera=(x,y)=>({x:Math.max(0,Math.min(size-viewSize,x-viewSize/2)),y:Math.max(0,Math.min(size-viewSize,y-viewSize/2)),size:viewSize,zoom:768/viewSize});
 const hash=(x,y)=>{let n=Math.imul(x+419,374761393)^Math.imul(y+911,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967295;};
 function draw(c,atlas){
  c.imageSmoothingEnabled=false;
  const ready=atlas&&atlas.complete&&atlas.naturalWidth;
  const stamp=(index,x,y,w,h=w)=>{if(!ready)return;const sw=atlas.naturalWidth/4,sh=atlas.naturalHeight/4;c.drawImage(atlas,(index%4)*sw,Math.floor(index/4)*sh,sw,sh,x-w/2,y-h/2,w,h);};
  // Broad low-contrast colour patches follow the land rather than the tile grid.
  for(let ty=0;ty<96;ty++)for(let tx=0;tx<96;tx++){
   const x=tx*8,y=ty*8,t=tiles[ty*96+tx],v=hash(tx,ty),patch=Math.sin(x/36)+Math.cos(y/47)+Math.sin((x+y)/69);
   const water=t==='water',road=t==='road',bridge=t==='bridge';
   c.fillStyle=water?(riverDistance(x+4,y+4)<14?'#347f9a':'#286780'):road?'#c6b583':bridge?'#337c92':t==='mountain'?'#6b7956':t==='forest'?(patch>0?'#537b48':'#497344'):(patch>1?'#85a55d':patch<-.8?'#759951':'#7c9f56');c.fillRect(x,y,8,8);
   if(water){
    const adjacent=[[0,-8],[8,0],[0,8],[-8,0]].map(([dx,dy])=>tileAt(x+4+dx,y+4+dy)!=='water');
    if(adjacent.some(Boolean)){c.fillStyle='#559c9c';if(adjacent[0])c.fillRect(x,y,8,2);if(adjacent[1])c.fillRect(x+6,y,2,8);if(adjacent[2])c.fillRect(x,y+6,8,2);if(adjacent[3])c.fillRect(x,y,2,8);c.fillStyle='#91b7a1';if(adjacent[0])c.fillRect(x,y,8,.5);if(adjacent[1])c.fillRect(x+7.5,y,.5,8);if(adjacent[2])c.fillRect(x,y+7.5,8,.5);if(adjacent[3])c.fillRect(x,y,.5,8);}
    if(v>.62){c.fillStyle='#5694a7';c.fillRect(x+v*4,y+v*6,2+v*2,.5);}
   }else if(bridge){
    c.fillStyle='#685036';c.fillRect(x,y,8,8);c.fillStyle='#b59a66';for(let i=0;i<8;i+=2)c.fillRect(x,y+i,8,1.5);
   }else{
    for(let n=0;n<4;n++){const f=hash(tx*7+n,ty*3),px=x+f*7,py=y+hash(tx+n,ty+83)*7;c.fillStyle=road?(n%2?'#b3a076':'#d2c398'):(n%2?'#9db67555':'#466d3b40');c.fillRect(px,py,.5+f,.5);}
    if(t==='grass'&&v>.88){c.fillStyle='#537d43';c.fillRect(x+3,y+4,.5,1.5);c.fillRect(x+2,y+4.5,2,.5);if(v>.965){c.fillStyle=y<300?'#eddcbd':'#d3c573';c.fillRect(x+3,y+3.5,1,.5);}}
    if(road){c.fillStyle='#af9d73';for(const [dx,dy] of [[0,-8],[8,0],[0,8],[-8,0]])if(tileAt(x+4+dx,y+4+dy)==='grass'){if(dx)c.fillRect(dx>0?x+7.5:x,y,.5,8);else c.fillRect(x,dy>0?y+7.5:y,8,.5);}}
   }
  }
  // Overlapping, varied groves and ridges replace one identical icon per tile.
  const fits=(x,y,w)=>{for(let yy=y-w/2;yy<=y+w/2;yy+=4)for(let xx=x-w/2;xx<=x+w/2;xx+=4)if(!['forest','mountain'].includes(tileAt(xx,yy)))return false;return true;};
  for(let gy=12;gy<758;gy+=12)for(let gx=12;gx<758;gx+=12){
   const v=hash(gx,gy),x=gx+(v-.5)*6,y=gy+(hash(gy,gx)-.5)*5,t=tileAt(x,y);if(!['forest','mountain'].includes(t))continue;
   if(t==='mountain'&&(Math.floor(gx/12)%2||Math.floor(gy/12)%2))continue;
   if(t==='forest'&&v<.16)continue;
   const w=t==='mountain'?32:18+v*3;
   if(fits(x,y,w*.85)){
    const autumn=Math.hypot(x-171,y-111)<80;
    const index=t==='mountain'?(autumn?7:4+Math.floor(v*3)):(autumn?7:Math.hypot(x-211,y-565)<55&&v>.55?3:y<280||v>.85?1:Math.sin(x/55)+Math.cos(y/51)>0?0:2);
    stamp(index,x,y,w,w*.86);
   }else if(fits(x,y,9)){stamp(t==='mountain'?6:Math.floor(v*3),x,y,11,10);}
  }
  const icons={village:8,shrine:9,cove:10,forest:11,waterfall:12,hotspring:13,fox:14};
  for(const [k,p] of Object.entries(places)){
   const [x,y]=p.point,w=k==='village'?42:k==='waterfall'?36:34;
   // The south edge is the A-button approach; no canopy covers the player there.
   stamp(icons[k],x,y-w*.32,w,w*.85);
  }
 }
 return {start,hub,places,roads,walkable,near,revision:4,tileAt,tileSize,size,viewSize,camera,draw};
})();

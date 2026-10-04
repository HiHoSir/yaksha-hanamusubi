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
 function draw(c){
  c.imageSmoothingEnabled=false;
  for(let ty=0;ty<96;ty++)for(let tx=0;tx<96;tx++){
   const x=tx*8,y=ty*8,t=tiles[ty*96+tx],v=(tx*7+ty*13)%5;
   c.fillStyle=t==='water'?'#286baf':t==='road'?'#cbbb73':t==='bridge'?'#245a8a':'#72ac4e';c.fillRect(x,y,8,8);
   if(t==='water'){c.fillStyle='#438ac1';c.fillRect(x+v,y+3,3,1);c.fillStyle='#1b5594';c.fillRect(x+1,y+6,4,1);}
   if(t==='grass'){c.fillStyle='#568e3c';c.fillRect(x+v+1,y+3,1,2);c.fillRect(x+v,y+4,3,1);if(v===0){c.fillStyle='#94bd61';c.fillRect(x+5,y+6,2,1);}}
   if(t==='road'){c.fillStyle='#b4a365';c.fillRect(x+v,y+5,1,1);}
   if(t==='forest'){
    c.fillStyle='#304e30';c.fillRect(x+1,y+5,6,2);c.fillStyle='#654c2e';c.fillRect(x+3.5,y+6,1,2);
    c.fillStyle='#244f30';c.fillRect(x+.5,y+3.5,7,2.5);c.fillRect(x+1.5,y+1.5,5,3);c.fillRect(x+2.5,y+.5,3,2);
    c.fillStyle='#3d783a';c.fillRect(x+1,y+3,5,2);c.fillRect(x+2,y+1.5,3.5,2);
    c.fillStyle='#5b9844';c.fillRect(x+2.5,y+1,2,1);c.fillRect(x+1.5,y+3,2,1);c.fillStyle='#30632f';c.fillRect(x+4,y+4.5,2.5,1);
   }
   if(t==='mountain'){
    c.fillStyle='#414c3e';c.fillRect(x,y+6,8,2);c.fillRect(x+1,y+4,6,2);c.fillRect(x+2,y+2.5,4,2);c.fillRect(x+3,y+1,2,2);
    c.fillStyle='#7c8466';c.fillRect(x+1,y+5,3,2);c.fillRect(x+2,y+3,2,3);c.fillRect(x+3,y+2,1,2);
    c.fillStyle='#b4b394';c.fillRect(x+3,y+1,1,2);c.fillRect(x+2,y+3,1,1);c.fillStyle='#59644e';c.fillRect(x+4,y+3,1.5,3);c.fillRect(x+5,y+5,2,2);
   }
   if(t==='bridge'){c.fillStyle='#76532f';c.fillRect(x,y,8,8);c.fillStyle='#c6a169';for(let i=0;i<8;i+=3)c.fillRect(x,y+i,8,2);}
  }
  for(const [k,p] of Object.entries(places)){
   const [x,y]=p.point;
   const house=(hx,hy,roof)=>{c.fillStyle='#594831';c.fillRect(hx-5,hy-7,10,8);c.fillStyle='#ead7a1';c.fillRect(hx-4,hy-6,8,6);c.fillStyle='#293b49';c.fillRect(hx-7,hy-9,14,3);c.fillStyle=roof;c.fillRect(hx-6,hy-10,12,3);c.fillRect(hx-4,hy-12,8,2);c.fillStyle='#769095';c.fillRect(hx-4,hy-11,8,.5);c.fillRect(hx-6,hy-8.5,12,.5);c.fillStyle='#b99e6b';c.fillRect(hx-4,hy-5,1,5);c.fillRect(hx+3,hy-5,1,5);c.fillStyle='#3d3930';c.fillRect(hx-1,hy-3,3,4);};
   if(k==='village'){house(x-7,y-8,'#38547a');house(x+7,y-1,'#38547a');}
   else if(k==='shrine'||k==='fox'){house(x,y-5,k==='fox'?'#8c393e':'#485e84');c.fillStyle='#ad453d';c.fillRect(x-9,y-3,18,2);c.fillRect(x-7,y-1,2,6);c.fillRect(x+5,y-1,2,6);}
   else if(k==='forest'){c.fillStyle='#e8d9a0';c.fillRect(x-2,y-6,4,9);c.fillStyle='#795738';c.fillRect(x-4,y-6,8,4);}
   else if(k==='waterfall'){c.fillStyle='#5a6b64';c.fillRect(x-10,y-20,20,17);c.fillStyle='#c5eeee';c.fillRect(x-4,y-20,8,19);c.fillStyle='#6fc9dc';c.fillRect(x-1,y-19,3,17);}
   else {house(x,y-4,'#735d47');if(k==='hotspring'){c.fillStyle='#b4dfd6';c.fillRect(x-8,y+3,15,4);c.fillStyle='#e1f3d6';c.fillRect(x+2,y-17,1,4);c.fillRect(x-3,y-15,1,4);}}
  }
 }
 return {start,hub,places,roads,walkable,near,revision:4,tileAt,tileSize,size,viewSize,camera,draw};
})();

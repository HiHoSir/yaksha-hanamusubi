// An open-field journey with sequential destinations, natural terrain and optional detours.
window.YK_WORLD=(()=>{
 const start=[230,534],hub=start; // hub retained only as a save/test compatibility alias.
 const places={
  village:{point:[211,565],name:"鬼灯の里",note:"旅の出発点。湖を左に見て、北の山裾の天妖の社へ。"},
  shrine:{point:[194,366],name:"天妖の社",note:"里の北の社。参拝したら東の川沿いを浜へ。"},
  cove:{point:[467,610],name:"海の入り江",note:"川沿いの橋を渡った先の浜。北東の森へ道が続く。"},
  forest:{point:[661,405],name:"忘れの森",note:"東の森を抜け、北の龍神の滝を目指そう。"},
  waterfall:{point:[637,191],name:"龍神の滝",note:"旅路の北端。滝を訪ねたら西の祠へ。"},
  hotspring:{point:[431,214],name:"月見の湯",note:"滝から祠へ向かう道中の寄り道。湯でひと休み。"},
  fox:{point:[171,111],name:"九尾の祠",note:"北の山間を西へ抜けた先、紅葉に囲まれた祠。"}
 };
 const shrineJunction=[289,415],springJunction=[458,138];
 // Scenic landmarks make each leg of the journey visually distinct without turning
 // the field back into a narrow road corridor.
 const scenicZones=[
  {kind:"farmland",x:238,y:535,rx:92,ry:76},
  {kind:"foothill",x:286,y:438,rx:88,ry:62},
  {kind:"shrine",x:205,y:360,rx:72,ry:66},
  {kind:"coast",x:466,y:590,rx:94,ry:68},
  {kind:"seaVista",x:557,y:527,rx:88,ry:62},
  {kind:"forestEdge",x:610,y:455,rx:82,ry:66},
  {kind:"deepForest",x:650,y:408,rx:78,ry:88},
  {kind:"falls",x:632,y:206,rx:78,ry:70},
  {kind:"highland",x:540,y:160,rx:94,ry:48},
  {kind:"autumn",x:210,y:132,rx:108,ry:58}
 ];
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
 const tileSize=8,size=768,viewSize=220;
 // These polylines are journey/QA guides, not visible corridors or collision walls.
 const roadDistance=(x,y)=>Math.min(...roads.flatMap(r=>r.slice(1).map((b,i)=>distance(x,y,r[i],b))));
 const coast=[[0,0],[575,0],[592,58],[629,85],[627,129],[702,151],[720,212],[707,239],[746,267],[722,311],[736,342],[711,373],[718,418],[684,455],[650,490],[647,530],[608,559],[575,590],[540,615],[480,608],[455,630],[451,659],[409,643],[372,679],[331,673],[291,721],[260,768],[0,768]];
 const ridge=[[0,0],[522,0],[512,60],[437,89],[395,152],[446,200],[484,271],[454,319],[390,295],[342,234],[309,190],[238,226],[173,281],[166,345],[122,407],[73,430],[36,392],[0,410]];
 const southRidge=[[0,571],[58,589],[85,639],[130,652],[160,701],[162,768],[0,768]];
 const groves=[[268,478,24,25],[135,596,23,25],[333,535,21,32],[301,640,29,22],[348,344,27,31],[510,439,35,26],[604,361,30,33],[683,415,27,42],[558,254,27,24],[488,196,21,27],[214,120,22,25],[305,90,34,22],[561,122,24,16],[473,522,22,20]];
 const inside=(x,y,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [ax,ay]=poly[i],[bx,by]=poly[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;}return hit;};
 const river=[[388,325],[433,338],[458,366],[417,391],[396,429],[429,466],[413,508],[401,558],[398,610],[454,660]];
 const westRiver=[[115,514],[164,548],[159,586],[179,623],[148,658],[183,704],[214,768]];
 const riverDistance=(x,y)=>Math.min(...[river,westRiver].flatMap(line=>line.slice(1).map((b,i)=>distance(x,y,line[i],b))));
 const tiles=[];
 for(let ty=0;ty<96;ty++)for(let tx=0;tx<96;tx++){
  const x=tx*8+4,y=ty*8+4,d=roadDistance(x,y),r=riverDistance(x,y);
  const lake=((x-109)/66)**2+((y-487)/42)**2<1;
  let type=inside(x,y,coast)?'grass':'water';
  if(type==='grass'){
   if(inside(x,y,ridge)||inside(x,y,southRidge))type='mountain';
   else if(groves.some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<1))type='forest';
   // Generous mountain passes and settlement clearings, with open plains elsewhere.
   if(d<23)type='grass';
   if(lake||r<7)type='water';
   if(r<7&&d<10)type='bridge';
   // Optional west-bank crossing, distinct from the main story's southern bridge.
   if(r<7&&Math.abs(y-582)<8)type='bridge';
  }
  if(Object.values(places).some(p=>Math.hypot(x-p.point[0],y-p.point[1])<14))type='grass';
  tiles.push(type);
 }
 const tileAt=(x,y)=>x<0||y<0||x>=size||y>=size?'water':tiles[Math.floor(y/8)*96+Math.floor(x/8)];
 const walkable=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&['grass','road','bridge'].includes(tileAt(x,y));
 const near=(x,y)=>Object.keys(places).find(k=>Math.hypot(x-places[k].point[0],y-places[k].point[1])<=26)||null;
 const camera=(x,y)=>{
  // Keep the hero on one stable camera anchor. Direction changes must never move the world.
  return {x:Math.max(0,Math.min(size-viewSize,x-viewSize/2)),y:Math.max(0,Math.min(size-viewSize,y-viewSize/2)),size:viewSize,zoom:768/viewSize};
 };
 const hash=(x,y)=>{let n=Math.imul(x+419,374761393)^Math.imul(y+911,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967295;};
 function draw(c,atlas){
  c.imageSmoothingEnabled=false;
  const ready=atlas&&atlas.complete&&atlas.naturalWidth;
  // The generated sheet has slightly uneven row padding; explicit cell crops keep every base intact.
  const rows=[0,.282,.505,.726,1];
  const stamp=(index,x,y,w,h=w)=>{if(!ready)return;const sw=atlas.naturalWidth/4,row=Math.floor(index/4),sy=rows[row]*atlas.naturalHeight,sh=(rows[row+1]-rows[row])*atlas.naturalHeight;c.drawImage(atlas,(index%4)*sw,sy,sw,sh,x-w/2,y-h/2,w,h);};
  for(let ty=0;ty<96;ty++)for(let tx=0;tx<96;tx++){
   const x=tx*8,y=ty*8,t=tiles[ty*96+tx],v=hash(tx,ty),water=t==='water',bridge=t==='bridge';
   c.fillStyle=water||bridge?'#245d72':'#a5cf52';c.fillRect(x,y,8,8);
   if(water){
    // Low-contrast ripples; stone bank and thin foam at the actual collision edge.
    for(let n=0;n<2;n++){const f=hash(tx+n*23,ty+9);c.fillStyle=n?'#2d697a':'#205669';c.fillRect(x+f*5,y+n*4+f,2+f*2,.5);}
    const edges=[[0,-8],[8,0],[0,8],[-8,0]].map(([dx,dy])=>!['water','bridge'].includes(tileAt(x+4+dx,y+4+dy)));
    // A shallow turquoise shelf and broken foam soften the coastline into a readable shore.
    if(edges.some(Boolean)){
     c.fillStyle='rgba(83,151,150,.45)';c.fillRect(x+.5,y+.5,7,7);
     if(v>.38){c.fillStyle='rgba(220,239,203,.62)';c.fillRect(x+1+(v*4|0),y+2+(v*3|0),2.5,.6);}
    }
    for(let e=0;e<4;e++)if(edges[e]){
     c.fillStyle='#927e53';if(e===0)c.fillRect(x,y,8,1.5);if(e===1)c.fillRect(x+6.5,y,1.5,8);if(e===2)c.fillRect(x,y+6.5,8,1.5);if(e===3)c.fillRect(x,y,1.5,8);
     c.fillStyle='#e3e8ba';const o=(tx+ty)%3;if(e===0)c.fillRect(x+o,y+1.5,3,.5);if(e===1)c.fillRect(x+6,y+o,.5,3);if(e===2)c.fillRect(x+o,y+6,3,.5);if(e===3)c.fillRect(x+1.5,y+o,.5,3);
    }
   }else if(bridge){
    c.fillStyle='#674a30';c.fillRect(x,y,8,8);c.fillStyle='#c2a16a';for(let n=0;n<8;n+=2)c.fillRect(x,y+n,8,1.5);
    c.fillStyle='#765739';if(tileAt(x+4,y-4)!=='bridge')c.fillRect(x,y,8,.75);if(tileAt(x+4,y+12)!=='bridge')c.fillRect(x,y+7.25,8,.75);
   }else{
    // Mostly quiet grass, with a few tufts and flowers rather than dense texture noise.
    if(v>.75){c.fillStyle='#94c14b';c.fillRect(x+v*4,y+3,1,.5);}
    if(t==='grass'&&v>.94){c.fillStyle='#6eaa43';c.fillRect(x+3,y+4,.5,1.5);c.fillRect(x+2,y+4.5,2,.5);if(v>.988){c.fillStyle='#fff0bf';c.fillRect(x+3,y+3.5,1,1);}}
   }
  }
  // Layer terrain from north to south so ranges and woods read as masses instead of icon grids.
  const fits=(x,y,w,type)=>{for(let yy=y-w/2;yy<=y+w/2;yy+=4)for(let xx=x-w/2;xx<=x+w/2;xx+=4)if(tileAt(xx,yy)!==type)return false;return true;};
  for(let gy=2;gy<768;gy+=10)for(let gx=2;gx<768;gx+=11){
   const v=hash(gx,gy),x=gx+(Math.floor(gy/10)%2)*5,y=gy,t=tileAt(x,y);
   if(t==='mountain'){
    const deep=fits(x,y,20,'mountain'),mid=fits(x,y,9,'mountain');
    const w=deep?38:mid?23:13,h=w*(deep?.76:.72);
    // dark foot shadow + staggered atlas peaks creates one continuous ridge silhouette
    c.fillStyle=deep?'rgba(47,83,53,.32)':'rgba(54,91,58,.22)';
    c.beginPath();c.ellipse(x,y+h*.24,w*.46,h*.22,0,0,Math.PI*2);c.fill();
    stamp(deep?4+Math.floor(v*3):mid?5+Math.floor(v*2):7,x,y-(deep?3:0),w,h);
    if(deep&&v>.66){c.fillStyle='rgba(224,235,194,.34)';c.beginPath();c.moveTo(x-2,y-h*.34);c.lineTo(x+4,y-h*.12);c.lineTo(x+1,y-h*.15);c.closePath();c.fill();}
   }else if(t==='forest'){
    const deep=fits(x,y,17,'forest'),mid=fits(x,y,8,'forest');
    const w=deep?31:mid?22:14;
    if(deep){c.fillStyle='rgba(29,69,42,.25)';c.beginPath();c.ellipse(x,y+2,w*.5,w*.22,0,0,Math.PI*2);c.fill();}
    stamp(Math.hypot(x-211,y-565)<80&&v>.72?3:Math.floor(v*3),x,y-(deep?2:0),w,w*.86);
   }
  }
  // Offshore rock clusters give the sea depth without changing collision.
  for(const [rx,ry,s] of [[46,456,1],[84,445,.8],[525,678,.9],[565,645,.65],[702,505,.75],[735,544,.55]]){
   if(tileAt(rx,ry)!=='water')continue;
   c.fillStyle='#596b62';c.beginPath();c.moveTo(rx-6*s,ry+4*s);c.lineTo(rx-2*s,ry-7*s);c.lineTo(rx+2*s,ry-3*s);c.lineTo(rx+6*s,ry+4*s);c.closePath();c.fill();
   c.strokeStyle='rgba(232,241,211,.72)';c.lineWidth=1;c.beginPath();c.arc(rx,ry+4*s,8*s,Math.PI*.08,Math.PI*.92);c.stroke();
  }
  // Regional scenery: visual breadcrumbs rather than collision corridors.
  const dot=(x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  for(const z of scenicZones){
   const count=z.kind==="farmland"?18:z.kind==="autumn"?16:12;
   for(let i=0;i<count;i++){
    const a=hash(i*37+Math.floor(z.x),Math.floor(z.y))*Math.PI*2;
    const rr=Math.sqrt(hash(i*71+13,Math.floor(z.x)))*.82;
    const x=z.x+Math.cos(a)*z.rx*rr,y=z.y+Math.sin(a)*z.ry*rr;
    if(tileAt(x,y)!=="grass")continue;
    if(z.kind==="farmland"){
     c.save();c.translate(x,y);c.rotate((i%3-1)*.12);c.fillStyle=i%2?"#d6c86b":"#b9b957";
     c.fillRect(-7,-3,14,6);c.strokeStyle="#8e8649";c.lineWidth=.7;
     for(let q=-5;q<=5;q+=4){c.beginPath();c.moveTo(q,-3);c.lineTo(q,3);c.stroke();}c.restore();
     if(i%5===0){c.fillStyle="#e8a4b7";dot(x+5,y-6,2.5,"#e8a4b7");}
    }else if(z.kind==="foothill"){
     // Sparse rocks and low shrubs tighten the view before the shrine without making a corridor.
     dot(x-2,y+1,2.7,i%2?"#74805b":"#68755a");dot(x+3,y-2,2.2,"#6c8450");
    }else if(z.kind==="shrine"){
     c.fillStyle="#314f35";c.fillRect(x-1.2,y-7,2.4,8);dot(x,y-8,4.5,"#426b42");
     if(i%4===0){c.fillStyle="#aaa18a";c.fillRect(x+5,y-3,2,5);c.fillRect(x+3.5,y-4.5,5,1.5);}
    }else if(z.kind==="coast"){
     c.fillStyle="#c9b77c";c.fillRect(x-4,y-1,8,2);c.fillStyle="#80775d";dot(x+3,y-2,2.2,"#80775d");
    }else if(z.kind==="seaVista"){
     // Keep this leg visually open: tiny grasses only, so the coastline becomes the landmark.
     if(i%3===0){c.fillStyle="#7fa94b";c.fillRect(x,y,1,3);c.fillRect(x-2,y+2,4,.7);}
    }else if(z.kind==="forestEdge"){
     // The forest approaches gradually before becoming dense.
     c.fillStyle="#4c7540";dot(x,y-3,4.2,"#4c7540");c.fillStyle="#60472e";c.fillRect(x-.8,y,1.6,4);
    }else if(z.kind==="deepForest"){
     c.fillStyle=i%2?"#294c35":"#365d3a";dot(x,y-5,6,"#294c35");c.fillStyle="#503b29";c.fillRect(x-1,y-3,2,6);
    }else if(z.kind==="falls"){
     c.fillStyle="#66756b";dot(x,y,3.5,"#66756b");if(i%3===0){c.strokeStyle="#d8edf0";c.lineWidth=1;c.beginPath();c.moveTo(x-5,y+5);c.lineTo(x+5,y+5);c.stroke();}
    }else if(z.kind==="highland"){
     // Cool, sparse alpine grass separates the waterfall basin from the autumn shrine region.
     c.fillStyle=i%2?"#76945b":"#879d68";c.fillRect(x-3,y,6,1);if(i%4===0)dot(x+2,y-2,1.5,"#d8dfbd");
    }else if(z.kind==="autumn"){
     c.fillStyle="#65412d";c.fillRect(x-1,y-2,2,7);dot(x,y-5,5,i%2?"#b74e39":"#d0783e");
    }
   }
  }
  // A few signposts mark major forks while the surrounding plain stays explorable.
  for(const [x,y] of [[307,421],[589,496],[482,145]])stamp(15,x,y,10,12);
  const icons={village:8,shrine:9,cove:10,forest:11,waterfall:12,hotspring:13,fox:14};
  for(const [k,p] of Object.entries(places)){
   const [x,y]=p.point,w=k==='village'?31:k==='waterfall'?28:25;
   stamp(icons[k],x,y-w*.31,w,w*.85);
  }
 }
 return {start,hub,places,roads,walkable,near,revision:10,tileAt,tileSize,size,viewSize,camera,draw};
})();

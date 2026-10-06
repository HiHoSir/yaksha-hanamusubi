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
  {kind:"farmland",x:225,y:555,rx:58,ry:46},
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
 // 32px logical grid for collision/events. Visual terrain may use larger image assets.
 const tileSize=32,size=768,viewSize=220,gridCols=Math.ceil(size/tileSize),gridRows=Math.ceil(size/tileSize);
 const TILE={GRASS:0,MOUNTAIN:1,FOREST:2,WATER:3,SHALLOW:4,BRIDGE:5,SAND:6,SPECIAL:7};
 const TILE_NAME=['grass','mountain','forest','water','shallow','bridge','sand','special'];
 // These polylines are journey/QA guides, not visible corridors or collision walls.
 const roadDistance=(x,y)=>Math.min(...roads.flatMap(r=>r.slice(1).map((b,i)=>distance(x,y,r[i],b))));
 // Coast authored on the same 32px rhythm as the field tiles.
 // Longer runs with occasional 32/64px inlets avoid the old one-cell staircase silhouette.
 const coast=[[0,0],[576,0],[576,64],[608,64],[608,128],[672,128],[672,160],[704,160],[704,224],[736,224],[736,288],[704,288],[704,352],[736,352],[736,416],[704,416],[704,448],[672,448],[672,512],[640,512],[640,544],[576,544],[576,576],[544,576],[544,608],[480,608],[480,640],[448,640],[448,672],[384,672],[384,704],[320,704],[320,736],[288,736],[288,768],[0,768]];
 const ridge=[[0,0],[522,0],[512,60],[437,89],[395,152],[446,200],[484,271],[454,319],[390,295],[342,234],[309,190],[238,226],[173,281],[166,345],[122,407],[73,430],[36,392],[0,410]];
 const southRidge=[[0,571],[58,589],[85,639],[130,652],[160,701],[162,768],[0,768]];
 const groves=[[268,478,24,25],[135,596,23,25],[333,535,21,32],[301,640,29,22],[348,344,27,31],[510,439,35,26],[604,361,30,33],[683,415,27,42],[558,254,27,24],[488,196,21,27],[214,120,22,25],[305,90,34,22],[561,122,24,16],[473,522,22,20]];
 const inside=(x,y,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [ax,ay]=poly[i],[bx,by]=poly[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;}return hit;};
 const river=[[388,325],[433,338],[458,366],[417,391],[396,429],[429,466],[413,508],[401,558],[398,610],[454,660]];
 const westRiver=[[115,514],[164,548],[159,586],[179,623],[148,658],[183,704],[214,768]];
 const riverDistance=(x,y)=>Math.min(...[river,westRiver].flatMap(line=>line.slice(1).map((b,i)=>distance(x,y,line[i],b))));
 // Authored 24x24 field tile map. This is now the source of truth for terrain/collision.
 // 0 grass, 1 mountain, 2 forest, 3 water, 4 shallow, 5 bridge, 6 sand, 7 special.
 // Keeping world coordinates and tile IDs stable preserves saves, events and movement behavior.
 const FIELD_TILE_ROWS=[
  "111111111111111100333333",
  "111111111111111100333333",
  "111111111111110000033333",
  "111110211110100002033333",
  "111110000000000000000333",
  "111111111111100200000033",
  "111111111011102200000033",
  "111111100001111022000003",
  "111111000000111002000003",
  "111110000000010000000033",
  "111110000022030000200033",
  "111110000022003000220203",
  "111100000000000000200223",
  "111111000000300222222233",
  "111111000000030022222333",
  "111130000000030022222333",
  "111130000000300000022333",
  "111100000000500000322333",
  "111110000000300022222333",
  "111110002220000333333333",
  "111110022222003333333333",
  "111111022222333333333333",
  "111111002223333333333333",
  "111111300333333333333333"
 ];
 const mapData=FIELD_TILE_ROWS.map((row,ty)=>{
  if(row.length!==gridCols)throw new Error("Invalid field tile row "+ty);
  return Array.from(row,ch=>Number(ch));
 });
 const tileIdAt=(x,y)=>x<0||y<0||x>=size||y>=size?TILE.WATER:mapData[Math.floor(y/tileSize)][Math.floor(x/tileSize)];
 const tileAt=(x,y)=>TILE_NAME[tileIdAt(x,y)];
 const walkable=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&[TILE.GRASS,TILE.SHALLOW,TILE.BRIDGE,TILE.SAND,TILE.SPECIAL].includes(tileIdAt(x,y));
 // Villages and destinations are fixed objects independent from terrain artwork.
 const worldObjects=Object.entries(places).map(([id,p])=>({id,type:id==='village'?'village':'destination',x:p.point[0],y:p.point[1],sprite:id,destination:id,name:p.name}));
 const near=(x,y)=>Object.keys(places).find(k=>Math.hypot(x-places[k].point[0],y-places[k].point[1])<=26)||null;
 const camera=(x,y)=>{
  // Keep the hero on one stable camera anchor. Direction changes must never move the world.
  return {x:Math.max(0,Math.min(size-viewSize,x-viewSize/2)),y:Math.max(0,Math.min(size-viewSize,y-viewSize/2)),size:viewSize,zoom:768/viewSize};
 };
 // Optional large terrain art. Missing files are harmless while assets are staged.
 const TERRAIN_ART={};
 const TERRAIN_PATHS={forestTreeA:"assets/terrain/forest-tree-a.png",forestTreeB:"assets/terrain/forest-tree-b.png",forestTreeC:"assets/terrain/forest-tree-c.png",mountainRange:"assets/terrain/mountain-a.png",waterAutotile:"assets/terrain/water-autotile-32-v5.png",fieldTiles:"assets/terrain/field-tileset-32-v3.png?v=3"};
 for(const [k,src] of Object.entries(TERRAIN_PATHS)){const im=new Image();im.onload=()=>{window.__YK_TERRAIN_REV=(window.__YK_TERRAIN_REV||0)+1;};im.src=src;TERRAIN_ART[k]=im;}
 const artReady=im=>!!(im&&im.complete&&im.naturalWidth);
 const drawTerrainArt=(c,key,x,y,w,h)=>{const im=TERRAIN_ART[key];if(!artReady(im))return false;c.drawImage(im,x-w/2,y-h,w,h);return true;};
 const hash=(x,y)=>{let n=Math.imul(x+419,374761393)^Math.imul(y+911,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967295;};
 const forestTreeKeys=["forestTreeA","forestTreeB","forestTreeC"];
 const forestTreeObjects=[];
 // Dense low forest: small overlapping crowns read as one field symbol, not giant individual trees.
 const isForestCell=(tx,ty)=>tx>=0&&ty>=0&&tx<gridCols&&ty<gridRows&&mapData[ty][tx]===TILE.FOREST;
 for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
  if(!isForestCell(tx,ty))continue;
  const cx=tx*tileSize+tileSize/2,cy=ty*tileSize+tileSize/2;
  const seed=(tx*17+ty*29)%3;
  const edge=![[-1,0],[1,0],[0,-1],[0,1]].every(([dx,dy])=>isForestCell(tx+dx,ty+dy));
  const stagger=(ty&1)?7:-3, jx=(hash(tx*13+7,ty*19)-.5)*7, jy=(hash(tx*23,ty*11+5)-.5)*5;
  const pts=[
   [-8+stagger,-7,19],[7+stagger,-8,19],[-14+stagger,5,18],[1+stagger,5,20],[15+stagger,6,18],
   [-6+stagger,15,19],[10+stagger,15,19]
  ];
  for(let i=0;i<pts.length;i++){
   if(edge&&i>4&&hash(tx*31+i,ty*37)<.42)continue;
   const [ox,oy,s]=pts[i];
   forestTreeObjects.push([forestTreeKeys[(seed+i)%3],cx+ox+jx,cy+oy+jy,s,s]);
  }
 }
 function draw(c,atlas){
  c.imageSmoothingEnabled=false;
  const ready=atlas&&atlas.complete&&atlas.naturalWidth;
  // The generated sheet has slightly uneven row padding; explicit cell crops keep every base intact.
  const rows=[0,.282,.505,.726,1];
  const stamp=(index,x,y,w,h=w)=>{if(!ready)return;const sw=atlas.naturalWidth/4,row=Math.floor(index/4),sy=rows[row]*atlas.naturalHeight,sh=(rows[row+1]-rows[row])*atlas.naturalHeight;c.drawImage(atlas,(index%4)*sw,sy,sw,sh,x-w/2,y-h/2,w,h);};
  for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
   const x=tx*tileSize,y=ty*tileSize,t=TILE_NAME[mapData[ty][tx]],v=hash(tx,ty),water=t==='water',bridge=t==='bridge';
   // Unified 32px field tileset migration: grass now comes from explicit image chips.
   // Water shoreline remains on the proven autotile sheet until its shore IDs are migrated.
   const fieldTiles=TERRAIN_ART.fieldTiles;
   if(!water&&!bridge&&artReady(fieldTiles)){
    const grassIndex=(tx*5+ty*3+(hash(tx+71,ty+29)*8|0))&7;
    c.drawImage(fieldTiles,grassIndex*32,0,32,32,x,y,32,32);
   }
   // Mountain and forest are now selected from the same 32px field sheet by N/E/S/W adjacency.
   // Logical tile IDs and collision remain unchanged.
   if((t==='mountain'||t==='forest')&&artReady(fieldTiles)){
    const target=t==='mountain'?TILE.MOUNTAIN:TILE.FOREST;
    const same=(gx,gy)=>gx>=0&&gy>=0&&gx<gridCols&&gy<gridRows&&mapData[gy][gx]===target;
    const mask=(same(tx,ty-1)?1:0)|(same(tx+1,ty)?2:0)|(same(tx,ty+1)?4:0)|(same(tx-1,ty)?8:0);
    const row=t==='mountain'?2:4;
    c.drawImage(fieldTiles,(mask&15)*32,row*32,32,32,x,y,32,32);
   }
   if(water){
    // 32px image autotile. Bitmask N/E/S/W marks adjacent land; collision remains mapData-only.
    const landAt=(gx,gy)=>gx<0||gy<0||gx>=gridCols||gy>=gridRows||![TILE.WATER,TILE.BRIDGE].includes(mapData[gy][gx]);
    const mask=(landAt(tx,ty-1)?1:0)|(landAt(tx+1,ty)?2:0)|(landAt(tx,ty+1)?4:0)|(landAt(tx-1,ty)?8:0);
    // Diagonal land is used only when both touching cardinal sides are water.
    // This preserves the collision grid while choosing an image tile with a filled inner corner.
    const diag=(landAt(tx-1,ty-1)&&!(mask&1)&&!(mask&8)?1:0)|
      (landAt(tx+1,ty-1)&&!(mask&1)&&!(mask&2)?2:0)|
      (landAt(tx+1,ty+1)&&!(mask&4)&&!(mask&2)?4:0)|
      (landAt(tx-1,ty+1)&&!(mask&4)&&!(mask&8)?8:0);
    // Unified field tileset v2: row 0 = grass/water variants, row 1 = 16 shoreline masks.
    // mapData remains the sole collision source; this is visual selection only.
    if(artReady(fieldTiles)){
     if(mask){
      c.drawImage(fieldTiles,(mask&15)*32,32,32,32,x,y,32,32);
     }else{
      const waterIndex=8+((tx*3+ty*5+(hash(tx+19,ty+41)*8|0))&7);
      c.drawImage(fieldTiles,waterIndex*32,0,32,32,x,y,32,32);
     }
    }else{
     const im=TERRAIN_ART.waterAutotile;
     if(artReady(im)){
      let diagClass=0;
      if(diag&1)diagClass=1;else if(diag&2)diagClass=2;else if(diag&4)diagClass=3;
      const index=diagClass*16+(mask&15);
      c.drawImage(im,(index%8)*32,Math.floor(index/8)*32,32,32,x,y,32,32);
     }else{c.fillStyle='#2f7180';c.fillRect(x,y,tileSize,tileSize);}
    }
   }else if(bridge){
    c.fillStyle='#2f7180';c.fillRect(x,y,tileSize,tileSize);
   }
   else if(!artReady(fieldTiles)){
    c.fillStyle='#a3cc55';c.fillRect(x,y,tileSize,tileSize);
   }
   if(water){
    // Transitional placeholder only; image-based shoreline assets replace legacy 8px decoration.
    /* legacy shoreline disabled
    // Low-contrast ripples; stone bank and thin foam at the actual collision edge.
    for(let n=0;n<2;n++){const f=hash(tx+n*23,ty+9);c.fillStyle=n?'#2d697a':'#205669';c.fillRect(x+f*5,y+n*4+f,2+f*2,.5);}
    const edges=[[0,-8],[8,0],[0,8],[-8,0]].map(([dx,dy])=>!['water','bridge'].includes(tileAt(x+4+dx,y+4+dy)));
    // A shallow turquoise shelf and broken foam soften the coastline into a readable shore.
    if(edges.some(Boolean)){
     c.fillStyle='rgba(82,151,151,.55)';c.fillRect(x+.5,y+.5,7,7);
     // Broken sand/grass shelf disguises the square tile edge.
     if(v>.22){c.fillStyle='rgba(199,184,123,.62)';c.beginPath();c.ellipse(x+4,y+4,3.6,2.4,(v-.5)*.5,0,Math.PI*2);c.fill()}
     if(v>.38){c.fillStyle='rgba(229,239,207,.70)';c.fillRect(x+1+(v*4|0),y+2+(v*3|0),2.5,.7);}
    }
    for(let e=0;e<4;e++)if(edges[e]){
     c.fillStyle='#927e53';if(e===0)c.fillRect(x,y,8,1.5);if(e===1)c.fillRect(x+6.5,y,1.5,8);if(e===2)c.fillRect(x,y+6.5,8,1.5);if(e===3)c.fillRect(x,y,1.5,8);
     c.fillStyle='#e3e8ba';const o=(tx+ty)%3;if(e===0)c.fillRect(x+o,y+1.5,3,.5);if(e===1)c.fillRect(x+6,y+o,.5,3);if(e===2)c.fillRect(x+o,y+6,3,.5);if(e===3)c.fillRect(x+1.5,y+o,.5,3);
    }
   */
   }else if(bridge){
    c.fillStyle='#674a30';c.fillRect(x,y,8,8);c.fillStyle='#c2a16a';for(let n=0;n<8;n+=2)c.fillRect(x,y+n,8,1.5);
    c.fillStyle='#765739';if(tileAt(x+4,y-4)!=='bridge')c.fillRect(x,y,8,.75);if(tileAt(x+4,y+12)!=='bridge')c.fillRect(x,y+7.25,8,.75);
   }else{
    // Irregular tufts, dry grass and tiny flowers give the plain material variation.
    if(v>.90){c.fillStyle='#7fa846';c.fillRect(x+1+v*4,y+3,1,.7);}
    if(v>.965){c.strokeStyle='rgba(93,130,61,.48)';c.lineWidth=.55;c.beginPath();c.moveTo(x+2,y+6);c.lineTo(x+3,y+3);c.moveTo(x+4,y+6);c.lineTo(x+5,y+2.5);c.stroke();}
    if(t==='grass'&&v>.992){c.fillStyle='#f0dfbd';c.beginPath();c.arc(x+3,y+3.5,.7,0,Math.PI*2);c.fill();}
   }
  }
  // Broad tonal patches make grassland read as terrain rather than a tiled green canvas.
  c.save();c.globalAlpha=.075;
  for(const [x,y,rx,ry,col] of [[305,520,170,92,'#c6bd68'],[545,535,205,110,'#77a84c'],[410,330,210,96,'#91b45a'],[610,275,145,90,'#719b52'],[250,205,165,86,'#a8b46a']]){
   c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,-.08,0,Math.PI*2);c.fill();
  }c.restore();
  // Mountain art is independent from the logical 32px MOUNTAIN collision grid.
  // Broad overlapping ranges remove thin vertical fragments and repetitive stair-steps.
  if(false&&artReady(TERRAIN_ART.mountainRange)){
   c.save();c.fillStyle="#789a50";
   c.beginPath();c.moveTo(0,0);c.lineTo(520,0);c.lineTo(500,72);c.lineTo(438,105);c.lineTo(410,150);c.lineTo(451,205);c.lineTo(470,268);c.lineTo(438,310);c.lineTo(382,286);c.lineTo(337,228);c.lineTo(306,203);c.lineTo(242,239);c.lineTo(190,285);c.lineTo(178,350);c.lineTo(126,412);c.lineTo(72,438);c.lineTo(28,410);c.lineTo(0,425);c.closePath();c.fill();
   c.beginPath();c.moveTo(0,558);c.lineTo(62,575);c.lineTo(96,626);c.lineTo(143,644);c.lineTo(176,700);c.lineTo(178,768);c.lineTo(0,768);c.closePath();c.fill();c.restore();
   const mountainObjects=[
    [78,72,190,124],[224,88,196,128],[370,104,202,132],[472,142,184,120],
    [62,196,184,120],[202,218,194,126],[338,236,196,128],
    [52,322,170,111],[154,344,176,114],
    [52,622,170,111],[108,704,180,117],[80,770,170,111]
   ];
   for(const [mx,my,mw,mh] of mountainObjects)drawTerrainArt(c,"mountainRange",mx,my,mw,mh);
   c.save();c.globalAlpha=.9;
   for(const [x,y,r] of [[432,267,12],[408,292,11],[372,284,10],[178,350,10],[137,389,11],[164,684,10]]){
    c.fillStyle="#5f8749";c.beginPath();c.ellipse(x,y,r*1.5,r*.7,-.15,0,Math.PI*2);c.fill();
   }c.restore();
  }
  // Ground-contact dressing merges stamped terrain into the landscape.
  for(let gy=6;gy<768;gy+=13)for(let gx=6;gx<768;gx+=15){
   const t=tileAt(gx,gy),v=hash(gx+31,gy+17);
   if(false&&t==='forest'){
    c.fillStyle=v>.5?'rgba(48,104,52,.34)':'rgba(65,119,55,.28)';
    c.beginPath();c.ellipse(gx,gy+4,5+v*5,2+v*2,0,0,Math.PI*2);c.fill();
    if(v>.72){c.fillStyle='#5e7c43';c.beginPath();c.arc(gx+5,gy,2.2,0,Math.PI*2);c.fill();}
   }else if(false&&t==='mountain'&&v>.45){
    c.fillStyle='rgba(91,105,69,.25)';c.beginPath();c.ellipse(gx,gy+3,6+v*4,2.5,0,0,Math.PI*2);c.fill();
   }
  }
  // Image-based forest objects: visual scale is independent from the 32px collision grid.
  // Until PNGs are uploaded, forest tiles intentionally remain visually quiet rather than falling back to procedural trees.
  // Forest visuals now come from FIELD_TILE_ROWS + unified 32px chips.
  // Offshore rock clusters give the sea depth without changing collision.
  for(const [rx,ry,s] of [[46,456,1],[84,445,.8],[525,678,.9],[565,645,.65],[702,505,.75],[735,544,.55]]){
   if(tileAt(rx,ry)!=='water')continue;
   c.fillStyle='#596b62';c.beginPath();c.moveTo(rx-6*s,ry+4*s);c.lineTo(rx-2*s,ry-7*s);c.lineTo(rx+2*s,ry-3*s);c.lineTo(rx+6*s,ry+4*s);c.closePath();c.fill();
   c.strokeStyle='rgba(232,241,211,.72)';c.lineWidth=1;c.beginPath();c.arc(rx,ry+4*s,8*s,Math.PI*.08,Math.PI*.92);c.stroke();
  }
  // Regional scenery: visual breadcrumbs rather than collision corridors.
  const dot=(x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  for(const z of scenicZones){
   const count=z.kind==="farmland"?9:z.kind==="autumn"?14:10;
   for(let i=0;i<count;i++){
    const a=hash(i*37+Math.floor(z.x),Math.floor(z.y))*Math.PI*2;
    const rr=Math.sqrt(hash(i*71+13,Math.floor(z.x)))*.82;
    const x=z.x+Math.cos(a)*z.rx*rr,y=z.y+Math.sin(a)*z.ry*rr;
    if(tileAt(x,y)!=="grass")continue;
    if(z.kind==="farmland"){
     c.save();c.translate(x,y);c.rotate((i%3-1)*.12);c.fillStyle=i%2?"#d6c86b":"#b9b957";
     c.fillRect(-6,-2.5,12,5);c.strokeStyle="#8e8649";c.lineWidth=.7;
     for(let q=-4;q<=4;q+=4){c.beginPath();c.moveTo(q,-3);c.lineTo(q,3);c.stroke();}c.restore();
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
  // Authoritative terrain pass: mapData itself paints the visible 32px terrain layer.
  // This intentionally avoids the experimental forest/mountain rows in field-tileset-v3.
  // Collision and visuals now share the same tile source of truth.
  for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
   const target=mapData[ty][tx],x=tx*tileSize,y=ty*tileSize;
   if(target===TILE.FOREST){
    // Character-scale trees: the 32px logical forest tile stays intact, but its art no longer fills the cell.
    const tree=(cx,cy,s,shade)=>{
     c.fillStyle="#65472f";c.fillRect(cx-s*.09,cy-s*.05,s*.18,s*.45);
     c.fillStyle=shade;c.beginPath();c.arc(cx,cy-s*.24,s*.28,0,Math.PI*2);c.fill();
     c.fillStyle="#4f7c43";c.beginPath();c.arc(cx-s*.17,cy-s*.17,s*.19,0,Math.PI*2);c.arc(cx+s*.18,cy-s*.15,s*.18,0,Math.PI*2);c.fill();
     c.fillStyle="rgba(132,168,78,.55)";c.fillRect(cx-s*.24,cy+s*.34,s*.48,s*.08);
    };
    const v=hash(tx+83,ty+47),edge=(tx===0||mapData[ty][tx-1]!==TILE.FOREST)||(tx===gridCols-1||mapData[ty][tx+1]!==TILE.FOREST)||(ty===0||mapData[ty-1][tx]!==TILE.FOREST)||(ty===gridRows-1||mapData[ty+1][tx]!==TILE.FOREST);
    if(!edge&&v>.45)tree(x+9,y+21,13,"#315d39");
    tree(x+18+(v-.5)*4,y+20,15,edge?"#3f7040":"#315d39");
    if(v>.28)tree(x+27,y+22,12,"#416f3e");
   }else if(target===TILE.MOUNTAIN){
    // No square backing: overlapping peaks reveal the grass between silhouettes and hide tile boundaries.
    const v=hash(tx+19,ty+61),base=y+31;
    c.fillStyle="#5d6758";c.beginPath();c.moveTo(x-3,base);c.lineTo(x+8,base-15-v*3);c.lineTo(x+14,base-8);c.lineTo(x+23,base-24+v*4);c.lineTo(x+35,base);c.closePath();c.fill();
    c.fillStyle="#aeb49b";c.beginPath();c.moveTo(x+23,base-24+v*4);c.lineTo(x+19,base-16);c.lineTo(x+23,base-18);c.lineTo(x+27,base-13);c.fill();
    c.fillStyle="rgba(67,91,57,.75)";c.fillRect(x-2,base-3,36,4);
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
 return {start,hub,places,roads,worldObjects,mapData,TILE,walkable,near,revision:18,tileAt,tileSize,size,viewSize,camera,draw};
})();

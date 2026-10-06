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
  // The opening vista deliberately frames three readable cues: village behind,
  // foothills to the north, and the eastern lowland leading toward the coast.
  {kind:"farmland",x:216,y:558,rx:72,ry:52},
  {kind:"foothill",x:276,y:438,rx:96,ry:68},
  {kind:"shrine",x:205,y:360,rx:72,ry:66},
  {kind:"coast",x:462,y:586,rx:106,ry:72},
  {kind:"seaVista",x:548,y:526,rx:98,ry:66},
  {kind:"forestEdge",x:603,y:462,rx:94,ry:72},
  {kind:"deepForest",x:650,y:408,rx:78,ry:88},
  {kind:"falls",x:638,y:210,rx:86,ry:78},
  {kind:"highland",x:526,y:166,rx:112,ry:56},
  {kind:"autumn",x:218,y:136,rx:116,ry:64}
 ];
 const roads=[
  // Opening leg bends gradually north-east so the next objective is suggested by terrain,
  // not by a straight corridor. Existing destination/event coordinates stay unchanged.
  [places.village.point,start,[229,516],[232,496],[241,477],[259,463],[278,448],shrineJunction],
  [shrineJunction,[246,405],[216,398],[197,382],places.shrine.point],
  [shrineJunction,[322,424],[343,438],[351,459],[351,482],[365,500],[381,516],[383,541],[391,563],[411,579],[434,590],[452,603],places.cove.point],
  // The coast leg follows the shoreline before turning inland through a visible forest fringe.
  [places.cove.point,[487,590],[507,579],[526,565],[544,551],[565,540],[584,526],[592,505],[602,486],[620,472],[640,457],[655,438],[661,420],places.forest.point],
  // Forest climbs into a narrow mountain-waterfall approach instead of a straight northern lane.
  [places.forest.point,[654,385],[642,367],[631,347],[629,327],[640,309],[654,292],[666,274],[672,255],[669,238],[660,222],[653,207],[645,196],places.waterfall.point],
  // The final traverse runs west along the highland; the hot spring branches naturally off the saddle.
  [places.waterfall.point,[611,194],[584,190],[560,181],[542,168],[516,154],springJunction,[430,145],[401,141],[369,137],[335,140],[301,145],[267,145],[233,140],[205,132],[184,123],places.fox.point],
  [springJunction,[459,164],[455,181],[444,198],places.hotspring.point]
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
  // Japanese-island-inspired main island: bays, peninsulas and inland mountain chains.
  // Every map edge is ocean, so future N/S/E/W wrapping joins ocean-to-ocean cleanly.
  "333333333333333333333333",
  "333333333333333333333333",
  "333333333000000333333333",
  "333330000001100003333333",
  "333330000011110000033333",
  "333300000110011000003333",
  "333000001100000220000333",
  "330000011000000222000033",
  "330000110000000022000033",
  "330000100000000000000033",
  "330000000022030000200033",
  "330000000022003000220033",
  "330000000000000000220033",
  "330000000000300222220033",
  "330000000000030022220033",
  "330030000000030022220033",
  "330030000000300000020033",
  "330000000000500000000033",
  "330000000000300022200033",
  "333000002220000000000333",
  "333300022220000000003333",
  "333330002200000000033333",
  "333333000000000003333333",
  "333333333333333333333333"
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
   [-7+stagger,-5,15],[7+stagger,-6,15],[-11+stagger,5,14],[1+stagger,5,16],[12+stagger,6,14],
   [-5+stagger,14,15],[9+stagger,14,14]
  ];
  for(let i=0;i<pts.length;i++){
   if(edge&&i>3&&hash(tx*31+i,ty*37)<.58)continue;
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
   // Forest/mountain collision still uses the 32px grid, but their visible forms are
   // rendered later as overlapping quarter-view symbols. Never expose the square source cells.
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
  // Keep the plain free of large geometric overlays. Material variation comes from
  // small irregular details so the 32px logic grid never becomes a visible shape.
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
  // Quarter-view mountain pass. One logical mountain cell becomes a low overlapping ridge,
  // with neighboring cells visually merging into a range rather than a wall of square chips.
  for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
   if(mapData[ty][tx]!==TILE.MOUNTAIN)continue;
   const v=hash(tx+811,ty+773),cx=tx*tileSize+16+(v-.5)*8,base=ty*tileSize+30;
   const peak=20+v*5,wide=23+v*4;
   c.save();
   c.fillStyle='rgba(55,69,48,.20)';c.beginPath();c.ellipse(cx+3,base+1,wide,4,-.08,0,Math.PI*2);c.fill();
   c.fillStyle='#5e6758';c.beginPath();c.moveTo(cx-wide,base);c.lineTo(cx-9,base-10);c.lineTo(cx,base-peak);c.lineTo(cx+9,base-12);c.lineTo(cx+wide,base);c.closePath();c.fill();
   c.fillStyle='#929985';c.beginPath();c.moveTo(cx,base-peak);c.lineTo(cx-5,base-14);c.lineTo(cx,base-17);c.lineTo(cx+6,base-11);c.closePath();c.fill();
   c.fillStyle='#496343';c.fillRect(cx-wide+3,base-3,wide*2-6,3);
   c.restore();
  }
  // Quarter-view forest canopy pass: irregular crowns overlap tile seams in screen-depth order.
  // Collision remains the original 32px FOREST cells; this pass is visual only.
  for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
   if(mapData[ty][tx]!==TILE.FOREST)continue;
   const v=hash(tx+733,ty+691),cx=tx*tileSize+16+(v-.5)*15,base=ty*tileSize+25+(hash(tx+29,ty+31)-.5)*7;
   const edge=![[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>tx+dx>=0&&ty+dy>=0&&tx+dx<gridCols&&ty+dy<gridRows&&mapData[ty+dy][tx+dx]===TILE.FOREST);
   c.save();
   c.globalAlpha=edge?.72:.84;
   c.fillStyle='rgba(48,73,43,.22)';c.beginPath();c.ellipse(cx+2,base+1,9,2.5,-.12,0,Math.PI*2);c.fill();
   c.fillStyle='#315d39';
   c.beginPath();c.arc(cx-4,base-8,4.6,0,Math.PI*2);c.arc(cx+3,base-9,5.2,0,Math.PI*2);c.arc(cx,base-13,5.5,0,Math.PI*2);c.fill();
   if(v>.38){c.fillStyle='#4b7a47';c.beginPath();c.arc(cx-2,base-14,2.7,0,Math.PI*2);c.arc(cx+4,base-12,2.4,0,Math.PI*2);c.fill();}
   c.fillStyle='#68472f';c.fillRect(cx-1,base-6,2,6);
   c.restore();
  }
  // Offshore rock clusters give the sea depth without changing collision.
  for(const [rx,ry,s] of [[46,456,1],[84,445,.8],[525,678,.9],[565,645,.65],[702,505,.75],[735,544,.55]]){
   if(tileAt(rx,ry)!=='water')continue;
   c.fillStyle='#596b62';c.beginPath();c.moveTo(rx-6*s,ry+4*s);c.lineTo(rx-2*s,ry-7*s);c.lineTo(rx+2*s,ry-3*s);c.lineTo(rx+6*s,ry+4*s);c.closePath();c.fill();
   c.strokeStyle='rgba(232,241,211,.72)';c.lineWidth=1;c.beginPath();c.arc(rx,ry+4*s,8*s,Math.PI*.08,Math.PI*.92);c.stroke();
  }
  // Sparse meadow clusters give broad plains a readable scale without becoming obstacles.
  for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
   if(mapData[ty][tx]!==TILE.GRASS)continue;
   const v=hash(tx+503,ty+419); if(v<.73)continue;
   const x=tx*tileSize,y=ty*tileSize,ox=6+v*17,oy=18+(1-v)*7;
   c.save();c.globalAlpha=.28;c.fillStyle="#6f8c4f";
   c.beginPath();c.ellipse(x+ox,y+oy,5.5,1.8,-.15,0,Math.PI*2);c.fill();
   c.globalAlpha=.34;c.strokeStyle="#567642";c.lineWidth=.8;
   c.beginPath();c.moveTo(x+ox-2,y+oy);c.lineTo(x+ox-1,y+oy-4);c.moveTo(x+ox+2,y+oy);c.lineTo(x+ox+4,y+oy-3);c.stroke();
   c.restore();
  }
  // Mountain foothills: small rock/brush accents make ranges emerge from the plain
  // instead of looking like isolated stamped symbols.
  for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
   if(mapData[ty][tx]!==TILE.GRASS)continue;
   let nearMountain=false;
   for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(mapData[ty+yy][tx+xx]===TILE.MOUNTAIN)nearMountain=true;
   if(!nearMountain)continue;
   const v=hash(tx+401,ty+359); if(v<.42)continue;
   const x=tx*tileSize,y=ty*tileSize,ox=7+v*16,base=y+25;
   c.save();
   c.globalAlpha=.52;c.fillStyle="#777966";c.beginPath();
   c.moveTo(x+ox-4,base);c.lineTo(x+ox,base-5);c.lineTo(x+ox+5,base);c.closePath();c.fill();
   c.globalAlpha=.45;c.fillStyle="#58734a";c.fillRect(x+ox-6,base+1,12,1.5);
   c.restore();
  }
  // Forest fringe crosses the logical seam with tiny, non-colliding crowns.
  // This hides the checkerboard edge without changing any walkable cell.
  for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
   if(mapData[ty][tx]!==TILE.GRASS)continue;
   let touchesForest=false;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(mapData[ty+dy][tx+dx]===TILE.FOREST)touchesForest=true;
   if(!touchesForest)continue;
   const v=hash(tx+617,ty+557); if(v<.34)continue;
   const x=tx*tileSize+(v>.67?7:24),y=ty*tileSize+20+(v-.5)*7;
   c.save();c.globalAlpha=.55;c.fillStyle='#416d43';
   c.beginPath();c.arc(x-3,y,3.2,0,Math.PI*2);c.arc(x+2,y-2,4,0,Math.PI*2);c.arc(x+5,y+1,2.8,0,Math.PI*2);c.fill();
   c.fillStyle='rgba(67,91,48,.45)';c.fillRect(x-6,y+3,13,1.4);c.restore();
  }
  // Inland transition belt: scattered low vegetation makes forest edges organic
  // while keeping the one-step/one-cell movement grid completely unchanged.
  for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
   if(mapData[ty][tx]!==TILE.GRASS)continue;
   let nearForest=false;
   for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(mapData[ty+yy][tx+xx]===TILE.FOREST)nearForest=true;
   if(!nearForest)continue;
   const v=hash(tx+307,ty+251); if(v<.38)continue;
   const x=tx*tileSize,y=ty*tileSize,cx=x+7+v*18,base=y+24;
   c.save();c.globalAlpha=.7;
   c.fillStyle="#456b42";c.beginPath();c.arc(cx-3,base-4,3.2,0,Math.PI*2);c.arc(cx+2,base-5,3.8,0,Math.PI*2);c.fill();
   c.fillStyle="#75905a";c.fillRect(cx-5,base,10,1);
   c.restore();
  }
  // Plain texture and biome seams: break up empty grass without adding collision.
  for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
   if(mapData[ty][tx]!==TILE.GRASS)continue;
   const x=tx*tileSize,y=ty*tileSize,v=hash(tx+211,ty+173);
   c.save();
   if(v>.22){
    c.globalAlpha=.13;c.strokeStyle=v>.62?"#547547":"#80945c";c.lineWidth=1;
    const ox=6+Math.floor(v*13),oy=9+Math.floor((1-v)*12);
    c.beginPath();c.moveTo(x+ox,y+oy+4);c.lineTo(x+ox+1,y+oy);c.moveTo(x+ox+1,y+oy+4);c.lineTo(x+ox+4,y+oy+1);c.stroke();
   }
   // Darker vegetation at forest/mountain feet visually blends hard tile seams.
   const solid=(dx,dy)=>tx+dx>=0&&ty+dy>=0&&tx+dx<gridCols&&ty+dy<gridRows&&
    (mapData[ty+dy][tx+dx]===TILE.FOREST||mapData[ty+dy][tx+dx]===TILE.MOUNTAIN);
   if(solid(0,-1)||solid(1,0)||solid(0,1)||solid(-1,0)){
    c.globalAlpha=.16;c.fillStyle="#557047";
    if(solid(0,-1))c.fillRect(x,y,32,4);
    if(solid(0,1))c.fillRect(x,y+28,32,4);
    if(solid(-1,0))c.fillRect(x,y,4,32);
    if(solid(1,0))c.fillRect(x+28,y,4,32);
   }
   c.restore();
  }
  // Coast dressing follows the island silhouette without changing collision.
  // Sand/grass shelves and sparse shore rocks soften the square water boundary.
  for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
   if(mapData[ty][tx]!==TILE.GRASS)continue;
   const sea=(dx,dy)=>tx+dx>=0&&ty+dy>=0&&tx+dx<gridCols&&ty+dy<gridRows&&mapData[ty+dy][tx+dx]===TILE.WATER;
   const coastal=sea(0,-1)||sea(1,0)||sea(0,1)||sea(-1,0);
   if(!coastal)continue;
   const x=tx*tileSize,y=ty*tileSize,v=hash(tx+151,ty+97);
   c.save();c.globalAlpha=.42;c.fillStyle="#c9b978";
   if(sea(0,-1))c.fillRect(x,y,32,5);
   if(sea(0,1))c.fillRect(x,y+27,32,5);
   if(sea(-1,0))c.fillRect(x,y,5,32);
   if(sea(1,0))c.fillRect(x+27,y,5,32);
   c.globalAlpha=.65;c.fillStyle="#e0d49a";
   if(v>.48){c.beginPath();c.ellipse(x+8+v*14,y+8+(1-v)*14,2.4,1.2,-.2,0,Math.PI*2);c.fill();}
   c.restore();
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
   if(target===TILE.FOREST && !artReady(fieldTiles)){
    // Fallback only: unified field chips are authoritative when loaded.
    // One forest cell = one compact field symbol. Offset canopy/base creates a quarter-view footprint.
    const v=hash(tx+83,ty+47),cx=x+16,base=y+27;
    c.save();
    c.globalAlpha=.18;c.fillStyle="#355538";c.beginPath();c.ellipse(cx+2,base+1,9,2.4,-.12,0,Math.PI*2);c.fill();c.globalAlpha=1;
    c.fillStyle="#67452d";c.fillRect(cx-1.5,base-8,3,8);
    c.fillStyle="#315a37";c.beginPath();c.arc(cx-5,base-11,5.8,0,Math.PI*2);c.arc(cx+5,base-12,5.6,0,Math.PI*2);c.arc(cx+1,base-17,7.2,0,Math.PI*2);c.fill();
    c.fillStyle="#4d7b47";c.beginPath();c.arc(cx-3,base-17,3.8,0,Math.PI*2);c.arc(cx+4,base-19,4.2,0,Math.PI*2);c.fill();
    c.fillStyle="rgba(159,184,92,.65)";c.fillRect(cx-7,base-1,14,1.4);
    c.restore();
   }else if(target===TILE.MOUNTAIN && !artReady(fieldTiles)){
    // Fallback only: do not stack procedural peaks over the 32px mountain chips.
    // Peaks overlap neighboring cells visually; logical collision remains exactly one 32px cell.
    // The staggered base makes connected cells read as a mountain range instead of stacked triangles.
    const v=hash(tx+19,ty+61),base=y+31,shift=(ty&1)?5:-3;
    c.save();
    c.fillStyle="rgba(55,76,53,.18)";c.beginPath();c.ellipse(x+17+shift,base,20,4,0,0,Math.PI*2);c.fill();
    c.fillStyle="#59645a";c.beginPath();c.moveTo(x-8+shift,base);c.lineTo(x+5+shift,base-13);c.lineTo(x+12+shift,base-9);c.lineTo(x+23+shift,base-25+v*3);c.lineTo(x+40+shift,base);c.closePath();c.fill();
    c.fillStyle="#aeb49b";c.beginPath();c.moveTo(x+23+shift,base-25+v*3);c.lineTo(x+18+shift,base-16);c.lineTo(x+23+shift,base-19);c.lineTo(x+28+shift,base-13);c.closePath();c.fill();
    c.fillStyle="#496241";c.fillRect(x-6+shift,base-3,44,3);
    c.restore();
   }
  }
  // A few signposts mark major forks while the surrounding plain stays explorable.
  for(const [x,y] of [[307,421],[589,496],[482,145]])stamp(15,x,y,10,12);
  const icons={village:8,shrine:9,cove:10,forest:11,waterfall:12,hotspring:13,fox:14};
  for(const [k,p] of Object.entries(places)){
   const [x,y]=p.point;
   // Landmark scale is intentionally independent from the 32px walking grid.
   // Settlements must read as places the hero can enter, while minor destinations stay compact.
   if(k==='village'){
    c.save();
    c.globalAlpha=.18;c.fillStyle='#45663f';c.beginPath();c.ellipse(x,y+8,46,12,-.08,0,Math.PI*2);c.fill();c.globalAlpha=1;
    stamp(icons[k],x-22,y-15,42,36);
    stamp(icons[k],x+20,y-18,40,34);
    stamp(icons[k],x-2,y+7,46,39);
    c.restore();
   }else{
    const w=k==='shrine'?42:k==='fox'?44:k==='hotspring'?38:k==='waterfall'?40:k==='forest'?36:k==='cove'?34:32;
    stamp(icons[k],x,y-w*.28,w,w*.84);
   }
  }
 }
 return {start,hub,places,roads,worldObjects,mapData,TILE,walkable,near,revision:39,tileAt,tileSize,size,viewSize,camera,draw};
})();

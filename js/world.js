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
 // Stable visual-chip IDs. Procedural drawing is temporary; these IDs are the handoff
 // contract for a future 32px map-chip sheet without changing collision or event data.
 const CHIP={GRASS_BASE:0,GRASS_DETAIL:1,
  SHORE_N:16,SHORE_E:17,SHORE_S:18,SHORE_W:19,SHORE_NE:20,SHORE_SE:21,SHORE_SW:22,SHORE_NW:23,
  SHORE_IN_NE:24,SHORE_IN_SE:25,SHORE_IN_SW:26,SHORE_IN_NW:27,
  WATER_BASE:32,BRIDGE_H:40,BRIDGE_V:41,
  FOREST_CORE:48,FOREST_N:49,FOREST_E:50,FOREST_S:51,FOREST_W:52,FOREST_NE:53,FOREST_SE:54,FOREST_SW:55,FOREST_NW:56,FOREST_SINGLE:57,
  MOUNTAIN_CORE:64,MOUNTAIN_N:65,MOUNTAIN_E:66,MOUNTAIN_S:67,MOUNTAIN_W:68,MOUNTAIN_NE:69,MOUNTAIN_SE:70,MOUNTAIN_SW:71,MOUNTAIN_NW:72,MOUNTAIN_SINGLE:73,
  ROAD_H:80,ROAD_V:81,ROAD_NE:82,ROAD_SE:83,ROAD_SW:84,ROAD_NW:85,ROAD_T_N:86,ROAD_T_E:87,ROAD_T_S:88,ROAD_T_W:89,ROAD_X:90,ROAD_END_N:91,ROAD_END_E:92,ROAD_END_S:93,ROAD_END_W:94,
  VILLAGE:96,SHRINE:97,COVE:98,
  WATERFALL:99,HOTSPRING:100,FOX:101};
 // Rasterize the existing curved route onto the 32px logic grid for future road chips.
 // Multi-cell object layer. Footprints are expressed in walking cells, while anchors keep
 // existing event coordinates intact. PNG object sheets can replace procedural landmarks later.
 const OBJECT_KIND={VILLAGE:'village',SHRINE:'shrine',COVE:'cove',FOREST_GATE:'forest',WATERFALL:'waterfall',HOTSPRING:'hotspring',FOX:'fox'};
 const objectLayer=[
  {kind:OBJECT_KIND.VILLAGE,anchor:places.village.point,footprint:[3,2],chip:CHIP.VILLAGE,z:20},
  {kind:OBJECT_KIND.SHRINE,anchor:places.shrine.point,footprint:[2,2],chip:CHIP.SHRINE,z:20},
  {kind:OBJECT_KIND.COVE,anchor:places.cove.point,footprint:[2,1],chip:CHIP.COVE,z:18},
  {kind:OBJECT_KIND.FOREST_GATE,anchor:places.forest.point,footprint:[1,1],chip:CHIP.FOREST_CORE,z:18},
  {kind:OBJECT_KIND.WATERFALL,anchor:places.waterfall.point,footprint:[2,2],chip:CHIP.WATERFALL,z:22},
  {kind:OBJECT_KIND.HOTSPRING,anchor:places.hotspring.point,footprint:[2,1],chip:CHIP.HOTSPRING,z:20},
  {kind:OBJECT_KIND.FOX,anchor:places.fox.point,footprint:[2,2],chip:CHIP.FOX,z:20}
 ];
 const objectBounds=o=>{const [w,h]=o.footprint,[x,y]=o.anchor;return {x:x-w*tileSize/2,y:y-h*tileSize/2,w:w*tileSize,h:h*tileSize};};
 // Shared depth contract for the future chip/object renderer.
 // screenY is the ground-contact point: sprites with a larger value are drawn in front.
 const depthKey=(screenY,z=0)=>screenY*100+z;
 const terrainDepth=(tx,ty,z=0)=>depthKey((ty+1)*tileSize,z);
 const objectDepth=o=>{const b=objectBounds(o);return depthKey(b.y+b.h,o.z||0);};
 const sortByDepth=items=>items.slice().sort((a,b)=>(a.depth||0)-(b.depth||0));
 const makeDepthQueue=hero=>{
  const q=[];
  // Multi-cell landmarks use their bottom edge as the ground-contact baseline.
  for(const o of objectLayer)q.push({type:'object',ref:o,depth:objectDepth(o)});
  // Hero uses feet/ground position; future tree and mountain overlay chips use the same rule.
  if(hero)q.push({type:'hero',ref:hero,depth:depthKey(hero.y,50)});
  return sortByDepth(q);
 };
 const roadCells=new Set();
 const markRoad=(x,y)=>{const tx=Math.floor(x/tileSize),ty=Math.floor(y/tileSize);if(tx>=0&&ty>=0&&tx<gridCols&&ty<gridRows)roadCells.add(tx+','+ty);};
 for(const route of roads)for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],len=Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1])),steps=Math.ceil(len/8);
  for(let j=0;j<=steps;j++){const q=j/steps;markRoad(a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q);}
 }
 const roadChipAt=(tx,ty)=>{
  if(!roadCells.has(tx+','+ty))return null;
  const has=(dx,dy)=>roadCells.has((tx+dx)+','+(ty+dy));
  const n=has(0,-1),e=has(1,0),so=has(0,1),w=has(-1,0),count=+n+ +e+ +so+ +w;
  if(count>=4)return CHIP.ROAD_X;
  if(count===3){if(!n)return CHIP.ROAD_T_N;if(!e)return CHIP.ROAD_T_E;if(!so)return CHIP.ROAD_T_S;return CHIP.ROAD_T_W;}
  if(n&&e)return CHIP.ROAD_NE;if(e&&so)return CHIP.ROAD_SE;if(so&&w)return CHIP.ROAD_SW;if(w&&n)return CHIP.ROAD_NW;
  if(e&&w)return CHIP.ROAD_H;if(n&&so)return CHIP.ROAD_V;
  if(n)return CHIP.ROAD_END_N;if(e)return CHIP.ROAD_END_E;if(so)return CHIP.ROAD_END_S;if(w)return CHIP.ROAD_END_W;
  return CHIP.ROAD_H;
 };
 const visualChipAt=(tx,ty)=>{
  if(tx<0||ty<0||tx>=gridCols||ty>=gridRows)return CHIP.WATER_BASE;
  const t=mapData[ty][tx];
  if(t===TILE.WATER)return CHIP.WATER_BASE;
  if(t===TILE.BRIDGE){const vw=(ty>0&&mapData[ty-1][tx]===TILE.WATER)||(ty+1<gridRows&&mapData[ty+1][tx]===TILE.WATER);return vw?CHIP.BRIDGE_H:CHIP.BRIDGE_V;}
  const connectedChip=(target,base)=>{
   const same=(dx,dy)=>tx+dx>=0&&ty+dy>=0&&tx+dx<gridCols&&ty+dy<gridRows&&mapData[ty+dy][tx+dx]===target;
   const n=same(0,-1),e=same(1,0),so=same(0,1),we=same(-1,0),count=+n+ +e+ +so+ +we;
   if(count===0)return base.SINGLE;
   if(!n&&!e)return base.NE;if(!e&&!so)return base.SE;if(!so&&!we)return base.SW;if(!we&&!n)return base.NW;
   if(!n)return base.N;if(!e)return base.E;if(!so)return base.S;if(!we)return base.W;
   return base.CORE;
  };
  if(t===TILE.FOREST)return connectedChip(TILE.FOREST,{CORE:CHIP.FOREST_CORE,N:CHIP.FOREST_N,E:CHIP.FOREST_E,S:CHIP.FOREST_S,W:CHIP.FOREST_W,NE:CHIP.FOREST_NE,SE:CHIP.FOREST_SE,SW:CHIP.FOREST_SW,NW:CHIP.FOREST_NW,SINGLE:CHIP.FOREST_SINGLE});
  if(t===TILE.MOUNTAIN)return connectedChip(TILE.MOUNTAIN,{CORE:CHIP.MOUNTAIN_CORE,N:CHIP.MOUNTAIN_N,E:CHIP.MOUNTAIN_E,S:CHIP.MOUNTAIN_S,W:CHIP.MOUNTAIN_W,NE:CHIP.MOUNTAIN_NE,SE:CHIP.MOUNTAIN_SE,SW:CHIP.MOUNTAIN_SW,NW:CHIP.MOUNTAIN_NW,SINGLE:CHIP.MOUNTAIN_SINGLE});
  if(t===TILE.GRASS){
   const w=(dx,dy)=>tx+dx<0||ty+dy<0||tx+dx>=gridCols||ty+dy>=gridRows||mapData[ty+dy][tx+dx]===TILE.WATER;
   const n=w(0,-1),e=w(1,0),so=w(0,1),we=w(-1,0);
   // outer corners first; a future chip sheet can map these IDs directly.
   if(n&&e)return CHIP.SHORE_NE;if(e&&so)return CHIP.SHORE_SE;if(so&&we)return CHIP.SHORE_SW;if(we&&n)return CHIP.SHORE_NW;
   if(n)return CHIP.SHORE_N;if(e)return CHIP.SHORE_E;if(so)return CHIP.SHORE_S;if(we)return CHIP.SHORE_W;
   // inner coves: cardinal land with a diagonal water notch.
   if(w(1,-1))return CHIP.SHORE_IN_NE;if(w(1,1))return CHIP.SHORE_IN_SE;
   if(w(-1,1))return CHIP.SHORE_IN_SW;if(w(-1,-1))return CHIP.SHORE_IN_NW;
  }
  return CHIP.GRASS_BASE;
 };
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
  // Journey-shaped island: mountain chains frame the route, but passes remain open.
  // Rivers descend through the central lowland to the southern bay; coasts stay ocean-closed.
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
 // Production quarter-view map-chip specification.
 // Ground chips are 32x32. Overlay chips share a 32px ground footprint but may overhang upward.
 const MAP_CHIP_SPEC={
  version:1,cell:32,
  ground:{grass:[32,32],water:[32,32],shore:[32,32],road:[32,32],bridge:[32,32]},
  overlay:{
   forest:{frame:[64,64],foot:[32,32],origin:[32,48]},
   mountain:{frame:[96,96],foot:[32,32],origin:[48,80]},
   village:{frame:[96,96],foot:[96,64],origin:[48,80]},
   shrine:{frame:[64,80],foot:[64,64],origin:[32,64]},
   waterfall:{frame:[64,96],foot:[64,64],origin:[32,80]},
   hotspring:{frame:[64,48],foot:[64,32],origin:[32,32]},
   fox:{frame:[64,80],foot:[64,64],origin:[32,64]}
  }
 };
 const MAP_CHIP_PATHS={
  ground:"assets/terrain/world-ground-qv-32.png",
  shore:"assets/terrain/world-shore-qv-32.png",
  road:"assets/terrain/world-road-qv-32.png",
  forest:"assets/terrain/world-forest-qv.png",
  mountain:"assets/terrain/world-mountain-qv.png",
  landmarks:"assets/terrain/world-landmarks-qv.png"
 };
 // Production atlas contract. All source rectangles are integer pixels and all anchors
 // land on the 32px logic grid; art is free to overhang its footprint.
 const MAP_CHIP_ATLAS={
  ground:{tile:[32,32],cols:8,rows:4,slots:{
   grass:0,grassDetail:1,water:8,waterDetail:9,bridgeH:16,bridgeV:17
  }},
  shore:{tile:[32,32],cols:4,rows:4,slots:{
   n:0,e:1,s:2,w:3,ne:4,se:5,sw:6,nw:7,inNE:8,inSE:9,inSW:10,inNW:11
  }},
  road:{tile:[32,32],cols:4,rows:4,slots:{
   h:0,v:1,ne:2,se:3,sw:4,nw:5,tN:6,tE:7,tS:8,tW:9,x:10,endN:11,endE:12,endS:13,endW:14
  }},
  forest:{tile:[64,64],cols:4,rows:3,anchor:[32,48]},
  mountain:{tile:[96,96],cols:4,rows:3,anchor:[48,80]},
  landmarks:{tile:[96,96],cols:4,rows:2,anchor:[48,80]}
 };
 const chipRect=(atlas,slot)=>{
  const [w,h]=atlas.tile,cols=atlas.cols;
  return [(slot%cols)*w,Math.floor(slot/cols)*h,w,h];
 };
 const chipPlacement=(atlas,slot,footX,footY)=>{
  const [sx,sy,sw,sh]=chipRect(atlas,slot),a=atlas.anchor||[0,0];
  return {sx,sy,sw,sh,dx:footX-a[0],dy:footY-a[1],dw:sw,dh:sh};
 };
 const MAP_CHIP_ART={};
 const loadMapChipArt=()=>{
  for(const [key,src] of Object.entries(MAP_CHIP_PATHS)){
   const im=new Image();
   im.onload=()=>{window.__YK_MAPCHIP_REV=(window.__YK_MAPCHIP_REV||0)+1;};
   im.onerror=()=>{MAP_CHIP_ART[key]=null;};
   im.src=src;MAP_CHIP_ART[key]=im;
  }
 };
 loadMapChipArt();
 const mapChipReady=key=>{const im=MAP_CHIP_ART[key];return !!(im&&im.complete&&im.naturalWidth);};
 const drawMapChip=(c,key,atlas,slot,footX,footY)=>{
  const im=MAP_CHIP_ART[key];if(!mapChipReady(key))return false;
  const p=chipPlacement(atlas,slot,footX,footY);
  c.drawImage(im,p.sx,p.sy,p.sw,p.sh,p.dx,p.dy,p.dw,p.dh);return true;
 };
 const CHIP_TO_ATLAS={
  [CHIP.GRASS_BASE]:['ground',MAP_CHIP_ATLAS.ground,MAP_CHIP_ATLAS.ground.slots.grass],
  [CHIP.GRASS_DETAIL]:['ground',MAP_CHIP_ATLAS.ground,MAP_CHIP_ATLAS.ground.slots.grassDetail],
  [CHIP.WATER_BASE]:['ground',MAP_CHIP_ATLAS.ground,MAP_CHIP_ATLAS.ground.slots.water],
  [CHIP.BRIDGE_H]:['ground',MAP_CHIP_ATLAS.ground,MAP_CHIP_ATLAS.ground.slots.bridgeH],
  [CHIP.BRIDGE_V]:['ground',MAP_CHIP_ATLAS.ground,MAP_CHIP_ATLAS.ground.slots.bridgeV],
  [CHIP.SHORE_N]:['shore',MAP_CHIP_ATLAS.shore,0],[CHIP.SHORE_E]:['shore',MAP_CHIP_ATLAS.shore,1],
  [CHIP.SHORE_S]:['shore',MAP_CHIP_ATLAS.shore,2],[CHIP.SHORE_W]:['shore',MAP_CHIP_ATLAS.shore,3],
  [CHIP.SHORE_NE]:['shore',MAP_CHIP_ATLAS.shore,4],[CHIP.SHORE_SE]:['shore',MAP_CHIP_ATLAS.shore,5],
  [CHIP.SHORE_SW]:['shore',MAP_CHIP_ATLAS.shore,6],[CHIP.SHORE_NW]:['shore',MAP_CHIP_ATLAS.shore,7],
  [CHIP.SHORE_IN_NE]:['shore',MAP_CHIP_ATLAS.shore,8],[CHIP.SHORE_IN_SE]:['shore',MAP_CHIP_ATLAS.shore,9],
  [CHIP.SHORE_IN_SW]:['shore',MAP_CHIP_ATLAS.shore,10],[CHIP.SHORE_IN_NW]:['shore',MAP_CHIP_ATLAS.shore,11]
 };
 const drawProductionBaseChip=(c,tx,ty)=>{
  const id=visualChipAt(tx,ty),terrain=mapData[ty]?.[tx];
  // Forest/mountain sprites are overhang overlays; their 32px footprint still needs grass below.
  if(terrain===TILE.FOREST||terrain===TILE.MOUNTAIN){const grass=CHIP_TO_ATLAS[CHIP.GRASS_BASE];return drawMapChip(c,grass[0],grass[1],grass[2],tx*tileSize,ty*tileSize);}
  // Shore art is an overlay: lay grass first, then the directional shore sprite when available.
  if(id>=CHIP.SHORE_N&&id<=CHIP.SHORE_IN_NW){
   const grass=CHIP_TO_ATLAS[CHIP.GRASS_BASE],shore=CHIP_TO_ATLAS[id];
   const ok=drawMapChip(c,grass[0],grass[1],grass[2],tx*tileSize,ty*tileSize);
   if(ok&&shore)drawMapChip(c,shore[0],shore[1],shore[2],tx*tileSize,ty*tileSize);
   return ok;
  }
  const def=CHIP_TO_ATLAS[id];if(!def)return false;
  return drawMapChip(c,def[0],def[1],def[2],tx*tileSize,ty*tileSize);
 };
 const ROAD_TO_SLOT={
  [CHIP.ROAD_H]:0,[CHIP.ROAD_V]:1,[CHIP.ROAD_NE]:2,[CHIP.ROAD_SE]:3,[CHIP.ROAD_SW]:4,[CHIP.ROAD_NW]:5,
  [CHIP.ROAD_T_N]:6,[CHIP.ROAD_T_E]:7,[CHIP.ROAD_T_S]:8,[CHIP.ROAD_T_W]:9,[CHIP.ROAD_X]:10,
  [CHIP.ROAD_END_N]:11,[CHIP.ROAD_END_E]:12,[CHIP.ROAD_END_S]:13,[CHIP.ROAD_END_W]:14
 };
 const drawProductionRoadChip=(c,tx,ty)=>{
  if(!mapChipReady('road'))return false;
  const id=roadChipAt(tx,ty),slot=ROAD_TO_SLOT[id];if(slot==null)return false;
  return drawMapChip(c,'road',MAP_CHIP_ATLAS.road,slot,tx*tileSize,ty*tileSize);
 };
 const overlayVariantSlot=(id,base)=>Math.max(0,Math.min(11,id-base));
 const terrainVariant=(tx,ty,count)=>Math.abs((tx*5+ty*7+(hash(tx+37,ty+61)*count|0)))%count;
 const drawProductionOverlayChip=(c,tx,ty)=>{
  const id=visualChipAt(tx,ty),footX=tx*tileSize+tileSize/2,footY=(ty+1)*tileSize;
  if(id>=CHIP.FOREST_CORE&&id<=CHIP.FOREST_SINGLE&&mapChipReady('forest'))
   return drawMapChip(c,'forest',MAP_CHIP_ATLAS.forest,(overlayVariantSlot(id,CHIP.FOREST_CORE)+terrainVariant(tx,ty,3)*4)%12,footX,footY);
  if(id>=CHIP.MOUNTAIN_CORE&&id<=CHIP.MOUNTAIN_SINGLE&&mapChipReady('mountain'))
   return drawMapChip(c,'mountain',MAP_CHIP_ATLAS.mountain,(overlayVariantSlot(id,CHIP.MOUNTAIN_CORE)+terrainVariant(tx,ty,3)*4)%12,footX,footY);
  return false;
 };
 const LANDMARK_SLOT={village:0,shrine:1,cove:2,forest:3,waterfall:4,hotspring:5,fox:6};
 const LANDMARK_SCALE={village:1.18,shrine:1.06,cove:.92,forest:.92,waterfall:1.12,hotspring:.94,fox:1.05};
 const drawProductionLandmark=(c,o)=>{
  if(!mapChipReady('landmarks'))return false;
  const slot=LANDMARK_SLOT[o.kind];if(slot==null)return false;
  const b=objectBounds(o),footX=b.x+b.w/2,footY=b.y+b.h,scale=LANDMARK_SCALE[o.kind]||1;
  const im=MAP_CHIP_ART.landmarks,p=chipPlacement(MAP_CHIP_ATLAS.landmarks,slot,footX,footY);
  const dw=p.dw*scale,dh=p.dh*scale,dx=footX-(MAP_CHIP_ATLAS.landmarks.anchor[0]*scale),dy=footY-(MAP_CHIP_ATLAS.landmarks.anchor[1]*scale);
  c.drawImage(im,p.sx,p.sy,p.sw,p.sh,dx,dy,dw,dh);return true;
 };
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
   // Production map-chip handoff: once the exact atlas PNG exists, use it for the base cell.
   // Until then this returns false and the legacy safe renderer remains untouched.
   const productionBase=drawProductionBaseChip(c,tx,ty);
   // Road is rendered in a dedicated pass after the base terrain so grass cannot paint over it.
   // The road atlas is a transparent overlay and is intentionally independent of the base atlas.
   // Unified 32px field tileset migration: grass now comes from explicit image chips.
   // Water shoreline remains on the proven autotile sheet until its shore IDs are migrated.
   // iOS-safe mode: when the landmark atlas is intentionally omitted, also force the
   // procedural terrain fallback. This avoids mixing asynchronous image tiles into direct rendering.
   const fieldTiles=ready?TERRAIN_ART.fieldTiles:null;
   if(!productionBase&&!water&&!bridge&&!artReady(fieldTiles)){
    c.fillStyle="#91b85a";c.fillRect(x,y,32.5,32.5);
   }
   if(!productionBase&&!water&&!bridge&&artReady(fieldTiles)){
    const grassIndex=(tx*5+ty*3+(hash(tx+71,ty+29)*8|0))&7;
    c.drawImage(fieldTiles,grassIndex*32,0,32,32,x,y,32,32);
   }
   // Mountain and forest are now selected from the same 32px field sheet by N/E/S/W adjacency.
   // Logical tile IDs and collision remain unchanged.
   if((t==='mountain'||t==='forest')&&artReady(fieldTiles)&&!mapChipReady(t)){
    const target=t==='mountain'?TILE.MOUNTAIN:TILE.FOREST;
    const same=(gx,gy)=>gx>=0&&gy>=0&&gx<gridCols&&gy<gridRows&&mapData[gy][gx]===target;
    const mask=(same(tx,ty-1)?1:0)|(same(tx+1,ty)?2:0)|(same(tx,ty+1)?4:0)|(same(tx-1,ty)?8:0);
    const row=t==='mountain'?2:4;
    c.drawImage(fieldTiles,(mask&15)*32,row*32,32,32,x,y,32,32);
   }
   if(water&&!productionBase){
    if(!ready){c.fillStyle='#397b87';c.fillRect(x,y,tileSize+.75,tileSize+.75);}
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
     c.fillStyle='#2f7180';c.fillRect(x,y,tileSize+.5,tileSize+.5);
     // broken shallow-water highlights hide the logical cell cadence
     c.globalAlpha=.18;c.fillStyle='#74b4ae';
     c.beginPath();c.ellipse(x+16+(v-.5)*9,y+15,13,4,(v-.5)*.35,0,Math.PI*2);c.fill();c.globalAlpha=1;
    }
   }else if(bridge&&!productionBase){
    c.fillStyle='#2f7180';c.fillRect(x,y,tileSize,tileSize);
   }
   else if(!artReady(fieldTiles)){
    // base grass was already painted with a half-pixel overlap above; do not repaint exact 32px cells.
   }
   if(water&&!productionBase){
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
   }else if(bridge&&!productionBase){
    c.fillStyle='#674a30';c.fillRect(x,y,8,8);c.fillStyle='#c2a16a';for(let n=0;n<8;n+=2)c.fillRect(x,y+n,8,1.5);
    c.fillStyle='#765739';if(tileAt(x+4,y-4)!=='bridge')c.fillRect(x,y,8,.75);if(tileAt(x+4,y+12)!=='bridge')c.fillRect(x,y+7.25,8,.75);
   }else if(!productionBase){
    // Irregular tufts, dry grass and tiny flowers give the plain material variation.
    if(v>.90){c.fillStyle='#7fa846';c.fillRect(x+1+v*4,y+3,1,.7);}
    if(v>.965){c.strokeStyle='rgba(93,130,61,.48)';c.lineWidth=.55;c.beginPath();c.moveTo(x+2,y+6);c.lineTo(x+3,y+3);c.moveTo(x+4,y+6);c.lineTo(x+5,y+2.5);c.stroke();}
    if(t==='grass'&&v>.992){c.fillStyle='#f0dfbd';c.beginPath();c.arc(x+3,y+3.5,.7,0,Math.PI*2);c.fill();}
   }
  }
  // Production road overlay: one logical walking cell remains 32px.
  if(mapChipReady('road')){
   for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++)drawProductionRoadChip(c,tx,ty);
  }
  // Procedural coastline skirt: curves are painted from land into neighboring water.
  // Collision remains square, but the visible coast is no longer a staircase.
  if(!ready){
   for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
    if(mapData[ty][tx]!==TILE.GRASS)continue;
    const x=tx*tileSize,y=ty*tileSize;
    const dirs=[[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]];
    for(const [dx,dy,side] of dirs){
     if(mapData[ty+dy][tx+dx]!==TILE.WATER)continue;
     const q=hash(tx*37+dx+91,ty*41+dy+53),d=5+q*5;
     c.save();c.globalAlpha=.82;c.fillStyle='#c7b66f';c.beginPath();
     if(side===0){c.moveTo(x-2,y+2);c.quadraticCurveTo(x+8,y+d,x+16,y+2);c.quadraticCurveTo(x+25,y-d*.3,x+34,y+3);c.lineTo(x+34,y-3);c.lineTo(x-2,y-3);}
     if(side===2){c.moveTo(x-2,y+30);c.quadraticCurveTo(x+8,y+32-d,x+16,y+30);c.quadraticCurveTo(x+25,y+34+d*.3,x+34,y+29);c.lineTo(x+34,y+35);c.lineTo(x-2,y+35);}
     if(side===3){c.moveTo(x+2,y-2);c.quadraticCurveTo(x+d,y+8,x+2,y+16);c.quadraticCurveTo(x-d*.3,y+25,x+3,y+34);c.lineTo(x-3,y+34);c.lineTo(x-3,y-2);}
     if(side===1){c.moveTo(x+30,y-2);c.quadraticCurveTo(x+32-d,y+8,x+30,y+16);c.quadraticCurveTo(x+34+d*.3,y+25,x+29,y+34);c.lineTo(x+35,y+34);c.lineTo(x+35,y-2);}
     c.closePath();c.fill();c.restore();
    }
   }
  }
  // Organic shore caps bridge diagonal joins between 32px collision cells.
  if(!ready){
   for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
    if(mapData[ty][tx]!==TILE.GRASS)continue;
    const x=tx*tileSize,y=ty*tileSize,q=hash(tx+1201,ty+1229);
    const corner=(dx,dy,cx,cy)=>{
     if(mapData[ty+dy][tx+dx]!==TILE.WATER)return;
     c.save();c.globalAlpha=.66;c.fillStyle='#c7b66f';c.beginPath();
     c.ellipse(x+cx+(q-.5)*3,y+cy+(q-.5)*2,7+q*3,5+q*2,(q-.5)*.4,0,Math.PI*2);c.fill();c.restore();
    };
    if(mapData[ty-1][tx]===TILE.WATER&&mapData[ty][tx-1]===TILE.WATER)corner(-1,-1,1,1);
    if(mapData[ty-1][tx]===TILE.WATER&&mapData[ty][tx+1]===TILE.WATER)corner(1,-1,31,1);
    if(mapData[ty+1][tx]===TILE.WATER&&mapData[ty][tx-1]===TILE.WATER)corner(-1,1,1,31);
    if(mapData[ty+1][tx]===TILE.WATER&&mapData[ty][tx+1]===TILE.WATER)corner(1,1,31,31);
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
  // Quarter-view mountain ranges. One logical mountain cell is still one blocked step,
  // but visible peaks overlap neighboring cells so the range reads as a landform, not icons.
  if(!ready&&!mapChipReady('mountain')){
   for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
    if(mapData[ty][tx]!==TILE.MOUNTAIN)continue;
    const x=tx*tileSize,y=ty*tileSize,v=hash(tx+811,ty+773);
    const north=ty>0&&mapData[ty-1][tx]===TILE.MOUNTAIN;
    const south=ty+1<gridRows&&mapData[ty+1][tx]===TILE.MOUNTAIN;
    const west=tx>0&&mapData[ty][tx-1]===TILE.MOUNTAIN;
    const east=tx+1<gridCols&&mapData[ty][tx+1]===TILE.MOUNTAIN;
    const cx=x+16+(v-.5)*5,base=y+31,h=22+(north?6:0)+v*5,w=17+(west||east?4:0);
    c.save();
    c.globalAlpha=.22;c.fillStyle='#435443';c.beginPath();c.ellipse(cx+4,base+2,w*.86,3.2,-.08,0,Math.PI*2);c.fill();
    c.globalAlpha=.96;c.fillStyle='#737965';c.beginPath();c.moveTo(cx-w,base);c.lineTo(cx-5,base-h*.62);c.lineTo(cx,base-h);c.lineTo(cx+6,base-h*.58);c.lineTo(cx+w,base);c.closePath();c.fill();
    c.fillStyle='#8f9479';c.beginPath();c.moveTo(cx,base-h);c.lineTo(cx+6,base-h*.58);c.lineTo(cx+2,base-5);c.lineTo(cx-3,base-9);c.closePath();c.fill();
    c.fillStyle='#596454';c.beginPath();c.moveTo(cx-w,base);c.lineTo(cx-5,base-h*.62);c.lineTo(cx-3,base-9);c.lineTo(cx-9,base-3);c.closePath();c.fill();
    if(!south){c.globalAlpha=.7;c.fillStyle='#4f6947';c.beginPath();c.ellipse(cx,base,Math.max(9,w-3),2.3,0,0,Math.PI*2);c.fill();}
    c.restore();
   }
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
  // Quarter-view forest: several small trees per logical cell form one continuous canopy.
  // The 32px FOREST grid remains collision-only; visible trunks/crowns deliberately cross its seams.
  if(!mapChipReady('forest')) for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
   if(mapData[ty][tx]!==TILE.FOREST)continue;
   const edge=![[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>tx+dx>=0&&ty+dy>=0&&tx+dx<gridCols&&ty+dy<gridRows&&mapData[ty+dy][tx+dx]===TILE.FOREST);
   const seed=hash(tx+733,ty+691),x=tx*tileSize,y=ty*tileSize;
   const trees=[
    [5+(seed*8|0),29,.88],[18+(seed*5|0),27,.82],[11,19+(seed*4|0),.76],
    [27,18+(seed*7|0),.70],[1+(seed*4|0),20+(seed*6|0),.68],[21,12+(seed*5|0),.62]
   ];
   c.save();
   // Forest floor is broad and translucent, so adjacent cells merge rather than read as squares.
   c.globalAlpha=edge?.07:.16;c.fillStyle='#315d39';c.beginPath();
   c.ellipse(x+14+(seed-.5)*9,y+23+(seed-.5)*4,edge?13+seed*5:18+seed*4,edge?5+seed*3:7+seed*3,(seed-.5)*.38,0,Math.PI*2);c.fill();
   c.restore();
   for(const [ox,baseOff,sc] of trees){
    if(edge&&hash(tx*19+ox,ty*23+baseOff)<.30)continue;
    const cx=x+ox+(seed-.5)*3,base=y+baseOff;
    c.save();c.globalAlpha=edge?.82:.94;
    c.fillStyle='rgba(42,65,38,.24)';c.beginPath();c.ellipse(cx+1,base+1,5.8*sc,1.7*sc,-.12,0,Math.PI*2);c.fill();
    c.fillStyle='#68472f';c.fillRect(cx-.75*sc,base-5.2*sc,1.5*sc,5.5*sc);
    c.fillStyle='#315d39';c.beginPath();
    c.arc(cx-3.2*sc,base-7.5*sc,3.8*sc,0,Math.PI*2);
    c.arc(cx+2.6*sc,base-8.7*sc,4.3*sc,0,Math.PI*2);
    c.arc(cx,base-12.3*sc,4.6*sc,0,Math.PI*2);c.fill();
    c.fillStyle='#4b7a47';c.beginPath();c.arc(cx-1.2*sc,base-12.8*sc,2.1*sc,0,Math.PI*2);c.fill();
    c.restore();
   }
  }
  // Offshore rock clusters give the sea depth without changing collision.
  for(const [rx,ry,s] of [[46,456,1],[84,445,.8],[525,678,.9],[565,645,.65],[702,505,.75],[735,544,.55]]){
   if(tileAt(rx,ry)!=='water')continue;
   c.fillStyle='#596b62';c.beginPath();c.moveTo(rx-6*s,ry+4*s);c.lineTo(rx-2*s,ry-7*s);c.lineTo(rx+2*s,ry-3*s);c.lineTo(rx+6*s,ry+4*s);c.closePath();c.fill();
   c.strokeStyle='rgba(232,241,211,.72)';c.lineWidth=1;c.beginPath();c.arc(rx,ry+4*s,8*s,Math.PI*.08,Math.PI*.92);c.stroke();
  }
  // Sparse meadow fallback.
  if(!mapChipReady('ground')) for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
   if(mapData[ty][tx]!==TILE.GRASS)continue;
   const v=hash(tx+503,ty+419); if(v<.73)continue;
   const x=tx*tileSize,y=ty*tileSize,ox=6+v*17,oy=18+(1-v)*7;
   c.save();c.globalAlpha=.28;c.fillStyle="#6f8c4f";
   c.beginPath();c.ellipse(x+ox,y+oy,5.5,1.8,-.15,0,Math.PI*2);c.fill();
   c.globalAlpha=.34;c.strokeStyle="#567642";c.lineWidth=.8;
   c.beginPath();c.moveTo(x+ox-2,y+oy);c.lineTo(x+ox-1,y+oy-4);c.moveTo(x+ox+2,y+oy);c.lineTo(x+ox+4,y+oy-3);c.stroke();
   c.restore();
  }
  // Mountain foothill fallback.
  if(!mapChipReady('mountain')) for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
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
  // Forest fringe fallback.
  if(!mapChipReady('forest')) for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
   if(mapData[ty][tx]!==TILE.GRASS)continue;
   let touchesForest=false;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(mapData[ty+dy][tx+dx]===TILE.FOREST)touchesForest=true;
   if(!touchesForest)continue;
   const v=hash(tx+617,ty+557); if(v<.34)continue;
   const x=tx*tileSize+(v>.67?5:27),y=ty*tileSize+15+v*14;
   c.save();c.globalAlpha=.48;c.fillStyle='#416d43';
   c.beginPath();c.arc(x-3,y,2.6,0,Math.PI*2);c.arc(x+2,y-2,3.4,0,Math.PI*2);c.arc(x+5,y+1,2.3,0,Math.PI*2);c.fill();
   c.fillStyle='rgba(67,91,48,.34)';c.beginPath();c.ellipse(x,y+3,7,1.2,-.12,0,Math.PI*2);c.fill();c.restore();
  }
  // Inland transition fallback.
  if(!mapChipReady('forest')) for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
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
  // Broad meadow tones span several cells so the field reads as continuous ground.
  if(!ready){
   for(const [mx,my,rx,ry,a] of [[350,560,72,23,-.10],[455,475,58,20,.14],[275,335,64,18,-.18],[530,225,55,17,.10],[165,455,48,16,.08]]){
    if(tileAt(mx,my)!=='grass')continue;
    c.save();c.globalAlpha=.055;c.fillStyle='#486f43';c.beginPath();c.ellipse(mx,my,rx,ry,a,0,Math.PI*2);c.fill();c.restore();
   }
  }
  // Landscape composition pass: frame the progression corridor with low non-colliding
  // foothills and grove shadows. This changes visual geography only; mapData remains authoritative.
  const scenicRidges=[[118,307,34,10,-.18],[279,238,42,11,.12],[382,319,38,10,.08],[505,285,32,9,-.12],[566,371,28,8,.16],[246,661,35,9,.10]];
  for(const [x,y,rx,ry,rot] of scenicRidges){
   if(tileAt(x,y)!=='grass')continue;
   c.save();c.globalAlpha=.18;c.fillStyle='#596b4c';c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);c.fill();
   c.globalAlpha=.25;c.fillStyle='#74805d';c.beginPath();c.moveTo(x-rx*.55,y+2);c.lineTo(x-rx*.12,y-ry*.9);c.lineTo(x+rx*.12,y-ry*.35);c.lineTo(x+rx*.55,y+2);c.closePath();c.fill();c.restore();
  }
  const groveShadows=[[548,431,22,8],[604,398,26,9],[681,361,20,8],[309,188,24,8],[224,171,20,7]];
  for(const [x,y,rx,ry] of groveShadows){
   if(tileAt(x,y)!=='grass')continue;
   c.save();c.globalAlpha=.16;c.fillStyle='#315d39';c.beginPath();c.ellipse(x,y,rx,ry,-.12,0,Math.PI*2);c.fill();c.restore();
  }
  // River/bridge dressing: make crossings read as part of the route instead of isolated cells.
  // Logical WATER/BRIDGE collision is unchanged.
  for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
   if(mapData[ty][tx]!==TILE.BRIDGE)continue;
   const x=tx*tileSize,y=ty*tileSize;
   const verticalWater=mapData[ty-1][tx]===TILE.WATER||mapData[ty+1][tx]===TILE.WATER;
   c.save();
   // shallow banks beneath the bridge soften the square water contact
   c.globalAlpha=.38;c.fillStyle='#c4b170';c.beginPath();c.ellipse(x+16,y+16,verticalWater?20:9,verticalWater?8:20,0,0,Math.PI*2);c.fill();
   c.globalAlpha=1;c.fillStyle='#7b5938';
   if(verticalWater){
    c.fillRect(x-3,y+8,38,16);c.fillStyle='#c29b61';
    for(let xx=x-1;xx<x+35;xx+=6)c.fillRect(xx,y+9,4,14);
    c.strokeStyle='#65462f';c.lineWidth=1.5;c.beginPath();c.moveTo(x-3,y+8);c.lineTo(x+35,y+8);c.moveTo(x-3,y+24);c.lineTo(x+35,y+24);c.stroke();
   }else{
    c.fillRect(x+8,y-3,16,38);c.fillStyle='#c29b61';
    for(let yy=y-1;yy<y+35;yy+=6)c.fillRect(x+9,yy,14,4);
    c.strokeStyle='#65462f';c.lineWidth=1.5;c.beginPath();c.moveTo(x+8,y-3);c.lineTo(x+8,y+35);c.moveTo(x+24,y-3);c.lineTo(x+24,y+35);c.stroke();
   }
   c.restore();
  }
  // Add a broken foam line where grass meets sea; this visually connects curved shore segments.
  if(!ready){
   c.save();c.strokeStyle='rgba(226,236,205,.55)';c.lineWidth=1.2;c.lineCap='round';
   for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
    if(mapData[ty][tx]!==TILE.GRASS)continue;
    const x=tx*tileSize,y=ty*tileSize,v=hash(tx+977,ty+929);
    if(mapData[ty][tx+1]===TILE.WATER){c.beginPath();c.moveTo(x+31,y+5+v*7);c.quadraticCurveTo(x+34,y+16,x+31,y+27-v*5);c.stroke();}
    if(mapData[ty+1][tx]===TILE.WATER){c.beginPath();c.moveTo(x+5+v*7,y+31);c.quadraticCurveTo(x+16,y+34,x+27-v*5,y+31);c.stroke();}
   }
   c.restore();
  }
  // Roads are painted in world space at roughly one-third of a walking cell.
  // Their bends follow the progression route while keeping open grass explorable.
  if(!mapChipReady('road')){c.save();c.lineCap='round';c.lineJoin='round';
  for(let ri=0;ri<roads.length;ri++){
   const r=roads[ri]; if(r.length<2)continue;
   c.globalAlpha=.22;c.strokeStyle='#776a43';c.lineWidth=11;
   c.beginPath();c.moveTo(r[0][0],r[0][1]);
   for(let i=1;i<r.length;i++){const p=r[i-1],q=r[i],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;c.quadraticCurveTo(p[0],p[1],mx,my)}
   const last=r[r.length-1];c.lineTo(last[0],last[1]);c.stroke();
   c.globalAlpha=.72;c.strokeStyle=ri===5?'#a48b58':'#b5a064';c.lineWidth=6.5;
   c.beginPath();c.moveTo(r[0][0],r[0][1]);
   for(let i=1;i<r.length;i++){const p=r[i-1],q=r[i],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;c.quadraticCurveTo(p[0],p[1],mx,my)}
   c.lineTo(last[0],last[1]);c.stroke();
  }
  c.restore();}
  // Legacy micro-decoration is fallback-only once production ground is available.
  if(!mapChipReady('ground')) for(const [rx,ry] of [[270,451],[341,470],[401,571],[551,548],[620,465],[648,347],[556,181],[352,143]]){
   if(tileAt(rx,ry)!=='grass')continue;
   c.save();c.globalAlpha=.45;c.fillStyle='#80765d';c.beginPath();c.ellipse(rx,ry,2.4,1.4,-.2,0,Math.PI*2);c.fill();c.restore();
  }
  // Plain texture fallback.
  if(!mapChipReady('ground')) for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){
   if(mapData[ty][tx]!==TILE.GRASS)continue;
   const x=tx*tileSize,y=ty*tileSize,v=hash(tx+211,ty+173);
   c.save();
   if(v>.22){
    c.globalAlpha=.13;c.strokeStyle=v>.62?"#547547":"#80945c";c.lineWidth=1;
    const ox=6+Math.floor(v*13),oy=9+Math.floor((1-v)*12);
    c.beginPath();c.moveTo(x+ox,y+oy+4);c.lineTo(x+ox+1,y+oy);c.moveTo(x+ox+1,y+oy+4);c.lineTo(x+ox+4,y+oy+1);c.stroke();
   }
   // Collision seams stay invisible; vegetation/foothills cross them in separate passes.
   c.restore();
  }
  // Coastline is painted by the curved shoreline pass above; avoid a second square-edged shelf.
  // Organic terrain transition belt. These are visual overlays only; the 32px collision map stays authoritative.
  // Sparse shrubs/rocks bridge grass into forest and mountain so biome borders do not expose square cells.
  if(!ready){
   for(let ty=1;ty<gridRows-1;ty++)for(let tx=1;tx<gridCols-1;tx++){
    if(mapData[ty][tx]!==TILE.GRASS)continue;
    const x=tx*tileSize,y=ty*tileSize,v=hash(tx+1409,ty+1423);
    let nf=false,nm=false;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
     nf ||= mapData[ty+dy][tx+dx]===TILE.FOREST;
     nm ||= mapData[ty+dy][tx+dx]===TILE.MOUNTAIN;
    }
    if(nf){
     c.save();c.globalAlpha=.34;c.fillStyle='#476f43';
     for(let n=0;n<2;n++){const ox=5+((v*31+n*13)%1)*23,oy=15+((v*47+n*17)%1)*14;c.beginPath();c.arc(x+ox,y+oy,2.2+n*.5,0,Math.PI*2);c.fill();}
     c.restore();
    }
    if(nm&&v>.28){
     c.save();c.globalAlpha=.30;c.fillStyle='#747765';
     const ox=5+v*20,oy=20+(1-v)*8;c.beginPath();c.ellipse(x+ox,y+oy,3.5+v*2,1.8+v,-.2,0,Math.PI*2);c.fill();c.restore();
    }
   }
  }
  // Starting-area composition: a readable village approach and northbound departure lane.
  // Visual-only; save/event coordinates and walkability are untouched.
  if(!ready){
   const [vx,vy]=places.village.point;
   c.save();
   // village common: broad irregular earth patch, deliberately not aligned to 32px cells
   c.globalAlpha=.16;c.fillStyle='#aa965d';c.beginPath();
   c.moveTo(vx-53,vy+22);c.quadraticCurveTo(vx-42,vy-24,vx-5,vy-30);
   c.quadraticCurveTo(vx+35,vy-25,vx+48,vy+9);c.quadraticCurveTo(vx+30,vy+32,vx-12,vy+35);
   c.quadraticCurveTo(vx-38,vy+34,vx-53,vy+22);c.fill();
   // northbound worn lane: narrows as it leaves the settlement
   c.globalAlpha=.34;c.strokeStyle='#a38c57';c.lineCap='round';c.lineWidth=5.5;c.beginPath();
   c.moveTo(vx+19,vy-2);c.quadraticCurveTo(vx+22,vy-30,vx+27,vy-58);c.quadraticCurveTo(vx+30,vy-83,vx+42,vy-106);c.stroke();
   c.globalAlpha=.20;c.strokeStyle='#756743';c.lineWidth=1.2;c.beginPath();
   c.moveTo(vx+16,vy-4);c.quadraticCurveTo(vx+20,vy-48,vx+39,vy-104);c.stroke();
   // two tiny roadside stones establish one-step scale without blocking movement
   c.globalAlpha=.5;c.fillStyle='#777361';
   for(const [ox,oy] of [[10,-47],[38,-74]]){c.beginPath();c.ellipse(vx+ox,vy+oy,2.4,1.5,-.2,0,Math.PI*2);c.fill();}
   c.restore();
  }
  // Settlement cues: communal well and entrance gate make the three houses read as one village.
  if(!ready){
   const [vx,vy]=places.village.point;c.save();
   c.fillStyle='#6f6a58';c.beginPath();c.ellipse(vx+8,vy+18,6,3,0,0,Math.PI*2);c.fill();
   c.fillStyle='#8aa39a';c.beginPath();c.ellipse(vx+8,vy+17,3.6,1.5,0,0,Math.PI*2);c.fill();
   c.strokeStyle='#74513b';c.lineWidth=2;c.beginPath();c.moveTo(vx+35,vy+9);c.lineTo(vx+35,vy-6);c.moveTo(vx+48,vy+8);c.lineTo(vx+48,vy-7);c.moveTo(vx+33,vy-6);c.lineTo(vx+50,vy-7);c.stroke();
   c.restore();
  }
  // Village outskirts: intentional small farm plots replace scattered fence-like marks.
  if(!ready){
   const [vx,vy]=places.village.point;
   c.save();
   for(const [ox,oy,w,h] of [[-57,20,23,13],[30,19,26,12],[-50,-25,20,10]]){
    c.globalAlpha=.11;c.fillStyle='#8b7548';c.beginPath();c.roundRect(vx+ox,vy+oy,w,h,2);c.fill();
    c.globalAlpha=.24;c.strokeStyle='#6f633f';c.lineWidth=.8;
    for(let yy=vy+oy+3;yy<vy+oy+h;yy+=4){c.beginPath();c.moveTo(vx+ox+2,yy);c.lineTo(vx+ox+w-2,yy);c.stroke();}
   }
   c.restore();
  }
  // Final composition pass for the procedural preview: broad, low-contrast masses keep
  // the eye on the route and landmarks without exposing the 32px logic grid.
  if(!ready){
   c.save();
   for(const [px,py,rx,ry,a] of [[248,485,54,17,.045],[332,420,62,18,.038],[548,474,68,20,.042],[594,336,58,18,.040]]){
    if(tileAt(px,py)!=='grass')continue;
    c.globalAlpha=a;c.fillStyle='#365f3f';c.beginPath();c.ellipse(px,py,rx,ry,-.12,0,Math.PI*2);c.fill();
   }
   // Small warm clearings around destinations improve readability at phone scale.
   for(const key of ['village','shrine','hotspring','fox']){
    const [px,py]=places[key].point;if(tileAt(px,py)==='water')continue;
    c.globalAlpha=.055;c.fillStyle='#d0bd7c';c.beginPath();c.ellipse(px,py+5,key==='village'?44:27,key==='village'?15:10,0,0,Math.PI*2);c.fill();
   }
   c.restore();
  }
  // Route integration around the opening village, river crossing and cove.
  // These overlays are intentionally narrower than one walking cell and can later become road/bridge detail chips.
  if(!ready){
   c.save();c.lineCap='round';c.lineJoin='round';
   // village threshold: earth lane widens gently into the common instead of ending at a hard point
   const [vx,vy]=places.village.point;
   c.globalAlpha=.22;c.strokeStyle='#9b8453';c.lineWidth=7;c.beginPath();c.moveTo(vx+17,vy+8);c.quadraticCurveTo(vx+21,vy-3,vx+21,vy-22);c.stroke();
   // bridge banks: small gravel aprons visually tie road -> bridge -> road
   for(const [bx,by,rot] of [[384,544,-.15],[389,570,.12]]){
    c.save();c.translate(bx,by);c.rotate(rot);c.globalAlpha=.32;c.fillStyle='#b5a16a';c.beginPath();c.ellipse(0,0,13,6,0,0,Math.PI*2);c.fill();c.restore();
   }
   // cove approach: road dissolves into beach rather than meeting the landmark as a straight line
   const [cx,cy]=places.cove.point;c.globalAlpha=.26;c.strokeStyle='#b7a064';c.lineWidth=8;c.beginPath();
   c.moveTo(cx-24,cy-9);c.quadraticCurveTo(cx-12,cy-3,cx+1,cy+2);c.stroke();
   c.restore();
  }
  // A few signposts mark major forks while the surrounding plain stays explorable.
  for(const [x,y] of [[307,421],[589,496],[482,145]])stamp(15,x,y,10,12);
  const icons={village:8,shrine:9,cove:10,forest:11,waterfall:12,hotspring:13,fox:14};
  if(!mapChipReady('landmarks')) for(const [k,p] of Object.entries(places)){
   const [x,y]=p.point;
   // Landmark footprints are measured against the 32px walking cell:
   // village ~= 3x2 cells, major shrine ~= 2x2, minor destinations ~= 1-2 cells.
   if(k==='village'){
    c.save();
    if(!ready){
     // Three quarter-view houses with broad eaves; footprints stay compatible with a later 3x2 PNG object.
     const house=(hx,hy,sc=1)=>{
      c.save();
      c.fillStyle='rgba(54,54,42,.18)';c.beginPath();c.ellipse(hx+3*sc,hy+7*sc,13*sc,3.5*sc,-.08,0,Math.PI*2);c.fill();
      c.fillStyle='#d8c796';c.beginPath();c.moveTo(hx-8*sc,hy-5*sc);c.lineTo(hx+7*sc,hy-3*sc);c.lineTo(hx+7*sc,hy+7*sc);c.lineTo(hx-8*sc,hy+5*sc);c.closePath();c.fill();
      c.fillStyle='#b8a36f';c.beginPath();c.moveTo(hx+7*sc,hy-3*sc);c.lineTo(hx+11*sc,hy-6*sc);c.lineTo(hx+11*sc,hy+3*sc);c.lineTo(hx+7*sc,hy+7*sc);c.closePath();c.fill();
      c.fillStyle='#694738';c.beginPath();c.moveTo(hx-12*sc,hy-6*sc);c.lineTo(hx-2*sc,hy-15*sc);c.lineTo(hx+12*sc,hy-9*sc);c.lineTo(hx+7*sc,hy-3*sc);c.lineTo(hx-8*sc,hy-5*sc);c.closePath();c.fill();
      c.strokeStyle='#4f382f';c.lineWidth=1.1*sc;c.beginPath();c.moveTo(hx-12*sc,hy-6*sc);c.lineTo(hx+7*sc,hy-3*sc);c.moveTo(hx-2*sc,hy-15*sc);c.lineTo(hx+12*sc,hy-9*sc);c.stroke();
      c.fillStyle='#5b4032';c.fillRect(hx-2*sc,hy+.5*sc,3.5*sc,5.5*sc);
      c.restore();
     };
     house(x-29,y-12,.9);house(x+3,y-17,1);house(x-15,y+9,1.05);
     c.fillStyle='#806747';c.fillRect(x+18,y-8,2,19);c.fillRect(x+31,y-8,2,19);for(let yy=y-7;yy<y+12;yy+=5)c.fillRect(x+18,yy,15,1);
    }

    c.globalAlpha=.24;c.fillStyle='#b49c61';c.beginPath();c.ellipse(x-5,y+11,50,20,-.08,0,Math.PI*2);c.fill();
    c.globalAlpha=.30;c.strokeStyle='#8b784d';c.lineWidth=5;c.lineCap='round';
    c.beginPath();c.moveTo(x+18,y-6);c.quadraticCurveTo(x+35,y+18,x+39,y+43);c.stroke();c.globalAlpha=1;
    stamp(icons[k],x-32,y-18,52,44);stamp(icons[k],x+22,y-21,48,41);stamp(icons[k],x-7,y+12,58,49);
    c.restore();
   }else if(k==='shrine'||k==='fox'){
    const w=k==='fox'?58:56;
    if(!ready){
     c.save();c.strokeStyle=k==='fox'?'#9b493d':'#8a5138';c.lineWidth=4;c.beginPath();c.moveTo(x-15,y-2);c.lineTo(x-15,y-25);c.moveTo(x+15,y-2);c.lineTo(x+15,y-25);c.moveTo(x-19,y-23);c.lineTo(x+19,y-23);c.stroke();c.lineWidth=2;c.beginPath();c.moveTo(x-17,y-18);c.lineTo(x+17,y-18);c.stroke();c.restore();
    }
    c.save();c.globalAlpha=.20;c.fillStyle=k==='fox'?'#8b6848':'#65714b';c.beginPath();c.ellipse(x,y+8,w*.62,11,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
    stamp(icons[k],x,y-15,w,w*.86);c.restore();
   }else if(k==='waterfall'){
    if(!ready){c.save();c.fillStyle='#65705e';c.beginPath();c.moveTo(x-24,y+13);c.lineTo(x-18,y-22);c.lineTo(x-7,y-32);c.lineTo(x+2,y-19);c.lineTo(x+14,y-29);c.lineTo(x+24,y+13);c.closePath();c.fill();c.fillStyle='#d8ece2';c.beginPath();c.moveTo(x-5,y-25);c.quadraticCurveTo(x+1,y-8,x-2,y+10);c.lineTo(x+8,y+10);c.quadraticCurveTo(x+10,y-8,x+4,y-22);c.closePath();c.fill();c.fillStyle='#4d8c8b';c.beginPath();c.ellipse(x+3,y+13,19,5,0,0,Math.PI*2);c.fill();c.restore();}
    stamp(icons[k],x,y-13,50,46);
   }else if(k==='hotspring'){
    if(!ready){c.save();c.fillStyle='#72816b';c.beginPath();c.ellipse(x,y+7,24,10,0,0,Math.PI*2);c.fill();c.fillStyle='#8bc1b4';c.beginPath();c.ellipse(x,y+5,18,7,0,0,Math.PI*2);c.fill();c.strokeStyle='rgba(239,238,211,.72)';c.lineWidth=2;for(const ox of [-8,1,9]){c.beginPath();c.moveTo(x+ox,y-3);c.quadraticCurveTo(x+ox-4,y-10,x+ox+1,y-16);c.stroke();}c.restore();}
    stamp(icons[k],x,y-10,44,38);
   }else if(k==='forest'){
    if(!ready){c.save();c.strokeStyle='#76543a';c.lineWidth=2.5;c.beginPath();c.moveTo(x-10,y+8);c.lineTo(x-10,y-9);c.moveTo(x+10,y+8);c.lineTo(x+10,y-9);c.moveTo(x-14,y-8);c.quadraticCurveTo(x,y-15,x+14,y-8);c.stroke();c.fillStyle='#4a7044';for(const ox of [-13,0,13]){c.beginPath();c.arc(x+ox,y-15-(ox===0?4:0),7,0,Math.PI*2);c.fill();}c.restore();}
    stamp(icons[k],x,y-8,34,31);
   }else{
    // Cove: small beach/rock marker remains within a 2x1 object footprint.
    if(!ready){c.save();c.globalAlpha=.9;c.fillStyle='#c8b66e';c.beginPath();c.ellipse(x,y+5,27,9,-.12,0,Math.PI*2);c.fill();c.fillStyle='#667066';for(const [ox,oy,r] of [[-18,2,4],[17,5,5],[8,-1,3]]){c.beginPath();c.ellipse(x+ox,y+oy,r,r*.65,-.2,0,Math.PI*2);c.fill();}c.strokeStyle='rgba(225,240,222,.7)';c.lineWidth=1.4;c.beginPath();c.arc(x+1,y+8,17,.15,2.75);c.stroke();c.restore();}
    stamp(icons[k],x,y-8,38,33);
   }
  }
  // Production overhangs belong inside draw(), after all base/fallback passes.
  // Never invoke this at module scope: doing so previously prevented YK_WORLD from initializing.
  drawProductionOverhangs(c);
 }
 const productionDepthQueue=()=>{
  const q=[];
  for(let ty=0;ty<gridRows;ty++)for(let tx=0;tx<gridCols;tx++){const t=mapData[ty][tx];if(t===TILE.FOREST||t===TILE.MOUNTAIN)q.push({type:'terrain',tx,ty,depth:terrainDepth(tx,ty,t===TILE.FOREST?10:5)});}
  for(const o of objectLayer)q.push({type:'object',ref:o,depth:objectDepth(o)});
  return sortByDepth(q);
 };
 const drawProductionQueueItem=(c,it)=>it.type==='terrain'?drawProductionOverlayChip(c,it.tx,it.ty):drawProductionLandmark(c,it.ref);
 const drawProductionOverhangs=c=>{
  if(!(mapChipReady('forest')||mapChipReady('mountain')||mapChipReady('landmarks')))return false;
  for(const it of productionDepthQueue())drawProductionQueueItem(c,it);
  return true;
 };
 const drawProductionForeground=(c,heroY)=>{if(!(mapChipReady('forest')||mapChipReady('mountain')||mapChipReady('landmarks')))return;const heroDepth=depthKey(heroY,50);for(const it of productionDepthQueue())if(it.depth>heroDepth)drawProductionQueueItem(c,it);};
 return {start,hub,places,roads,worldObjects,mapData,TILE,walkable,near,revision:85,tileAt,tileSize,size,viewSize,camera,draw,CHIP,visualChipAt,roadChipAt,OBJECT_KIND,objectLayer,objectBounds,depthKey,terrainDepth,objectDepth,sortByDepth,makeDepthQueue,MAP_CHIP_SPEC,MAP_CHIP_PATHS,MAP_CHIP_ATLAS,chipRect,chipPlacement,MAP_CHIP_ART,mapChipReady,drawMapChip,drawProductionBaseChip,drawProductionRoadChip,drawProductionOverlayChip,drawProductionLandmark,drawProductionOverhangs,drawProductionForeground};
})();

// Original journey geography. 80 x 80 walking cells; never copied from ROM map data.
window.YK_WORLD=(()=>{
 const tileSize=32,size=2560,viewSize=640,revision=101;
 const center=([x,y])=>[x*32+16,y*32+16];
 const definitions={
  village:[[37,70],'鬼灯の里','南の半島から北へ。草原を抜けて天妖の社を探そう。'],
  shrine:[[20,43],'天妖の社','森と岩山の間を探索し、東の海の入り江を目指そう。'],
  cove:[[49,47],'海の入り江','入り江から北東の森へ。木々の間に忘れの森がある。'],
  forest:[[61,35],'忘れの森','北東の岩山を目印に、龍神の滝を探そう。'],
  waterfall:[[66,14],'龍神の滝','西の森を抜けて月見の湯へ。'],
  hotspring:[[25,17],'月見の湯','北の山裾を進み、九尾の祠を目指そう。'],
  fox:[[46,4],'九尾の祠','北の山に囲まれた旅路の終点。']
 };
 const places=Object.fromEntries(Object.entries(definitions).map(([id,[cell,name,note]])=>[id,{point:center(cell),name,note}]));
 const start=center([37,71]),hub=start;
 // Maintained roads are visible only immediately outside settlements and facilities.
 const routes=[
  [[37,73],[37,70]],[[20,48],[20,45]],[[50,54],[50,51]],
  [[61,37],[61,34]],[[70,22],[70,19]],[[24,20],[24,17]],[[45,9],[45,6]]
 ];
 const roads=[]; // The editor's authored roads are already embedded in mapData.
 // Exact user-authored terrain. No procedural coastline or biome repaint.
 const snowy=()=>false;
 const mapData=window.YK_FIELD_TERRAIN.tiles.map(row=>row.slice());
 // Height metadata is independent of the player's authored terrain.
 // Terrain type does not imply elevation: only explicitly authored height zones rise.
 mapData.heights=window.YK_FIELD_TERRAIN.heights?.map(row=>row.slice())||mapData.map(row=>row.map(()=>0));
 mapData.heightTransitions=[];
 mapData.projectedHeights=true;
 mapData.shoreRelief=true; // Visual shoreline bank only; authored height tiers are dormant.
 mapData.paths=roads;mapData.decorations=[];
 // Two modest bridges are scenery at the designated river crossings.

 const object=(kind,cx,foot,width,height,walkThrough=false)=>mapData.decorations.push({kind,x:cx-width/2,y:foot-height,width,height,foot,walkThrough});
 // Entrance markers are 24px in front of the solid object's feet.
 for(const [id,p] of Object.entries(places)){
  const [x,y]=p.point,tx=Math.floor(x/32),ty=Math.floor(y/32);
  // Preserve the author's tiles around story entrances.
  if(id==='village')object('newVillage',x,y-32,64,32);
  if(id==='shrine'||id==='fox'){const left=tx*32,top=(ty-1)*32;mapData.decorations.push({kind:'shrine',x:left,y:top,width:64,height:64,foot:top+64,groundFootprint:{width:64,height:32,anchor:'bottom-center'}});object('lantern',x-64,y-32,24,40,true);object('lantern',x+64,y-32,24,40,true);}
  if(id==='cove')object('newFort',x,y-32,64,32);
  if(id==='forest')object('newTorii',x,y-24,32,32);
  if(id==='waterfall')object('waterfall',x,y-24,80,96);
  if(id==='hotspring')object('hermit',x,y-24,72,72);
 }
 // Optional landmarks are placed in reachable clearings, independent of old roads.
 mapData.decorations.push({kind:'castle',x:31*32,y:47*32,width:64,height:64,foot:49*32,groundFootprint:{width:64,height:32,anchor:'bottom-center'}});
 // Sacred tree: 2x2 visible tiles, bottom row solid, away from the forest torii entrance.
 mapData.decorations.push({kind:'sacredTree',x:57*32,y:34*32,width:64,height:64,foot:36*32,groundFootprint:{width:64,height:32,anchor:'bottom-center'}});
 mapData.decorations.push({kind:'stoneMonument',x:56*32,y:38*32,width:32,height:32,foot:39*32,groundFootprint:{width:32,height:16,anchor:'bottom-center'}});
 object('newCaveLarge',center([67,39])[0],center([67,39])[1]-32,64,32);
 const guides=[[30,61,'南の地蔵','北の草原を進むと天妖の社があるぞ。'],[30,44,'森の地蔵','東の水辺には橋がある。入り江を探すのじゃ。'],[50,37,'川辺の地蔵','川を越えた先には忘れの森がある。'],[42,23,'湖畔の地蔵','月見の湯は西、九尾の祠は北じゃ。']].map(([tx,ty,name,tip],id)=>({id,x:center([tx,ty])[0],y:center([tx,ty])[1],name,tip}));
 for(const g of guides)object('jizo',g.x,g.y,24,40,true);
 function guideRoute(from,target){
  const nodes=new Map(),key=(x,y)=>x+','+y;
  for(const road of roads)for(let i=1;i<road.length;i++){const [ax,ay]=road[i-1],[bx,by]=road[i],dx=Math.sign(bx-ax)*32,dy=Math.sign(by-ay)*32,n=(Math.abs(bx-ax)+Math.abs(by-ay))/32;for(let j=0;j<=n;j++)nodes.set(key(ax+j*dx,ay+j*dy),[ax+j*dx,ay+j*dy]);}
  const nearest=p=>[...nodes.keys()].sort((a,b)=>Math.hypot(nodes.get(a)[0]-p[0],nodes.get(a)[1]-p[1])-Math.hypot(nodes.get(b)[0]-p[0],nodes.get(b)[1]-p[1]))[0];
  const start=nearest(from),end=nearest(target),queue=[start],prev=new Map([[start,null]]);
  for(let i=0;i<queue.length&& !prev.has(end);i++){const [x,y]=nodes.get(queue[i]);for(const [dx,dy] of [[32,0],[-32,0],[0,32],[0,-32]]){const k=key(x+dx,y+dy);if(nodes.has(k)&&!prev.has(k)){prev.set(k,queue[i]);queue.push(k);}}}
  if(!prev.has(end))return '地図で街道と橋の位置を確かめるのじゃ。';
  const path=[];for(let k=end;k;k=prev.get(k))path.unshift(nodes.get(k));const turns=[];
  for(let i=1;i<path.length;i++){const [x,y]=path[i],[px,py]=path[i-1],d=x>px?'東':x<px?'西':y>py?'南':'北';if(turns.at(-1)!==d)turns.push(d);}
  return turns.length?'そばの街道に出たら、まず'+turns.slice(0,3).join('、次の曲がり角で')+'へ進むのじゃ。':'目的地はこの近くじゃ。入口でAを押すのじゃ。';
 }
 for(const [tx,ty] of [[16,57],[20,60],[45,63],[54,63],[58,45],[43,25]]){const [x,y]=center([tx,ty]);mapData.decorations.push({kind:'wildflowers',x,y,width:40,height:24,foot:y+24,ground:true});}
 // Place by contact footprints, not sprite rectangles. Visual overhang may overlap.
 const contact=o=>{
  if(o.walkThrough)return [];
  if(o.groundFootprint){const f=o.groundFootprint;return [{x:o.x+(o.width-f.width)/2,y:o.foot-f.height,width:f.width,height:f.height}];}
  const bases={newVillage:[0,0,1,1],newFort:[0,0,1,1],newCaveLarge:[0,0,1,1],shrine:[0,.5,1,1],castle:[0,.5,1,1],sacredTree:[0,.5,1,1],stoneMonument:[0,.5,1,1]};
  const b=bases[o.kind];return b?[{x:o.x+b[0]*o.width,y:o.y+b[1]*o.height,width:(b[2]-b[0])*o.width,height:(b[3]-b[1])*o.height}]:[];
 };
 const intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 const placeObject=o=>{
  const footprint=contact(o);
  if(footprint.some(f=>mapData.decorations.some(existing=>contact(existing).some(g=>intersects(f,g)))))return false;
  mapData.decorations.push(o);return true;
 };
 // Retire the provisional mountain strips: they were added independently of the
 // approved map and could block grass without a coherent terrain boundary.
 // Existing mountain terrain remains impassable and visibly rendered.
 // Forest crowns are traversable; overlapping visual silhouettes are permitted.
 const groves=[[[24,55],[25,55],[26,55],[25,56]],[[17,45],[18,45],[19,45]],[[57,32],[58,32],[59,32],[58,33]],[[62,24],[63,24],[64,24]],[[30,16],[31,16],[32,16]]];
 for(const grove of groves)for(const [tx,ty] of grove){
  if(mapData[ty]?.[tx]!=='grass')continue;
  placeObject({kind:'newTrees',x:tx*32,y:ty*32,width:32,height:32,foot:(ty+1)*32,walkThrough:true});
 }
 // Optional scenery must stand on accessible terrain. Remove its sprite AND
 // footprint together when its contact area falls on water or impassable rock.
 // Story entrances and the cave set into the mountain are retained; only
 // independently placed decorative landmarks and ornaments are cleaned up.
 const optionalScenery=new Set(['castle','sacredTree','stoneMonument','wildflowers']);
 const passableGround=new Set(['grass','forest','sand','snow','barren','road','bridge']);
 const grounded=o=>{
  if(o.ground){
   const tx=Math.floor((o.x+o.width/2)/32),ty=Math.floor(o.foot/32);
   return passableGround.has(mapData[ty]?.[tx]);
  }
  const feet=contact(o);
  return feet.every(f=>{
   for(let y=Math.floor(f.y/32);y<=Math.floor((f.y+f.height-0.01)/32);y++)
    for(let x=Math.floor(f.x/32);x<=Math.floor((f.x+f.width-0.01)/32);x++)
     if(!passableGround.has(mapData[y]?.[x]))return false;
   return true;
  });
 };
 mapData.decorations=mapData.decorations.filter(o=>!optionalScenery.has(o.kind)||grounded(o));
 // Preserve the exact authored tile layout around decorations.
 // Existing story entrances and save IDs remain unchanged.
 // Small clearings make landmarks visible, with only short maintained paths.
 const restStops=[
  {id:'roadside-tea',name:'花かげ茶屋',cell:[25,58],type:'tea'},
  {id:'bridge-inn',name:'渡しの旅籠',cell:[35,41],type:'inn'},
  {id:'forest-tea',name:'木漏れ日の茶屋',cell:[54,37],type:'tea'},
  {id:'highland-inn',name:'峠の旅籠',cell:[34,13],type:'inn'}
 ].map(o=>({...o,point:center(o.cell)}));
 for(const stop of restStops){
  // Preserve authored tiles.
  const [x,y]=stop.point;
  mapData.decorations.push({kind:'wildflowers',x:x-20,y:y-18,width:40,height:24,foot:y+6,ground:true});
 }
 // Build an actual road-tile overlay through walkable grass, never over water or solid contacts.
 // Routes are found on the 32px grid after all field objects have been placed.
 const routeStops=['village','shrine','cove','forest','waterfall','hotspring','fox'].map(id=>places[id].point)
  .map(([x,y])=>[Math.floor(x/32),Math.floor(y/32)]);
 const key=(x,y)=>y*mapData[0].length+x;
 const roadCell=(x,y)=>{
  if(mapData[y]?.[x]!=='grass')return false;
  const px=x*32+16,py=y*32+16;
  // The visible road must be traversable by the *actual hero collision radius*.
  // Checking just the tile center previously allowed roads through invisible
  // object footprints or water edges.
  // world.js loads before landscape.js; never call YK_LANDSCAPE during initialization.
  // Test the player's radius against terrain and visible object contacts locally.
  for(const [dx,dy] of [[0,0],[-12,0],[12,0],[0,-12],[0,12],[-8,-8],[8,-8],[-8,8],[8,8]]){
   const xx=px+dx,yy=py+dy,t=mapData[Math.floor(yy/32)]?.[Math.floor(xx/32)];
   if(!['grass','forest','sand','snow','barren','road','bridge'].includes(t))return false;
  }
  return !mapData.decorations.some(o=>contact(o).some(f=>
   px>=f.x-12&&px<=f.x+f.width+12&&py>=f.y-12&&py<=f.y+f.height+12));
 };
 const nearestRoadCell=([sx,sy])=>{
  if(roadCell(sx,sy))return [sx,sy];
  for(let radius=1;radius<9;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)
   if(Math.max(Math.abs(dx),Math.abs(dy))===radius&&roadCell(sx+dx,sy+dy))return [sx+dx,sy+dy];
  return null;
 };
 const routeBetween=(a,b)=>{
  const from=nearestRoadCell(a),to=nearestRoadCell(b);if(!from||!to)return [];
  const target=key(...to),queue=[from],prev=new Map([[key(...from),null]]);
  for(let i=0;i<queue.length&&!prev.has(target);i++){
   const [x,y]=queue[i],neighbors=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
   neighbors.sort((p,q)=>Math.abs(p[0]-to[0])+Math.abs(p[1]-to[1])-Math.abs(q[0]-to[0])-Math.abs(q[1]-to[1]));
   for(const [nx,ny] of neighbors){const k=key(nx,ny);if(!prev.has(k)&&roadCell(nx,ny)){prev.set(k,key(x,y));queue.push([nx,ny]);}}
  }
  if(!prev.has(target))return [];
  const path=[];for(let k=target;k!==null;k=prev.get(k))path.push([(k%mapData[0].length)*32+16,Math.floor(k/mapData[0].length)*32+16]);
  return path.reverse();
 };
 for(let i=1;i<routeStops.length;i++){
  const path=routeBetween(routeStops[i-1],routeStops[i]);
  if(path.length>1)roads.push(path);
 }
 mapData.paths=roads;
 // Only authored terrain and visible object footprints block movement.
 const walkable=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&window.YK_LANDSCAPE.walkable(mapData,x,y);
 const tileAt=(x,y)=>mapData[Math.floor(y/32)]?.[Math.floor(x/32)]||'sea';
 const near=(x,y)=>Object.keys(places).find(k=>Math.hypot(x-places[k].point[0],y-places[k].point[1])<=36)||null;
 const camera=(x,y)=>({x:x-viewSize/2,y:y-viewSize/2,size:viewSize,zoom:1.4});
 const draw=c=>window.YK_LANDSCAPE.draw(c,mapData);
 const worldObjects=Object.entries(places).map(([id,p])=>({id,destination:id,x:p.point[0],y:p.point[1],name:p.name}));
 const legacy={village:[211,565],shrine:[194,366],cove:[467,610],forest:[661,405],waterfall:[637,191],hotspring:[431,214],fox:[171,111]};
 function migratePosition(point){
  if(!Array.isArray(point)||!point.every(Number.isFinite))return start.slice();
  const id=Object.keys(legacy).sort((a,b)=>Math.hypot(point[0]-legacy[a][0],point[1]-legacy[a][1])-Math.hypot(point[0]-legacy[b][0],point[1]-legacy[b][1]))[0];
  return places[id].point.slice();
 }
 return {start,hub,places,roads,restStops,guides,guideRoute,worldObjects,mapData,walkable,near,revision,tileAt,tileSize,size,viewSize,camera,draw,migratePosition};
})();

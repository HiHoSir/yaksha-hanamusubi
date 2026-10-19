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
 mapData.paths=roads;mapData.decorations=[];
 // Two modest bridges are scenery at the designated river crossings.

 const object=(kind,cx,foot,width,height)=>mapData.decorations.push({kind,x:cx-width/2,y:foot-height,width,height,foot});
 // Entrance markers are 24px in front of the solid object's feet.
 for(const [id,p] of Object.entries(places)){
  const [x,y]=p.point,tx=Math.floor(x/32),ty=Math.floor(y/32);
  // Preserve the author's tiles around story entrances.
  if(id==='village')object('village',x,y-24,144,104);
  if(id==='shrine'||id==='fox'){object('shrine',x,y-24,80,80);object('lantern',x-64,y-32,24,40);object('lantern',x+64,y-32,24,40);}
  if(id==='cove')object('town',x,y-24,144,104);
  if(id==='forest')object('torii',x,y-24,64,64);
  if(id==='waterfall')object('waterfall',x,y-24,80,96);
  if(id==='hotspring')object('hermit',x,y-24,72,72);
 }
 // Optional landmarks are placed in reachable clearings, independent of old roads.
 object('castle',center([31,48])[0],center([31,48])[1],112,112);
 object('cave',center([67,39])[0],center([67,39])[1],80,64);
 const guides=[[30,61,'南の地蔵','北の草原を進むと天妖の社があるぞ。'],[30,44,'森の地蔵','東の水辺には橋がある。入り江を探すのじゃ。'],[50,37,'川辺の地蔵','川を越えた先には忘れの森がある。'],[37,19,'湖畔の地蔵','月見の湯は西、九尾の祠は北じゃ。']].map(([tx,ty,name,tip],id)=>({id,x:center([tx,ty])[0],y:center([tx,ty])[1],name,tip}));
 for(const g of guides)object('jizo',g.x,g.y,24,40);
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
 // Authored road cells are retained without adding artificial paths.
 mapData.paths=roads;
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

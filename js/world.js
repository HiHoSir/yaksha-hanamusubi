// Original journey geography. 80 x 80 walking cells; never copied from ROM map data.
window.YK_WORLD=(()=>{
 const tileSize=32,size=2560,viewSize=640,revision=97;
 const center=([x,y])=>[x*32+16,y*32+16];
 const definitions={
  village:[[37,70],'鬼灯の里','南の半島から北へ。草原を抜けて天妖の社を探そう。'],
  shrine:[[20,45],'天妖の社','森と岩山の間を探索し、東の海の入り江を目指そう。'],
  cove:[[50,51],'海の入り江','入り江から北東の森へ。木々の間に忘れの森がある。'],
  forest:[[61,34],'忘れの森','北東の岩山を目印に、龍神の滝を探そう。'],
  waterfall:[[70,19],'龍神の滝','西の森を抜けて月見の湯へ。'],
  hotspring:[[24,17],'月見の湯','北の山裾を進み、九尾の祠を目指そう。'],
  fox:[[45,6],'九尾の祠','北の山に囲まれた旅路の終点。']
 };
 const places=Object.fromEntries(Object.entries(definitions).map(([id,[cell,name,note]])=>[id,{point:center(cell),name,note}]));
 const start=center([37,73]),hub=start;
 // Maintained roads are visible only immediately outside settlements and facilities.
 const routes=[
  [[37,73],[37,70]],[[20,48],[20,45]],[[50,54],[50,51]],
  [[61,37],[61,34]],[[70,22],[70,19]],[[24,20],[24,17]],[[45,9],[45,6]]
 ];
 const roads=routes.map(r=>r.map(center));
 // Coast traced as a connected landmass with a narrow southern peninsula.
 const outline=[[29,8],[35,4],[43,3],[52,3],[61,6],[68,10],[72,15],[76,22],[76,29],[71,35],[73,40],[68,43],[62,43],[59,48],[57,54],[61,59],[58,63],[52,62],[48,65],[49,69],[45,72],[43,76],[40,78],[35,78],[33,75],[32,71],[27,67],[20,65],[15,62],[11,58],[9,53],[12,48],[10,43],[12,37],[9,32],[12,27],[10,22],[13,16],[19,12],[24,11]];
 const polygon=(points,x,y)=>{let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [ax,ay]=points[i],[bx,by]=points[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;}return hit;};
 const inside=(x,y)=>polygon(outline,x,y);
 const snowy=()=>false;
 const mapData=Array.from({length:80},(_,y)=>Array.from({length:80},(_,x)=>inside(x+.5,y+.5)?'grass':'sea'));
 const paint=(kind,cx,cy,rx,ry,replaceSea=false)=>{for(let y=Math.max(1,cy-ry);y<Math.min(79,cy+ry);y++)for(let x=Math.max(1,cx-rx);x<Math.min(79,cx+rx);x++)if((replaceSea||mapData[y][x]!=='sea')&&((x-cx)/rx)**2+((y-cy)/ry)**2<1)mapData[y][x]=kind;};
 const chain=(kind,points,r=2)=>{for(const [x,y] of points)paint(kind,x,y,r,r);};
 const channel=(kind,points,width=1)=>{for(let i=1;i<points.length;i++){const [ax,ay]=points[i-1],[bx,by]=points[i],n=Math.max(Math.abs(bx-ax),Math.abs(by-ay));for(let j=0;j<=n;j++){const x=Math.round(ax+(bx-ax)*j/n),y=Math.round(ay+(by-ay)*j/n);for(let dy=-width+1;dy<width;dy++)for(let dx=-width+1;dx<width;dx++)if(mapData[y+dy]?.[x+dx]!=='sea')mapData[y+dy][x+dx]=kind;}}};
 // Sheltered bays and headlands are the defining silhouette, not oval mountain blobs.
 paint('sea',44,47,8,6);
 paint('sea',31,56,5,4);
 paint('sea',17,39,5,3);
 paint('sea',36,20,7,5); // woodland lake with a small central island
 paint('grass',36,20,2,2,true);
 paint('sea',61,28,5,3);
 // Lowland river runs from the woodland lake to the southern inlet.
 channel('river',[[38,23],[40,27],[38,31],[40,35],[39,39],[42,43],[44,46]]);
 channel('river',[[62,26],[65,24],[68,22],[71,20]]);
 // Mountain ranges: the north is rugged; southern plains remain easy to explore.
 chain('mountain',[[29,36],[31,34],[33,32],[35,30],[36,28],[48,12],[51,11],[54,12],[57,14],[60,16],[62,19],[59,24],[56,27]],3);
 chain('rockMountain',[[54,16],[57,18],[60,20],[64,21],[67,24]],2);
 chain('mountain',[[38,9],[41,8],[48,7],[51,8]],2);
 // Forest belts and smaller groves leave large walkable grassland clearings.
 chain('forest',[[17,55],[21,54],[25,52],[20,37],[23,34],[25,30],[29,23],[29,19],[33,16],[39,16],[38,24],[43,27],[46,29],[49,32],[53,34],[57,35],[61,36],[65,36],[55,40],[50,42],[30,58],[27,61]],3);
 chain('forest',[[17,25],[20,23],[24,22],[42,17],[45,18],[48,20]],2);
 // River fords: traversable crossings, with bridge decorations placed below.
 for(const [cx,cy] of [[39,35],[42,43]])for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)if(mapData[y]?.[x]==='river')mapData[y][x]='grass';
 // The southern peninsula is a meadow with accessible shore on either side.
 for(let y=65;y<=77;y++)for(let x=32;x<=43;x++)if(mapData[y]?.[x]!=='sea')mapData[y][x]='grass';
 // Facility approaches must be reachable and not overlap water.
 for(const [id,p] of Object.entries(places)){
  const tx=Math.floor(p.point[0]/32),ty=Math.floor(p.point[1]/32);
  for(let y=ty-3;y<=ty+2;y++)for(let x=tx-3;x<=tx+3;x++)if(mapData[y]?.[x])mapData[y][x]=id==='cove'?'sand':'grass';
 }
 // Restore coast edge beaches after geography, excluding rivers.
 const snapshot=mapData.map(row=>row.slice());
 for(let y=1;y<79;y++)for(let x=1;x<79;x++)if(snapshot[y][x]==='grass'&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>snapshot[y+dy]?.[x+dx]==='sea'))mapData[y][x]='sand';
 mapData.paths=roads;mapData.decorations=[];
 // Two modest bridges are scenery at the designated river crossings.
 for(const [cx,cy] of [[39,35],[42,43]]){const [x,y]=center([cx,cy]);mapData.decorations.push({kind:'bridge',x:x-48,y:y-30,width:96,height:64,foot:y+34,ground:true});}
 const object=(kind,cx,foot,width,height)=>mapData.decorations.push({kind,x:cx-width/2,y:foot-height,width,height,foot});
 // Entrance markers are 24px in front of the solid object's feet.
 for(const [id,p] of Object.entries(places)){
  const [x,y]=p.point,tx=Math.floor(x/32),ty=Math.floor(y/32);
  for(let yy=ty-3;yy<=ty+1;yy++)for(let xx=tx-2;xx<=tx+2;xx++)mapData[yy][xx]=id==='cove'?'sand':snowy(xx,yy)?'snow':'grass';
  if(id==='village')object('village',x,y-24,144,104);
  if(id==='shrine'||id==='fox'){object('shrine',x,y-24,80,80);object('lantern',x-64,y-32,24,40);object('lantern',x+64,y-32,24,40);}
  if(id==='cove')object('town',x,y-24,144,104);
  if(id==='forest')object('torii',x,y-24,64,64);
  if(id==='waterfall')object('waterfall',x,y-24,80,96);
  if(id==='hotspring')object('hermit',x,y-24,72,72);
 }
 // Optional landmarks are placed in reachable clearings, independent of old roads.
 object('castle',center([31,48])[0],center([31,48])[1],112,112);
 object('cave',center([67,40])[0],center([67,40])[1],80,64);
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
 for(const [tx,ty] of [[15,61],[20,60],[45,63],[54,63],[58,46],[43,25]]){const [x,y]=center([tx,ty]);mapData.decorations.push({kind:'wildflowers',x,y,width:40,height:24,foot:y+24,ground:true});}
 // Small clearings around scenery; never carve artificial roads through wilderness.
 const clearCell=(x,y)=>{const t=mapData[y]?.[x];if(['forest','mountain','rockMountain','snowMountain'].includes(t))mapData[y][x]='grass';};
 for(const o of mapData.decorations.filter(o=>!o.ground)){
  const tx=Math.floor((o.x+o.width/2)/32),ty=Math.floor(o.foot/32);
  for(let y=ty-1;y<=ty+2;y++)for(let x=tx-2;x<=tx+2;x++)clearCell(x,y);
 }
 // Existing story entrances and save IDs remain unchanged.
 // Small clearings make landmarks visible, with only short maintained paths.
 const restStops=[
  {id:'roadside-tea',name:'花かげ茶屋',cell:[25,58],type:'tea'},
  {id:'bridge-inn',name:'渡しの旅籠',cell:[35,41],type:'inn'},
  {id:'forest-tea',name:'木漏れ日の茶屋',cell:[54,38],type:'tea'},
  {id:'highland-inn',name:'峠の旅籠',cell:[34,13],type:'inn'}
 ].map(o=>({...o,point:center(o.cell)}));
 const open=(cx,cy,r=2)=>{for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(mapData[y]?.[x]&&!['sea','river'].includes(mapData[y][x]))mapData[y][x]='grass';};
 for(const p of Object.values(places))open(Math.floor(p.point[0]/32),Math.floor(p.point[1]/32),4);
 for(const g of guides)open(Math.floor(g.x/32),Math.floor(g.y/32),2);
 for(const stop of restStops){
  open(...stop.cell,2);
  const [x,y]=stop.point;
  mapData.decorations.push({kind:'wildflowers',x:x-20,y:y-18,width:40,height:24,foot:y+6,ground:true});
 }
 // No continuous road drawing across wilderness.
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

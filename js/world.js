// Original journey geography. 80 x 80 walking cells; never copied from ROM map data.
window.YK_WORLD=(()=>{
 const tileSize=32,size=2560,viewSize=640,revision=96;
 const center=([x,y])=>[x*32+16,y*32+16];
 const definitions={
  village:[[17,62],'鬼灯の里','里を出たら北の草原を探索し、森の西側にある天妖の社を探そう。'],
  shrine:[[19,43],'天妖の社','東へ広がる草原を進み、海の入り江を探そう。'],
  cove:[[38,42],'海の入り江','北東の森へ。木々の間に忘れの森の入口がある。'],
  forest:[[51,33],'忘れの森','森を抜けて北の水音を頼りに龍神の滝へ。'],
  waterfall:[[54,22],'龍神の滝','北西の高原に月見の湯がある。旅支度を整えよう。'],
  hotspring:[[39,17],'月見の湯','高原を北へ進み、山の間にある九尾の祠を探そう。'],
  fox:[[42,8],'九尾の祠','山間の旅路の終点。緑の山々に囲まれた祠。']
 };
 const places=Object.fromEntries(Object.entries(definitions).map(([id,[cell,name,note]])=>[id,{point:center(cell),name,note}]));
 const start=center([17,65]),hub=start;
 // Paths are maintained only immediately outside settlements and entrances.
 const routes=[
  [[17,65],[17,62]],[[19,46],[19,43]],[[38,45],[38,42]],
  [[51,36],[51,33]],[[54,25],[54,22]],[[39,20],[39,17]],[[42,11],[42,8]]
 ];
 const roads=routes.map(r=>r.map(center));
 // Coastal silhouette traced from the approved first-area concept (80x80 cells).
 const outline=[[32,3],[40,2],[48,4],[56,3],[65,8],[72,13],[74,22],[69,29],[74,35],[70,41],[65,43],[59,43],[55,47],[60,51],[58,56],[52,57],[48,54],[43,55],[39,59],[36,63],[32,65],[29,69],[27,73],[24,76],[20,75],[17,71],[15,68],[12,66],[10,61],[7,58],[10,54],[8,49],[12,44],[9,40],[12,34],[9,29],[13,24],[10,18],[15,13],[21,10],[26,7]];
 const inside=(x,y)=>{let hit=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const [ax,ay]=outline[i],[bx,by]=outline[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;}return hit;};
 const snowy=()=>false; // Snow terrain is intentionally absent in the opening region.
 const mapData=Array.from({length:80},(_,y)=>Array.from({length:80},(_,x)=>inside(x,y)?'grass':'sea'));
 const paint=(kind,cx,cy,rx,ry)=>{for(let y=Math.max(1,cy-ry);y<Math.min(79,cy+ry);y++)for(let x=Math.max(1,cx-rx);x<Math.min(79,cx+rx);x++)if(mapData[y][x]!=='sea'&&((x-cx)/rx)**2+((y-cy)/ry)**2<1)mapData[y][x]=kind;};
 const chain=(kind,points,r=2)=>{for(const [x,y] of points)paint(kind,x,y,r,r);};
 // The south is forgiving: meadow and gentle groves; the north gains rocky ridges.
 chain('mountain',[[25,34],[28,32],[31,30],[34,28],[36,26],[43,11],[47,10],[51,9],[55,11],[59,14],[62,17],[60,20],[57,23]],3);
 chain('rockMountain',[[52,16],[55,17],[57,18],[61,24],[64,25]],2);
 chain('forest',[[15,54],[18,52],[22,51],[24,49],[19,43],[21,39],[26,39],[30,43],[33,46],[42,37],[45,34],[49,32],[53,31],[59,33],[63,36],[32,21],[35,20],[37,18],[29,14],[26,17],[22,23],[19,27]],3);
 // Meandering river, with two broad crossings rather than a straight blue wall.
 const stream=(points)=>{for(let i=1;i<points.length;i++){const [ax,ay]=points[i-1],[bx,by]=points[i];const n=Math.max(Math.abs(bx-ax),Math.abs(by-ay));for(let j=0;j<=n;j++){const x=Math.round(ax+(bx-ax)*j/n),y=Math.round(ay+(by-ay)*j/n);if(mapData[y]?.[x]!=='sea')mapData[y][x]='river';}}};
 stream([[55,24],[52,27],[49,30],[46,34],[44,37],[40,39],[37,42],[35,45],[32,47],[28,49],[24,50],[20,51],[16,53]]);
 // Sheltered inlet and a small northern lake (water stays impassable).
 paint('sea',45,46,5,4);
 paint('sea',44,20,5,3);
 // Coastline sand is computed last, and does not replace river banks.
 const snapshot=mapData.map(row=>row.slice());
 for(let y=1;y<79;y++)for(let x=1;x<79;x++)if(snapshot[y][x]==='grass'&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>snapshot[y+dy]?.[x+dx]==='sea'))mapData[y][x]='sand';
 // A few natural clearings create optional detours.
 for(const [x,y,r] of [[20,58,4],[17,46,3],[35,52,3],[39,36,3],[46,28,3],[36,15,3]])paint('grass',x,y,r,r);
 mapData.paths=roads;mapData.decorations=[];
 const crossings=new Set();
 for(const route of routes)for(let i=1;i<route.length;i++){
  const [ax,ay]=route[i-1],[bx,by]=route[i],dx=Math.sign(bx-ax),dy=Math.sign(by-ay),steps=Math.abs(bx-ax)+Math.abs(by-ay);
  for(let n=0;n<=steps;n++){
   const x=ax+n*dx,y=ay+n*dy;
   if(mapData[y][x]==='river')crossings.add([x,y,dx?'bridge':'bridgeNS'].join(','));
   for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const t=mapData[y+oy][x+ox];
    if(t!=='river')mapData[y+oy][x+ox]=snowy(x+ox,y+oy)?'snow':t==='sand'?'sand':'grass';
   }
  }
 }
 for(const s of crossings){const [tx,ty,kind]=s.split(','),[x,y]=center([+tx,+ty]);
  const width=kind==='bridge'?96:112,height=kind==='bridge'?112:96;
  const top=kind==='bridge'?y-height*.56:y-height/2;
  mapData.decorations.push({kind,x:x-width/2,y:top,width,height,foot:top+height,ground:true});
 }
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
 // Minor scenery sits off the travel lane. These are scenery, not extra story entrances.
 object('castle',center([49,61])[0],center([49,61])[1],112,112);
 object('cave',center([28,50])[0],center([28,50])[1],80,64);
 const guides=[[20,58,'街道の地蔵','川は橋を渡るのじゃ。里では旅支度を整えられるぞ。'],[45,55,'橋の地蔵','大橋の東側じゃ。入り江へは南の街道をたどるのじゃ。'],[60,38,'森の地蔵','北へ向かう道は川の橋につながっておる。'],[35,27,'峠の地蔵','東の高原には月見の湯がある。疲れたら立ち寄るがよい。'],[24,18,'山道の地蔵','この山道の北に九尾の祠があるぞ。']].map(([tx,ty,name,tip],id)=>({id,x:center([tx,ty])[0],y:center([tx,ty])[1],name,tip}));
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
 // Small clearings reserve the foreground as well as the object's footprint:
 // forest crowns and mountains extend above their ground cells in quarter view.
 const landmarks=mapData.decorations.filter(o=>['jizo','cave','castle','lantern','flowers'].includes(o.kind));
 const clearCell=(x,y)=>{
  const t=mapData[y]?.[x];if(!t||['sea','river'].includes(t))return;
  if(['forest','mountain','rockMountain','snowMountain'].includes(t))mapData[y][x]=snowy(x,y)?'snow':'grass';
 };
 const mainRoads=roads.slice();
 for(const o of landmarks){
  const x=o.x+o.width/2,y=o.foot,tx=Math.floor(x/32),ty=Math.floor(y/32);
  const half=Math.max(2,Math.ceil(o.width/64));
  for(let yy=ty-1;yy<=ty+3;yy++)for(let xx=tx-half;xx<=tx+half;xx++)clearCell(xx,yy);
  if(!['jizo','cave','castle'].includes(o.kind))continue;
  const front=[x,y+32],candidates=[];
  for(const road of mainRoads)for(let i=1;i<road.length;i++){
   const a=road[i-1],b=road[i];candidates.push([Math.max(Math.min(a[0],b[0]),Math.min(front[0],Math.max(a[0],b[0]))),Math.max(Math.min(a[1],b[1]),Math.min(front[1],Math.max(a[1],b[1])))]);
  }
  candidates.sort((a,b)=>Math.hypot(a[0]-x,a[1]-front[1])-Math.hypot(b[0]-x,b[1]-front[1]));
  // Try both right-angle approaches without replacing any water with land.
  for(const end of candidates){let connected=false;
   for(const bend of [[end[0],front[1]],[front[0],end[1]]]){
    const path=[front,bend,end].filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]),cells=[];
    for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let d=0;d<=n;d+=8)cells.push([Math.floor((a[0]+Math.sign(b[0]-a[0])*d)/32),Math.floor((a[1]+Math.sign(b[1]-a[1])*d)/32)]);}
    if(cells.some(([cx,cy])=>['sea','river'].includes(mapData[cy]?.[cx])))continue;
    for(const [cx,cy] of cells)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)clearCell(cx+dx,cy+dy);
    if(path.length>1)roads.push(path);connected=true;break;
   }if(connected)break;
  }
 }
 // Existing story entrances and save IDs remain unchanged.
 // Small clearings make landmarks visible, with only short maintained paths.
 const restStops=[
  {id:'roadside-tea',name:'花かげ茶屋',cell:[23,53],type:'tea'},
  {id:'bridge-inn',name:'渡しの旅籠',cell:[35,39],type:'inn'},
  {id:'forest-tea',name:'木漏れ日の茶屋',cell:[47,29],type:'tea'},
  {id:'highland-inn',name:'峠の旅籠',cell:[40,14],type:'inn'}
 ].map(o=>({...o,point:center(o.cell)}));
 const open=(cx,cy,r=2)=>{for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(mapData[y]?.[x]&&!['sea','river'].includes(mapData[y][x]))mapData[y][x]='grass';};
 for(const p of Object.values(places))open(Math.floor(p.point[0]/32),Math.floor(p.point[1]/32),4);
 for(const g of guides)open(Math.floor(g.x/32),Math.floor(g.y/32),2);
 for(const stop of restStops){
  open(...stop.cell,2);
  const [x,y]=stop.point;
  mapData.decorations.push({kind:'wildflowers',x:x-20,y:y-18,width:40,height:24,foot:y+6,ground:true});
 }
 // Coastal access around the starting village.
 for(let y=59;y<=71;y++)for(let x=8;x<=30;x++){
  if(mapData[y][x]==='sea')continue;
  const half=y<60?13:y<65?10:y<69?8:5;
  mapData[y][x]=Math.abs(x-19)>=half-2?'sand':'grass';
 }
 // Shallow ford and a small bridge at the natural central crossing.
 for(let x=35;x<=39;x++)if(mapData[42]?.[x]==='river')mapData[42][x]='grass';
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

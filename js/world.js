// Original journey geography. 80 x 80 walking cells; never copied from ROM map data.
window.YK_WORLD=(()=>{
 const tileSize=32,size=2560,viewSize=640,revision=88;
 const center=([x,y])=>[x*32+16,y*32+16];
 const definitions={
  village:[[17,62],'鬼灯の里','里から北へ。西の山裾の道をたどって天妖の社へ。'],
  shrine:[[19,43],'天妖の社','南の分岐に戻り、東の大橋を渡ると海の入り江へ。'],
  cove:[[53,65],'海の入り江','砂浜沿いに北へ。東の森の入口が次の目的地。'],
  forest:[[62,44],'忘れの森','森から北へ進み、川の縦橋を渡って龍神の滝へ。'],
  waterfall:[[60,24],'龍神の滝','西の高原へ。月見の湯に寄り道し、峠を越えて九尾の祠へ。'],
  hotspring:[[44,22],'月見の湯','高原の湯宿。南の街道へ戻り、西の峠から北の祠へ。'],
  fox:[[23,13],'九尾の祠','山間の旅路の終点。雪峰と緑の山に囲まれた祠。']
 };
 const places=Object.fromEntries(Object.entries(definitions).map(([id,[cell,name,note]])=>[id,{point:center(cell),name,note}]));
 const start=center([17,65]),hub=start;
 const routes=[
  [[17,65],[21,65],[21,43],[19,43]],
  [[17,62],[21,62]],
  [[21,56],[47,56],[47,65],[53,65]],
  [[53,65],[62,65],[62,44]],
  [[62,44],[62,28],[60,28],[60,24]],
  [[60,28],[36,28],[36,19],[23,19],[23,13]],
  [[44,28],[44,22]]
 ];
 const roads=routes.map(r=>r.map(center));
 const outline=[[26,4],[43,5],[54,3],[64,7],[65,15],[72,22],[69,31],[74,40],[70,48],[72,57],[67,68],[61,74],[57,74],[57,69],[49,69],[47,76],[36,73],[24,76],[13,71],[9,66],[7,58],[10,49],[6,41],[9,31],[12,25],[9,19],[15,12],[19,7]];
 const inside=(x,y)=>{let hit=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){
  const [ax,ay]=outline[i],[bx,by]=outline[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;
 }return hit;};
 const snowy=(x,y)=>((x-49)/18)**2+((y-12)/13)**2<1;
 const mapData=Array.from({length:80},(_,y)=>Array.from({length:80},(_,x)=>{
  if(!inside(x,y))return 'sea';
  if([[2,0],[-2,0],[0,2],[0,-2]].some(([dx,dy])=>!inside(x+dx,y+dy)))return 'sand';
  return snowy(x,y)?'snow':'grass';
 }));
 const paint=(kind,cx,cy,rx,ry)=>{for(let y=Math.max(5,cy-ry);y<=Math.min(72,cy+ry);y++)for(let x=Math.max(6,cx-rx);x<=Math.min(70,cx+rx);x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<1&&mapData[y][x]!=='sea')mapData[y][x]=kind;};
 // Broad masses frame open basins, with deliberately authored passes below.
 for(const [x,y,rx,ry] of [[10,44,4,15],[30,43,5,17],[31,23,5,9],[22,8,9,3],[51,39,7,5],[52,16,11,5]])paint(y<20&&x>40?'snowMountain':'mountain',x,y,rx,ry);
 for(const p of [[13,54,4,4],[24,65,5,4],[23,35,4,5],[56,48,5,8],[64,43,4,7],[51,58,3,3],[16,17,4,5]])paint('forest',...p);
 paint('barren',34,66,5,5);paint('rockMountain',34,66,3,3);
 // Two continuous waterways; crossings are actual bridge decks, not grass gaps.
 for(let y=30;y<80;y++)if(mapData[y][40]!=='sea')mapData[y][40]='river';
 for(let x=40;x<=70;x++)mapData[35][x]='river';
 for(let y=24;y<=35;y++)mapData[y][59]='river';
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
 for(const [tx,ty] of [[15,61],[20,60],[45,63],[54,63],[58,46],[43,25]]){const [x,y]=center([tx,ty]);mapData.decorations.push({kind:'flowers',x,y,width:40,height:24,foot:y+24,ground:true});}
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
 return {start,hub,places,roads,guides,guideRoute,worldObjects,mapData,walkable,near,revision,tileAt,tileSize,size,viewSize,camera,draw,migratePosition};
})();

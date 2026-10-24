// Tenyo shrine: background scenery plus foot-sorted torii/actors on the 48x32 grid.
window.YK_TENYO=(()=>{
 // Source artwork cells are 32px. The established 75% map rendering maps
 // each source cell to 24 world units; collision, movement and debug share it.
 const CELL=48,WIDTH=1152,HEIGHT=768,ZOOM=1.5,WALK_CELL=24;
 let rows=["################################################","################################################","################################################","################.############..#...#############","#############.#.....#########..#...#############","############..#.....###...###......#..##########","############........###...###......#...#########","##########............................##########","##########............................##########","##########..............................########","##########..............................########","##########..............................########","###########............................#########","############...........................#########","##############.........................#########","##############.......................###########","###############...................#..###########","################.................###############","##################............##################","##################...##...##.###################","#######################...######################","#####################.......####################","#####################.......####################","#####################......#####################","#####################......#####################","####################.........###################","####################.........###################","####################.........###################","####################.........###################","####################........####################","#####################.......####################","#####################......#####################"];
 // JSON is the editable source; embedded rows provide a safe fallback until it loads.
 fetch('assets/maps/tenyo/walkability-48x32.json?v=16.1.21').then(r=>{if(!r.ok)throw Error('walkability fetch');return r.json()}).then(d=>{if(d.columns===48&&d.rows===32&&Array.isArray(d.grid)&&d.grid.length===32&&d.grid.every(r=>typeof r==='string'&&r.length===48&&/^[.#]+$/.test(r)))rows=d.grid;}).catch(e=>console.warn('Tenyo walkability fallback:',e));
 const spawn=[Math.floor(11.5*CELL/WALK_CELL)*WALK_CELL+WALK_CELL/2,Math.floor(14.5*CELL/WALK_CELL)*WALK_CELL+WALK_CELL/2];
 // Explicit authored contact cells; never infer occupancy from sprite bounds.
 const npcs=[{tileX:24,tileY:6,occupiedTiles:[[24,6]]},{tileX:29,tileY:15,occupiedTiles:[[29,15]]}].map(n=>({...n,x:(n.tileX+.5)*WALK_CELL,y:(n.tileY+.5)*WALK_CELL}));
 const chest=[12.5*CELL,12.5*CELL];
 // Authored visual group roots; collision remains the separate walkability JSON.
 const forestGroups=[{"name":"forest-north-cap","sourceFootY":144},{"name":"forest-north-east","sourceFootY":176},{"name":"forest-north-west","sourceFootY":192},{"name":"forest-east-upper","sourceFootY":224},{"name":"forest-east-side","sourceFootY":288},{"name":"forest-west-upper","sourceFootY":304},{"name":"forest-west-side","sourceFootY":512},{"name":"forest-east-middle","sourceFootY":512}];
 const imgs={},pending=[];
 let redraw=()=>{},failed=false;
 let readyPromise=null;
 function startLoading(){
 if(readyPromise)return readyPromise;
 for(const name of ['background','shrine','torii-base','torii-upper','trees-back','trees-front',...forestGroups.map(g=>g.name)]){
  const im=new Image();
  pending.push(new Promise((resolve,reject)=>{
   im.onload=()=>{resolve();redraw();};
   im.onerror=()=>{failed=true;reject(new Error('天妖の社の画像を読み込めません: '+name));redraw();};
  }));
  im.src='assets/maps/tenyo/layer-'+name+(['background','shrine'].includes(name)?'.webp?v=4':'.png?v=16.1.21');
  imgs[name]=im;
  if(im.complete&&im.naturalWidth)im.onload();
 }
 readyPromise=Promise.all(pending);
 // Images start eagerly; keep errors handled until the transition awaits them.
 readyPromise.catch(()=>{});
 return readyPromise;
 }
 function load(change){if(typeof change==='function')redraw=change;}
 let decodedReady=null;
 function whenReady(){return decodedReady??=startLoading().then(()=>Promise.all(Object.values(imgs).map(im=>im.decode?.())));}
 // All cutouts retain the original 1536x1024 canvas and origin.
 // The contact depth is authored separately from the image silhouettes.
 const TORII_CONTACT_FRONT=21*WALK_CELL;
 function drawLayer(c,name){const im=imgs[name];if(im?.complete&&im.naturalWidth)c.drawImage(im,0,0,WIDTH,HEIGHT);}
 function tile(x,y){const col=Math.floor(x/WALK_CELL),row=Math.floor(y/WALK_CELL);return rows[row]?.[col]||'#';}
 function blocked(x,y){return tile(x,y)!=='.';}
 function center(x,y){return [Math.floor(x/WALK_CELL)*WALK_CELL+WALK_CELL/2,Math.floor(y/WALK_CELL)*WALK_CELL+WALK_CELL/2];}
 function npcBlocked(x,y,residents=npcs){
  const col=Math.floor(x/WALK_CELL),row=Math.floor(y/WALK_CELL);
  return residents.some(n=>n.occupiedTiles.some(([tx,ty])=>tx===col&&ty===row));
 }
 function step(x,y,dx,dy,collision){
  if(Boolean(dx)===Boolean(dy))return {x,y};
  const [cx,cy]=center(x,y),nx=cx+Math.sign(dx)*WALK_CELL,ny=cy+Math.sign(dy)*WALK_CELL;
  if(blocked(nx,ny)||collision(nx,ny))return {x,y};
  return {x:nx,y:ny};
 }
 function exit(x,y){return y>=15.5*CELL&&x>=11*CELL&&x<=13*CELL;}
 function draw(c,state,drawHero,drawNpc,drawChest,debugGrid=false){
  // Save restoration can draw directly without going through an area transition.
  void whenReady().catch(()=>{});
  const cameraX=Math.max(0,Math.min(WIDTH-768/ZOOM,state.x-768/ZOOM/2));
  const cameraY=Math.max(0,Math.min(HEIGHT-768/ZOOM,state.y-768/ZOOM/2));
  c.save();c.setTransform(ZOOM,0,0,ZOOM,-cameraX*ZOOM,-cameraY*ZOOM);
  // Nearest-neighbor sampling preserves the disjoint cutout pixels even
  // during fractional camera movement; no alpha seam or duplicated edge.
  c.imageSmoothingEnabled=false;
  drawLayer(c,'background');
  // Wait for the complete partition set rather than showing partial scenery.
  if(!failed&&!Object.values(imgs).every(im=>im.complete&&im.naturalWidth)){c.restore();return;}
  drawLayer(c,'torii-base');
  drawLayer(c,'trees-back');
  drawLayer(c,'shrine');
  // state.x/y is the interpolated rendered foot supplied by the game camera.
  // At the contact edge itself, draw the gate before the actor (actor in front).
  const actors=[...forestGroups.map(g=>({kind:'forest',name:g.name,y:g.sourceFootY*.75})),{kind:'torii',y:TORII_CONTACT_FRONT},...(state.npcs||npcs).map((p,i)=>({...p,kind:'npc',i})),{x:state.x,y:state.y,kind:'hero'},{x:chest[0],y:chest[1],kind:'chest'}].sort((a,b)=>a.y-b.y);
  for(const a of actors){
   if(a.kind==='forest')drawLayer(c,a.name);
   else if(a.kind==='torii')drawLayer(c,'torii-upper');
   else if(a.kind==='npc')drawNpc(a.i,a.x,a.y);
   else if(a.kind==='hero')drawHero(a.x,a.y);
   else drawChest(a.x,a.y);
  }
  // The remaining southern forest is fixed foreground; surrounding upper
  // clusters share the rendered-foot queue instead of a horizontal cut.
  drawLayer(c,'trees-front');
  if(debugGrid){
   c.lineWidth=1/ZOOM;
   for(let row=0;row<rows.length;row++)for(let col=0;col<rows[row].length;col++){
    c.fillStyle=npcBlocked((col+.5)*WALK_CELL,(row+.5)*WALK_CELL,state.npcs||npcs)?'#ffd34f77':rows[row][col]==='.'?'#00e06a44':'#fa304033';
    c.fillRect(col*WALK_CELL,row*WALK_CELL,WALK_CELL,WALK_CELL);
    c.strokeStyle='#ffffff66';c.strokeRect(col*WALK_CELL,row*WALK_CELL,WALK_CELL,WALK_CELL);
   }
  }
  c.restore();
 }
 return {forestGroups,load,whenReady,failed:()=>failed,CELL,WALK_CELL,WIDTH,HEIGHT,spawn,npcs,npcBlocked,chest,blocked,exit,draw,tile,center,step};
})();
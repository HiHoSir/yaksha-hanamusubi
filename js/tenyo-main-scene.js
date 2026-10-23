// Tenyo shrine: background scenery plus foot-sorted torii/actors on the 48x32 grid.
window.YK_TENYO=(()=>{
 // Source artwork cells are 32px. The established 75% map rendering maps
 // each source cell to 24 world units; collision, movement and debug share it.
 const CELL=48,WIDTH=1152,HEIGHT=768,ZOOM=1.5,WALK_CELL=24;
 let rows=["################################################","################################################","################################################","################.############..#...#############","#############.#.....#########..#...#############","############..#.....###...###......#..##########","############........###...###......#...#########","##########............................##########","##########............................##########","##########..............................########","##########..............................########","##########..............................########","###########............................#########","############...........................#########","##############.........................#########","##############.......................###########","###############...................#..###########","################.................###############","##################............##################","##################...##...##.###################","#######################...######################","#####################.......####################","#####################.......####################","#####################......#####################","#####################......#####################","####################.........###################","####################.........###################","####################.........###################","####################.........###################","####################........####################","#####################.......####################","#####################......#####################"];
 // JSON is the editable source; embedded rows provide a safe fallback until it loads.
 fetch('assets/maps/tenyo/walkability-48x32.json?v=16.1.18').then(r=>{if(!r.ok)throw Error('walkability fetch');return r.json()}).then(d=>{if(d.columns===48&&d.rows===32&&Array.isArray(d.grid)&&d.grid.length===32&&d.grid.every(r=>typeof r==='string'&&r.length===48&&/^[.#]+$/.test(r)))rows=d.grid;}).catch(e=>console.warn('Tenyo walkability fallback:',e));
 const spawn=[Math.floor(11.5*CELL/WALK_CELL)*WALK_CELL+WALK_CELL/2,Math.floor(14.5*CELL/WALK_CELL)*WALK_CELL+WALK_CELL/2];
 const npcs=[{x:11.5*CELL,y:5.5*CELL},{x:14.5*CELL,y:7.5*CELL}];
 const chest=[12.5*CELL,12.5*CELL];
 const imgs={},pending=[];
 let redraw=()=>{},failed=false;
 for(const name of ['background','shrine','torii-base','torii-upper','trees-back','trees-front']){
  const im=new Image();
  pending.push(new Promise((resolve,reject)=>{
   im.onload=()=>{resolve();redraw();};
   im.onerror=()=>{failed=true;reject(new Error('天妖の社の画像を読み込めません: '+name));redraw();};
  }));
  im.src='assets/maps/tenyo/layer-'+name+(['background','shrine'].includes(name)?'.webp?v=4':'.png?v=16.1.18');
  imgs[name]=im;
  if(im.complete&&im.naturalWidth)im.onload();
 }
 const readyPromise=Promise.all(pending);
 // Images start eagerly; keep errors handled until the transition awaits them.
 readyPromise.catch(()=>{});
 function load(change){if(typeof change==='function')redraw=change;}
 function whenReady(){return readyPromise;}
 // All cutouts retain the original 1536x1024 canvas and origin.
 // The contact depth is authored separately from the image silhouettes.
 const TORII_CONTACT_FRONT=21*WALK_CELL;
 function drawLayer(c,name){const im=imgs[name];if(im.complete&&im.naturalWidth)c.drawImage(im,0,0,WIDTH,HEIGHT);}
 function tile(x,y){const col=Math.floor(x/WALK_CELL),row=Math.floor(y/WALK_CELL);return rows[row]?.[col]||'#';}
 function blocked(x,y){return tile(x,y)!=='.';}
 function center(x,y){return [Math.floor(x/WALK_CELL)*WALK_CELL+WALK_CELL/2,Math.floor(y/WALK_CELL)*WALK_CELL+WALK_CELL/2];}
 function step(x,y,dx,dy,collision){
  if(Boolean(dx)===Boolean(dy))return {x,y};
  const [cx,cy]=center(x,y),nx=cx+Math.sign(dx)*WALK_CELL,ny=cy+Math.sign(dy)*WALK_CELL;
  if(blocked(nx,ny)||collision(nx,ny))return {x,y};
  return {x:nx,y:ny};
 }
 function exit(x,y){return y>=15.5*CELL&&x>=11*CELL&&x<=13*CELL;}
 function draw(c,state,drawHero,drawNpc,drawChest,debugGrid=false){
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
  const actors=[{kind:'torii',y:TORII_CONTACT_FRONT},...npcs.map((p,i)=>({...p,kind:'npc',i})),{x:state.x,y:state.y,kind:'hero'},{x:chest[0],y:chest[1],kind:'chest'}].sort((a,b)=>a.y-b.y);
  for(const a of actors){
   if(a.kind==='torii')drawLayer(c,'torii-upper');
   else if(a.kind==='npc')drawNpc(a.i,a.x,a.y);
   else if(a.kind==='hero')drawHero(a.x,a.y);
   else drawChest(a.x,a.y);
  }
  // Southern foreground foliage covers actors; northern trees are already
  // behind them in trees-back (source rows 0..6, ending at y=224).
  drawLayer(c,'trees-front');
  if(debugGrid){
   c.lineWidth=1/ZOOM;
   for(let row=0;row<rows.length;row++)for(let col=0;col<rows[row].length;col++){
    c.fillStyle=rows[row][col]==='.'?'#00e06a44':'#fa304033';
    c.fillRect(col*WALK_CELL,row*WALK_CELL,WALK_CELL,WALK_CELL);
    c.strokeStyle='#ffffff66';c.strokeRect(col*WALK_CELL,row*WALK_CELL,WALK_CELL,WALK_CELL);
   }
  }
  c.restore();
 }
 return {load,whenReady,failed:()=>failed,CELL,WALK_CELL,WIDTH,HEIGHT,spawn,npcs,chest,blocked,exit,draw,tile,center,step};
})();
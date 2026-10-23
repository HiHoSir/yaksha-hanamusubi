// Tenyo shrine: background scenery plus foot-sorted torii/actors on the 48x32 grid.
window.YK_TENYO=(()=>{
 // Source artwork cells are 32px. The established 75% map rendering maps
 // each source cell to 24 world units; collision, movement and debug share it.
 const CELL=48,WIDTH=1152,HEIGHT=768,ZOOM=1.5,WALK_CELL=24;
 let rows=["################################################","################################################","################################################","################.############..#...#############","#############.#.....#########..#...#############","############..#.....###...###......#..##########","############........###...###......#...#########","##########............................##########","##########............................##########","##########..............................########","##########..............................########","##########..............................########","###########............................#########","############...........................#########","##############.........................#########","##############.......................###########","###############...................#..###########","################.................###############","##################............##################","##################...##...##.###################","#######################...######################","#####################.......####################","#####################.......####################","#####################......#####################","#####################......#####################","####################.........###################","####################.........###################","####################.........###################","####################.........###################","####################........####################","#####################.......####################","#####################......#####################"];
 // JSON is the editable source; embedded rows provide a safe fallback until it loads.
 fetch('assets/maps/tenyo/walkability-48x32.json?v=16.1.15').then(r=>{if(!r.ok)throw Error('walkability fetch');return r.json()}).then(d=>{if(d.columns===48&&d.rows===32&&Array.isArray(d.grid)&&d.grid.length===32&&d.grid.every(r=>typeof r==='string'&&r.length===48&&/^[.#]+$/.test(r)))rows=d.grid;}).catch(e=>console.warn('Tenyo walkability fallback:',e));
 const spawn=[Math.floor(11.5*CELL/WALK_CELL)*WALK_CELL+WALK_CELL/2,Math.floor(14.5*CELL/WALK_CELL)*WALK_CELL+WALK_CELL/2];
 const npcs=[{x:11.5*CELL,y:5.5*CELL},{x:14.5*CELL,y:7.5*CELL}];
 const chest=[12.5*CELL,12.5*CELL];
 const imgs=['background','trees','shrine','torii'].map(k=>{const im=new Image();im.src='assets/maps/tenyo/layer-'+k+'.webp?v=4';return im});
 // Torii pillars stand on the authored blocked cells in rows 19 and 20.
 // Only this depth anchor controls drawing; collision remains the user's JSON.
 // The front edge of row 20 is the boundary before actors pass behind the gate.
 const TORII_CONTACT_FRONT=21*WALK_CELL;
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
  if(imgs[0].complete&&imgs[0].naturalWidth)c.drawImage(imgs[0],0,0,WIDTH,HEIGHT);
  // The shrine covers the tree layer, and all actors cover the shrine.
  if(imgs[1].complete&&imgs[1].naturalWidth)c.drawImage(imgs[1],0,0,WIDTH,HEIGHT);
  if(imgs[2].complete&&imgs[2].naturalWidth)c.drawImage(imgs[2],0,0,WIDTH,HEIGHT);
  // state.x/y is the interpolated rendered foot supplied by the game camera.
  // At the contact edge itself, draw the gate before the actor (actor in front).
  const actors=[{kind:'torii',y:TORII_CONTACT_FRONT},...npcs.map((p,i)=>({...p,kind:'npc',i})),{x:state.x,y:state.y,kind:'hero'},{x:chest[0],y:chest[1],kind:'chest'}].sort((a,b)=>a.y-b.y);
  for(const a of actors){
   if(a.kind==='torii'){if(imgs[3].complete&&imgs[3].naturalWidth)c.drawImage(imgs[3],0,0,WIDTH,HEIGHT);}
   else if(a.kind==='npc')drawNpc(a.i,a.x,a.y);
   else if(a.kind==='hero')drawHero(a.x,a.y);
   else drawChest(a.x,a.y);
  }
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
 return {CELL,WALK_CELL,WIDTH,HEIGHT,spawn,npcs,chest,blocked,exit,draw,tile,center,step};
})();
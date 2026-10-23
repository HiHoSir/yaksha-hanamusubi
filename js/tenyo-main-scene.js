// Approved Tenyo shrine: three aligned image layers, 24x16 logical tiles.
window.YK_TENYO=(()=>{
 const CELL=48,WIDTH=1152,HEIGHT=768,ZOOM=1.5,WALK_CELL=24;
 let rows=["################################################","################################################","################################################","################.############..#...#############","#############.#.....#########..#...#############","############..#.....###...###......#..##########","############........###...###......#...#########","##########............................##########","##########............................##########","##########..............................########","##########..............................########","##########..............................########","###########............................#########","############...........................#########","##############.........................#########","##############.......................###########","###############...................#..###########","################.................###############","##################............##################","##################...#....##.###################","######################....######################","#####################.......####################","#####################.......####################","#####################......#####################","#####################......#####################","####################.........###################","####################.........###################","####################.........###################","####################.........###################","####################........####################","#####################.......####################","#####################......#####################"];
 // JSON is the editable source; embedded rows provide a safe fallback until it loads.
 fetch('assets/maps/tenyo/walkability-48x32.json?v=1').then(r=>{if(!r.ok)throw Error('walkability fetch');return r.json()}).then(d=>{if(d.columns===48&&d.rows===32&&Array.isArray(d.grid)&&d.grid.length===32&&d.grid.every(r=>typeof r==='string'&&r.length===48&&/^[.#]+$/.test(r)))rows=d.grid;}).catch(e=>console.warn('Tenyo walkability fallback:',e));
 const spawn=[11.5*CELL,14.5*CELL];
 const npcs=[{x:11.5*CELL,y:5.5*CELL},{x:14.5*CELL,y:7.5*CELL}];
 const chest=[12.5*CELL,12.5*CELL];
 const imgs=['background','trees','shrine'].map(k=>{const im=new Image();im.src='assets/maps/tenyo/layer-'+k+'.webp?v=3';return im});
 const roof=[[595,0],[948,0],[948,137],[943,151],[931,158],[884,158],[855,151],[827,138],[809,122],[790,113],[768,108],[746,113],[728,127],[710,143],[690,156],[613,158],[596,151],[589,140],[589,0]];
 function tile(x,y){const col=Math.floor(x/WALK_CELL),row=Math.floor(y/WALK_CELL);return rows[row]?.[col]||'#';}
 function blocked(x,y){return tile(x,y)!=='.';}
 function exit(x,y){return y>=15.5*CELL&&x>=11*CELL&&x<=13*CELL;}
 function draw(c,state,drawHero,drawNpc,drawChest){
  const cameraX=Math.max(0,Math.min(WIDTH-768/ZOOM,state.x-768/ZOOM/2));
  const cameraY=Math.max(0,Math.min(HEIGHT-768/ZOOM,state.y-768/ZOOM/2));
  c.save();c.setTransform(ZOOM,0,0,ZOOM,-cameraX*ZOOM,-cameraY*ZOOM);
  if(imgs[0].complete&&imgs[0].naturalWidth)c.drawImage(imgs[0],0,0,WIDTH,HEIGHT);
  if(imgs[2].complete&&imgs[2].naturalWidth)c.drawImage(imgs[2],0,0,WIDTH,HEIGHT);
  const actors=[...npcs.map((p,i)=>({...p,kind:'npc',i})),{x:state.x,y:state.y,kind:'hero'},{x:chest[0],y:chest[1],kind:'chest'}].sort((a,b)=>a.y-b.y);
  for(const a of actors){if(a.kind==='npc')drawNpc(a.i,a.x,a.y);else if(a.kind==='hero')drawHero(a.x,a.y);else drawChest(a.x,a.y);}
  if(imgs[1].complete&&imgs[1].naturalWidth)c.drawImage(imgs[1],0,0,WIDTH,HEIGHT);
  if(imgs[2].complete&&imgs[2].naturalWidth){c.save();c.beginPath();roof.forEach(([x,y],i)=>{if(!i)c.moveTo(x*.75,y*.75);else c.lineTo(x*.75,y*.75)});c.closePath();c.clip();c.drawImage(imgs[2],0,0,WIDTH,HEIGHT);c.restore();}
  c.restore();
 }
 return {CELL,WIDTH,HEIGHT,spawn,npcs,chest,blocked,exit,draw,tile};
})();
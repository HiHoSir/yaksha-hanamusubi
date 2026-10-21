// Authored-world adapter. Materials/objects remain unchanged; topology is explicit.
window.YK_FIELD_ELEVATION=(()=>{
 const E=window.YK_ELEVATION;
 function prepare(m,geography){
  m.ramps=m.map(r=>r.map(()=>null));m.cornerCut=30;m.elevationEnabled=true;m.elevationRise=20;
  m.occupiedTiles=new Set(m.decorations.flatMap(o=>o.occupiedTiles.map(c=>c.join(','))));
  const water=t=>['sea','river'].includes(t),set=(x,y,h)=>{if(m[y]?.[x]&&!water(m[y][x]))m.heights[y][x]=h;};
  // Remove isolated one-cell spikes from the old editor heights before
  // joining the travel network. Keep large authored terrace/mountain regions.
  for(let pass=0;pass<2;pass++){
   const old=m.heights;
   m.heights=old.map((row,y)=>row.map((h,x)=>{
    if(water(m[y][x]))return 0;const values=[];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(m[y+dy]?.[x+dx]&&!water(m[y+dy][x+dx]))values.push(old[y+dy][x+dx]);
    return values.sort((a,b)=>a-b)[Math.floor(values.length/2)]??h;
   }));
  }
  // Keep authored mountain/terrace heights away from the existing travel network.
  // Reserve level corridors including approaches and bridge banks; never change tiles.
  const protectedCells=new Set();
  function corridor(x,y,r=1){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){set(x+dx,y+dy,0);protectedCells.add((x+dx)+','+(y+dy));}}
  for(const route of geography.roads)for(const [x,y] of route)corridor(x,y);
  for(const cell of Object.values(geography.places))corridor(...cell,2);
  for(const stop of geography.restStops)corridor(...stop.cell,2);
  for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++)if(water(m[y][x]))m.heights[y][x]=0;
  // Two deliberate, straight approaches: northern shrine 0→1→2, waterfall 0→1.
  const terraces=[{x:40,from:3,to:7,h:2},{x:40,from:9,to:9,h:1},{x:67,from:18,to:20,h:1}];
  for(const t of terraces)for(let y=t.from;y<=t.to;y++)for(let x=t.x-1;x<=t.x+1;x++)set(x,y,t.h);
  for(const [cx,y,h] of [[40,10,0],[40,8,1],[67,21,0]])for(let x=cx-1;x<=cx+1;x++){set(x,y,h);if(!water(m[y][x]))m.ramps[y][x]='n';}
  // Foundations are authored contact cells, never sprite bounds. Equalize a
  // multi-cell foundation; route reservations win except explicit raised entries.
  for(const o of m.decorations){
   const cells=o.contactTiles||[],valid=cells.filter(([x,y])=>m[y]?.[x]&&!water(m[y][x]));
   if(!valid.length||o.ground)continue;
   const raisedEntry=['fox','waterfall'].includes(o.destination),nearRoute=valid.some(([x,y])=>protectedCells.has(x+','+y));
   const h=raisedEntry?(o.destination==='fox'?2:1):nearRoute?0:Math.min(...valid.map(([x,y])=>m.heights[y][x]));
   for(const [x,y] of valid){set(x,y,h);m.ramps[y][x]=null;}
   o.supportHeight=h;
  }
  // Simplify the former mountain cluster at field (28,35) to one terrace
  // level. Retain lowland corridors, water, ramps and authored materials.
  // No level-2/3 stacks remain inside this local footprint.
  for(let y=31;y<=39;y++)for(let x=23;x<=32;x++){
   if(!water(m[y]?.[x])&&m.heights[y][x]>1)m.heights[y][x]=1;
  }
  m.cornerProtected=new Set(m.decorations.flatMap(o=>(o.contactTiles||[]).map(c=>c.join(','))));
  // Immutable topology gets a cache shared by rendering and collision.
  E.prepare(m);
  // Find safe cliff edges between reachable lowland and isolated upper ground.
  const initialQueue=[[37,71]],initialSeen=new Set(['37,71']);
  for(let i=0;i<initialQueue.length;i++){const [x,y]=initialQueue[i];for(const [dx,dy] of Object.values(E.dirs)){
   const nx=x+dx,ny=y+dy,key=nx+','+ny;
   if(!initialSeen.has(key)&&E.canMove(m,x*32+16,y*32+16,nx*32+16,ny*32+16)){initialSeen.add(key);initialQueue.push([nx,ny]);}
  }}
  m.ladders=[];
  const candidates=[];
  for(const key of initialSeen){const [x,y]=key.split(',').map(Number),uy=y-1;
   if(uy<1||x<1||x>=m[0].length-1||!E.walkable(m,x,y)||!E.walkable(m,x,uy))continue;
   if(initialSeen.has(x+','+uy)||m.ramps[y]?.[x]||m.ramps[uy]?.[x])continue;
   if(E.level(m,x,uy)-E.level(m,x,y)!==1)continue;
   if(E.outline(m,x,y).cuts.length||E.outline(m,x,uy).cuts.length)continue;
   if(!E.pointWalkable(m,x*32+16,y*32+16)||!E.pointWalkable(m,x*32+16,uy*32+16))continue;
   candidates.push({x,y,uy});
  }
  candidates.sort((a,b)=>a.y-b.y||a.x-b.x);
  for(const q of candidates){if(m.ladders.length>=6)break;
   if(m.ladders.some(l=>Math.hypot(l.lower[0]-q.x,l.lower[1]-q.y)<7))continue;
   m.ladders.push({lower:[q.x,q.y],upper:[q.x,q.uy]});
  }
  const queue=[[37,71]],seen=new Set(['37,71']);
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of Object.values(E.dirs)){
   const nx=x+dx,ny=y+dy,key=nx+','+ny;
   if(!seen.has(key)&&E.canMove(m,x*32+16,y*32+16,nx*32+16,ny*32+16)){seen.add(key);queue.push([nx,ny]);}
  }}m.travelReachable=seen;
  return m;
 }
 return {prepare};
})();

// Shared 32px terrain contract. Material never determines elevation or connectivity.
window.YK_ELEVATION=(()=>{
 const CELL=32,dirs={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]};
 const inside=(m,x,y)=>x>=0&&y>=0&&y<m.length&&x<m[0].length;
 function level(m,tx,ty,u=.5,v=.5){
  if(!inside(m,tx,ty))return 0;
  const base=m.heights?.[ty]?.[tx]||0,r=m.ramps?.[ty]?.[tx];
  return base+(r==='n'?1-v:r==='s'?v:r==='e'?u:r==='w'?1-u:0);
 }
 function height(m,x,y){const tx=Math.floor(x/CELL),ty=Math.floor(y/CELL);return level(m,tx,ty,x/CELL-tx,y/CELL-ty);}
 function walkable(m,x,y){return inside(m,x,y)&&!['sea','river'].includes(m[y][x])&&!m.occupiedTiles?.has(x+','+y);}
 // Test BOTH ends of a shared edge: a ramp's side is not a traversable cliff.
 function connected(m,x,y,nx,ny){
  if(!walkable(m,x,y)||!walkable(m,nx,ny)||Math.abs(nx-x)+Math.abs(ny-y)!==1)return false;
  const dx=nx-x,dy=ny-y;
  for(const t of [0,.5,1]){
   const a=dx?level(m,x,y,dx>0?1:0,t):level(m,x,y,t,dy>0?1:0);
   const b=dx?level(m,nx,ny,dx>0?0:1,t):level(m,nx,ny,t,dy>0?0:1);
   if(Math.abs(a-b)>1e-6)return false;
  }return true;
 }
 function validate(m){
  const errors=[];for(let y=0;y<m.length;y++)for(let x=0;x<m[0].length;x++){
   const h=m.heights?.[y]?.[x],r=m.ramps?.[y]?.[x];
   if(!Number.isInteger(h)||h<0)errors.push('height '+x+','+y);
   if(r){const d=dirs[r];if(!d){errors.push('ramp direction '+x+','+y);continue;}
    for(const sign of [-1,1])if(!connected(m,x,y,x+d[0]*sign,y+d[1]*sign))errors.push('ramp endpoint '+x+','+y);
   }
  }return errors;
 }
 function fixture(material='mixed'){
  const m=Array.from({length:20},(_,y)=>Array.from({length:16},(_,x)=>x===0||x===15||y===0||y===19?'sea':material==='mixed'?(x<6?'grass':x<11?'sand':'snow'):material));
  m.heights=m.map(r=>r.map(()=>0));m.ramps=m.map(r=>r.map(()=>null));m.roads=new Set();
  for(let y=5;y<=11;y++)for(let x=3;x<=12;x++)m.heights[y][x]=1;
  for(let y=5;y<=8;y++)for(let x=6;x<=10;x++)m.heights[y][x]=2;
  m.heights[9][3]=m.heights[10][3]=0; // concave corner
  m.ramps[12][7]='n';m.ramps[9][8]='n';m.ramps[10][13]='w';
  for(let y=10;y<=17;y++)m.roads.add('7,'+y);
  for(let y=7;y<=10;y++)m.roads.add('8,'+y);
  for(let x=12;x<=14;x++)m.roads.add(x+',10');
  m.objects=[{kind:'trees',x:5*32+16,y:7*32+16,width:32,height:32,occupiedTiles:[[5,7]]},
   {kind:'shrine',x:10*32,y:8*32,width:64,height:64,occupiedTiles:[[9,6],[10,6],[9,7],[10,7]]}];
  m.occupiedTiles=new Set(m.objects.flatMap(o=>o.occupiedTiles.map(p=>p.join(','))));
  m.spawn=[7*32+16,15*32+16];return m;
 }
 return {CELL,dirs,inside,level,height,walkable,connected,validate,fixture};
})();

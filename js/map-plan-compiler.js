/* Generic semantic map-plan compiler: deterministic 32px cells, not image recognition. */
(function(root){
'use strict';
const terrains=['grass','forest','mountain','rockMountain','river','sea','sand','road','wood','wall'];
function compile(spec){
 const w=Number(spec.width),h=Number(spec.height),seed=Number(spec.seed)||1;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<4||h<4||w>128||h>128)throw Error('map size must be 4..128');
 const allowed=new Set(terrains),base=spec.base||'grass';
 if(!allowed.has(base))throw Error('unknown base terrain');
 let rng=seed>>>0;const rand=()=>{rng=(1664525*rng+1013904223)>>>0;return rng/4294967296};
 const tiles=Array.from({length:h},()=>Array(w).fill(base)),height=Array.from({length:h},()=>Array(w).fill(0));
 const inside=(x,y)=>x>=0&&y>=0&&x<w&&y<h;
 const put=(x,y,t)=>{if(inside(x,y))tiles[y][x]=t};
 const zones=Array.isArray(spec.zones)?spec.zones:[];
 for(const z of zones){
  if(!allowed.has(z.terrain))throw Error('unknown zone terrain');
  const cx=Math.round(Number(z.x)*w),cy=Math.round(Number(z.y)*h),rx=Math.max(1,Math.round(Number(z.rx)*w)),ry=Math.max(1,Math.round(Number(z.ry)*h));
  if(![cx,cy,rx,ry].every(Number.isFinite))throw Error('invalid zone');
  for(let y=Math.max(0,cy-ry);y<=Math.min(h-1,cy+ry);y++)for(let x=Math.max(0,cx-rx);x<=Math.min(w-1,cx+rx);x++){
   const noise=(rand()-.5)*.23,dist=((x-cx)/rx)**2+((y-cy)/ry)**2;
   if(dist+noise<=1){put(x,y,z.terrain);if(z.level!==undefined)height[y][x]=Math.max(0,Math.min(8,Math.round(Number(z.level)||0)));}
  }
 }
 const paths=Array.isArray(spec.paths)?spec.paths:[];
 for(const p of paths){
  if(!allowed.has(p.terrain))throw Error('unknown path terrain');
  const points=p.points||[];if(points.length<2)continue;
  const width=Math.max(1,Math.min(5,Math.round(Number(p.width)||1)));
  for(let i=1;i<points.length;i++){
   let x0=Math.round(Number(points[i-1][0])*Math.max(1,w-1)),y0=Math.round(Number(points[i-1][1])*Math.max(1,h-1));
   const x1=Math.round(Number(points[i][0])*Math.max(1,w-1)),y1=Math.round(Number(points[i][1])*Math.max(1,h-1));
   if(![x0,y0,x1,y1].every(Number.isFinite))throw Error('invalid path');
   let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy;
   for(let n=0;n<w+h+1;n++){
    for(let yy=y0-Math.floor(width/2);yy<y0+Math.ceil(width/2);yy++)for(let xx=x0-Math.floor(width/2);xx<x0+Math.ceil(width/2);xx++)put(xx,yy,p.terrain);
    if(x0===x1&&y0===y1)break;
    const e=2*err;if(e>-dy){err-=dy;x0+=sx}if(e<dx){err+=dx;y0+=sy}
   }
  }
 }
 const blocks=new Set(['forest','mountain','rockMountain','sea','river','wall']);
 const start=(spec.start||[.05,.5]).map((v,i)=>Math.round(Number(v)*(i?h-1:w-1)));
 const end=(spec.end||[.95,.5]).map((v,i)=>Math.round(Number(v)*(i?w-1:h-1)));
 function walk(x,y){return inside(x,y)&&!blocks.has(tiles[y][x])}
 const seen=new Set(),q=[];if(walk(...start)){q.push(start);seen.add(start.join(','))}
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=a+','+b;if(walk(a,b)&&!seen.has(k)){seen.add(k);q.push([a,b])}}}
 const errors=[];if(!walk(...start))errors.push('start blocked');if(!walk(...end))errors.push('end blocked');else if(!seen.has(end.join(',')))errors.push('start/end disconnected');
 let transitions=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(x+1<w&&Math.abs(height[y][x]-height[y][x+1])>1)transitions++;if(y+1<h&&Math.abs(height[y][x]-height[y+1][x])>1)transitions++}
 if(transitions)errors.push(transitions+' steep elevation edges require cliff/ramp review');
 return {version:1,kind:spec.kind||'field',tileSize:32,width:w,height:h,seed,tiles,elevation:height,start,end,validation:{pass:errors.length===0,errors,reachableCells:seen.size},source:'semantic-plan; requires visual review'};
}
root.YK_MAP_PLAN={compile,terrains};
})(window);

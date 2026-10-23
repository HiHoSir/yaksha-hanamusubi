((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CYAMISE_RULES=api;})(globalThis,()=>{
'use strict';
// Hand-authored movement cells. Contact occupancy is never computed from artwork.
const width=12,height=8,tileSize=32,origin={x:11.5,y:2.5};
const objects=[];
for(const x of [2,7])for(const [row,type] of [[3,'bench-back'],[4,'table'],[5,'bench-front']])objects.push({id:type+'-'+x,type,occupiedTiles:[[x,row],[x+1,row]],depth:origin.y+(row+1)*tileSize});
const occupiedTiles=[];
for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(y<2||x===0||x>=10||(y===2&&(x<4||x>6)))occupiedTiles.push([x,y]);
for(const o of objects)occupiedTiles.push(...o.occupiedTiles);
const blocked=new Set(occupiedTiles.map(p=>p.join(',')));
const walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<width&&y>=0&&y<height&&!blocked.has(x+','+y);
const foot=(x,y)=>({x:origin.x+x*tileSize+tileSize/2,y:origin.y+y*tileSize+tileSize/2});
function step(p,dx,dy){if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)return null;return walkable(p.x+dx,p.y+dy)?{x:p.x+dx,y:p.y+dy}:null;}
function path(start,end){if(!walkable(start.x,start.y)||!walkable(end.x,end.y))return null;const key=p=>p.x+','+p.y,queue=[start],seen=new Map([[key(start),null]]);for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===key(end)){const result=[];for(let n=p;seen.get(key(n));n=seen.get(key(n)))result.push(n);return result.reverse();}for(const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]]){const n=step(p,dx,dy);if(n&&!seen.has(key(n))){seen.set(key(n),p);queue.push(n);}}}return null;}
return {width,height,tileSize,origin,objects,occupiedTiles,walkable,foot,step,path};
});

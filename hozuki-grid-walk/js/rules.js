((root,factory)=>{const layout=typeof module==='object'&&module.exports?require('../assets/layout.json'):root.HOZUKI_LAYOUT;const api=factory(layout);if(typeof module==='object'&&module.exports)module.exports=api;else root.HOZUKI_RULES=api;})(globalThis,L=>{
'use strict';
const width=L.width,height=L.height,tileSize=L.tileSize,spawn={x:L.spawn[0],y:L.spawn[1]};
const sprite={inn:0,shop:1,tea:2,'home-west':3,'home-southwest':3,'home-south':3,shrine:4,well:6,bench:7,pot:8,garden:9};
const objects=L.objects.map(o=>({...o,sprite:o.kind==='tree'?5:sprite[o.id],layer:'background'}));
const occupiedTiles=L.occupiedTiles,blocked=new Set(occupiedTiles.map(p=>p.join(','))),objectOwners=new Map();for(const o of objects)for(const p of o.occupiedTiles){const k=p.join(',');if(!objectOwners.has(k))objectOwners.set(k,[]);objectOwners.get(k).push(o.id);}
const walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<width&&y<height&&!blocked.has(x+','+y);
const canStep=(p,dx,dy)=>Number.isInteger(dx)&&Number.isInteger(dy)&&Math.abs(dx)+Math.abs(dy)===1&&walkable(p.x,p.y)&&walkable(p.x+dx,p.y+dy);
const center=(x,y)=>({x:(x+.5)*32,y:(y+.5)*32});
function path(start,end){if(!walkable(start.x,start.y)||!walkable(end.x,end.y))return null;const key=p=>p.x+','+p.y,q=[start],prev=new Map([[key(start),null]]);for(let i=0;i<q.length;i++){const p=q[i];if(key(p)===key(end)){const out=[];for(let n=p;prev.get(key(n));n=prev.get(key(n)))out.push(n);return out.reverse();}for(const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]])if(canStep(p,dx,dy)){const n={x:p.x+dx,y:p.y+dy},k=key(n);if(!prev.has(k)){prev.set(k,p);q.push(n);}}}return null;}
const names={inn:'旅人の宿',shop:'よろず屋',tea:'茶店','home-west':'西の家','home-southwest':'南西の家','home-south':'南の家',shrine:'里の小社',south:'南入口',north:'北出口','well-front':'井戸の前','bench-front':'腰掛けの前','bridge-upper':'上の橋の東岸','bridge-lower':'下の橋の東岸'};
const targets=Object.entries(L.targets).map(([id,cell])=>({id,name:names[id]||id,cell}));
return {width,height,tileSize,spawn,objects,occupiedTiles,objectOwners,walkable,canStep,center,path,targets,layout:L};
});

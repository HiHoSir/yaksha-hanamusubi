((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HOZUKI_RULES=api;})(globalThis,()=>{
'use strict';
const width=24,height=20,tileSize=32,spawn={x:11,y:18};
const cells=(x,y,w,h)=>Array.from({length:h},(_,dy)=>Array.from({length:w},(_,dx)=>[x+dx,y+dy])).flat();
const buildings=[
{id:'inn',name:'旅人の宿',sprite:0,rect:[3,11,3,2],approach:[4,13]},
{id:'shop',name:'よろず屋',sprite:1,rect:[7,11,2,2],approach:[8,13]},
{id:'teahouse',name:'茶店',sprite:2,rect:[14,8,3,2],approach:[15,10]},
{id:'osumiHome',name:'お澄の家',sprite:3,rect:[3,5,2,2],approach:[4,7]},
{id:'farmHome',name:'畑守りの家',sprite:3,rect:[10,3,2,2],approach:[11,5]},
{id:'weaverHome',name:'織り手の家',sprite:3,rect:[14,3,2,2],approach:[15,5]},
{id:'riverHome',name:'川辺の仕事小屋',sprite:3,rect:[16,12,2,2],approach:[17,14]},
{id:'shrine',name:'里の小社',sprite:4,rect:[21,3,2,2],approach:[22,5]}
].map(o=>({...o,layer:'background',occupiedTiles:cells(...o.rect)}));
// Whole graphics occupy their authored cells. No trunk-only collision or overhang.
const trees=[['cherry-center',5,13,9],['cherry-west',5,2,7],['green-north',6,7,4],['cherry-east',5,18,3],['cherry-southwest',5,2,10],['green-southeast',6,15,13]].map(([id,sprite,x,y])=>({id,sprite,rect:[x,y,1,1],layer:'background',occupiedTiles:[[x,y]]}));
const props=[{id:'well',sprite:7,rect:[9,10,1,1]},{id:'garden-west',sprite:8,rect:[7,6,1,1]},{id:'garden-north',sprite:8,rect:[13,5,1,1]},{id:'garden-south',sprite:8,rect:[6,10,1,1]}].map(o=>({...o,layer:'background',occupiedTiles:cells(...o.rect)}));
const bridges=[{id:'south',rect:[10,14,4,4],axis:'ns'},{id:'east',rect:[18,5,4,2],axis:'ew'}];
const inRect=(x,y,[l,t,w,h])=>x>=l&&x<l+w&&y>=t&&y<t+h;
const bridgeDeck=(x,y)=>inRect(x,y,[11,14,2,4])||inRect(x,y,[18,6,4,1]);
const bridgeRails=[...cells(10,14,1,4),...cells(13,14,1,4),...cells(18,5,4,1)];
const railSet=new Set(bridgeRails.map(p=>p.join(',')));
const river=(x,y)=>(x>=19&&x<=20&&y<=16)||(y>=15&&y<=16);
const forest=(x,y)=>y<2&&!(x>=11&&x<=12)||x<2||x>=23||y>=17&&(x<11||x>12);
const ramp=(x,y)=>y>=7&&y<=9&&(x>=10&&x<=11||x>=17&&x<=18);
const cliff=(x,y)=>!river(x,y)&&!ramp(x,y)&&((x<10&&y===8)||(x>=12&&y===7));
const objects=[...buildings,...trees,...props];const objectOwners=new Map();for(const o of objects)for(const p of o.occupiedTiles){const k=p.join(',');if(!objectOwners.has(k))objectOwners.set(k,[]);objectOwners.get(k).push(o.id);}
const occupiedTiles=[];for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(objectOwners.has(x+','+y)||railSet.has(x+','+y)||!bridgeDeck(x,y)&&(forest(x,y)||river(x,y)||cliff(x,y)))occupiedTiles.push([x,y]);
const blocked=new Set(occupiedTiles.map(p=>p.join(',')));
const walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<width&&y>=0&&y<height&&!blocked.has(x+','+y);
const center=(x,y)=>({x:(x+.5)*32,y:(y+.5)*32});
function surfaceHeight(x,y,fx=.5,fy=.5){return ramp(x,y)?32*(10-y-fy)/3:y<(x<10?8:7)?32:0;}
function canStep(p,dx,dy){if(!walkable(p.x,p.y)||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1||!walkable(p.x+dx,p.y+dy))return false;for(const f of [0,.5,1]){const a=surfaceHeight(p.x,p.y,dx?dx>0?1:0:f,dy?dy>0?1:0:f),b=surfaceHeight(p.x+dx,p.y+dy,dx?dx>0?0:1:f,dy?dy>0?0:1:f);if(Math.abs(a-b)>1e-6)return false;}return true;}
function path(start,end){if(!walkable(start.x,start.y)||!walkable(end.x,end.y))return null;const key=p=>p.x+','+p.y,q=[start],prev=new Map([[key(start),null]]);for(let i=0;i<q.length;i++){const p=q[i];if(key(p)===key(end)){const out=[];for(let n=p;prev.get(key(n));n=prev.get(key(n)))out.push(n);return out.reverse();}for(const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]])if(canStep(p,dx,dy)){const n={x:p.x+dx,y:p.y+dy},k=key(n);if(!prev.has(k)){prev.set(k,p);q.push(n);}}}return null;}
const targets=[{id:'north',name:'北出口',cell:[11,1]},{id:'south',name:'南入口',cell:[11,18]},...buildings.map(o=>({id:o.id,name:o.name,cell:o.approach})),{id:'well-front',name:'井戸の前',cell:[9,11]},{id:'central-ramp',name:'中央の坂',cell:[11,8]},{id:'east-ramp',name:'川沿いの坂',cell:[18,8]}];
return {width,height,tileSize,spawn,buildings,trees,props,bridges,objects,occupiedTiles,objectOwners,walkable,center,canStep,path,targets,river,forest,cliff,ramp,bridgeDeck,bridgeRails,surfaceHeight};
});

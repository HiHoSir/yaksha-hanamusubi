((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HOZUKI_RULES=api;})(globalThis,()=>{
'use strict';
const width=48,height=40,tileSize=32,spawn={x:24,y:37};
// Authored world-cell contracts. No artwork dimensions or alpha enter collision.
const cells=(x,y,w,h)=>Array.from({length:h},(_,dy)=>Array.from({length:w},(_,dx)=>[x+dx,y+dy])).flat();
const buildings=[
 {id:'inn',name:'旅人の宿',sprite:0,rect:[6,21,8,6],approach:[10,27]},
 {id:'shop',name:'よろず屋',sprite:1,rect:[15,22,7,5],approach:[18,27]},
 {id:'teahouse',name:'茶店',sprite:2,rect:[29,16,8,5],approach:[32,21]},
 {id:'osumiHome',name:'お澄の家',sprite:3,rect:[9,10,7,5],approach:[12,15]},
 {id:'farmHome',name:'畑守りの家',sprite:3,rect:[20,6,7,5],approach:[23,11]},
 {id:'weaverHome',name:'織り手の家',sprite:3,rect:[29,6,7,5],approach:[32,11]},
 {id:'riverHome',name:'川辺の仕事小屋',sprite:3,rect:[32,24,6,4],approach:[35,28]},
 // Shrine sprite includes its background platform and walkable south steps.
 {id:'shrine',name:'里の小社',sprite:4,rect:[42,5,5,8],solid:[43,5,4,5],approach:[44,12],landing:[44,10]}
].map(o=>({...o,layer:'background',occupiedTiles:cells(...(o.solid||o.rect))}));
const trees=[
 {id:'cherry-center',sprite:5,cell:[26,18],size:[5,5]},
 {id:'cherry-west',sprite:5,cell:[7,16],size:[4,4]},
 {id:'green-north',sprite:6,cell:[16,9],size:[4,4]},
 {id:'cherry-east',sprite:5,cell:[37,8],size:[4,4]},
 {id:'cherry-southwest',sprite:5,cell:[6,20],size:[4,4]},
 {id:'green-southeast',sprite:6,cell:[30,28],size:[4,4]}
].map(o=>({...o,layer:'depth',occupiedTiles:[o.cell]}));
const props=[
 {id:'well',sprite:7,rect:[20,19,2,2]},
 {id:'garden-west',sprite:8,rect:[17,11,3,2]},
 {id:'garden-north',sprite:8,rect:[27,11,4,2]},
 {id:'garden-south',sprite:8,rect:[12,18,4,2]}
].map(o=>({...o,layer:'background',occupiedTiles:cells(...o.rect)}));
const bridges=[{id:'south',rect:[21,29,6,6],axis:'ns'},{id:'east',rect:[38,11,5,3],axis:'ew'}];
const inRect=(x,y,[l,t,w,h])=>x>=l&&x<l+w&&y>=t&&y<t+h;
const isBridge=(x,y)=>bridges.some(b=>inRect(x,y,b.rect));
const bridgeDeck=(x,y)=>inRect(x,y,[23,29,2,6])||inRect(x,y,[38,12,5,1]);
const bridgeRails=[...cells(21,29,2,6),...cells(25,29,2,6),...cells(38,11,5,1),...cells(38,13,5,1)];
const railSet=new Set(bridgeRails.map(p=>p.join(',')));
const river=(x,y)=>(x>=38&&x<=41&&y<=32)||(y>=30&&y<=33);
const forest=(x,y)=>y<4&&!(x>=22&&x<=25)||x<3||x>=47||y>=34&&(x<21||x>26);
const ramp=(x,y)=>y>=15&&y<=19&&(x>=21&&x<=23||x>=35&&x<=37);
const cliff=(x,y)=>!river(x,y)&&!ramp(x,y)&&((x<21&&y===16)||(x>=24&&(y===14||y===15)));
const objects=[...buildings,...props,...trees];
const objectOwners=new Map();for(const o of objects)for(const p of o.occupiedTiles){const k=p.join(',');if(!objectOwners.has(k))objectOwners.set(k,[]);objectOwners.get(k).push(o.id);}
const occupiedTiles=[];for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(objectOwners.has(x+','+y)||railSet.has(x+','+y)||!bridgeDeck(x,y)&&(forest(x,y)||river(x,y)||cliff(x,y)))occupiedTiles.push([x,y]);
const blocked=new Set(occupiedTiles.map(p=>p.join(',')));
const walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<width&&y>=0&&y<height&&!blocked.has(x+','+y);
const center=(x,y)=>({x:(x+.5)*32,y:(y+.5)*32});
function surfaceHeight(x,y,fx=.5,fy=.5){let h=ramp(x,y)?80*(20-y-fy)/5:y<(x<21?16:x<=23||x>=35&&x<=37?15:14)?80:0;if((x===44||x===45)&&y>=10&&y<=12)h+=32*(13-y-fy)/3;return h;}
function canStep(p,dx,dy){if(!walkable(p.x,p.y)||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1||!walkable(p.x+dx,p.y+dy))return false;for(const f of [0,.5,1]){const a=surfaceHeight(p.x,p.y,dx?dx>0?1:0:f,dy?dy>0?1:0:f),b=surfaceHeight(p.x+dx,p.y+dy,dx?dx>0?0:1:f,dy?dy>0?0:1:f);if(Math.abs(a-b)>1e-6)return false;}return true;}
function path(start,end){if(!walkable(start.x,start.y)||!walkable(end.x,end.y))return null;const key=p=>p.x+','+p.y,q=[start],prev=new Map([[key(start),null]]);for(let i=0;i<q.length;i++){const p=q[i];if(key(p)===key(end)){const out=[];for(let n=p;prev.get(key(n));n=prev.get(key(n)))out.push(n);return out.reverse();}for(const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]])if(canStep(p,dx,dy)){const n={x:p.x+dx,y:p.y+dy},k=key(n);if(!prev.has(k)){prev.set(k,p);q.push(n);}}}return null;}
const targets=[{id:'north',name:'北出口',cell:[24,1]},{id:'south',name:'南入口',cell:[24,37]},...buildings.map(o=>({id:o.id,name:o.name,cell:o.approach})),{id:'shrine-landing',name:'小社の階段上',cell:[44,10]},{id:'well-front',name:'井戸の前',cell:[20,21]},{id:'central-ramp',name:'中央の坂',cell:[22,18]},{id:'east-ramp',name:'川沿いの坂',cell:[37,18]}];
return {width,height,tileSize,spawn,buildings,trees,props,bridges,objects,occupiedTiles,objectOwners,walkable,center,canStep,path,targets,river,forest,cliff,ramp,isBridge,bridgeDeck,bridgeRails,surfaceHeight};
});

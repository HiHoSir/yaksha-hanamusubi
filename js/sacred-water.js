/* Isolated sanctuary spike. Never reads or writes main-game save storage. */
(async()=>{'use strict';
 const cv=document.getElementById('scene'),c=cv.getContext('2d'),status=document.getElementById('status');
 try{
 const response=await fetch('assets/maps/sacred-water-v1/scene.json');if(!response.ok)throw Error('scene '+response.status);const data=await response.json();
 const E=window.YK_ELEVATION,m=data.tiles;m.heights=data.heights;m.cornerCut=data.cornerCut;m.occupiedTiles=new Set(data.occupiedTiles.map(p=>p.join(',')));E.prepare(m);
 const sources=[...new Set(['assets/maps/sacred-water-v1/water-0.png','assets/maps/sacred-water-v1/water-1.png','assets/maps/sacred-water-v1/terrain.png','assets/characters/hizuki/field-sd-v2/walk-atlas-32.png',...data.objects.map(o=>o.src)])];
 const images=Object.fromEntries(await Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve([src,im]);im.onerror=()=>reject(Error(src));im.src=src;}))));
 const hero=images[sources[3]],bounds=SMRender.actorBounds(hero,(w,h)=>{const v=document.createElement('canvas');v.width=w;v.height=h;return v;});
 let pos=[...data.spawn],dir='u',motion=null,held=null,all=true,grid=false,scale=1,ox=0,oy=0;
 const walk=new Set(data.walkableCells.map(p=>p.join(','))),objects=[...data.objects].sort((a,b)=>a.depth-b.depth);
 function start(dx,dy,t){if(motion)return;dir=dx<0?'l':dx>0?'r':dy<0?'u':'d';const to=[pos[0]+dx,pos[1]+dy];if(!walk.has(to.join(','))||!E.canMove(m,pos[0]*32+16,pos[1]*32+16,to[0]*32+16,to[1]*32+16))return;motion={from:[...pos],to,t};}
 function resize(){cv.width=innerWidth;cv.height=innerHeight;}addEventListener('resize',resize);resize();
 document.getElementById('view').onclick=()=>{all=!all;document.getElementById('view').textContent=all?'全景':'追従';};
 document.getElementById('grid').onclick=()=>grid=!grid;document.getElementById('home').onclick=()=>{motion=null;held=null;pos=[...data.spawn];};
 for(const b of document.querySelectorAll('[data-d]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held=b.dataset.d.split(',').map(Number);};b.onpointerup=b.onpointercancel=()=>held=null;}
 const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();held=keys[e.key];}});addEventListener('keyup',()=>held=null);addEventListener('blur',()=>held=null);document.addEventListener('visibilitychange',()=>{held=null;});
 cv.onpointerdown=e=>{const tx=Math.floor((e.clientX-ox)/scale/32),ty=Math.floor((e.clientY-oy)/scale/32),dx=tx-pos[0],dy=ty-pos[1];if(Math.abs(dx)>Math.abs(dy))start(Math.sign(dx),0,performance.now());else if(dy)start(0,Math.sign(dy),performance.now());};
 function frame(t){if(motion&&t-motion.t>=190){pos=motion.to;motion=null;}if(!motion&&held)start(...held,t);
 let s={x:pos[0],y:pos[1],dir,frame:1};if(motion){const f=Math.min(1,(t-motion.t)/190);s={x:motion.from[0]+(motion.to[0]-motion.from[0])*f,y:motion.from[1]+(motion.to[1]-motion.from[1])*f,dir,frame:[1,0,1,2][Math.floor(f*4)%4]};}
 scale=all?Math.min(cv.width/1024,cv.height/832):Math.max(1.5,Math.min(cv.width/352,cv.height/448));ox=all?(cv.width-1024*scale)/2:cv.width/2-(s.x+.5)*32*scale;oy=all?(cv.height-832*scale)/2:cv.height/2-(s.y+.5)*32*scale;
 c.imageSmoothingEnabled=false;c.fillStyle='#071e26';c.fillRect(0,0,cv.width,cv.height);c.save();c.translate(ox,oy);c.scale(scale,scale);c.drawImage(images[sources[Math.floor(t/360)%2]],0,0);c.drawImage(images[sources[2]],0,0);
 const depth=SMRender.actorDepth(s,bounds,32);let drawn=false;for(const o of objects){if(!drawn&&o.depth>depth){SMRender.actor(c,s,hero,bounds);drawn=true;}c.drawImage(images[o.src],o.x,o.y);}if(!drawn)SMRender.actor(c,s,hero,bounds);
 if(grid){c.fillStyle='#64ffa555';for(const [x,y]of data.walkableCells)c.fillRect(x*32,y*32,32,32);c.fillStyle='#ff4466aa';for(const [x,y]of data.occupiedTiles)c.fillRect(x*32,y*32,32,32);c.strokeStyle='#ffffff33';c.lineWidth=.7;for(let x=0;x<=1024;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,832);c.stroke();}for(let y=0;y<=832;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();}}
 c.restore();status.textContent=pos[1]<=5?'奥の鳥居へ到達しました':`浅瀬の参道 · ${pos[0]},${pos[1]}`;requestAnimationFrame(frame);}
 document.getElementById('load').remove();requestAnimationFrame(frame);
 }catch(err){document.getElementById('load').textContent='読み込めませんでした: '+err.message;console.error(err);}
})();

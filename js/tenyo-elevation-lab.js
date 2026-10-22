(()=>{
 const $=id=>document.getElementById(id),E=YK_ELEVATION,V=YK_ELEVATION_VIEW,c=$('terrain').getContext('2d');
 let m=null,actor=null,art,motion=null,held=null,tour=[],raf=0;
 const directions={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
 const objectArt={};const objectSources={main_shrine:'assets/field-map-objects-v3/shrine.png',torii:'assets/field-map-objects-v3/torii.png',left_auxiliary:'assets/field-map-objects-v3/shrine.png',right_auxiliary:'assets/field-map-objects-v3/shrine.png'};
 for(const [id,src] of Object.entries(objectSources)){const im=new Image();im.onload=()=>paint();im.onerror=()=>{console.warn('Tenyo provisional art unavailable:',src);if(m)status('画像読込失敗: '+src);};im.src=src;objectArt[id]=im;}
 const hizuki=new Image();hizuki.src='assets/characters/hizuki/bluebob-v1/walk-atlas-256.png?v=tenyo-hd1';hizuki.onload=()=>paint();
 function drawVillageHizuki(x,y,scale){if(!hizuki.complete||!hizuki.naturalWidth)return;const row={d:0,u:1,r:2,l:3}[actor.dir]??0,col=Math.max(0,Math.min(2,actor.frame||0));const bodyScale=(58/232)*(scale/.56),foot=y+9*scale; c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(x,foot,31*scale,10*scale,0,0,Math.PI*2);c.fill();c.drawImage(hizuki,col*256,row*256,256,256,x-128*bodyScale,foot-248*bodyScale,256*bodyScale,256*bodyScale);c.restore()}
 function status(message){$('status').textContent=message||('現在の高さ：'+E.height(m,actor.x,actor.y).toFixed(1)+' 段'+(motion?' · 移動中':''));}
 function paint(){if(!art||!m)return;const camera={x:actor.x,y:actor.y,preset:0};const result=V.render(c,m,art,actor,{camera,rise:Number($('rise').value),grid:$('grid').checked,cliffMaterial:$('cliff').value});if(result?.point){const p=result.point(actor.x,actor.y,E.height(m,actor.x,actor.y));if(p){c.save();c.fillStyle='rgba(7,20,24,.78)';c.fillRect(8,214,210,28);c.fillStyle='#fff';c.font='15px system-ui';c.fillText('緋月  ('+Math.floor(actor.x/32)+','+Math.floor(actor.y/32)+')',16,234);c.restore();}}drawOverview();}
 function drawOverview(){if(!m)return;const g=c,sz=3,ox=476,oy=14;g.save();g.fillStyle='rgba(12,28,34,.90)';g.fillRect(ox-5,oy-5,154,174);for(let y=0;y<48;y++)for(let x=0;x<48;x++){const t=m[y][x];g.fillStyle=t==='sea'?'#408db7':t==='forest'?'#406f51':t==='grass'?'#8cb76e':'#c5ae85';g.fillRect(ox+x*sz,oy+y*sz,sz,sz)}for(const o of m.objects){g.fillStyle='#efba61';g.fillRect(ox+Math.floor(o.x/32)*sz-2,oy+Math.floor(o.foot/32)*sz-2,5,5)}g.fillStyle='#ffeb65';g.fillRect(ox+Math.floor(actor.x/32)*sz-2,oy+Math.floor(actor.y/32)*sz-2,5,5);g.fillStyle='white';g.font='11px system-ui';g.fillText('黄: 緋月 / 橙: 配置候補',ox,oy+159);g.restore()}
 function step(dir){if(!art||!m||motion)return false;const [dx,dy]=directions[dir],x=Math.floor(actor.x/32),y=Math.floor(actor.y/32);actor.dir=dir;
  if(!E.connected(m,x,y,x+dx,y+dy)||!E.canMove(m,actor.x,actor.y,actor.x+dx*32,actor.y+dy*32)){status('段差・斜めの縁・水辺・障害物には入れません。坂道を通ってください。');paint();return false;}
  motion={x:actor.x,y:actor.y,nx:actor.x+dx*32,ny:actor.y+dy*32,start:performance.now()};schedule();return true;
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(tick);}
 function tick(t){raf=0;if(motion){const f=Math.min(1,(t-motion.start)/192);actor.x=motion.x+(motion.nx-motion.x)*f;actor.y=motion.y+(motion.ny-motion.y)*f;actor.frame=f<.5?1:2;
   if(f===1){motion=null;actor.frame=0;}paint();status();
  }
  if(!motion){if(tour.length)step(tour.shift());else if(held)step(held);else $('tour').disabled=!art;}
  if(motion)schedule();
 }
 function reset(){held=null;tour=[];motion=null;actor={x:m.spawn[0],y:m.spawn[1],dir:'u',frame:0,draw:drawVillageHizuki};$('tour').disabled=!art;status();paint();}
 $('material').addEventListener('change',()=>{paint();status();});
 $('corners').addEventListener('change',()=>{m.cornerCut=Number($('corners').value);paint();status();});
 for(const id of ['rise','grid','cliff'])$(id).addEventListener('change',paint);
 $('reset').addEventListener('click',reset);
 function pathTo(sx,sy,tx,ty){const queue=[[sx,sy,[]]],seen=new Set([sx+','+sy]);for(let i=0;i<queue.length;i++){const [x,y,path]=queue[i];if(x===tx&&y===ty)return path;
  for(const [dir,[dx,dy]] of Object.entries(directions)){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&E.connected(m,x,y,nx,ny)&&E.canMove(m,x*32+16,y*32+16,nx*32+16,ny*32+16)){seen.add(key);queue.push([nx,ny,[...path,dir]]);}}
 }return [];}
 $('tour').addEventListener('click',()=>{reset();const out=pathTo(Math.floor(m.spawn[0]/32),Math.floor(m.spawn[1]/32),m.goal[0],m.goal[1]),reverse={u:'d',d:'u',l:'r',r:'l'};if(!out.length){status('本殿への経路が見つかりません。高低差・通行判定の修正が必要です。');return;}tour=[...out,...out.slice().reverse().map(d=>reverse[d])];$('tour').disabled=true;schedule();});
 for(const b of document.querySelectorAll('[data-dir]')){
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);tour=[];held=b.dataset.dir;step(held);});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{held=null;});
 }
 const keys={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'};
 document.addEventListener('keydown',e=>{if(!keys[e.key]||['SELECT','INPUT'].includes(e.target.tagName))return;e.preventDefault();tour=[];held=keys[e.key];step(held);});
 document.addEventListener('keyup',e=>{if(keys[e.key]===held)held=null;});
 window.addEventListener('blur',()=>{held=null;tour=[];});document.addEventListener('visibilitychange',()=>{if(document.hidden){held=null;tour=[];}});
 Promise.all([V.load(),YK_TENYO_V3()]).then(([a,d])=>{art=a;m=d.tiles.map(row=>row.map(t=>t==='river'?'sea':t==='forest'?'forest':t==='grass'?'grass':'road'));m.heights=d.elevation;m.ramps=d.ramps;m.cornerCut=30;m.roads=new Set();m.objects=[];m.occupiedTiles=new Set();
 // DEBUG ONLY: authored proposal rectangles are NOT final occupiedTiles.
 // Keep the prior provisional collision until exact contact cells are approved.
 for(const o of d.objectContactCandidates){
  if(o.collision==='blocked')for(let y=o.y;y<o.y+o.height;y++)for(let x=o.x;x<o.x+o.width;x++)m.occupiedTiles.add(x+','+y);
  const centerX=(o.x+o.width/2)*32,footY=(o.y+o.height)*32;
  const names={main_shrine:'本殿候補',left_auxiliary:'左社殿候補',right_auxiliary:'右社殿候補',torii:'鳥居候補',west_bridge:'西橋候補',east_bridge:'東橋候補'};
  const image=objectArt[o.id];
  // The source sprite is an existing field icon, NOT an approved full-scale shrine layer.
  // Render at its native world scale while preserving independent authored contact cells.
  const visualWidth=64,visualHeight=64;
  m.objects.push({id:o.id,x:centerX-visualWidth/2,y:footY,foot:footY,width:visualWidth,height:visualHeight,
   render:(ctx,p)=>{ctx.save();ctx.globalAlpha=1;
    if(image?.complete&&image.naturalWidth){const w=visualWidth*p.scale,h=visualHeight*p.scale;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,p.x-w/2,p.y-h,w,h);}
    ctx.fillStyle='rgba(14,30,39,.88)';ctx.strokeStyle='#f3ce6c';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.font='12px sans-serif';const label=names[o.id]||o.id,w=ctx.measureText(label).width+12;ctx.fillStyle='rgba(14,30,39,.88)';ctx.fillRect(p.x-w/2,p.y-26,w,19);ctx.fillStyle='#fff0bd';ctx.fillText(label,p.x-w/2+6,p.y-12);ctx.restore()}
  });
 }
 m.spawn=[d.spawn[0]*32+16,d.spawn[1]*32+16];m.goal=d.mainShrineApproach;E.prepare(m);actor={x:m.spawn[0],y:m.spawn[1],dir:'u',frame:0,draw:drawVillageHizuki};const errors=E.validate(m);const candidateCount=m.objects.length,imagesReady=Object.entries(objectArt).filter(([k,v])=>v.complete&&v.naturalWidth).length; $('status').textContent='地形検査 '+errors.length+'件 / 配置候補 '+candidateCount+'件 / 既存画像 '+imagesReady+'/'+Object.keys(objectArt).length+'枚（小型仮素材）';$('tour').disabled=false;paint();}).catch(err=>status('素材・マップを読み込めませんでした：'+err.message));
})();


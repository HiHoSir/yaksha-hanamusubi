(()=>{
 const $=id=>document.getElementById(id),E=YK_ELEVATION,V=YK_ELEVATION_VIEW,c=$('terrain').getContext('2d');
 let m=E.fixture(),actor={x:m.spawn[0],y:m.spawn[1],dir:'u',frame:0},art,motion=null,held=null,tour=[],raf=0;
 const directions={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
 function status(message){$('status').textContent=message||('現在の高さ：'+E.height(m,actor.x,actor.y).toFixed(1)+' 段'+(motion?' · 移動中':''));}
 function paint(){if(art)V.render(c,m,art,actor,{rise:Number($('rise').value),grid:$('grid').checked,cliffMaterial:$('cliff').value});}
 function step(dir){if(!art||motion)return false;const [dx,dy]=directions[dir],x=Math.floor(actor.x/32),y=Math.floor(actor.y/32);actor.dir=dir;
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
 function reset(){held=null;tour=[];motion=null;actor={x:m.spawn[0],y:m.spawn[1],dir:'u',frame:0};$('tour').disabled=!art;status();paint();}
 $('material').addEventListener('change',()=>{m=E.fixture($('material').value);m.cornerCut=Number($('corners').value);paint();status();});
 $('corners').addEventListener('change',()=>{m.cornerCut=Number($('corners').value);paint();status();});
 for(const id of ['rise','grid','cliff'])$(id).addEventListener('change',paint);
 $('reset').addEventListener('click',reset);
 function pathTo(sx,sy,tx,ty){const queue=[[sx,sy,[]]],seen=new Set([sx+','+sy]);for(let i=0;i<queue.length;i++){const [x,y,path]=queue[i];if(x===tx&&y===ty)return path;
  for(const [dir,[dx,dy]] of Object.entries(directions)){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&E.connected(m,x,y,nx,ny)&&E.canMove(m,x*32+16,y*32+16,nx*32+16,ny*32+16)){seen.add(key);queue.push([nx,ny,[...path,dir]]);}}
 }return [];}
 $('tour').addEventListener('click',()=>{reset();const out=pathTo(7,15,8,7),reverse={u:'d',d:'u',l:'r',r:'l'};tour=[...out,...out.slice().reverse().map(d=>reverse[d])];$('tour').disabled=true;schedule();});
 for(const b of document.querySelectorAll('[data-dir]')){
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);tour=[];held=b.dataset.dir;step(held);});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{held=null;});
 }
 const keys={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'};
 document.addEventListener('keydown',e=>{if(!keys[e.key]||['SELECT','INPUT'].includes(e.target.tagName))return;e.preventDefault();tour=[];held=keys[e.key];step(held);});
 document.addEventListener('keyup',e=>{if(keys[e.key]===held)held=null;});
 window.addEventListener('blur',()=>{held=null;tour=[];});document.addEventListener('visibilitychange',()=>{if(document.hidden){held=null;tour=[];}});
 V.load().then(a=>{art=a;$('tour').disabled=false;paint();status();}).catch(err=>status('素材を読み込めませんでした。再読み込みしてください：'+err.message));
})();


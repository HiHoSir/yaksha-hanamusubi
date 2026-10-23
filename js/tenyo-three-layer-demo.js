// Inspection page shares the actual game's authored 48x32 grid and renderer.
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d');
const status=document.getElementById('status'),debug=document.getElementById('debug');
const scene=window.YK_TENYO,STEP_MS=144;
const hero=new Image();hero.src='assets/characters/hizuki/bluebob-v1/walk-atlas-256.png';
let [x,y]=scene.spawn,dir=0,frame=0,held=null,step=null,repeatAt=0;
function tryStep(dx,dy,now){
 if(step)return;
 const destination=scene.step(x,y,dx,dy,()=>false);
 dir=dy>0?0:dy<0?1:dx>0?2:3;
 repeatAt=now+STEP_MS;
 if(destination.x===x&&destination.y===y)return;
 step={fromX:x,fromY:y,toX:destination.x,toY:destination.y,start:now};
}
function setDirection(direction){
 held=direction;
 // Commit the input immediately: pointerup can precede the next animation frame.
 tryStep(direction[0],direction[1],performance.now());
}
function draw(t){
 if(step){
  const progress=Math.min(1,(t-step.start)/STEP_MS);
  x=step.fromX+(step.toX-step.fromX)*progress;
  y=step.fromY+(step.toY-step.fromY)*progress;
  frame=1+Math.floor(progress*4)%2;
  if(progress>=1){x=step.toX;y=step.toY;step=null;frame=0;}
 }
 if(held&&!step&&t>=repeatAt)tryStep(held[0],held[1],t);
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
 scene.draw(ctx,{x,y},(px,py)=>{
  if(!hero.complete||!hero.naturalWidth)return;
  const scale=58*.56/232;
  ctx.drawImage(hero,frame*256,dir*256,256,256,px-128*scale,py-248*scale,256*scale,256*scale);
 },()=>{},()=>{},debug.checked);
 const col=Math.floor(x/scene.WALK_CELL),row=Math.floor(y/scene.WALK_CELL);
 status.textContent='BETA 16.1.17｜マス '+col+','+row+' / '+(scene.blocked(x,y)?'歩行不可':'歩行可能')+'｜48×32・1入力1マス';
 requestAnimationFrame(draw);
}
for(const button of document.querySelectorAll('[data-dir]')){
 const direction=button.dataset.dir.split(',').map(Number);
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);setDirection(direction)});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>held=null);
}
const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
document.addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();if(!e.repeat)setDirection(keys[e.key])}});
document.addEventListener('keyup',e=>{if(keys[e.key])held=null});
window.addEventListener('blur',()=>held=null);
window.addEventListener('pagehide',()=>held=null);
document.addEventListener('visibilitychange',()=>{if(document.hidden)held=null});
requestAnimationFrame(draw);

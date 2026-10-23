(()=>{'use strict';
const R=CYAMISE_RULES,canvas=document.getElementById('scene'),ctx=canvas.getContext('2d'),status=document.getElementById('status');ctx.scale(2,2);
let pos={...R.spawn},dir='u',motion=null,route=[],held=null,repeat=null,ready=false;
const art=new Image(),hero=new Image();let clean;
const load=(im,url)=>new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=()=>reject(Error('画像の読み込みに失敗しました'));im.src=url});
const vectors={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
function paint(t=performance.now()){
 let foot,frame=1;
 if(motion){const k=Math.min(1,(t-motion.at)/140),a=R.foot(pos.x,pos.y),b=R.foot(motion.to.x,motion.to.y);foot={x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k};frame=k<.5?0:2;if(k===1){pos=motion.to;motion=null;foot=null;frame=1;}}
 if(ready)CYAMISE_RENDERER.draw(ctx,art,hero,{...pos,foot},{grid:document.getElementById('grid').checked,collision:document.getElementById('collision').checked,dir,frame,clean});
 if(!motion&&route.length){const n=route.shift();attempt(n.x-pos.x,n.y-pos.y);}
 if(motion)requestAnimationFrame(paint);else if(ready)status.textContent=`現在 (${pos.x}, ${pos.y}) ／ グラフィック全体がマス内 ／ 1マスずつ移動`;
}
function attempt(dx,dy){if(!ready||motion)return false;dir=dx<0?'l':dx>0?'r':dy<0?'u':'d';const next=R.step(pos,dx,dy);if(!next){status.textContent='通行不可：壁・家具のマスです';paint();status.textContent='通行不可：壁・家具のマスです';return false;}motion={to:next,at:performance.now()};requestAnimationFrame(paint);return true;}
function stop(){held=null;clearInterval(repeat);repeat=null;}
function press(d){stop();route=[];held=d;attempt(...vectors[d]);repeat=setInterval(()=>{if(held&&!motion)attempt(...vectors[held])},155);}
for(const b of document.querySelectorAll('[data-dir]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);press(b.dataset.dir)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,stop);}
const keys={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'};
document.addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();if(!e.repeat)press(keys[e.key])}});document.addEventListener('keyup',e=>{if(keys[e.key])stop()});window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
canvas.addEventListener('pointerdown',e=>{if(!ready||motion)return;stop();const b=canvas.getBoundingClientRect(),x=Math.floor(((e.clientX-b.left)*384/b.width-R.origin.x)/32),y=Math.floor(((e.clientY-b.top)*R.viewport.height/b.height-R.origin.y)/32);route=R.path(pos,{x,y})||[];paint();if(!R.walkable(x,y))status.textContent='このマスは通行不可です';});
for(const id of ['grid','collision'])document.getElementById(id).onchange=()=>paint();
document.getElementById('reset').onclick=()=>{stop();route=[];motion=null;pos={...R.spawn};dir='u';paint()};
Promise.all([load(art,'assets/interiors/cyamise-v1/topview-preview.png?v=6'),load(hero,'assets/characters/hizuki/field-sd-v1/walk-atlas-32.png?v=16.0.42')]).then(()=>{clean=CYAMISE_RENDERER.prepare(document.createElement('canvas'),art);ready=true;paint()}).catch(e=>{status.textContent=e.message});
})();

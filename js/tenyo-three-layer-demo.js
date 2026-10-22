import {canWalkTenyo,tenyoCellAt,moveTenyoFootpoint,TENYO_COLLISION} from './tenyo-three-layer-collision.js';
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d');
const status=document.getElementById('status'),debug=document.getElementById('debug');
const W=768,H=512,paths=['assets/maps/tenyo/layer-background.webp','assets/maps/tenyo/layer-trees.webp','assets/maps/tenyo/layer-shrine.webp'];
const layers=paths.map(src=>{const im=new Image();im.src=src+'?v=2';return im});
const hero=new Image();hero.src='assets/characters/hizuki/bluebob-v1/walk-atlas-256.png';
let col=11,row=15,x=col*32+16,y=row*32+16,dir=0,frame=0,held=null,last=0;
let step=null,repeatAt=0;
const STEP_MS=190; // exactly one 32px cell per completed step
function tryStep(dx,dy,now){
 if(step||!held)return;
 const nextCol=col+dx,nextRow=row+dy;
 if(!canWalkTenyo(nextCol*64+32,nextRow*64+32)){repeatAt=now+STEP_MS;return;}
 step={fromX:x,fromY:y,toX:nextCol*32+16,toY:nextRow*32+16,start:now};
 col=nextCol;row=nextRow;repeatAt=now+STEP_MS;
}
function setDirection(direction){held=direction;repeatAt=0;}
function draw(t){
 last=t;
 if(held&&!step&&t>=repeatAt)tryStep(held[0],held[1],t);
 if(step){
  const progress=Math.min(1,(t-step.start)/STEP_MS);
  x=step.fromX+(step.toX-step.fromX)*progress;
  y=step.fromY+(step.toY-step.fromY)*progress;
  frame=1+Math.floor(progress*4)%2;
  if(progress>=1){x=step.toX;y=step.toY;step=null;frame=0;}
 }else frame=0;
 if(held){const [dx,dy]=held;dir=dy>0?0:dy<0?1:dx>0?2:3;}
 ctx.clearRect(0,0,W,H);
 if(layers[0].complete&&layers[0].naturalWidth)ctx.drawImage(layers[0],0,0,W,H);
 if(layers[2].complete&&layers[2].naturalWidth)ctx.drawImage(layers[2],0,0,W,H);
 if(hero.complete&&hero.naturalWidth){ctx.fillStyle='#102b294a';ctx.beginPath();ctx.ellipse(x,y,11,4,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(hero,frame*256,dir*256,256,256,x-23,y-47,46,46);}
 else{ctx.fillStyle='#75d5ef';ctx.fillRect(x-8,y-32,16,31);}
 // The separate transparent tree canopy is drawn above the hero, enabling leaf occlusion.
 if(layers[1].complete&&layers[1].naturalWidth)ctx.drawImage(layers[1],0,0,W,H);
 // Repaint ONLY the roof silhouette over trees; the shrine body stays in its original layer.
 // Coordinates are measured in the original 1536x1024 shrine PNG and share its origin.
 if(layers[2].complete&&layers[2].naturalWidth){
  const roofOutline=[
   [595,0],[948,0],[948,137],[943,151],[931,158],[884,158],
   [855,151],[827,138],[809,122],[790,113],[768,108],
   [746,113],[728,127],[710,143],[690,156],[613,158],
   [596,151],[589,140],[589,0]
  ];
  ctx.save();ctx.beginPath();
  roofOutline.forEach(([px,py],i)=>{if(i===0)ctx.moveTo(px/2,py/2);else ctx.lineTo(px/2,py/2)});
  ctx.closePath();ctx.clip();ctx.drawImage(layers[2],0,0,W,H);ctx.restore();
 }
 if(debug.checked){for(let row=0;row<16;row++)for(let col=0;col<24;col++){
 const type=TENYO_COLLISION.rows[row][col];
 ctx.fillStyle=type==='.'?'#35d26b55':type==='L'?'#f0ac3788':type==='S'?'#e6394677':'#1c2a3560';
 ctx.fillRect(col*32,row*32,32,32);ctx.strokeStyle='#ffffff66';ctx.strokeRect(col*32,row*32,32,32);
 }}
 const tile=tenyoCellAt(col*64+32,row*64+32);
 status.textContent='マス '+col+','+row+' / '+(tile==='L'?'葉の縁（進入許可）':tile==='.'?'歩行可能':'歩行不可');
 requestAnimationFrame(draw);
}
for(const button of document.querySelectorAll('[data-dir]')){
 const direction=button.dataset.dir.split(',').map(Number);
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);setDirection(direction)});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>held=null);
}
const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
document.addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();if(!held||held!==keys[e.key])setDirection(keys[e.key])}});
document.addEventListener('keyup',e=>{if(keys[e.key])held=null});
window.addEventListener('blur',()=>held=null);
requestAnimationFrame(draw);

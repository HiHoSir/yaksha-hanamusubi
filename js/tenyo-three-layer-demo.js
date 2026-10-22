import {canWalkTenyo,tenyoCellAt,moveTenyoFootpoint,TENYO_COLLISION} from './tenyo-three-layer-collision.js';
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d');
const status=document.getElementById('status'),debug=document.getElementById('debug');
const W=768,H=512,paths=['assets/maps/tenyo/layer-background.webp','assets/maps/tenyo/layer-trees.webp','assets/maps/tenyo/layer-shrine.webp'];
const layers=paths.map(src=>{const im=new Image();im.src=src+'?v=2';return im});
const hero=new Image();hero.src='assets/characters/hizuki/bluebob-v1/walk-atlas-256.png';
let x=384,y=492,dir=0,frame=0,held=null,elapsed=0,last=0,walkTime=0;
const speed=78; // displayed pixels per second; 32px = one world tile
function draw(t){
 const dt=Math.min(0.05,(t-(last||t))/1000);last=t;
 if(held){const [dx,dy]=held;const next=moveTenyoFootpoint(x*2,y*2,dx*speed*dt*2,dy*speed*dt*2);
  const moving=Math.abs(next.x-x*2)+Math.abs(next.y-y*2)>0.001;
  x=next.x/2;y=next.y/2;walkTime+=moving?dt:0;frame=moving?1+Math.floor(walkTime*6)%2:0;
  dir=dy>0?0:dy<0?1:dx>0?2:3;
 }else frame=0;
 ctx.clearRect(0,0,W,H);
 if(layers[0].complete&&layers[0].naturalWidth)ctx.drawImage(layers[0],0,0,W,H);
 if(layers[2].complete&&layers[2].naturalWidth)ctx.drawImage(layers[2],0,0,W,H);
 if(hero.complete&&hero.naturalWidth){ctx.fillStyle='#102b294a';ctx.beginPath();ctx.ellipse(x,y,11,4,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(hero,frame*256,dir*256,256,256,x-23,y-47,46,46);}
 else{ctx.fillStyle='#75d5ef';ctx.fillRect(x-8,y-32,16,31);}
 // The separate transparent tree canopy is drawn above the hero, enabling leaf occlusion.
 if(layers[1].complete&&layers[1].naturalWidth)ctx.drawImage(layers[1],0,0,W,H);
 // Roof-only overlay from the same transparent shrine asset. Preserve exact alignment;
 // avoid bringing the shrine's lower structure in front of the actor or trees.
 if(layers[2].complete&&layers[2].naturalWidth){
  const roofBottom=164; // source pixels in the 1536x1024 shrine layer
  ctx.drawImage(layers[2],0,0,layers[2].naturalWidth,roofBottom,0,0,W,roofBottom*H/layers[2].naturalHeight);
 }
 if(debug.checked){for(let row=0;row<16;row++)for(let col=0;col<24;col++){
 const type=TENYO_COLLISION.rows[row][col];
 ctx.fillStyle=type==='.'?'#35d26b55':type==='L'?'#f0ac3788':type==='S'?'#e6394677':'#1c2a3560';
 ctx.fillRect(col*32,row*32,32,32);ctx.strokeStyle='#ffffff66';ctx.strokeRect(col*32,row*32,32,32);
 }}
 const tile=tenyoCellAt(x*2,y*2);
 status.textContent='足元 '+Math.floor(x/32)+','+Math.floor(y/32)+' / '+(tile==='L'?'葉の縁（進入許可）':tile==='.'?'歩行可能':'歩行不可');
 requestAnimationFrame(draw);
}
for(const button of document.querySelectorAll('[data-dir]')){
 const direction=button.dataset.dir.split(',').map(Number);
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held=direction});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>held=null);
}
const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
document.addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();held=keys[e.key]}});
document.addEventListener('keyup',e=>{if(keys[e.key])held=null});
window.addEventListener('blur',()=>held=null);
requestAnimationFrame(draw);

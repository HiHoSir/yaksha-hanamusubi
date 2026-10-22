(()=>{
'use strict';
const canvas=document.getElementById('map'),ctx=canvas.getContext('2d'),status=document.getElementById('status'),W=520,H=497;
const image=new Image();image.src='assets/maps/tenyo/tenyo-concept-background.png';
const hero=new Image();hero.src='assets/characters/hizuki/bluebob-v1/walk-atlas-256.png';
const walk=[
[[235,496],[285,496],[278,448],[244,448]],
[[243,455],[281,455],[279,338],[243,338]],
[[241,342],[283,342],[283,309],[237,309]],
[[230,308],[290,308],[295,279],[222,279]],
[[222,281],[298,281],[304,257],[217,257]],
[[263,261],[281,261],[281,184],[263,184]],
[[208,183],[311,183],[312,152],[207,152]]
];
const foreground=[
{threshold:154,poly:[[212,153],[220,112],[239,109],[247,79],[258,84],[268,45],[292,46],[302,79],[322,83],[344,107],[350,148],[320,154],[320,119],[210,119]]},
{threshold:322,poly:[[250,265],[257,257],[328,257],[342,267],[342,276],[333,279],[333,324],[322,325],[322,277],[270,277],[270,323],[259,324],[259,277],[249,278]]},
{threshold:267,poly:[[49,244],[65,228],[88,225],[114,234],[131,250],[128,268],[115,246],[89,238],[70,244],[57,260]]},
{threshold:355,poly:[[377,324],[391,311],[421,306],[445,312],[464,327],[463,351],[451,331],[424,321],[399,327],[384,348]]}
];
function path(poly){ctx.beginPath();poly.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();}
function contains(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
let x=261,y=475,dir=1,frame=0,held=null,last=0,travel=0;
function render(){
ctx.clearRect(0,0,W,H);
if(image.complete&&image.naturalWidth)ctx.drawImage(image,0,0,W,H);
else {ctx.fillStyle='#233d42';ctx.fillRect(0,0,W,H);ctx.fillStyle='white';ctx.font='15px sans-serif';ctx.fillText('背景画像未登録',190,220);}
if(document.getElementById('debug').checked){ctx.fillStyle='rgba(20,250,100,.24)';walk.forEach(p=>{path(p);ctx.fill()});}
ctx.fillStyle='#202b2c99';ctx.beginPath();ctx.ellipse(x,y,10,3,0,0,Math.PI*2);ctx.fill();
if(hero.complete&&hero.naturalWidth){ctx.drawImage(hero,frame*256,dir*256,256,256,x-22,y-45,44,44);}
else {ctx.fillStyle='#9cd4ed';ctx.fillRect(x-7,y-30,14,26);}
if(image.complete&&image.naturalWidth)for(const f of foreground){if(y>f.threshold)continue;ctx.save();path(f.poly);ctx.clip();ctx.drawImage(image,0,0,W,H);ctx.restore();}
status.textContent=image.complete&&image.naturalWidth?'足元座標 '+Math.round(x)+','+Math.round(y):'背景画像が未登録です。画像の転送・検査が必要です。';
}
function tick(t){let dt=Math.min(40,t-(last||t));last=t;if(held){const [dx,dy]=held,nx=x+dx*dt*.085,ny=y+dy*dt*.085;if(walk.some(p=>contains(p,nx,ny))){x=nx;y=ny;travel+=dt*.085;frame=1+Math.floor(travel/9)%2;}else frame=0;dir=dy>0?0:dy<0?1:dx>0?2:3;}else frame=0;render();requestAnimationFrame(tick);}
for(const b of document.querySelectorAll('[data-dir]')){const d=b.dataset.dir.split(',').map(Number);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held=d});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>held=null);}
const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};document.addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();held=keys[e.key]}});document.addEventListener('keyup',e=>{if(keys[e.key])held=null});window.addEventListener('blur',()=>held=null);
requestAnimationFrame(tick);
})();
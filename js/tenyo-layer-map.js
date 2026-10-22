(()=>{
'use strict';
const canvas=document.getElementById('map'),ctx=canvas.getContext('2d'),status=document.getElementById('status'),W=520,H=497;
const image=new Image();image.src='assets/maps/tenyo/tenyo-concept-background.jpg?v=1';
const hero=new Image();hero.src='assets/characters/hizuki/bluebob-v1/walk-atlas-256.png';
// Foot-coordinate walk surfaces traced against the approved 520×497 illustration.
// Stairs are flat gameplay paths; no elevation/perspective calculations.
const walk=[
[[243,496],[291,496],[293,467],[277,453],[260,454],[242,467]],
[[234,471],[298,471],[309,440],[312,418],[249,418],[250,440]],
[[270,420],[312,420],[312,345],[269,345]],
[[250,350],[331,350],[359,338],[375,319],[372,299],[350,287],[320,292],[308,310],[251,310]],
[[377,317],[406,313],[434,315],[449,326],[447,342],[425,335],[401,333],[377,339]],
[[229,313],[269,313],[272,281],[249,270],[224,267],[207,279]],
[[126,285],[229,290],[241,269],[222,252],[185,253],[152,267],[126,261]],
[[55,248],[71,235],[95,236],[119,251],[130,269],[114,271],[91,254],[70,250]],
[[269,309],[312,309],[312,261],[269,261]],
[[265,262],[316,262],[315,183],[266,183]],
[[218,185],[359,185],[359,163],[217,163]],
[[231,167],[340,167],[342,145],[229,145]]
];
// Foreground is repainted from the SAME image; no duplicate art is generated.
// Split thin posts from the torii crossbar so walking under it remains visible.
const foreground=[
{threshold:160,poly:[[217,150],[217,120],[234,113],[246,78],[261,82],[267,45],[292,45],[301,80],[324,87],[345,114],[351,151],[331,152],[328,121],[224,121]]},
{threshold:256,poly:[[263,178],[273,177],[272,255],[262,255]]},
{threshold:256,poly:[[307,178],[318,177],[318,255],[308,255]]},
{threshold:282,poly:[[247,258],[353,258],[353,273],[339,280],[261,280],[246,271]]},
{threshold:332,poly:[[258,276],[272,276],[272,331],[260,331]]},
{threshold:332,poly:[[332,276],[346,276],[346,331],[334,331]]},
{threshold:273,poly:[[55,240],[68,232],[93,232],[120,246],[126,264],[114,252],[92,244],[73,243],[59,257]]},
{threshold:351,poly:[[377,323],[392,311],[420,307],[444,313],[463,331],[462,349],[450,334],[424,323],[401,327],[386,343]]}
];
function path(poly){ctx.beginPath();poly.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();}
function contains(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
let x=270,y=476,dir=0,frame=0,held=null,last=0,travel=0;
function render(){
ctx.clearRect(0,0,W,H);
if(image.complete&&image.naturalWidth)ctx.drawImage(image,0,0,W,H);
else {ctx.fillStyle='#233d42';ctx.fillRect(0,0,W,H);ctx.fillStyle='white';ctx.font='15px sans-serif';ctx.fillText('背景画像未登録',190,220);}
if(document.getElementById('debug').checked){ctx.fillStyle='rgba(20,250,100,.24)';walk.forEach(p=>{path(p);ctx.fill()});}
ctx.fillStyle='#202b2c99';ctx.beginPath();ctx.ellipse(x,y,10,3,0,0,Math.PI*2);ctx.fill();
if(hero.complete&&hero.naturalWidth){ctx.drawImage(hero,frame*256,dir*256,256,256,x-22,y-45,44,44);}
else {ctx.fillStyle='#9cd4ed';ctx.fillRect(x-7,y-30,14,26);}
if(image.complete&&image.naturalWidth)for(const f of foreground){if(y>f.threshold)continue;ctx.save();path(f.poly);ctx.clip();ctx.drawImage(image,0,0,W,H);ctx.restore();}
status.textContent=image.complete&&image.naturalWidth?'足元座標 '+Math.round(x)+','+Math.round(y):'背景画像の読み込みに失敗しました';
}
function tick(t){let dt=Math.min(40,t-(last||t));last=t;if(held){const [dx,dy]=held,nx=x+dx*dt*.085,ny=y+dy*dt*.085;if(walk.some(p=>contains(p,nx,ny))){x=nx;y=ny;travel+=dt*.085;frame=1+Math.floor(travel/9)%2;}else frame=0;dir=dy>0?0:dy<0?1:dx>0?2:3;}else frame=0;render();requestAnimationFrame(tick);}
for(const b of document.querySelectorAll('[data-dir]')){const d=b.dataset.dir.split(',').map(Number);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held=d});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>held=null);}
const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};document.addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();held=keys[e.key]}});document.addEventListener('keyup',e=>{if(keys[e.key])held=null});window.addEventListener('blur',()=>held=null);
requestAnimationFrame(tick);
})();
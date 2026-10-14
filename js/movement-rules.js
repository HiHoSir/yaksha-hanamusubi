// Deterministic movement math. Rendering, timing, encounters and save writes stay in game.js.
window.YK_MOVEMENT=(()=>{
 function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
 function step(area,x,y,dx,dy,speed,worldSize,blocked){
  const fieldStyle=['field','village','teahouse','osumiHome','villageRoom'].includes(area);
  const norm=Math.hypot(dx,dy)||1,sp=speed*(fieldStyle?32:22);
  const vx=dx/norm*sp,vy=dy/norm*sp,steps=Math.ceil(sp/2);
  const maxX=area==='field'?worldSize-27:area==='village'?1504:741;
  const maxY=area==='field'?worldSize-34:area==='village'?1248:736;
  for(let i=0;i<steps;i++){
   const nx=clamp(x+vx/steps,27,maxX),ny=clamp(y+vy/steps,34,maxY);
   if(!blocked(nx,ny)){x=nx;y=ny;}
   else if(vx&&vy&&!fieldStyle){
    if(!blocked(nx,y))x=nx;
    else if(!blocked(x,ny))y=ny;
   }
  }
  return {x,y};
 }
 return {step};
})();

// Pure interaction geometry: no rendering, state mutation or save writes.
window.YK_INTERACTION=(()=>{
 const facing={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
 const tile=(v)=>Math.floor(v/32);
 function sameTile(a,b){return tile(a.x)===tile(b.x)&&tile(a.y)===tile(b.y);}
 function nearestFacingNPC(player,npcs,max=92,elevation=null){
  let best=null,bd=max;
  for(const n of npcs){
   const dx=n.x-player.x,dy=n.y-player.y,d=Math.hypot(dx,dy);
   if(d>=bd)continue;
   const f=facing[player.dir]||facing.d;
   const dot=(dx*f[0]+dy*f[1])/(d||1);
   // Require a forward-facing cone; lateral NPCs must not steal object inspection.
   const fdx=tile(n.x)-tile(player.x),fdy=tile(n.y)-tile(player.y);
   const forwardCell=fdx===f[0]&&fdy===f[1];
   if(Math.abs(dx*f[1]-dy*f[0])>=16)continue;
   if(dot<.75&&!(elevation&&forwardCell))continue;
   best=n;bd=d;
  }
  return best;
 }
 // Intersect the forward line with the authored inspection rectangle.
 // A nearby corner to the side must never count as an object in front.
 function nearestFacingObject(player,objects,max=48){
  const f=facing[player.dir]||facing.d;let best=null,bd=Infinity;
  for(const o of objects){
   const dx=o.x-player.x,dy=o.y-player.y;
   const along=dx*f[0]+dy*f[1],across=Math.abs(dx*f[1]-dy*f[0]);
   const halfAlong=(f[0]?o.w:o.h)/2,halfAcross=(f[0]?o.h:o.w)/2;
   const distance=along-halfAlong;
   if(across>=halfAcross||distance<0||distance>max||distance>=bd)continue;
   best=o;bd=distance;
  }
  return best;
 }
 return {nearestFacingNPC,nearestFacingObject,sameTile};
})();

// Pure interaction geometry: no rendering, state mutation or save writes.
window.YK_INTERACTION=(()=>{
 const facing={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
 function nearestFacingNPC(player,npcs,max=92){
  let best=null,bd=max;
  for(const n of npcs){
   const dx=n.x-player.x,dy=n.y-player.y,d=Math.hypot(dx,dy);
   if(d>=bd)continue;
   const f=facing[player.dir]||facing.d;
   const dot=(dx*f[0]+dy*f[1])/(d||1);
   // Require a forward-facing cone; lateral NPCs must not steal object inspection.
   if(dot<.75)continue;
   best=n;bd=d;
  }
  return best;
 }
 return {nearestFacingNPC};
})();

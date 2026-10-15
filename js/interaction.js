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
   if(dot<.75&&!(elevation&&forwardCell))continue;
   best=n;bd=d;
  }
  return best;
 }
 return {nearestFacingNPC,sameTile};
})();

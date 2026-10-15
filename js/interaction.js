// Pure interaction geometry: no rendering, state mutation or save writes.
window.YK_INTERACTION=(()=>{
 const facing={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
 const tile=(v)=>Math.floor(v/32);
 function sameTile(a,b){return tile(a.x)===tile(b.x)&&tile(a.y)===tile(b.y);}
 function nearestFacingNPC(player,npcs,max=92,elevation=null){
  let best=null,bd=max;
  for(const n of npcs){
   const dx=n.x-player.x,dy=n.y-player.y,d=Math.hypot(dx,dy);
   const adjacent=Math.abs(tile(n.x)-tile(player.x))+Math.abs(tile(n.y)-tile(player.y))===1;
   const levelGap=elevation?Math.abs(elevation(n.x,n.y)-elevation(player.x,player.y)):0;
   if(d>=bd&&!(adjacent&&d<bd+20))continue;
   const f=facing[player.dir]||facing.d;
   const dot=(dx*f[0]+dy*f[1])/(d||1);
   // Require a forward-facing cone; lateral NPCs must not steal object inspection.
   if(dot<.75)continue;
   if(elevation&&levelGap>48)continue;
   best=n;bd=d;
  }
  return best;
 }
 return {nearestFacingNPC};
})();

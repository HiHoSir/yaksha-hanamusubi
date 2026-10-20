// Collision rules separated from game rendering and movement timing.
window.YK_COLLISION=(()=>{
 function blocked(area,x,y,ignoreNPC=false,env={}){
  if(area==='debugField'){
   const map=env.debugMap?.();
   return map?!env.landscape.walkable(map,x-48,y-100):x<53||x>683||y<105||y>639;
  }
  if(area==='field')return !env.world?.walkable(x,y);
  if(area==='village')return env.villageBlocked(x,y)||(!ignoreNPC&&env.npcBlocked(x,y));
  if(x<27||x>741||y<34||y>736)return true;
  if(!ignoreNPC&&env.npcBlocked(x,y))return true;
  if(['teahouse','osumiHome','villageRoom'].includes(area)&&env.interiorBlocked(x,y))return true;
  if(window.YK_DESTINATION_SCENES?.blocked(area,x,y))return true;
  if(area==='waterfall'&&x>200&&x<565&&y<500)return true;
  return false;
 }
 return {blocked};
})();


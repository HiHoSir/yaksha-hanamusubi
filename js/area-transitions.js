// Pure area exit selection. Does not move the player or write saves.
window.YK_AREA_TRANSITIONS=(()=>{
 function inside(x,y,rect){return x>rect[0]&&x<rect[2]&&y>rect[1]&&y<rect[3];}
 function exit(area,x,y,villageLayout,world){
  if(['teahouse','osumiHome','villageRoom'].includes(area))return null;
  if(area==='village'){
   if(inside(x,y,villageLayout.exit.rect))return villageLayout.exit.to;
   if(inside(x,y,villageLayout.northExit.rect))return villageLayout.northExit.to;
  }
  if(world?.places?.[area]&&area!=='village'&&x<42)return 'field';
  return null;
 }
 return {exit};
})();

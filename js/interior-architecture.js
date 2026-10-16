// Shared rear-wall geometry for native 32px interior architecture.
// Keep visual wall overlap independent from collision and floor footprints.
window.YK_INTERIOR_ARCHITECTURE=(()=>{
 const PROFILES=Object.freeze({
  teahouse:Object.freeze({width:10,height:8,pillarOverlap:6}),
  inn:Object.freeze({width:16,height:12,pillarOverlap:6}),
  armory:Object.freeze({width:10,height:8,pillarOverlap:6}),
  home:Object.freeze({width:8,height:7,pillarOverlap:6})
 });
 function addRearWall(objects,config){
  const {originX,originY,cellSize,roomWidth,wallHeight,wallImage,wallEdges,fullBackWall,fullBackWallReady}=config;
  const overlap=config.pillarOverlap??6;
  if(!Array.isArray(objects)||!wallImage||!wallEdges||!(cellSize>0)||!(wallHeight>0)||!(roomWidth>=3)||overlap<0||overlap>=cellSize)throw Error('invalid interior architecture');
  const wallFoot=originY+cellSize-.01;
  const total=(roomWidth-2)*cellSize;
  const useFull=!!fullBackWallReady&&!!fullBackWall&&fullBackWall.naturalWidth===total&&fullBackWall.naturalHeight===wallHeight;
  for(let tx=1;tx<roomWidth-1;tx++){
   const first=tx===1,last=tx===roomWidth-2;
   const leftInset=first?overlap:0,rightInset=last?overlap:0;
   const worldWidth=cellSize+leftInset+rightInset;
   const panel=first?wallEdges.left:last?wallEdges.right:wallImage;
   const sourceX=(tx-1)*cellSize;
   objects.push({kind:'wall',x:originX+tx*cellSize-leftInset,foot:wallFoot,width:worldWidth,height:wallHeight,
    draw:(q,l,t,W,H)=>{
     q.imageSmoothingEnabled=false;
     const unit=W/worldWidth;
     const paint=(img,sx)=>{
      if(leftInset)q.drawImage(img,sx,0,leftInset,wallHeight,l,t,leftInset*unit,H);
      q.drawImage(img,sx,0,cellSize,wallHeight,l+leftInset*unit,t,cellSize*unit,H);
      if(rightInset)q.drawImage(img,sx+cellSize-rightInset,0,rightInset,wallHeight,l+(leftInset+cellSize)*unit,t,rightInset*unit,H);
     };
     paint(panel,0);
     if(useFull)paint(fullBackWall,sourceX);
    }});
  }
  return objects;
 }
 return {PROFILES,addRearWall};
})();

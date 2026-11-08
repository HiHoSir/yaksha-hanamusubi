/* The approved 80×112 four-direction Hana atlas; visual size is independent of
   the 32px walk/collision grid. Shared by field, village and interior renderers. */
((root,factory)=>{
 const api=factory(root);
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.YK_HANA_WALK=api;
})(typeof globalThis!=="undefined"?globalThis:window,root=>{
 "use strict";
 const PATH="assets/characters/hizuki/hana-20261107/walk/walk-atlas-80x112.png";
 const CELL_W=80,CELL_H=112;
 const FOOT_X=40,FOOT_Y=106; // Alpha ends at source y=105, exclusive end 106.
 const ROW={d:0,u:1,r:2,l:3};
 const HEIGHT=[99,100,97,97]; // Stable neutral-pose visible heights per direction.
 let image=null,failed=false,started=false;
 const callbacks=new Set();
 function ready(){return !!(image&&image.complete&&image.naturalWidth===240&&image.naturalHeight===448);}
 function ensure(callback){
  if(typeof callback==="function")callbacks.add(callback);
  if(ready())return true;
  if(!started&&typeof root.Image==="function"){
   started=true;image=new root.Image();
   image.onload=()=>{
    failed=!ready();
    for(const fn of callbacks)try{fn();}catch{}
    callbacks.clear();
   };
   image.onerror=()=>{failed=true;callbacks.clear();};
   image.src=PATH;
  }
  return false;
 }
 // Shared walking cadence used by production rendering and the preview.
 // Every grid step begins as A or B; its last 40% shows feet together.
 // Motion speed and collision positions are not affected by the visual pose.
 function frameAt(strideFrame,elapsedMs,durationMs,feetTogether=true){
  if(!feetTogether||strideFrame===1)return strideFrame;
  const duration=Number.isFinite(durationMs)&&durationMs>0?durationMs:1;
  return elapsedMs>=duration*.6?1:strideFrame;
 }
 // One source-cell resolver for both actual rendering and the proof overlay.
 function sourceCell(dir="d",frame=1){
  const row=ROW[dir]??0;
  const col=frame===1?0:frame===0?1:2;
  return {row,col,x:col*CELL_W,y:row*CELL_H,w:CELL_W,h:CELL_H};
 }
 function draw(ctx,x,foot,dir="d",frame=1,visibleHeight=48){
  if(!ready()){if(!failed)ensure();return false;}
  const source=sourceCell(dir,frame);
  const row=source.row;
  const height=Number.isFinite(visibleHeight)?Math.max(1,visibleHeight):48;
  const scale=height/HEIGHT[row];
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,source.x,source.y,source.w,source.h,
   x-FOOT_X*scale,foot-FOOT_Y*scale,CELL_W*scale,CELL_H*scale);
  ctx.restore();
  return true;
 }
 // QA only: show the actual direction row, with the rendered source cell
 // outlined. This uses sourceCell(), so the proof and the sprite cannot diverge.
 function drawSourceProof(ctx,dir="d",frame=1){
  if(!ready()){if(!failed)ensure();return false;}
  const cell=sourceCell(dir,frame);
  ctx.save();
  ctx.clearRect(0,0,CELL_W*3,CELL_H);
  ctx.imageSmoothingEnabled=false;
  ctx.fillStyle="#26333b";
  ctx.fillRect(0,0,CELL_W*3,CELL_H);
  ctx.drawImage(image,0,cell.row*CELL_H,CELL_W*3,CELL_H,0,0,CELL_W*3,CELL_H);
  ctx.lineWidth=3;
  ctx.strokeStyle="#ffdf66";
  ctx.strokeRect(cell.x+1.5,1.5,CELL_W-3,CELL_H-3);
  ctx.restore();
  return cell;
 }
 return {PATH,CELL_W,CELL_H,FOOT_X,FOOT_Y,ROW,ready,ensure,sourceCell,frameAt,draw,drawSourceProof};
});

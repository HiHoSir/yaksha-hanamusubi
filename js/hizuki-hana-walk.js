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
 function draw(ctx,x,foot,dir="d",frame=1,visibleHeight=48){
  if(!ready()){if(!failed)ensure();return false;}
  const row=ROW[dir]??0;
  // Current game convention: 1=neutral, 0=step A, 2=step B.
  const col=frame===1?0:frame===0?1:2;
  const height=Number.isFinite(visibleHeight)?Math.max(1,visibleHeight):48;
  const scale=height/HEIGHT[row];
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,col*CELL_W,row*CELL_H,CELL_W,CELL_H,
   x-FOOT_X*scale,foot-FOOT_Y*scale,CELL_W*scale,CELL_H*scale);
  ctx.restore();
  return true;
 }
 return {PATH,CELL_W,CELL_H,FOOT_X,FOOT_Y,ROW,ready,ensure,draw};
});

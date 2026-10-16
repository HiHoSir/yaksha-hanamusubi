// Reusable wall-only top darkness mask. Apply to each wall sprite, never the full scene.
window.YK_INTERIOR_WALL_SHADE=(()=>{
 function apply(ctx,x,y,width,height,config={}){
  const darkHeight=Math.max(0,Math.min(height,config.height??height));
  if(!darkHeight||width<=0)return;
  const topAlpha=Math.max(0,Math.min(1,config.topAlpha??1));
  const midAlpha=Math.max(0,Math.min(1,config.midAlpha??0.46));
  const g=ctx.createLinearGradient(0,y,0,y+darkHeight);
  g.addColorStop(0,`rgba(0,0,0,${topAlpha})`);
  g.addColorStop(.45,`rgba(0,0,0,${midAlpha})`);
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.save();ctx.fillStyle=g;ctx.fillRect(x,y,width,darkHeight);ctx.restore();
 }
 return {apply};
})();

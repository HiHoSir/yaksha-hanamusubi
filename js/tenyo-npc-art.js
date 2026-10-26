// Approved stationary shrine residents. A facing change selects one fixed pose.
window.YK_TENYO_NPC=(()=>{
 const names={miko:'shirotae',guard:'guardian'},images={};
 let pending=null,redraw=()=>{},failed=false;
 function load(change){
  if(typeof change==='function')redraw=change;
  if(pending)return;
  pending=Promise.all(Object.entries(names).map(([type,name])=>new Promise((resolve,reject)=>{
   const im=images[type]=new Image();
   im.onload=()=>{resolve();redraw();};
   im.onerror=()=>{failed=true;reject(new Error('社の人物画像を読み込めません: '+name));redraw();};
   im.src=type==='miko'?'assets/characters/tenyo-npc-v3/shirotae-walk-96x128.png?v=16.1.62':'assets/characters/tenyo-npc-v1/'+name+'.png?v=16.1.21';
   if(im.complete&&im.naturalWidth)im.onload();
  })));
  pending.catch(()=>{});
 }
 function whenReady(change){load(change);return pending;}
 function draw(c,x,y,type,dir='d',size=1){
  const im=images[type];if(!im?.complete||!im.naturalWidth)return false;
  const row=({d:0,u:1,l:2,r:3})[dir]??0;
  const foot=y+9*.56*size;
  // User-approved RGBA atlas. Keep 28px SD scale; idle NPC remains stationary.
  if(type==='miko'){
   const sdRow=({d:0,u:1,r:2,l:3})[dir]??0;
   const scale=(28/27)*size;
   c.save();c.imageSmoothingEnabled=false;
   c.fillStyle='rgba(16,24,32,.17)';c.beginPath();c.ellipse(x,foot,14*size,4*size,0,0,Math.PI*2);c.fill();
   c.drawImage(im,0,sdRow*32,32,32,x-16*scale,foot-30*scale,32*scale,32*scale);
   c.restore();return true;
  }
  const scale=58*.96/232*size;
  c.save();c.imageSmoothingEnabled=true;
  c.fillStyle='rgba(16,24,32,.17)';c.beginPath();c.ellipse(x,foot,14*size,4*size,0,0,Math.PI*2);c.fill();
  c.drawImage(im,0,row*256,256,256,x-128*scale,foot-248*scale,256*scale,256*scale);
  c.restore();return true;
 }
 return {load,whenReady,draw,failed:()=>failed};
})();


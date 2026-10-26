// Shrine residents. Shirotae uses the approved true-32px atlas; guardian retains its previous art.
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
   im.src=type==='miko'
    ?'assets/characters/tenyo-npc-v2/shirotae-walk-96x128.png?v=16.1.21'
    :'assets/characters/tenyo-npc-v1/'+name+'.png?v=16.1.21';
   if(im.complete&&im.naturalWidth)im.onload();
  })));
  pending.catch(()=>{});
 }
 function whenReady(change){load(change);return pending;}
 function draw(c,x,y,type,dir='d',size=1,frame=0){
  const im=images[type];if(!im?.complete||!im.naturalWidth)return false;
  const foot=y+9*.56*size;
  c.save();
  if(type==='miko'){
   // Atlas: rows front/back/right/left, cols idle/walkA/walkB; 32px logical cells.
   // The shrine's local view passes size=.56. Keep the prior NPC scale and foot anchor.
   const row=({d:0,u:1,r:2,l:3})[dir]??0;
   const col=Math.max(0,Math.min(2,Math.trunc(Number(frame)||0)));
   const side=52*size;
   c.imageSmoothingEnabled=false;
   c.fillStyle='rgba(16,24,32,.17)';
   c.beginPath();c.ellipse(x,foot,14*size,4*size,0,0,Math.PI*2);c.fill();
   c.drawImage(im,col*32,row*32,32,32,x-side/2,foot-side+2*size,side,side);
  }else{
   const row=({d:0,u:1,l:2,r:3})[dir]??0;
   const scale=58*.96/232*size;
   c.imageSmoothingEnabled=true;
   c.fillStyle='rgba(16,24,32,.17)';
   c.beginPath();c.ellipse(x,foot,14*size,4*size,0,0,Math.PI*2);c.fill();
   c.drawImage(im,0,row*256,256,256,x-128*scale,foot-248*scale,256*scale,256*scale);
  }
  c.restore();return true;
 }
 return {load,whenReady,draw,failed:()=>failed};
})();

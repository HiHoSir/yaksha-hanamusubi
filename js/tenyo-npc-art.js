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
   im.src='assets/characters/tenyo-npc-v1/'+name+'.png?v=16.1.21';
   if(im.complete&&im.naturalWidth)im.onload();
  })));
  pending.catch(()=>{});
 }
 let decodedReady=null;
 function whenReady(change){load(change);return decodedReady??=pending.then(()=>Promise.all(Object.values(images).map(im=>im.decode?.())));}
 function draw(c,x,y,type,dir='d',size=1){
  const im=images[type];if(!im?.complete||!im.naturalWidth)return false;
  const row=({d:0,u:1,l:2,r:3})[dir]??0;
  const scale=58*.96/232*size,foot=y+9*.56*size;
  c.save();c.imageSmoothingEnabled=true;
  c.fillStyle='rgba(16,24,32,.17)';c.beginPath();c.ellipse(x,foot,14*size,4*size,0,0,Math.PI*2);c.fill();
  c.drawImage(im,0,row*256,256,256,x-128*scale,foot-248*scale,256*scale,256*scale);
  c.restore();return true;
 }
 return {load,whenReady,draw,failed:()=>failed};
})();

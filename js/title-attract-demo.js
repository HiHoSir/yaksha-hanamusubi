// Title attract loop: only renders approved game scenes into an isolated canvas.
// It never changes gameState, enters areas, triggers encounters, or writes saves.
(()=>{"use strict";
 const title=document.getElementById("title");
 const mainActions=document.getElementById("titleMainActions");
 const manual=document.getElementById("watchDemo");
 if(!title||!mainActions||!manual)return;
 const host=document.createElement("div");
 host.id="ykAttract";host.hidden=true;host.setAttribute("role","dialog");
 host.setAttribute("aria-label","ゲーム内風景のオープニングデモ");
 host.innerHTML='<div class="ykAttractFrame"><canvas width="768" height="768" aria-label="ゲーム内の風景"></canvas></div><div class="ykAttractCaption"></div><div class="ykAttractHint">画面をタップ、またはキーを押すとタイトルに戻ります</div>';
 title.appendChild(host);
 const canvas=host.querySelector("canvas"),q=canvas.getContext("2d",{alpha:false});
 const frame=host.querySelector(".ykAttractFrame"),caption=host.querySelector(".ykAttractCaption");
 const idleMs=12000,sceneMs=6600;
 let idleTimer=0,sceneTimer=0,sceneResolve=null,active=false,serial=0,blockClicksUntil=0;
 const history=[];
 const sceneNames=[["village","鬼灯村"],["field","花霞野"],["shrine","天妖の社"]];
 const safeTitle=()=>title.classList.contains("show")&&!mainActions.hidden&&!document.hidden&&!window.YK_PROLOGUE?.active;
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const bounded=(p,ms=10000)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(Error("読み込み時間を超えました")),ms))]);
 let fieldHero=null,fieldHeroImage=null;
 function image(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error("画像を読み込めません: "+src));im.src=src;});}
 async function prepare(id){
  if(id==="village"){await bounded(window.YK_HOZUKI.whenReady());return window.YK_HOZUKI.ready();}
  if(id==="shrine"){await bounded(window.YK_TENYO.whenReady());return window.YK_TENYO.ready();}
  if(id==="field"){
   window.YK_LANDSCAPE.load(()=>{});
   if(!fieldHero)fieldHero=image("assets/characters/hizuki/field-sd-v3/walk-atlas-32.png?v=16.1.65").catch(()=>null);
   await bounded(Promise.all([fieldHero,(async()=>{for(let i=0;i<90&&!window.YK_LANDSCAPE.ready();i++)await pause(100);return window.YK_LANDSCAPE.ready();})()]));
   return window.YK_LANDSCAPE.ready();
  }
  return false;
 }
 function snapshot(id){
  const surface=document.createElement("canvas");surface.width=surface.height=768;
  const c=surface.getContext("2d",{alpha:false});
  c.fillStyle="#0b1726";c.fillRect(0,0,768,768);c.imageSmoothingEnabled=false;
  if(id==="village"){
   const s={x:336,y:528,dir:"u",frame:1};
   if(!window.YK_HOZUKI.draw(c,s,s,false))throw Error("鬼灯村の描画に失敗しました");
  }else if(id==="shrine"){
   window.YK_TENYO.draw(c,{x:432,y:432,dir:"d",frame:1,chests:{}},null,null,null,false);
  }else if(id==="field"){
   const [x,y]=window.YK_WORLD.start;
   c.save();c.translate(0,32);c.scale(1.2,1.2);
   const im=fieldHeroImage;
   const ok=window.YK_LANDSCAPE.drawQuarter(c,window.YK_WORLD.mapData,{
    x,foot:y,draw:(px,py,z)=>{
     if(!im||!im.naturalWidth)return;
     const scale=0.9*z;
     c.drawImage(im,32,0,32,32,px-16*scale,py-29*scale,32*scale,32*scale);
    }
   },1.4,{oceanOutside:true,elevationTerrain:true});
   c.restore();if(!ok)throw Error("フィールド描画に失敗しました");
  }
  return surface;
 }
 function resetIdle(){
  clearTimeout(idleTimer);idleTimer=0;
  if(!active&&safeTitle())idleTimer=setTimeout(()=>{start();},idleMs);
 }
 function stop(){
  ++serial;active=false;clearTimeout(sceneTimer);sceneTimer=0;
  if(sceneResolve){const finish=sceneResolve;sceneResolve=null;finish();}
  host.hidden=true;frame.classList.remove("ykAttractEnter");
  resetIdle();
 }
 async function start(){
  if(active||!safeTitle())return false;
  clearTimeout(idleTimer);active=true;
  const token=++serial;host.hidden=false;
  caption.textContent="旅の景色を読み込んでいます…";
  frame.classList.remove("ykAttractEnter");
  let shown=0;
  for(const [id,name] of sceneNames){
   if(token!==serial||!active||!safeTitle()){if(token===serial)stop();return false;}
   try{
    const ready=await prepare(id);
    if(!ready)throw Error("描画素材が未準備です");
    if(id==="field")fieldHeroImage=await fieldHero;
    if(token!==serial||!active)return false;
    const still=snapshot(id);
    q.clearRect(0,0,768,768);q.drawImage(still,0,0);
    caption.textContent=name;history.push(id);shown++;
    frame.classList.remove("ykAttractEnter");void frame.offsetWidth;
    frame.classList.add("ykAttractEnter");
    await new Promise(resolve=>{sceneResolve=resolve;sceneTimer=setTimeout(()=>{sceneResolve=null;resolve();},sceneMs);});
   }catch(error){
    console.warn("[title-demo] skip "+id+":",error);
    history.push("skip:"+id);
   }
  }
  if(token===serial&&active){
   if(!shown){caption.textContent="デモを読み込めませんでした";await pause(1100);}
   stop();
  }
  return shown>0;
 }
 // Pointer/keyboard input never falls through to the game while the demo is visible.
 function onPointer(event){
  if(active){
   event.preventDefault();event.stopImmediatePropagation();
   blockClicksUntil=performance.now()+550;stop();return;
  }
  if(title.classList.contains("show"))resetIdle();
 }
 function onKey(event){
  if(active){event.preventDefault();event.stopImmediatePropagation();stop();}
  else if(title.classList.contains("show"))resetIdle();
 }
 document.addEventListener("pointerdown",onPointer,true);
 document.addEventListener("click",event=>{if(performance.now()<blockClicksUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
 document.addEventListener("keydown",onKey,true);
 document.addEventListener("visibilitychange",()=>{if(document.hidden){if(active)stop();clearTimeout(idleTimer);}else resetIdle();});
 new MutationObserver(()=>{if(!title.classList.contains("show")){if(active)stop();clearTimeout(idleTimer);}else resetIdle();}).observe(title,{attributes:true,attributeFilter:["class"]});
 manual.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();start();});
 window.YK_TITLE_DEMO={start,stop,sceneNames:sceneNames.map(x=>x[0]),history,get active(){return active;}};
 resetIdle();
})();
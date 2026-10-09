window.YK_INPUT=(()=>{
const timers=new Map();
const directionStops=[];
// A touch handler may replace its button before the synthetic click arrives.
// Retain the logical control key across those DOM replacements.
let lastTouch={at:-Infinity,key:null};
function hold(el,fn){
 if(!el)return;
 const stop=()=>{const t=timers.get(el);if(t){clearTimeout(t.delay);clearInterval(t.repeat);timers.delete(el)}};
 el.addEventListener("pointerdown",e=>{e.preventDefault();stop();
 try{el.setPointerCapture?.(e.pointerId)}catch(_){}
 // Register before fn: an area transition may synchronously call stopAll().
 const t={};timers.set(el,t);fn();
 if(timers.get(el)!==t)return;
 t.delay=setTimeout(()=>{if(timers.get(el)===t)t.repeat=setInterval(fn,105)},260)});
 ["pointerup","pointercancel","pointerleave","lostpointercapture"].forEach(n=>el.addEventListener(n,stop));
}
function tap(el,fn){
 if(!el)return;
 // iOS-safe activation: click is the primary path; pointerdown is only a fallback
 // for environments where click is not emitted. De-dupe synthetic click.
 let pointerFiredAt=0;
 const controlKey=()=>el.id||JSON.stringify(Object.entries(el.dataset||{}).sort());
 const run=e=>{try{e?.preventDefault?.()}catch(_){} fn(e)};
 el.addEventListener("click",e=>{if(Date.now()-pointerFiredAt<700||(Date.now()-lastTouch.at<700&&lastTouch.key===controlKey())){e.preventDefault();return;}run(e)});
 el.addEventListener("pointerup",e=>{if(e.pointerType==="mouse")return;pointerFiredAt=Date.now();lastTouch={at:pointerFiredAt,key:controlKey()};run(e)});
}
function stopAll(){for(const stop of directionStops)stop();for(const [el,t] of timers){clearTimeout(t.delay);clearInterval(t.repeat)}timers.clear()}
window.addEventListener("blur",stopAll);window.addEventListener("pagehide",stopAll);document.addEventListener("visibilitychange",()=>{if(document.hidden)stopAll()});
function directions(bindings,fn,timing=()=>({delay:260,repeat:105})){
 const pressed=new Map();let timer=null;
 const stop=()=>{pressed.clear();clearTimeout(timer);timer=null;};directionStops.push(stop);
 const vector=()=>{let x=0,y=0;for(const v of pressed.values()){x+=v[0];y+=v[1];}return [Math.sign(x),Math.sign(y)];};
 const step=()=>{const [x,y]=vector();if(x||y)fn(x,y);};
 const repeat=()=>{timer=null;if(!pressed.size)return;step();if(pressed.size)timer=setTimeout(repeat,timing().repeat);};
 const press=(key,v)=>{if(pressed.has(key))return;pressed.set(key,v);step();if(pressed.size&&timer===null)timer=setTimeout(repeat,timing().delay);};
 const release=key=>{pressed.delete(key);if(!pressed.size){clearTimeout(timer);timer=null;}};
 for(const [el,v] of bindings){
  el.addEventListener("pointerdown",e=>{e.preventDefault();try{el.setPointerCapture?.(e.pointerId)}catch(_){}press("p"+e.pointerId,v);});
  // Lock the chosen direction until release. On iPhone, a held thumb can drift
  // across neighboring buttons; changing direction mid-hold caused accidental turns.
  for(const type of ["pointerup","pointercancel","lostpointercapture"])el.addEventListener(type,e=>release("p"+e.pointerId));
 }
 const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
 document.addEventListener("keydown",e=>{if(!keys[e.key]||e.metaKey||e.ctrlKey||e.altKey||["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName))return;e.preventDefault();if(!e.repeat)press(e.key,keys[e.key]);});
 document.addEventListener("keyup",e=>{if(keys[e.key])release(e.key);});
 // Virtual stick: maintain the original step scheduler for tile-based scenes.
 // Do not change direction near the 45-degree boundary until the new
 // axis wins by a margin. The old keyboard mapping remains intact.
 const stick=document.getElementById("virtualStick");
 const knob=document.getElementById("virtualStickKnob");
 let activePointer=null,stickDirection=null;
 const stickStop=()=>{activePointer=null;stickDirection=null;release("virtual-stick");if(knob)knob.style.transform="translate(-50%,-50%)";};
 directionStops.push(stickStop);
 function stickUpdate(e){
  if(!stick)return;
  const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  const reach=Math.max(1,Math.min(r.width,r.height)*.32);
  let x=(e.clientX-cx)/reach,y=(e.clientY-cy)/reach;
  const n=Math.hypot(x,y);
  if(n>1){x/=n;y/=n;}
  if(knob)knob.style.transform="translate(calc(-50% + "+(x*reach)+"px),calc(-50% + "+(y*reach)+"px))";
  const mag=Math.hypot(x,y);
  if(mag<.23){if(stickDirection){release("virtual-stick");stickDirection=null;}return;}
  const ax=Math.abs(x),ay=Math.abs(y);
  // 20% dominance margin prevents oscillation around diagonal input.
  let dir=stickDirection;
  if(!dir)dir=ax>=ay?(x>=0?"r":"l"):(y>=0?"d":"u");
  else if(dir==="l"||dir==="r"){
   if(ay>ax*1.2)dir=y>=0?"d":"u";
   else if(ax>.2)dir=x>=0?"r":"l";
  }else{
   if(ax>ay*1.2)dir=x>=0?"r":"l";
   else if(ay>.2)dir=y>=0?"d":"u";
  }
  if(dir!==stickDirection){
   release("virtual-stick");stickDirection=dir;
   const v={l:[-1,0],r:[1,0],u:[0,-1],d:[0,1]}[dir];
   press("virtual-stick",v);
  }
 }
 if(stick){
  stick.addEventListener("pointerdown",e=>{
   if(activePointer!==null)return;
   e.preventDefault();activePointer=e.pointerId;
   try{stick.setPointerCapture(e.pointerId)}catch(_){}
   stickUpdate(e);
  });
  stick.addEventListener("pointermove",e=>{if(e.pointerId===activePointer){e.preventDefault();stickUpdate(e);}});
  for(const name of ["pointerup","pointercancel","lostpointercapture"])
   stick.addEventListener(name,e=>{if(e.pointerId===activePointer)stickStop();});
 }
 return {vector};
}
return {hold,tap,stopAll,directions};
})();

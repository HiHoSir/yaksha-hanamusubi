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
 return {vector};
}
return {hold,tap,stopAll,directions};
})();

window.YK_INPUT=(()=>{
const timers=new Map();
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
function tap(el,fn){if(!el)return;el.addEventListener("pointerdown",e=>{e.preventDefault();fn(e)})}
function stopAll(){for(const [el,t] of timers){clearTimeout(t.delay);clearInterval(t.repeat)}timers.clear()}
window.addEventListener("blur",stopAll);window.addEventListener("pagehide",stopAll);document.addEventListener("visibilitychange",()=>{if(document.hidden)stopAll()});
return {hold,tap,stopAll};
})();

window.YK_INPUT=(()=>{
const timers=new Map();
function hold(el,fn){
 if(!el)return;
 const stop=()=>{const t=timers.get(el);if(t){clearTimeout(t.delay);clearInterval(t.repeat);timers.delete(el)}};
 el.addEventListener("pointerdown",e=>{e.preventDefault();stop();fn();const t={};t.delay=setTimeout(()=>{t.repeat=setInterval(fn,105)},260);timers.set(el,t)});
 ["pointerup","pointercancel","pointerleave"].forEach(n=>el.addEventListener(n,stop));
}
function tap(el,fn){if(!el)return;el.addEventListener("pointerdown",e=>{e.preventDefault();fn(e)})}
function stopAll(){for(const [el,t] of timers){clearTimeout(t.delay);clearInterval(t.repeat)}timers.clear()}
window.addEventListener("blur",stopAll);document.addEventListener("visibilitychange",()=>{if(document.hidden)stopAll()});
return {hold,tap,stopAll};
})();
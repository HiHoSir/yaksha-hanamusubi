// Exercise the actual standalone mobile preview script with a deterministic
// held-pointer/keyboard scheduler. No browser or save storage is involved.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../previews/hizuki-hana-walk-toggle.html"),"utf8");
const scripts=[html.split("<script>")[1]?.split("</script>")[0]].filter(x=>x?.trim());
assert.equal(scripts.length,1,"single preview app inline script");
const trace=[],elements=new Map(),listeners=new Map(),buttonListeners=[];
let time=0,nextId=0;
const timers=new Map(),intervals=new Map(),rafs=new Map();
function element(id){
 if(elements.has(id))return elements.get(id);
 const e={id,textContent:"",value:"hana",width:768,height:640,handlers:{},
  addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);},
  fire(name,event={}){for(const fn of this.handlers[name]||[])fn(event);},
  setPointerCapture(){},
  getContext(){return canvas;},
 };
 elements.set(id,e);return e;
}
const canvas={
 save(){},restore(){},clearRect(){},fillRect(){},translate(){},scale(){},
 beginPath(){},ellipse(){},fill(){},drawImage(){},
 set imageSmoothingEnabled(v){},set fillStyle(v){}
};
for(const dir of ["u","d","l","r"]){
 const el=element("button-"+dir);el.dataset={dir};buttonListeners.push(el);
}
const document={
 hidden:false,getElementById:element,
 querySelectorAll(q){assert.equal(q,"[data-dir]");return buttonListeners;},
 addEventListener(name,fn){(listeners.get(name)||listeners.set(name,[]).get(name)).push(fn);}
};
const window={addEventListener(name,fn){(listeners.get("window:"+name)||listeners.set("window:"+name,[]).get("window:"+name)).push(fn);}};
class Image{
 constructor(){this.onload=null;this.onerror=null;}
 set src(p){this._src=p;if(this.onload)this.onload();}
 get src(){return this._src;}
}
const app={
 document,window,Image,
 YK_HANA_WALK:{ensure(fn){return true;},ready(){return true;},
  draw(ctx,x,y,dir,frame,height){trace.push({x,y,dir,frame,height});}
 },
 fetch:async ()=>({ok:true,json:async ()=>({blocked:[]})}),
 performance:{now(){return time;}},
 requestAnimationFrame(fn){const id=++nextId;rafs.set(id,fn);return id;},
 cancelAnimationFrame(id){rafs.delete(id);},
 setTimeout(fn,ms){const id=++nextId;timers.set(id,{fn,due:time+ms});return id;},
 clearTimeout(id){timers.delete(id);},
 setInterval(fn,ms){const id=++nextId;intervals.set(id,{fn,ms,due:time+ms});return id;},
 clearInterval(id){intervals.delete(id);},
 console
};
async function flush(){await Promise.resolve();await Promise.resolve();await Promise.resolve();}
function advance(ms){
 const target=time+ms;
 for(let n=0;n<1000;n++){
  const next=Math.min(Infinity,
   ...[...timers.values()].map(v=>v.due),
   ...[...intervals.values()].map(v=>v.due));
  if(next>target)break;
  time=next;
  for(const [id,entry] of [...timers])if(entry.due<=time){timers.delete(id);entry.fn();}
  for(const [id,entry] of [...intervals])if(entry.due<=time){
   entry.due+=entry.ms;entry.fn();
  }
  for(const [id,fn] of [...rafs]){rafs.delete(id);fn();}
 }
 time=target;
 for(const [id,fn] of [...rafs]){rafs.delete(id);fn();}
}
function pointer(button,name,xy={}){button.fire(name,{button:0,pointerId:1,clientX:0,clientY:0,preventDefault(){},...xy});}
function fireDocument(name,key){for(const fn of listeners.get(name)||[])fn({key,preventDefault(){}});}
function last(){return trace[trace.length-1];}
(async()=>{
 vm.runInNewContext(scripts[0],app,{filename:"hizuki-hana-walk-toggle.html"});
 await flush();

 const up=element("button-u");
 pointer(up,"pointerdown");
 assert.equal(last().frame,0,"first held step starts with A");
 assert.equal(last().dir,"u");
 assert.equal(intervals.size,1,"long press must install repeating movement");
 const firstFoot=last().y;
 advance(190);
 assert.equal(last().frame,1,"first step must pass through neutral before B");
 advance(150);
 assert.equal(last().frame,2,"second full step must display B");
 assert(last().y<firstFoot,"held walking must move across multiple grid cells");
 advance(190);
 assert.equal(last().frame,1,"second step must pass through neutral before A");
 advance(150);
 assert.equal(last().frame,0,"third step must return to A");
 advance(340);
 assert.equal(last().frame,2,"fourth step must display B");
 const heldLast=last().y;
 pointer(up,"pointerup");
 assert.equal(intervals.size,0,"releasing button must stop repeated travel");
 up.fire("click",{detail:1});
 assert.equal(last().y,heldLast,"pointer click must not cause extra movement");
 advance(500);
 assert.equal(element("pose").textContent.includes("直立"),true,"release settles on idle");

 // Side walking is checked by the near arm: A = arm behind, B = arm ahead.
 // This validates visible frame selection, not merely the stride counter.
 const right=element("button-r");
 pointer(right,"pointerdown");
 assert.equal(last().frame,0);
 assert.equal(element("pose").textContent.includes("手前の腕 後ろ"),true,"right A arm is behind");
 advance(340);
 assert.equal(last().frame,2);
 assert.equal(element("pose").textContent.includes("手前の腕 前"),true,"right B arm is ahead");
 pointer(right,"pointerup");
 advance(500);
 const left=element("button-l");
 pointer(left,"pointerdown");
 assert.equal(last().frame,0);
 assert.equal(element("pose").textContent.includes("手前の腕 後ろ"),true,"left A arm is behind");
 advance(340);
 assert.equal(last().frame,2);
 assert.equal(element("pose").textContent.includes("手前の腕 前"),true,"left B arm is ahead");
 pointer(left,"pointerup");
 advance(500);

 const unchangedFoot=last().y;
 element("variant").fire("change",{target:{value:"sd"}});
 assert.equal(last().y,unchangedFoot,"switching sprites must not move hero");
 element("variant").fire("change",{target:{value:"hana"}});
 element("walkSpeed").fire("change",{target:{value:"normal"}});
 const stage=element("stage");
 pointer(stage,"pointerdown",{clientX:100,clientY:100,pointerId:2});
 stage.fire("pointermove",{pointerId:2,clientX:100,clientY:50});
 assert.equal(intervals.size,1,"drag must start continuous walking");
 advance(190);assert.equal(last().dir,"u");
 stage.fire("pointermove",{pointerId:2,clientX:160,clientY:100});
 assert.equal(intervals.size,1,"change of drag direction must not leak timers");
 assert.equal(element("pose").textContent.includes("右向き"),true);
 stage.fire("pointerup",{pointerId:2,clientX:160,clientY:100});
 assert.equal(intervals.size,0,"end drag must stop repeat");
 fireDocument("keydown","ArrowLeft");assert.equal(intervals.size,1,"keyboard holds must repeat");
 fireDocument("keyup","ArrowLeft");assert.equal(intervals.size,0,"keyboard release stops repeat");
 assert.equal(trace.some(x=>x.dir==="r"&&x.frame===0),true,"side A actually drawn");
 assert.equal(trace.some(x=>x.dir==="r"&&x.frame===2),true,"side B actually drawn");
 assert.equal(trace.some(x=>x.dir==="r"&&x.frame===1),true,"side neutral actually drawn");
 assert.equal(trace.some(x=>x.dir==="l"&&x.frame===0),true,"left A actually drawn");
 assert.equal(trace.some(x=>x.dir==="l"&&x.frame===2),true,"left B actually drawn");
 assert(!/localStorage|sessionStorage/.test(scripts[0]),"preview must not touch production saves");
 console.log("PASS A→idle→B→idle, visible right/left near-arm swing, selectable slow speed, held buttons, drag, keyboard, art switch and save isolation");
})().catch(e=>{console.error(e);process.exitCode=1;});

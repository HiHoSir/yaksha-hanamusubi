// Exercise the actual standalone mobile preview script with a deterministic
// held-pointer/keyboard scheduler. No browser or save storage is involved.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../previews/hizuki-hana-walk-toggle.html"),"utf8");
const scripts=[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)].map(x=>x[1]).filter(x=>x.trim());
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
 setTimeout(fn,ms){const id=++nextId;timers.set(id,{fn,ms});return id;},
 clearTimeout(id){timers.delete(id);},
 setInterval(fn,ms){const id=++nextId;intervals.set(id,{fn,ms});return id;},
 clearInterval(id){intervals.delete(id);},
 console
};
async function flush(){await Promise.resolve();await Promise.resolve();await Promise.resolve();}
function advance(ms){
 time+=ms;
 for(const [id,fn] of [...rafs]){rafs.delete(id);fn();}
 for(const entry of [...intervals.values()])entry.fn();
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
 advance(190);assert.equal(last().frame,2,"second step must display B");
 assert(last().y<firstFoot,"held walking must move across multiple grid cells");
 advance(190);assert.equal(last().frame,0,"third step returns to A");
 advance(190);assert.equal(last().frame,2,"fourth step displays B");
 const heldLast=last().y;
 pointer(up,"pointerup");
 assert.equal(intervals.size,0,"releasing button must stop repeated travel");
 up.fire("click",{detail:1});
 assert.equal(last().y,heldLast,"pointer click must not cause extra movement");
 for(const {fn} of [...timers.values()])fn();
 assert.equal(element("pose").textContent.includes("待機"),true,"release settles on idle");
 const unchangedFoot=last().y;
 element("variant").fire("change",{target:{value:"sd"}});
 assert.equal(last().y,unchangedFoot,"switching sprites must not move hero");
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
 assert.equal(trace.some(x=>x.frame===0),true);
 assert.equal(trace.some(x=>x.frame===2),true);
 assert(!/localStorage|sessionStorage/.test(scripts[0]),"preview must not touch production saves");
 console.log("PASS held direction buttons, 4 alternating stride frames, pointer drag, keyboard repeat, release idle, art switch and save isolation");
})().catch(e=>{console.error(e);process.exitCode=1;});

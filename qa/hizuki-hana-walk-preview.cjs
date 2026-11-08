// Exercise the actual standalone mobile preview script with a deterministic
// held-pointer/keyboard scheduler. No browser or save storage is involved.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../previews/hizuki-hana-walk-toggle.html"),"utf8");
const scripts=[html.split("<script>")[1]?.split("</script>")[0]].filter(x=>x?.trim());
assert.equal(scripts.length,1,"single preview app inline script");
const trace=[],proofTrace=[],elements=new Map(),listeners=new Map(),buttonListeners=[];
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
  draw(ctx,x,y,dir,frame,height){trace.push({x,y,dir,frame,height});},
  drawSourceProof(ctx,dir,frame){
   const row={d:0,u:1,r:2,l:3}[dir],col=frame===1?0:frame===0?1:2;
   const cell={row,col,x:col*80,y:row*112,w:80,h:112};
   proofTrace.push({dir,frame,...cell});return cell;
  }
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
 const traceStart=trace.length;
 pointer(up,"pointerdown");
 assert.equal(last().frame,0,"first held step starts with A");
 assert.equal(last().dir,"u");
 assert.equal(intervals.size,1,"held direction must repeat movement");
 const firstFoot=last().y;
 advance(190);
 assert.equal(last().frame,0,"A must remain visible until B: NO in-between idle");
 advance(150);
 assert.equal(last().frame,2,"next stride must show B immediately after A");
 assert(last().y<firstFoot,"held walking advances more than one tile");
 advance(340);
 assert.equal(last().frame,0,"third step must be A, never idle");
 advance(340);
 assert.equal(last().frame,2,"fourth step must be B, never idle");
 assert(trace.slice(traceStart).every(x=>x.frame===0||x.frame===2),
  "no neutral frame may be drawn during continuous movement");
 const heldLast=last().y;
 pointer(up,"pointerup");
 assert.equal(intervals.size,0,"releasing button stops movement");
 up.fire("click",{detail:1});
 assert.equal(last().y,heldLast,"touch-generated click must not move again");
 advance(500);
 assert.equal(last().frame,1,"stopped character returns to neutral");
 assert(element("pose").textContent.includes("直立"),"stopped pose label matches");

 // Inspect the exact selected source row and column in both side directions.
 // This is more trustworthy than assuming limb depth from left/right silhouettes.
 for(const [dir,row] of [["r",3],["l",4]]){
  const button=element("button-"+dir);
  const startIndex=trace.length;
  pointer(button,"pointerdown");
  const first=last().frame,second=first===0?2:0;
  assert([0,2].includes(first),dir+" first step must be A or B");
  assert(element("sourceProofLabel").textContent.includes(row+"行目 "+(first===0?2:3)+"列目"),dir+" source frame first");
  assert.equal(proofTrace.at(-1).row,row-1,"correct atlas source row");
  advance(200);
  assert.equal(last().frame,first,dir+" first stride must not become neutral halfway");
  advance(140);
  assert.equal(last().frame,second,dir+" next stride must alternate");
  assert(element("sourceProofLabel").textContent.includes(row+"行目 "+(second===0?2:3)+"列目"),dir+" source frame second");
  assert.equal(proofTrace.at(-1).col,second===0?1:2,"correct atlas source column");
  advance(190);
  assert.equal(last().frame,second,dir+" second stride remains visible halfway");
  advance(150);
  assert.equal(last().frame,first,dir+" third stride must alternate again");
  assert(trace.slice(startIndex).every(x=>x.frame!==1),
   dir+" continuous side walking must never insert idle");
  assert(proofTrace.some(x=>x.dir===dir&&x.col===1),"A source proof highlighted");
  assert(proofTrace.some(x=>x.dir===dir&&x.col===2),"rightmost B source proof highlighted");
  pointer(button,"pointerup");
  advance(500);
  assert.equal(last().frame,1,dir+" release returns to neutral");
 }

 const unchangedFoot=last().y;
 element("variant").fire("change",{target:{value:"sd"}});
 assert.equal(last().y,unchangedFoot,"switching sprites must not move hero");
 assert.equal(element("sourceProof").hidden,true,"proof hidden when legacy sprite selected");
 element("variant").fire("change",{target:{value:"hana"}});
 assert.equal(element("sourceProof").hidden,false,"proof visible for new sprites");
 element("walkSpeed").fire("change",{target:{value:"normal"}});
 const stage=element("stage");
 pointer(stage,"pointerdown",{clientX:100,clientY:100,pointerId:2});
 stage.fire("pointermove",{pointerId:2,clientX:100,clientY:50});
 assert.equal(intervals.size,1,"drag must start continuous walking");
 advance(190);assert.equal(last().dir,"u");
 stage.fire("pointermove",{pointerId:2,clientX:160,clientY:100});
 assert.equal(intervals.size,1,"changing drag direction must not leak timers");
 assert(element("pose").textContent.includes("右向き"),"drag turns right");
 stage.fire("pointerup",{pointerId:2,clientX:160,clientY:100});
 assert.equal(intervals.size,0,"end drag stops repeat");
 fireDocument("keydown","ArrowLeft");assert.equal(intervals.size,1,"keyboard holds repeat");
 fireDocument("keyup","ArrowLeft");assert.equal(intervals.size,0,"keyboard release stops");
 for(const dir of ["r","l"]){
  assert(trace.some(x=>x.dir===dir&&x.frame===0),dir+" A actually drawn");
  assert(trace.some(x=>x.dir===dir&&x.frame===2),dir+" B actually drawn");
 }
 assert(!/localStorage|sessionStorage/.test(scripts[0]),"preview must not touch production saves");
 console.log("PASS actual source-cell proof of both lower-right B frames, right/left A↔B, stopped neutral, speed, hold, drag, keyboard, art switch and save isolation");
})().catch(e=>{console.error(e);process.exitCode=1;});

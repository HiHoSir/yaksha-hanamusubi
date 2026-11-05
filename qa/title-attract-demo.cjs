// Run: node qa/title-attract-demo.cjs
// Uses mocks to verify ordering and cancellation without entering actual gameplay.
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const source=fs.readFileSync("js/title-attract-demo.js","utf8");
const html=fs.readFileSync("index.html","utf8");
assert(html.includes('src="js/title-attract-demo.js?v=16.1.73"'));
assert(html.includes("鬼哭の花結び"));
assert(!/YK_SAVE\.|gameState\s*=|beginEncounter\(/.test(source));
assert(!/renderBattle\(/.test(source));

function fixture(fieldReady){
 const events={},timers=new Map(),draws=[];let id=0;
 const set=(fn,ms)=>{const n=++id;timers.set(n,fn);if(ms<10000)Promise.resolve().then(()=>{if(timers.has(n)){timers.delete(n);fn();}});return n;};
 const clear=n=>timers.delete(n);
 const context=()=>({fillRect(){},clearRect(){},drawImage(){},save(){},restore(){},translate(){},scale(){}});
 const canvas={width:768,height:768,getContext:context};
 const frame={classList:{add(){},remove(){}},offsetWidth:768};
 const caption={textContent:""};
 const host={hidden:true,setAttribute(){},set innerHTML(s){this.markup=s;},querySelector(s){return s==="canvas"?canvas:s===".ykAttractFrame"?frame:caption;}};
 const title={classList:{contains:s=>s==="show"},appendChild(e){this.overlay=e;}};
 const manual={addEventListener(k,f){events["manual:"+k]=f;}};
 const document={hidden:false,getElementById:id=>({title,titleMainActions:{hidden:false},watchDemo:manual})[id],
  createElement:t=>t==="canvas"?canvas:host,addEventListener(k,f){events[k]=f;}};
 const world={YK_HOZUKI:{whenReady:()=>Promise.resolve(),ready:()=>true,draw(){draws.push("village");return true;}},
  YK_TENYO:{whenReady:()=>Promise.resolve(),ready:()=>true,draw(){draws.push("shrine");}},
  YK_LANDSCAPE:{load(){},ready:()=>fieldReady,drawQuarter(ctx,m,actor){draws.push("field");actor.draw(300,400,1);return true;}},
  YK_WORLD:{start:[1200,2300],mapData:{}}};
 class ImageMock{set src(s){this.naturalWidth=96;this.onload();}}
 class MutationObserver{observe(){}}
 const globals={window:world,document,MutationObserver,Image:ImageMock,performance:{now:()=>1000},setTimeout:set,clearTimeout:clear,console:{warn(){}}};
 vm.runInNewContext(source,globals);
 return {world,events,draws,host};
}
(async()=>{
 for(const ready of [true,false]){
  const f=fixture(ready),task=f.world.YK_TITLE_DEMO.start();
  for(let i=0;i<400;i++)await Promise.resolve();
  assert.equal(await task,true);
  assert.deepEqual(f.draws,ready?["village","field","shrine"]:["village","shrine"]);
  assert.equal(f.world.YK_TITLE_DEMO.active,false);
  assert.equal(f.host.hidden,true);
 }
 const f=fixture(true),task=f.world.YK_TITLE_DEMO.start();
 let consumed=false,prevented=false;
 f.events.pointerdown({preventDefault(){prevented=true;},stopImmediatePropagation(){consumed=true;}});
 assert(consumed&&prevented,"cancel must capture the tap");
 assert.equal(await task,false);
 assert.equal(f.world.YK_TITLE_DEMO.active,false);
 assert.equal(f.host.hidden,true);
 let suppressed=false;
 f.events.click({preventDefault(){suppressed=true;},stopImmediatePropagation(){}});
 assert(suppressed,"dismissal must not click an underlying title button");
 console.log("PASS title attract: three scenes, unavailable-skip, cancel, tap safety, save isolation");
})().catch(e=>{console.error(e);process.exitCode=1;});

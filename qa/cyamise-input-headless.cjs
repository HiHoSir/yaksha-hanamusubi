const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),R=require(root+'/js/cyamise-walk-rules.js'),renderer=require(root+'/js/cyamise-walk-renderer.js');
(async()=>{
const art=await loadImage(root+'/assets/interiors/cyamise-v1/scene-preview.png'),hero=await loadImage(root+'/assets/characters/hizuki/field-sd-v1/walk-atlas-32.png');
let clock=0,pending=[],interval,last;
const events={},windowEvents={},canvas=createCanvas(768,512),els={scene:canvas,status:{textContent:''},grid:{checked:true},collision:{checked:true},reset:{}};
canvas.addEventListener=(k,cb)=>events['canvas:'+k]=cb;canvas.getBoundingClientRect=()=>({left:0,top:0,width:768,height:512});
class Image{set src(url){this.onload();} }
// Image placeholders only select already decoded real images; rendering uses native Canvas.
const env={CYAMISE_RULES:R,CYAMISE_RENDERER:{draw(c,a,h,p,o){last={...p};renderer.draw(c,art,hero,p,o)}},Image,document:{getElementById:id=>els[id],querySelectorAll:()=>[],addEventListener:(k,f)=>events[k]=f},window:{addEventListener:(k,f)=>windowEvents[k]=f},performance:{now:()=>clock},requestAnimationFrame:f=>pending.push(f),setInterval:f=>{interval=f;return 1},clearInterval:()=>{interval=null},console};
vm.createContext(env);vm.runInContext(fs.readFileSync(root+'/js/cyamise-walk-test.js','utf8'),env);await new Promise(r=>setImmediate(r));
assert.equal(last.x,5);assert.equal(last.y,6);
function key(k){events.keydown({key:k,repeat:false,preventDefault(){}});events.keyup({key:k});}
function tick(){clock+=200;const jobs=pending;pending=[];jobs.forEach(f=>f(clock));}
key('ArrowLeft');tick();assert.equal(last.x,4);assert.equal(last.y,6);
key('ArrowUp');tick();assert.equal(last.x,4);assert.equal(last.y,5);
key('ArrowLeft');tick();assert.equal(last.x,4);assert.equal(last.y,5);assert(/通行不可/.test(els.status.textContent));
els.reset.onclick();assert.equal(last.x,5);assert.equal(last.y,6);
const target=R.foot(1,4);events['canvas:pointerdown']({clientX:target.x*2,clientY:target.y*2});for(let i=0;i<20;i++)tick();assert.equal(last.x,1);assert.equal(last.y,4);
assert(R.walkable(last.x,last.y));
els.reset.onclick();
fs.writeFileSync(root+'/cyamise-walkability.png',canvas.toBuffer('image/png'));
console.log('PASS real input handlers: key movement, whole-stride furniture block, reset, tap routing and actual Canvas render. Browser/Safari untested.');
})();

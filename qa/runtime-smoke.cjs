// Runtime smoke test with a small DOM adapter and real canvas rendering.
// This is NOT a browser or iPhone Safari test.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const {createCanvas,Image:NativeImage}=require(require.resolve('@napi-rs/canvas',{paths:[runtime||process.cwd()]}));
const root=path.resolve(__dirname,'..'),output=path.join(__dirname,'results');fs.mkdirSync(output,{recursive:true});
let now=0,seq=0,timers=new Map(),elements=[],missing=[],failures=[],loaded=[];
function schedule(fn,ms=0,repeat=0){const id=++seq;timers.set(id,{at:now+ms,fn,repeat});return id;}
function advance(ms){let until=now+ms,count=0;while(true){let item=[...timers].filter(([id,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!item)break;assert(++count<20000);const [id,t]=item;now=t.at;if(t.repeat)t.at+=t.repeat;else timers.delete(id);t.fn(now);}now=until;}
class Element{
 constructor(tag,attrs={},owner=null){this.tagName=tag.toUpperCase();this.id=attrs.id;this.owner=owner;this.dataset={};this.events={};this.style={};this.textContent='';this.value=attrs.value||'';this.checked=false;this.disabled=false;
  const classes=new Set((attrs.class||'').split(/\s+/).filter(Boolean));this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>{if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x)}};
  for(const [k,v] of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;
  if(tag==='canvas'){this.width=+attrs.width||300;this.height=+attrs.height||150;this.canvas=createCanvas(this.width,this.height)}elements.push(this);
 }
 addEventListener(name,fn){(this.events[name]??=[]).push(fn)}
 fire(name,extra={}){const e={target:this,pointerId:1,preventDefault(){},stopPropagation(){},...extra};for(const fn of this.events[name]||[])fn(e)}
 setPointerCapture(){}getContext(){return this.canvas.getContext('2d')}
 set innerHTML(s){elements=elements.filter(x=>x.owner!==this);this._html=s;parse(s,this)}get innerHTML(){return this._html||''}
}
function parse(html,owner=null){for(const m of html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)){const attrs={};for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];new Element(m[1],attrs,owner)}}
parse(fs.readFileSync(path.join(root,'index.html'),'utf8'));
const el=id=>elements.find(x=>x.id===id)||null;
const docEvents={};const doc={hidden:false,activeElement:null,getElementById:el,addEventListener:(n,f)=>(docEvents[n]??=[]).push(f),querySelectorAll:s=>elements.filter(e=>{
 if(s.startsWith('.'))return s.slice(1).split('.').every(c=>e.classList.contains(c));
 const m=s.match(/^\[data-([\w-]+)\]$/);return !!(m&&m[1] in e.dataset);
})};
el('speedSelect').value='1';
class LocalImage extends NativeImage{
 set src(v){const f=path.join(root,String(v));if(!fs.existsSync(f)){missing.push(v);return;}super.src=fs.readFileSync(f);loaded.push(this);schedule(()=>this.onload?.(),0)}
}
const storage=new Map(),windowEvents={};
const sandbox={document:doc,Image:LocalImage,console,Math:Object.create(Math),Date,performance:{now:()=>now},setTimeout:(f,m)=>schedule(f,m),clearTimeout:id=>timers.delete(id),setInterval:(f,m)=>schedule(f,m,m),clearInterval:id=>timers.delete(id),requestAnimationFrame:f=>schedule(f,16),confirm:()=>false,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},addEventListener:(n,f)=>(windowEvents[n]??=[]).push(f),YK_AUDIO:{beep(){}},setPointerCapture(){}};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['data.js','save.js','input.js','game.js']){let source=fs.readFileSync(path.join(root,'js',file),'utf8');if(file==='game.js')source=source.replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();');vm.runInContext(source,sandbox,{filename:file});}
function tap(id){assert(el(id),id);el(id).fire('pointerdown');el(id).fire('pointerup')}
function dataTap(key,value){const e=elements.find(x=>x.dataset[key]===value);assert(e,key+':'+value);e.fire('pointerdown');e.fire('pointerup')}
function key(k){for(const f of docEvents.keydown||[])f({key:k,preventDefault(){}})}
function shot(name,id='game'){fs.writeFileSync(path.join(output,name+'.png'),el(id).canvas.toBuffer('image/png'))}
const results=[];function check(name,fn){fn();results.push({name,status:'passed'})}
(async()=>{await Promise.all(loaded.map(im=>im.decode()));advance(32);shot('title','titleHero');
check('new game and A advances opening dialogue',()=>{tap('newGame');advance(240);assert(el('dialog').classList.contains('show'));tap('ok');tap('ok');assert(!el('dialog').classList.contains('show'))});
sandbox.Math.random=()=>1;
check('hold moves; release returns to neutral',()=>{Object.assign(sandbox.gameState,{area:'field',x:384,y:550,encounterGrace:100});tap('right');assert.equal(sandbox.gameState.x,406);advance(220);assert.equal(sandbox.gameState.frame,1)});
check('all 7 hero sets retain all four directions (28 checks)',()=>{
 for(const outfit of ['basewear','normal','light','white','navy','yukata','demon']){tap('bookBtn');dataTap('outfit',outfit);dataTap('close','menu');assert.equal(sandbox.gameState.outfit,outfit);
  for(const [button,dir] of [['left','l'],['right','r'],['up','u'],['down','d']]){Object.assign(sandbox.gameState,{area:'field',x:384,y:550,encounterGrace:100});tap(button);assert.equal(sandbox.gameState.dir,dir);advance(220);shot(outfit+'-'+dir);}
 }
});
check('area transition cancels hold timer synchronously',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:384,y:462,encounterGrace:100});el('up').fire('pointerdown');assert.equal(sandbox.gameState.area,'village');const p=[sandbox.gameState.x,sandbox.gameState.y];advance(900);assert.deepEqual([sandbox.gameState.x,sandbox.gameState.y],p);el('up').fire('pointerup');shot('village');
});
check('pagehide cancels held pointer',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:384,y:550,encounterGrace:100});el('right').fire('pointerdown');for(const f of windowEvents.pagehide||[])f();let x=sandbox.gameState.x;advance(800);assert.equal(sandbox.gameState.x,x);el('right').fire('pointerup');
});
check('save and restore selected outfit and direction',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:384,y:550,outfit:'basewear',dir:'l'});sandbox.YK_SAVE.auto(sandbox.gameState);const s=sandbox.YK_SAVE.loadAuto();assert.equal(s.outfit,'basewear');assert.equal(s.dir,'l');
});
check('keyboard battle cursor and item command',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:384,y:550,outfit:'normal',encounterSteps:40,encounterGrace:0});sandbox.Math.random=()=>0;tap('right');assert(el('battle').classList.contains('show'));key('ArrowRight');key('ArrowRight');assert(elements.find(x=>x.dataset.cmd==='item').classList.contains('selected'));const n=sandbox.gameState.potions;key('Enter');assert.equal(sandbox.gameState.potions,n-1);advance(350);shot('battle','battleCanvas');
});
check('battle escape returns to movement',()=>{advance(400);dataTap('cmd','escape');advance(400);assert(!el('battle').classList.contains('show'));sandbox.Math.random=()=>1;Object.assign(sandbox.gameState,{area:'field',x:384,y:550});tap('left');assert.equal(sandbox.gameState.x,362)});
check('battle victory awards and saves progress',()=>{Object.assign(sandbox.gameState,{area:'field',x:384,y:550,encounterSteps:40,encounterGrace:0,atk:999});sandbox.Math.random=()=>0;const wins=sandbox.gameState.wins;tap('right');dataTap('cmd','attack');advance(700);assert.equal(sandbox.gameState.wins,wins+1);assert(!el('battle').classList.contains('show'));assert.equal(sandbox.YK_SAVE.loadAuto().wins,wins+1)});
check('defeat does not overwrite autosave; retry restores it',()=>{Object.assign(sandbox.gameState,{area:'field',x:384,y:550,hp:100,maxhp:100,atk:1,def:0,encounterSteps:40,encounterGrace:0});sandbox.YK_SAVE.auto(sandbox.gameState);sandbox.gameState.hp=1;tap('right');dataTap('cmd','attack');advance(920);assert(el('gameover').classList.contains('show'));assert.equal(sandbox.YK_SAVE.loadAuto().hp,100);tap('retryBtn');assert.equal(sandbox.gameState.hp,100);assert(!el('gameover').classList.contains('show'))});
check('all 6 costumes in dialogue, battle and hot spring',()=>{
 for(const outfit of ['normal','light','white','navy','yukata','demon']){
  tap('newGame');sandbox.gameState.outfit=outfit;advance(240);shot('dialog-'+outfit,'dialogPortrait');tap('ok');tap('ok');
  Object.assign(sandbox.gameState,{area:'field',x:384,y:550,encounterSteps:40,encounterGrace:0});sandbox.Math.random=()=>0;tap('right');assert(el('battle').classList.contains('show'));shot('battle-'+outfit,'battleCanvas');dataTap('cmd','escape');advance(400);
  Object.assign(sandbox.gameState,{area:'hotspring',x:384,y:500,dir:'d'});tap('ok');assert(el('hotSpring').classList.contains('show'));shot('hot-'+outfit,'hotSpringCanvas');dataTap('hot','bath');assert.equal(sandbox.gameState.outfit,outfit);assert.equal(sandbox.gameState.hp,sandbox.gameState.maxhp);shot('hot-bathing','hotSpringCanvas');dataTap('hot','leave');assert(!el('hotSpring').classList.contains('show'));
 }
});
check('six costumes show attack, hit and idle; repeated commands cannot stack damage',()=>{
 for(const outfit of ['normal','light','white','navy','yukata','demon']){
  Object.assign(sandbox.gameState,{area:'field',x:384,y:550,encounterSteps:40,encounterGrace:0,outfit,atk:1,hp:1000,maxhp:1000,def:0});
  sandbox.Math.random=()=>0;tap('right');assert(el('battle').classList.contains('show'));
  dataTap('cmd','attack');assert.equal(sandbox.__qaEval('battlePose'),'attack');shot('attack-'+outfit,'battleCanvas');
  const hp=sandbox.__qaEval('battle.hp');dataTap('cmd','attack');assert.equal(sandbox.__qaEval('battle.hp'),hp);
  advance(320);assert.equal(sandbox.__qaEval('battlePose'),'idle');
  advance(160);assert.equal(sandbox.__qaEval('battlePose'),'hit');shot('hit-'+outfit,'battleCanvas');
  dataTap('cmd','escape');assert(el('battle').classList.contains('show'));advance(419);assert(sandbox.__qaEval('battleLocked'));
  advance(1);assert.equal(sandbox.__qaEval('battlePose'),'idle');assert(!sandbox.__qaEval('battleLocked'));
  dataTap('cmd','escape');advance(400);assert(!el('battle').classList.contains('show'));
 }
});
check('loading a state cancels pending battle damage and animation timers',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:384,y:550,encounterSteps:40,encounterGrace:0,atk:1,hp:100});
 tap('right');dataTap('cmd','attack');sandbox.__qaEval('state({...S,hp:100})');advance(1000);
 assert.equal(sandbox.gameState.hp,100);assert.equal(sandbox.__qaEval('battleTimers.size'),0);assert.equal(sandbox.__qaEval('battlePose'),'idle');
});
check('hold stopAll from immediate callback leaves no delayed repeat',()=>{const b=new Element('button');let n=0;sandbox.YK_INPUT.hold(b,()=>{n++;sandbox.YK_INPUT.stopAll()});b.fire('pointerdown');advance(1000);assert.equal(n,1)});
const report={environment:'Node VM + native canvas; not Safari or a browser',results,missingAssets:[...new Set(missing)]};
fs.writeFileSync(path.join(output,'runtime-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

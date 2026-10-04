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
  for(const [k,v] of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;
  if(tag==='canvas'){this.width=+attrs.width||300;this.height=+attrs.height||150;this.canvas=createCanvas(this.width,this.height)}elements.push(this);
 }
 addEventListener(name,fn){(this.events[name]??=[]).push(fn)}
 fire(name,extra={}){const e={target:this,pointerId:1,preventDefault(){},stopPropagation(){},...extra};for(const fn of this.events[name]||[])fn(e)}
 setPointerCapture(){}getContext(){if(this.id==='worldTerrain')this.snapshot=null;const c=this.canvas.getContext('2d');if(!c.__adapted){const draw=c.drawImage.bind(c);c.drawImage=(im,...args)=>{if(im.id==="worldTerrain"&&!im.snapshot){im.snapshot=new NativeImage();im.snapshot.src=im.canvas.toBuffer("image/png");loaded.push(im.snapshot);}return draw(im.snapshot||im.canvas||im,...args);};c.__adapted=true;}return c}
 set innerHTML(s){elements=elements.filter(x=>x.owner!==this);this._html=s;parse(s,this)}get innerHTML(){return this._html||''}
}
function parse(html,owner=null){for(const m of html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)){const attrs={};for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];new Element(m[1],attrs,owner)}}
parse(fs.readFileSync(path.join(root,'index.html'),'utf8'));
const el=id=>elements.find(x=>x.id===id)||null;
const docEvents={};const doc={hidden:false,activeElement:null,getElementById:el,addEventListener:(n,f)=>(docEvents[n]??=[]).push(f),querySelectorAll:s=>elements.filter(e=>{
 if(s.startsWith('.'))return s.slice(1).split('.').every(c=>e.classList.contains(c));
 const m=s.match(/^\[data-([\w-]+)\]$/);return !!(m&&m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase()) in e.dataset);
})};
el('speedSelect').value='1';
class LocalImage extends NativeImage{
 set src(v){const f=path.join(root,String(v));if(!fs.existsSync(f)){missing.push(v);return;}this.onerror=e=>{console.error("IMAGE",v,e)};try{super.src=fs.readFileSync(f)}catch(e){throw new Error(v+': '+e.message)}loaded.push(this);schedule(()=>this.onload?.(),0)}
}
const storage=new Map(),windowEvents={};
const sandbox={document:doc,Image:LocalImage,console,Math:Object.create(Math),Date,performance:{now:()=>now},setTimeout:(f,m)=>schedule(f,m),clearTimeout:id=>timers.delete(id),setInterval:(f,m)=>schedule(f,m,m),clearInterval:id=>timers.delete(id),requestAnimationFrame:f=>schedule(f,16),confirm:()=>false,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},addEventListener:(n,f)=>(windowEvents[n]??=[]).push(f),YK_AUDIO:{beep(){}},setPointerCapture(){}};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['data.js','world.js','save.js','input.js','game.js']){let source=fs.readFileSync(path.join(root,'js',file),'utf8');if(file==='game.js')source=source.replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();');vm.runInContext(source,sandbox,{filename:file});}
function tap(id){assert(el(id),id);el(id).fire('pointerdown');el(id).fire('pointerup')}
function dataTap(key,value){const e=elements.find(x=>x.dataset[key]===value);assert(e,key+':'+value);e.fire('pointerdown');e.fire('pointerup')}
function key(k){for(const f of docEvents.keydown||[])f({key:k,preventDefault(){}});for(const f of docEvents.keyup||[])f({key:k,preventDefault(){}})}
function shot(name,id='game'){fs.writeFileSync(path.join(output,name+'.png'),el(id).canvas.toBuffer('image/png'))}
const results=[];function check(name,fn){fn();results.push({name,status:'passed'})}
(async()=>{await Promise.all(loaded.map(im=>im.decode()));advance(32);await Promise.all(loaded.map(im=>im.decode()));sandbox.YK_DATA.rareRules.chance=0;shot('title','titleHero');
check('new game and A advances opening dialogue',()=>{tap('newGame');advance(240);assert(el('dialog').classList.contains('show'));tap('ok');tap('ok');assert(!el('dialog').classList.contains('show'))});
sandbox.Math.random=()=>1;
check('hold moves; release returns to neutral',()=>{Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterGrace:100});tap('right');assert.equal(sandbox.gameState.x,238);advance(220);assert.equal(sandbox.gameState.frame,1)});
check('all 7 hero sets retain all four directions (28 checks)',()=>{
 for(const outfit of ['basewear','normal','light','white','navy','yukata','demon']){tap('bookBtn');dataTap('outfit',outfit);dataTap('close','menu');assert.equal(sandbox.gameState.outfit,outfit);
  for(const [button,dir] of [['left','l'],['right','r'],['up','u'],['down','d']]){Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterGrace:100});tap(button);assert.equal(sandbox.gameState.dir,dir);advance(220);shot(outfit+'-'+dir);}
 }
});
check('area transition cancels hold timer synchronously',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:211,y:573,encounterGrace:100});el('up').fire('pointerdown');tap('ok');assert.equal(sandbox.gameState.area,'village');const p=[sandbox.gameState.x,sandbox.gameState.y];advance(900);assert.deepEqual([sandbox.gameState.x,sandbox.gameState.y],p);el('up').fire('pointerup');shot('village');
});
check('pagehide cancels held pointer',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterGrace:100});el('right').fire('pointerdown');for(const f of windowEvents.pagehide||[])f();let x=sandbox.gameState.x;advance(800);assert.equal(sandbox.gameState.x,x);el('right').fire('pointerup');
});
check('save and restore selected outfit and direction',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:230,y:534,outfit:'basewear',dir:'l'});sandbox.YK_SAVE.auto(sandbox.gameState);const s=sandbox.YK_SAVE.loadAuto();assert.equal(s.outfit,'basewear');assert.equal(s.dir,'l');
});
check('keyboard battle cursor and item command',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:230,y:534,outfit:'normal',encounterSteps:40,encounterGrace:0});sandbox.Math.random=()=>0;tap('right');assert(el('battle').classList.contains('show'));key('ArrowRight');key('ArrowRight');assert(elements.find(x=>x.dataset.cmd==='item').classList.contains('selected'));const n=sandbox.gameState.potions;key('Enter');assert.equal(sandbox.gameState.potions,n-1);advance(350);shot('battle','battleCanvas');
});
check('battle escape returns to movement',()=>{advance(400);dataTap('cmd','escape');advance(400);assert(!el('battle').classList.contains('show'));sandbox.Math.random=()=>1;Object.assign(sandbox.gameState,{area:'field',x:230,y:534});tap('left');assert.equal(sandbox.gameState.x,222)});
check('battle victory awards and saves progress',()=>{Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterSteps:40,encounterGrace:0,atk:999});sandbox.Math.random=()=>0;const wins=sandbox.gameState.wins;tap('right');dataTap('cmd','attack');advance(700);assert.equal(sandbox.gameState.wins,wins+1);assert(!el('battle').classList.contains('show'));assert.equal(sandbox.YK_SAVE.loadAuto().wins,wins+1)});
check('defeat does not overwrite autosave; retry restores it',()=>{Object.assign(sandbox.gameState,{area:'field',x:230,y:534,hp:100,maxhp:100,atk:1,def:0,encounterSteps:40,encounterGrace:0});sandbox.YK_SAVE.auto(sandbox.gameState);sandbox.gameState.hp=1;tap('right');dataTap('cmd','attack');advance(920);assert(el('gameover').classList.contains('show'));assert.equal(sandbox.YK_SAVE.loadAuto().hp,100);tap('retryBtn');assert.equal(sandbox.gameState.hp,100);assert(!el('gameover').classList.contains('show'))});
check('all 6 costumes in dialogue, battle and hot spring',()=>{
 for(const outfit of ['normal','light','white','navy','yukata','demon']){
  tap('newGame');sandbox.gameState.outfit=outfit;advance(240);shot('dialog-'+outfit,'dialogPortrait');tap('ok');tap('ok');
  Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterSteps:40,encounterGrace:0});sandbox.Math.random=()=>0;tap('right');assert(el('battle').classList.contains('show'));shot('battle-'+outfit,'battleCanvas');dataTap('cmd','escape');advance(400);
  Object.assign(sandbox.gameState,{area:'hotspring',x:384,y:500,dir:'d'});tap('ok');assert(el('hotSpring').classList.contains('show'));shot('hot-'+outfit,'hotSpringCanvas');dataTap('hot','bath');assert.equal(sandbox.gameState.outfit,outfit);assert.equal(sandbox.gameState.hp,sandbox.gameState.maxhp);shot('hot-bathing','hotSpringCanvas');dataTap('hot','leave');assert(!el('hotSpring').classList.contains('show'));
 }
});
check('six costumes show attack, hit and idle; repeated commands cannot stack damage',()=>{
 for(const outfit of ['normal','light','white','navy','yukata','demon']){
  Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterSteps:40,encounterGrace:0,outfit,atk:1,hp:1000,maxhp:1000,def:0});
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
 Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterSteps:40,encounterGrace:0,atk:1,hp:100});
 tap('right');dataTap('cmd','attack');sandbox.__qaEval('state({...S,hp:100})');advance(1000);
 assert.equal(sandbox.gameState.hp,100);assert.equal(sandbox.__qaEval('battleTimers.size'),0);assert.equal(sandbox.__qaEval('battlePose'),'idle');
});
check('world roads connect all entrances at both movement speeds',()=>{
 const W=sandbox.YK_WORLD;
 for(const step of [8,10.8])for(const origin of [W.hub,...Object.values(W.places).map(p=>p.point)]){
  const q=[[0,0]],seen=new Set(['0,0']);
  for(let i=0;i<q.length;i++){const [ix,iy]=q[i],x=origin[0]+ix*step,y=origin[1]+iy*step;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=ix+dx,ny=iy+dy,key=[nx,ny].join(',');
    if(!seen.has(key)&&[.25,.5,.75,1].every(t=>W.walkable(x+dx*step*t,y+dy*step*t))){seen.add(key);q.push([nx,ny]);}}
  }
  for(const [k,p] of Object.entries(W.places))assert(q.some(([ix,iy])=>Math.hypot(origin[0]+ix*step-p.point[0],origin[1]+iy*step-p.point[1])<=16),'unreachable '+k+' at '+step+' from '+origin);
 }
 assert(!W.walkable(10,10));assert(!W.walkable(436,340));
});
check('old field saves migrate safely and preserve quest and outfit',()=>{
 const old=sandbox.YK_SAVE.migrate({saveVersion:11,worldRevision:1,area:'field',x:384,y:550,quest:3,outfit:'navy',gold:777});
 assert.deepEqual([old.x,old.y],[230,534]);assert.equal(old.gold,777);assert.equal(old.quest,3);assert.equal(old.outfit,'navy');
});
check('all seven entrances enter on A, mark visits and return to the same road',()=>{
 sandbox.gameState.quest=6;
 sandbox.Math.random=()=>1;
 for(const [k,p] of Object.entries(sandbox.YK_WORLD.places)){
  sandbox.__qaEval('busy=false');Object.assign(sandbox.gameState,{area:'field',x:p.point[0],y:p.point[1],encounterGrace:100});tap('ok');
  assert.equal(sandbox.gameState.area,k);assert(sandbox.gameState.visitedAreas[k]);
  if(k==='village')sandbox.__qaEval('S.x=373;S.y=690');else Object.assign(sandbox.gameState,{x:50,y:k==='waterfall'?600:430});
  if(k==='village'){tap('down');tap('down');}else tap('left');
  assert.equal(sandbox.gameState.area,'field',k);assert.deepEqual([sandbox.gameState.x,sandbox.gameState.y],Array.from(p.point));
 }
 Object.assign(sandbox.gameState,{x:230,y:534,outfit:'normal',dir:'d'});sandbox.__qaEval('hud()');shot('world-field');
 tap('worldBtn');dataTap('worldPlace','village');assert.equal(sandbox.gameState.destination,'village');assert(el('worldStatus').textContent.includes('鬼灯の里'));shot('world-overview','worldCanvas');dataTap('close','worldMap');
});
check('both movement speeds can leave village from different step offsets',()=>{
 sandbox.Math.random=()=>1;
 for(const speed of ['1','1.35'])for(const y of [690,700,715,720]){
  el('speedSelect').value=speed;
  sandbox.__qaEval('busy=false');Object.assign(sandbox.gameState,{area:'village',x:373,y,encounterGrace:100});
  for(let i=0;i<4&&sandbox.gameState.area==='village';i++)tap('down');
  assert.equal(sandbox.gameState.area,'field',`speed ${speed}, y ${y}`);
 }
 el('speedSelect').value='1';
});
check('world map closes with B or Escape and preserves destination',()=>{
 sandbox.__qaEval('busy=false');tap('worldBtn');tap('cancel');assert(!el('worldMap').classList.contains('show'));
 tap('worldBtn');key('Escape');assert(!el('worldMap').classList.contains('show'));assert.equal(sandbox.gameState.destination,'village');assert.equal(sandbox.__qaEval('busy'),false);
});
check('still enemy overlays animate, respect reduced motion and cancel on load',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterSteps:40,encounterGrace:0,atk:1,hp:1000,maxhp:1000});
 sandbox.Math.random=()=>0;tap('right');dataTap('cmd','skill');assert.equal(sandbox.__qaEval('battleFx.kind'),'petals');
 advance(96);shot('fx-petals','battleCanvas');advance(224);assert.equal(sandbox.__qaEval('battleFx'),null);
 advance(160);assert.equal(sandbox.__qaEval('battleFx.target'),'hero');advance(80);shot('fx-impact','battleCanvas');advance(340);
 sandbox.matchMedia=()=>({matches:true});dataTap('cmd','attack');assert.equal(sandbox.__qaEval('battleFx.reduced'),true);advance(80);shot('fx-reduced','battleCanvas');
 sandbox.__qaEval('state({...S,hp:100})');advance(1000);assert.equal(sandbox.__qaEval('battleFx'),null);assert.equal(sandbox.__qaEval('battleTimers.size'),0);assert.equal(sandbox.gameState.hp,100);
 delete sandbox.matchMedia;
});
check('rare clothing threshold, first drop, money, repeat rolls and equip persistence',()=>{
 sandbox.YK_DATA.rareRules.chance=.1;sandbox.Math.random=()=>0;
 sandbox.__qaEval('busy=false');Object.assign(sandbox.gameState,{area:'field',x:230,y:534,hp:1000,maxhp:1000,atk:20,lv:1,xp:0,relics:{},rareWins:{},equippedRelic:null,encounterSteps:40,encounterGrace:0});
 tap('right');assert.equal(sandbox.__qaEval('battle.rareId'),'oni');assert.equal(sandbox.__qaEval('battle.gold'),10);shot('rare-oni-intact','battleCanvas');
 dataTap('cmd','attack');assert.equal(sandbox.__qaEval('battle.hp'),22);assert(!sandbox.__qaEval('battle.clothingBroken'));advance(920);
 dataTap('cmd','attack');assert.equal(sandbox.__qaEval('battle.hp'),2);assert(sandbox.__qaEval('battle.clothingBroken'));shot('rare-oni-worn','battleCanvas');advance(920);
 const gold=sandbox.gameState.gold;dataTap('cmd','attack');assert.equal(sandbox.gameState.gold,gold+10);assert.equal(sandbox.gameState.relics.oni,1);assert.equal(sandbox.gameState.rareWins.oni,1);
 sandbox.__qaEval('win()');assert.equal(sandbox.gameState.relics.oni,1);assert.equal(sandbox.gameState.gold,gold+10);advance(1800);
 tap('bookBtn');dataTap('relic','oni');assert.equal(sandbox.gameState.equippedRelic,'oni');assert.equal(sandbox.__qaEval('relicBonus("def")'),2);dataTap('close','menu');
 const saved=sandbox.YK_SAVE.loadAuto();assert.equal(saved.equippedRelic,'oni');assert.equal(saved.relics.oni,1);sandbox.YK_SAVE.saveSlot(1,sandbox.gameState);assert.equal(sandbox.YK_SAVE.loadSlot(1).rareWins.oni,1);
 // A repeat victory with a high roll awards money but no duplicate; a low roll awards one.
 for(const [roll,count] of [[.99,1],[0,2]]){
  sandbox.Math.random=()=>0;Object.assign(sandbox.gameState,{area:'field',x:230,y:534,atk:999,encounterSteps:40,encounterGrace:0});tap('right');sandbox.Math.random=()=>roll;dataTap('cmd','attack');assert.equal(sandbox.gameState.relics.oni,count);advance(1800);
 }
 assert.equal(sandbox.gameState.rareWins.oni,3);
 sandbox.Math.random=()=>0;Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterSteps:40,encounterGrace:0});tap('right');dataTap('cmd','escape');advance(400);assert.equal(sandbox.gameState.rareWins.oni,3);assert.equal(sandbox.gameState.relics.oni,2);
 // Missing variant artwork cannot enter the normal encounter pool.
 assert.equal(sandbox.__qaEval('rareReady(D.rareKinds["化け狸"])'),false);
 const old=sandbox.YK_SAVE.migrate({});assert.equal(old.equippedRelic,null);assert.equal(Object.keys(old.relics).length,0);
 const bad=sandbox.YK_SAVE.migrate({relics:{oni:-1,tanuki:Infinity,fox:2.8},equippedRelic:'oni'});assert.equal(bad.equippedRelic,null);assert.equal(bad.relics.fox,2);
 tap('bookBtn');dataTap('relic','');dataTap('close','menu');assert.equal(sandbox.__qaEval('relicBonus("atk")'),0);
 sandbox.YK_DATA.rareRules.chance=0;
});
check('relic bonuses affect actual attack, defence, skill and healing without changing base stats',()=>{
 sandbox.Math.random=()=>0;sandbox.__qaEval('busy=false');
 Object.assign(sandbox.gameState,{area:'field',x:230,y:534,atk:10,def:0,hp:100,maxhp:200,lv:1,xp:0,relics:{oni:1,lantern:1,jelly:1},equippedRelic:'oni',encounterSteps:40,encounterGrace:0});
 tap('right');const before=sandbox.__qaEval('battle.hp');dataTap('cmd','attack');assert.equal(sandbox.__qaEval('battle.hp'),before-12);advance(920);assert.equal(sandbox.gameState.hp,93);assert.equal(sandbox.gameState.atk,10);assert.equal(sandbox.gameState.def,0);dataTap('cmd','escape');advance(400);
 sandbox.gameState.equippedRelic='lantern';Object.assign(sandbox.gameState,{x:230,y:534,encounterSteps:40,encounterGrace:0});tap('right');dataTap('cmd','skill');assert.equal(sandbox.__qaEval('battle.hp'),15);advance(920);dataTap('cmd','escape');advance(400);
 sandbox.gameState.equippedRelic='jelly';Object.assign(sandbox.gameState,{x:230,y:534,hp:100,potions:2,encounterSteps:40,encounterGrace:0});tap('right');dataTap('cmd','item');assert.equal(sandbox.gameState.hp,147);advance(720);dataTap('cmd','escape');advance(400);
});
check('diagonal touch and simultaneous keys have equal speed and release cleanly',()=>{
 sandbox.Math.random=()=>1;sandbox.__qaEval('busy=false');
 Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterGrace:100});tap('upRight');
 assert(Math.abs(Math.hypot(sandbox.gameState.x-230,sandbox.gameState.y-534)-8)<1e-8);assert(sandbox.gameState.x>230&&sandbox.gameState.y<534);
 const fire=(type,key)=>{for(const f of docEvents[type]||[])f({key,preventDefault(){}})};
 Object.assign(sandbox.gameState,{x:230,y:534});fire('keydown','ArrowUp');fire('keydown','ArrowRight');
 Object.assign(sandbox.gameState,{x:230,y:534});advance(260);assert(Math.abs(Math.hypot(sandbox.gameState.x-230,sandbox.gameState.y-534)-8)<1e-8);
 fire('keyup','ArrowUp');fire('keyup','ArrowRight');const pos=[sandbox.gameState.x,sandbox.gameState.y];advance(400);assert.deepEqual([sandbox.gameState.x,sandbox.gameState.y],pos);
 Object.assign(sandbox.gameState,{x:230,y:534});el('up').fire('pointerdown',{pointerId:10});el('right').fire('pointerdown',{pointerId:11});Object.assign(sandbox.gameState,{x:230,y:534});advance(260);
 assert(Math.abs(Math.hypot(sandbox.gameState.x-230,sandbox.gameState.y-534)-8)<1e-8);
 el('up').fire('pointercancel',{pointerId:10});el('right').fire('pointerup',{pointerId:11});const end=[sandbox.gameState.x,sandbox.gameState.y];advance(400);assert.deepEqual([sandbox.gameState.x,sandbox.gameState.y],end);
});
check('opening map cancels held directions and collision never crosses water',()=>{
 Object.assign(sandbox.gameState,{area:'field',x:230,y:534});el('right').fire('pointerdown');tap('worldBtn');dataTap('close','worldMap');const pos=[sandbox.gameState.x,sandbox.gameState.y];advance(500);assert.deepEqual([sandbox.gameState.x,sandbox.gameState.y],pos);
 sandbox.__qaEval('S.x=230;S.y=534');for(let i=0;i<60;i++)sandbox.__qaEval('move(22,-22,"r")');assert(sandbox.YK_WORLD.walkable(sandbox.gameState.x,sandbox.gameState.y));
});
check('actual eight-direction movement traverses every road in both directions and speeds',()=>{
 sandbox.Math.random=()=>1;
 for(const speed of ['1','1.35'])for(const road of sandbox.YK_WORLD.roads)for(const reverse of [false,true]){
  el('speedSelect').value=speed;const route=Array.from(road);if(reverse)route.reverse();Object.assign(sandbox.gameState,{area:'field',x:route[0][0],y:route[0][1],encounterGrace:9999});
  for(const target of route.slice(1)){
   let tries=0;
   while(Math.hypot(sandbox.gameState.x-target[0],sandbox.gameState.y-target[1])>10&&tries++<80){
    const dx=target[0]-sandbox.gameState.x,dy=target[1]-sandbox.gameState.y,a=Math.atan2(dy,dx),sector=Math.round(a/(Math.PI/4));
    const vx=Math.round(Math.cos(sector*Math.PI/4))*22,vy=Math.round(Math.sin(sector*Math.PI/4))*22;
    sandbox.__qaEval(`move(${vx},${vy},"d")`);assert(sandbox.YK_WORLD.walkable(sandbox.gameState.x,sandbox.gameState.y));
   }
   assert(tries<80,`stuck on ${target}, speed ${speed}, reverse ${reverse}`);
  }
 }
 el('speedSelect').value='1';
});
check('village and interiors: actual movement reaches all NPCs, doors, north road and well garden at both speeds',()=>{
 sandbox.Math.random=()=>1;sandbox.__qaEval('busy=false');
 for(const speed of [1,1.35])for(const area of ['village','teahouse','osumiHome']){
  el('speedSelect').value=String(speed);const origin=area==='village'?[373,690]:[384,625];
  Object.assign(sandbox.gameState,{area,x:origin[0],y:origin[1]});
  const blocked=sandbox.__qaEval('(x,y)=>collision(x,y)'),step=22*speed,queue=[[0,0]],parents=new Map([['0,0',null]]);
  const coords=([i,j])=>[origin[0]+i*step,origin[1]+j*step];
  for(let at=0;at<queue.length;at++){const v=queue[at],[x,y]=coords(v);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const next=[v[0]+dx,v[1]+dy],k=next.join(','),[nx,ny]=coords(next);if(parents.has(k)||ny>710)continue;
   let clear=true;for(let t=1;t<=16;t++)if(blocked(x+(nx-x)*t/16,y+(ny-y)*t/16)){clear=false;break;}
   if(clear){parents.set(k,v);queue.push(next);}
  }}
  const targets=sandbox.__qaEval('areaNPCs().map(n=>({name:n.name,x:n.x,y:n.y,npc:true}))');
  if(area==='village'){
   for(const n of sandbox.__qaEval('NPCS.village'))assert(!sandbox.__qaEval(`villageBlocked(${n.x},${n.y})`),'NPC in obstacle '+n.name);
   targets.push(...sandbox.__qaEval('VILLAGE_LAYOUT.doors.map(d=>({name:d.id,x:d.x,y:d.y,door:true}))'),{name:'north road',x:384,y:150},{name:'well garden',x:175,y:355},{name:'west doorstep',x:182,y:182});
  }
  for(const target of targets){const end=queue.find(v=>{const [x,y]=coords(v);return target.door?Math.abs(x-target.x)<=33&&Math.abs(y-target.y)<=24:Math.hypot(x-target.x,y-target.y)<(target.npc?65:20);});assert(end,`unreachable ${area}/${target.name} speed ${speed}`);
   const route=[];let current=end;while(parents.get(current.join(','))){route.unshift(current);current=parents.get(current.join(','));}
   Object.assign(sandbox.gameState,{area,x:origin[0],y:origin[1]});sandbox.__qaEval('busy=false');let prev=[0,0];
   for(const v of route){const dx=(v[0]-prev[0])*22,dy=(v[1]-prev[1])*22;sandbox.__qaEval(`move(${dx},${dy},"u")`);prev=v;}
   const [ex,ey]=coords(end);assert(Math.hypot(sandbox.gameState.x-ex,sandbox.gameState.y-ey)<.01,`path blocked ${target.name}`);
   if(target.door){tap('ok');assert.equal(sandbox.gameState.area,target.name);sandbox.__qaEval('leaveInterior()');assert(!blocked(sandbox.gameState.x,sandbox.gameState.y));}
   if(target.npc){sandbox.__qaEval(`faceNPC(areaNPCs().find(n=>n.name===${JSON.stringify(target.name)}))`);tap('ok');assert(el('dialog').classList.contains('show'),target.name);for(let i=0;i<6&&el('dialog').classList.contains('show');i++)tap('ok');}
  }
 }
 el('speedSelect').value='1';Object.assign(sandbox.gameState,{area:'village',x:373,y:440});sandbox.__qaEval('busy=false;hud()');shot('village-revised');sandbox.__qaEval('window.__YK_COLLISION_DEBUG=true;map()');shot('village-collision-revised');sandbox.__qaEval('window.__YK_COLLISION_DEBUG=false');
});
check('north road exit, walls and old river saves remain safe',()=>{
 for(const speed of ['1','1.35']){
  el('speedSelect').value=speed;sandbox.__qaEval('busy=false');Object.assign(sandbox.gameState,{area:'village',x:384,y:70});tap('up');assert.equal(sandbox.gameState.area,'field');
 }
 el('speedSelect').value='1';
 sandbox.__qaEval('S.area="village"');
 for(const [x,y] of [[180,120],[579,120],[600,330],[120,345],[80,450],[500,580],[200,560]])assert(sandbox.__qaEval(`collision(${x},${y})`),'solid '+[x,y]);
 sandbox.__qaEval('restoreState({...S,area:"village",x:548,y:500})');assert.equal(sandbox.gameState.area,'village');assert(!sandbox.__qaEval('collision(S.x,S.y)'));
});
check('story guides the journey without locking entrances; progress and petal persist',()=>{
 sandbox.__qaEval('state(YK_SAVE.fresh());busy=false');sandbox.Math.random=()=>1;
 for(let stage=0;stage<sandbox.YK_DATA.story.length;stage++){
  const event=sandbox.YK_DATA.story[stage];
  if(event.target){const p=sandbox.YK_WORLD.places[event.target];Object.assign(sandbox.gameState,{area:'field',x:p.point[0],y:p.point[1]});tap('ok');assert.equal(sandbox.gameState.area,event.target);}
  const p=sandbox.YK_WORLD.places[event.area];Object.assign(sandbox.gameState,{area:'field',x:p.point[0],y:p.point[1]});tap('ok');assert.equal(sandbox.gameState.area,event.area);
  const n=sandbox.__qaEval(`areaNPCs().find(n=>n.name===${JSON.stringify(event.speaker)})`);Object.assign(sandbox.gameState,{x:n.x,y:n.y+40,dir:'u'});tap('ok');assert.equal(sandbox.gameState.quest,stage);
  while(el('dialog').classList.contains('show'))tap('ok');assert.equal(sandbox.gameState.quest,stage+1);assert.equal(sandbox.YK_SAVE.loadAuto().quest,stage+1);
  tap('ok');while(el('dialog').classList.contains('show'))tap('ok');assert.equal(sandbox.gameState.quest,stage+1);
 }
 assert.equal(sandbox.gameState.petals,1);assert.equal(sandbox.YK_SAVE.loadAuto().petals,1);
 const old=sandbox.YK_SAVE.migrate({quest:0,visitedAreas:{fox:true}});sandbox.__qaEval('state('+JSON.stringify(old)+');busy=false');const fox=sandbox.YK_WORLD.places.fox.point;Object.assign(sandbox.gameState,{area:'field',x:fox[0],y:fox[1]});tap('ok');assert.equal(sandbox.gameState.area,'fox');
});
check('scroll camera follows the hero and clamps at all map edges',()=>{
 const W=sandbox.YK_WORLD;
 for(const [x,y] of [[0,0],[768,0],[0,768],[768,768],[230,534],[637,191]]){
  const c=W.camera(x,y);assert(c.x>=0&&c.y>=0);assert(c.x+c.size<=W.size&&c.y+c.size<=W.size);assert.equal(c.zoom,3);
  if(x>=128&&x<=640)assert.equal((x-c.x)*c.zoom,384);
  if(y>=128&&y<=640)assert.equal((y-c.y)*c.zoom,384);
 }
 assert(W.camera(300,300).x>W.camera(290,300).x);
 for(const k of ['village','shrine','cove','waterfall','fox']){
  const p=W.places[k].point;Object.assign(sandbox.gameState,{area:'field',x:p[0],y:p[1],outfit:'normal'});sandbox.__qaEval('busy=false;map()');shot('scroll-'+k);
 }
});
check('tile collision matches terrain and beta15.30 saves migrate safely',()=>{
 const W=sandbox.YK_WORLD;
 for(let y=4;y<768;y+=8)for(let x=4;x<768;x+=8)assert.equal(W.walkable(x,y),['grass','road','bridge'].includes(W.tileAt(x,y)));
 const old=sandbox.YK_SAVE.migrate({worldRevision:3,area:'field',x:400,y:350,gold:123,quest:4});assert(W.walkable(old.x,old.y));assert.equal(old.gold,123);assert.equal(old.quest,4);
});
check('field atlas finishes loading and renders detailed terrain in the scroll viewport',()=>{
 assert(sandbox.__qaEval('layerReady(worldAtlas)'));
 Object.assign(sandbox.gameState,{area:'field',x:230,y:534});sandbox.__qaEval('map()');
 const pixels=el('game').getContext().getImageData(0,0,768,700).data,colors=new Set();
 for(let i=0;i<pixels.length;i+=16)colors.add([pixels[i],pixels[i+1],pixels[i+2]].join(','));
 assert(colors.size>500,'terrain must contain the atlas, not only flat fallback colours');
});
check('open grasslands allow off-route travel and beta15.32 saves migrate safely',()=>{
 const W=sandbox.YK_WORLD;
 const land=[];for(let y=4;y<768;y+=8)for(let x=4;x<768;x+=8)if(W.tileAt(x,y)!=='water')land.push(W.tileAt(x,y));
 assert(land.filter(t=>t==='grass').length/land.length>.5,'most land should be open grass, not a road corridor');
 sandbox.__qaEval('busy=false');Object.assign(sandbox.gameState,{area:'field',x:230,y:534,encounterGrace:9999});
 for(let i=0;i<8;i++)sandbox.__qaEval('move(22,0,"r")');assert(sandbox.gameState.x>285,'walk freely east of the old road');
 for(let i=0;i<8;i++)sandbox.__qaEval('move(-22,0,"l")');assert.equal(sandbox.gameState.x,230);
 const old=sandbox.YK_SAVE.migrate({worldRevision:4,area:'field',x:620,y:580,gold:456,quest:4});assert(W.walkable(old.x,old.y));assert.equal(old.gold,456);assert.equal(old.quest,4);
});
check('hold stopAll from immediate callback leaves no delayed repeat',()=>{const b=new Element('button');let n=0;sandbox.YK_INPUT.hold(b,()=>{n++;sandbox.YK_INPUT.stopAll()});b.fire('pointerdown');advance(1000);assert.equal(n,1)});
const report={environment:'Node VM + native canvas; not Safari or a browser',results,missingAssets:[...new Set(missing)]};
fs.writeFileSync(path.join(output,'runtime-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

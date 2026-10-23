// Real scene and DOM input handlers, without browser or image dependencies.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/tenyo-three-layer-demo.js','utf8');
function fixture(){
 let now=0,raf;
 const handlers=()=>({events:{},addEventListener(n,f){this.events[n]=f},setPointerCapture(){}});
 const buttons=[[0,-1],[-1,0],[0,1],[1,0]].map(d=>({...handlers(),dataset:{dir:d.join(',')}}));
 const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
 const elements={scene:{width:768,height:768,getContext:()=>ctx},status:{},debug:{checked:false}};
 const document={...handlers(),getElementById:id=>elements[id],querySelectorAll:()=>buttons};
 const env={document,console,Image:class{},performance:{now:()=>now},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('assets/maps/tenyo/walkability-48x32.json'))}),requestAnimationFrame:f=>raf=f,addEventListener(){}};
 env.window=env;vm.createContext(env);
 vm.runInContext(fs.readFileSync('js/tenyo-npc-art.js','utf8'),env);
 vm.runInContext(fs.readFileSync('js/tenyo-main-scene.js','utf8'),env);
 // Load the legacy dependency too, so the regression fails on behavior rather
 // than on the old page's ES module syntax when run against the baseline.
 vm.runInContext(fs.readFileSync('js/tenyo-three-layer-collision.js','utf8').replaceAll('export ',''),env);
 vm.runInContext(source.replace(/^import .*\n/,''),env);
 return {env,buttons,tick(t){now=t;raf(t)},position:()=>vm.runInContext('[x,y]',env)};
}
const f=fixture(),start=f.position();
f.buttons[0].events.pointerdown({preventDefault(){},pointerId:1});
f.buttons[0].events.pointerup({pointerId:1});
f.tick(0);f.tick(200);
let p=f.position();
assert.equal(p[0],start[0],'short tap preserves column');
assert.equal(p[1],start[1]-f.env.YK_TENYO.WALK_CELL,'short tap completes exactly one authored cell even before next animation frame');
f.tick(1000);assert.deepEqual(f.position(),p,'release prevents a second step');
f.buttons[0].events.pointerdown({preventDefault(){},pointerId:2});
f.tick(1200);f.tick(1400);f.buttons[0].events.pointerup({pointerId:2});f.tick(1600);
p=f.position();
assert.equal((p[0]-f.env.YK_TENYO.WALK_CELL/2)%f.env.YK_TENYO.WALK_CELL,0);
assert.equal((p[1]-f.env.YK_TENYO.WALK_CELL/2)%f.env.YK_TENYO.WALK_CELL,0,'held movement stops at a cell center');
const game=fs.readFileSync('js/game.js','utf8');
const stabilize=game.slice(game.indexOf('function stabilizeLoadedState(){'),game.indexOf('// Sound is an iPhone/browser preference'));
f.env.S={area:'shrine',x:560,y:700,hp:70,maxhp:70};f.env.D={areas:{shrine:{grace:12}}};
vm.runInContext(stabilize+';stabilizeLoadedState();',f.env);
assert.deepEqual([f.env.S.x,f.env.S.y],Array.from(f.env.YK_TENYO.center(560,700)),'old save is aligned before accepting directional input');
console.log('Tenyo: short tap, release, hold and loaded-save cell alignment OK');

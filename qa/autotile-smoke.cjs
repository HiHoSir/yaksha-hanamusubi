// Runtime smoke test with a small DOM adapter and real canvas rendering.
// This is NOT a browser or iPhone Safari test.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const {createCanvas,Image:NativeImage}=require(require.resolve('@napi-rs/canvas',{paths:[runtime||process.cwd()]}));
const root=path.resolve(__dirname,'..'),output=path.join(__dirname,'results','autotile');fs.mkdirSync(output,{recursive:true});
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
 setPointerCapture(){}getContext(){if(this.id==='worldTerrain')this.snapshot=null;if(this.canvas.width!==this.width)this.canvas.width=this.width;if(this.canvas.height!==this.height)this.canvas.height=this.height;const c=this.canvas.getContext('2d');if(!c.__adapted){const draw=c.drawImage.bind(c);c.drawImage=(im,...args)=>{if(im.id==="worldTerrain"&&!im.snapshot){im.snapshot=new NativeImage();im.snapshot.src=im.canvas.toBuffer("image/png");loaded.push(im.snapshot);}return draw(im.snapshot||im.canvas||im,...args);};c.__adapted=true;}return c}
 set innerHTML(s){elements=elements.filter(x=>x.owner!==this);this._html=s;parse(s,this)}get innerHTML(){return this._html||''}
}
function parse(html,owner=null){for(const m of html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)){const attrs={};for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];new Element(m[1],attrs,owner)}}
parse(fs.readFileSync(path.join(root,'index.html'),'utf8'));
const el=id=>elements.find(x=>x.id===id)||null;
const docEvents={};const doc={createElement:tag=>new Element(tag),hidden:false,activeElement:null,getElementById:el,addEventListener:(n,f)=>(docEvents[n]??=[]).push(f),querySelectorAll:s=>elements.filter(e=>{
 if(s.startsWith('.'))return s.slice(1).split('.').every(c=>e.classList.contains(c));
 const m=s.match(/^\[data-([\w-]+)\]$/);return !!(m&&m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase()) in e.dataset);
})};
el('speedSelect').value='1';
class LocalImage extends NativeImage{
 set src(v){const f=path.join(root,String(v).split("?")[0]);if(!fs.existsSync(f)){missing.push(v);return;}this.onerror=e=>{console.error("IMAGE",v,e)};try{super.src=fs.readFileSync(f)}catch(e){throw new Error(v+': '+e.message)}loaded.push(this);schedule(()=>this.onload?.(),0)}
}
const storage=new Map(),windowEvents={};
const sandbox={document:doc,Image:LocalImage,console,Math:Object.create(Math),Date,performance:{now:()=>now},setTimeout:(f,m)=>schedule(f,m),clearTimeout:id=>timers.delete(id),setInterval:(f,m)=>schedule(f,m,m),clearInterval:id=>timers.delete(id),requestAnimationFrame:f=>schedule(f,16),confirm:()=>false,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},addEventListener:(n,f)=>(windowEvents[n]??=[]).push(f),YK_AUDIO:{beep(){},syncBgm(){},unlock(){}},setPointerCapture(){}};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['data.js','world.js','save.js','input.js','autotile.js','game.js']){let source=fs.readFileSync(path.join(root,'js',file),'utf8');if(file==='game.js')source=source.replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();');vm.runInContext(source,sandbox,{filename:file});}
function tap(id){assert(el(id),id);el(id).fire('pointerdown');el(id).fire('pointerup')}
function dataTap(key,value){const e=elements.find(x=>x.dataset[key]===value);assert(e,key+':'+value);e.fire('pointerdown');e.fire('pointerup')}
function key(k){for(const f of docEvents.keydown||[])f({key:k,preventDefault(){}});for(const f of docEvents.keyup||[])f({key:k,preventDefault(){}})}
function shot(name,id='game'){fs.writeFileSync(path.join(output,name+'.png'),el(id).canvas.toBuffer('image/png'))}

const results=[];
function check(name,fn){fn();results.push(name)}
(async()=>{
 await Promise.all(loaded.map(im=>im.decode()));advance(32);
 const a=sandbox.YK_AUTOTILE;
 a.load();await Promise.all(loaded.map(im=>im.decode()));advance(1);
 check('all original atlases loaded with exact dimensions',()=>assert(a.ready(),JSON.stringify(a.errors)));
 const qaImages={};for(const key of a.keys){const im=new NativeImage();im.src=fs.readFileSync(path.join(root,'assets/terrain/original-32-v2',key+'.png'));await im.decode();qaImages[key]=im;}
 check('ten 32px PNGs have binary alpha and real transparent pixels',()=>{
  assert.equal(a.keys.length,10);
  for(const key of a.keys){const im=qaImages[key];assert.equal(im.width,32);assert.equal(im.height,32);const c=createCanvas(32,32),q=c.getContext('2d');q.drawImage(im,0,0);const pixels=q.getImageData(0,0,32,32).data;let clear=0,solid=0;const colors=new Set();for(let i=0;i<pixels.length;i+=4){assert(pixels[i+3]===0||pixels[i+3]===255);if(!pixels[i+3])clear++;else{solid++;colors.add([pixels[i],pixels[i+1],pixels[i+2]].join(','));}}assert(clear>0&&solid>0,key);assert(colors.size<=9,key+' palette');}
 });
 check('forest repeat joins and edge/corner joins match pixel for pixel',()=>{
  const pixels={};for(const key of a.keys.filter(k=>k.startsWith('forest_'))){const im=qaImages[key];const q=createCanvas(32,32).getContext('2d');q.drawImage(im,0,0);pixels[key.replace('forest_','')]=q.getImageData(0,0,32,32).data;}
  const px=(name,x,y)=>Array.from(pixels[name].slice((y*32+x)*4,(y*32+x)*4+4));
  for(const [l,r] of [['core','core'],['corner_tl','edge_top'],['edge_top','corner_tr'],['edge_left','core'],['core','edge_right'],['corner_bl','edge_bottom'],['edge_bottom','corner_br']])for(let y=0;y<32;y++)assert.deepEqual(px(l,31,y),px(r,0,y),l+' → '+r+' y'+y);
  for(const [t,b] of [['core','core'],['corner_tl','edge_left'],['edge_left','corner_bl'],['edge_top','core'],['core','edge_bottom'],['corner_tr','edge_right'],['edge_right','corner_br']])for(let x=0;x<32;x++)assert.deepEqual(px(t,x,31),px(b,x,0),t+' ↓ '+b+' x'+x);
 });
 check('canonical roles preserve all four distinct 32px source quadrants',()=>{
  const masks={core:{n:1,e:1,s:1,w:1},edge_top:{e:1,s:1,w:1},edge_right:{n:1,s:1,w:1},edge_bottom:{n:1,e:1,w:1},edge_left:{n:1,e:1,s:1},corner_tl:{e:1,s:1},corner_tr:{s:1,w:1},corner_bl:{n:1,e:1},corner_br:{n:1,w:1}};
  for(const [role,mask] of Object.entries(masks)){
   const actual=createCanvas(32,32).getContext('2d'),expected=createCanvas(32,32).getContext('2d');
   a.drawCell(actual,'forest',mask,0,0);a.drawCell(expected,'grass',{},0,0);expected.drawImage(qaImages['forest_'+role],0,0);
   assert.deepEqual(actual.getImageData(0,0,32,32).data,expected.getImageData(0,0,32,32).data,role);
  }
  const q=createCanvas(32,32).getContext('2d');q.drawImage(qaImages.forest_core,0,0);
  const quadrants=[...Array(4)].map((_,i)=>Buffer.from(q.getImageData(i%2*16,(i>>1)*16,16,16).data).toString('base64'));
  assert.equal(new Set(quadrants).size,4);
 });
 check('16 forest cardinal cases stay in atlas bounds',()=>{
  for(const kind of ['forest'])for(let mask=0;mask<16;mask++){
   const n={n:!!(mask&1),e:!!(mask&2),s:!!(mask&4),w:!!(mask&8)};
   const roles=a.roles(kind,n);assert.equal(roles.length,4);
   for(const [x,y] of roles){assert(x>=0&&x<(kind==='forest'?3:4));assert(y>=0&&y<3);}

  }
 });
 check('adjacent forest cells use interior-facing edges',()=>{
  const m=[['forest','forest']];
  assert.equal(a.roles('forest',a.neighbors(m,0,0))[1][0],1);
  assert.equal(a.roles('forest',a.neighbors(m,1,0))[0][0],1);
 });
 const before=JSON.parse(JSON.stringify(sandbox.gameState));sandbox.YK_SAVE.auto(sandbox.gameState);
 const stateBefore=JSON.stringify(sandbox.gameState),saveBefore=[...storage];
 check('title DEBUG MAP opens new original terrain',()=>{el('debugMap').fire('click');assert.equal(sandbox.gameState.area,'debugField');assert.equal(sandbox.__YK_DEBUG_PAGE,0);assert(!el('title').classList.contains('show'));});
 shot('01-original');
 check('movement uses real touch direction handlers',()=>{const x=sandbox.gameState.x;tap('right');assert(sandbox.gameState.x>x);assert.equal(sandbox.gameState.walk,before.walk);});
 el('ok').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,1);shot('02-original-2x');
 el('ok').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,2);shot('03-connections');
 el('ok').fire('click');shot('04-assets32');
 check('all nine debug pages render and cycle',()=>{for(let i=0;i<6;i++)el('ok').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,0);});
 check('B restores full gameplay state and leaves saves untouched',()=>{el('cancel').fire('click');assert.equal(JSON.stringify(sandbox.gameState),stateBefore);assert.deepEqual([...storage],saveBefore);assert(el('title').classList.contains('show'));});
 check('Continue still restores the existing autosave',()=>{el('continueGame').fire('click');assert.equal(sandbox.gameState.area,'field');assert(!el('title').classList.contains('show'));});
 check('New game still starts',()=>{el('newGame').fire('click');assert.equal(sandbox.gameState.area,'field');assert(!el('title').classList.contains('show'));});
 check('changed image assets have no missing files',()=>assert(!missing.some(p=>p.includes('original-32-v2'))));
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed:results,scope:'Node VM + native canvas, not Safari',legacyMissing:missing},null,2));
 console.log(JSON.stringify({passed:results.length,checks:results,legacyMissing:missing},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

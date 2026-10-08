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
 setPointerCapture(){}getContext(){if(this.id==='worldTerrain')this.snapshot=null;if(this.canvas.width!==this.width)this.canvas.width=this.width;if(this.canvas.height!==this.height)this.canvas.height=this.height;const c=this.canvas.getContext('2d');if(!c.__adapted){const draw=c.drawImage.bind(c);c.drawImage=(im,...args)=>{if((im.id==="worldTerrain"||im.__ykStatic)&&!im.snapshot){im.snapshot=new NativeImage();im.snapshot.src=im.canvas.toBuffer("image/png");loaded.push(im.snapshot);}return draw(im.snapshot||im.canvas||im,...args);};c.__adapted=true;}return c}
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
for(const file of ['data.js','equipment.js','world.js','save.js','input.js','autotile.js','landscape.js','settlement.js','game.js']){let source=fs.readFileSync(path.join(root,'js',file),'utf8');if(file==='game.js')source=source.replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();');vm.runInContext(source,sandbox,{filename:file});}
function tap(id){assert(el(id),id);el(id).fire('pointerdown');el(id).fire('pointerup')}
function dataTap(key,value){const e=elements.find(x=>x.dataset[key]===value);assert(e,key+':'+value);e.fire('pointerdown');e.fire('pointerup')}
function key(k){for(const f of docEvents.keydown||[])f({key:k,preventDefault(){}});for(const f of docEvents.keyup||[])f({key:k,preventDefault(){}})}
function shot(name,id='game'){fs.writeFileSync(path.join(output,name+'.png'),el(id).canvas.toBuffer('image/png'))}

const results=[];
function check(name,fn){fn();results.push(name)}
(async()=>{
 await Promise.all(loaded.map(im=>im.decode()));advance(32);
 const a=sandbox.YK_AUTOTILE;
 a.load();sandbox.YK_LANDSCAPE.load();await Promise.all(loaded.map(im=>im.decode()));advance(1);
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
 check('large forest objects cover each forest cell once and sort by depth',()=>{
  const m=a.fixture(),objects=a.forestObjects(m),seen=new Set();let last=-Infinity;
  for(const t of objects){assert.equal(t.width,80);assert.equal(t.height,80);assert(t.foot>=last);last=t.foot;for(const [x,y] of t.cells){assert.equal(m[y][x],'forest');assert(!seen.has(x+','+y));seen.add(x+','+y);}}
  assert.equal(seen.size,m.flat().filter(x=>x==='forest').length);
  const calls=[],c=createCanvas(640,544).getContext('2d'),draw=c.drawImage.bind(c);
  c.drawImage=(im,...args)=>{if(im.width===64)calls.push('tree');return draw(im,...args)};
  a.drawScene(c,m,{foot:140,draw:()=>calls.push('hero')});
  assert.equal(calls.filter(x=>x==='hero').length,1);assert.equal(calls.indexOf('hero'),objects.filter(t=>t.foot<=140).length);
 });
 const land=sandbox.YK_LANDSCAPE;
 // Native Image decoding is async; warm the immutable terrain snapshot before
 // synchronous simulated animation frames, avoiding per-strip canvas copies.
 const quarterGround=land.groundLayer(sandbox.__qaEval('DEBUG_QUARTER'));
 quarterGround.snapshot=new NativeImage();quarterGround.snapshot.src=quarterGround.canvas.toBuffer('image/png');await quarterGround.snapshot.decode();
 loaded.push(quarterGround.snapshot);
 const world=sandbox.YK_WORLD,mainGround=land.groundLayer(world.mapData);
 mainGround.snapshot=new NativeImage();mainGround.snapshot.src=mainGround.canvas.toBuffer('image/png');await mainGround.snapshot.decode();loaded.push(mainGround.snapshot);
 check('production world uses an 80x80 original terrain map with safe entrances',()=>{
  assert.equal(world.size,2560);assert.equal(world.mapData.length,80);
  assert(world.walkable(...world.start));
  for(const [id,p] of Object.entries(world.places)){assert(world.walkable(...p.point),id);assert.equal(world.near(...p.point),id);}
 });
 check('every production road is cardinal and its full centerline is traversable',()=>{
  for(const route of world.roads)for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i];assert(a[0]===b[0]||a[1]===b[1]);
   const n=Math.abs(b[0]-a[0])+Math.abs(b[1]-a[1]);
   for(let j=0;j<=n;j+=2){const x=a[0]+(b[0]-a[0])*j/n,y=a[1]+(b[1]-a[1])*j/n;assert(world.walkable(x,y),'blocked road '+x+','+y);}
  }
 });
 check('all story entrances are connected by four-direction walking cells',()=>{
  const queue=[world.start],seen=new Set([world.start.join(',')]);
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[32,0],[-32,0],[0,32],[0,-32]]){
   const nx=x+dx,ny=y+dy,k=nx+','+ny;
   if(seen.has(k)||!world.walkable(nx,ny)||!world.walkable(x+dx/2,y+dy/2))continue;
   seen.add(k);queue.push([nx,ny]);
  }}
  for(const [id,p] of Object.entries(world.places))assert(seen.has(p.point.join(',')),id+' unreachable');
 });
 check('legacy saves migrate coordinates once without altering progress or local interiors',()=>{
  const old={worldRevision:87,area:'field',x:637,y:191,worldPosition:[637,191],quest:3,gold:321,lv:7,visitedAreas:{waterfall:true}};
  const migrated=sandbox.YK_SAVE.migrate(old);assert.deepEqual([migrated.x,migrated.y],Array.from(world.places.waterfall.point));assert.equal(migrated.quest,3);assert.equal(migrated.gold,321);assert.equal(migrated.lv,7);assert(migrated.visitedAreas.waterfall);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.YK_SAVE.migrate(migrated))),JSON.parse(JSON.stringify(migrated)));
  const local=sandbox.YK_SAVE.migrate({...old,area:'teahouse',x:384,y:625});assert.equal(local.x,384);assert.equal(local.y,625);
 });

 check('twenty-three landscape assets load at declared sizes with binary alpha',()=>{
  assert(land.ready(),JSON.stringify(land.errors));assert.equal(land.keys.length,23);
  for(const k of land.keys){const [w,h]=land.specs[k],q=createCanvas(w,h).getContext('2d');land.drawAsset(q,k,0,0,w,h);const p=q.getImageData(0,0,w,h).data;let transparent=0,solid=0;for(let i=3;i<p.length;i+=4){assert(p[i]===0||p[i]===255);p[i]?solid++:transparent++;}assert(solid>0);if(!['horizon','grass','water','snow','barren','sand','road'].includes(k))assert(transparent>0);else{assert.equal(transparent,0);const px=(x,y)=>Array.from(p.slice((y*w+x)*4,(y*w+x)*4+4));if(k==='horizon')continue;for(let y=0;y<h;y++)assert.deepEqual(px(0,y),px(w-1,y),k+' horizontal repeat');for(let x=0;x<w;x++)assert.deepEqual(px(x,0),px(x,h-1),k+' vertical repeat');}}
 });
 check('all 256 water neighborhoods keep channels open and close exposed shores',()=>{
  for(let mask=0;mask<256;mask++){
   const n={n:!!(mask&1),e:!!(mask&2),s:!!(mask&4),w:!!(mask&8)},d={nw:!!(mask&16),ne:!!(mask&32),sw:!!(mask&64),se:!!(mask&128)};
   assert(land.contains(16,16,n,d,5));
   for(const [side,x,y] of [['n',16,0],['e',31,16],['s',16,31],['w',0,16]])assert.equal(land.contains(x,y,n,d,5),n[side]);
   if(n.n&&n.w&&!d.nw)assert(!land.contains(0,0,n,d,5));
  }
  const m=[['river','sea']];assert(land.adjacent(m,0,0,t=>t==='sea'||t==='river').e);
 });
 check('mixed terrain renders all regions and sorts mountain forest and hero by depth',()=>{
  const m=land.fixture(),types=new Set(m.flat());for(const t of ['grass','forest','mountain','rockMountain','snowMountain','snow','barren','sand','sea','river'])assert(types.has(t));
  const objects=land.objects(m);for(const k of ['greenMountain','rockMountain','snowMountain','shrine','lantern'])assert(objects.some(o=>o.kind===k));assert(objects.some(o=>o.kind==='forest'));
  for(let i=1;i<objects.length;i++)assert(objects[i].foot>=objects[i-1].foot);
  const c=createCanvas(640,544).getContext('2d');let actor=0;assert(land.draw(c,m,{foot:280,draw:()=>actor++}));assert.equal(actor,1);
  fs.writeFileSync(path.join(output,'05-landscape-floor.png'),c.canvas.toBuffer('image/png'));
 });
 check('decorations occupy suitable terrain and bridge spans both river banks',()=>{
  const m=land.fixture(),decor=m.decorations;
  for(const k of ['shrine','lantern','bridge','flowers'])assert(decor.some(o=>o.kind===k));
  for(const o of decor){assert(o.x>=0&&o.y>=0&&o.x+o.width<=640&&o.y+o.height<=544);const cy=Math.floor((o.foot-1)/32);if(o.kind==='bridge'){assert.equal(m[cy][Math.floor(o.x/32)],'grass');assert.equal(m[cy][Math.floor((o.x+o.width-1)/32)],'grass');assert.equal(m[cy][Math.floor((o.x+o.width/2)/32)],'river');assert(o.ground);}else assert.equal(m[cy][Math.floor((o.x+o.width/2)/32)],'grass');}
  const q=createCanvas(640,544).getContext('2d'),draw=q.drawImage.bind(q),calls=[];
  q.drawImage=(im,...args)=>{if(im.width===96&&im.height===40)calls.push('bridge');if(im.width===40&&im.height===24)calls.push('flowers');return draw(im,...args)};
  land.draw(q,m,{foot:0,draw:()=>calls.push('hero')});assert(calls.indexOf('bridge')<calls.indexOf('hero'));assert(calls.lastIndexOf('flowers')<calls.indexOf('hero'));
 });
 check('road networks connect their endpoints and never paint unbridged water',()=>{
  for(const m of [land.fixture(),land.placesFixture()]){
   const layer=land.roadLayer(m),q=layer.getContext('2d'),w=layer.width,h=layer.height,p=q.getImageData(0,0,w,h).data;
   const has=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&p[(y*w+x)*4+3]===255;
   const start=m.paths[0][0],queue=[[...start]],seen=new Set([start.join(',')]);
   for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(has(nx,ny)&&!seen.has(k)){seen.add(k);queue.push([nx,ny]);}}}
   for(const path of m.paths)for(const [x,y] of path)assert(seen.has(x+','+y),'disconnected road at '+x+','+y);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(has(x,y))assert(land.roadAllowed(m,x,y));
   assert.strictEqual(land.roadLayer(m),layer,'road layer cached');
  }
 });
 check('roads use cardinal segments with uninterrupted walkable centerlines',()=>{
  for(const m of [land.fixture(),land.placesFixture()]){
   const layer=land.roadLayer(m),p=layer.getContext('2d').getImageData(0,0,layer.width,layer.height).data;
   for(const path of m.paths)for(let i=1;i<path.length;i++){
    const [ax,ay]=path[i-1],[bx,by]=path[i];assert(ax===bx||ay===by,'diagonal road');
    const steps=Math.abs(bx-ax)+Math.abs(by-ay);
    for(let j=0;j<=steps;j++){
     const x=ax+Math.sign(bx-ax)*j,y=ay+Math.sign(by-ay)*j;
     assert.equal(p[(y*layer.width+x)*4+3],255,'broken road centerline '+x+','+y);
    }
   }
  }
 });
 check('all 256 ground neighborhoods preserve whole shared edges without corner pinholes',()=>{
  for(let mask=0;mask<256;mask++){
   const n={n:!!(mask&1),e:!!(mask&2),s:!!(mask&4),w:!!(mask&8)},d={nw:!!(mask&16),ne:!!(mask&32),sw:!!(mask&64),se:!!(mask&128)};
   for(const sx of [0,32])for(const sy of [0,32])for(let i=0;i<32;i++){
    for(const [side,x,y] of [['n',i,0],['e',31,i],['s',i,31],['w',0,i]])
     if(n[side])assert(land.groundInside(x,y,n,d,sx,sy),'ground seam '+mask+' '+side+' '+i);
   }
   assert(land.groundInside(16,16,n,d,0,0),'ground center missing');
  }
 });
 check('wide beach borders the sea and ground joins preserve shared edges',()=>{
  const m=land.fixture();assert(m.flat().filter(t=>t==='sand').length>=20);
  for(const y of [1,11,15]){const sea=m[y].indexOf('sea');assert.equal(m[y][sea-1],'sand');assert.equal(m[y][sea-2],'sand');}
  for(let mask=0;mask<16;mask++){
   const n={n:!!(mask&1),e:true,s:!!(mask&4),w:!!(mask&8)},r={...n,e:false,w:true},d={nw:true,ne:true,sw:true,se:true};
   for(let y=0;y<32;y++)assert.equal(land.groundInside(31,y,n,d,0,0),land.groundInside(0,y,r,d,32,0));
  }
 });
 check('collision blocks terrain and footprints while keeping every road centerline open',()=>{
  for(const m of [land.fixture(),land.placesFixture()]){
   for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++)if(['forest','mountain','snowMountain','rockMountain'].includes(m[y][x]))assert(!land.walkable(m,x*32+16,y*32+16),'solid terrain');
   assert(!land.walkable(m,-1,100));assert(!land.walkable(m,640,100));
   for(const path of m.paths)for(let i=1;i<path.length;i++){
    const [ax,ay]=path[i-1],[bx,by]=path[i],steps=Math.abs(bx-ax)+Math.abs(by-ay);
    for(let j=0;j<=steps;j+=2)assert(land.walkable(m,ax+Math.sign(bx-ax)*j,ay+Math.sign(by-ay)*j),'blocked route '+(ax+Math.sign(bx-ax)*j)+','+(ay+Math.sign(by-ay)*j));
   }
   for(const o of m.decorations){
    if(['jizo','lantern','town','village','shrine','hermit'].includes(o.kind))assert(!land.walkable(m,o.x+o.width/2,o.foot-12),o.kind+' footprint');
    if(o.kind==='bridge'){assert(land.walkable(m,o.x+o.width/2,o.y+o.height*.5));assert(!land.walkable(m,o.x+o.width/2,o.y+2),'bridge railing');}
   }
   assert.strictEqual(land.floorLayer(m),land.floorLayer(m),'static ground cached');
  }
  assert(!land.walkable(land.fixture(),600,400),'sea');
 });
 check('shrine base blocks approaches from front and sides without blocking the entrance approach',()=>{
  const m=land.fixture(),o=m.decorations.find(o=>o.kind==='shrine');
  // Regression: beta40 left the final 8px of the pedestal walkable.
  for(const x of [240,256,276,288])for(const y of [184,188,192])assert(!land.walkable(m,x,y),'pedestal leak '+x+','+y);
  assert(land.walkable(m,256,202),'entrance approach');
  assert(land.walkable(m,304,176),'beside shrine');
  for(const o of land.placesFixture().decorations)for(const f of land.footprints(o))
   assert(!land.walkable(land.placesFixture(),f.x+f.width/2,f.y+f.height-1),o.kind+' base');
  const places=land.placesFixture();assert(land.walkable(places,452,192),'torii center');
 });
 check('object shadows are cached with uniform subtle alpha and leave empty ground clear',()=>{
  const m=land.fixture(),layer=land.shadowLayer(m),p=layer.getContext('2d').getImageData(0,0,640,544).data;
  let shaded=0;for(let i=3;i<p.length;i+=4){assert(p[i]===0||p[i]===30,'overlapping shadow darkens');if(p[i])shaded++;}
  assert(shaded>100&&shaded<640*544/3,'shadow coverage');
  assert.strictEqual(land.shadowLayer(m),layer);assert.equal(p[(500*640+300)*4+3],0,'empty path');
 });
 check('all six new field objects appear in the dedicated settlement map',()=>{
  const m=land.placesFixture();for(const k of land.placeKeys)assert(m.decorations.some(o=>o.kind===k));
  for(const o of m.decorations){assert(o.x>=0&&o.y>=0&&o.x+o.width<=640&&o.y+o.height<=544);}
  const c=createCanvas(640,544).getContext('2d');let actor=0;assert(land.draw(c,m,{foot:360,draw:()=>actor++}));assert.equal(actor,1);
  fs.writeFileSync(path.join(output,'06-places-floor.png'),c.canvas.toBuffer('image/png'));
 });
 check('perspective projection is invertible and keeps feet at a shared anchor',()=>{
  const samples=JSON.parse(fs.readFileSync(path.join(root,'design-reference/mode7/yaksha_mode7_curve_samples.json'),'utf8'));for(const v of samples)assert(Math.abs(land.perspectiveScale(v.t)-v.scale)<.000001);
  const camera={x:464,y:1168};
  for(const z of [1.4,1.8])for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.5])for(const preset of [0,1,2])for(const x of [0,320,640])for(const y of [136,260,354,543]){
   const cam={...camera,angle,preset},w=land.unproject(x,y,cam,z),back=land.project(w.x,w.y,cam,z);assert(Math.abs(back.x-x)<1e-3);assert(Math.abs(back.y-y)<1e-3);
  }
  const p=land.project(464,1168,camera);assert.equal(p.x,320);assert(Math.abs(p.y-354)<1e-3);
  assert(land.project(464,1000,camera).scale<land.project(464,1100,camera).scale);
 });
 check('quarter-view field routes cross both bridge directions and reach landmarks',()=>{
  const m=land.quarterFixture();
  for(const path of m.paths)for(let i=1;i<path.length;i++){
   const [ax,ay]=path[i-1],[bx,by]=path[i],steps=Math.abs(bx-ax)+Math.abs(by-ay);
   assert(ax===bx||ay===by);
   for(let j=0;j<=steps;j+=2)assert(land.walkable(m,ax+Math.sign(bx-ax)*j,ay+Math.sign(by-ay)*j),'qv blocked road '+(ax+Math.sign(bx-ax)*j)+','+(ay+Math.sign(by-ay)*j));
  }
  assert(!land.walkable(m,440,816),'vertical bridge railing');assert(land.walkable(m,464,816),'vertical deck');
  const c=createCanvas(640,544).getContext('2d');let calls=0;
  land.drawQuarter(c,m,{x:464,foot:1168,draw:()=>calls++});assert.equal(calls,1);
  fs.writeFileSync(path.join(output,'09-quarter-floor.png'),c.canvas.toBuffer('image/png'));
  const bytes=640*544*4;assert(c.getImageData(0,0,640,544).data.length===bytes);
 });
 function openLandscape(){el('debugMap').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,15);shot('10-quarter');for(let i=0;i<3;i++)el('ok').fire('click');sandbox.gameState.x=352;sandbox.gameState.y=612;sandbox.__qaEval('map()');}
 const before=JSON.parse(JSON.stringify(sandbox.gameState));sandbox.YK_SAVE.auto(sandbox.gameState);
 const stateBefore=JSON.stringify(sandbox.gameState),saveBefore=[...storage];
 check('quarter-view touch movement crosses the vertical bridge and exits without changing saves',()=>{
  el('debugMap').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,15);
  sandbox.gameState.x=512;sandbox.gameState.y=1000;
  el('up').fire('pointerdown');advance(1000);el('up').fire('pointerup');advance(160);
  assert(sandbox.gameState.y-100<768,'crossed vertical bridge');
  sandbox.gameState.x=512;sandbox.gameState.y=916;sandbox.__qaEval('map()');shot('11-quarter-bridge');const groundPixel=el('game').canvas.getContext('2d').getImageData(500,550,1,1).data;assert(groundPixel[1]>groundPixel[2]*1.3,'perspective ground must remain visible during movement');
  el('ok').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,16);shot('12-quarter-near');
  el('ok').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,17);shot('13-quarter-map');
  sandbox.__YK_DEBUG_PAGE=15;sandbox.__qaEval('map()');
  el('worldBtn').fire('click');advance(900);assert(Math.abs(sandbox.__qaEval('debugAngle')-Math.PI/2)<.001);shot('14-quarter-rotated');
  const py=sandbox.gameState.y;tap('right');advance(160);assert.equal(sandbox.gameState.y-py,32,'screen right maps to world south after rotation');assert.equal(sandbox.gameState.dir,'r');
  el('settingsBtn').fire('click');assert.equal(sandbox.__qaEval('debugPreset'),1);el('settingsBtn').fire('click');assert.equal(sandbox.__qaEval('debugPreset'),2);
  el('cancel').fire('click');assert.equal(JSON.stringify(sandbox.gameState),stateBefore);assert.deepEqual([...storage],saveBefore);
 });
 check('title DEBUG MAP opens new original terrain',()=>{openLandscape();assert.equal(sandbox.gameState.area,'debugField');assert.equal(sandbox.__YK_DEBUG_PAGE,0);assert(!el('title').classList.contains('show'));});
 shot('01-landscape');
 check('movement uses real touch direction handlers',()=>{const x=sandbox.gameState.x;tap('right');assert.equal(sandbox.gameState.x-x,32);assert(sandbox.__qaEval('debugDrawPosition().x')<sandbox.gameState.x);advance(160);assert.equal(sandbox.__qaEval('debugDrawPosition().x'),sandbox.gameState.x);assert.equal(sandbox.gameState.walk,before.walk);});
 check('held movement stops at obstacles, cancellation restores state and map changes relocate safely',()=>{
  sandbox.gameState.x=368;sandbox.gameState.y=292;
  tap('down');advance(160);assert.equal(sandbox.gameState.y,292,'cannot walk into river');
  sandbox.gameState.x=336;sandbox.gameState.y=352;
  el('right').fire('pointerdown');advance(650);el('right').fire('pointerup');advance(160);
  assert(sandbox.gameState.x>=464,'held right crosses bridge');
  const stopped=sandbox.gameState.x;advance(500);assert.equal(sandbox.gameState.x,stopped,'release stops repeats');
  tap('down');el('cancel').fire('click');advance(200);assert.equal(JSON.stringify(sandbox.gameState),stateBefore,'no delayed movement after exit');
  openLandscape();sandbox.gameState.x=112;sandbox.gameState.y=164;
  el('ok').fire('click');assert(land.walkable(sandbox.__qaEval('DEBUG_LANDSCAPE'),sandbox.gameState.x-48,sandbox.gameState.y-100));
  el('cancel').fire('click');openLandscape();
 });
 check('touch movement stops at the shrine pedestal from right and front',()=>{
  sandbox.gameState.x=358;sandbox.gameState.y=276;tap('left');advance(160);
  assert.equal(sandbox.gameState.x-48,294,'right side stop');
  sandbox.__YK_DEBUG_PAGE=1;sandbox.__qaEval('map()');shot('07-shrine-side');
  sandbox.gameState.x=304;sandbox.gameState.y=324;tap('up');advance(160);
  assert.equal(sandbox.gameState.y-100,200,'front stop');shot('08-shrine-front');
  sandbox.__YK_DEBUG_PAGE=0;sandbox.__qaEval('map()');
 });
 el('ok').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,1);shot('02-landscape-2x');
 el('ok').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,2);shot('03-terrain-assets');
 el('ok').fire('click');shot('04-places');
 check('all eighteen debug pages render and cycle',()=>{for(let i=3;i<sandbox.__qaEval("DEBUG_PAGES.length");i++)el('ok').fire('click');assert.equal(sandbox.__YK_DEBUG_PAGE,0);});
 check('B restores full gameplay state and leaves saves untouched',()=>{el('cancel').fire('click');assert.equal(JSON.stringify(sandbox.gameState),stateBefore);assert.deepEqual([...storage],saveBefore);assert(el('title').classList.contains('show'));});
 check('Continue still restores the existing autosave',()=>{el('continueGame').fire('click');assert.equal(sandbox.gameState.area,'field');assert(!el('title').classList.contains('show'));});
 check('New game still starts',()=>{el('newGame').fire('click');assert.equal(sandbox.gameState.area,'field');assert(!el('title').classList.contains('show'));});
 check('production field moves 32px, enters and exits every existing story area',()=>{
  sandbox.__qaEval('busy=false;S.encounterGrace=999;');
  const y=sandbox.gameState.y;tap('up');advance(160);assert.equal(sandbox.gameState.y,y-32);
  assert(!sandbox.__qaEval('collision(S.x,S.y)'));shot('15-production-field');
  const pixel=el('game').canvas.getContext('2d').getImageData(200,570,1,1).data;assert(pixel[1]>pixel[2]*1.2,'production grass is actually rendered');
  sandbox.__qaEval('worldMap()');shot('16-production-overview','worldCanvas');sandbox.__qaEval('close("worldMap")');
  for(const [id,p] of Object.entries(world.places)){
   sandbox.__qaEval('busy=false;S.area="field";fieldMotion=null;');[sandbox.gameState.x,sandbox.gameState.y]=p.point;
   sandbox.__qaEval('action()');assert.equal(sandbox.gameState.area,id);
   if(id==='village'){sandbox.gameState.x=768;sandbox.gameState.y=1228;tap('down');}
   else {sandbox.gameState.x=44;sandbox.gameState.y=430;tap('left');}
   assert.equal(sandbox.gameState.area,'field',id+' exit');assert(world.walkable(sandbox.gameState.x,sandbox.gameState.y));
  }
  sandbox.__qaEval('restoreState(YK_SAVE.migrate({worldRevision:88,area:"field",x:2000,y:2096}));');
  assert.equal(sandbox.gameState.x,2000,'large coordinate preserved');
 });
 check('production encounters and save restore retain expanded world coordinates',()=>{
  sandbox.__qaEval('state(YK_SAVE.fresh());busy=false;S.encounterGrace=0;S.encounterSteps=100;');
  const before=[sandbox.gameState.x,sandbox.gameState.y],random=sandbox.Math.random;sandbox.Math.random=()=>0;
  assert(sandbox.__qaEval('beginEncounter()'));assert(el('battle').classList.contains('show'));assert.equal(sandbox.gameState.area,'field');assert.deepEqual([sandbox.gameState.x,sandbox.gameState.y],before);sandbox.Math.random=random;
  sandbox.__qaEval('state(YK_SAVE.fresh());busy=false;');
  [sandbox.gameState.x,sandbox.gameState.y]=world.places.forest.point;sandbox.YK_SAVE.auto(sandbox.gameState);
  sandbox.__qaEval('restoreState(YK_SAVE.loadAuto());');assert.deepEqual([sandbox.gameState.x,sandbox.gameState.y],Array.from(world.places.forest.point));
 });
 const originalRandom=sandbox.Math.random;
 const battleSetup=()=>{sandbox.Math.random=()=>0;sandbox.__qaEval('state(YK_SAVE.fresh());busy=false;S.encounterGrace=0;S.encounterSteps=100;beginEncounter();battle.hp=battle.max=999;renderBattle();');};
 battleSetup();await Promise.all(loaded.map(im=>im.decode()));sandbox.__qaEval('renderBattle()');
 check('battle touch pad is raised and grid navigation matches command positions',()=>{
  assert(el('pad').classList.contains('battleActive'));tap('down');assert.equal(sandbox.__qaEval('battleCursor'),2);tap('right');assert.equal(sandbox.__qaEval('battleCursor'),3);tap('up');assert.equal(sandbox.__qaEval('battleCursor'),1);
  tap('ok');assert.equal(sandbox.__qaEval('battle.menu'),'skill');tap('cancel');assert.equal(sandbox.__qaEval('battle.menu'),'root');assert.equal(sandbox.__qaEval('battle.hp'),999);
  shot('17-battle-idle','battleCanvas');
 });
 check('skill costs tech once and rejects repeated input during the turn',()=>{
  sandbox.__qaEval('cmd("skill")');tap('ok');const tech=sandbox.gameState.mp;assert.equal(tech,14);tap('ok');assert.equal(sandbox.gameState.mp,tech);shot('18-battle-skill','battleCanvas');advance(1200);assert(!sandbox.__qaEval('battleLocked'));
 });
 check('missing tech and empty items spend neither a turn nor resources',()=>{
  sandbox.gameState.mp=0;sandbox.__qaEval('cmd("skill");cmd("bloom")');const hp=sandbox.gameState.hp;advance(700);assert.equal(sandbox.gameState.hp,hp);assert(!sandbox.__qaEval('battleLocked'));
  sandbox.__qaEval('battleBack();S.potions=0;cmd("item");cmd("herb")');advance(700);assert.equal(sandbox.gameState.hp,hp);assert.equal(sandbox.gameState.potions,0);
 });
 check('guard halves only one incoming hit',()=>{
  battleSetup();sandbox.__qaEval('cmd("guard")');advance(1200);assert.equal(sandbox.gameState.hp,97);assert(!sandbox.__qaEval('battle.guarding'));sandbox.__qaEval('cmd("attack")');advance(1200);assert.equal(sandbox.gameState.hp,91);
 });
 check('healing costs tech and full-health item use does not consume an item',()=>{
  battleSetup();sandbox.__qaEval('cmd("item");cmd("herb")');assert.equal(sandbox.gameState.potions,2);assert(!sandbox.__qaEval('battleLocked'));
  sandbox.__qaEval('battleBack();S.hp=40;cmd("skill");cmd("heal")');assert.equal(sandbox.gameState.hp,72);assert.equal(sandbox.__qaEval('battleFx.source'),'hero');assert.equal(sandbox.gameState.mp,15);advance(1200);assert.equal(sandbox.gameState.hp,66);
 });
 check('victory rewards once, restores tech on level-up and waits for acknowledgement',()=>{
  battleSetup();sandbox.__qaEval('battle.hp=1;battle.xp=40;S.mp=0;cmd("attack")');advance(500);assert.equal(sandbox.gameState.lv,2);assert.equal(sandbox.gameState.mp,sandbox.gameState.maxmp);const gold=sandbox.gameState.gold;
  assert.equal(sandbox.__qaEval('battle.phase'),'result');assert(el('battle').classList.contains('show'));advance(1500);assert(el('battle').classList.contains('show'));sandbox.__qaEval('win()');assert.equal(sandbox.gameState.gold,gold);
  shot('19-battle-result','battleCanvas');tap('ok');assert(!el('battle').classList.contains('show'));assert(!el('pad').classList.contains('battleActive'));
 });
 check('escape result and stale battle callbacks cannot award or damage after exit',()=>{
  battleSetup();const gold=sandbox.gameState.gold;sandbox.__qaEval('cmd("escape")');advance(450);tap('cancel');assert(!el('battle').classList.contains('show'));assert.equal(sandbox.gameState.gold,gold);
  battleSetup();sandbox.__qaEval('cmd("attack");state(YK_SAVE.fresh());');advance(1200);assert.equal(sandbox.gameState.hp,100);assert.equal(sandbox.gameState.gold,30);
 });
 check('old saves gain tech while saved zero tech remains zero',()=>{
  const old=sandbox.YK_SAVE.migrate({saveVersion:11,lv:4});assert.equal(old.maxmp,24);assert.equal(old.mp,24);
  assert.equal(sandbox.YK_SAVE.migrate({...old,mp:0}).mp,0);
 });
 battleSetup();
 // Inspect the actual hero pixels emitted by production renderBattle, excluding
 // background/enemy/shadow. This catches transparent-margin scale regressions.
 for(const outfit of ['normal','stardust']){
  sandbox.__qaEval(`S.outfit=${JSON.stringify(outfit)};ensureBattleAssets()`);
 }
 await Promise.all(loaded.map(im=>im.decode()));advance(1);
 check('all 12 battle outfit/pose combinations keep visible height and ground contact',()=>{
  const isolated=createCanvas(768,430),ic=isolated.getContext('2d'),context=el('battleCanvas').getContext(),draw=context.drawImage;
  const heroImages=sandbox.__qaEval('[...Object.values(BATTLE_SPRITES).flatMap(Object.values),...Object.values(LAYERED_SPRITES).flatMap(s=>Object.values(s).flat())]');
  const preview=createCanvas(1200,480),pc=preview.getContext('2d');pc.fillStyle='#849098';pc.fillRect(0,0,1200,480);
  context.drawImage=(im,...args)=>{if(heroImages.includes(im))ic.drawImage(im,...args);return draw(im,...args)};
  try{for(const [oi,outfit] of ['normal','stardust'].entries()){
   for(const [pi,pose] of ['idle','attack','hit','guard','victory','skill'].entries()){
    ic.clearRect(0,0,768,430);sandbox.__qaEval(`S.outfit=${JSON.stringify(outfit)};battlePose=${JSON.stringify(pose)};renderBattle()`);
    const pixels=ic.getImageData(0,0,768,430).data;let top=430,bottom=-1;
    for(let y=0;y<430;y++)for(let x=0;x<768;x++)if(pixels[(y*768+x)*4+3]>16){top=Math.min(top,y);bottom=Math.max(bottom,y)}
    assert(bottom-top>=148&&bottom-top<=160,`${outfit}/${pose}: visible height ${bottom-top}`);
    assert(Math.abs(bottom-323)<=2,`${outfit}/${pose}: feet ${bottom}`);
    if(outfit==='normal'||outfit==='stardust'){
     const x=pi*200,y=outfit==='normal'?0:240;pc.drawImage(isolated,40,130,330,210,x,y+25,200,200);
     pc.fillStyle='#fff';pc.font='14px sans-serif';pc.fillText(outfit+'/'+pose,x+5,y+20);
    }
   }
  }}finally{context.drawImage=draw}
  fs.writeFileSync(path.join(output,'hero-battle-scale.png'),preview.toBuffer('image/png'));
 });

 check('merchant action opens shop; purchase equips and persists without changing appearance',()=>{
  sandbox.__qaEval('state(YK_SAVE.fresh());busy=false;S.area="village";S.x=660;S.y=912;S.dir="l";S.gold=1000;action()');
  assert(el('shop').classList.contains('show'));dataTap('shopItem','short_blade');assert.equal(sandbox.gameState.gold,935);
  sandbox.__qaEval('close("shop");menu()');assert.equal(elements.filter(e=>e.dataset.outfit).length,2);
  const select=elements.find(e=>e.dataset.equipSlot==='weapon');assert(select);select.value='short_blade';select.fire('change');
  assert.equal(sandbox.gameState.equipment.weapon,'short_blade');assert.equal(sandbox.gameState.outfit,'normal');
  assert.equal(sandbox.YK_SAVE.loadAuto().equipment.weapon,'short_blade');
 });
 check('each equipment chest is reachable, opens by action and cannot be claimed twice',()=>{
  for(const chest of sandbox.YK_EQUIPMENT.chests){
   sandbox.__qaEval(`state(YK_SAVE.fresh());busy=false;S.area=${JSON.stringify(chest.area)};S.x=${chest.x-40};S.y=${chest.y};S.dir="r";S.quest=6;`);
   assert(!sandbox.__qaEval(`collision(${chest.x-40},${chest.y})`),chest.id);
   sandbox.__qaEval('action();action();map()');assert.equal(sandbox.gameState.equipmentInventory[chest.item],1);
   shot('chest-'+chest.area);
  }
 });
 check('weapon and armor bonuses reach production combat and rewards only drop once',()=>{
  battleSetup();sandbox.__qaEval('E.grant(S,"short_blade");E.equip(S,"weapon","short_blade");cmd("attack")');
  assert.equal(sandbox.__qaEval('battle.hp'),999-18);advance(1200);
  battleSetup();sandbox.__qaEval('E.grant(S,"plum_robe");E.equip(S,"body","plum_robe");foe()');assert.equal(sandbox.gameState.hp,96);advance(700);
  battleSetup();sandbox.__qaEval('battle.baseName="木霊";battle.hp=0;win();win()');assert.equal(sandbox.gameState.equipmentInventory.leaf_comb,1);
 });
 sandbox.Math.random=originalRandom;
 check('changed image assets have no missing files',()=>assert(!missing.some(p=>p.includes('original-32-v2')||p.includes('forest-crown-v3')||p.includes('landscape-v1')||p.includes('landscape-v2')||p.includes('landscape-v3')||p.includes('places-v1')||p.includes('grass-v1')||p.includes('quarter-v1'))));
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed:results,scope:'Node VM + native canvas, not Safari',legacyMissing:missing},null,2));
 console.log(JSON.stringify({passed:results.length,checks:results,legacyMissing:missing},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.YK_LANDSCAPE?.ready());const run=code=>page.evaluate(code=>window.__qaEval(code),code);
await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;enterWorldPlace("village");');await page.waitForFunction(()=>window.YK_SETTLEMENT.ready()&&window.YK_AUTOTILE.ready());
for(const id of ['inn','shop','teahouse','osumiHome','farmHome','weaverHome','riverHome']){
await run(`busy=false;S.area='village';const d=YK_SETTLEMENT.doors.find(d=>d.id==='${id}');S.x=d.x;S.y=d.y+4;action();`);await page.waitForFunction(()=>window.gameState.area!=='village');
assert.equal(await run('S.lastInterior'),id);assert(await run('!collision(S.x,S.y)'),'spawn '+id);
const check=await run(`(()=>{const q=[[S.x,S.y]],seen=new Set();for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[32,0],[-32,0],[0,32],[0,-32]]){const a=x+dx,b=y+dy,k=a+','+b;if(!seen.has(k)&&!collision(a,b)){seen.add(k);q.push([a,b]);}}}return {exit:q.some(([x,y])=>YK_INTERIOR_BASE.exit({...S,x,y})),npc:areaNPCs().every(n=>q.some(([x,y])=>Math.hypot(x-n.x,y-n.y)<140))};})()`);assert(check.exit&&check.npc,JSON.stringify({id,check}));
await run('map()');await page.waitForTimeout(300);if(['inn','shop','teahouse','osumiHome'].includes(id))await page.screenshot({path:path.join(out,'interior-'+id+'.png')});
if(id==='teahouse'){
 const composite=await run(`(()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=768;
  const c=canvas.getContext('2d');
  YK_INTERIOR_BASE.draw(c,S);
  const samples=[[384,336,'rear'],[384,432,'middle'],[288,528,'threshold'],[384,560,'entry']];
  c.save();c.globalAlpha=.83;
  for(const [x,y,label] of samples){
    hero(c,x,y-9*.56,'d',0,S.outfit,.56);
    c.save();c.globalAlpha=1;c.lineWidth=2;c.strokeStyle='#00ffdc';
    c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.stroke();
    c.font='bold 14px sans-serif';c.fillStyle='#ffffff';
    c.shadowColor='#000000';c.shadowBlur=5;c.fillText(label,x+12,y);c.restore();
  }
  c.restore();
  return canvas.toDataURL('image/png').split(',')[1];
 })()`);
 fs.writeFileSync(path.join(out,'interior-teahouse-fixed-camera-scale.png'),Buffer.from(composite,'base64'));
 console.log('teahouse: fixed-camera scale composite captured using real actor art');
}
if(id==='teahouse'){
 // Source-art scale audit: identical production hero drawn at four floor points.
 // These are comparison samples, not claims of measured furniture footprints.
 for(const [label,x,y] of [['rear',384,336],['middle',384,432],['threshold',288,528],['entrance',384,560]]){
  await run(`S.x=${x};S.y=${y};fieldMotion=null;map();`);
  await page.screenshot({path:path.join(out,'interior-teahouse-scale-'+label+'.png')});
 }
 await run('S.x=384;S.y=560;fieldMotion=null;map();');
}
if(id==='inn'){await run('S.x=128;S.y=496;S.dir="u";S.hp=10;action();while($("dialog").classList.contains("show"))nextDialog();');assert.equal(await run('S.hp'),100);}
if(id==='shop'){
await page.waitForFunction(()=>window.YK_INTERIOR_BASE.layeredReady());
const layers=await run(`(()=>{
const room=YK_INTERIOR_BASE;
const blockedTop=room.blocked(S,384,320),blockedFoot=room.blocked(S,384,352);
const oldHero=hero,oldNpc=npc;const canvas=document.createElement('canvas');canvas.width=canvas.height=768;const ctx=canvas.getContext('2d');
hero=(c,x,y)=>{c.fillStyle='#ff00ff';c.fillRect(x-14,y-48,28,48)};npc=()=>{};
function sample(x,y,px,py){S.x=x;S.y=y;fieldMotion=null;room.draw(ctx,S);drawActorsOn(ctx);return Array.from(ctx.getImageData(px,py,1,1).data).slice(0,3).join(',');}
let behind,front,side;try{behind=sample(384,328,384,310);front=sample(384,400,384,360);side=sample(224,352,224,320);}finally{hero=oldHero;npc=oldNpc;}
S.x=256;S.y=336;fieldMotion=null;move(0,1,'d');const stopped=S.y===336;
S.x=224;S.y=336;fieldMotion=null;move(0,1,'d');const passes=S.y===368;fieldMotion=null;
return {blockedTop,blockedFoot,behind,front,side,stopped,passes};})()`);
assert(!layers.blockedTop&&layers.blockedFoot,JSON.stringify(layers));assert.notEqual(layers.behind,'255,0,255');assert.equal(layers.front,'255,0,255');assert.equal(layers.side,'255,0,255');assert(layers.stopped&&layers.passes,JSON.stringify(layers));
for(const [pose,x,y] of [['behind',320,304],['front',384,400],['side',224,352]]){await run(`S.x=${x};S.y=${y};fieldMotion=null;map()`);await page.screenshot({path:path.join(out,'armory-layer-'+pose+'.png')});}
console.log('counter: interpolated actor depth, rear occlusion, front/side visibility and footprint movement OK');
}
if(id==='shop'){await run('S.x=384;S.y=400;S.dir="u";action();');assert(await page.locator('#shop').evaluate(e=>e.classList.contains('show')));await run('$("shop").classList.remove("show");busy=false;');}
await run('S.x=400;S.y=592;action();');assert.equal(await run('S.area'),'village');await page.waitForFunction(()=>window.__qaEval('!villageDoorMotion&&!busy'));
console.log(id+': entry, spawn, reachable exit/NPC, return OK');}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
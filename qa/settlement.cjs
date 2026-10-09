// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 for(const height of [852,667]){
 const page=await browser.newPage({viewport:{width:393,height},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.YK_LANDSCAPE?.ready());
 const run=code=>page.evaluate(code=>window.__qaEval(code),code);
 await run('YK_SETTLEMENT.updateResidents=()=>false;state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;enterWorldPlace("village");');
 await page.waitForFunction(()=>window.YK_SETTLEMENT.ready()&&window.YK_AUTOTILE.ready());
 await page.screenshot({path:path.join(out,'village-entry-'+height+'.png')});
 const ownership=await page.evaluate(()=>{const v=YK_SETTLEMENT;return [...v.residents,...v.doors.flatMap(d=>v.insideResidents(d.id))].map(n=>n.id);});
 assert.equal(ownership.length,12);assert.equal(new Set(ownership).size,12,'each resident occupies one place');
 await run('S.x=768;S.y=1190;fieldMotion=null;move(0,-1,"u");');assert.equal(await run('S.y'),1158,'village step is 32px');
 await run('move(0,-1,"u");');assert.equal(await run('S.y'),1158,'no stacked move during interpolation');
 await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));
 await run('move(1,-1,"u");');assert.equal(await run('S.y'),1158,'same cardinal input policy as field');
 const projected=await page.evaluate(()=>{const v=YK_SETTLEMENT,c=v.camera(768,760),a=v.project(768,760,c),b=YK_LANDSCAPE.project(768,760,c,1.4);return {a,b,near:v.project(768,860,c).scale,far:v.project(768,660,c).scale};});assert.deepEqual(projected.a,projected.b);assert(projected.near>projected.far);
 const layout=await page.evaluate(()=>{
  const v=YK_SETTLEMENT,step=8,queue=[[768,1192]],seen=new Set(['768,1192']);
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const a=x+dx,b=y+dy,k=a+','+b;if(!seen.has(k)&&!v.blocked(a,b)){seen.add(k);queue.push([a,b]);}}}
  return {doors:v.doors.map(d=>({id:d.id,reachable:queue.some(([x,y])=>Math.abs(x-d.x)<20&&Math.abs(y-d.y)<14)})),npcs:v.residents.map(n=>({id:n.id,valid:!v.blocked(n.x,n.y),reachable:queue.some(([x,y])=>Math.hypot(x-n.x,y-n.y)<60)})),north:queue.some(([x,y])=>y<58&&x>710&&x<830),river:v.blocked(900,1060),bridge:!v.blocked(768,1060)};
 });
 assert(layout.doors.every(d=>d.reachable),JSON.stringify(layout));assert(layout.npcs.every(n=>n.valid&&n.reachable),JSON.stringify(layout));assert(layout.north&&layout.river&&layout.bridge);
 for(const id of ['inn','shop','teahouse','osumiHome','farmHome','weaverHome','riverHome']){
 await run(`busy=false;S.area='village';const door=YK_SETTLEMENT.doors.find(d=>d.id==='${id}');S.x=door.x;S.y=door.y+4;S.dir='u';map();action();`);
 assert(await run('busy&&!!villageDoorMotion'),'door animation locks movement');
 assert(await run('(()=>{const p=[S.x,S.y];if(!villageDoorMotion)return true;move(0,-1,"u");return S.x===p[0]&&S.y===p[1];})()'));
 await page.waitForFunction(()=>window.gameState.area!=='village');assert.equal(await run('S.lastInterior'),id);
 await run('S.x=384;S.y=640;action();');assert.equal(await run('S.area'),'village');
 await page.waitForFunction(()=>window.__qaEval('!villageDoorMotion&&!busy'));
 assert(await run('!collision(S.x,S.y)'),'safe doorway return '+id);
 }
 await run('busy=false;S.area="village";S.x=716;S.y=704;S.dir="u";S.quest=0;action();while($("dialog").classList.contains("show"))nextDialog();');
 assert.equal(await run('S.quest'),1,'chief story advances once');
 await run('S.x=716;S.y=704;S.dir="u";action();while($("dialog").classList.contains("show"))nextDialog();');assert.equal(await run('S.quest'),1);
 await run('busy=false;S.x=576;S.y=530;S.dir="u";action();');assert(!await page.locator('#shop').evaluate(el=>el.classList.contains('show')),'shared merchant art does not make farmer a shop');await run('while($("dialog").classList.contains("show"))nextDialog();');
 await run('busy=false;S.area="villageRoom";S.lastInterior="inn";S.x=384;S.y=440;S.dir="u";S.hp=10;S.mp=0;action();while($("dialog").classList.contains("show"))nextDialog();');assert.equal(await run('S.hp'),100);assert.equal(await run('S.mp'),18);
 await run('S.area="village";S.x=768;S.y=760;map();');
 const labels=await run('(()=>{const text=[],fn=g.fillText;g.fillText=function(s,...args){text.push(s);return fn.call(this,s,...args)};try{map()}finally{g.fillText=fn}return text;})()');
 for(const name of ['里長','里の子','畑守り','織り手','旅人'])assert(!labels.includes(name),'no overhead NPC labels');await page.screenshot({path:path.join(out,'village-square-'+height+'.png')});
 await run('S.x=1190;S.y=760;map();');
 const a=await run('(()=>{const c=document.createElement("canvas");c.width=c.height=768;YK_SETTLEMENT.draw(c.getContext("2d"),S,[],null,100);return c.toDataURL();})()');
 const b=await run('(()=>{const c=document.createElement("canvas");c.width=c.height=768;YK_SETTLEMENT.draw(c.getContext("2d"),S,[],null,900);return c.toDataURL();})()');assert.notEqual(a,b,'water changes while stationary');
 await run('S.x=768;S.y=1228;move(0,1,"d");');assert.equal(await run('S.area'),'field');
 await run('enterWorldPlace("village");S.x=768;S.y=72;move(0,-1,"u");');assert.equal(await run('S.area'),'field');
 const old=await run('YK_SAVE.migrate({...YK_SAVE.fresh(),area:"village",villageRevision:2,x:373,y:690,gold:900,quest:2})');assert.equal(old.x,768);assert.equal(old.y,1190);assert.equal(old.gold,900);assert.equal(old.quest,2);
 await run('state({...YK_SAVE.fresh(),area:"village",villageRevision:3,x:1040,y:704});YK_SAVE.auto(S);restoreState(YK_SAVE.loadAuto());');assert.equal(await run('S.x'),1040);assert.equal(await run('S.y'),704);
 assert.deepEqual(errors,[]);console.log('village '+height+': 7 doors, 12 unique residents, field camera/movement, both exits, bridge/water, migration, animation OK');await page.close();
 }
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

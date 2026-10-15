// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.YK_SETTLEMENT?.ready());const run=code=>page.evaluate(code=>window.__qaEval(code),code);
await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;');
for(const id of ['inn','shop','teahouse','osumiHome','farmHome','weaverHome','riverHome']){
await run(`busy=false;S.area='village';const d=YK_SETTLEMENT.doors.find(d=>d.id==='${id}');S.x=d.x;S.y=d.y+4;action();`);await page.waitForFunction(()=>window.gameState.area!=='village');
assert.equal(await run('S.lastInterior'),id);assert(await run('!collision(S.x,S.y)'),'spawn '+id);
const check=await run(`(()=>{const q=[[S.x,S.y]],seen=new Set();for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[32,0],[-32,0],[0,32],[0,-32]]){const a=x+dx,b=y+dy,k=a+','+b;if(!seen.has(k)&&!collision(a,b)){seen.add(k);q.push([a,b]);}}}return {exit:q.some(([x,y])=>YK_INTERIOR_BASE.exit({...S,x,y})),npc:areaNPCs().every(n=>q.some(([x,y])=>Math.hypot(x-n.x,y-n.y)<140))};})()`);assert(check.exit&&check.npc,JSON.stringify({id,check}));
await run('map()');await page.waitForTimeout(300);if(['inn','shop','teahouse','osumiHome'].includes(id))await page.screenshot({path:path.join(out,'interior-'+id+'.png')});
if(id==='inn'){await run('S.x=128;S.y=496;S.dir="u";S.hp=10;action();while($("dialog").classList.contains("show"))nextDialog();');assert.equal(await run('S.hp'),100);}
if(id==='shop'){await run('S.x=384;S.y=400;S.dir="u";action();');assert(await page.locator('#shop').evaluate(e=>e.classList.contains('show')));await run('$("shop").classList.remove("show");busy=false;');}
await run('S.x=400;S.y=592;action();');assert.equal(await run('S.area'),'village');await page.waitForFunction(()=>window.__qaEval('!villageDoorMotion&&!busy'));
console.log(id+': entry, spawn, reachable exit/NPC, return OK');}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
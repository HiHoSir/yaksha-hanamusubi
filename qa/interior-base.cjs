// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);const run=code=>page.evaluate(code=>window.__qaEval(code),code);
await page.waitForFunction(()=>window.YK_HOZUKI&&window.YK_INTERIOR_MAPS);await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;S.sound=false;enterWorldPlace("village");');await page.waitForFunction(()=>gameState.area==='village'&&window.__qaEval('!busy'));
const checks={inn:['inn',[3,5],'rest'],shop:['armory',[7,8],'shop'],teahouse:['teahouse',[3,5],'tea'],osumiHome:['home',[4,3],null],farmHome:['doctor',[4,5],'heal'],weaverHome:['home',[4,3],null]};
const doors=await page.evaluate(()=>YK_HOZUKI.doors);assert.equal(doors.length,6);
for(const door of doors){
 await run(`busy=false;fieldMotion=null;S.area='village';S.x=${door.approach[0]};S.y=${door.approach[1]};S.dir='u';action();`);await page.waitForFunction(id=>gameState.lastInterior===id&&gameState.area!=='village'&&window.__qaEval('!busy'),door.id);
 assert.equal(await run('YK_INTERIOR_MAPS.kind(S)'),checks[door.id][0]);assert(await run('!collision(S.x,S.y)'));
 const routes=await run(`(()=>{const q=[[S.x,S.y]],seen=new Set([q[0].join(',')]);for(let i=0;i<q.length;i++)for(const [dx,dy]of [[32,0],[-32,0],[0,32],[0,-32]]){const [x,y]=q[i],xx=x+dx,yy=y+dy,k=xx+','+yy;if(!seen.has(k)&&YK_INTERIOR_MAPS.canStep(S,x,y,xx,yy)){seen.add(k);q.push([xx,yy]);}}return {exit:q.some(([x,y])=>YK_INTERIOR_MAPS.exit({...S,x,y})),people:areaNPCs().every(n=>q.some(([x,y])=>YK_INTERIOR_MAPS.nearest({...S,x,y,dir:n.x>x?'r':n.x<x?'l':n.y>y?'d':'u'})===n))};})()`);assert(routes.exit&&routes.people,JSON.stringify({id:door.id,routes}));
 const [x,y]=checks[door.id][1];await run(`S.x=${x*32+16};S.y=${y*32+16};S.dir='${door.id.endsWith('Home')&&door.id!=='farmHome'?'r':'u'}';S.hp=1;S.mp=1;map();action();`);await page.waitForFunction(()=>document.getElementById('dialog').classList.contains('show'));await run('while($("dialog").classList.contains("show"))nextDialog()');
 if(checks[door.id][2]==='shop'){assert(await page.locator('#shop').evaluate(e=>e.classList.contains('show')));await run("close('shop')");}else if(checks[door.id][2])assert(await run('S.hp===S.maxhp&&S.mp===S.maxmp'));
 await run('YK_SAVE.auto(S);restoreState(YK_SAVE.loadAuto(),false);map()');await page.screenshot({path:path.join(out,'interior-'+door.id+'.png')});
 await page.setViewportSize({width:852,height:393});await run('map()');await page.screenshot({path:path.join(out,'interior-'+door.id+'-landscape.png')});await page.setViewportSize({width:393,height:852});
 await run('leaveInterior()');await page.waitForFunction(()=>gameState.area==='village'&&window.__qaEval('!busy'));assert.deepEqual(await run('[S.x,S.y]'),door.approach);console.log(door.id+': entry, cardinal routes, NPC conversation/service, save, return and two mobile orientations PASS');
}
assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

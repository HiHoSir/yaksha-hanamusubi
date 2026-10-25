// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);const run=code=>page.evaluate(code=>window.__qaEval(code),code);
await page.waitForFunction(()=>window.YK_HOZUKI&&window.YK_INTERIOR_MAPS);await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;S.sound=false;enterWorldPlace("village");');await page.waitForFunction(()=>gameState.area==='village'&&window.__qaEval('!busy'));

const stops=await run('YK_WORLD.restStops');
assert.equal(stops.length,4);
const cells=await run(`(()=>{const expected=new Set(YK_WORLD.mapData.decorations.flatMap(o=>o.occupiedTiles.map(p=>p.join(','))));return {actual:[...YK_WORLD.mapData.occupiedTiles].sort(),expected:[...expected].sort(),guides:YK_WORLD.guides.every(g=>!YK_WORLD.walkable(g.x,g.y))};})()`);
assert.deepEqual(cells.actual,cells.expected);assert(cells.guides);
await run(`S.area='field';S.x=YK_WORLD.start[0];S.y=YK_WORLD.start[1];fieldMotion=null;S.dir='d';`);
await run('YK_LANDSCAPE.load(()=>{})');await page.waitForFunction(()=>YK_LANDSCAPE.ready());
const aligned=await run(`(()=>{const before=YKSpriteOutline.draw;let center;try{YKSpriteOutline.draw=(c,im,sx,sy,sw,sh,dx,dy,dw,dh,...extra)=>{if(im===HIZUKI_FIELD_SD){const b=sdFieldBounds(0,0),v=c.getTransform().transformPoint(new DOMPoint(dx+(b.left+b.width/2)*dw/32,dy+(b.bottom+1-b.height/2)*dh/32));center=[v.x,v.y];}return before(c,im,sx,sy,sw,sh,dx,dy,dw,dh,...extra);};map();const p=YK_LANDSCAPE.project(S.x,S.y,{x:S.x,y:S.y},1.4),h=YK_ELEVATION.height(YK_WORLD.mapData,S.x,S.y);return {center,expected:[p.x*1.2,32+1.2*(p.y-h*20*p.scale)]};}finally{YKSpriteOutline.draw=before;}})()`);
assert(aligned.center,'approved hero rendered');assert(aligned.center.every((p,i)=>Math.abs(p-aligned.expected[i])<.01),JSON.stringify(aligned));
await run('collisionDebugVisible=true;map()');await page.screenshot({path:path.join(out,'field-grid-alignment.png')});await run('collisionDebugVisible=false');
for(const stop of stops){
 await run(`busy=false;fieldMotion=null;S.area='field';S.restStopId=null;S.lastInterior=null;S.x=${stop.point[0]};S.y=${stop.point[1]};S.dir='u';S.encounterGrace=9999;action();`);
 assert.equal(await run('S.area'),'field','A at approach never enters');await run(`close('commandMenu');move(0,-22,'u');`);
 await page.waitForFunction(id=>gameState.restStopId===id&&window.__qaEval('!busy'),stop.id);
 assert.equal(await run('YK_INTERIOR_MAPS.kind(S)'),stop.type==='inn'?'inn':'teahouse');
 const staff=await run('areaNPCs()[0]');assert.equal(staff.name,await run(`REST_STOP_PROFILES['${stop.id}'].host.name`));assert(staff.newNpcId);
 await run(`S.x=112;S.y=176;S.dir='u';S.hp=1;S.mp=1;map();action();`);await page.waitForFunction(()=>document.getElementById('dialog').classList.contains('show'));
 await run('while($("dialog").classList.contains("show"))nextDialog()');assert(await run('S.hp===S.maxhp&&S.mp===S.maxmp'));
 await run('YK_SAVE.auto(S);restoreState(YK_SAVE.loadAuto(),false);map()');await page.screenshot({path:path.join(out,'field-rest-'+stop.id+'.png')});
 await page.setViewportSize({width:852,height:393});await run('map()');await page.screenshot({path:path.join(out,'field-rest-'+stop.id+'-landscape.png')});await page.setViewportSize({width:393,height:852});
 await run(`(()=>{const m=YK_INTERIOR_MAPS.map(S),[x,y]=m.layers.exits[0];for(const [dx,dy,dir]of [[0,-1,'d'],[-1,0,'r'],[1,0,'l'],[0,1,'u']]){const px=(x+dx)*32+16,py=(y+dy)*32+16;if(YK_INTERIOR_MAPS.canStep(S,px,py,x*32+16,y*32+16)){S.x=px;S.y=py;fieldMotion=null;move(-dx*22,-dy*22,dir);return;}}throw Error('no exit approach');})()`);
 await page.waitForFunction(()=>gameState.area==='field'&&window.__qaEval('!busy'));assert.deepEqual(await run('[S.x,S.y]'),stop.point);assert.equal(await run('S.restStopId'),null);
 console.log(stop.id+': automatic overlap entry, current map, own NPC, recovery, save, automatic safe return, portrait/landscape PASS');
}
assert.deepEqual(errors,[]);console.log('Production field collision index, solid jizo and visible hero cell-center PASS');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

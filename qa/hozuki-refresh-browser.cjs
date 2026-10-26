// Real Chromium smoke: root editor, approved chips, export/restore, mobile controls and field.
const fs=require('fs'),path=require('path'),http=require('http'),a=require('node:assert/strict');
const {chromium}=require('playwright'),{loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/hozuki-refresh');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream');let bytes=fs.readFileSync(file);if(name==='/js/game.js')bytes=Buffer.from(bytes.toString().replace(/\}\)\(\);\s*$/,'window.__qaEval=code=>eval(code);})();'));res.end(bytes);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/index.html');await page.waitForFunction(()=>window.__qaEval&&window.YK_HOZUKI);await page.evaluate(()=>YK_HOZUKI.whenReady());
 await page.evaluate(()=>__qaEval('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;S.sound=false;YK_HOZUKI.enter(S);map();'));
 const initial=await page.evaluate(()=>YK_HOZUKI.residents.map(n=>({id:n.id,x:n.x,y:n.y})));
 await page.waitForFunction(before=>YK_HOZUKI.residents.filter((n,i)=>n.x!==before[i].x||n.y!==before[i].y).length>=2,initial,{timeout:15000});
 a.equal(await page.evaluate(()=>YK_HOZUKI.residents.every(n=>n.x%32===16&&n.y%32===16)),true);
 a.equal(await page.evaluate(()=>{const audit=SMModel.audit(YK_HOZUKI.navigationMap());return audit.targets.every(t=>t.reachable&&audit.reachable.has(SMModel.key(t.marker)));}),true);
 await page.evaluate(()=>__qaEval('S.x=336;S.y=336;S.dir="r";action();'));
 await page.waitForFunction(()=>document.getElementById('speaker').textContent==='里長');
 const paused=await page.evaluate(()=>YK_HOZUKI.residents.map(n=>YK_HOZUKI.residentPosition(n)));
 await page.waitForTimeout(1000);a.deepEqual(await page.evaluate(()=>YK_HOZUKI.residents.map(n=>YK_HOZUKI.residentPosition(n))),paused,'dialog pauses rendered NPC motion');
 await page.screenshot({path:path.join(out,'village-dialog-mobile.png')});
 await page.evaluate(()=>__qaEval('for(let i=0;i<12;i++)nextDialog();busy=false;S.x=112;S.y=144;S.dir="u";move(0,-22,"u");'));
 await page.waitForFunction(()=>window.gameState.area==='villageRoom');a.equal(await page.evaluate(()=>gameState.lastInterior),'inn');
 await page.waitForTimeout(600);await page.evaluate(()=>__qaEval('busy=false;leaveInterior();'));await page.waitForFunction(()=>gameState.area==='village');
 a.deepEqual(await page.evaluate(()=>[gameState.x,gameState.y]),[112,144]);
 await page.waitForTimeout(600);await page.evaluate(()=>__qaEval('busy=false;S.x=112;S.y=144;S.dir="u";YK_SAVE.auto(S);restoreState(YK_SAVE.loadAuto(),false);map();'));
 a.deepEqual(await page.evaluate(()=>[gameState.x,gameState.y]),[112,144]);a.equal(await page.evaluate(()=>gameState.quest),1);
 await page.evaluate(()=>__qaEval('const safe=[336,304];if(!YK_HOZUKI.blocked(...safe)){[S.x,S.y]=safe;map();}'));
 await page.screenshot({path:path.join(out,'village-cherry-mobile.png')});
 const report=await page.evaluate(()=>__qaEval('({html:__YK_HTML_BUILD,game:__YK_RUNNING_GAME_BUILD,hero:HIZUKI_FIELD_SD.datasetSrc,outline:!!window.YKSpriteOutline,ready:YK_HOZUKI.ready()})'));
 a.equal(report.html,report.game);a(report.hero.includes('field-sd-v2'));a(report.outline);a(report.ready);a.deepEqual(errors,[]);
 console.log('PASS Chromium: actual ticker random walking, cell reservations/routes, chief dialogue/pause/story, inn entry/return, save reload, latest Hizuki/outline',report);
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});


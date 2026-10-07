// Browser layout smoke: isolated local server and fresh context, no user saves.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream');
 let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{for(const height of [852,667]){
 const context=await browser.newContext({viewport:{width:393,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.YK_LANDSCAPE?.ready());
 await page.evaluate(()=>{window.__qaEval('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;S.encounterGrace=0;S.encounterSteps=100;Math.random=()=>0;beginEncounter();battle.hp=battle.max=999;');});
 await page.waitForFunction(()=>window.__qaEval('layerReady(B9EN.redoni)'));await page.evaluate(()=>window.__qaEval('renderBattle()'));
 for(const id of ['up','down','left','right','ok','cancel']){assert(await page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),id+' occluded '+height);}
 await page.locator('#right').tap();await page.locator('#ok').tap();assert.equal(await page.evaluate(()=>window.__qaEval('battle.menu')),'skill');await page.locator('#cancel').tap();assert.equal(await page.evaluate(()=>window.__qaEval('battle.menu')),'root');
 const commands=await page.locator('#battleCommands').boundingBox(),battle=await page.locator('#battle').boundingBox();assert(commands.y+commands.height<=battle.y+battle.height,'commands clipped '+height);
 await page.screenshot({path:path.join(__dirname,'results/autotile/battle-mobile-'+height+'.png')});assert.deepEqual(errors,[]);console.log('mobile layout and real touch OK: 393x'+height);await context.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

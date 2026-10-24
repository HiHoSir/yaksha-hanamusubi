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
 await page.evaluate(()=>{window.__qaEval('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;S.area="field";S.encounterGrace=0;S.encounterSteps=100;Math.random=()=>0;if(!beginEncounter(true))throw Error("forced battle setup failed");battle.hp=battle.max=999;');});
 await page.waitForFunction(()=>window.__qaEval('layerReady(B9EN.redoni)'));await page.waitForFunction(()=>window.__qaEval('!battleLocked'),null,{timeout:6000});await page.evaluate(()=>window.__qaEval('renderBattle()'));
 // The battle is a full-screen overlay: field controls are intentionally behind it.
 // Verify the actual battle command touch targets instead of the hidden field pad.
 assert(await page.locator('#battle').isVisible(),'battle overlay hidden '+height);
 assert(await page.locator('#battleCommands').isVisible(),'battle commands hidden '+height);
 const battleButtons=page.locator('#battleCommands [data-cmd]');
 assert(await battleButtons.count()>=5,'battle commands missing '+height);
 for(const button of await battleButtons.all()){
  if(!(await button.isVisible()))continue;
  assert(await button.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'battle command occluded '+height);
 }
 await battleButtons.nth(1).tap();assert.equal(await page.evaluate(()=>window.__qaEval('battle.menu')),'skill');
 await battleButtons.nth(2).tap();assert.equal(await page.evaluate(()=>window.__qaEval('battle.menu')),'root');
 await page.evaluate(()=>window.__qaEval('cmd("attack")'));
 assert.equal(await page.evaluate(()=>window.__qaEval('battle.menu')),'target','attack must enter target selection');
 assert(await page.locator('#enemyTargetInfo').isVisible(),'enemy name should appear during targeting');
 await page.evaluate(()=>window.__qaEval('cmd("back")'));
 assert.equal(await page.evaluate(()=>window.__qaEval('battle.menu')),'root');
 assert(!(await page.locator('#enemyTargetInfo').isVisible()),'enemy name hidden outside targeting');
 const commands=await page.locator('#battleCommands').boundingBox(),battle=await page.locator('#battle').boundingBox();assert(commands.y+commands.height<=battle.y+battle.height,'commands clipped '+height);
 await page.screenshot({path:path.join(__dirname,'results/autotile/battle-mobile-'+height+'.png')});
 if(process.argv.includes('--hero-only')){
  await require('./battle-hero-layout.cjs')(page,assert);
  assert.deepEqual(errors,[]);await context.close();continue;
 }
 await require('./battle-victory-layout.cjs')(page,assert);
 await page.evaluate(()=>window.__qaEval('endBattle()'));
 assert(!(await page.locator('#virtualStick').isVisible()),'legacy stick must stay hidden after battle '+height);
  assert(await page.locator('#up').isVisible(),'four-way D-pad must be visible after battle '+height);
  assert(!(await page.locator('#upLeft').isVisible()),'diagonal control must stay hidden '+height);
  for(const id of ['up','ok','cancel']){assert(await page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),id+' occluded after battle '+height);}

 await page.evaluate(()=>window.__qaEval('state(YK_SAVE.fresh());busy=false;S.area="villageRoom";S.lastInterior="shop";S.x=384;S.y=400;S.dir="u";S.gold=1000;action();'));
 await page.locator('[data-shop-item="short_blade"]').tap();
 assert.equal(await page.evaluate(()=>window.gameState.gold),955);
 assert.equal(await page.evaluate(()=>window.gameState.equipmentInventory.short_blade),1);
 await page.screenshot({path:path.join(__dirname,'results/autotile/shop-mobile-'+height+'.png')});
 await page.locator('[data-close="shop"]').tap();await page.locator('#bookBtn').tap();await page.locator('[data-field-command="equipment"]').tap();
 await page.locator('[data-equip-slot="weapon"]').selectOption('short_blade');
 assert.equal(await page.evaluate(()=>window.gameState.equipment.weapon),'short_blade');
 const expectedAttack=await page.evaluate(()=>window.__qaEval("S.atk+relicBonus('atk')"));
 assert((await page.locator('#statusPanel').innerText()).includes('攻撃力 '+expectedAttack),'status attack must include current equipment bonus');
 assert.equal(await page.locator('[data-outfit]').count(),1);
 for(const slot of ['weapon','head','body','feet'])assert(await page.locator('[data-equip-slot="'+slot+'"]').evaluate(el=>el.getBoundingClientRect().right<=window.innerWidth),'equipment overflow');
 await page.screenshot({path:path.join(__dirname,'results/autotile/equipment-mobile-'+height+'.png')});
 await page.locator('[data-close="menu"]').tap();await page.locator('#bookBtn').tap();await page.locator('[data-field-command="outfits"]').tap();
 assert.equal(await page.locator('[data-outfit="stardust"]').count(),0);
 assert.equal(await page.evaluate(()=>window.gameState.outfit),'normal');
 assert.equal(await page.evaluate(()=>YK_SAVE.migrate({outfit:'stardust'}).outfit),'normal');
 assert.equal(await page.evaluate(()=>window.gameState.equipment.weapon),'short_blade');
 await page.evaluate(()=>window.__qaEval('state(YK_SAVE.fresh());busy=false;S.area="cove";S.x=280;S.y=590;S.dir="r";action();action();'));
 assert.equal(await page.evaluate(()=>window.gameState.equipmentInventory.tide_staff),1);
 assert.equal(await page.evaluate(()=>window.YK_SAVE.loadAuto().equipmentInventory.tide_staff),1);
 await page.screenshot({path:path.join(__dirname,'results/autotile/chest-mobile-'+height+'.png')});
 assert.deepEqual(errors,[]);console.log('equipment buy/equip, bonus appearance and chest touch OK: 393x'+height);
 console.log('mobile layout and real touch OK: 393x'+height);await context.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

// Title continue must select a MANUAL slot; suspension is a distinct path.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 const ext=path.extname(file);
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4'})[ext]||'application/octet-stream');
 res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:393,height:667},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const common={saveVersion:14,worldRevision:119,area:'village',x:768,y:920,lv:3,quest:2,hp:70,maxhp:70,mp:12,maxmp:12,outfit:'normal'};
   localStorage.setItem('yaksha_beta_auto',JSON.stringify({...common,gold:777,lv:7}));
   localStorage.setItem('yaksha_beta_slot1',JSON.stringify({...common,gold:111,lv:1}));
   localStorage.setItem('yaksha_beta_slot3',JSON.stringify({...common,gold:333,lv:3}));
  });
  const address='http://127.0.0.1:'+server.address().port+'/';
  const ready=async()=>page.waitForFunction(()=>window.YK_SAVE&&window.YK_INPUT&&document.querySelector('#newGame').getAttribute('onclick')===null);
  await page.goto(address);await ready();
  assert(await page.locator('#title').isVisible());
  await page.locator('#continueGame').tap();
  assert(await page.locator('#titleLoadSelection').isVisible(),'manual save picker must open');
  assert(!await page.locator('#titleMainActions').isVisible(),'main actions must hide while picking');
  assert.equal(await page.locator('#titleLoadSlots button').count(),3);
  assert.equal(await page.locator('#titleLoadSlots button').nth(1).isDisabled(),true,'empty manual slot cannot load');
  assert((await page.locator('#titleLoadSlots button').first().innerText()).includes('1段'));
  assert((await page.locator('#titleLoadSlots button').last().innerText()).includes('3段'));
  await page.locator('#titleLoadBack').tap();
  assert(await page.locator('#continueGame').isVisible(),'back restores title menu');
  await page.locator('#continueGame').tap();
  await page.locator('#titleLoadSlots button').last().tap();
  await page.waitForFunction(()=>!document.querySelector('#title').classList.contains('show'));
  assert.equal(await page.evaluate(()=>window.gameState.gold),333,'chosen manual slot must be restored');
  assert.equal(await page.evaluate(()=>window.YK_SAVE.loadAuto().gold),777,'manual loading must not overwrite suspension');
  await page.reload();await ready();
  await page.locator('#resumeSuspend').tap();
  await page.waitForFunction(()=>!document.querySelector('#title').classList.contains('show'));
  assert.equal(await page.evaluate(()=>window.gameState.gold),777,'dedicated suspension button loads autosave');
  await page.reload();await ready();
  await page.evaluate(()=>{localStorage.removeItem('yaksha_beta_auto');localStorage.removeItem('yaksha_beta');});
  await page.locator('#resumeSuspend').tap();
  assert(await page.locator('#title').isVisible(),'missing suspension keeps title open');
  assert((await page.locator('#bootError').innerText()).includes('中断セーブがありません'));
  assert.deepEqual(errors,[],'unexpected script errors');
  console.log('PASS title save-selection: manual slots, disabled empty, back, distinct suspension, missing auto');
  await page.close();
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

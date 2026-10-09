// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 for(const height of [852,667,568]){
  const page=await browser.newPage({viewport:{width:393,height},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.YK_LANDSCAPE?.ready());
  const run=code=>page.evaluate(code=>window.__qaEval(code),code);
  // Regression: a full-screen title must never intercept virtual D-pad/A/B touches.
  for(const id of ['up','down','ok','cancel'])assert(await page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),id+' inaccessible over title');
  await page.locator('#down').tap();
  assert(await page.locator('#continueGame').evaluate(e=>document.activeElement===e),'D-pad cannot focus continue on title');
  await page.locator('#up').tap();
  assert(await page.locator('#newGame').evaluate(e=>document.activeElement===e),'D-pad cannot focus new game');
  await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;enterWorldPlace("village");');await page.waitForFunction(()=>YK_SETTLEMENT.ready());
  await run('talk({n:"緋月",t:["川の向こうには、旅の続きを待つ人たちがいる。焦らずに進んでいきましょう。","では、出発しましょう。"]});');
  const box=await page.locator('.dialogWindow').boundingBox(),pad=await page.locator('#pad').boundingBox();assert(box.y+box.height+4<=pad.y,'dialog above controls '+height);assert(box.y>=48,'dialog in stage');
  for(const id of ['ok','dialogNext'])assert(await page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),id+' clickable');
  assert(await page.locator('#cancel').isDisabled());const position=await run('[S.x,S.y]');
  await page.screenshot({path:path.join(out,'dialog-'+height+'.png')});
  await page.locator('#ok').tap();assert.equal(await page.locator('#dialogText').textContent(),'では、出発しましょう。');
  await page.locator('#dialogNext').tap();assert(!await page.locator('#dialog').evaluate(e=>e.classList.contains('show')));assert(!await page.locator('#cancel').isDisabled());assert.deepEqual(await run('[S.x,S.y]'),position);assert.deepEqual(errors,[]);
  console.log('dialog '+height+': no overlap, A advances once, Next closes, no movement');await page.close();
 }
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

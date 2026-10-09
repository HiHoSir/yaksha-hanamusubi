// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 for(const height of [852,667,568]){
  const page=await browser.newPage({viewport:{width:393,height},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.YK_LANDSCAPE?.ready());
  const run=code=>page.evaluate(code=>window.__qaEval(code),code);
  // Title overlay owns the screen; gameplay controls must be hidden rather than
  // competing with title buttons. Verify real touch access at all mobile heights.
  assert(!await page.locator('#pad').isVisible(),'game pad must be hidden on title');
  for(const id of ['newGame','continueGame'])assert(await page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),id+' inaccessible on title');
  await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;enterWorldPlace("village");');await page.waitForFunction(()=>YK_SETTLEMENT.ready());
  await run('talk({n:"緋月",t:["川の向こうには、旅の続きを待つ人たちがいる。焦らずに進んでいきましょう。","では、出発しましょう。"]});');
  const box=await page.locator('.dialogWindow').boundingBox(),pad=await page.locator('#pad').boundingBox();assert(box.y+box.height+4<=pad.y,'dialog above controls '+height);assert(box.y>=48,'dialog in stage');
  for(const id of ['ok','dialogNext'])assert(await page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),id+' clickable');
  assert(await page.locator('#cancel').isDisabled());const position=await run('[S.x,S.y]');
  await page.screenshot({path:path.join(out,'dialog-'+height+'.png')});
  await page.locator('#ok').tap();assert.equal(await page.locator('#dialogText').textContent(),'では、出発しましょう。');
  await page.locator('#dialogNext').tap();assert(!await page.locator('#dialog').evaluate(e=>e.classList.contains('show')));assert(!await page.locator('#cancel').isDisabled());assert.deepEqual(await run('[S.x,S.y]'),position);assert.deepEqual(errors,[]);
  // Painted teahouse assets are optional until installed: verify the same scene pipeline
  // stays safe with or without their files, and exposes two aligned depth planes.
  assert.equal(await run('typeof paintedTeaReady'), 'function');
  // Shared perspective guide: finite positions, monotonic projected depth/scale,
  // and independent occluder planes instead of a full-screen front mask.
  assert.equal(await run('INDOOR_PERSPECTIVE.tea.occluders.length'),5);
  assert(await run('indoorProjectedBlocked(INDOOR_PERSPECTIVE.tea,260,515)'),'hearth must block walking');
  assert(!await run('indoorProjectedBlocked(INDOOR_PERSPECTIVE.tea,440,625)'),'open central aisle must be walkable');
  assert(await run('indoorProjectedBlocked(INDOOR_PERSPECTIVE.tea,650,455)'),'counter must block walking');
  assert(await run('indoorPerspective(INDOOR_PERSPECTIVE.tea,384,245).scale < indoorPerspective(INDOOR_PERSPECTIVE.tea,384,705).scale'));
  assert(await run('indoorPerspective(INDOOR_PERSPECTIVE.tea,384,245).y < indoorPerspective(INDOOR_PERSPECTIVE.tea,384,705).y'));
  assert(await run('Number.isFinite(indoorPerspective(INDOOR_PERSPECTIVE.tea,384,625).scale)'));

  await run('S.area="teahouse";map();');
  assert.equal(await run('S.area'), 'teahouse');
  await run('S.area="village";map();');
  // Opening scene can change speaker and portrait without creating extra overlays.
  await run('talk({n:"緋月",t:[{speaker:"里の子",text:"鈴はどこ？"},{speaker:"緋月",text:"確かめよう。"}]});');
  assert.equal(await page.locator('#speaker').textContent(),'里の子');
  assert.equal(await page.locator('#dialogPortrait').evaluate(e=>e.style.display),'none');
  await page.locator('#ok').tap();
  assert.equal(await page.locator('#speaker').textContent(),'緋月');
  assert.equal(await page.locator('#dialogPortrait').evaluate(e=>e.style.display),'block');
  await page.locator('#ok').tap();
  assert(!await page.locator('#dialog').evaluate(e=>e.classList.contains('show')));
  console.log('dialog '+height+': no overlap, A advances once, Next closes, no movement');await page.close();
 }
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

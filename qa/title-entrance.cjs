// Fast entrance regression: title buttons, UI visibility, and fresh-game startup.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
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
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>window.YK_INPUT&&window.YK_SAVE&&window.YK_PROLOGUE&&document.querySelector('#newGame').getAttribute('onclick')===null,null,{timeout:15000});
  assert(await page.locator('#title').isVisible(),'title must be visible at boot');
  assert(!await page.locator('#pad').isVisible(),'gamepad must not cover title');
  for(const id of ['newGame','continueGame']){
   assert(await page.locator('#'+id).evaluate(e=>{
    const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
    return b.width>0&&b.height>0&&(hit===e||e.contains(hit));
   }),id+' must be touchable');
  }
  await page.locator('#newGame').tap();
  await page.waitForSelector('#prologuePlayer video');
  assert(!await page.locator('#pad').isVisible(),'controls stay hidden during movie');
  await page.waitForFunction(()=>document.querySelector('#prologuePlayer video').currentTime>0.1,null,{timeout:30000});
  assert(await page.locator('#prologuePlayer video').evaluate(v=>v.videoWidth===640&&v.videoHeight===360&&v.playsInline),'approved inline movie must decode');
  await page.locator('[data-skip]').tap();
  await page.waitForFunction(()=>!document.querySelector('#title').classList.contains('show'),null,{timeout:8000});
  assert(!await page.locator('#prologuePlayer').count(),'skip removes movie');
  assert(await page.locator('#pad').isVisible(),'gamepad must appear after start');
  assert.deepEqual(errors,[],'unexpected startup script errors');
  // A second fresh start exercises the native ended event, not a synthetic callback.
  await page.reload();
  await page.waitForFunction(()=>window.YK_PROLOGUE&&document.querySelector('#newGame').getAttribute('onclick')===null);
  await page.locator('#newGame').tap();
  await page.waitForFunction(()=>document.querySelector('#prologuePlayer video')?.currentTime>0.1,null,{timeout:30000});
  await page.locator('#prologuePlayer video').evaluate(v=>{v.currentTime=v.duration-0.4;});
  await page.waitForFunction(()=>!document.querySelector('#prologuePlayer'),null,{timeout:15000});
  assert(await page.locator('#pad').isVisible(),'natural end enables controls');
  assert.deepEqual(errors,[],'unexpected movie completion errors');
  console.log('PASS title entrance: native video decode, skip and natural completion, controller toggles');
  await page.close();
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

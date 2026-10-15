// Verify the approved four-direction atlas in the actual game renderer.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/hizuki');
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');
 let data=fs.readFileSync(file);
 if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));
 res.end(data);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  const run=code=>page.evaluate(code=>window.__qaEval(code),code);
  await page.waitForFunction(()=>window.__qaEval&&window.__qaEval('layerReady(HIZUKI_4DIR)&&layerReady(HIZUKI_8DIR)'));
  assert.deepEqual(await run('[HIZUKI_4DIR.naturalWidth,HIZUKI_4DIR.naturalHeight]'),[768,1024]);
  const cells=await run(`(()=>{
   const results=[];
   for(const dir of ['d','u','r','l'])for(let frame=0;frame<3;frame++){
    const c=document.createElement('canvas');c.width=c.height=128;
    const ctx=c.getContext('2d'),draws=[],draw=ctx.drawImage.bind(ctx);
    ctx.drawImage=(...args)=>{draws.push(args.slice(1));draw(...args)};
    hero(ctx,64,90-9*.56,dir,frame,'normal',.56);
    results.push({dir,frame,args:draws[0],height:visibleFrameHeight(HIZUKI_4DIR,frame*256,HIZUKI_4DIR_ROW[dir]*256,256,256)});
   }return results;
  })()`);
  for(const cell of cells){
   assert(cell.height>=231&&cell.height<=234,'nonempty 58px frame '+JSON.stringify(cell));
   assert.equal(cell.args[0],cell.frame*256);
   assert.equal(cell.args[1],({d:0,u:1,r:2,l:3})[cell.dir]*256);
   assert.equal(cell.args[5]+248*(cell.args[7]/256),90,'foot anchor');
  }
  await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;enterWorldPlace("village");');
  await page.waitForFunction(()=>YK_SETTLEMENT.ready()&&YK_LANDSCAPE.ready());
  const before=await run('JSON.stringify(S)');
  await page.selectOption('#heroArtSelect','legacy');
  assert.equal(await run('hizukiArt'),'legacy');assert.equal(await run('JSON.stringify(S)'),before);
  await page.selectOption('#heroArtSelect','bluebob');
  assert.equal(await run('JSON.stringify(S)'),before);
  for(const area of ['village','field']){
   await run(`S.area='${area}';S.x=${area==='village'?768:688};S.y=${area==='village'?1190:2096};S.frame=1;S.dir='d';hud();map();`);
   await page.screenshot({path:path.join(out,area+'.png')});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS 12 frames, directional mapping, 58px scale, projected foot, old/new switch and state preservation');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});

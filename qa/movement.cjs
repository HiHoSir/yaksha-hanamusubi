// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.YK_LANDSCAPE?.ready());
 const run=code=>page.evaluate(code=>window.__qaEval(code),code);
 await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;enterWorldPlace("village");');await page.waitForFunction(()=>YK_SETTLEMENT.ready()&&YK_AUTOTILE.ready());
 for(const area of ['village','field']){
  // Previous field fixture (976,2192) is an unwalkable mountain tile.
  // Find a reachable northbound corridor so this tests held-key movement.
  const fieldStart=area==='field'?await page.evaluate(()=>{
    const W=YK_WORLD,candidates=[];
    for(let ty=10;ty<75;ty++)for(let tx=5;tx<75;tx++){
      const x=tx*32+16,y=ty*32+16;
      if(!W.mapData.travelReachable.has(tx+','+ty))continue;
      let clear=true;
      for(let n=0;n<9;n++){
        if(!W.walkable(x,y-n*32)||!W.canMove(x,y-n*32,x,y-(n+1)*32)){clear=false;break;}
      }
      if(clear)candidates.push({x,y,d:Math.hypot(x-976,y-2192)});
    }
    candidates.sort((a,b)=>a.d-b.d);
    return candidates[0]||null;
  }):null;
  if(area==='field')assert(fieldStart,'No walkable northbound field corridor found');
  const startX=fieldStart?.x??768,startY=fieldStart?.y??1190;
  await run(`state(YK_SAVE.fresh());busy=false;S.area='${area}';S.x=${startX};S.y=${startY};S.encounterGrace=999;hud();`);
  if(fieldStart)console.log('field test start',startX,startY);
  await page.evaluate(()=>{window.__hudWrites=0;window.__hudObserver?.disconnect();window.__hudObserver=new MutationObserver(records=>window.__hudWrites+=records.length);window.__hudObserver.observe(document.getElementById('hud'),{childList:true,subtree:true,characterData:true});});
  await page.keyboard.down('ArrowUp');
  const trace=await page.evaluate(()=>new Promise(resolve=>{const out=[],start=performance.now();function sample(t){out.push(window.__qaEval('({at:performance.now(),y:fieldMotion?fieldMotion.y+(S.y-fieldMotion.y)*Math.min(1,(performance.now()-fieldMotion.at)/144):S.y,moving:!!fieldMotion})'));if(t-start<850)requestAnimationFrame(sample);else resolve(out);}requestAnimationFrame(sample);}));
  await page.keyboard.up('ArrowUp');await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));
  const gaps=trace.slice(1).filter((v,i)=>Math.abs(v.y-trace[i].y)<.01).length;
  const distance=trace[0].y-trace.at(-1).y;
  assert(distance>160&&distance<230,area+' continuous pace '+distance);
  assert(gaps<=Math.max(2,trace.length*.1),area+' idle frames '+gaps+'/'+trace.length);
  assert.equal(await page.evaluate(()=>window.__hudWrites),0,'unchanged HUD is not rebuilt while walking');
  const stopped=await run('S.y');await page.waitForTimeout(250);assert.equal(await run('S.y'),stopped,'release stops queued movement');
  const timing=await run('(()=>{const times=[];for(let i=0;i<12;i++){const t=performance.now();map();times.push(performance.now()-t);}return times.sort((a,b)=>a-b);})()');
  console.log(area+': '+trace.length+' frames, '+gaps+' pauses, '+distance.toFixed(1)+'px / 850ms, median render '+timing[6].toFixed(1)+'ms');
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

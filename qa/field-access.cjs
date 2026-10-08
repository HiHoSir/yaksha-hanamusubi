// Production field: off-center bridge traversal and landmark visibility.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>YK_LANDSCAPE.ready());const run=code=>page.evaluate(code=>window.__qaEval(code),code);
 await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;enterWorldPlace("village");');await page.waitForFunction(()=>YK_SETTLEMENT.ready()&&YK_AUTOTILE.ready());
 await page.waitForFunction(()=>window.__qaEval('Object.values(NPC_ASSETS).length===5&&Object.values(NPC_ASSETS).every(s=>layerReady(s.atlas))'));
 const bridges=await page.evaluate(()=>YK_WORLD.mapData.decorations.filter(o=>['bridge','bridgeNS'].includes(o.kind)));
 await run('S.area="field";S.encounterGrace=99999;busy=false;');
 for(let index=0;index<bridges.length;index++){
  const b=bridges[index],ns=b.kind==='bridgeNS',cx=b.x+b.width/2,cy=ns?b.y+b.height/2:b.y+b.height*.56;
  for(const offset of [-20,0,20]){
   const x=cx+(ns?offset:-96),y=cy+(ns?-96:offset);
   await run(`S.x=${x};S.y=${y};fieldMotion=null;`);
   for(const sign of [1,-1])for(let i=0;i<6;i++){
    await run(`move(${ns?0:sign},${ns?sign:0},"${ns?(sign>0?'d':'u'):(sign>0?'r':'l')}");`);
    await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));
    const position=await run('[S.x,S.y]');assert(Math.abs(position[0]-(x+(ns?0:(sign>0?i+1:5-i)*32)))<.01);assert(Math.abs(position[1]-(y+(ns?(sign>0?i+1:5-i)*32:0)))<.01);
   }
  }
  await run(`S.x=${cx+(ns?0:-64)};S.y=${cy+(ns?64:0)};S.dir="u";map();`);await page.screenshot({path:path.join(out,'field-bridge-'+index+'.png')});
 }
 const guides=await page.evaluate(()=>YK_WORLD.guides);
 for(const g of guides){await run(`S.x=${g.x+32};S.y=${g.y+64};S.dir="u";fieldMotion=null;map();`);assert.equal(await run('nearbyGuide()?.id'),g.id);await page.screenshot({path:path.join(out,'field-guide-'+g.id+'.png')});}
 for(const kind of ['cave','castle']){const o=await page.evaluate(kind=>YK_WORLD.mapData.decorations.find(o=>o.kind===kind),kind);await run(`S.x=${o.x+o.width/2};S.y=${o.foot+32};S.dir="u";map();`);assert(await run('!!nearbyInspectable()'));await page.screenshot({path:path.join(out,'field-'+kind+'.png')});}
 assert.deepEqual(errors,[]);console.log('All 3 field bridges cross both ways at center and ±20px offsets; all 5 guides and scenery approaches accessible');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

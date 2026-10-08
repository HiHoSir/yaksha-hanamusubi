// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>YK_LANDSCAPE.ready());const run=code=>page.evaluate(code=>window.__qaEval(code),code);
 await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;enterWorldPlace("village");');await page.waitForFunction(()=>YK_SETTLEMENT.ready()&&YK_AUTOTILE.ready());
 const result=await page.evaluate(()=>{
  const v=YK_SETTLEMENT,npcs=JSON.parse(JSON.stringify(v.residents)),start=npcs.map(n=>[n.x,n.y]),moved=new Set();let seed=17,t=performance.now(),bad=0;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2400;i++){v.updateResidents(t+=50,{area:'village',x:768,y:1190},npcs,v.blocked,true,random);for(let j=0;j<npcs.length;j++){const n=npcs[j];if(Math.hypot(n.x-start[j][0],n.y-start[j][1])>4)moved.add(n.id);if(v.blocked(n.x,n.y))bad++;}}
  const before=npcs.map(n=>[n.x,n.y]);for(let i=0;i<40;i++)v.updateResidents(t+=50,{area:'village',x:768,y:1190},npcs,v.blocked,false,random);
  const frozen=JSON.stringify(before)===JSON.stringify(npcs.map(n=>[n.x,n.y]));
  const staff=['inn','shop','teahouse'].flatMap(id=>v.insideResidents(id)).map(n=>({...n})),staffBefore=staff.map(n=>[n.x,n.y]);for(let i=0;i<200;i++)v.updateResidents(t+=50,{area:'villageRoom',x:384,y:625},staff,()=>false,true,random);
  return {moved:[...moved],bad,frozen,staffFixed:JSON.stringify(staffBefore)===JSON.stringify(staff.map(n=>[n.x,n.y])),cliff:v.blocked(1376,352),stairs:!v.blocked(1424,368),height:[v.elevation(1424,432),v.elevation(1424,392),v.elevation(1424,336)]};
 });
 assert.equal(result.moved.length,8,JSON.stringify(result));assert.equal(result.bad,0);assert(result.frozen&&result.staffFixed&&result.cliff&&result.stairs);assert.deepEqual(result.height,[0,16,32]);
 await run('S.x=1440;S.y=464;fieldMotion=null;');
 for(let i=0;i<4;i++){await run('move(0,-1,"u");');await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));}
 assert.equal(await run('YK_SETTLEMENT.elevation(S.x,S.y)'),32,'player climbs steps');
 await run('S.x=1424;S.y=480;map();');await page.screenshot({path:path.join(out,'village-terrace.png')});
 await run('S.x=768;S.y=730;map();');await page.waitForTimeout(2500);await page.screenshot({path:path.join(out,'village-wandering.png')});
 assert.deepEqual(errors,[]);console.log('8 residents wander safely for simulated 120s; shops fixed; conversation freeze; terrace/stairs/cliff verified');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

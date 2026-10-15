// Isolated Chromium acceptance: traversal, doors, migration, NPC services and animated river.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/autotile');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');let data=fs.readFileSync(file);if(name==='/js/game.js')data=Buffer.from(data.toString().replace(/\}\)\(\);\s*$/, 'window.__qaEval=code=>eval(code);})();'));res.end(data);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>YK_LANDSCAPE.ready());const run=code=>page.evaluate(code=>window.__qaEval(code),code);
 await run('state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;enterWorldPlace("village");');await page.waitForFunction(()=>YK_SETTLEMENT.ready()&&YK_AUTOTILE.ready());
 await page.waitForFunction(()=>window.__qaEval('Object.values(NPC_ASSETS).length===5&&Object.values(NPC_ASSETS).every(s=>layerReady(s.atlas))'));
 // Real action() path: a lateral NPC must not override the village well inspection.
 const overlap=await run(`(()=>{
  const npc=YK_SETTLEMENT.residents.find(n=>!n.stationary&&!['shop','rest'].includes(n.service));
  const well=YK_SETTLEMENT.well;
  const original={x:npc.x,y:npc.y,frame:npc.frame,dir:npc.dir};
  const previous={x:S.x,y:S.y,dir:S.dir};
  S.x=well.x;S.y=well.y+42;S.dir='u';fieldMotion=null;
  npc.x=S.x+24;npc.y=S.y;
  const target=nearbyInspectable();
  const facing=nearestNPC(100);
  const fired=target?.name==='井戸'&&facing===null?action():false;
  const speaker=$('speaker').textContent;
  const open=$('dialog').classList.contains('show');
  for(let i=0;i<12&&$('dialog').classList.contains('show');i++)nextDialog();
  Object.assign(npc,original);Object.assign(S,previous);
  return {target:target?.name,facing:facing?.name||null,fired,speaker,open};
 })()`);
 assert.equal(overlap.target,'井戸','well must be available to inspect from the test point');
 assert.equal(overlap.facing,null,'lateral NPC must not be selected');
 assert(overlap.fired&&overlap.open&&overlap.speaker==='井戸','A button must inspect the well rather than talk to lateral NPC: '+JSON.stringify(overlap));
 // Opposite case: facing the NPC must start that NPC's conversation, not inspect the well.
 const facingNPC=await run(`(async()=>{
  const npc=YK_SETTLEMENT.residents.find(n=>!n.stationary&&!['shop','rest'].includes(n.service));
  const well=YK_SETTLEMENT.well;
  const original={x:npc.x,y:npc.y,frame:npc.frame,dir:npc.dir};
  const previous={x:S.x,y:S.y,dir:S.dir};
  S.x=well.x;S.y=well.y+42;S.dir='u';fieldMotion=null;
  npc.x=S.x;npc.y=S.y-24;
  const selected=nearestNPC(100);
  const fired=selected===npc?action():false;
  await new Promise(resolve=>setTimeout(resolve,180));
  const speaker=$('speaker').textContent;
  const open=$('dialog').classList.contains('show');
  for(let i=0;i<12&&$('dialog').classList.contains('show');i++)nextDialog();
  Object.assign(npc,original);Object.assign(S,previous);
  return {selected:selected?.name||null,expected:npc.name,fired,speaker,open};
 })()`);
 assert(facingNPC.fired&&facingNPC.open&&facingNPC.speaker===facingNPC.expected,
   'A button must speak to directly faced NPC: '+JSON.stringify(facingNPC));
 // Rear NPC must not intercept A-button inspection of the well.
 const rearNPC=await run(`(()=>{
  const npc=YK_SETTLEMENT.residents.find(n=>!n.stationary&&!['shop','rest'].includes(n.service));
  const well=YK_SETTLEMENT.well;
  const original={x:npc.x,y:npc.y,frame:npc.frame,dir:npc.dir};
  const previous={x:S.x,y:S.y,dir:S.dir};
  S.x=well.x;S.y=well.y+42;S.dir='u';fieldMotion=null;
  npc.x=S.x;npc.y=S.y+24;
  const selected=nearestNPC(100);
  const target=nearbyInspectable();
  const fired=action();
  const speaker=$('speaker').textContent;
  const open=$('dialog').classList.contains('show');
  for(let i=0;i<12&&$('dialog').classList.contains('show');i++)nextDialog();
  Object.assign(npc,original);Object.assign(S,previous);
  return {selected:selected?.name||null,target:target?.name||null,fired,speaker,open};
 })()`);
 assert(rearNPC.selected===null&&rearNPC.target==='井戸'&&rearNPC.fired&&rearNPC.open&&rearNPC.speaker==='井戸',
   'A button must inspect well with NPC behind: '+JSON.stringify(rearNPC));
 const collisionGeometry=await run(`(()=>{
  const npc=YK_SETTLEMENT.residents.find(n=>n.id==='child-square');
  const before={area:S.area,x:S.x,y:S.y,dir:S.dir};
  S.area='village';
  const atCenter=npcBlocked(npc.x,npc.y),right=npcBlocked(npc.x+17,npc.y),left=npcBlocked(npc.x-17,npc.y);
  const origin={x:npc.x-32,y:npc.y};
  S.x=origin.x;S.y=origin.y;S.dir='r';
  const blockedByTerrain=collision(S.x,S.y,true);
  const start=[S.x,S.y];fieldMotion=null;
  move(1,0,'r');
  const after=[S.x,S.y];
  S.x=before.x;S.y=before.y;S.dir=before.dir;S.area=before.area;fieldMotion=null;
  return {atCenter,right,left,start,after,blockedByTerrain};
 })()`);
 console.log('NPC_COLLISION_DIAG '+JSON.stringify(collisionGeometry));
 assert(collisionGeometry.atCenter&&!collisionGeometry.right&&!collisionGeometry.left,'NPC occupancy must be centered on visible foot');
 assert.deepEqual(collisionGeometry.after,collisionGeometry.start,'walking into NPC cell must reject entire move');
 const riverStride=await run(`(()=>{
  const v=YK_SETTLEMENT, samples=[];
  for(const x of [1200,1216,1232,1248,1264,1280,1296,1312,1328,1344,1360]){
   for(const y of [400,448,496,704,752,928]){
    const start={x,y},end={x:x+32,y};
    if(v.blocked(start.x,start.y))continue;
    const hits=Array.from({length:16},(_,i)=>v.blocked(x+(i+1)*2,y));
    if(hits.some(Boolean))samples.push({start,end,firstHit:hits.indexOf(true)});
   }
  }
  return samples;
 })()`);
 assert(riverStride.every(q=>q.firstHit>=0),'riverbank blocked strides must be detectable before movement');
 const solidFootprints=await run(`(()=>{
  const v=YK_SETTLEMENT;
  return {trees:v.trees.map(t=>({x:t.x,y:t.y,blocked:v.objectBlocked(t.x,t.y)})),
    rocks:v.props.filter(p=>p.kind==='rocks').map(p=>({x:p.x,y:p.y,blocked:v.objectBlocked(p.x,p.y)})),
    weaver:v.residents.find(n=>n.id==='weaver'),
    method:typeof v.objectBlocked};
 })()`);
 assert.equal(solidFootprints.method,'function','solid footprint API is available to atomic movement');
 assert(solidFootprints.trees.every(t=>t.blocked),'tree trunks must be solid at visible feet');
 assert(solidFootprints.rocks.every(t=>t.blocked),'rocks must be solid at visible feet');
 assert(solidFootprints.weaver,'weaver NPC remains present');
 assert.deepEqual([solidFootprints.weaver.x,solidFootprints.weaver.y],[992,408],'weaver starts on a shared grid slot clear of the doorway');
 const spawnAlignment=await run('YK_SETTLEMENT.residents.map(n=>({id:n.id,x:n.x,y:n.y,blocked:YK_SETTLEMENT.blocked(n.x,n.y),centered:n.x%32===16&&n.y%32===16}))');
 assert(spawnAlignment.every(n=>!n.blocked),'all adjusted NPC positions must remain walkable: '+JSON.stringify(spawnAlignment));
 const spawnSlots=await run('YK_SETTLEMENT.residents.map(n=>({id:n.id,x:n.x,y:n.y,blocked:YK_SETTLEMENT.blocked(n.x,n.y)}))');
 assert(spawnSlots.every(n=>!n.blocked),'NPC locations must remain traversable: '+JSON.stringify(spawnSlots));
 const blockedStarts=await run('YK_SETTLEMENT.residents.filter(n=>YK_SETTLEMENT.blocked(n.x,n.y)).map(n=>({id:n.id,x:n.x,y:n.y}))');
 assert.deepEqual(blockedStarts,[],'NPC starting locations must be walkable: '+JSON.stringify(blockedStarts));
 const atlasSizes=await run('Object.values(NPC_ASSETS).map(s=>[s.atlas.naturalWidth,s.atlas.naturalHeight])');assert(atlasSizes.every(([w,h])=>w===576&&h===896),'all five NPC atlases loaded');
 const geometry=await page.evaluate(()=>{
  const v=YK_SETTLEMENT,origin={x:768,y:760},dirs=[[32,0],[-32,0],[0,32],[0,-32]];
  const npc=v.residents.map(n=>({
   id:n.id,at:[n.x,n.y],
   offset:[((n.x-origin.x)%32+32)%32,((n.y-origin.y)%32+32)%32],
   available:dirs.filter(([dx,dy])=>Array.from({length:16},(_,k)=>k+1).every(k=>!v.blocked(n.x+dx*k/16,n.y+dy*k/16))).length
  }));
  const slope=[];
  for(const [label,x] of [['westRamp',768],['eastRamp',1176],['outsideRamp',880]]){
   for(let y=480;y<=736;y+=8){
    const start={x,y},endY=y-32, samples=Array.from({length:16},(_,k)=>v.blocked(x,y-(k+1)*2));
    const first=samples.indexOf(true);
    if(first>=0&&first<15&&!v.blocked(x,y))slope.push({label,y,firstBlockedPx:(first+1)*2,height:v.elevation(x,y)});
   }
  }
  return {npc,slope:slope.slice(0,24)};
 });
 console.log('GEOMETRY_DIAG '+JSON.stringify(geometry));
 assert.deepEqual(geometry.npc.find(n=>n.id==='weaver').offset,[0,0],'weaver shares the hero/NPC movement lattice');
 assert.deepEqual(geometry.npc.find(n=>n.id==='chief').at,[736,728],'village chief must stand on central flat road, off the elevated ramp');
 assert(geometry.npc.every(n=>n.available>=2),'NPC placements must retain navigable exits: '+JSON.stringify(geometry.npc));
 const movementGeometry=await run(`(()=>{
  const starts=[[768,1190],[768,1158],[768,760],[768,688],[768,624],[768,560],[1176,688],[1176,624]];
  return starts.map(([x,y])=>{
   const path=Array.from({length:16},(_,k)=>({px:x,py:y-(k+1)*2,blocked:collision(x,y-(k+1)*2,true),npc:npcBlocked(x,y-(k+1)*2)}));
   const to=YK_MOVEMENT.step('village',x,y,0,-1,1,YK_WORLD.size,(a,b)=>collision(a,b,true));
   return {from:[x,y],to:[to.x,to.y],initial:collision(x,y,true),endpoint:collision(x,y-32,true),firstBlock: path.findIndex(p=>p.blocked),firstNPC:path.findIndex(p=>p.npc)};
  });
 })()`);
 console.log('MOVE_GEOMETRY_DIAG '+JSON.stringify(movementGeometry));
 const obstacleGeometry=await run(`(()=>{
  const v=YK_SETTLEMENT,origin={x:768,y:760};
  const lattice=(x,y)=>[((x-origin.x)%32+32)%32,((y-origin.y)%32+32)%32];
  const chief=v.residents.find(n=>n.id==='chief');
  const dirs=[[32,0],[-32,0],[0,32],[0,-32]];
  const exits=(x,y)=>dirs.filter(([dx,dy])=>Array.from({length:16},(_,i)=>i+1).every(i=>!v.blocked(x+dx*i/16,y+dy*i/16))).length;
  const options=[];
  for(let ix=-2;ix<=2;ix++)for(let iy=-2;iy<=2;iy++){
   const x=768+32*(Math.round((chief.x-768)/32)+ix);
   const y=760+32*(Math.round((chief.y-760)/32)+iy);
   const d=Math.hypot(x-chief.x,y-chief.y);
   if(d>80)continue;
   const steps=Math.ceil(d/2),route=Array.from({length:steps},(_,i)=>i+1).every(i=>!v.blocked(chief.x+(x-chief.x)*i/steps,chief.y+(y-chief.y)*i/steps));
   options.push({at:[x,y],d:Math.round(d),blocked:v.blocked(x,y),exits:exits(x,y),route,height:v.elevation(x,y)});
  }
  const objects=[
   ...v.trees.map(t=>({kind:'tree',x:t.x,y:t.y,r:18,visibleWidth:t.w})),
   ...v.props.filter(p=>p.kind!=='fence').map(p=>({kind:p.kind,x:p.x,y:p.y,r:p.r,visibleWidth:p.w}))
  ].map(o=>({kind:o.kind,at:[o.x,o.y],offset:lattice(o.x,o.y),radius:o.r,width:o.visibleWidth,
    blockedAtCenter:v.blocked(o.x,o.y),blockedAt16:v.blocked(o.x+16,o.y),blockedAt32:v.blocked(o.x+32,o.y)}));
  return {chief:{at:[chief.x,chief.y],offset:lattice(chief.x,chief.y),exits:exits(chief.x,chief.y)},options:options.sort((a,b)=>a.d-b.d),objects};
 })()`);
 console.log('OBJECT_GEOMETRY_DIAG '+JSON.stringify(obstacleGeometry));

 const weaverWalk=await page.evaluate(()=>{
  const v=YK_SETTLEMENT,n={...v.residents.find(n=>n.id==='weaver')},home=[n.x,n.y];
  let seed=71,t=performance.now(),moved=false,bad=0,maxStep=0,offGridStops=0,stops=0;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2400;i++){
   const old=[n.x,n.y];v.updateResidents(t+=50,{area:'village',x:768,y:1176},[n],v.blocked,true,rnd);
   const d=Math.hypot(n.x-old[0],n.y-old[1]);maxStep=Math.max(maxStep,d);if(d>0)moved=true;
   if(v.blocked(n.x,n.y)||Math.hypot(n.x-home[0],n.y-home[1])>96.001||v.doors.some(q=>Math.abs(n.x-q.x)<52&&Math.abs(n.y-q.y)<38))bad++;
   if(d===0&&n.frame===1){stops++;if(Math.abs((n.x-768)/32-Math.round((n.x-768)/32))>1e-6||Math.abs((n.y-760)/32-Math.round((n.y-760)/32))>1e-6)offGridStops++;}
  }
  const before=[n.x,n.y];v.updateResidents(t+=50,{area:'village',x:n.x+32,y:n.y},[n],v.blocked,true,rnd);
  const nearbyStopped=n.x===before[0]&&n.y===before[1]&&n.frame===1;
  for(let i=0;i<20;i++)v.updateResidents(t+=50,{area:'village',x:768,y:1176},[n],v.blocked,false,rnd);
  return {moved,bad,maxStep,stops,offGridStops,nearbyStopped,dialogStopped:n.x===before[0]&&n.y===before[1]};
 });
 assert(weaverWalk.moved&&weaverWalk.stops>0,JSON.stringify(weaverWalk));
 assert.equal(weaverWalk.bad,0);assert.equal(weaverWalk.offGridStops,0);
 assert(weaverWalk.maxStep<=1.900001&&weaverWalk.nearbyStopped&&weaverWalk.dialogStopped,JSON.stringify(weaverWalk));
 const result=await page.evaluate(()=>{
  const v=YK_SETTLEMENT,npcs=JSON.parse(JSON.stringify(v.residents)),start=npcs.map(n=>[n.x,n.y]),moved=new Set();let seed=17,t=performance.now(),bad=0,maxNpcFrameStep=0;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2400;i++){const previous=npcs.map(n=>[n.x,n.y]);v.updateResidents(t+=50,{area:'village',x:768,y:1190},npcs,v.blocked,true,random);for(let j=0;j<npcs.length;j++){const n=npcs[j];maxNpcFrameStep=Math.max(maxNpcFrameStep,Math.hypot(n.x-previous[j][0],n.y-previous[j][1]));if(Math.hypot(n.x-start[j][0],n.y-start[j][1])>4)moved.add(n.id);if(v.blocked(n.x,n.y))bad++;}}
  const before=npcs.map(n=>[n.x,n.y]);for(let i=0;i<40;i++)v.updateResidents(t+=50,{area:'village',x:768,y:1190},npcs,v.blocked,false,random);
  const frozen=JSON.stringify(before)===JSON.stringify(npcs.map(n=>[n.x,n.y]));
  const staff=['inn','shop','teahouse'].flatMap(id=>v.insideResidents(id)).map(n=>({...n})),staffBefore=staff.map(n=>[n.x,n.y]);for(let i=0;i<200;i++)v.updateResidents(t+=50,{area:'villageRoom',x:384,y:625},staff,()=>false,true,random);
  return {mobile:npcs.filter(n=>!n.stationary).length,chiefFixed:!moved.has("chief"),moved:[...moved],bad,maxNpcFrameStep,frozen,staffFixed:JSON.stringify(staffBefore)===JSON.stringify(staff.map(n=>[n.x,n.y])),cliff:v.blocked(1376,352),stairs:!v.blocked(1424,368),height:[v.elevation(1424,432),v.elevation(1424,392),v.elevation(1424,336)]};
 });
 assert.equal(result.moved.length,result.mobile,JSON.stringify(result));assert(result.chiefFixed,"stationary chief stays fixed");assert(result.maxNpcFrameStep>0&&result.maxNpcFrameStep<=2.300001,'NPC per-frame movement must stay at or below the child speed cap (46px/s)');assert.equal(result.bad,0);assert(result.frozen&&result.staffFixed&&result.cliff&&result.stairs);assert.deepEqual(result.height,[80,96,112]);
 await run('S.x=1440;S.y=464;fieldMotion=null;');
 for(let i=0;i<4;i++){await run('move(0,-1,"u");');await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));}
 assert.equal(await run('YK_SETTLEMENT.elevation(S.x,S.y)'),112,'player climbs steps');
 const terrain=await page.evaluate(()=>{const v=YK_SETTLEMENT;return {heights:[v.elevation(1000,400),v.elevation(768,624),v.elevation(768,688)],water:[v.waterHeight(1280,400),v.waterHeight(1280,800)],bridge:v.elevation(1280,414),cliff:v.blocked(1000,560),ramp:!v.blocked(768,560)};});
 assert.deepEqual(terrain.heights,[80,40,0]);assert(terrain.cliff&&terrain.ramp);assert.deepEqual(terrain.water,[56,-24]);assert.equal(terrain.bridge,80);
 await run('S.x=768;S.y=720;fieldMotion=null;');
 for(let i=0;i<6;i++){await run('move(0,-1,"u");');await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));}
 assert.equal(await run('YK_SETTLEMENT.elevation(S.x,S.y)'),80,'player climbs north slope');
 await run('S.x=1184;S.y=416;fieldMotion=null;');
 for(let i=0;i<6;i++){await run('move(1,0,"r");');await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));}
 assert.equal(await run('S.x'),1376,'east bridge crosses at raised elevation');assert.equal(await run('YK_SETTLEMENT.elevation(S.x,S.y)'),80);
 for(let i=0;i<6;i++){await run('move(-1,0,"l");');await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));}assert.equal(await run('S.x'),1184,'east bridge returns');
 await run('S.x=768;S.y=976;fieldMotion=null;');for(let i=0;i<6;i++){await run('move(0,1,"d");');await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));}assert.equal(await run('S.y'),1168,'south bridge crosses');
 for(let i=0;i<6;i++){await run('move(0,-1,"u");');await page.waitForFunction(()=>window.__qaEval('!fieldMotion'));}assert.equal(await run('S.y'),976,'south bridge returns');
 await run('S.x=768;S.y=1064;map();');await page.screenshot({path:path.join(out,'village-south-bridge.png')});
 await run('S.x=1280;S.y=414;map();');await page.screenshot({path:path.join(out,'village-east-bridge-center.png')});
 await run('S.x=1190;S.y=414;map();');await page.screenshot({path:path.join(out,'village-bridge-fixed.png')});
 await run('S.x=1190;S.y=760;map();');await page.screenshot({path:path.join(out,'village-waterfall.png')});
 await run('S.x=1190;S.y=650;map();');await page.screenshot({path:path.join(out,'village-spray.png')});
 await run('S.x=768;S.y=750;map();');await page.screenshot({path:path.join(out,'village-slope.png')});
 await run('S.x=1424;S.y=480;map();');await page.screenshot({path:path.join(out,'village-terrace.png')});
 await run('S.x=768;S.y=730;map();');await page.waitForTimeout(2500);await page.screenshot({path:path.join(out,'village-wandering.png')});
 assert.deepEqual(errors,[]);console.log('8 residents wander safely for simulated 120s; shops fixed; conversation freeze; terrace/stairs/cliff verified');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

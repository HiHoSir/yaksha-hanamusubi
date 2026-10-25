const test=require('node:test'),a=require('node:assert/strict'),boot=require('./helpers/hozuki-game-runtime.cjs');
test('four roadside facilities enter on overlap, use current interiors and their own NPCs, heal, save and return',async()=>{
 const b=await boot();try{const w=b.w;
 // The native-Canvas VM exhausts memory on repeated field painting. Field rendering
 // is covered by field-elevation-render and the Chromium acceptance, separately.
 b.eval('YK_LANDSCAPE.drawQuarter=()=>true');
 for(const stop of w.YK_WORLD.restStops){
  b.eval(`document.getElementById('title').classList.remove('show');busy=false;fieldMotion=null;fieldEntryWaiting=false;S.sound=false;S.area='field';S.restStopId=null;S.lastInterior=null;S.x=${stop.point[0]};S.y=${stop.point[1]};S.dir='u';S.encounterGrace=9999;`);
  b.eval('action()');a.equal(w.gameState.area,'field','A at approach must not enter');b.eval("close('commandMenu');move(0,-22,'u')");
  a.equal(w.gameState.area,'field','walking overlap must complete before fade');a(b.eval('fieldEntryWaiting'));
  for(let i=0;i<4;i++)await b.pump(450);
  a.equal(w.gameState.restStopId,stop.id);a.equal(w.YK_INTERIOR_MAPS.kind(w.gameState),stop.type==='inn'?'inn':'teahouse');
  const people=b.eval('areaNPCs()');a.equal(people[0].name,b.eval(`REST_STOP_PROFILES['${stop.id}'].host.name`));a(people.every(n=>n.newNpcId&&n.stationary&&n.x%32===16&&n.y%32===16));
  b.eval("busy=false;S.x=112;S.y=176;S.dir='u';S.hp=1;S.mp=1;action()");await b.pump(150);a(w.document.getElementById('dialog').classList.contains('show'));
  b.eval('while($("dialog").classList.contains("show"))nextDialog()');a.equal(w.gameState.hp,w.gameState.maxhp);a.equal(w.gameState.mp,w.gameState.maxmp);
  b.eval('YK_SAVE.auto(S);restoreState(YK_SAVE.loadAuto(),false)');a.equal(w.gameState.restStopId,stop.id);a(w.YK_INTERIOR_MAPS.ready(w.gameState));
  b.eval(`(()=>{const m=YK_INTERIOR_MAPS.map(S),[x,y]=m.layers.exits[0];for(const [dx,dy,dir]of [[0,-1,'d'],[-1,0,'r'],[1,0,'l'],[0,1,'u']]){const px=(x+dx)*32+16,py=(y+dy)*32+16;if(YK_INTERIOR_MAPS.canStep(S,px,py,x*32+16,y*32+16)){S.x=px;S.y=py;busy=false;fieldMotion=null;move(-dx*22,-dy*22,dir);return;}}throw Error('missing exit approach');})()`);
  for(let i=0;i<4;i++)await b.pump(450);
  a.equal(w.gameState.area,'field');a.equal(w.gameState.restStopId,null);a.deepEqual([w.gameState.x,w.gameState.y],Array.from(stop.point));a(w.YK_WORLD.walkable(w.gameState.x,w.gameState.y));
 }
 a.equal(b.errors.length,0,b.errors.join('\n'));
 }finally{b.close();}
});

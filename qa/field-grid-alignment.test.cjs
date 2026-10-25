const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function world(){const w={console,localStorage:{getItem:()=>null},Date};w.window=w;for(const f of ['field-terrain','elevation-model','field-elevation','world','landscape','movement-rules','data','equipment','save'])vm.runInNewContext(fs.readFileSync('js/'+f+'.js','utf8'),w);return w;}
test('collision index contains exactly the final authored object cells, including four solid jizo',()=>{
 const w=world(),m=w.YK_WORLD.mapData,actual=new Set(m.decorations.flatMap(o=>o.occupiedTiles.map(p=>p.join(','))));
 a.deepEqual([...m.occupiedTiles].sort(),[...actual].sort(),'removed objects must not leave invisible walls');
 for(const g of w.YK_WORLD.guides){const k=[Math.floor(g.x/32),Math.floor(g.y/32)].join(',');a(actual.has(k),'jizo owns its full cell '+k);a(!w.YK_WORLD.walkable(g.x,g.y),'cannot walk through jizo');}
});
test('speed settings keep the same one-cell field stride and blocked strides remain atomic',()=>{
 const w=world(),step=w.YK_MOVEMENT.step;
 for(const speed of [1,1.35,2]){const end=step('field',112,112,1,0,speed,2560,()=>false);a.deepEqual([end.x,end.y],[144,112]);const blocked=step('field',112,112,1,0,speed,2560,x=>x>=140);a.deepEqual([blocked.x,blocked.y],[112,112]);}
 for(const [x,y,dx,dy]of [[16,16,-1,0],[16,16,0,-1],[2544,2544,1,0],[2544,2544,0,1]]){const end=step('field',x,y,dx,dy,1,2560,()=>false);a.equal(end.x%32,16);a.equal(end.y%32,16);}
});
test('old field saves snap to open cell centers and cannot restore inside a jizo',()=>{
 const w=world(),W=w.YK_WORLD,g=W.guides[0],raw={...w.YK_SAVE.fresh(),worldRevision:119,area:'field',x:g.x,y:g.y,worldPosition:[g.x,g.y],gold:4321,quest:2};
 const s=w.YK_SAVE.migrate(raw);a(W.walkable(s.x,s.y));a.equal(s.x%32,16);a.equal(s.y%32,16);a.equal(s.gold,4321);a.equal(s.quest,2);
 const p=W.safePosition([W.start[0]+5.2,W.start[1]-3.6]);a.equal(p[0]%32,16);a.equal(p[1]%32,16);
});
test('the production field centers the approved heroine silhouette on her movement cell',async()=>{
 const boot=require('./helpers/hozuki-game-runtime.cjs'),b=await boot();try{
  const p=b.eval(`(()=>{const originalDraw=YKSpriteOutline.draw,originalQuarter=YK_LANDSCAPE.drawQuarter;let result;try{hizukiArt='sd';S.area='field';S.dir='d';S.frame=1;fieldMotion=null;YKSpriteOutline.draw=(c,im,sx,sy,sw,sh,dx,dy,dw,dh)=>{const bounds=sdFieldBounds(0,0);result={x:dx+(bounds.left+bounds.width/2)*dw/32,y:dy+(bounds.bottom+1-bounds.height/2)*dh/32,height:bounds.height*dh/32};};YK_LANDSCAPE.drawQuarter=(c,m,actor)=>{actor.draw(320,354,1);return true;};map();return result;}finally{YKSpriteOutline.draw=originalDraw;YK_LANDSCAPE.drawQuarter=originalQuarter;}})()`);
  a(p,'production field drew the approved SD atlas');a(Math.abs(p.x-320)<.001);a(Math.abs(p.y-354)<.001,'hero center must match projected cell center');a(Math.abs(p.height-28)<.001,'approved visible scale is preserved');
 }finally{b.close();}
});

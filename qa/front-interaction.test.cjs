const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const c={};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('js/interaction.js','utf8'),c);
 const source=fs.readFileSync('js/game.js','utf8');
 for(const name of ['nearbyInspectable','nearbyGuide','openNearbyChest']){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);vm.runInContext(source.slice(start,end),c);}
 c.S={area:'field',x:112,y:112,dir:'u'};c.targets=[];c.inspectTargets=()=>c.targets;c.clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 c.YK_WORLD={guides:[]};c.YK_SETTLEMENT={elevation:()=>0};c.E={chests:[],open:(_,id)=>{c.opened=id;return {ok:true,text:id};}};c.YK_SAVE={auto:()=>{}};c.message=()=>{};c.map=()=>{};
 return c;
}
test('inspection selects only the facing line in all four directions',()=>{
 for(const [dir,dx,dy] of [['u',0,-1],['d',0,1],['l',-1,0],['r',1,0]]){
  const c=setup();c.S.dir=dir;
  const front={id:'front',x:112+dx*32,y:112+dy*32,w:20,h:20},side={id:'side',x:112+dy*32,y:112+dx*32,w:20,h:20};
  c.targets=[side,front];assert.equal(c.nearbyInspectable()?.id,'front',dir);
  c.targets=[side];assert.equal(c.nearbyInspectable(),null,dir+' side');
  c.targets=[{...front,x:112-dx*32,y:112-dy*32}];assert.equal(c.nearbyInspectable(),null,dir+' back');
 }
});
test('large objects use the facing edge rather than the center or nearest corner',()=>{
 const c=setup();c.targets=[{id:'wide',x:144,y:80,w:96,h:24}];assert.equal(c.nearbyInspectable()?.id,'wide');
 c.targets=[{id:'diagonal',x:144,y:80,w:20,h:20}];assert.equal(c.nearbyInspectable(),null);
 c.targets=[{id:'underfoot',x:112,y:112,w:20,h:20}];assert.equal(c.nearbyInspectable(),null);
});
test('point NPCs outside the forward cell lane cannot intercept inspection',()=>{
 const c=setup(),front={x:112,y:80},oblique={x:132,y:64};
 assert.equal(c.YK_INTERACTION.nearestFacingNPC(c.S,[oblique]),null);
 assert.equal(c.YK_INTERACTION.nearestFacingNPC(c.S,[oblique,front]),front);
});
test('guides and chests cannot activate from the side or behind',()=>{
 const c=setup(),side={id:'side',x:144,y:112},front={id:'front',x:112,y:80};
 c.YK_WORLD.guides=[side];assert.equal(c.nearbyGuide(),null);
 c.YK_WORLD.guides=[side,front];assert.equal(c.nearbyGuide()?.id,'front');
 c.E.chests=[{...side,area:'field'}];assert.equal(c.openNearbyChest(),false);assert.equal(c.opened,undefined);
 c.E.chests.push({...front,area:'field'});assert.equal(c.openNearbyChest(),true);assert.equal(c.opened,'front');
 c.S.dir='d';c.opened=undefined;assert.equal(c.openNearbyChest(),false);assert.equal(c.opened,undefined);
});

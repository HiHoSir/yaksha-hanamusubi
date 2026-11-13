'use strict';
// Runtime-contract test: load modules in exactly the same order as index.html.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),sandbox={Date,Math,console,
 localStorage:{getItem(){return null},setItem(){},removeItem(){}},
 YK_WORLD:{start:[1200,2288],hub:[1200,2288],revision:120,places:{
  village:{point:[1200,2288]},shrine:{point:[1000,1720]},cove:{point:[1450,1350]},
  forest:{point:[1750,850]},waterfall:{point:[1250,500]},fox:{point:[1000,280]}
 },migratePosition:p=>p||[1200,2288],safePosition:p=>p}
};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const f of ['data','equipment','battle-v2-data','battle-balance-engine','battle-v2-live','save']){
 vm.runInContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8'),sandbox,{filename:f+'.js'});
 if(f==='battle-v2-live')sandbox.YK_BATTLE_V2.installEquipment(sandbox.YK_EQUIPMENT);
}
const E=sandbox.YK_EQUIPMENT,B=sandbox.YK_BATTLE_V2,Save=sandbox.YK_SAVE;
const s=Save.migrate(Save.fresh());
assert.equal(s.balanceRevision,2);assert.equal(s.lv,1);
assert.equal(s.maxhp,26);assert.equal(s.maxmp,12);assert.equal(s.atk,9);assert.equal(s.def,6);
assert.equal(E.items.short_blade.atk,20);assert.equal(E.items.cotton_robe.def,9);
assert.equal(E.items.gold_robe.def,39);
assert.equal(E.stock(s).filter(x=>x.tier==='T1').length,4);
assert.equal(E.stock(s).some(x=>x.tier==='T2'),false);
s.gold=500;
assert.equal(E.buy(s,'short_blade'),null);
assert.equal(E.equip(s,'weapon','short_blade'),true);
assert.equal(E.bonus(s,'atk'),20);
assert.equal(E.bonus(s,'def'),0);
s.quest=3;
assert.equal(E.stock(s).some(x=>x.tier==='T4'),true);
assert.equal(E.stock(s).some(x=>x.tier==='T5'),false);
for(const [id,slot] of [['flower_blade','weapon'],['flower_band_v2','head'],['gold_robe','body'],['flower_tabi_v2','feet']]){
 E.grant(s,id);E.equip(s,slot,id);
}
s.lv=18;s.awakening=1;B.refresh(s,true);
assert.equal(s.maxhp,182);assert.equal(s.atk,61);assert.equal(s.def,33);
assert.equal(E.bonus(s,'atk'),88);assert.equal(E.bonus(s,'def'),64);
assert.equal(B.physical(s.atk+E.bonus(s,'atk'),30,()=>.5),67);
assert.equal(B.physical(106,s.def+E.bonus(s,'def'),()=>.5),28);
assert.equal(B.nextHeart(30),7892);
s.xp=B.nextHeart(18);
assert.equal(B.levelUp(s),1);
assert.equal(s.lv,19);assert.equal(s.hp,s.maxhp);assert.equal(s.mp,s.maxmp);
const pair=B.encounter('forest',()=>.75);
assert.equal(pair.enemies.length,2);assert.equal(pair.enemies[0].name,'迷い蜘蛛');
assert.equal(pair.enemies.reduce((n,e)=>n+e.xp,0),476);
const single=B.encounter('forest',()=>0);
assert.equal(single.enemies.length,1);assert.equal(single.enemies[0].name,'木霊');
assert.equal(B.regionFor({...s,area:'field',x:1200,y:2288,quest:5},sandbox.YK_WORLD),'field');
assert.equal(B.regionFor({...s,area:'field',x:1750,y:850,quest:5},sandbox.YK_WORLD),'forest');
assert.equal(B.regionFor({...s,area:'shrine'},sandbox.YK_WORLD),null);
assert.equal(s.equipment.weapon,'flower_blade');
const restored=Save.migrate(JSON.parse(JSON.stringify(s)));
assert.equal(restored.balanceRevision,2);
assert.equal(restored.atk, B.baseStat(restored.lv,restored.awakening).atk);
assert.equal(restored.equipment.weapon,'flower_blade');
console.log('PASS B-v2 live: module order, stats, battle, stores, region, experience, restore');

// Save compatibility regression checks with the real game data and migration code.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const store=new Map();
const localStorage={
 getItem:key=>store.has(key)?store.get(key):null,
 setItem:(key,val)=>store.set(key,String(val)),
 removeItem:key=>store.delete(key)
};
const ctx={localStorage,Date,console};ctx.window=ctx;
for(const file of ['js/data.js','js/equipment.js','js/field-terrain.js','js/world.js','js/save.js','js/game-state.js']){
 vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const save=ctx.YK_SAVE;
// Reference-map revision repairs obstructed field positions without changing progress.
const blocked=ctx.YK_WORLD.mapData.decorations.find(o=>o.occupiedTiles.length).occupiedTiles[0];
const oldField={...save.fresh(),worldRevision:108,area:'field',x:blocked[0]*32+16,y:blocked[1]*32+16,worldPosition:blocked.map(v=>v*32+16),quest:2,gold:321,petals:5};
const repaired=save.migrate(oldField);
assert.notDeepEqual([repaired.x,repaired.y],[oldField.x,oldField.y]);
assert.equal(repaired.worldRevision,112);
assert.equal(repaired.quest,2);assert.equal(repaired.gold,321);assert.equal(repaired.petals,5);
assert.deepEqual(JSON.parse(JSON.stringify(repaired.worldPosition)),[repaired.x,repaired.y]);
for(const worldRevision of [109,110,111]){
 const prior=save.migrate({...oldField,worldRevision});
 assert.deepEqual([prior.x,prior.y],[repaired.x,repaired.y]);
 assert.equal(prior.gold,321);assert.equal(prior.quest,2);
}
const initial=save.fresh();
assert.equal(initial.saveVersion,14);
assert.ok(Array.isArray(initial.worldPosition));
const legacy={...JSON.parse(JSON.stringify(initial)),saveVersion:9,area:'village',villageRevision:1,worldRevision:87,quest:2,petals:7,gold:1234,chests:{opened:true},outfit:'removed-costume'};
const migrated=save.migrate(legacy);
assert.equal(migrated.quest,2);assert.equal(migrated.petals,7);assert.equal(migrated.gold,1234);
assert.equal(migrated.chests.opened,true);
assert.equal(migrated.outfit,'normal');assert.equal(migrated.villageRevision,3);
assert.equal(migrated.saveVersion,14);
assert.equal(migrated.x,768);assert.equal(migrated.y,1190);
assert.equal(migrated.visitedAreas.village,true);
assert.equal(save.saveSlot(2,migrated),true);
assert.ok(store.has('yaksha_beta_auto'));
assert.ok(store.has('yaksha_beta'));
assert.ok(store.has('yaksha_beta_slot2'));
const slot=save.loadSlot(2);
assert.equal(slot.gold,1234);assert.equal(slot.quest,2);assert.equal(slot.petals,7);
assert.equal(save.slotInfo(2).lv,slot.lv);
assert.equal(save.loadAuto().gold,1234);
// Explicitly verify independent manual slots and automatic save updates.
const first=save.fresh();first.gold=111;first.quest=1;
const third=save.fresh();third.gold=333;third.quest=3;
assert.equal(save.saveSlot(1,first),true);
assert.equal(save.saveSlot(3,third),true);
assert.equal(save.loadSlot(1).gold,111);
assert.equal(save.loadSlot(2).gold,1234);
assert.equal(save.loadSlot(3).gold,333);
assert.equal(save.loadAuto().gold,333,'latest manual save updates auto slot');
first.gold=999;
assert.equal(save.loadSlot(1).gold,111,'mutating caller after saving cannot change stored snapshot');
const latest=save.fresh();latest.gold=777;
assert.equal(save.auto(latest),true);
assert.equal(save.loadAuto().gold,777);
assert.equal(save.loadSlot(1).gold,111);
assert.equal(save.loadSlot(2).gold,1234);
assert.equal(save.loadSlot(3).gold,333);
assert.equal(ctx.YK_GAME_STATE.restore(legacy).quest,2);
store.set('yaksha_beta_auto','{broken');
assert.equal(save.loadAuto(),null);
assert.equal(save.loadSlot(1).gold,111,'corrupt autosave must not damage manual slot');
save.reset();
assert.equal(save.loadSlot(2),null);
assert.equal(store.has('yaksha_beta'),false);
console.log('Save migration, persistence, slot isolation and corrupt-data contracts OK');



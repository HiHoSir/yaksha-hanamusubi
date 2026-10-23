const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={};ctx.window=ctx;for(const file of ['data','story-events'])vm.runInNewContext(fs.readFileSync('js/'+file+'.js','utf8'),ctx);
const rules=ctx.YK_STORY_EVENTS,story=ctx.YK_DATA.story;
assert.equal(new Set(story.map(e=>e.id)).size,6,'each event needs a stable distinct ID');
const s={area:'shrine',quest:0,petals:0,destination:'village',storyFlags:{}};
const before=JSON.stringify(s),early=rules.resolve(s,story,'白妙',['海の入り江へ行こう']);
assert.equal(early.kind,'before');assert(!early.lines.join('').includes('海の入り江'));assert.equal(JSON.stringify(s),before,'early talk does not mutate progress');
assert.equal(rules.match(s,story,'白妙'),null);
assert.equal(rules.complete(s,story[1],1,story),false,'cannot complete future event');
for(let i=0;i<story.length;i++){
 const e=story[i];s.area=e.area;
 assert.equal(rules.resolve(s,story,e.speaker,[]).kind,'event');assert.equal(rules.match(s,story,e.speaker),e);
 assert.equal(s.quest,i,'reading has not completed event');assert.equal(s.storyFlags[e.id],undefined);
 if(e.battle){assert.equal(rules.complete(s,e,i,story),false,'boss is required');assert.equal(rules.recordBattleWin(s,story,e.battle),true);assert.equal(rules.recordBattleWin(s,story,e.battle),false);}
 const petals=s.petals;assert.equal(rules.complete(s,e,i,story),true);assert.equal(s.storyFlags[e.id],true);assert.equal(s.quest,i+1);assert.equal(s.petals,petals+(e.petal?1:0));
 assert.equal(rules.complete(s,e,i,story),false,'duplicate callback rejected');assert.equal(s.petals,petals+(e.petal?1:0));assert.equal(rules.resolve(s,story,e.speaker,[]).kind,'after');
}
assert.equal(s.quest,6);assert.equal(s.petals,1);assert.equal(s.destination,null);
const invalid={area:'shrine',quest:1,petals:0,storyFlags:{}};assert.equal(rules.match(invalid,story,'白妙'),null,'quest alone cannot bypass prerequisite flags');
assert.equal(rules.resolve(s,story,'一般の旅人',['こんにちは']).kind,'ordinary');
assert.equal(rules.recordBattleWin({area:'fox',quest:0,storyFlags:{}},story,'kagekyubi'),false,'early boss victory cannot advance story');
for(let quest=0;quest<=6;quest++){
 const old={quest,petals:7,gold:321};rules.restore(old,story,{quest});assert.equal(old.quest,quest);assert.equal(old.petals,7);assert.equal(old.gold,321);
 for(let i=0;i<6;i++)assert.equal(!!old.storyFlags[story[i].id],i<quest,'legacy prefix preserved');
}
const malformed={};rules.restore(malformed,story,{quest:6,storyFlags:{[story[4].id]:true,unknown:true}});assert.equal(malformed.quest,0,'future flag with missing prerequisites is discarded');
console.log('PASS story: all six event phases, prerequisites, read-to-complete, duplicate safety, boss and legacy flags');

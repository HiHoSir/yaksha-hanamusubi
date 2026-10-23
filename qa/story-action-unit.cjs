const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={};env.window=env;for(const file of ['data','story-events'])vm.runInNewContext(fs.readFileSync('js/'+file+'.js','utf8'),env);
let spoken,callback,saved=[],encounters=0,npc;
Object.assign(env,{busy:false,S:{area:'shrine',quest:0,petals:0,storyFlags:{}},D:env.YK_DATA,
 $:()=>({classList:{contains:()=>false,remove(){}}}),guideTalk:()=>false,openNearbyChest:()=>false,villageDoorAction:()=>false,
 YK_INTERIOR_BASE:{area:()=>false},nearestNPC:()=>npc,faceNPC(){},talk(e,after){spoken=e;callback=after;return true},
 openShop(){},beginEncounter(){encounters++;},message(){},YK_SAVE:{auto(s){saved.push(JSON.parse(JSON.stringify(s)))}},
 battleTrace(){},YK_AUDIO:{endEncounterAudio(){}},resetBattleAnimation(){},hud(){},battleLocked:false});
Object.assign(env,{E:{drop:()=>null},performance:{now:()=>0},renderBattle(){},YK_BATTLE_RULES:{grantVictoryBase(){},grantRareLoot:()=>'',applyLevelUps:()=>false,enterResult(){}}});
const game=fs.readFileSync('js/game.js','utf8');
vm.runInNewContext(game.slice(game.indexOf('function action(){'),game.indexOf('function hotChoice(')),env);
vm.runInNewContext(game.slice(game.indexOf('function endBattle(){'),game.indexOf('function defeat(){')),env);
vm.runInNewContext(game.slice(game.indexOf('function win(){'),game.indexOf('function endBattle(){')),env);
const story=env.D.story;
for(let stage=0;stage<=6;stage++)for(let i=0;i<6;i++){
 env.YK_STORY_EVENTS.restore(env.S,story,{quest:stage});env.S.area=story[i].area;npc={name:story[i].speaker,talk:['BAD FUTURE FALLBACK']};
 const before=JSON.stringify(env.S);spoken=null;callback=null;env.action();assert.equal(JSON.stringify(env.S),before,'opening dialogue never completes the event');
 if(i!==stage){assert.equal(callback,null);assert(!spoken.t.includes('BAD FUTURE FALLBACK'),'important NPC must use its phase-specific conversation');}
 else if(!story[i].battle){assert.deepEqual(spoken.t,story[i].lines);assert(callback);callback();assert.equal(env.S.quest,stage+1);const petals=env.S.petals;callback();assert.equal(env.S.petals,petals);}
}
env.YK_STORY_EVENTS.restore(env.S,story,{quest:5});env.S.area='fox';npc={name:story[5].speaker,talk:['fallback']};
encounters=0;env.action();assert(callback);callback();assert.equal(encounters,1);assert.equal(env.S.quest,5);
env.battle={boss:true,name:'影九尾',xp:0,gold:0};saved=[];env.win();
assert.equal(saved[0].storyFlags.kagekyubi_defeated,true,'boss victory must be saved before the final dialogue');assert.equal(env.S.quest,5);
env.endBattle();
const won=JSON.parse(JSON.stringify(saved[0]));env.YK_STORY_EVENTS.restore(env.S,story,won);env.S.area='fox';
encounters=0;env.action();assert.equal(encounters,0);assert.deepEqual(spoken.t,story[5].lines);callback();assert.equal(env.S.quest,6);
env.YK_STORY_EVENTS.restore(env.S,story,{quest:0});env.S.area='fox';env.battle={boss:true};saved=[];env.endBattle();assert.equal(saved.at(-1).storyFlags.kagekyubi_defeated,undefined,'defeat/escape must not record victory');
npc={name:'湯守・お糸',talk:['旅の疲れを癒やしてね']};env.S.area='hotspring';env.action();assert.deepEqual(spoken.t,npc.talk);assert.equal(callback,null);
console.log('PASS main action: 42 stage/NPC combinations, read completion, unchanged ordinary talk, boss save/resume and no premature rewards');

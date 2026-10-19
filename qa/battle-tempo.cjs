// Exercise the production action/render functions with a deterministic clock.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/game.js','utf8');
function scenario({hp=100,trait=null,chance=0,random=0.5,playerHp=100}={}){
 let now=0,id=0,timers=new Map(),enemyAlpha=null;
 const elements=new Map(),element=()=>({style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},textContent:''});
 const canvas=new Proxy({globalAlpha:1,save(){},restore(){this.globalAlpha=1;}},{get:(o,k)=>k in o?o[k]:(()=>{})});
 const c={console,Math:Object.assign(Object.create(Math),{random:()=>random}),performance:{now:()=>now},
  setTimeout(fn,ms){const key=++id;timers.set(key,{fn,at:now+ms});return key;},clearTimeout(key){timers.delete(key)},
  document:{getElementById(key){if(!elements.has(key))elements.set(key,element());return elements.get(key)},querySelector:()=>null,querySelectorAll:()=>[]},
  bg:canvas,layerReady:()=>false,HIZUKI_4DIR:{},HIZUKI_BATTLE_FRAMES:[],HIZUKI_BATTLE_IDLE:{},hero(){},flower(){},
  enemyArt(){enemyAlpha=canvas.globalAlpha},renderBattlePartyCards(){},relicBonus:()=>0,
  YK_AUDIO:{battleSe(){},endEncounterAudio(){}},YK_SAVE:{auto(){}},YK_INPUT:{stopAll(){}},battleTrace(){},hud(){},
  E:{bonus:()=>0,drop:()=>null,items:{}},D:{enemyProfiles:{},rareRules:{repeatDropChance:0},relics:{},areas:{}},
  S:{hp:playerHp,maxhp:100,mp:10,maxmp:10,lv:1,atk:20,def:0,potions:2,wins:0,xp:0,gold:0,rareWins:{},relics:{}},
  battle:{name:'敵',baseName:'敵',hp,max:hp,atk:10,xp:1,gold:1,rareTrait:trait,rareTraitChance:chance,menu:'target',targetFrom:'attack',turn:1},
  battleLocked:false,battleCursor:0,battlePose:'idle',battleFx:null,busy:true};
 c.window=c;c.matchMedia=()=>({matches:false});c.$=key=>c.document.getElementById(key);
 vm.createContext(c);vm.runInContext(fs.readFileSync('js/battle-rules.js','utf8'),c);
 vm.runInContext('const battleTimers=new Set();\n'+source.match(/function resetBattleAnimation\(\)\{[^\n]+/)[0]+'\n'+source.match(/function battleLater\(fn,ms\)\{[^\n]+/)[0],c);
 vm.runInContext(source.slice(source.indexOf('function renderBattle(){'),source.indexOf('function renderRelics(){')),c);
 function until(time){while(true){const next=[...timers].filter(([,t])=>t.at<=time).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=time;}
 return {c,until,draw(){enemyAlpha=null;c.renderBattle();return enemyAlpha},text:()=>c.$('battleText').textContent};
}
{
 const {c,until,draw,text}=scenario();c.cmd('target-0');
 assert.equal(c.battle.hp,100);assert.match(text(),/緋月の攻撃/);
 until(599);assert.equal(c.battle.hp,100);until(600);assert.equal(c.battle.hp,76);assert.equal(c.battleFx.amount,24);
 until(1000);assert.ok(c.battleFx,'damage stays visible well after impact');assert.equal(c.S.hp,100);
 until(1850);assert.match(text(),/敵の攻撃/);assert.equal(c.S.hp,100);
 until(2299);assert.equal(c.S.hp,100);until(2300);assert.equal(c.S.hp,88);
 until(3549);assert.equal(c.battleLocked,true);until(3550);assert.equal(c.battleLocked,false);assert.equal(c.battle.turn,2);assert.equal(draw(),1);
}
for(const trait of [null,'shellGuard']){
 const {c,until,draw}=scenario({hp:1,trait,chance:1});c.cmd('target-0');
 until(599);assert.equal(draw(),1);until(600);assert.equal(c.battle.hp,0);assert.equal(draw(),1);
 until(1099);assert.equal(draw(),1);until(1325);assert.ok(Math.abs(draw()-.5)<.001);
 until(1360);assert.equal(c.battleFx,null);assert.ok(draw()>0,'fade survives effect teardown');
 until(1550);assert.equal(draw(),null);assert.equal(c.S.wins,0);
 until(1850);assert.equal(c.S.wins,1);assert.equal(c.battle.phase,'result');assert.equal(c.S.hp,100);
 c.win();assert.equal(c.S.wins,1);c.cmd('finish');assert.ok(c.battle,'result lock prevents accidental dismissal');
 until(2950);c.cmd('finish');assert.equal(c.battle,null);
}
{
 const {c,until}=scenario({trait:'leafDodge',chance:1});c.cmd('target-0');until(600);assert.equal(c.battle.hp,100);until(3550);assert.equal(c.battleLocked,false);
}
for(const command of ['heal','herb','guard','escape']){
 const {c,until}=scenario({playerHp:50,random:.99});c.cmd(command);until(2950);assert.equal(c.battleLocked,false,command+' finishes');assert.equal(c.battle.turn,2);
}
{
 const {c,until}=scenario({playerHp:1});c.cmd('guard');until(2950);assert.equal(c.battle,null,'lethal enemy hit resolves after readable hold');
}
{
 const {c,until}=scenario();c.cmd('target-0');c.endBattle();until(5000);assert.equal(c.S.hp,100);assert.equal(c.S.wins,0,'cancelled battle timers do not award victory');
}
console.log('Battle tempo PASS: contact timing, damage hold, enemy wind-up, complete death fade, guarded lethal, dodge, heal/item/guard/escape, defeat, result and timer cancellation');

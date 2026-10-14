// Pure battle arithmetic, independent from sprites, windows, timers and saving.
window.YK_BATTLE_RULES=(()=>{
 function allyDamage(kind,level,attack,bonus,random=Math.random){
  return kind==="skill"?20+level*3+bonus+Math.floor(random()*12):attack+bonus+Math.floor(random()*8);
 }
 function shellDamage(amount){return Math.max(1,Math.ceil(amount*.35));}
 function foeDamage(attack,defense,variance,foxfire,guarding,random=Math.random){
  const base=Math.max(1,attack-Math.floor(defense/2)+Math.floor(random()*variance));
  const raw=foxfire?Math.ceil(base*1.35):base;
  return guarding?Math.max(1,Math.ceil(raw/2)):raw;
 }
 function validateCommand(command,state){
  const cost=command==='bloom'?4:command==='heal'?3:0;
  if(state.mp<cost)return {ok:false,cost,message:'技が足りない！'};
  if((command==='heal'||command==='herb')&&state.hp>=state.maxhp)return {ok:false,cost,message:'体は満ちている。'};
  if(command==='herb'&&state.potions<=0)return {ok:false,cost,message:'薬草を持っていない。'};
  return {ok:true,cost,action:command==='bloom'?'skill':command==='herb'?'item':command};
 }
 function nextTurn(battle){
  battle.turn++;
  return battle.turn;
 }
 function enterResult(battle,now,delay=400){
  battle.phase='result';
  battle.readyAt=now+delay;
  return battle.readyAt;
 }
 function grantVictoryBase(state,battle){
  state.wins++;
  state.xp+=battle.xp;
  state.gold+=battle.gold;
 }
 function applyLevelUps(state){
  const previous=state.lv;
  while(state.xp>=state.lv*40){
   state.xp-=state.lv*40;state.lv++;state.maxhp+=12;state.hp=state.maxhp;
   state.maxmp+=2;state.mp=state.maxmp;state.atk+=3;state.def++;
  }
  return state.lv>previous;
 }
 function grantRareLoot(state,battle,rareRules,relics,random=Math.random){
  if(!battle.rareId)return '';
  const id=battle.rareId,first=!state.rareWins[id];
  state.rareWins[id]=(state.rareWins[id]||0)+1;
  if(first||random()<rareRules.repeatDropChance){
   state.relics[id]=(state.relics[id]||0)+1;
   return ' ／ '+relics[id].name+'を入手！';
  }
  return '';
 }
 // Runtime-only party projection. Never writes to legacy save/player state.
 function partyMember(source,id){
  return {id:String(id),name:String(source.name||id),hp:source.hp,maxhp:source.maxhp,
   mp:source.mp,maxmp:source.maxmp,action:null,guarding:false,active:source.hp>0};
 }
 function partyView(leader,companions=[]){
  const members=[partyMember(leader,'leader')];
  const seen=new Set(['leader']);
  for(const companion of companions){
   if(members.length>=4)break;
   if(!companion||companion.id==null)continue;
   const id=String(companion.id);
   if(seen.has(id))continue;
   seen.add(id);
   members.push(partyMember(companion,id));
  }
  return members;
 }
 function eligibleActors(members){return members.filter(member=>member.active&&member.hp>0);}
 // Deterministic planning only; the existing single-hero turn loop is unchanged.
 function reserveAction(members,actorId,action){
  const actor=members.find(m=>m.id===actorId);
  if(!actor||!actor.active||actor.hp<=0)return false;
  actor.action={...action};
  return true;
 }
 function actionOrder(members){
  // Stable party-position order until speed/initiative is defined.
  return eligibleActors(members).filter(m=>m.action!==null).map(m=>({id:m.id,action:{...m.action}}));
 }
 function clearActions(members){for(const member of members)member.action=null;}
 // Immutable action queue snapshot: executing a turn never mutates the plan.
 function turnQueue(members){return {steps:actionOrder(members),index:0};}
 function nextPlannedAction(queue){
  if(queue.index>=queue.steps.length)return null;
  const step=queue.steps[queue.index++];
  return {id:step.id,action:{...step.action}};
 }
 function remainingActions(queue){return Math.max(0,queue.steps.length-queue.index);}
 // Action intent: a UI-independent command that an executor can interpret later.
 // Does not apply damage, heal, consume MP, or mutate actors.
 function describeAction(step,members,targets=[]){
  if(!step||!step.action)return {ok:false,reason:'missing-action'};
  const actor=members.find(m=>m.id===step.id);
  if(!actor||!actor.active||actor.hp<=0)return {ok:false,reason:'actor-unavailable'};
  const type=step.action.type;
  if(!['attack','skill','heal','item','guard'].includes(type))return {ok:false,reason:'unsupported-action'};
  const targetId=step.action.target;
  if(type==='attack'||type==='skill'){
   const target=targets.find(t=>t.id===targetId&&t.hp>0);
   if(!target)return {ok:false,reason:'target-unavailable'};
  }
  return {ok:true,actorId:actor.id,type,targetId:targetId??null};
 }
 // Isolated executor for future party battles; caller owns timing, rendering, and persistence.
 function executeAction(step,members,targets=[],options={}){
  const intent=describeAction(step,members,targets);
  if(!intent.ok)return intent;
  const actor=members.find(m=>m.id===intent.actorId);
  const target=targets.find(t=>t.id===intent.targetId);
  if(intent.type==='attack'||intent.type==='skill'){
   const amount=allyDamage(intent.type,options.level??1,options.attack??0,options.bonus??0,options.random??Math.random);
   target.hp=Math.max(0,target.hp-amount);
   return {...intent,amount,remainingHp:target.hp};
  }
  if(intent.type==='heal'||intent.type==='item'){
   const recipient=members.find(m=>m.id===(intent.targetId??intent.actorId));
   if(!recipient)return {ok:false,reason:'target-unavailable'};
   const amount=Math.min(Math.max(0,recipient.maxhp-recipient.hp),Math.max(0,options.healAmount??0));
   recipient.hp+=amount;
   recipient.active=recipient.hp>0;
   return {...intent,targetId:recipient.id,amount,remainingHp:recipient.hp};
  }
  actor.guarding=true;
  return {...intent,amount:0};
 }
 // Run one planned ally step at a time; enemy actions remain owned by a later engine.
 function createTurn(members){return {phase:'allies',queue:turnQueue(members),results:[]};}
 function advanceTurn(turn,members,targets=[],optionsForActor=()=>({})){
  if(turn.phase!=='allies')return {phase:turn.phase,finished:true};
  const step=nextPlannedAction(turn.queue);
  if(!step){turn.phase='enemies';return {phase:'enemies',finished:true};}
  const result=executeAction(step,members,targets,optionsForActor(step.id,step.action));
  turn.results.push(result);
  if(remainingActions(turn.queue)===0)turn.phase='enemies';
  return {phase:turn.phase,finished:turn.phase==='enemies',result};
 }
 return {allyDamage,shellDamage,foeDamage,validateCommand,nextTurn,enterResult,grantVictoryBase,applyLevelUps,grantRareLoot,partyView,eligibleActors,reserveAction,actionOrder,clearActions,turnQueue,nextPlannedAction,remainingActions,describeAction,executeAction,createTurn,advanceTurn};
})();

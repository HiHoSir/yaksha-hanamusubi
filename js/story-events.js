// Story event rules only. UI presentation and persistence belong to the caller.
window.YK_STORY_EVENTS=(()=>{
 const done=(state,id)=>state.storyFlags?.[id]===true;
 const battleFlag=id=>id+'_defeated';
 function eligible(state,story,event,stage){
  return !!event&&state.quest===stage&&!done(state,event.id)&&
   story.slice(0,stage).every(e=>done(state,e.id))&&event.requires.every(id=>done(state,id));
 }
 function restore(state,story,raw=state){
  const hasFlags=Object.hasOwn(raw,'storyFlags');
  const source=raw.storyFlags&&typeof raw.storyFlags==='object'&&!Array.isArray(raw.storyFlags)?raw.storyFlags:{};
  const legacy=Math.max(0,Math.min(story.length,Math.floor(Number(raw.quest)||0)));
  const flags={};let stage=0;
  for(const [i,event] of story.entries()){
   if(!event.requires.every(id=>flags[id]===true))break;
   if(event.battle&&((!hasFlags&&i<legacy)||source[battleFlag(event.battle)]===true))flags[battleFlag(event.battle)]=true;
   if(!(hasFlags?source[event.id]===true:i<legacy)||(event.battle&&!flags[battleFlag(event.battle)]))break;
   flags[event.id]=true;stage++;
  }
  state.storyFlags=flags;state.quest=stage;state.destination=story[stage]?.area||null;
  return state;
 }
 function match(state,story,speaker){
  const event=story?.[state.quest];
  return eligible(state,story,event,state.quest)&&event.area===state.area&&event.speaker===speaker?event:null;
 }
 function resolve(state,story,speaker,fallback){
  const event=story.find(e=>e.area===state.area&&e.speaker===speaker);
  if(!event)return {kind:'ordinary',event:null,lines:fallback};
  if(done(state,event.id))return {kind:'after',event,lines:event.after};
  if(match(state,story,speaker))return {kind:'event',event,lines:event.lines};
  return {kind:'before',event,lines:event.before};
 }
 function complete(state,event,stage,story){
  if(story?.[stage]!==event||state.area!==event.area||!eligible(state,story,event,stage))return false;
  if(event.battle&&!done(state,battleFlag(event.battle)))return false;
  state.storyFlags[event.id]=true;
  state.quest=stage+1;
  if(event.petal)state.petals++;
  state.destination=event.target;
  return true;
 }
 function recordBattleWin(state,story,battleId){
  const event=story[state.quest],key=battleFlag(battleId);
  if(!eligible(state,story,event,state.quest)||event.area!==state.area||event.battle!==battleId||done(state,key))return false;
  state.storyFlags[key]=true;return true;
 }
 return {restore,match,resolve,complete,recordBattleWin,battleFlag};
})();

// Story event rules only. UI presentation and persistence belong to the caller.
window.YK_STORY_EVENTS=(()=>{
 function match(state,story,speaker){
  const event=story?.[state.quest];
  return event&&event.area===state.area&&event.speaker===speaker?event:null;
 }
 function complete(state,event,stage){
  if(state.quest!==stage)return false;
  state.quest=stage+1;
  if(event.petal)state.petals++;
  state.destination=event.target;
  return true;
 }
 return {match,complete};
})();

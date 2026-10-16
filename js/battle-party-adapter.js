// Battle party adapter v1. Does not mutate saved game state.
// UI and rules can consume the returned snapshot without depending on save schema.
(function(root){
 "use strict";
 const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
 const number=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 function normalize(unit,id){
  if(!unit||typeof unit!=="object")throw new TypeError("Invalid battle actor");
  const maxhp=Math.max(1,Math.floor(number(unit.maxhp,unit.hp??1)));
  const maxmp=Math.max(0,Math.floor(number(unit.maxmp,unit.mp??0)));
  const hp=clamp(Math.floor(number(unit.hp,maxhp)),0,maxhp);
  const mp=clamp(Math.floor(number(unit.mp,maxmp)),0,maxmp);
  return {
   id:String(id),name:String(unit.name??id),
   hp,maxhp,mp,maxmp,
   atk:Math.max(0,Math.floor(number(unit.atk,1))),
   def:Math.max(0,Math.floor(number(unit.def,0))),
   speed:Math.max(0,Math.floor(number(unit.speed,10))),
   level:Math.max(1,Math.floor(number(unit.lv,unit.level??1))),
   statuses:{...(unit.statuses||{})},active:hp>0,guarding:false,action:null
  };
 }
 function fromGameState(state,companions=[]){
  if(!state||typeof state!=="object")throw new TypeError("Game state required");
  const party=[normalize({...state,name:state.name||"緋月"},"leader")];
  const ids=new Set(["leader"]);
  for(const member of companions){
   if(party.length===4)break;
   if(!member||member.id==null)continue;
   const id=String(member.id);
   if(ids.has(id))continue;
   ids.add(id);party.push(normalize(member,id));
  }
  return party;
 }
 function toResults(party){
  return party.map(actor=>({id:actor.id,hp:actor.hp,mp:actor.mp,statuses:{...actor.statuses}}));
 }
 // Validate the whole result before returning a patch; never assign to live game state.
 function leaderPatch(state,results){
  const leader=results.find(x=>x.id==="leader");
  if(!leader)throw new Error("Leader result missing");
  const maxhp=Math.max(1,number(state.maxhp,1));
  const maxmp=Math.max(0,number(state.maxmp,0));
  if(!Number.isFinite(leader.hp)||!Number.isFinite(leader.mp))throw new TypeError("Invalid battle result");
  return {hp:clamp(Math.floor(leader.hp),0,maxhp),mp:clamp(Math.floor(leader.mp),0,maxmp)};
 }
 root.YK_BATTLE_PARTY_ADAPTER=Object.freeze({normalize,fromGameState,toResults,leaderPatch});
})(typeof window!=="undefined"?window:globalThis);

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
 return {allyDamage,shellDamage,foeDamage,validateCommand};
})();

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
 return {allyDamage,shellDamage,foeDamage};
})();

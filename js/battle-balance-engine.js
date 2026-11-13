// B式v2: pure combat model for mobile balance QA. Does not change live game/save data.
(function(root){
'use strict';
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function valid(d){if(!d||!d.confirmed||!d.proposals||d.state!=='PROPOSAL_NOT_APPROVED_NOT_RUNTIME')throw Error('暫定v2データを読み込めません');return d;}
function tier(data,id){const t=valid(data).proposals.tiers.find(x=>x.id===id);if(!t)throw Error('装備段階が見つかりません: '+id);return t;}
function hero(data,dan=1,tierId='T0',awakening=0){
 const c=valid(data).confirmed,b=c.baseline.dan1,g=c.baseline.growth;
 dan=clamp(Math.floor(dan),1,c.maxDan);awakening=clamp(Math.floor(awakening),0,2);
 const t=tier(data,tierId),n=dan-1,stats={
  dan,tier:tierId,awakening,
  maxhp:b.hp+g.hp*n,maxmp:Math.round(b.mp+g.mp*n),
  atk:Math.round(b.atk+g.atk*n)+t.weaponAtk,
  def:Math.round(b.def+g.def*n)+t.armorDef,
  speed:Math.round(b.speed+g.speed*n)
 };
 for(let i=0;i<awakening;i++){const a=c.awakening[i];for(const [key,value] of Object.entries(a)){if(typeof value==='number'&&key in stats)stats[key]+=value;}}
 return {...stats,hp:stats.maxhp,mp:stats.maxmp,xp:0,gold:0};
}
function damage(atk,def,random=Math.random){
 const a=Math.max(0,Number(atk)||0),d=Math.max(0,Number(def)||0);
 const base=Math.floor(a/2-d/4),variance=1+(clamp(Number(random()),0,1)-.5)/8;
 return Math.max(1,Math.floor(a*.1),Math.floor(base*variance));
}
function expNeeded(dan){return Math.round(80*Math.pow(clamp(Math.floor(dan),1,99),1.35));}
function encounter(data,regionId,choiceIndex=0,options={}){
 valid(data);
 const region=data.proposals.regions.find(x=>x.id===regionId);
 if(!region)throw Error('未定義の地域: '+regionId);
 const choice=region.choices[clamp(choiceIndex|0,0,region.choices.length-1)];
 const e=data.proposals.enemies.find(x=>x.id===choice.enemyId);
 if(!e||e.spawnClass==='boss')throw Error('出現できない敵');
 return {
  regionId,regionName:region.name,dan:region.dan,
  enemies:Array.from({length:choice.count},(_,i)=>({
   id:e.id+'_'+i,baseId:e.id,name:e.name,hp:e.hp,maxhp:e.hp,
   atk:e.atk,def:e.def,speed:e.speed,exp:e.exp||0
  })),
  turn:1,phase:'active',log:[], ...options
 };
}
function fight(data,player,group,action,random=Math.random){
 if(group.phase!=='active')return {type:group.phase,player,group,events:[]};
 const events=[];
 const alive=()=>group.enemies.filter(e=>e.hp>0);
 if(action.type==='attack'){
  const target=alive().find(e=>e.id===action.targetId)||alive()[0];
  if(!target)return {type:'victory',player,group,events};
  const amount=damage(player.atk,target.def,random);
  target.hp=Math.max(0,target.hp-amount);events.push({type:'attack',target:target.name,amount});
 }else if(action.type==='guard'){
  events.push({type:'guard'});
 }else if(action.type==='heal'){
  if(player.mp<5)return {type:'invalid',reason:'技が足りません',events,player,group};
  if(player.hp>=player.maxhp)return {type:'invalid',reason:'体力は満タンです',events,player,group};
  const amount=Math.min(player.maxhp-player.hp,Math.ceil(player.maxhp*.3));
  player.mp-=5;player.hp+=amount;events.push({type:'heal',amount});
 }else return {type:'invalid',reason:'不明な行動',events,player,group};
 if(alive().length===0){
  group.phase='victory';
  const xp=group.enemies.reduce((s,e)=>s+e.exp,0);player.xp+=xp;events.push({type:'victory',exp:xp});
  let gained=0;
  while(player.dan<data.confirmed.maxDan&&player.xp>=expNeeded(player.dan)){
   player.xp-=expNeeded(player.dan);player.dan++;
   const next=hero(data,player.dan,player.tier,player.awakening);
   for(const key of ['maxhp','maxmp','atk','def','speed'])player[key]=next[key];
   player.hp=player.maxhp;player.mp=player.maxmp;gained++;
  }
  if(gained)events.push({type:'levelup',count:gained,dan:player.dan});
  return {type:'victory',player,group,events};
 }
 for(const enemy of alive()){
  const raw=damage(enemy.atk,player.def,random);
  const amount=action.type==='guard'?Math.max(1,Math.floor(raw/2)):raw;
  player.hp=Math.max(0,player.hp-amount);
  events.push({type:'enemy',target:enemy.name,amount});
  if(player.hp===0)break;
 }
 if(player.hp===0){group.phase='defeat';const lost=Math.floor(player.gold*.25);player.gold-=lost;events.push({type:'defeat',goldLost:lost});return {type:'defeat',player,group,events};}
 group.turn++;return {type:'active',player,group,events};
}
root.YK_BALANCE_ENGINE=Object.freeze({valid,tier,hero,damage,expNeeded,encounter,fight});
})(typeof window==='undefined'?globalThis:window);

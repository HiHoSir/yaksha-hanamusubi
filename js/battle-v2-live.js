// B式v2 main-game adapter. Active game uses the approved heroine growth and provisional encounter/item tables.
window.YK_BATTLE_V2=(()=>{
'use strict';
const data=window.YK_BATTLE_V2_DATA,engine=window.YK_BALANCE_ENGINE;
if(!data||!engine)throw Error('B式v2の実行データが読み込めません');
const a=data.confirmed,proposals=data.proposals;
const tierIds=[
 ['flower_staff','cloth_band','plain_robe','plain_sandals'],
 ['short_blade','red_band','cotton_robe','rabbit_tabi'],
 ['iron_blade','iron_band','plum_robe','deer_tabi'],
 ['moon_blade','silver_band','cherry_robe','lion_tabi'],
 ['flower_blade','flower_band_v2','gold_robe','flower_tabi_v2'],
 ['water_blade_v2','water_comb_v2','water_robe_v2','water_tabi_v2'],
 ['fox_blade_v2','fox_comb_v2','fox_robe_v2','fox_tabi_v2'],
 ['night_blade_v2','star_pin_v2','star_robe_v2','night_tabi_v2'],
 ['dawn_blade_v2','dawn_pin_v2','dawn_robe_v2','dawn_tabi_v2']
];
const names={
 flower_band_v2:'花紋のはちがね',flower_tabi_v2:'花守りの足袋',
 water_blade_v2:'水鏡の刀',water_comb_v2:'水鏡の櫛',water_robe_v2:'滝衣',water_tabi_v2:'水紋の足袋',
 fox_blade_v2:'九尾の小太刀',fox_comb_v2:'宵狐の櫛',fox_robe_v2:'宵花の小袖',fox_tabi_v2:'狐尾の足袋',
 night_blade_v2:'夜桜の刀',star_pin_v2:'星綴りの簪',star_robe_v2:'星織りの衣',night_tabi_v2:'夜桜の足袋',
 dawn_blade_v2:'暁花の刀',dawn_pin_v2:'暁の髪飾り',dawn_robe_v2:'花霞の衣',dawn_tabi_v2:'暁の足袋'
};
const tierQuest=[0,0,1,2,3,4,5,7,8]; // T7/T8 have no current sales destination.
const slots=['weapon','head','body','feet'],priceWeights=[.45,.13,.30,.12];
function installEquipment(E){
 const items=E.items;
 for(const [n,ids] of tierIds.entries()){
  const tier=proposals.tiers[n],amounts=[tier.weaponAtk,tier.headDef,tier.bodyDef,tier.feetDef];
  const prices=[0,0,0,0];
  if(tier.salePrice!=null){
   for(let k=0;k<3;k++)prices[k]=Math.round(tier.salePrice*priceWeights[k]);
   prices[3]=tier.salePrice-prices[0]-prices[1]-prices[2];
  }
  for(let j=0;j<4;j++){
   const id=ids[j],slot=slots[j],stat=slot==='weapon'?'atk':'def';
   const original=items[id];
   const item=original||{id,name:names[id],slot};
   item[stat]=amounts[j];item.tier=tier.id;item.saleQuest=tierQuest[n];
   item.price=n===0?0:prices[j];item.quest=tierQuest[n];
   item.source=n===0?'初期装備':n>=7?'未実装の地域': '鬼灯村・兵具屋';
   items[id]=item;
  }
 }
 // Keep alternate staffs, chests, and rare drops usable without replacing named items.
 const alternates={
  bamboo_staff:[10,0,0],plum_staff:[34,1,2],silver_staff:[60,3,4],gold_staff:[124,5,6],
  tide_staff:[32,0,0],love_staff:[130,0,0],foxfire_blade:[125,0,0],
  moon_comb:[0,5,0],leaf_comb:[0,10,0],silk_robe:[0,32,0],love_robe:[0,60,0],
  love_tabi:[0,16,0],tide_tabi:[0,5,0]
 };
 for(const [id,[atk,def]] of Object.entries(alternates)){
  if(!items[id])continue;
  if(items[id].slot==='weapon')items[id].atk=atk;
  else items[id].def=def;
 }
 // Old alternative/rare drops are kept as discovered equipment, not legacy shop tiers.
 E.stock=(s)=>Object.values(items).filter(i=>i.tier&&i.tier!=='T0'&&i.saleQuest<=Math.min(6,Math.max(0,s.quest||0))&&i.price>0);
 E.buy=(s,id)=>{
  const item=items[id];
  if(!item||!E.stock(s).some(x=>x.id===id))return 'この品はこの店では扱っていません。';
  if(s.gold<item.price)return 'お金が足りません。';
  if(!E.grant(s,id))return 'これ以上持てません。';
  s.gold-=item.price;return null;
 };
 E.summary=i=>Object.entries({atk:'攻撃',def:'守備',skill:'術',heal:'薬草回復',escape:'逃走率'})
  .filter(([k])=>i[k]).map(([k,v])=>v+'+'+i[k]+(k==='escape'?'%':'')).join(' ／ ')||'基本の旅支度';
 E.drops['灯火狐']={id:'plum_staff',chance:.08};
}
function baseStat(dan,awakening=0){
 dan=Math.max(1,Math.min(99,Math.floor(Number(dan)||1)));
 const b=a.baseline.dan1,g=a.baseline.growth,n=dan-1;
 const stats={lv:dan,maxhp:b.hp+g.hp*n,maxmp:Math.round(b.mp+g.mp*n),
  atk:Math.round(b.atk+g.atk*n),def:Math.round(b.def+g.def*n),speed:Math.round(b.speed+g.speed*n)};
 for(let i=0;i<Math.min(2,Math.max(0,awakening));i++){
  const w=a.awakening[i];stats.maxhp+=w.hp||0;stats.atk+=w.atk||0;stats.def+=w.def||0;stats.speed+=w.speed||0;
 }
 return stats;
}
function refresh(s,heal=false){
 const base=baseStat(s.lv,s.awakening);
 for(const [k,v] of Object.entries(base))s[k]=v;
 s.hp=heal||!Number.isFinite(s.hp)?s.maxhp:Math.max(0,Math.min(s.maxhp,Math.round(s.hp)));
 s.mp=heal||!Number.isFinite(s.mp)?s.maxmp:Math.max(0,Math.min(s.maxmp,Math.round(s.mp)));
 s.balanceRevision=2;return s;
}
function nextHeart(dan){return engine.expNeeded(dan)}
function levelUp(s){
 let count=0;
 while(s.lv<99&&s.xp>=nextHeart(s.lv)){
  s.xp-=nextHeart(s.lv);s.lv++;refresh(s,true);count++;
 }
 return count;
}
function physical(atk,def,random=Math.random){return engine.damage(atk,def,random)}
function regionFor(s,world){
 const area=s.area;
 const direct={cove:'cove',forest:'forest',waterfall:'waterfall_approach',fox:'fox_shrine'};
 if(direct[area])return direct[area];
 if(area!=='field')return null; // shrine and village are safe scenes.
 const p=world?.places||{},sites=[
  ['field','village'],['shrine_approach','shrine'],['cove','cove'],
  ['forest','forest'],['waterfall_approach','waterfall'],['fox_shrine','fox']
 ];
 const candidates=sites.map(([region,id],index)=>{
  const point=p[id]?.point;return {region,index,d:point?Math.hypot(s.x-point[0],s.y-point[1]):Infinity};
 }).filter(x=>Number.isFinite(x.d));
 if(!candidates.length)return 'field';
 candidates.sort((x,y)=>x.d-y.d);
 const nearest=candidates[0];
 const cap=Math.max(0,Math.min(5,(s.quest||0)+1));
 if(nearest.index>cap)return sites[cap][0];
 return nearest.region;
}
const goldPerRegion={field:12,shrine_approach:18,cove:38,forest:86,waterfall_approach:135,fox_shrine:180,late_a:215,late_b:305,late_c:340};
function encounter(region,random=Math.random){
 const descriptor=proposals.regions.find(r=>r.id===region);
 if(!descriptor||!descriptor.choices.length)return null;
 const index=Math.min(descriptor.choices.length-1,Math.floor(random()*descriptor.choices.length));
 const choice=descriptor.choices[index],template=proposals.enemies.find(e=>e.id===choice.enemyId);
 if(!template)return null;
 const baseGold=goldPerRegion[region]||12;
 const perEnemyGold=Math.round(baseGold*(choice.count>1?.55:.85));
 const enemies=Array.from({length:choice.count},(_,i)=>({
  id:template.id+'-'+i,baseId:template.id,name:template.name,baseName:template.name,
  hp:template.hp,max:template.hp,maxhp:template.hp,atk:template.atk,def:template.def,speed:template.speed,
  xp:template.exp||0,gold:perEnemyGold,rareId:null,rareTrait:null,rareTraitChance:0
 }));
 return {region,enemies,display:template.name,choice:index};
}
function skillDamage(dan,skillBonus=0){return Math.max(1,30+skillBonus);}
return Object.freeze({data,installEquipment,baseStat,refresh,nextHeart,levelUp,physical,regionFor,encounter,skillDamage,tierIds});
})();

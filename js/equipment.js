// Equipment affects abilities only. Appearance is an independent bonus choice.
window.YK_EQUIPMENT=(()=>{
'use strict';
const slots={weapon:'武器',head:'頭',body:'胴',feet:'足'};
const items={};
function add(id,name,slot,stats,price,quest,source){items[id]={id,name,slot,...stats,price,quest,source};}
add('flower_staff','花守りの杖','weapon',{atk:0},0,0,'初期装備');
add('bamboo_staff','竹の杖','weapon',{atk:2,skill:1},35,0,'鬼灯の里・兵具屋');
add('short_blade','わきざし','weapon',{atk:4},65,0,'鬼灯の里・兵具屋');
add('plum_staff','梅の杖','weapon',{atk:4,skill:3},110,2,'兵具屋・社の用事を終えた後');
add('iron_blade','くろがねの刀','weapon',{atk:7},160,2,'兵具屋・社の用事を終えた後');
add('silver_staff','銀の杖','weapon',{atk:7,skill:5},240,4,'兵具屋・森の用事を終えた後');
add('moon_blade','月影の刀','weapon',{atk:10},310,4,'兵具屋・森の用事を終えた後');
add('gold_staff','金の杖','weapon',{atk:10,skill:7},420,6,'兵具屋・九尾の祠の用事を終えた後');
add('flower_blade','花霞の刀','weapon',{atk:13},490,6,'兵具屋・九尾の祠の用事を終えた後');
add('tide_staff','潮音の杖','weapon',{atk:3,skill:4},null,0,'海の入り江のつづら');
add('love_staff','愛結びの杖','weapon',{atk:9,skill:9},null,5,'九尾の祠のつづら');
add('foxfire_blade','狐火の小太刀','weapon',{atk:8,skill:2},null,0,'妖狐・影九尾の落とし物');
add('cloth_band','布のはちまき','head',{def:0},0,0,'初期装備');
add('red_band','紅のはちまき','head',{def:1},25,0,'鬼灯の里・兵具屋');
add('iron_band','はちがね','head',{def:2},90,2,'兵具屋・社の用事を終えた後');
add('silver_band','白銀のはちがね','head',{def:3},190,4,'兵具屋・森の用事を終えた後');
add('moon_comb','月読の櫛','head',{def:2,skill:3},null,0,'天妖の社のつづら');
add('leaf_comb','若葉のかんざし','head',{def:1,heal:6},null,0,'木霊の落とし物');
add('plain_robe','旅の小袖','body',{def:0},0,0,'初期装備');
add('cotton_robe','木綿の小袖','body',{def:2},45,0,'鬼灯の里・兵具屋');
add('plum_robe','梅の振袖','body',{def:4},130,2,'兵具屋・社の用事を終えた後');
add('cherry_robe','桜の振袖','body',{def:6},270,4,'兵具屋・森の用事を終えた後');
add('gold_robe','金糸の振袖','body',{def:8},450,6,'兵具屋・九尾の祠の用事を終えた後');
add('silk_robe','木霊の絹衣','body',{def:5,heal:3},null,0,'忘れの森のつづら');
add('love_robe','愛結びの十二単','body',{def:7,skill:3},null,6,'九尾の祠の奥のつづら');
add('plain_sandals','わらじ','feet',{def:0},0,0,'初期装備');
add('rabbit_tabi','うさぎの足袋','feet',{def:1,escape:5},30,0,'鬼灯の里・兵具屋');
add('deer_tabi','しかの足袋','feet',{def:2,escape:8},110,2,'兵具屋・社の用事を終えた後');
add('lion_tabi','ししの足袋','feet',{def:3,escape:10},210,4,'兵具屋・森の用事を終えた後');
add('love_tabi','愛結びの足袋','feet',{def:3,escape:15},null,0,'龍神の滝のつづら');
add('tide_tabi','潮風の足袋','feet',{def:1,escape:12},null,0,'磯妖・泡くらげの落とし物');
const starters={weapon:'flower_staff',head:'cloth_band',body:'plain_robe',feet:'plain_sandals'};
const chests=[
 {id:'equip-shrine',area:'shrine',x:330,y:530,item:'moon_comb',quest:0},
 {id:'equip-cove',area:'cove',x:320,y:590,item:'tide_staff',quest:0},
 {id:'equip-forest',area:'forest',x:360,y:510,item:'silk_robe',quest:0},
 {id:'equip-waterfall',area:'waterfall',x:650,y:430,item:'love_tabi',quest:0},
 {id:'equip-fox-staff',area:'fox',x:360,y:530,item:'love_staff',quest:5},
 {id:'equip-fox-robe',area:'fox',x:630,y:500,item:'love_robe',quest:6}
];
const drops={
 '野の小鬼':{id:'red_band',chance:.10},'化け狸':{id:'rabbit_tabi',chance:.10},
 '灯火狐':{id:'plum_staff',chance:.08},'磯妖':{id:'tide_tabi',chance:.12},
 '泡くらげ':{id:'tide_tabi',chance:.12},'木霊':{id:'leaf_comb',chance:.14},
 '迷い蜘蛛':{id:'silk_robe',chance:.08},'水蛇':{id:'silver_band',chance:.10},
 '滝童':{id:'lion_tabi',chance:.10},'妖狐':{id:'foxfire_blade',chance:.12},
 '影九尾':{id:'foxfire_blade',chance:.20}
};
function fresh(){return {equipmentRevision:1,equipment:{...starters},equipmentInventory:Object.fromEntries(Object.values(starters).map(id=>[id,1]))};}
function migrate(s,raw){
 const inv={};for(const id of Object.keys(items)){const n=Number(raw?.equipmentInventory?.[id]);if(Number.isFinite(n)&&n>0)inv[id]=Math.min(99,Math.floor(n));}
 const eq={};
 for(const [slot,starter] of Object.entries(starters)){
  if(!raw?.equipmentRevision){inv[starter]=Math.max(1,inv[starter]||0);eq[slot]=starter;}
  else{const id=raw?.equipment?.[slot];eq[slot]=items[id]?.slot===slot&&inv[id]?id:null;}
 }
 s.equipmentRevision=1;s.equipmentInventory=inv;s.equipment=eq;
 s.weapon=items[eq.weapon]?.name||'素手';return s;
}
function bonus(s,stat){return Object.entries(s.equipment||{}).reduce((sum,[slot,id])=>sum+(items[id]?.slot===slot&&s.equipmentInventory?.[id]?items[id][stat]||0:0),0);}
function grant(s,id){if(!Object.hasOwn(items,id))return false;const n=s.equipmentInventory[id]||0;if(n>=99)return false;s.equipmentInventory[id]=n+1;return true;}
function equip(s,slot,id){if(!Object.hasOwn(slots,slot)||id!==null&&(!Object.hasOwn(items,id)||items[id].slot!==slot||!s.equipmentInventory[id]))return false;s.equipment[slot]=id;s.weapon=items[s.equipment.weapon]?.name||'素手';return true;}
function stock(s){return Object.values(items).filter(i=>i.price>0&&s.quest>=i.quest);}
function buy(s,id){const i=items[id];if(!i||!stock(s).some(x=>x.id===id))return 'この品はまだ入荷していません。';if(s.gold<i.price)return 'お金が足りません。';if(!grant(s,id))return 'これ以上持てません。';s.gold-=i.price;return null;}
function sell(s,id){const i=items[id];if(!i||!(s.equipmentInventory[id]>0))return '持っていません。';if(i.price==null||i.price===0)return '大切な品なので売れません。';const reserved=Object.values(s.equipment).includes(id)?1:0;if(s.equipmentInventory[id]<=reserved)return '装備中の最後の1つは売れません。';s.equipmentInventory[id]--;s.gold+=Math.floor(i.price/2);return null;}
function open(s,id){const c=chests.find(c=>c.id===id&&c.area===s.area);if(!c||Math.hypot(s.x-c.x,s.y-c.y)>65)return {ok:false,text:'つづらに近づいてください。'};
 if(s.chests[id])return {ok:false,text:'つづらは空っぽだ。'};
 if(s.quest<c.quest)return {ok:false,text:'結びの封がかかっている。旅の手がかりを進めよう。'};
 if(!grant(s,c.item))return {ok:false,text:'持ち物がいっぱいだ。'};
 s.chests[id]=true;return {ok:true,text:items[c.item].name+'を手に入れた！ つよさ → 装備で身につけよう。'};
}
function drop(s,enemy,random=Math.random){const d=drops[enemy];return d&&random()<d.chance&&grant(s,d.id)?d.id:null;}
function summary(i){return Object.entries({atk:'攻撃',def:'守備',skill:'花結び',heal:'薬草回復',escape:'逃走率'}).filter(([k])=>i[k]).map(([k,n])=>`${n}+${i[k]}${k==='escape'?'%':''}`).join(' ／ ')||'基本の旅支度';}
return {slots,items,starters,chests,drops,fresh,migrate,bonus,grant,equip,stock,buy,sell,open,drop,summary};
})();

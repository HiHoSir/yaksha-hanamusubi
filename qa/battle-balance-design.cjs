'use strict';
// Design-only QA: never alters saves, game state, map data, or UI.
const fs=require('node:fs');
const path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/battle/balance-v2-draft.json'),'utf8'));
const evaluate=function evaluate(d){
  const issues=[],warnings=[];
  const check=(v,msg)=>{if(!v)issues.push(msg)};
  check(d.state==="PROPOSAL_NOT_APPROVED_NOT_RUNTIME","status marked runtime or approved");
  check(d.confirmed.formula==="floor(atk/2 - defense/4)","not B formula");
  const tiers=d.proposals.tiers, enemies=d.proposals.enemies, region=d.proposals.regions;
  const t=id=>tiers.find(x=>x.id===id);
  const m=id=>enemies.find(x=>x.id===id);
  check(tiers.length===9,"missing tier");
  check(enemies.length===14,"missing enemy");
  for(const x of tiers){
    check(x.headDef+x.bodyDef+x.feetDef===x.armorDef,"armor split mismatch: "+x.id);
    if(x.salePrice!=null)check(x.salePrice/x.expectedGoldPerFight>=15&&x.salePrice/x.expectedGoldPerFight<=20,"money pace: "+x.id);
  }
  for(const [i,atk,def] of [[0,0,0],[1,20,14],[2,42,30],[3,64,46],[4,88,64],[5,114,84],[6,140,104],[7,166,124],[8,192,144]]){
    check(tiers[i].weaponAtk===atk && tiers[i].armorDef===def,"tier bonus wrong: "+i);
  }
  for(const x of region){
    for(const c of x.choices){
      const e=m(c.enemyId);check(!!e,"unresolved enemy: "+c.enemyId);
      if(e) check(c.count>0&&c.count<=2&&(e.spawnClass==="pair"||c.count===1)&&e.spawnClass!=="boss","invalid encounter: "+c.enemyId+"×"+c.count);
    }
  }
  const hero=(dan,tier,awakeningCount)=>{
    const base=d.confirmed.baseline, b=base.dan1,g=base.growth;
    const n=dan-1;const h={hp:b.hp+g.hp*n,mp:Math.floor(b.mp+g.mp*n+.5),atk:Math.floor(b.atk+g.atk*n+.5)+t(tier).weaponAtk,def:Math.floor(b.def+g.def*n+.5)+t(tier).armorDef,speed:b.speed+g.speed*n};
    for(const a of d.confirmed.awakening.slice(0,awakeningCount)){h.hp+=a.hp||0;h.atk+=a.atk||0;h.def+=a.def||0;h.speed+=a.speed||0}
    return h;
  };
  const damage=(a,b)=>Math.max(1,Math.floor(a/2-b/4));
  const combats=[];
  for(const [enemyId,tier,awakenings] of [
    ["oni_field","T0",0],["tanuki_field","T0",0],["lantern_fox","T1",0],["iso_you","T2",1],["foam_jelly","T2",1],["kodama","T4",1],["spider","T4",1],["snake","T5",2],["takiwarashi","T5",2],["kitsune","T6",2],["late_a","T7",2],["late_b","T8",2],["late_c","T8",2]]){
    const e=m(enemyId),h=hero(e.dan,tier,awakenings),dealt=damage(h.atk,e.def),taken=damage(e.atk,h.def);
    const turns=Math.ceil(e.hp/dealt),pct=Math.round(taken*1000/h.hp)/10;
    combats.push({enemy:e.name,dan:e.dan,tier,hp:h.hp,dealt,taken,turns,pct,spawn:e.spawnClass});
    if(e.spawnClass==="single"&&e.dan<=30)check(turns>=3&&turns<=4,"solo turns: "+e.name+" "+turns);
    if(e.spawnClass==="pair"&&e.dan<=30)check(turns===2,"pair turns: "+e.name+" "+turns);
    if(e.spawnClass==="pair"&&e.dan<=30)check(pct>=6&&pct<=9,"pair damage: "+e.name+" "+pct);
    if(e.spawnClass==="single"&&e.dan<=30)check(pct>=11&&pct<=19,"single damage: "+e.name+" "+pct);
  }
  // Verify anchor benchmark including story-awakening bonuses: baseline B-v2 gives 63 and 102, +8 atk makes 67 and 106.
  check(damage(hero(18,"T4",1).atk,m("kodama").def)===67,"dan18 awakened damage");
  check(damage(hero(30,"T6",2).atk,m("kitsune").def)===106,"dan30 awakened damage");
  check(damage(hero(18,"T3",1).atk,m("kodama").def)===55,"dan18 one tier down");
  check(damage(hero(30,"T5",2).atk,m("kitsune").def)===93,"dan30 one tier down");
  warnings.push("T3/T4 sales gates overlap and require actual route/shop checks");
  warnings.push("Late tier damage/turns lack awakening3 bonus, and armor-update value is smaller than early upgrades");
  warnings.push("No live battle code, save migration, or Pages QA included in design-only data");
  return {issues,warnings,combats,pass:issues.length===0};
};
const result=evaluate(data);
for(const row of result.combats) console.log(`${row.enemy} | 段${row.dan} ${row.tier} | ${row.turns}発撃破 | 被ダメ${row.taken} (${row.pct}%)`);
for(const warning of result.warnings) console.warn('WARN: '+warning);
if(!result.pass){for(const issue of result.issues) console.error('FAIL: '+issue);process.exitCode=1;}
else console.log('PASS: B式v2暫定データの基本整合チェック');

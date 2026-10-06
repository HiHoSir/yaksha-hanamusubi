window.YK_SAVE=(()=>{
const AUTO="yaksha_beta_auto", LEGACY="yaksha_beta", VER=11;
const fresh=()=>({saveVersion:VER,villageRevision:2,relics:{},rareWins:{},equippedRelic:null,x:230,y:534,worldRevision:5,worldPosition:[230,534],visitedAreas:{field:true},destination:"village",dir:"d",frame:0,area:"field",hp:100,maxhp:100,lv:1,xp:0,gold:30,potions:2,petals:0,outfit:"normal",walk:0,quest:0,boss:false,atk:14,def:4,charm:false,weapon:"花守りの剣",chests:{},sound:true,playtime:0,battles:0,wins:0,encounterSteps:0,encounterGrace:0,teaVisits:0,lastSave:Date.now()});
function migrate(raw){
 const s=Object.assign(fresh(),raw||{});
 if(!YK_DATA.areas[s.area])s.area="field";
 if(!YK_DATA.outfits[s.outfit])s.outfit="normal";
 s.maxhp=Math.max(1,Number(s.maxhp)||100);
 s.hp=Math.max(1,Math.min(Number(s.hp)||100,s.maxhp));
 s.x=Number.isFinite(Number(s.x))?Number(s.x):384;s.y=Number.isFinite(Number(s.y))?Number(s.y):500;
 if(s.lastInterior!=="teahouse"&&s.lastInterior!=="osumiHome")s.lastInterior=null;
 if((s.area==="teahouse"||s.area==="osumiHome")&&(!Number.isFinite(Number(s.x))||!Number.isFinite(Number(s.y)))){s.x=384;s.y=650;}
 // Keep migration data-only. Field collision validation is performed by game.js after restore,
 // avoiding world/canvas work inside the synchronous localStorage Continue path.
 if(raw?.villageRevision!==2&&s.area==="village"){s.x=373;s.y=690;}
 s.villageRevision=2;
 s.worldRevision=YK_WORLD.revision;
 s.worldPosition=Array.isArray(s.worldPosition)&&Number.isFinite(Number(s.worldPosition[0]))&&Number.isFinite(Number(s.worldPosition[1]))?[Number(s.worldPosition[0]),Number(s.worldPosition[1])]:YK_WORLD.hub.slice();
 s.visitedAreas={...(s.visitedAreas||{}),field:true,[s.area]:true};
 if(!YK_WORLD.places[s.destination])s.destination=null;
 s.quest=Math.max(0,Math.min(YK_DATA.story.length,Math.floor(Number(s.quest)||0)));
 const cleanCounts=value=>Object.fromEntries(Object.keys(YK_DATA.relics).filter(k=>Number.isFinite(value?.[k])&&value[k]>0).map(k=>[k,Math.min(999999,Math.floor(value[k]))]));
 s.relics=cleanCounts(s.relics);s.rareWins=cleanCounts(s.rareWins);
 if(!Object.hasOwn(YK_DATA.relics,s.equippedRelic)||!s.relics[s.equippedRelic])s.equippedRelic=null;
 s.saveVersion=VER;s.encounterSteps=Number(s.encounterSteps)||0;s.encounterGrace=Number(s.encounterGrace)||0;s.teaVisits=Number(s.teaVisits)||0;
 return s;
}
function loadAuto(){try{const raw=localStorage.getItem(AUTO)||localStorage.getItem(LEGACY);return raw?migrate(JSON.parse(raw)):null}catch(e){return null}}
function auto(s){try{s.lastSave=Date.now();localStorage.setItem(AUTO,JSON.stringify(s));localStorage.setItem(LEGACY,JSON.stringify(s));return true}catch(e){return false}}
function saveSlot(n,s){try{s.lastSave=Date.now();localStorage.setItem("yaksha_beta_slot"+n,JSON.stringify(s));auto(s);return true}catch(e){return false}}
function loadSlot(n){try{const r=localStorage.getItem("yaksha_beta_slot"+n);return r?migrate(JSON.parse(r)):null}catch(e){return null}}
function slotInfo(n){const s=loadSlot(n);return s?{lv:s.lv,area:(YK_DATA.areas[s.area]||{}).name||s.area,time:s.lastSave}:null}
function reset(){[AUTO,LEGACY,"yaksha_beta_slot1","yaksha_beta_slot2","yaksha_beta_slot3"].forEach(k=>localStorage.removeItem(k))}
return {fresh,migrate,loadAuto,auto,saveSlot,loadSlot,slotInfo,reset};
})();
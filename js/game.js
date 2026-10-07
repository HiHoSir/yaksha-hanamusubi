// beta15.28: registered walking garments and dedicated battle poses
(()=>{
"use strict";
const $=id=>document.getElementById(id),C=$("game"),g=C.getContext("2d"),BC=$("battleCanvas"),bg=BC.getContext("2d"),WC=$("worldCanvas"),wg=WC.getContext("2d");
window.gameState=YK_SAVE.fresh();let S=window.gameState,busy=true,battle=null,battleCursor=0,battleLocked=false,dialogQueue=[],dialogAfter=null,msgTimer=0,last=performance.now();
let debugMotion=null;
let walkPhase=0,lastMoved=-Infinity,assetDrawQueued=false,hotBathing=false;
function assetLoaded(){
 if(assetDrawQueued)return;assetDrawQueued=true;
 requestAnimationFrame(()=>{assetDrawQueued=false;
  if($("title").classList.contains("show"))titleHero();
  if($("hotSpring").classList.contains("show"))renderHotSpring();
  if($("dialog").classList.contains("show"))renderDialogPortrait();
  if(battle)renderBattle();else hud();
  if($("worldMap").classList.contains("show"))drawWorld();
 });
}

const ASSET_PATHS={
 field:"assets/maps/field.png",village:"assets/maps/village.png",shrine:"assets/maps/shrine.png",
 cove:"assets/maps/cove.png",forest:"assets/maps/forest.png",waterfall:"assets/maps/waterfall.png",fox:"assets/maps/fox.png",hotspring:"assets/maps/hotspring.png",
 heroNormal:null,heroLight:null,
 heroSwimWhite:null,heroSwimNavy:null,
 heroYukata:null,heroDemon:null,
 npcSheet:null,hotScene:null,
 enemySheet:null,battle:null,
 world:null
};
const IMG={}; for(const [k,v] of Object.entries(ASSET_PATHS)){if(!v)continue;const im=new Image();im.onload=assetLoaded;im.src=v;IMG[k]=im}

// Production village background layers. Files are optional: until a finished PNG exists,
// the matching procedural fallback is drawn. This prevents placeholder art from silently
// becoming the final asset while allowing one layer at a time to be replaced.
const VILLAGE_LAYER_PATHS={
 ground:"assets/tiles/village-ground.png",
 buildings:"assets/buildings/village-buildings.png",
 nature:null,
 objects:null
};
const villageComposite=new Image();
villageComposite.onload=assetLoaded;
villageComposite.src="assets/maps/village-v15.30.png";
const VILLAGE_LAYERS={};
for(const [k,v] of Object.entries(VILLAGE_LAYER_PATHS)){
 if(!v)continue;
 const im=new Image(); im.onload=assetLoaded;im.src=v; VILLAGE_LAYERS[k]=im;
}
function layerReady(im){return !!(im&&im.complete&&im.naturalWidth&&im.naturalHeight)}
function drawFullLayer(c,im){if(!layerReady(im))return false;c.drawImage(im,0,0,768,768);return true}
const B9={
 village:"assets/maps/village.png",forest:"assets/maps/forest.png",
 battle:"assets/scenes/battle.png",
 hot:"assets/scenes/hotspring.png",dialogue:"assets/scenes/dialogue.png",
 title:"assets/ui/title-yashahime.png",outfits:"assets/ui/outfits.png"
};
const B9IMG={};
const NPC_ASSET_ROOT="assets/characters/npc";
// β15.26: only directions with independently verified 3-frame high-resolution sets animate.
// Other directions use their neutral frame; rejected generation outputs are never loaded.
const NPC_MOTION_DIRECTIONS={
 elder:new Set(["r","l","d","u"]),
 teagirl:new Set(["r","l","d","u"]),
 osumi:new Set(["r","l","d","u"]),
 satoko:new Set(["r","l","d","u"]),
 merchant:new Set(["r","l","d","u"])
};
const NPC_ART_QUALITY={
 elder:{r:"independent-3frame",l:"mirrored-3frame",d:"position-only",u:"position-only"},
 teagirl:{r:"independent-3frame",l:"mirrored-3frame",d:"position-only",u:"position-only"},
 osumi:{r:"position-only",l:"position-only",d:"position-only",u:"position-only"},
 satoko:{r:"position-only",l:"position-only",d:"position-only",u:"position-only"},
 merchant:{r:"position-only",l:"position-only",d:"position-only",u:"position-only"}
};
// d/u currently use safe position-only provisional motion; r/l use full 3-frame art.

window.YKNpcArtQuality=(type=null)=>{
 if(type)return NPC_ART_QUALITY[type]||null;
 return JSON.parse(JSON.stringify(NPC_ART_QUALITY));
};
const NPC_ASSET_TYPES={
 child:"satoko",
 merchant:"merchant",
 woman:"osumi",
 teagirl:"teagirl",
 elder:"elder"
};
const NPC_ASSETS={};
function loadNpcAssetSet(){
 for(const [type,folder] of Object.entries(NPC_ASSET_TYPES)){
   const set={frames:{}};
   set.frontMaster=new Image();
   set.frontMaster.src=`${NPC_ASSET_ROOT}/${folder}/front-1.png`;
   for(const [dir,fileDir] of Object.entries({d:"front",u:"back",l:"left",r:"right"})){
     set.frames[dir]=[];
     for(let i=0;i<3;i++){
       const im=new Image();
       im.src=`${NPC_ASSET_ROOT}/${folder}/${fileDir}-${i}.png`;
       set.frames[dir].push(im);
     }
   }
   NPC_ASSETS[type]=set;
 }
}
let npcAssetsLoaded=false;
function ensureNpcAssets(){if(npcAssetsLoaded)return;npcAssetsLoaded=true;loadNpcAssetSet();}
for(const [k,v] of Object.entries(B9)){const im=new Image();im.onload=assetLoaded;im.src=v;B9IMG[k]=im}
const OUTFIT_READY={normal:true,basewear:true,light:true,white:true,navy:true,yukata:true,demon:true};
const HERO_FOLDERS={normal:"normal-v9",basewear:"basewear",light:"light-v9",white:"white-v9",navy:"navy-v9",yukata:"yukata-v9",demon:"demon-v9"};
const BATTLE_SPRITES={};
let battlePose="idle",battleFx=null;
const battleTimers=new Set();
function resetBattleAnimation(){for(const id of battleTimers)clearTimeout(id);battleTimers.clear();battlePose="idle";battleFx=null;}
function battleLater(fn,ms){const owner=battle;const id=setTimeout(()=>{battleTimers.delete(id);if(battle&&battle===owner)fn();},ms);battleTimers.add(id);}
for(const outfit of ["normal","light","white","navy","yukata","demon"]){
 BATTLE_SPRITES[outfit]={};
 for(const pose of ["attack","hit"]){const im=new Image();im.onload=assetLoaded;im.datasetSrc=`assets/characters/yashahime/battle-v9/${outfit}-${pose}.png`;BATTLE_SPRITES[outfit][pose]=im;}
}
const LAYERED_SPRITES={};
for(const [outfit,folder] of Object.entries(HERO_FOLDERS)){
 const set=LAYERED_SPRITES[outfit]={};
 for(const [dir,prefix] of Object.entries({d:"front",u:"back",l:"left",r:"right"})){
  set[dir]=["right-leg-up","neutral","left-leg-up"].map(phase=>{
   const im=new Image();im.onload=assetLoaded;
   im.src=`assets/characters/yashahime/${folder}/${prefix}-${phase}.png`;return im;
  });
 }
}
const NPC_ROLES=["woman","teagirl","man","child","elder","merchant","ferryman","miko","guard","traveler","hotkeeper","crow"];
const B9NPC={};
NPC_ROLES.forEach(n=>{
  B9NPC[n]={legacy:null,frames:{}};
  const legacy=new Image(); legacy.src=`assets/characters/npc/${n}.png`; B9NPC[n].legacy=legacy;
  ["down","left","right","up"].forEach(d=>{
    B9NPC[n].frames[d]=[];
    for(let i=0;i<3;i++){
      // This archive has standalone legacy art, not legacy directional sheets.
      // The independently verified directional sets are loaded by loadNpcAssetSet().
      B9NPC[n].frames[d].push(null);
    }
  });
});
const B9EN={};["redoni","crowtengu","umibozu","ninefox","yokai_flower"].forEach(n=>{const im=new Image();im.onload=assetLoaded;im.datasetSrc=`assets/enemies/${n}.png`;B9EN[n]=im});
const ENEMY_ART={};["field-oni","field-tanuki"].forEach(n=>{const im=new Image();im.onload=assetLoaded;im.datasetSrc=`assets/enemies/standard/${n}.png`;ENEMY_ART[n]=im});
const RARE_ART={};
for(const r of Object.values(YK_DATA.rareKinds)){if(!r.art)continue;RARE_ART[r.id]={};for(const state of ["intact","worn"]){const im=new Image();im.onload=assetLoaded;im.datasetSrc=`assets/enemies/variants/${r.art}${state==="worn"?"-worn":""}.png`;RARE_ART[r.id][state]=im;}}
function ensureImage(im){if(im&&!im.src&&im.datasetSrc)im.src=im.datasetSrc;return im}
function ensureBattleAssets(){
 const set=BATTLE_SPRITES[S.outfit]||BATTLE_SPRITES.normal;if(set)for(const im of Object.values(set))ensureImage(im);
 for(const im of Object.values(B9EN))ensureImage(im);
 for(const im of Object.values(ENEMY_ART))ensureImage(im);
 for(const set of Object.values(RARE_ART))for(const im of Object.values(set))ensureImage(im);
}
function rareReady(r){if(r){ensureImage(RARE_ART[r.id]?.intact);ensureImage(RARE_ART[r.id]?.worn)}return !!r&&layerReady(RARE_ART[r.id]?.intact)&&layerReady(RARE_ART[r.id]?.worn);}
function relicBonus(stat){return (D.relics[S.equippedRelic]?.[stat]||0);}
function enemyArt(c,x,y){
 const name=battle?.baseName||battle?.name||"",profile=D.enemyProfiles?.[name];
 const kind=/狐/.test(name)?"ninefox":/磯|泡|水|滝/.test(name)?"umibozu":/木|蜘蛛/.test(name)?"yokai_flower":"redoni";
 const dedicated=profile?.art&&ENEMY_ART[profile.art],fallback=B9EN[profile?.fallback||kind];
 const im=battle?.rareId?RARE_ART[battle.rareId]?.[battle.clothingBroken?"worn":"intact"]:(layerReady(dedicated)?dedicated:fallback);if(!layerReady(im))return;
 const scale=Math.min(210/im.naturalWidth,220/im.naturalHeight)*(profile?.scale||1);
 const w=im.naturalWidth*scale,h=im.naturalHeight*scale;
 let ox=0,oy=0;
 if(battleFx?.target==="hero"&&battleFx?.source==="enemy"&&!battleFx.reduced){
  const p=Math.min(1,(performance.now()-battleFx.start)/battleFx.duration);
  const rush=Math.sin(p*Math.PI); ox=(profile?.style==="trickster"?-16:26)*rush;oy=-Math.sin(p*Math.PI)*8;
 }
 shadow(c,x+ox,y+65,65,15,.28);c.save();c.imageSmoothingEnabled=!!battle?.rareId||layerReady(dedicated);c.imageSmoothingQuality="high";
 c.drawImage(im,x+ox-w/2,y+oy+65-h,w,h);c.restore();
}
function cover(c,im,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;const r=Math.max(w/im.naturalWidth,h/im.naturalHeight),sw=w/r,sh=h/r,sx=(im.naturalWidth-sw)/2,sy=(im.naturalHeight-sh)/2;c.save();c.globalAlpha=alpha;c.drawImage(im,sx,sy,sw,sh,0,0,w,h);c.restore();return true}
const D=YK_DATA, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const areaOrder=["village","shrine","cove","forest","waterfall","fox"];
function state(v){
 resetBattleAnimation();
 S=window.gameState=YK_SAVE.migrate(v);
 battle=null;battleLocked=false;dialogQueue=[];dialogAfter=null;
 YK_INPUT.stopAll();
 document.querySelectorAll(".overlay.show").forEach(el=>el.classList.remove("show"));
 return S;
}
function stabilizeLoadedState(){
 const area=D.areas[S.area]?S.area:"field";S.area=area;
 S.hp=Math.max(1,Math.min(Number(S.hp)||1,Number(S.maxhp)||100));
 S.encounterGrace=Math.max(Number(S.encounterGrace)||0,D.areas[area]?.grace||0);
 if(area==="teahouse"||area==="osumiHome"){
   S.x=clamp(Number(S.x)||384,60,708);S.y=clamp(Number(S.y)||625,90,690);
 }else{
   S.x=clamp(Number(S.x)||384,40,728);S.y=clamp(Number(S.y)||500,50,718);
   if(collision(S.x,S.y)){
     const safe={field:((typeof YK_WORLD!=="undefined"&&YK_WORLD&&YK_WORLD.hub)?YK_WORLD.hub:[230,534]),village:[373,690],shrine:[70,430],cove:[70,430],forest:[70,430],waterfall:[70,600],hotspring:[70,430],fox:[70,430]}[area]||[384,500];
     S.x=safe[0];S.y=safe[1];
   }
 }
 S.frame=1;return S;
}
function restoreState(v){
 state(v);
 // Old autosaves may point at a field position while the world module is still loading.
 // Restore data first; defer world-dependent stabilization until it is actually available.
 if(S.area==="field"&&(typeof YK_WORLD==="undefined"||!YK_WORLD)){
  S.hp=Math.max(1,Math.min(Number(S.hp)||1,Number(S.maxhp)||100));
  S.x=clamp(Number(S.x)||230,40,728);S.y=clamp(Number(S.y)||534,50,718);S.frame=1;
  return S;
 }
 stabilizeLoadedState();YK_SAVE.auto(S);return S;
}
function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
function flower(c,x,y,col="#f4a0b8",z=1){c.save();c.translate(x,y);c.fillStyle=col;for(let i=0;i<5;i++){c.rotate(1.256);c.beginPath();c.ellipse(0,-5*z,3*z,6*z,0,0,7);c.fill()}c.fillStyle="#f4d579";c.beginPath();c.arc(0,0,2*z,0,7);c.fill();c.restore()}
function sakura(c,x,y,z=1){c.save();c.translate(x,y);c.scale(z,z);c.fillStyle="#493225";c.fillRect(-7,2,14,48);c.fillStyle="#64432c";c.fillRect(-2,3,5,46);for(const q of [[-22,-6,27,"#d96f99"],[19,-7,29,"#ed8fb0"],[0,-31,32,"#f0a2bc"],[-3,-52,24,"#e783a7"]]){c.fillStyle=q[3];c.beginPath();c.arc(q[0],q[1],q[2],0,7);c.fill()}for(const p of [[-29,-18],[-6,-48],[22,-31],[31,2],[-10,-5]])flower(c,p[0],p[1],"#ffd1dd",.55);c.restore()}
function pine(c,x,y,z=1){c.save();c.translate(x,y);c.scale(z,z);c.fillStyle="#493223";c.fillRect(-6,0,12,52);for(const q of [[0,-42,38],[0,-20,45],[0,2,39]]){c.fillStyle=q[1]<-20?"#204936":"#285640";c.beginPath();c.moveTo(0,q[1]-35);c.lineTo(-q[2],q[1]+20);c.lineTo(q[2],q[1]+20);c.closePath();c.fill()}c.restore()}
function lantern(c,x,y,z=1){c.save();c.translate(x,y);c.scale(z,z);c.fillStyle="#483025";c.fillRect(-3,0,6,30);c.fillStyle="#8f342f";c.fillRect(-10,-20,20,22);c.fillStyle="#ffd77a";c.fillRect(-6,-16,12,13);c.fillStyle="#2e2022";c.fillRect(-12,-23,24,4);c.restore()}
function house(c,x,y,w=150,h=110){c.save();c.fillStyle="#d6bd8e";c.fillRect(x,y+30,w,h-30);c.fillStyle="#6b4932";for(let yy=y+40;yy<y+h;yy+=19)c.fillRect(x,yy,w,2);c.fillStyle="#18344c";c.beginPath();c.moveTo(x-18,y+35);c.lineTo(x+w/2,y-12);c.lineTo(x+w+18,y+35);c.closePath();c.fill();c.strokeStyle="#72839a";c.lineWidth=3;for(let i=0;i<7;i++){c.beginPath();c.moveTo(x-8+i*w/6,y+30);c.lineTo(x+w/2,y-8);c.stroke()}c.fillStyle="#3a2826";c.fillRect(x+w/2-18,y+58,36,42);c.fillStyle="#f1b85a";c.fillRect(x+w/2+8,y+77,5,5);c.fillStyle="#89b7b4";c.fillRect(x+14,y+54,30,22);c.strokeStyle="#4a3a31";c.strokeRect(x+14,y+54,30,22);c.restore()}
function torii(c,x,y,z=1){c.save();c.translate(x,y);c.scale(z,z);c.fillStyle="#ad3440";c.fillRect(-35,0,9,72);c.fillRect(26,0,9,72);c.fillStyle="#d04a4d";c.fillRect(-51,-6,102,10);c.fillRect(-43,12,86,7);c.fillStyle="#271b22";c.fillRect(-56,-10,112,5);c.restore()}
function bridge(c,x,y,w=160){c.fillStyle="#6e4a31";c.fillRect(x,y,w,42);for(let i=0;i<w;i+=20){c.fillStyle=i%40?"#936943":"#7c5536";c.fillRect(x+i,y+3,16,36)}c.fillStyle="#432f27";c.fillRect(x,y-5,w,5);c.fillRect(x,y+42,w,5)}
function water(c,x,y,w,h,col="#438da6"){c.fillStyle=col;c.fillRect(x,y,w,h);for(let yy=y+15;yy<y+h;yy+=27){c.strokeStyle="#d5f2ed55";c.lineWidth=2;c.beginPath();c.moveTo(x,yy);c.bezierCurveTo(x+w*.3,yy-7,x+w*.6,yy+8,x+w,yy);c.stroke()}}

function villageHouse(c,x,y,w,h,kind="home"){
 c.save();
 c.fillStyle="#5b4634";c.fillRect(x-7,y+30,w+14,h-30);
 c.fillStyle="#d7c39b";c.fillRect(x,y+35,w,h-35);
 c.fillStyle="#25384b";c.beginPath();c.moveTo(x-18,y+38);c.lineTo(x+w/2,y-8);c.lineTo(x+w+18,y+38);c.closePath();c.fill();
 c.strokeStyle="#6d7f91";c.lineWidth=3;for(let i=0;i<7;i++){c.beginPath();c.moveTo(x-10+i*(w+20)/6,y+34);c.lineTo(x+w/2,y-5);c.stroke()}
 c.fillStyle="#4b3028";c.fillRect(x+w/2-18,y+h-48,36,48);
 c.fillStyle="#8ab0aa";c.fillRect(x+16,y+58,30,23);c.fillRect(x+w-46,y+58,30,23);
 c.strokeStyle="#4b382e";c.strokeRect(x+16,y+58,30,23);c.strokeRect(x+w-46,y+58,30,23);
 if(kind==="tea"){c.fillStyle="#9b2f36";c.fillRect(x+w/2-39,y+39,78,29);c.fillStyle="#fff3d4";c.font="bold 22px serif";c.textAlign="center";c.fillText("茶",x+w/2,y+62)}
 if(kind==="inn"){c.fillStyle="#244a78";c.fillRect(x+8,y+76,35,31);c.fillStyle="#fff3d4";c.font="bold 18px serif";c.textAlign="center";c.fillText("宿",x+25,y+98)}
 c.restore();
}
function villageFence(c,x,y,w,h){c.save();c.fillStyle="#5a402b";for(let xx=x;xx<=x+w;xx+=18)c.fillRect(xx,y,5,h);c.fillStyle="#7a5636";c.fillRect(x,y+7,w+5,5);c.fillRect(x,y+h-12,w+5,5);c.restore()}
function stonePath(c,x,y,w,h){c.save();c.fillStyle="#bca77d";c.fillRect(x,y,w,h);c.strokeStyle="#9b8969";c.lineWidth=2;for(let yy=y+8;yy<y+h;yy+=22){for(let xx=x+8+(yy%44?7:0);xx<x+w;xx+=28){c.beginPath();c.ellipse(xx,yy,10,6,0,0,7);c.stroke()}}c.restore()}
function villageHouse(c,x,y,w,h,kind="home"){
 c.save();c.fillStyle="#4c3529";c.fillRect(x-8,y+29,w+16,h-29);c.fillStyle="#d2b98c";c.fillRect(x,y+38,w,h-38);
 c.fillStyle="#24384b";c.beginPath();c.moveTo(x-20,y+40);c.lineTo(x+w/2,y-10);c.lineTo(x+w+20,y+40);c.closePath();c.fill();
 c.strokeStyle="#71849a";c.lineWidth=3;for(let i=0;i<8;i++){c.beginPath();c.moveTo(x-11+i*(w+22)/7,y+35);c.lineTo(x+w/2,y-6);c.stroke()}
 c.fillStyle="#67452f";c.fillRect(x+8,y+42,w-16,8);c.fillStyle="#4a3028";c.fillRect(x+w/2-20,y+h-50,40,50);
 c.fillStyle="#8bb1aa";for(const wx of [x+17,x+w-49]){c.fillRect(wx,y+63,32,24);c.strokeStyle="#493a31";c.strokeRect(wx,y+63,32,24);c.beginPath();c.moveTo(wx+16,y+63);c.lineTo(wx+16,y+87);c.stroke()}
 c.fillStyle="#6b4a31";c.fillRect(x-5,y+h-5,w+10,9);
 if(kind==="tea"){c.fillStyle="#9c3037";c.fillRect(x+w/2-44,y+40,88,32);c.fillStyle="#fff1ce";c.font="bold 23px serif";c.textAlign="center";c.fillText("茶",x+w/2,y+65);c.fillStyle="#b64145";for(let i=0;i<4;i++)c.fillRect(x+w/2-42+i*22,y+72,17,28)}
 if(kind==="inn"){c.fillStyle="#254d79";c.fillRect(x+9,y+78,38,34);c.fillStyle="#fff1ce";c.font="bold 19px serif";c.textAlign="center";c.fillText("宿",x+28,y+102)}
 c.restore();
}
function villageTexture(c){
 c.save();c.globalAlpha=.16;
 for(let i=0;i<520;i++){const x=(i*137)%768,y=(i*83)%650,r=1+(i%3);c.fillStyle=i%4?"#d8e5b0":"#2f5539";c.beginPath();c.arc(x,y,r,0,7);c.fill()}
 c.restore();
}
function roofTiles(c,x,y,w,h){
 c.save();c.fillStyle="#203a55";c.fillRect(x,y,w,h);c.strokeStyle="#6f8aa0";c.lineWidth=2;
 for(let yy=y+8;yy<y+h;yy+=11){c.beginPath();c.moveTo(x,yy);c.lineTo(x+w,yy);c.stroke()}
 for(let xx=x+8;xx<x+w;xx+=16){c.strokeStyle="#132b43";c.beginPath();c.moveTo(xx,y);c.lineTo(xx-7,y+h);c.stroke()}
 c.fillStyle="#101f31";c.fillRect(x,y+h-5,w,6);c.restore();
}
function petalDrift(c){c.save();for(let i=0;i<80;i++){const x=(i*97+31)%768,y=(i*53+19)%640;c.fillStyle=i%3?"#ffd0dcaa":"#f4a7c0aa";c.beginPath();c.ellipse(x,y,2.7,1.3,(i%7)*.35,0,7);c.fill()}c.restore()}
function waterShine(c,x,y,w,h){c.save();c.globalAlpha=.42;for(let yy=y+10;yy<y+h;yy+=18){for(let xx=x+((yy/18)%2)*17;xx<x+w;xx+=42){c.strokeStyle="#d7fbff";c.lineWidth=2;c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+10,yy-4,xx+22,yy);c.stroke()}}c.restore()}
function villageHouseRich(c,x,y,w,h,kind="home"){
 c.save();c.shadowColor="#17231e88";c.shadowBlur=12;c.shadowOffsetY=8;c.fillStyle="#4a3227";c.fillRect(x-7,y+35,w+14,h-30);c.shadowColor="transparent";
 c.fillStyle="#d2b68a";c.fillRect(x,y+42,w,h-42);c.fillStyle="#6b452e";for(let xx=x+8;xx<x+w;xx+=32)c.fillRect(xx,y+43,5,h-45);
 roofTiles(c,x-18,y+4,w+36,45);c.fillStyle="#182a3d";c.beginPath();c.moveTo(x-25,y+18);c.lineTo(x+w/2,y-13);c.lineTo(x+w+25,y+18);c.lineTo(x+w+17,y+32);c.lineTo(x-17,y+32);c.closePath();c.fill();
 c.fillStyle="#473028";c.fillRect(x+w/2-22,y+h-54,44,54);c.fillStyle="#d5c8a4";c.fillRect(x+w/2-17,y+h-49,34,49);c.strokeStyle="#71523c";c.lineWidth=2;for(let k=1;k<4;k++){c.beginPath();c.moveTo(x+w/2-17+k*8.5,y+h-49);c.lineTo(x+w/2-17+k*8.5,y+h);c.stroke()}
 for(const wx of [x+16,x+w-49]){c.fillStyle="#cbd4bf";c.fillRect(wx,y+65,33,25);c.strokeStyle="#624b3b";c.strokeRect(wx,y+65,33,25);c.beginPath();c.moveTo(wx+16,y+65);c.lineTo(wx+16,y+90);c.moveTo(wx,y+77);c.lineTo(wx+33,y+77);c.stroke()}
 if(kind==="tea"){c.fillStyle="#8f2733";c.fillRect(x+w/2-47,y+42,94,34);for(let i=0;i<4;i++)c.fillRect(x+w/2-45+i*23,y+74,18,28);c.fillStyle="#ffe9bd";c.font="bold 24px serif";c.textAlign="center";c.fillText("茶",x+w/2,y+67);c.fillStyle="#6a432b";c.fillRect(x+w-4,y+103,47,9);c.fillRect(x+w+3,y+92,6,35);c.fillStyle="#d2a96d";c.fillRect(x+w+3,y+84,40,18)}
 if(kind==="inn"){c.fillStyle="#244d7a";c.fillRect(x+8,y+79,40,36);c.fillStyle="#fff0c9";c.font="bold 20px serif";c.textAlign="center";c.fillText("宿",x+28,y+104)}
 c.restore();
}
function drawVillageGroundFallback(c){
 c.fillStyle="#557a49";c.fillRect(0,0,768,768);villageTexture(c);
 for(let y=10;y<650;y+=24)for(let x=8;x<760;x+=29){const n=(x*13+y*7)%5;c.fillStyle=n<2?"#638950":"#4f7546";c.fillRect(x,y,3+n,2)}
 water(c,0,660,768,108,"#337f9f");waterShine(c,0,660,768,108);c.fillStyle="#776c59";c.fillRect(0,646,768,17);c.fillStyle="#9a8b70";for(let x=0;x<768;x+=28)c.fillRect(x,646+(x%3)*2,22,7);
 stonePath(c,276,0,218,646);stonePath(c,0,337,768,146);c.fillStyle="#d9c38f";c.fillRect(294,0,182,646);c.fillRect(0,356,768,108);
}
function drawVillageBuildingsFallback(c){
 villageHouseRich(c,54,60,162,140,"home");villageHouseRich(c,552,60,164,140,"tea");villageHouseRich(c,54,510,162,140,"inn");villageHouseRich(c,552,510,164,140,"home");
 c.fillStyle="#69472f";c.fillRect(585,200,105,75);c.fillRect(585,483,105,102);for(const yy of [205,488])for(let x=590;x<690;x+=18){c.fillStyle="#966b43";c.fillRect(x,yy,13,yy<300?65:87)}
}
function drawVillageNatureFallback(c){
 villageFence(c,12,218,205,66);villageFence(c,550,218,205,66);villageFence(c,12,584,205,55);villageFence(c,550,584,205,55);
 c.fillStyle="#476d3e";c.fillRect(18,224,193,54);c.fillRect(556,224,193,54);c.fillRect(18,590,193,43);c.fillRect(556,590,193,43);
 for(let x=30;x<742;x+=30){if(x>211&&x<556)continue;flower(c,x,246,x%60?"#f2a2ba":"#ffd0dd",.5);flower(c,x,611,x%60?"#f1c166":"#ec8dab",.48)}
 [[32,310,.78],[122,296,.72],[646,300,.72],[735,310,.78],[32,570,.72],[235,585,.67],[530,585,.67],[738,570,.72]].forEach(v=>sakura(c,...v));
 petalDrift(c);
}
function drawVillageObjectsFallback(c){
 torii(c,385,72,.92);for(let i=0;i<5;i++){c.fillStyle=i%2?"#8b7b63":"#9d8b6e";c.fillRect(329,166+i*18,112,7)}
 bridge(c,304,638,160);c.fillStyle="#443226";c.fillRect(294,630,8,63);c.fillRect(466,630,8,63);
 [[246,306],[522,306],[246,520],[522,520],[246,155],[522,155],[548,225],[716,225]].forEach(v=>lantern(c,v[0],v[1],.7));
 c.fillStyle="#74462d";c.fillRect(699,210,48,42);c.fillStyle="#d7bd85";c.fillRect(704,215,38,25);c.fillStyle="#b74346";c.beginPath();c.arc(714,218,5,0,7);c.fill();c.fillStyle="#eadcae";c.beginPath();c.arc(729,218,5,0,7);c.fill();
 c.fillStyle="#55392b";c.fillRect(521,292,6,32);c.fillRect(517,289,55,21);c.fillStyle="#f4ddb0";c.font="13px serif";c.textAlign="center";c.fillText("茶屋 →",544,304);
 c.fillStyle="#55392b";c.fillRect(238,292,6,32);c.fillRect(190,289,54,21);c.fillStyle="#f4ddb0";c.fillText("← 宿",217,304);
 c.fillStyle="#9c927e";for(const [x,y] of [[286,626],[480,626],[270,646],[496,646]]){c.beginPath();c.ellipse(x,y,12,7,0,0,7);c.fill()}
}
const VILLAGE_RENDER_POLICY={
 mode:"composite",
 // Switch to "layers" only after all required replacement assets pass visual QA.
 requiredLayers:["ground","buildings","nature","objects"],
 allowPartialLayers:false
};
function villageLayersReady(){
 return VILLAGE_RENDER_POLICY.requiredLayers.every(k=>layerReady(VILLAGE_LAYERS[k]));
}
window.YKVillageRenderInfo=()=>({
 mode:VILLAGE_RENDER_POLICY.mode,
 compositeReady:layerReady(villageComposite),
 layersReady:villageLayersReady(),
 layers:Object.fromEntries(Object.entries(VILLAGE_LAYERS).map(([k,v])=>[k,layerReady(v)]))
});
function drawVillageMap(c){
 // Production-safe policy:
 // - composite: current approved opaque map.
 // - layers: only when every required replacement layer is present.
 // Never mix an unfinished new layer set with the old composite.
 if(VILLAGE_RENDER_POLICY.mode==="layers"&&villageLayersReady()){
   drawFullLayer(c,VILLAGE_LAYERS.ground);
   drawFullLayer(c,VILLAGE_LAYERS.buildings);
   drawFullLayer(c,VILLAGE_LAYERS.nature);
   drawFullLayer(c,VILLAGE_LAYERS.objects);
   return;
 }
 if(layerReady(villageComposite)){c.drawImage(villageComposite,0,0,768,768);return}
 // Emergency fallback only.
 if(!drawFullLayer(c,VILLAGE_LAYERS.ground))drawVillageGroundFallback(c);
 if(!drawFullLayer(c,VILLAGE_LAYERS.buildings))drawVillageBuildingsFallback(c);
 if(!drawFullLayer(c,VILLAGE_LAYERS.nature))drawVillageNatureFallback(c);
 if(!drawFullLayer(c,VILLAGE_LAYERS.objects))drawVillageObjectsFallback(c);
}

function tatami(c,x,y,w,h,flip=false){
 c.save();c.fillStyle=flip?"#c9b77b":"#d5c48a";c.fillRect(x,y,w,h);c.strokeStyle="#776b49";c.lineWidth=3;c.strokeRect(x,y,w,h);c.strokeStyle="#a28f5e";c.lineWidth=1;
 for(let yy=y+8;yy<y+h;yy+=8){c.beginPath();c.moveTo(x+5,yy);c.lineTo(x+w-5,yy);c.stroke()}c.restore();
}
function woodShelf(c,x,y,w,h){
 c.save();c.fillStyle="#4b3026";c.fillRect(x,y,w,h);c.fillStyle="#7a5034";for(let yy=y+16;yy<y+h;yy+=25)c.fillRect(x+5,yy,w-10,4);
 for(let i=0;i<5;i++){const px=x+10+i*(w-25)/5;c.fillStyle=i%2?"#c78c52":"#8d4c3f";c.fillRect(px,y+5+(i%2)*7,12,15);c.fillStyle="#e4c879";c.fillRect(px+3,y+8+(i%2)*7,6,3)}c.restore();
}
function floorTable(c,x,y){
 c.save();c.fillStyle="#5a3928";c.fillRect(x,y,158,54);c.fillStyle="#7b5033";c.fillRect(x+7,y+6,144,38);c.fillStyle="#d9c08d";c.fillRect(x+65,y+15,28,17);c.fillStyle="#6e8d72";c.beginPath();c.arc(x+79,y+18,7,0,7);c.fill();
 c.fillStyle="#9d3f49";c.fillRect(x-18,y+60,62,30);c.fillRect(x+114,y+60,62,30);c.restore();
}
function drawInterior(c,kind){
 // Purpose-built room renderer. Furniture coordinates intentionally match interiorBlocked().
 const tea=kind==="tea";
 c.fillStyle="#171416";c.fillRect(0,0,768,768);
 // outer timber frame and plaster walls
 c.fillStyle="#3b2924";c.fillRect(42,48,684,656);c.fillStyle=tea?"#806145":"#72583f";c.fillRect(55,62,658,624);
 c.fillStyle="#d4c39d";c.fillRect(68,190,632,438);
 c.fillStyle="#493027";for(let x=68;x<=700;x+=79)c.fillRect(x,190,5,438);
 // shoji side panels
 for(const x of [70,620]){c.fillStyle="#e5d9bd";c.fillRect(x,205,74,130);c.strokeStyle="#70543c";c.lineWidth=4;c.strokeRect(x,205,74,130);for(let yy=231;yy<335;yy+=26){c.beginPath();c.moveTo(x,yy);c.lineTo(x+74,yy);c.stroke()}c.beginPath();c.moveTo(x+37,205);c.lineTo(x+37,335);c.stroke()}
 // tatami floor, with alternating weave direction
 for(let row=0;row<5;row++)for(let col=0;col<4;col++)tatami(c,145+col*119,205+row*84,116,81,(row+col)%2===0);
 // rear service wall
 c.fillStyle="#3e2923";c.fillRect(82,78,604,105);woodShelf(c,100,98,170,67);woodShelf(c,498,98,170,67);
 c.fillStyle="#68442e";c.fillRect(285,95,198,73);c.fillStyle="#d2aa69";c.fillRect(296,106,176,8);
 if(tea){
   // noren + counter identify this room at a glance without borrowing Yasha-hime motifs.
   c.fillStyle="#7d2630";c.fillRect(324,70,120,72);c.fillStyle="#9d3540";for(let i=0;i<3;i++)c.fillRect(326+i*39,72,36,66);
   c.fillStyle="#f4dfb2";c.font="bold 27px serif";c.textAlign="center";c.fillText("茶",384,112);
   c.fillStyle="#563526";c.fillRect(255,155,258,43);c.fillStyle="#8a5c38";c.fillRect(264,160,240,25);
   // kettle, jars, sweets display
   c.fillStyle="#292a2c";c.beginPath();c.arc(302,151,17,0,7);c.fill();c.fillStyle="#c38d55";c.fillRect(442,137,18,21);c.fillRect(468,133,20,25);
   floorTable(c,180,330);floorTable(c,430,330);floorTable(c,180,500);floorTable(c,430,500);
   // small flower vase: intentionally tiny, not a red bow motif.
   c.fillStyle="#587b72";c.fillRect(113,365,18,27);flower(c,122,357,"#f2c46e",.45);
 }else{
   // Osumi's working home: hearth, vegetable storage, worktable and hanging herbs.
   c.fillStyle="#4b3028";c.fillRect(85,245,190,125);c.fillStyle="#2b2b2d";c.beginPath();c.arc(178,286,39,0,7);c.fill();c.fillStyle="#b15a35";c.beginPath();c.arc(178,292,17,0,7);c.fill();
   c.fillStyle="#6c4930";c.fillRect(475,245,165,120);c.fillStyle="#7f9c57";c.fillRect(500,276,30,25);c.fillStyle="#d7c59f";c.fillRect(544,276,30,25);c.fillStyle="#a86f43";c.fillRect(588,276,30,25);
   c.fillStyle="#68432e";c.fillRect(205,455,358,90);c.fillStyle="#e3d0a5";c.fillRect(240,477,92,28);c.fillRect(436,477,92,28);c.fillStyle="#5e7d48";for(let x=111;x<650;x+=95){c.fillRect(x,171,5,26);c.beginPath();c.arc(x+2,170,8,0,7);c.fill()}
   // baskets reinforce Osumi's village-work identity.
   c.strokeStyle="#9a6b3f";c.lineWidth=5;c.strokeRect(110,410,55,40);c.strokeRect(600,410,55,40);
 }
 // entrance and warm lighting
 c.fillStyle="#392720";c.fillRect(330,628,108,58);c.fillStyle="#cdb77a";c.fillRect(345,642,78,28);c.strokeStyle="#725c3d";c.strokeRect(345,642,78,28);
 lantern(c,78,190,.72);lantern(c,690,190,.72);
 // subtle room vignette
 const grd=c.createRadialGradient(384,390,170,384,390,520);grd.addColorStop(0,"rgba(255,220,145,0)");grd.addColorStop(1,"rgba(20,10,12,.28)");c.fillStyle=grd;c.fillRect(42,48,684,656);
}
function interiorBlocked(x,y){
 if(x<72||x>696||y<195||y>704)return true;
 // Counter/hearth/furniture collision uses the same rectangles as drawInterior().
 if(S.area==="teahouse"){
   const solids=[[245,145,523,210],[162,315,356,430],[412,315,606,430],[162,485,356,600],[412,485,606,600],[65,195,150,345],[615,195,703,345]];
   if(solids.some(r=>inRect(x,y,r)))return true;
 }else if(S.area==="osumiHome"){
   const solids=[[85,245,275,370],[475,245,640,365],[205,455,563,545],[65,195,150,345],[615,195,703,345]];
   if(solids.some(r=>inRect(x,y,r)))return true;
 }
 // Keep the bottom-center doorway usable.
 return false;
}
function enterInterior(area){YK_INPUT.stopAll();S.area=area;S.x=384;S.y=625;S.dir="u";S.frame=0;YK_SAVE.auto(S);message(D.areas[area].name);hud()}
function leaveInterior(){
 YK_INPUT.stopAll();S.area="village";
 const door=VILLAGE_LAYOUT.doors.find(d=>d.id===S.lastInterior)||VILLAGE_LAYOUT.doors[0];S.x=door.x;S.y=door.y+8;
 S.dir="d";S.frame=0;
 YK_SAVE.auto(S);message("鬼灯の里");hud();
}
function nearVillageDoor(door,pad=0){
 return Math.abs(S.x-door.x)<=door.halfW+pad && Math.abs(S.y-door.y)<=door.halfH+pad;
}
function drawDoorHint(){
 if(S.area!=="village"||busy)return;
 const door=VILLAGE_LAYOUT.doors.find(d=>nearVillageDoor(d,22));
 if(!door)return;
 const x=door.x,y=door.y-42;
 g.save();
 g.font="700 15px sans-serif";g.textAlign="center";g.textBaseline="middle";
 const label="決定：入る",w=g.measureText(label).width+24;
 g.fillStyle="rgba(25,18,35,.82)";
 g.beginPath();g.roundRect(x-w/2,y-15,w,30,10);g.fill();
 g.strokeStyle="rgba(255,255,255,.65)";g.lineWidth=1.5;g.stroke();
 g.fillStyle="#fff";g.fillText(label,x,y);
 g.restore();
}
function villageDoorAction(){
 if(S.area!=="village")return false;
 const door=VILLAGE_LAYOUT.doors.find(d=>nearVillageDoor(d,8));
 if(!door)return false;
 // In the inner part of the doorway, do not require an exact facing direction.
 // This is intentional for touch/D-pad play on a phone.
 S.lastInterior=door.id;
 enterInterior(door.id);
 return true;
}

function shadow(c,x,y,rx=27,ry=10,a=.28){c.save();c.globalAlpha=a;c.fillStyle="#101820";c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.restore()}
function hero(c,x,y,dir="d",frame=0,outfit="normal",z=1){
 const layered=LAYERED_SPRITES[outfit]||LAYERED_SPRITES.normal;
 const frameIndex=Math.max(0,Math.min(2,Number(frame)||0));
 const requested=layered?.[dir]?.[frameIndex];
 const sprite=layerReady(requested)?requested:layered?.[dir]?.[1];
 if(layerReady(sprite)){
  const scale=104*z/312,anchorX={d:256,u:256,l:200,r:314}[dir]||256;
  c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  shadow(c,x,y+9*z,31*z,10*z,.32);
  c.drawImage(sprite,x-anchorX*scale,y+9*z-480*scale,512*scale,512*scale);
  c.restore();return;
 }
}function npc(c,x,y,type,name,dir="d",frame=1){
 const idx=Math.max(0,Math.min(2,Number(frame)||0));
 const set=NPC_ASSETS[type];
 const animated=NPC_MOTION_DIRECTIONS[type]?.has(dir)===true;
 const safeIdx=animated?idx:1;
 const candidate=set?.frames?.[dir]?.[safeIdx];
 const ready=candidate&&candidate.complete&&candidate.naturalWidth;
 const master=set?.frontMaster;
 const masterReady=master&&master.complete&&master.naturalWidth;
 if(ready||masterReady){
   const draw=ready?candidate:master;
   c.save();c.imageSmoothingEnabled=true;
   const special=(type==="woman"||type==="teagirl"),child=(type==="child"),merchant=(type==="merchant");
   const w=child?57:(merchant?68:(special?65:63));
   const h=child?70:(merchant?80:(special?79:77));
   shadow(c,x,y+7,w*.27,7,.22);
   c.drawImage(draw,x-w/2,y-h*.84,w,h);
   c.restore();
 }else if(!NPC_ASSET_TYPES[type]){
   // NPCs outside the five Hozuki-village roles keep their existing assets until their own map pass.
   const k={man:"man",ferryman:"ferryman",miko:"miko",guard:"guard",traveler:"traveler",hotkeeper:"hotkeeper"}[type]||"woman";
   const dk={d:"down",l:"left",r:"right",u:"up"}[dir]||"down",legacy=B9NPC[k];
   const old=legacy?.frames?.[dk]?.[idx]||legacy?.legacy;
   if(old&&old.complete&&old.naturalWidth){c.save();c.imageSmoothingEnabled=false;c.drawImage(old,x-27,y-53,54,65);c.restore()}
 }else{
   // Deliberately no old doll fallback: show a neutral loading marker instead of shipping mismatched art.
   c.save();c.fillStyle="rgba(20,18,28,.72)";c.beginPath();c.arc(x,y-18,8,0,Math.PI*2);c.fill();c.restore();
 }
 c.font="600 11px sans-serif";c.textAlign="center";c.fillStyle="#fff";c.strokeStyle="#07131f";c.lineWidth=3;c.strokeText(name,x,y+32);c.fillText(name,x,y+32);
}function drawVillageCollisionDebug(c){
 if(!window.__YK_COLLISION_DEBUG||S.area!=="village")return;
 c.save();
 c.globalAlpha=.32;c.fillStyle="#ff3157";
 for(const b of VILLAGE_LAYOUT.buildings){const [x0,y0,x1,y1]=b.rect;c.fillRect(x0,y0,x1-x0,y1-y0)}
 c.fillStyle="#248cff";for(let y=424;y<650;y+=4)for(let x=0;x<768;x+=4)if(villageWaterBlocked(x+2,y+2))c.fillRect(x,y,4,4);
 c.fillStyle="#e69825";for(const [x0,y0,x1,y1] of VILLAGE_LAYOUT.vegetation)c.fillRect(x0,y0,x1-x0,y1-y0);
 c.globalAlpha=.55;c.fillStyle="#ffe03b";
 for(const door of VILLAGE_LAYOUT.doors)c.fillRect(door.x-door.halfW,door.y-door.halfH,door.halfW*2,door.halfH*2);
 c.globalAlpha=.55;c.fillStyle="#d45cff";
 const [ex0,ey0,ex1,ey1]=VILLAGE_LAYOUT.exit.rect;c.fillRect(ex0,ey0,ex1-ex0,ey1-ey0);
 c.globalAlpha=.9;c.fillStyle="#ffffff";
 for(const p of Object.values(VILLAGE_LAYOUT.npcAnchors)){c.beginPath();c.arc(p[0],p[1],5,0,Math.PI*2);c.fill()}
 c.restore();
}
window.YKCollisionDebug=(enabled=true)=>{window.__YK_COLLISION_DEBUG=!!enabled;return window.__YK_COLLISION_DEBUG};
let terrainReady=false,cachedTerrainRev=-1;
const worldAtlas=new Image();
worldAtlas.onload=()=>{terrainReady=false;assetLoaded();};
worldAtlas.src="assets/maps/world-atlas-v15.33.png";
function drawWorldTerrain(c){
 const source=$("worldTerrain"),terrainRev=window.__YK_TERRAIN_REV||0;
 if(!layerReady(worldAtlas)){YK_WORLD.draw(c,null);return;}
 if(!terrainReady||cachedTerrainRev!==terrainRev){const tc=source.getContext("2d");tc.clearRect(0,0,source.width,source.height);tc.save();tc.scale(2,2);YK_WORLD.draw(tc,worldAtlas);tc.restore();terrainReady=true;cachedTerrainRev=terrainRev;}
 c.imageSmoothingEnabled=false;c.drawImage(source,0,0,768,768);
}
const fieldFrame=document.createElement("canvas");
fieldFrame.width=768;fieldFrame.height=768;
const fieldFrameCtx=fieldFrame.getContext("2d");
function drawRoundedField(c,source){
 // The near-field scale stays stable; only the distant ground bends sharply away.
 const cx=384,anchor=474,curveTop=188,landTop=214,strip=2;
 const sky=c.createLinearGradient(0,0,0,300);
 sky.addColorStop(0,"#87b5cb");sky.addColorStop(.52,"#bfd4cb");sky.addColorStop(.86,"#dce1c0");sky.addColorStop(1,"#dfe2b9");
 c.fillStyle=sky;c.fillRect(0,0,768,768);
 c.save();c.globalAlpha=.20;c.fillStyle="#f7f1d7";
 for(const [x,y,rx,ry] of [[70,72,140,32],[335,53,180,38],[650,80,155,34]]){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}c.restore();
 // Organic low mountain ridges replace the old triangular peaks.
 c.save();c.globalAlpha=.22;c.fillStyle="#76947e";c.beginPath();c.moveTo(-20,220);
 c.bezierCurveTo(55,181,90,178,145,201);c.bezierCurveTo(205,158,250,148,314,198);c.bezierCurveTo(365,172,415,160,468,199);c.bezierCurveTo(525,154,580,153,638,196);c.bezierCurveTo(690,172,735,181,790,216);
 c.lineTo(790,250);c.lineTo(-20,250);c.closePath();c.fill();
 c.globalAlpha=.12;c.fillStyle="#547462";c.beginPath();c.moveTo(-20,230);
 c.bezierCurveTo(90,198,150,204,220,226);c.bezierCurveTo(315,182,370,187,445,224);c.bezierCurveTo(535,190,620,193,790,229);
 c.lineTo(790,258);c.lineTo(-20,258);c.closePath();c.fill();c.restore();
 // Far ground remains visible just long enough to establish continuity, then rapidly
 // compresses into the curved horizon instead of ending in a horizontal band.
 const sourceCut=150;
 for(let sy=sourceCut;sy<768;sy+=strip){
  let dy=sy,scale=1.075,dh=strip+1,alpha=1;
  if(sy<anchor){
   const t=Math.max(0,Math.min(1,(anchor-sy)/(anchor-sourceCut)));
   const bend=Math.pow(t,1.65);
   scale=1.075-.14*bend;
   dy=anchor-(anchor-sy)*(1-.34*bend);
   dh=strip*(1-.30*bend)+1.05;
   if(sy<curveTop+80)alpha=Math.max(0,Math.min(1,(sy-curveTop)/80));
  }else{
   const near=Math.min(1,(sy-anchor)/294);scale=1.075+.025*near;
  }
  if(alpha<=0)continue;
  const dw=768*scale,dx=cx-dw/2;c.globalAlpha=alpha;c.drawImage(source,0,sy,768,strip,dx,dy,dw,dh);
 }
 c.globalAlpha=1;
 // A shallow bowed mist edge follows the curvature rather than forming a stripe.
 c.save();c.globalCompositeOperation="screen";c.fillStyle="rgba(235,238,211,.18)";
 c.beginPath();c.moveTo(-20,238);c.quadraticCurveTo(384,186,788,238);c.quadraticCurveTo(384,218,-20,238);c.fill();c.restore();
 const veil=c.createLinearGradient(0,185,0,355);
 veil.addColorStop(0,"rgba(231,237,207,.28)");veil.addColorStop(.45,"rgba(220,231,199,.13)");veil.addColorStop(1,"rgba(214,227,193,0)");
 c.fillStyle=veil;c.fillRect(0,180,768,185);
}function map(){
 if(S.area==="field"&&(typeof YK_WORLD==="undefined"||!YK_WORLD)){
  g.clearRect(0,0,768,768);g.fillStyle="#102635";g.fillRect(0,0,768,768);
  worldHint("フィールド読込待機中");return;
 }
 g.clearRect(0,0,768,768);g.imageSmoothingEnabled=false;
 if(S.area!=="field")ensureNpcAssets();
 if(S.area==="debugField"){drawDebugField(g);return;}
 if(S.area==="field"){
  const camera=YK_WORLD.camera(S.x,S.y,S.dir);
  fieldFrameCtx.clearRect(0,0,768,768);fieldFrameCtx.imageSmoothingEnabled=false;
  fieldFrameCtx.save();fieldFrameCtx.scale(camera.zoom,camera.zoom);fieldFrameCtx.translate(-camera.x,-camera.y);
  YK_WORLD.draw(fieldFrameCtx,null);drawActorsOn(fieldFrameCtx);YK_WORLD.drawProductionForeground?.(fieldFrameCtx,S.y);fieldFrameCtx.restore();
  g.drawImage(fieldFrame,0,0,768,768);
  const k=YK_WORLD.near(S.x,S.y);
  worldHint(k?"A："+YK_WORLD.places[k].name+"へ入る":"フィールドを進んで入口へ · 地図で目的地を確認");return;
 }
 if(S.area==="village"){drawVillageMap(g);drawVillageCollisionDebug(g)}
 else if(S.area==="teahouse") drawInterior(g,"tea");
 else if(S.area==="osumiHome") drawInterior(g,"home");
 else {
  const art=S.area==="forest"?B9IMG.forest:null;
  if(art&&art.complete&&art.naturalWidth)g.drawImage(art,0,0,768,768);
  else {const im=IMG[S.area]||IMG.field;if(im&&im.complete&&im.naturalWidth)g.drawImage(im,0,0,768,768);else{g.fillStyle="#274738";g.fillRect(0,0,768,768)}}
 }
 if(S.area==="field")drawWorldPins(g,false);
 drawActors();
 // New village intentionally has no foreground canopy over actors.
 drawDoorHint();
 if(S.area==="field"){const k=YK_WORLD.near(S.x,S.y);worldHint(k?("A："+YK_WORLD.places[k].name+"へ入る"):"フィールドを進んで入口へ · 地図で目的地を確認");}
 else if(S.area==="village")worldHint("南の橋・北の道からフィールドへ戻れます");
 else if(typeof YK_WORLD!=="undefined"&&YK_WORLD&&YK_WORLD.places&&YK_WORLD.places[S.area])worldHint("西の端からフィールドへ戻れます");
}const NPCS={
 village:[
  {x:282,y:284,type:"child",name:"里の子",dir:"r",frame:1,talk:["夜叉姫さま、おかえりなさい！","川べりに花びらが流れてきたよ。"]},
  {x:491,y:284,type:"merchant",name:"よろず屋",dir:"l",frame:1,talk:["旅支度なら任せておくれ。","社へ行くなら、森道には気をつけな。"]},
  {id:"village-woman-osumi",x:480,y:399,type:"woman",name:"里の女・お澄",dir:"l",frame:1,role:"村仕事",talk:["夜叉姫さま、お帰りなさい。","今日は花染めの糸がよく乾きそうですね。"]},
  {id:"teahouse-girl-odango",x:553,y:218,type:"teagirl",name:"茶屋娘・お団子",dir:"l",frame:1,role:"茶屋",talk:["いらっしゃいませ！ 花見団子はいかがですか？","ひと休みしたら、天妖の社への坂道も楽になりますよ。"]},
  {x:318,y:354,type:"elder",name:"里長",dir:"r",frame:1,talk:["天妖の社へ向かいなされ。","失われた想いを結ぶ鍵が、あそこに眠っております。"]}
 ],
 teahouse:[{id:"teahouse-girl-odango-inside",x:384,y:245,type:"teagirl",name:"茶屋娘・お団子",dir:"d",frame:1,role:"茶屋",talk:["いらっしゃいませ！ 花見団子はいかがですか？","店の中なら、ゆっくり休んでいけますよ。"]}],
 osumiHome:[{id:"village-woman-osumi-inside",x:384,y:390,type:"woman",name:"里の女・お澄",dir:"d",frame:1,role:"家仕事",talk:["あら、夜叉姫さま。狭い家ですがどうぞ。","畑仕事の道具を片づけていたところなんです。"]}],
 shrine:[{x:515,y:370,type:"miko",name:"白妙",talk:["花結びは、失われた記憶を結び直す力。","海の入り江、その先の忘れの森へお進みください。"]},{x:210,y:530,type:"guard",name:"社守",talk:["この先は妖の気配が濃い。","刀を抜けるよう備えておけ。"]}],
 cove:[{x:585,y:570,type:"ferryman",name:"漁師・潮平",talk:["潮風の向こうに、不思議な花びらが舞っていたよ。"]},{x:190,y:450,type:"child",name:"浜の子",talk:["白い貝が光る夜は、森の道が開くんだって！"]}],
 forest:[{x:530,y:390,type:"traveler",name:"旅の薬師",talk:["この森は同じ道へ戻される。","花の灯りを追うんだ。"]}],
 waterfall:[{x:150,y:590,type:"child",name:"滝童",talk:["龍神さまの水鏡は、九尾の祠への道を映すよ。"]}],
 fox:[{x:535,y:650,type:"traveler",name:"白狐の使い",talk:["ようやく来たね、夜叉姫。","忘れた約束を思い出す時だ。"]}],
 hotspring:[{x:620,y:650,type:"hotkeeper",name:"湯守・お糸",talk:["月見の湯へようこそ。","今夜は花びらの香りがよく立っていますよ。"]}]
};
function areaNPCs(){return NPCS[S.area]||[]}
function drawNPCs(){areaNPCs().forEach(n=>npc(g,n.x,n.y,n.type,n.name,n.dir||"d",n.frame??1))}
function drawActorsOn(c){
 const actors=areaNPCs().map(n=>({y:n.y,kind:"npc",n}));
 actors.push({y:S.y,kind:"hero"});
 actors.sort((a,b)=>a.y-b.y);
 for(const a of actors){
   if(a.kind==="hero")hero(c,S.x,S.y,S.dir,S.frame,S.outfit,S.area==="field"?.16:["village","teahouse","osumiHome"].includes(S.area)?.68:.92);
   else {const n=a.n;npc(c,n.x,n.y,n.type,n.name,n.dir||"d",n.frame??1)}
 }
}
function drawActors(){drawActorsOn(g)}
function nearestNPC(max=92){let best=null,bd=max;for(const n of areaNPCs()){const dx=n.x-S.x,dy=n.y-S.y,d=Math.hypot(dx,dy);if(d>=bd)continue;const facing={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]}[S.dir]||[0,1],dot=(dx*facing[0]+dy*facing[1])/(d||1);if(dot<-.15)continue;best=n;bd=d}return best}
function npcBlocked(x,y){
 const list=NPCS[S.area]||[];
 // Artwork can be wide; collision only uses the character's foot/body core.
 return list.some(n=>{
   const dx=x-n.x,dy=y-n.y;
   const radius=n.type==="merchant"?20:(n.type==="child"?15:18);
   return dx*dx+dy*dy<radius*radius;
 });
}
function faceNPC(n){const dx=n.x-S.x,dy=n.y-S.y;if(Math.abs(dx)>Math.abs(dy)){S.dir=dx>0?"r":"l";n.dir=dx>0?"l":"r"}else{S.dir=dy>0?"d":"u";n.dir=dy>0?"u":"d"}}

function hud(){YK_AUDIO.syncBgm(S.area);const a=D.areas[S.area];$("hud").innerHTML=`HP ${S.hp}/${S.maxhp}<br>Lv.${S.lv}　${S.gold}文<br><span class="outfitHud">衣装：${D.outfits[S.outfit]?.name||"花守り装束"}${OUTFIT_READY[S.outfit]?"":"（制作中）"}</span>`;$("objective").textContent="目的： "+D.objectives[Math.min(S.quest,D.objectives.length-1)];map()}
function message(t,ms=1300){clearTimeout(msgTimer);$("message").textContent=t;$("message").style.display="block";msgTimer=setTimeout(()=>$("message").style.display="none",ms)}

function talk(entry,after=null){
 if(!entry)return false;
 const speaker=entry.n||entry.name||"";
 const lines=Array.isArray(entry.t)?entry.t:(Array.isArray(entry.talk)?entry.talk:[String(entry.t||entry.talk||"")]);
 dialogQueue=lines.filter(Boolean).map(t=>({speaker,text:String(t)}));
 if(!dialogQueue.length)return false;
 dialogAfter=typeof after==="function"?after:null;
 busy=true;$("dialog").classList.add("show");
 nextDialog();return true;
}
function nextDialog(){
 if(dialogQueue.length){
  const d=dialogQueue.shift();
  $("speaker").textContent=d.speaker;
  $("dialogText").textContent=d.text;
  $("dialogNext").textContent=dialogQueue.length?"次へ":"閉じる";
  renderDialogPortrait();
  return;
 }
 $("dialog").classList.remove("show");
 const after=dialogAfter;dialogAfter=null;busy=false;
 if(after)after();hud();
}
function renderDialogPortrait(){
 const c=$("dialogPortrait");if(!c)return;
 c.style.display=$("speaker").textContent==="夜叉姫"?"block":"none";
 const q=c.getContext("2d");q.clearRect(0,0,c.width,c.height);
 if(c.style.display!=="none")hero(q,90,160,"d",1,S.outfit,1.3);
}
function beginEncounter(){
 ensureBattleAssets();
 const area=D.areas[S.area],pool=D.enemies[S.area];
 if(!area||!pool?.length||area.encounter<=0)return false;
 if(S.encounterGrace>0||S.encounterSteps<(area.min||12))return false;
 if(Math.random()>=area.encounter)return false;
 const e=pool[Math.floor(Math.random()*pool.length)];
 const variant=D.rareKinds[e[0]],rare=rareReady(variant)&&Math.random()<D.rareRules.chance?variant:null;
 const rareHp=rare?Math.ceil(e[1]*(rare.hpMultiplier||1)):e[1],rareAtk=rare?Math.ceil(e[2]*(rare.atkMultiplier||1)):e[2];
 resetBattleAnimation();battle={name:rare?rare.name:e[0],baseName:e[0],rareId:rare?.id||null,rareTrait:rare?.trait||null,rareTraitChance:rare?.traitChance||0,clothingBroken:false,hp:rareHp,max:rareHp,atk:rareAtk,xp:e[3],gold:rare?Math.ceil(e[4]*D.rareRules.goldMultiplier):e[4]};
 S.battles++;S.encounterSteps=0;busy=true;battleCursor=0;battleLocked=false;
 YK_INPUT.stopAll();S.frame=1;
 $("battleText").textContent="どうする？";$("battle").classList.add("show");
 selectCmd(0);renderBattle();YK_AUDIO.beep(220,.06);return true;
}
function encounter(){return beginEncounter()}
function action(){
 if(S.area==="debugField"){
  const pages=(typeof DEBUG_PAGES!=="undefined"?DEBUG_PAGES:["overview","tiles","road"]);
  YK_INPUT.stopAll();debugMotion=null;
  window.__YK_DEBUG_PAGE=((window.__YK_DEBUG_PAGE||0)+1)%pages.length;
  debugSafePosition();
  message("DEBUG："+pages[window.__YK_DEBUG_PAGE],700);map();return true;
 }
 if($("dialog").classList.contains("show")){nextDialog();return true;}
 if(busy)return false;
 if(S.area==="field"){const k=YK_WORLD.near(S.x,S.y);if(k){enterWorldPlace(k);return true;}message("目的地の入口付近で A を押してください。",1400);return false;}
 if(villageDoorAction())return true;
 if(S.area==="teahouse"||S.area==="osumiHome"){
  if(S.y>=590){leaveInterior();return true}
 }
 const n=nearestNPC(100);
 if(n){
  const event=D.story[S.quest];
  if(event&&event.area===S.area&&event.speaker===n.name){const stage=S.quest;
   return talk({n:n.name,t:event.lines},()=>{if(S.quest!==stage)return;S.quest=stage+1;if(event.petal)S.petals++;S.destination=event.target;YK_SAVE.auto(S);message(event.unlock,4200);});
  }
  return talk({n:n.name,t:n.talk});
 }
 if(S.area==="hotspring"){
  hotBathing=false;YK_INPUT.stopAll();
  busy=true;$("hotSpringText").textContent="湯気の向こうで、花びらが静かに揺れている。";
  $("hotSpring").classList.add("show");renderHotSpring();return true;
 }
 message("ここには特に何もない。",800);return false;
}
function hotChoice(choice){
 if(!$("hotSpring").classList.contains("show"))return;
 if(choice==="bath"){
  hotBathing=true;renderHotSpring();
  S.hp=S.maxhp;S.teaVisits=(Number(S.teaVisits)||0)+1;
  $("hotSpringText").textContent="花の香りの湯で、HPが全回復した。";
  YK_SAVE.auto(S);hud();return;
 }
 if(choice==="overheat"){
  hotBathing=true;renderHotSpring();
  S.hp=Math.max(1,S.hp-5);
  $("hotSpringText").textContent="少し長湯しすぎた……。HPが5減った。";
  YK_SAVE.auto(S);hud();return;
 }
 $("hotSpring").classList.remove("show");busy=false;hud();
}
function renderHotSpring(){
 const c=$("hotSpringCanvas"),q=c.getContext("2d");q.clearRect(0,0,c.width,c.height);
 cover(q,B9IMG.hot,c.width,c.height);
 if(!hotBathing){hero(q,384,365,"d",1,S.outfit,1.8);return;}
 // The same covered white water outfit is used; the lower body sits behind water.
 q.save();q.beginPath();q.rect(0,0,c.width,245);q.clip();
 hero(q,384,295,"d",1,"white",1.5);q.restore();
 q.save();q.beginPath();q.ellipse(384,192,202,85,0,0,Math.PI*2);q.clip();
 q.fillStyle="#60969b";q.fillRect(170,240,430,60);q.restore();
 q.strokeStyle="rgba(221,246,240,.62)";q.lineWidth=2;
 q.beginPath();q.ellipse(384,243,57,7,0,0,Math.PI*2);q.stroke();
}
function inRect(x,y,r){return x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3]}
const VILLAGE_LAYOUT={
 version:"15.30",size:[768,768],
 // Footprint of the visible buildings; obsolete houses no longer block the grass.
 buildings:[
  {id:"houseNW",rect:[113,38,254,161]},
  {id:"teahouse",rect:[501,38,697,170]},
  {id:"osumiHome",rect:[562,296,694,414]},
  {id:"well",rect:[108,321,145,370]}
 ],
 vegetation:[],
 walkZones:[[345,34,423,736],[253,213,525,438],[146,211,648,260],[162,162,202,242],[605,172,644,252],[604,417,644,468],[410,437,644,470],[148,337,275,381],[95,305,211,396]],
 doors:[
  {id:"teahouse",x:623,y:185,halfW:25,halfH:16,target:"teahouse"},
  {id:"osumiHome",x:623,y:430,halfW:25,halfH:16,target:"osumiHome"}
 ],
 river:{rect:[0,539,768,636],bridge:[344,423]},
 exit:{to:"field",rect:[345,720,423,768]},
 northExit:{to:"field",rect:[345,0,423,54]},
 npcAnchors:{child:[282,284],merchant:[491,284],osumi:[480,399],teagirl:[553,218],elder:[318,354]}
};
function villageWaterBlocked(x,y){return y>539&&y<636&&(x<344||x>423);}
function villageBlocked(x,y){
 const r=6;
 const hitRect=([a,b,c,d])=>Math.hypot(x-Math.max(a,Math.min(x,c)),y-Math.max(b,Math.min(y,d)))<r;
 return !VILLAGE_LAYOUT.walkZones.some(rect=>inRect(x,y,rect))||
  VILLAGE_LAYOUT.buildings.some(b=>hitRect(b.rect))||villageWaterBlocked(x,y);
}
function collision(x,y){if(S.area==="debugField"){const m=debugCollisionMap();return m?!YK_LANDSCAPE.walkable(m,x-48,y-100):x<53||x>683||y<105||y>639;}if(x<27||x>741||y<34||y>736)return true;if(npcBlocked(x,y))return true;if(S.area==="village"&&villageBlocked(x,y))return true;if((S.area==="teahouse"||S.area==="osumiHome")&&interiorBlocked(x,y))return true;if(S.area==="field"){
  if(typeof YK_WORLD==="undefined"||!YK_WORLD)return true;
  if(!YK_WORLD.walkable(x,y))return true;
}if(S.area==="waterfall"&&x>200&&x<565&&y<500)return true;return false}
function exitArea(){
 if(S.area==="teahouse"||S.area==="osumiHome")return null;
 if(S.area==="village"){
   const [x0,y0,x1,y1]=VILLAGE_LAYOUT.exit.rect;
   if(S.x>x0&&S.x<x1&&S.y>y0&&S.y<y1)return VILLAGE_LAYOUT.exit.to;
   if(inRect(S.x,S.y,VILLAGE_LAYOUT.northExit.rect))return VILLAGE_LAYOUT.northExit.to;
 }
 if(typeof YK_WORLD!=="undefined"&&YK_WORLD&&YK_WORLD.places&&YK_WORLD.places[S.area]&&S.area!=="village"&&S.x<42)return "field";
 return null;
}
function move(dx,dy,dir){
 if(busy)return;
 if(S.area==="debugField"){moveDebug(dx,dy,dir);return;}
 S.dir=dir;
 // Equal diagonal speed; short collision steps follow edges without jumping corners.
 const norm=Math.hypot(dx,dy)||1,sp=(Number($("speedSelect").value)||1)*(S.area==="field"?8:22);
 const vx=dx/norm*sp,vy=dy/norm*sp,steps=Math.ceil(sp/2),startX=S.x,startY=S.y;
 for(let i=0;i<steps;i++){
  const nx=clamp(S.x+vx/steps,27,741),ny=clamp(S.y+vy/steps,34,736);
  if(!collision(nx,ny)){S.x=nx;S.y=ny;}
  // On the open field, a blocked diagonal step must stop instead of sliding
  // along one axis. This keeps coast, river and mountain edges predictable
  // under sustained 8-direction touch input.
  else if(vx&&vy&&S.area!=="field"){
    if(!collision(nx,S.y))S.x=nx;
    else if(!collision(S.x,ny))S.y=ny;
  }
 }
 if(Math.hypot(S.x-startX,S.y-startY)<.001){S.frame=1;map();return;}
 walkPhase=(walkPhase+1)%4;S.frame=[1,0,1,2][walkPhase];lastMoved=performance.now();
 S.walk++;S.encounterSteps++;if(S.encounterGrace>0)S.encounterGrace--;
 const from=S.area,ex=exitArea();
 if(ex&&ex!==S.area){
   S.area=ex;
   if(ex==="field"){[S.x,S.y]=YK_WORLD.places[from]?.point||S.worldPosition||YK_WORLD.hub;S.dir="d";}
   else {S.x=70;S.y=430;}
   S.visitedAreas[ex]=true;
   S.frame=1;walkPhase=0;S.encounterSteps=0;S.encounterGrace=D.areas[ex]?.grace||0;YK_INPUT.stopAll();message(D.areas[ex].name);YK_SAVE.auto(S)
 }else encounter();
 hud();if(S.walk%10===0)YK_SAVE.auto(S)
}function renderBattle(){
 if(!battle)return;
 bg.clearRect(0,0,768,430);bg.imageSmoothingEnabled=false;
 const im=B9IMG.battle;if(im&&im.complete&&im.naturalWidth)bg.drawImage(im,0,0,768,430);else{bg.fillStyle="#14283d";bg.fillRect(0,0,768,430)}
 // Darken lower UI baked into reference so live battle UI remains readable.
 bg.fillStyle="rgba(5,15,25,.48)";bg.fillRect(0,315,768,115);
 const sprite=BATTLE_SPRITES[S.outfit]?.[battlePose];
 if(battlePose!=="idle"&&layerReady(sprite)){
  const scale=2/3,x=battlePose==="attack"?228:150,y=293;
  shadow(bg,x,y,62,20,.32);bg.save();bg.imageSmoothingEnabled=true;bg.imageSmoothingQuality="high";
  bg.drawImage(sprite,x-384*scale,y-480*scale,768*scale,512*scale);bg.restore();
 }else hero(bg,150,275,"r",1,S.outfit,2.0);
 const progress=battleFx?Math.min(1,(performance.now()-battleFx.start)/battleFx.duration):1;
 const recoil=battleFx?.target==="enemy"&&!battleFx.reduced?Math.sin(progress*Math.PI*8)*7*(1-progress):0;
 enemyArt(bg,585+recoil,225);
 drawBattleFx(bg,progress);
 $("enemyName").textContent=battle.name+(battle.rareId?"【特異種】":"")+(battle.clothingBroken?"・衣装損傷":"");$("enemyHp").textContent=Math.max(0,battle.hp)+"/"+battle.max;$("battleHp").textContent=S.hp+"/"+S.maxhp
}
// Enemy artwork stays a single still; brief overlays carry each impact.
function startBattleFx(kind,target){
 const fx=battleFx={kind,target,source:target==="hero"?"enemy":"hero",start:performance.now(),duration:320,reduced:!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches};
 const tick=()=>{if(battleFx!==fx)return;if(performance.now()-fx.start>=fx.duration){battleFx=null;renderBattle();return;}renderBattle();battleLater(tick,16);};
 battleLater(tick,16);
}
function drawBattleFx(c,p){
 if(!battleFx||p>=1)return;
 const f=battleFx,x=f.target==="enemy"?585:170,y=205;
 c.save();c.globalAlpha=(1-p)*.85;c.strokeStyle=f.kind==="petals"?"#ffd0e7":"#fff0b2";c.lineWidth=5;
 if(f.reduced){c.beginPath();c.ellipse(x,y,60,72,0,0,Math.PI*2);c.stroke();c.restore();return;}
 if(f.kind==="slash"){
  c.beginPath();c.moveTo(x-55+25*p,y+65);c.lineTo(x+50+25*p,y-65);c.stroke();
  c.strokeStyle="#ef9fba";c.lineWidth=2;c.beginPath();c.moveTo(x-68,y+45);c.lineTo(x+30,y-60);c.stroke();
 }else{
  c.beginPath();c.ellipse(x,y,22+70*p,14+50*p,0,0,Math.PI*2);c.stroke();
  for(let i=0;i<10;i++){const a=i*Math.PI/5+p,r=25+65*p,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
   if(f.kind==="petals")flower(c,px,py,"#ffb9d9",.9);else{c.beginPath();c.moveTo(px,py);c.lineTo(px+Math.cos(a)*14,py+Math.sin(a)*14);c.stroke();}}
 }
 c.restore();
}
function selectCmd(i){battleCursor=(i+4)%4;document.querySelectorAll("[data-cmd]").forEach((b,n)=>b.classList.toggle("selected",n===battleCursor))}
function cmd(n){
 if(!battle||battleLocked)return;
 battleLocked=true;
 if(n==="attack"||n==="skill"){
  const d=n==="skill"?20+S.lv*3+relicBonus("skill")+Math.floor(Math.random()*12):S.atk+relicBonus("atk")+Math.floor(Math.random()*8);
  if(battle.rareTrait==="leafDodge"&&Math.random()<battle.rareTraitChance){$("battleText").textContent=`${battle.name}は木の葉に紛れて攻撃をかわした！`;startBattleFx("petals","enemy");renderBattle();battleLater(foe,420);return;}
  if(battle.rareTrait==="shellGuard"&&Math.random()<battle.rareTraitChance){const guarded=Math.max(1,Math.ceil(d*.35));battle.hp-=guarded;battlePose="attack";$("battleText").textContent=`${battle.name}は大鋏で防いだ！ ${guarded}ダメージ`;startBattleFx("impact","enemy");renderBattle();battleLater(()=>{battlePose="idle";if(battle.hp<=0)return win();battleLater(foe,260)},320);return;}
  battle.hp-=d;battlePose="attack";
  if(battle.rareId&&battle.hp/battle.max<=D.rareRules.breakHpRatio)battle.clothingBroken=true;
  $("battleText").textContent=(n==="skill"?"花結び！ ":"")+`${d}ダメージ！`;
  YK_AUDIO.beep(n==="skill"?720:330,.08);startBattleFx(n==="skill"?"petals":"slash","enemy");renderBattle();
  battleLater(()=>{battlePose="idle";renderBattle()},320);
  if(battle.hp<=0)return win();
  battleLater(foe,480);
 }else if(n==="item"){
  if(S.potions<=0){battleLocked=false;return $("battleText").textContent="薬草がない！"}
  S.potions--;const healed=Math.min(S.maxhp-S.hp,35+relicBonus("heal"));S.hp+=healed;$("battleText").textContent=`HPを${healed}回復！`;renderBattle();battleLater(foe,300);
 }else{
  if(Math.random()<.78){$("battleText").textContent="逃げ切った！";battleLater(endBattle,350)}
  else{$("battleText").textContent="逃げられない！";battleLater(foe,300)}
 }
}
function foe(){
 if(!battle)return;
 battleLocked=true;battlePose="hit";
 const profile=D.enemyProfiles?.[battle.baseName],variance=profile?.variance??5;
 const foxfire=battle.rareTrait==="foxfire"&&Math.random()<battle.rareTraitChance;
 const base=Math.max(1,battle.atk-Math.floor((S.def+relicBonus("def"))/2)+Math.floor(Math.random()*variance));
 const d=foxfire?Math.ceil(base*1.35):base;
 S.hp=Math.max(0,S.hp-d);$("battleText").textContent=foxfire?`${battle.name}の妖火！ ${d}ダメージ`:`${battle.name}の${profile?.attack||"攻撃"}！ ${d}ダメージ`;
 startBattleFx(foxfire?"petals":(profile?.fx||"impact"),"hero");renderBattle();YK_AUDIO.beep(foxfire?520:(profile?.style==="trickster"?180:110),.08);
 battleLater(()=>{if(S.hp<=0)return defeat();battlePose="idle";battleLocked=false;renderBattle()},420);
}
function win(){
 if(!battle||battle.rewarded)return;
 battle.rewarded=true;S.wins++;S.xp+=battle.xp;S.gold+=battle.gold;
 let loot="";
 if(battle.rareId){const id=battle.rareId,first=!S.rareWins[id];S.rareWins[id]=(S.rareWins[id]||0)+1;
  if(first||Math.random()<D.rareRules.repeatDropChance){S.relics[id]=(S.relics[id]||0)+1;loot=` ／ ${D.relics[id].name}を入手！`;}
 }
 battle.rewardText=`勝利！ ${battle.xp}経験 / ${battle.gold}文${loot}`;
 $("battleText").textContent=battle.rewardText;
 while(S.xp>=S.lv*40){S.xp-=S.lv*40;S.lv++;S.maxhp+=12;S.hp=S.maxhp;S.atk+=3;S.def++}
 YK_SAVE.auto(S);battleLater(endBattle,loot?1800:650);
}
function endBattle(){const reward=battle?.rewardText;resetBattleAnimation();battle=null;battleLocked=false;$("battle").classList.remove("show");busy=false;S.encounterGrace=D.areas[S.area]?.grace||8;YK_SAVE.auto(S);hud();if(reward)message(reward,4500)}
function defeat(){resetBattleAnimation();battle=null;battleLocked=false;$("battle").classList.remove("show");YK_INPUT.stopAll();$("gameover").classList.add("show");busy=true}
function renderRelics(){
 const owned=Object.entries(D.relics).filter(([id])=>S.relics[id]);
 $("itemsPanel").innerHTML=`<p>薬草 × ${S.potions}　潮花の花びら × ${S.petals}</p><p>お守り：${D.relics[S.equippedRelic]?.name||"なし"}（1つ装備・衣装の見た目はそのまま）</p><div class="relicChoices">`+owned.map(([id,r])=>`<button data-relic="${id}" aria-pressed="${S.equippedRelic===id}">${S.equippedRelic===id?"装備中：":""}${r.name} × ${S.relics[id]}<small>${r.text}</small></button>`).join("")+`<button data-relic="">外す</button></div>`;
 document.querySelectorAll("[data-relic]").forEach(b=>YK_INPUT.tap(b,()=>{const id=b.dataset.relic;S.equippedRelic=Object.hasOwn(D.relics,id)&&S.relics[id]?id:null;YK_SAVE.auto(S);busy=false;menu();}));
}
function menu(){if(busy)return;YK_INPUT.stopAll();busy=true;$("statusPanel").innerHTML=`夜叉姫　Lv.${S.lv}<br>HP ${S.hp}/${S.maxhp}　攻撃 ${S.atk+relicBonus("atk")}　防御 ${S.def+relicBonus("def")}<br>武器：${S.weapon}`;renderRelics();$("recordPanel").textContent=`歩数 ${S.walk} / 戦闘 ${S.battles} / 勝利 ${S.wins}`;$("outfits").innerHTML=Object.entries(D.outfits).map(([k,v])=>`<button data-outfit="${k}" class="${S.outfit===k?"selected":""}"><img src="assets/characters/yashahime/${HERO_FOLDERS[k]}/front-neutral.png" alt="" loading="lazy"><span>${v.name}</span></button>`).join("");document.querySelectorAll("[data-outfit]").forEach(b=>YK_INPUT.tap(b,()=>{S.outfit=b.dataset.outfit;YK_SAVE.auto(S);$("menu").classList.remove("show");busy=false;hud();menu()}));$("menu").classList.add("show")}
function slots(){$("slots").innerHTML=[1,2,3].map(n=>{const i=YK_SAVE.slotInfo(n);return `<div class="slot"><b>${n}番</b>　${i?`Lv.${i.lv} / ${i.area}`:"記録なし"}<div class="slotBtns"><button data-save="${n}">保存</button><button data-load="${n}">読込</button></div></div>`}).join("");document.querySelectorAll("[data-save]").forEach(b=>YK_INPUT.tap(b,()=>{YK_SAVE.saveSlot(+b.dataset.save,S);slots()}));document.querySelectorAll("[data-load]").forEach(b=>YK_INPUT.tap(b,()=>{const v=YK_SAVE.loadSlot(+b.dataset.load);if(v){restoreState(v);close("saveMenu")}}))}
function close(id){YK_INPUT.stopAll();$(id).classList.remove("show");busy=false;hud()}
function worldMap(){if(busy)return;YK_INPUT.stopAll();busy=true;$("worldMap").classList.add("show");drawWorld()}
function worldHint(text){rr(g,114,724,540,30,8,"#07131fe8","#c9ad78");g.font="16px sans-serif";g.textAlign="center";g.fillStyle="#fff0ca";g.fillText(text,384,745);}
function enterWorldPlace(k){
 const p=YK_WORLD.places[k];if(!p)return;
 S.worldPosition=[S.x,S.y];S.area=k;S.visitedAreas[k]=true;
 [S.x,S.y]=k==="village"?[373,690]:k==="waterfall"?[70,600]:[70,430];
 S.dir=k==="village"?"u":"r";S.frame=1;walkPhase=0;
 S.encounterSteps=0;S.encounterGrace=D.areas[k].grace||9;
 YK_INPUT.stopAll();YK_SAVE.auto(S);message(p.name);hud();
}
function drawWorldPins(c,labels){
 for(const [k,p] of Object.entries(YK_WORLD.places)){
  const [x,y]=p.point,selected=S.destination===k;
  c.beginPath();c.arc(x,y,selected?9:6,0,Math.PI*2);c.fillStyle=selected?"#ffe091":S.visitedAreas[k]?"#d987a9":"#fff5dd";c.fill();c.strokeStyle="#502c48";c.lineWidth=2;c.stroke();
  if(labels){const w=106;rr(c,x-w/2,y+12,w,25,5,selected?"#6b354e":"#102835ed","#cfb67c");c.font="14px sans-serif";c.fillStyle="#fff7e4";c.textAlign="center";c.fillText(p.name,x,y+30);}
 }
}
function drawWorld(){
 const c=wg;c.clearRect(0,0,720,720);c.save();c.scale(720/768,720/768);c.imageSmoothingEnabled=true;
 drawWorldTerrain(c);
 if(S.area==="field"){const camera=YK_WORLD.camera(S.x,S.y,S.dir);c.save();c.strokeStyle="#fff3b9";c.lineWidth=2;c.setLineDash([6,4]);c.strokeRect(camera.x,camera.y,camera.size,camera.size);c.restore();}
 drawWorldPins(c,true);
 const area=S.area==="teahouse"||S.area==="osumiHome"?"village":S.area;
 const pos=area==="field"?[S.x,S.y]:YK_WORLD.places[area]?.point||YK_WORLD.hub;
 c.beginPath();c.arc(pos[0],pos[1]-8,13,0,Math.PI*2);c.strokeStyle="#fff";c.lineWidth=3;c.stroke();
 c.fillStyle="#70edff";c.beginPath();c.moveTo(pos[0],pos[1]-4);c.lineTo(pos[0]-7,pos[1]-16);c.lineTo(pos[0]+7,pos[1]-16);c.closePath();c.fill();c.restore();
 const target=YK_WORLD.places[S.destination];
 $("worldStatus").textContent="現在地："+D.areas[S.area].name+"　／　"+(target?"目的地："+target.name+" — "+target.note:"白い輪が現在地。地名を選んで旅先の案内を確認できます。");
 $("worldPlaces").innerHTML=Object.entries(YK_WORLD.places).map(([k,p])=>`<button data-world-place="${k}" aria-pressed="${S.destination===k}" class="${S.destination===k?"selected":""}">${p.name}<small>${S.visitedAreas[k]?"訪問済み":"訪問可能"}</small></button>`).join("");
 document.querySelectorAll("[data-world-place]").forEach(b=>YK_INPUT.tap(b,()=>{const k=b.dataset.worldPlace;S.destination=k;YK_SAVE.auto(S);drawWorld();}));
}
function battlePad(d){if(!$("battle").classList.contains("show"))return false;selectCmd(battleCursor+(d==="u"||d==="l"?-1:1));return true}
YK_INPUT.directions([[ $("up"),[0,-1] ],[ $("down"),[0,1] ],[ $("left"),[-1,0] ],[ $("right"),[1,0] ],[ $("upLeft"),[-1,-1] ],[ $("upRight"),[1,-1] ],[ $("downLeft"),[-1,1] ],[ $("downRight"),[1,1] ]],(x,y)=>{const dir=x<0?"l":x>0?"r":y<0?"u":"d";if(!battlePad(dir))move(x*22,y*22,dir);},()=>S.area==="debugField"?{delay:160,repeat:160}:{delay:260,repeat:105});
YK_INPUT.tap($("ok"),()=>battle?cmd(["attack","skill","item","escape"][battleCursor]):action());YK_INPUT.tap($("cancel"),()=>{if(S.area==="debugField"){window.YKDebugField(false);return;}for(const id of ["worldMap","menu","saveMenu","settings"]){if($(id).classList.contains("show")){close(id);return;}}});
YK_INPUT.tap($("dialogNext"),nextDialog);YK_INPUT.tap($("bookBtn"),()=>S.area==="debugField"?message("DEBUG MAPでは手帳を開きません",1200):menu());YK_INPUT.tap($("worldBtn"),()=>S.area==="debugField"?message("DEBUG MAPでは地図を開きません",1200):worldMap());YK_INPUT.tap($("saveBtn"),()=>{if(S.area==="debugField")return message("DEBUG MAPは本編セーブに影響しません",1400);if(busy)return;YK_INPUT.stopAll();busy=true;slots();$("saveMenu").classList.add("show")});YK_INPUT.tap($("settingsBtn"),()=>{if(S.area==="debugField")return message("DEBUG MAPでは設定を変更しません",1200);if(busy)return;YK_INPUT.stopAll();busy=true;$("soundToggle").checked=S.sound;$("settings").classList.add("show")});
document.querySelectorAll("[data-close]").forEach(b=>YK_INPUT.tap(b,()=>close(b.dataset.close)));document.querySelectorAll("[data-cmd]").forEach((b,i)=>YK_INPUT.tap(b,()=>{selectCmd(i);cmd(b.dataset.cmd)}));
document.querySelectorAll("[data-hot]").forEach(b=>YK_INPUT.tap(b,()=>hotChoice(b.dataset.hot)));
$("soundToggle").addEventListener("change",e=>{S.sound=e.target.checked;YK_SAVE.auto(S)});
YK_INPUT.tap($("resetBtn"),()=>{if(confirm("セーブデータをすべて初期化しますか？"))YK_SAVE.reset()});
YK_INPUT.tap($("newGame"),()=>{state(YK_SAVE.fresh());if(typeof YK_WORLD==="undefined"||!YK_WORLD){$("title").classList.remove("show");busy=false;hud();map();return;}$("title").classList.remove("show");busy=false;hud();setTimeout(()=>talk({n:"夜叉姫",t:["ふふっ……今日も面白いことが起きそうね。","鬼灯の里へ行ってみましょう。"]}),200)});
YK_INPUT.tap($("continueGame"),()=>{const v=YK_SAVE.loadAuto();if(!v)return message("自動保存データがありません");restoreState(v);$("title").classList.remove("show");busy=false;hud()});
YK_INPUT.tap($("retryBtn"),()=>{restoreState(YK_SAVE.loadAuto()||YK_SAVE.fresh());$("gameover").classList.remove("show");busy=false;hud()});YK_INPUT.tap($("goTitleBtn"),()=>{$("gameover").classList.remove("show");$("title").classList.add("show");busy=true});
document.addEventListener("keydown",e=>{
 if(e.repeat||e.metaKey||e.ctrlKey||e.altKey)return;
 if(e.key==="Escape"){for(const id of ["worldMap","menu","saveMenu","settings"]){if($(id).classList.contains("show")){e.preventDefault();close(id);return;}}}
 if(["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName))return;
 const fn={Enter:()=>battle?cmd(["attack","skill","item","escape"][battleCursor]):action()}[e.key];
 if(fn){e.preventDefault();fn()}
});
$("app")?.addEventListener("contextmenu",e=>e.preventDefault());
window.addEventListener("error",e=>{
 // Safari/content-script/resource failures can surface as the opaque cross-origin
 // "Script error." with no filename or Error object. Do not present those as a game crash.
 const msg=String(e.message||"");
 const ownFile=typeof e.filename==="string"&&(/\/js\/|\/index\.html(?:\?|$)/).test(e.filename);
 const opaque=!e.error&&!e.filename&&(msg==="Script error."||msg==="Script error");
 if(opaque){console.warn("Ignored opaque external script error");return;}
 // Element/resource errors are handled by their individual loaders and are not runtime crashes.
 if(e.target&&e.target!==window){console.warn("Resource error",e.target);return;}
 console.error(e.error||e.message);
 busy=false;
 const loc=e.filename?(" @"+e.filename.split("/").pop()+":"+e.lineno):"";
 // If Safari provides no useful source attribution, log it but do not cover gameplay.
 if(!ownFile&&!e.error&&!loc){console.warn("Unattributed runtime error",msg);return;}
 message("復旧: "+String(e.message||e.error||"不明なエラー").slice(0,55)+loc,6000);
});
function titleHero(){const c=$("titleHero"),q=c?.getContext("2d");if(!q)return;q.clearRect(0,0,c.width,c.height);hero(q,210,425,"d",1,"normal",3.1)}
function loop(t){if(!busy){if(debugMotion){if(t-debugMotion.at>=144){debugMotion=null;S.frame=1;}map();}S.playtime+=Math.min((t-last)/1000,.25);if(S.frame!==1&&t-lastMoved>180){S.frame=1;map()}}last=t;requestAnimationFrame(loop)}
titleHero();hud();requestAnimationFrame(loop);

// DEBUG MAP — isolated from story/save state.
// Uses the analyzed orthogonal map-chip sheets directly.
const DEBUG_PAGES=["landscape","landscape2x","terrainAssets","landmarks","landmarks2x","placeAssets","autotile","autotile2x","connections","assets32","overview","shore","water","ground","road"];
const DEBUG_ASSETS={
 ground:{src:"assets/terrain/world-ortho-ground-v2.png?v=2",fallback:"assets/terrain/world-ortho-ground-v1.png",size:[256,128]},
 road:{src:"assets/terrain/world-ortho-road-v2.png?v=2",fallback:"assets/terrain/world-ortho-road-v1.png",size:[128,128]},
 shore:{src:"assets/terrain/world-ortho-shore-v1.png",size:[128,128]},
 forest:{src:"assets/terrain/world-ortho-forest-v1.png",size:[192,128]},
 mountain:{src:"assets/terrain/world-ortho-mountain-v1.png",size:[288,192]},
 landmarks:{src:"assets/terrain/world-ortho-landmarks-v1.png",size:[384,192]},
 water:{src:"assets/terrain/water-autotile-32-v5.png?v=5",size:[256,256]}
};
const DEBUG_ART={},DEBUG_FALLBACK={};
for(const [key,spec] of Object.entries(DEBUG_ASSETS)){
 const im=new Image();
 const useFallback=()=>{
  if(!spec.fallback){window.__YK_DEBUG_ATLAS_ERROR=key;if(S.area==="debugField")map();return;}
  const fb=new Image();
  fb.onload=()=>{DEBUG_FALLBACK[key]=true;DEBUG_ART[key]=fb;if(S.area==="debugField")map()};
  fb.onerror=()=>{window.__YK_DEBUG_ATLAS_ERROR=key;if(S.area==="debugField")map()};
  fb.src=spec.fallback;
 };
 im.onload=()=>{
  if(spec.size&&(im.naturalWidth!==spec.size[0]||im.naturalHeight!==spec.size[1])){useFallback();return;}
  DEBUG_ART[key]=im;if(S.area==="debugField")map();
 };
 im.onerror=useFallback;im.src=spec.src;DEBUG_ART[key]=im;
}
const debugReady=key=>{const im=DEBUG_ART[key];return !!(im&&im.complete&&im.naturalWidth>0)};
const debugAllReady=()=>["ground","road","shore","forest","mountain","landmarks"].every(debugReady);
const debug32=(c,key,cols,slot,x,y)=>{const im=DEBUG_ART[key];c.drawImage(im,(slot%cols)*32,Math.floor(slot/cols)*32,32,32,x,y,32,32)};
const debugSprite=(c,key,cols,slot,w,h,footX,footY,anchorX=w/2,anchorY=h-8)=>{const im=DEBUG_ART[key];c.drawImage(im,(slot%cols)*w,Math.floor(slot/cols)*h,w,h,footX-anchorX,footY-anchorY,w,h)};
const debugShoreSlot=(x,y,isWater)=>{
 const w=(dx,dy)=>isWater(x+dx,y+dy);
 const n=w(0,-1),e=w(1,0),so=w(0,1),we=w(-1,0);
 if(n&&e)return 4;if(e&&so)return 5;if(so&&we)return 6;if(we&&n)return 7;
 if(n)return 0;if(e)return 1;if(so)return 2;if(we)return 3;
 if(w(1,-1))return 8;if(w(1,1))return 9;if(w(-1,1))return 10;if(w(-1,-1))return 11;
 return null;
};

function drawDebugOverview(c){
 if(!debugAllReady())return false;
 const cell=32,ox=48,oy=100,cols=20,rows=17;
 c.fillStyle="#102631";c.fillRect(0,0,768,768);
 c.textAlign="left";c.textBaseline="alphabetic";

 const isWater=(x,y)=>x>=16||(x>=14&&y>=4&&y<=12)||(x>=13&&y>=7&&y<=10);

 // Analyzed ground chips are transparent overlays. Build an opaque biome base first.
 // The current SHORE atlas is intentionally NOT used here: it is a thin inspection overlay,
 // not a convincing finished coast. Overview therefore tests a 1-cell sand beach band.
 const inBounds=(x,y)=>x>=0&&y>=0&&x<cols&&y<rows;
 const waterAt=(x,y)=>inBounds(x,y)&&isWater(x,y);
 const isBeach=(x,y)=>{
  if(!inBounds(x,y)||isWater(x,y))return false;
  return waterAt(x+1,y)||waterAt(x-1,y)||waterAt(x,y+1)||waterAt(x,y-1);
 };

 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const dx=ox+x*cell,dy=oy+y*cell;
  if(isWater(x,y))c.fillStyle="#397b87";
  else if(isBeach(x,y))c.fillStyle="#d6bd72";
  else c.fillStyle="#91b85a";
  c.fillRect(dx,dy,cell+.5,cell+.5);
 }

 // Ground overlays remain on grass and water; beach is deliberately plain in this debug view
 // because no production-quality beach chip has been validated yet.
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const dx=ox+x*cell,dy=oy+y*cell;
  if(isBeach(x,y))continue;
  const slot=isWater(x,y)?8+((x*3+y*5)&7):(x+y*3)%8;
  debug32(c,"ground",8,slot,dx,dy);
 }

 // Road network: enough grammar to inspect straight, cross and bend continuity.
 for(let x=2;x<=10;x++)debug32(c,"road",4,0,ox+x*cell,oy+10*cell);
 for(let y=7;y<=14;y++)debug32(c,"road",4,1,ox+7*cell,oy+y*cell);
 debug32(c,"road",4,10,ox+7*cell,oy+10*cell);
 debug32(c,"road",4,2,ox+10*cell,oy+10*cell);
 debug32(c,"road",4,3,ox+10*cell,oy+11*cell);
 for(let y=11;y<=14;y++)debug32(c,"road",4,1,ox+10*cell,oy+y*cell);

 // Mountain cluster. Ground-foot stays 32px even though art overhangs.
 const mountains=[
  [1,2,0],[2,2,1],[3,2,2],
  [1,3,3],[2,3,4],[3,3,5],
  [7,2,0],[8,2,1],[7,3,3],[8,3,4]
 ];
 for(const [x,y,slot] of mountains)
  debugSprite(c,"mountain",3,slot,96,96,ox+x*cell+16,oy+(y+1)*cell,48,86);

 // Forest cluster with deliberate overlap, matching the 32px logical foot rhythm.
 const forests=[
  [2,5,0],[3,5,1],[4,5,2],
  [3,6,3],[4,6,4],[5,6,5],
  [4,7,1],[5,7,2],[6,7,0]
 ];
 for(const [x,y,slot] of forests)
  debugSprite(c,"forest",3,slot,64,64,ox+x*cell+16,oy+(y+1)*cell,32,56);

 // Landmark at the end of the branch for world-scale comparison.
 debugSprite(c,"landmarks",4,0,96,96,ox+10*cell+16,oy+15*cell,48,86);

 // Player in a practical comparison scale.
 hero(c,S.x,S.y,S.dir,S.frame,S.outfit,.56);

 // Grid is drawn last so bad crops, seams and anchors remain obvious.
 c.save();c.strokeStyle="rgba(255,255,255,.10)";c.lineWidth=1;
 for(let x=0;x<=cols;x++){c.beginPath();c.moveTo(ox+x*cell+.5,oy);c.lineTo(ox+x*cell+.5,oy+rows*cell);c.stroke()}
 for(let y=0;y<=rows;y++){c.beginPath();c.moveTo(ox,oy+y*cell+.5);c.lineTo(ox+cols*cell,oy+y*cell+.5);c.stroke()}
 c.restore();

 c.save();c.textAlign="left";c.textBaseline="alphabetic";
 c.fillStyle="rgba(7,20,29,.92)";c.fillRect(48,22,470,54);
 c.strokeStyle="#d5b36b";c.strokeRect(48.5,22.5,469,53);
 c.fillStyle="#fff3c4";c.font="bold 18px sans-serif";c.fillText("32px 実チップ接続テスト",62,44);
 c.font="12px sans-serif";c.fillStyle="#d9d2b0";c.fillText("草原 / 山 / 森 / 道 / 海岸　A:表示切替　B:タイトル",62,63);
 c.restore();

 worldHint("十字キーで移動 · 1マス=32px · 継ぎ目/境界/実寸を確認");
 return true;
}
function drawDebugSheet(c,key,cols,rows,sw=32,sh=32){
 const im=DEBUG_ART[key];if(!debugReady(key))return false;
 const semantic={
  shore:["N","E","S","W","NE","SE","SW","NW","inNE","inSE","inSW","inNW","unused","unused","unused","unused"],
  ground:["grass","grass detail","","","","","","","water","water detail","","","","","","","bridge H","bridge V"],
  road:["H","V","NE","SE","SW","NW","T-N","T-E","T-S","T-W","X","end N","end E","end S","end W","unused"]
 };
 c.fillStyle="#17313a";c.fillRect(0,0,768,768);
 c.textAlign="left";c.textBaseline="alphabetic";
 c.fillStyle="#fff3c4";c.font="bold 23px sans-serif";c.fillText("DEBUG "+key.toUpperCase()+" — analyzed",36,40);
 const maxW=700,maxH=600,scale=Math.max(1,Math.floor(Math.min(maxW/(cols*sw),maxH/(rows*sh))));
 const dw=sw*scale,dh=sh*scale,totalW=cols*dw,totalH=rows*dh,ox=(768-totalW)/2,oy=86;
 for(let i=0;i<cols*rows;i++){
  const sx=(i%cols)*sw,sy=Math.floor(i/cols)*sh,x=ox+(i%cols)*dw,y=oy+Math.floor(i/cols)*dh;

  // Transparent atlas pages need a visible substrate to reveal what each chip actually contains.
  if(key==="ground"){
   c.fillStyle=i>=8&&i<16?"#397b87":"#91b85a";c.fillRect(x,y,dw,dh);
  }else if(key==="shore"){
   c.fillStyle="#91b85a";c.fillRect(x,y,dw,dh);
  }else if(key==="water"){
   c.fillStyle="#397b87";c.fillRect(x,y,dw,dh);
  }else{
   c.fillStyle="#244435";c.fillRect(x,y,dw,dh);
  }

  c.drawImage(im,sx,sy,sw,sh,x,y,dw,dh);
  c.strokeStyle="rgba(255,245,190,.45)";c.strokeRect(x+.5,y+.5,dw-1,dh-1);
  c.fillStyle="rgba(5,15,22,.74)";c.fillRect(x+2,y+2,Math.min(dw-4,74),20);
  c.fillStyle="#fff3c4";c.font="11px sans-serif";
  const label=semantic[key]?.[i]||String(i);
  c.fillText(i+" "+label,x+7,y+16);
 }
 worldHint("A：次の表示へ · B：タイトルへ戻る");
 return true;
}
const DEBUG_TERRAIN=window.YK_AUTOTILE?.fixture();
function drawDebugAutotile(c,page){
 const a=window.YK_AUTOTILE;
 c.fillStyle="#102631";c.fillRect(0,0,768,768);c.textAlign="left";c.textBaseline="alphabetic";
 if(!a){c.fillStyle="#fff3c4";c.font="20px sans-serif";c.fillText("地形モジュールを再読込してください",48,360);return;}
 a.load(()=>{if(S.area==="debugField")map();});
 if(!a.ready()){
  c.fillStyle="#fff3c4";c.font="20px sans-serif";c.fillText(Object.keys(a.errors).length?"地形画像エラー："+Object.keys(a.errors).join(","):"新しい地形を読込中…",48,360);
  worldHint("B：タイトルへ戻る");return;
 }
 const zoom=page==="autotile2x"?2:1;
 c.save();c.beginPath();c.rect(48,100,640,544);c.clip();
 if(page==="assets32"){
  a.keys.forEach((key,i)=>{
   const x=55+(i%5)*126,y=110+Math.floor(i/5)*240;
   for(let yy=0;yy<180;yy+=8)for(let xx=0;xx<112;xx+=8){c.fillStyle=((xx+yy)/8)%2?"#38505a":"#536773";c.fillRect(x+xx,y+yy,8,8);}
   a.drawAsset(c,key,x+40,y+4,32);a.drawAsset(c,key,x+8,y+58,96);
   c.fillStyle="#fff3c4";c.font="13px monospace";c.fillText(key.replace('forest_','').replace('grass_base','grass'),x,y+207);
  });
 }else if(page==="connections"){
  c.fillStyle="#80b348";c.fillRect(48,100,640,544);
  for(let mask=0;mask<16;mask++){
   const x=68+(mask%4)*154,y=118+Math.floor(mask/4)*128;
   const n={n:!!(mask&1),e:!!(mask&2),s:!!(mask&4),w:!!(mask&8)};
   c.save();c.translate(x,y);c.scale(2,2);a.drawCell(c,"forest",n,0,0);c.restore();
   c.fillStyle="#112b20";c.font="14px monospace";c.fillText("NESW "+[n.n,n.e,n.s,n.w].map(Number).join(""),x,y+87);
  }
 }else{
  const pos=debugDrawPosition();
  const cameraX=zoom===2?clamp(pos.x-48-160,0,320):0,cameraY=zoom===2?clamp(pos.y-100-136,0,272):0;
  c.translate(48,100);c.scale(zoom,zoom);c.translate(-cameraX,-cameraY);
  a.drawScene(c,DEBUG_TERRAIN,{foot:pos.y-100,draw:()=>hero(c,pos.x-48,pos.y-100,S.dir,S.frame,S.outfit,.56)});
 }
 c.restore();
 c.fillStyle="#fff3c4";c.font="bold 24px sans-serif";c.fillText(page==="assets32"?"32×32 PNG / 実寸と3倍・透明確認":page==="connections"?"森：16接続パターン":("森のサイズ比較 / "+zoom+"倍"),48,45);
 c.font="16px sans-serif";c.fillStyle="#d9d2b0";c.fillText(page==="connections"||page==="assets32"?"旧32px素材：接続構造の確認用":"移動マス32px / 樹冠80px / 夜叉姫との比率を確認",48,75);
 c.font="15px sans-serif";c.fillText("A：全体 → 2倍 → 接続 → PNG一覧 → 旧素材　B：戻る",48,690);
 c.fillStyle="#aec2c8";c.font="14px sans-serif";c.fillText("32px歩行・森に当たり判定あり / 旧素材の比較用",48,720);
 worldHint(page==="connections"?"森9素材で構成する16接続 / 斜め凹角は次工程":"十字キーで夜叉姫を移動 · 本編の記録は変更しません");
}

const DEBUG_LANDSCAPE=window.YK_LANDSCAPE?.fixture(),DEBUG_PLACES=window.YK_LANDSCAPE?.placesFixture();
function debugCollisionMap(){
 const page=DEBUG_PAGES[window.__YK_DEBUG_PAGE||0];
 return ['landscape','landscape2x'].includes(page)?DEBUG_LANDSCAPE:['landmarks','landmarks2x'].includes(page)?DEBUG_PLACES:['autotile','autotile2x'].includes(page)?DEBUG_TERRAIN:null;
}
function debugSafePosition(){
 const m=debugCollisionMap();if(!m)return;
 if(YK_LANDSCAPE.walkable(m,S.x-48,S.y-100))return;
 let best=null,dist=Infinity;
 for(let y=16;y<544;y+=16)for(let x=16;x<640;x+=16){const d=Math.hypot(x-(S.x-48),y-(S.y-100));if(d<dist&&YK_LANDSCAPE.walkable(m,x,y)){best=[x,y];dist=d;}}
 if(best){S.x=best[0]+48;S.y=best[1]+100;}
}
function debugDrawPosition(){
 if(!debugMotion)return {x:S.x,y:S.y};
 const t=clamp((performance.now()-debugMotion.at)/144,0,1);
 return {x:debugMotion.x+(S.x-debugMotion.x)*t,y:debugMotion.y+(S.y-debugMotion.y)*t};
}
function moveDebug(dx,dy,dir){
 if(dx&&dy||!debugCollisionMap()||debugMotion)return;
 S.dir=dir;const x=S.x,y=S.y;
 // Sweep a full 32px stride in 2px increments, stopping before a footprint.
 for(let i=0;i<16;i++){const nx=S.x+Math.sign(dx)*2,ny=S.y+Math.sign(dy)*2;if(collision(nx,ny))break;S.x=nx;S.y=ny;}
 if(S.x!==x||S.y!==y){debugMotion={x,y,at:performance.now()};walkPhase=(walkPhase+1)%4;S.frame=[0,2,0,2][walkPhase];lastMoved=performance.now();}
 else S.frame=1;
 map();
}
function drawDebugLandscape(c,page){
 const land=window.YK_LANDSCAPE,a=window.YK_AUTOTILE;
 c.fillStyle="#102631";c.fillRect(0,0,768,768);c.textAlign="left";c.textBaseline="alphabetic";
 const redraw=()=>{if(S.area==="debugField")map();};land.load(redraw);a.load(redraw);
 if(!land.ready()||!a.ready()){c.fillStyle="#fff3c4";c.font="20px sans-serif";c.fillText(Object.keys({...land.errors,...a.errors}).length?"地形画像の読込エラー":"新しい地形を読込中…",48,360);worldHint("B：タイトルへ戻る");return;}
 const zoom=page==="landscape2x"||page==="landmarks2x"?2:1;
 const places=["landmarks","landmarks2x","placeAssets"].includes(page);
 c.save();c.beginPath();c.rect(48,100,640,544);c.clip();
 if(page==="terrainAssets"||page==="placeAssets"){
  (places?land.placeKeys:land.keys.filter(k=>k!=="grass"&&!land.placeKeys.includes(k))).forEach((k,i)=>{
   const x=65+i%3*205,y=104+Math.floor(i/3)*134;
   for(let yy=0;yy<100;yy+=8)for(let xx=0;xx<176;xx+=8){c.fillStyle=((xx+yy)/8)%2?"#38505a":"#536773";c.fillRect(x+xx,y+yy,8,8);}
   const [w,h]=land.specs[k];land.drawAsset(c,k,x+(176-w)/2,y+(96-h)/2,w,h);
   c.fillStyle="#fff3c4";c.font="16px sans-serif";c.fillText(({village:"村",town:"町",hermit:"仙人の庵",jizo:"地蔵",cave:"洞窟入口",torii:"鳥居",greenMountain:"緑の山",rockMountain:"岩山",snowMountain:"雪山",shrine:"祠",lantern:"石灯籠",bridge:"木橋",flowers:"花と草むら",road:"土の道",water:"海・川の水面",snow:"雪原",barren:"荒地",sand:"砂浜"})[k],x,y+123);
  });
 }else{
  const pos=debugDrawPosition();
  const cx=zoom===2?clamp(pos.x-48-160,0,320):0,cy=zoom===2?clamp(pos.y-100-136,0,272):0;
  c.translate(48,100);c.scale(zoom,zoom);c.translate(-cx,-cy);
  land.draw(c,places?DEBUG_PLACES:DEBUG_LANDSCAPE,{foot:pos.y-100,draw:()=>hero(c,pos.x-48,pos.y-100,S.dir,S.frame,S.outfit,.56)});
 }
 c.restore();c.fillStyle="#fff3c4";c.font="bold 24px sans-serif";c.fillText(page==="terrainAssets"||page==="placeAssets"?"素材一覧 / 透過確認":(places?"集落と拠点 / ":"地形と道 / ")+zoom+"倍",48,45);
 c.font="16px sans-serif";c.fillStyle="#d9d2b0";c.fillText(places?"村・町・仙人の庵・地蔵・洞窟・鳥居":"地形のつながり / 土の道・砂浜・橋・祠",48,75);
 c.font="15px sans-serif";c.fillText("A：地形 → 2倍 → 素材 → 集落と拠点 → 比較　B：戻る",48,690);
 c.font="14px sans-serif";c.fillStyle="#aec2c8";c.fillText("32px歩行・当たり判定あり / 水辺は橋で渡れます",48,720);
 worldHint("十字キーで夜叉姫を移動 · 本編の記録は変更しません");
}

function drawDebugField(c){
 c.clearRect(0,0,768,768);c.imageSmoothingEnabled=false;
 const page=DEBUG_PAGES[window.__YK_DEBUG_PAGE||0];
 if(["landscape","landscape2x","terrainAssets","landmarks","landmarks2x","placeAssets"].includes(page)){drawDebugLandscape(c,page);return;}
 if(["autotile","autotile2x","connections","assets32"].includes(page)){drawDebugAutotile(c,page);return;}
 const key=page==="road"?"road":"ground";
 if(!debugReady(key)||(page==="overview"&&!debugAllReady())){
  c.fillStyle="#102631";c.fillRect(0,0,768,768);c.fillStyle="#fff3c4";c.font="20px sans-serif";
  c.fillText(window.__YK_DEBUG_ATLAS_ERROR?("DEBUG asset error: "+window.__YK_DEBUG_ATLAS_ERROR):"DEBUG assets loading…",210,380);
  worldHint("DEBUG素材読込中 · Bでタイトルへ戻る");return;
 }
 if(page==="overview")drawDebugOverview(c);
 else if(page==="shore")drawDebugSheet(c,"shore",4,4,32,32);
 else if(page==="water")drawDebugSheet(c,"water",8,8,32,32);
 else if(page==="ground")drawDebugSheet(c,"ground",8,4,32,32);
 else drawDebugSheet(c,"road",4,4,32,32);
}
window.YKDebugField=(enabled=true)=>{
 if(enabled&&S.area==="debugField")return true;
 YK_INPUT.stopAll();debugMotion=null;
 const hudEl=$("hud"),objectiveEl=$("objective");
 document.querySelectorAll(".dpad .diagonal").forEach(b=>{b.style.visibility=enabled?"hidden":"visible"});
 if(hudEl)hudEl.style.display=enabled?"none":"";
 if(objectiveEl)objectiveEl.style.display=enabled?"none":"";
 if(enabled){
  window.__YK_DEBUG_RETURN=JSON.parse(JSON.stringify(S));
  window.__YK_DEBUG_PAGE=0;S.area="debugField";S.x=352;S.y=612;S.dir="u";S.frame=1;busy=false;
  $("title")?.classList.remove("show");map();return true;
 }
 const r=window.__YK_DEBUG_RETURN||{area:"field",x:YK_WORLD?.start?.[0]||230,y:YK_WORLD?.start?.[1]||534,dir:"d"};
 S=window.gameState=JSON.parse(JSON.stringify(r));$("title")?.classList.add("show");busy=true;map();return false;
};
const debugMapBtn=document.getElementById("debugMap");
if(debugMapBtn){debugMapBtn.addEventListener("click",(e)=>{e.preventDefault();e.stopPropagation();window.YKDebugField(true);});}

const villageTestWarpBtn=document.getElementById("villageTestWarp");
if(villageTestWarpBtn){
  villageTestWarpBtn.addEventListener("pointerup",(e)=>{
    e.preventDefault();
    e.stopPropagation();
    S.area="village";
    S.x=382;
    S.y=405;
    S.dir="u";
    S.frame=0;
    busy=false;
    battle=null;
    $("title")?.classList.remove("show");
    $("gameover")?.classList.remove("show");
    hud();
    message("鬼灯の里：配置・当たり判定テスト",1800);
    console.assert(S.area==="village","Village test warp failed");
  },{passive:false});
}

})();

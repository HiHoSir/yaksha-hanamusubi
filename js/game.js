// beta15.28: registered walking garments and dedicated battle poses
(()=>{
"use strict";
const $=id=>document.getElementById(id),C=$("game"),g=C.getContext("2d"),BC=$("battleCanvas"),bg=BC.getContext("2d"),WC=$("worldCanvas"),wg=WC.getContext("2d");
window.gameState=YK_SAVE.fresh();let S=window.gameState,busy=true,battle=null,battleCursor=0,battleLocked=false,dialogQueue=[],dialogAfter=null,msgTimer=0,last=performance.now();
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
loadNpcAssetSet();
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
 for(const pose of ["attack","hit"]){const im=new Image();im.onload=assetLoaded;im.src=`assets/characters/yashahime/battle-v9/${outfit}-${pose}.png`;BATTLE_SPRITES[outfit][pose]=im;}
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
const B9EN={};["redoni","crowtengu","umibozu","ninefox","yokai_flower"].forEach(n=>{const im=new Image();im.onload=assetLoaded;im.src=`assets/enemies/${n}.png`;B9EN[n]=im});
const ENEMY_ART={};["field-oni","field-tanuki"].forEach(n=>{const im=new Image();im.onload=assetLoaded;im.src=`assets/enemies/standard/${n}.png`;ENEMY_ART[n]=im});
const RARE_ART={};
for(const r of Object.values(YK_DATA.rareKinds)){if(!r.art)continue;RARE_ART[r.id]={};for(const state of ["intact","worn"]){const im=new Image();im.onload=assetLoaded;im.src=`assets/enemies/variants/${r.art}${state==="worn"?"-worn":""}.png`;RARE_ART[r.id][state]=im;}}
function rareReady(r){return !!r&&layerReady(RARE_ART[r.id]?.intact)&&layerReady(RARE_ART[r.id]?.worn);}
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
     const safe={field:YK_WORLD.hub,village:[373,690],shrine:[70,430],cove:[70,430],forest:[70,430],waterfall:[70,600],hotspring:[70,430],fox:[70,430]}[area]||[384,500];
     S.x=safe[0];S.y=safe[1];
   }
 }
 S.frame=1;return S;
}
function restoreState(v){state(v);stabilizeLoadedState();YK_SAVE.auto(S);return S}
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
let terrainReady=false;
const worldAtlas=new Image();
worldAtlas.onload=()=>{terrainReady=false;assetLoaded();};
worldAtlas.src="assets/maps/world-atlas-v15.33.png";
function drawWorldTerrain(c){
 const source=$("worldTerrain");
 if(!layerReady(worldAtlas)){YK_WORLD.draw(c,null);return;}
 if(!terrainReady){const tc=source.getContext("2d");tc.save();tc.scale(2,2);YK_WORLD.draw(tc,worldAtlas);tc.restore();terrainReady=true;}
 c.imageSmoothingEnabled=false;c.drawImage(source,0,0,768,768);
}
const fieldFrame=document.createElement("canvas");
fieldFrame.width=768;fieldFrame.height=768;
const fieldFrameCtx=fieldFrame.getContext("2d");
function drawRoundedField(c,source){
 // Closer bevel-view: readable hero/landmarks in the foreground, with the world
 // shrinking rapidly only in the distance and disappearing behind a curved horizon.
 const cx=384,anchor=474,horizon=126,strip=2;
 const sky=c.createLinearGradient(0,0,0,360);
 sky.addColorStop(0,"#8fb8ca");sky.addColorStop(.46,"#bdd2c6");sky.addColorStop(.78,"#dce1bc");sky.addColorStop(1,"#b6d17b");
 c.fillStyle=sky;c.fillRect(0,0,768,768);
 // Distant clouds.
 c.save();c.globalAlpha=.24;c.fillStyle="#f5efd0";
 for(const [x,y,rx,ry] of [[90,78,150,35],[350,61,190,42],[650,88,165,38]]){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
 c.restore();
 // Faint mountain silhouettes behind the horizon: atmosphere, not collision terrain.
 c.save();c.globalAlpha=.18;c.fillStyle="#668a72";
 c.beginPath();c.moveTo(-40,190);c.lineTo(70,130);c.lineTo(138,168);c.lineTo(235,105);c.lineTo(326,171);c.lineTo(430,118);c.lineTo(520,168);c.lineTo(635,112);c.lineTo(810,188);c.lineTo(810,245);c.lineTo(-40,245);c.closePath();c.fill();
 c.globalAlpha=.12;c.fillStyle="#527667";
 c.beginPath();c.moveTo(-30,215);c.lineTo(105,164);c.lineTo(205,205);c.lineTo(340,150);c.lineTo(468,210);c.lineTo(590,157);c.lineTo(800,214);c.lineTo(800,255);c.lineTo(-30,255);c.closePath();c.fill();c.restore();
 for(let sy=0;sy<768;sy+=strip){
  let dy=sy,scale=1.07,dh=strip+1,alpha=1;
  if(sy<anchor){
   const t=Math.max(0,Math.min(1,(anchor-sy)/(anchor-horizon)));
   const eased=t*t*(3-2*t);
   // Strong depth at distance, almost no perspective change around the hero.
   scale=1.07-.11*Math.pow(eased,1.25);
   dy=anchor-(anchor-sy)*(1-.28*Math.pow(eased,1.15));
   dh=strip*(1-.22*eased)+1.15;
   alpha=1-.68*Math.pow(t,1.6);
  }else{
   const near=Math.min(1,(sy-anchor)/294);scale=1.07+.025*near;
  }
  const dw=768*scale,dx=cx-dw/2;c.globalAlpha=alpha;c.drawImage(source,0,sy,768,strip,dx,dy,dw,dh);
 }
 c.globalAlpha=1;
 // Curved horizon mask: centre rises slightly and sides fall away, removing the straight filter seam.
 c.fillStyle="rgba(224,233,202,.34)";
 c.beginPath();c.moveTo(0,205);c.quadraticCurveTo(384,150,768,205);c.lineTo(768,270);c.quadraticCurveTo(384,218,0,270);c.closePath();c.fill();
 const veil=c.createLinearGradient(0,108,0,430);
 veil.addColorStop(0,"rgba(235,238,209,.62)");veil.addColorStop(.28,"rgba(224,233,201,.40)");veil.addColorStop(.58,"rgba(211,226,193,.17)");veil.addColorStop(1,"rgba(205,221,188,0)");
 c.fillStyle=veil;c.fillRect(0,102,768,350);
}function map(){
 g.clearRect(0,0,768,768);g.imageSmoothingEnabled=false;
 if(S.area==="field"){
  const camera=YK_WORLD.camera(S.x,S.y,S.dir);
  fieldFrameCtx.clearRect(0,0,768,768);fieldFrameCtx.imageSmoothingEnabled=false;
  fieldFrameCtx.save();fieldFrameCtx.scale(camera.zoom,camera.zoom);fieldFrameCtx.translate(-camera.x,-camera.y);
  drawWorldTerrain(fieldFrameCtx);drawActorsOn(fieldFrameCtx);fieldFrameCtx.restore();
  drawRoundedField(g,fieldFrame);
  const k=YK_WORLD.near(S.x,S.y);
  worldHint(k?"A："+YK_WORLD.places[k].name+"へ入る":"草原を渡って次の旅先へ · 地図で全体を確認");return;
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
 else if(YK_WORLD.places[S.area])worldHint("西の端からフィールドへ戻れます");
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
   if(a.kind==="hero")hero(c,S.x,S.y,S.dir,S.frame,S.outfit,S.area==="field"?.13:["village","teahouse","osumiHome"].includes(S.area)?.68:.92);
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

function hud(){const a=D.areas[S.area];$("hud").innerHTML=`HP ${S.hp}/${S.maxhp}<br>Lv.${S.lv}　${S.gold}文<br><span class="outfitHud">衣装：${D.outfits[S.outfit]?.name||"花守り装束"}${OUTFIT_READY[S.outfit]?"":"（制作中）"}</span>`;$("objective").textContent="目的： "+D.objectives[Math.min(S.quest,D.objectives.length-1)];map()}
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
function collision(x,y){if(x<27||x>741||y<34||y>736)return true;if(npcBlocked(x,y))return true;if(S.area==="village"&&villageBlocked(x,y))return true;if((S.area==="teahouse"||S.area==="osumiHome")&&interiorBlocked(x,y))return true;if(S.area==="field"){
  if(!YK_WORLD.walkable(x,y))return true;
}if(S.area==="waterfall"&&x>200&&x<565&&y<500)return true;return false}
function exitArea(){
 if(S.area==="teahouse"||S.area==="osumiHome")return null;
 if(S.area==="village"){
   const [x0,y0,x1,y1]=VILLAGE_LAYOUT.exit.rect;
   if(S.x>x0&&S.x<x1&&S.y>y0&&S.y<y1)return VILLAGE_LAYOUT.exit.to;
   if(inRect(S.x,S.y,VILLAGE_LAYOUT.northExit.rect))return VILLAGE_LAYOUT.northExit.to;
 }
 if(YK_WORLD.places[S.area]&&S.area!=="village"&&S.x<42)return "field";
 return null;
}
function move(dx,dy,dir){
 if(busy)return;
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
YK_INPUT.directions([[ $("up"),[0,-1] ],[ $("down"),[0,1] ],[ $("left"),[-1,0] ],[ $("right"),[1,0] ],[ $("upLeft"),[-1,-1] ],[ $("upRight"),[1,-1] ],[ $("downLeft"),[-1,1] ],[ $("downRight"),[1,1] ]],(x,y)=>{const dir=x<0?"l":x>0?"r":y<0?"u":"d";if(!battlePad(dir))move(x*22,y*22,dir);});
YK_INPUT.tap($("ok"),()=>battle?cmd(["attack","skill","item","escape"][battleCursor]):action());YK_INPUT.tap($("cancel"),()=>{for(const id of ["worldMap","menu","saveMenu","settings"]){if($(id).classList.contains("show")){close(id);return;}}});
YK_INPUT.tap($("dialogNext"),nextDialog);YK_INPUT.tap($("bookBtn"),menu);YK_INPUT.tap($("worldBtn"),worldMap);YK_INPUT.tap($("saveBtn"),()=>{if(busy)return;YK_INPUT.stopAll();busy=true;slots();$("saveMenu").classList.add("show")});YK_INPUT.tap($("settingsBtn"),()=>{if(busy)return;YK_INPUT.stopAll();busy=true;$("soundToggle").checked=S.sound;$("settings").classList.add("show")});
document.querySelectorAll("[data-close]").forEach(b=>YK_INPUT.tap(b,()=>close(b.dataset.close)));document.querySelectorAll("[data-cmd]").forEach((b,i)=>YK_INPUT.tap(b,()=>{selectCmd(i);cmd(b.dataset.cmd)}));
document.querySelectorAll("[data-hot]").forEach(b=>YK_INPUT.tap(b,()=>hotChoice(b.dataset.hot)));
$("soundToggle").addEventListener("change",e=>{S.sound=e.target.checked;YK_SAVE.auto(S)});
YK_INPUT.tap($("resetBtn"),()=>{if(confirm("セーブデータをすべて初期化しますか？"))YK_SAVE.reset()});
YK_INPUT.tap($("newGame"),()=>{state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;hud();setTimeout(()=>talk({n:"夜叉姫",t:["ふふっ……今日も面白いことが起きそうね。","鬼灯の里へ行ってみましょう。"]}),200)});
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
window.addEventListener("error",e=>{console.error(e.error||e.message);busy=false;message("操作を復旧しました",1500)});
function titleHero(){const c=$("titleHero"),q=c?.getContext("2d");if(!q)return;q.clearRect(0,0,c.width,c.height);hero(q,210,425,"d",1,"normal",3.1)}
function loop(t){if(!busy){S.playtime+=Math.min((t-last)/1000,.25);if(S.frame!==1&&t-lastMoved>180){S.frame=1;map()}}last=t;requestAnimationFrame(loop)}
titleHero();hud();requestAnimationFrame(loop);

// β15.26 field-test shortcut — inside the game scope so S/busy/hud are accessible.
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

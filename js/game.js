// beta14.2: production background-layer architecture + wardrobe preview
(()=>{
"use strict";
const $=id=>document.getElementById(id),C=$("game"),g=C.getContext("2d"),BC=$("battleCanvas"),bg=BC.getContext("2d"),WC=$("worldCanvas"),wg=WC.getContext("2d");
window.gameState=YK_SAVE.fresh();let S=window.gameState,busy=true,battle=null,battleCursor=0,dialogQueue=[],dialogAfter=null,msgTimer=0,last=performance.now();

const ASSET_PATHS={
 field:"assets/maps/field.png",village:"assets/maps/village.png",shrine:"assets/maps/shrine.png",
 cove:"assets/maps/cove.png",forest:"assets/maps/forest.png",waterfall:"assets/maps/waterfall.png",fox:"assets/maps/fox.png",hotspring:"assets/maps/hotspring.png",
 heroNormal:null,heroLight:null,
 heroSwimWhite:null,heroSwimNavy:null,
 heroYukata:null,heroDemon:null,
 npcSheet:null,hotScene:null,
 enemySheet:null,battle:null,
 world:"assets/scenes/world-map.png"
};
const IMG={}; for(const [k,v] of Object.entries(ASSET_PATHS)){const im=new Image();im.src=v;im.onload=()=>{if(!busy)hud()};IMG[k]=im}

// Production village background layers. Files are optional: until a finished PNG exists,
// the matching procedural fallback is drawn. This prevents placeholder art from silently
// becoming the final asset while allowing one layer at a time to be replaced.
const VILLAGE_LAYER_PATHS={
 ground:"assets/tiles/village-ground.png",
 buildings:"assets/buildings/village-buildings.png",
 nature:"assets/nature/village-nature.png",
 objects:"assets/objects/village-objects.png"
};
const VILLAGE_LAYERS={};
for(const [k,v] of Object.entries(VILLAGE_LAYER_PATHS)){
 const im=new Image(); im.src=v; VILLAGE_LAYERS[k]=im;
}
function layerReady(im){return !!(im&&im.complete&&im.naturalWidth&&im.naturalHeight)}
function drawFullLayer(c,im){if(!layerReady(im))return false;c.drawImage(im,0,0,768,768);return true}
const B9={
 village:"assets/maps/village.png",forest:"assets/maps/forest.png",
 world:"assets/scenes/world-map.png",battle:"assets/scenes/battle.png",
 hot:"assets/scenes/hotspring.png",dialogue:"assets/scenes/dialogue.png",
 title:"assets/ui/title-yashahime.png",outfits:"assets/ui/outfits.png"
};
const B9IMG={};for(const [k,v] of Object.entries(B9)){const im=new Image();im.src=v;B9IMG[k]=im}
const B9OUT={normal:"normal",light:"travel",white:"swimWhite",navy:"swimNavy",swimWhite:"swimWhite",swimNavy:"swimNavy",yukata:"yukata",demon:"battle"};
const OUTFIT_READY={normal:true,light:false,white:false,navy:false,yukata:false,demon:false};
const B9SPR={};["normal","battle","travel","swimWhite","swimNavy","yukata"].forEach(o=>{B9SPR[o]={};["down","left","right","up"].forEach(d=>{B9SPR[o][d]=[];for(let i=0;i<3;i++){const im=new Image();im.src=`assets/characters/yashahime/${o}_${d}_${i}.png`;B9SPR[o][d].push(im)}})});
const NPC_ROLES=["woman","teagirl","man","child","elder","merchant","ferryman","miko","guard","traveler","hotkeeper","crow"];
const B9NPC={};
NPC_ROLES.forEach(n=>{
  B9NPC[n]={legacy:null,frames:{}};
  const legacy=new Image(); legacy.src=`assets/characters/npc/${n}.png`; B9NPC[n].legacy=legacy;
  ["down","left","right","up"].forEach(d=>{
    B9NPC[n].frames[d]=[];
    for(let i=0;i<3;i++){
      const im=new Image(); im.src=`assets/characters/npc/${n}_${d}_${i}.png`;
      B9NPC[n].frames[d].push(im);
    }
  });
});
const B9EN={};["redoni","crowtengu","umibozu","ninefox","yokai_flower"].forEach(n=>{const im=new Image();im.src=`assets/enemies/${n}.png`;B9EN[n]=im});
function cover(c,im,w,h,alpha=1){if(!im||!im.complete||!im.naturalWidth)return false;const r=Math.max(w/im.naturalWidth,h/im.naturalHeight),sw=w/r,sh=h/r,sx=(im.naturalWidth-sw)/2,sy=(im.naturalHeight-sh)/2;c.save();c.globalAlpha=alpha;c.drawImage(im,sx,sy,sw,sh,0,0,w,h);c.restore();return true}
const D=YK_DATA, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const areaOrder=["village","shrine","cove","forest","waterfall","fox"];
function state(v){S=window.gameState=YK_SAVE.migrate(v)}
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
function drawVillageMap(c){
 // β14.2: fixed production layer order. Finished transparent PNGs can replace each
 // procedural fallback independently without changing collision geometry.
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
function enterInterior(area){S.area=area;S.x=384;S.y=625;S.dir="u";S.frame=0;YK_SAVE.auto(S);message(D.areas[area].name);hud()}
function leaveInterior(){S.area="village";if(S.lastInterior==="osumiHome"){S.x=598;S.y=452}else{S.x=620;S.y=272}S.dir="d";S.frame=0;YK_SAVE.auto(S);message("鬼灯の里");hud()}
function villageDoorAction(){
 if(S.area!=="village")return false;
 // β14.2: door interaction points are immediately in front of the rendered doors.
 if(Math.hypot(S.x-620,S.y-272)<38){S.lastInterior="teahouse";enterInterior("teahouse");return true}
 if(Math.hypot(S.x-598,S.y-452)<38){S.lastInterior="osumiHome";enterInterior("osumiHome");return true}
 return false
}

function shadow(c,x,y,rx=27,ry=10,a=.28){c.save();c.globalAlpha=a;c.fillStyle="#101820";c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.restore()}
function hero(c,x,y,dir="d",frame=0,outfit="normal",z=1){
 const requested=outfit||"normal"; const ready=!!OUTFIT_READY[requested]; const set=B9SPR[B9OUT[ready?requested:"normal"]||"normal"]; if(!set)return;
 const dk={d:"down",l:"left",r:"right",u:"up"}[dir]||"down";
 const frames=set[dk]||set.down;
 const idx=Math.max(0,Math.min(2,Number(frame)||0));
 const im=frames?.[idx];
 if(im&&im.complete&&im.naturalWidth){c.save();c.imageSmoothingEnabled=!!(im.naturalWidth>256);if(c.imageSmoothingEnabled)c.imageSmoothingQuality="high";const w=88*z,h=104*z;shadow(c,x,y+9*z,31*z,10*z,.32);c.drawImage(im,x-w/2,y-h*.82,w,h);if(!ready){c.font=`700 ${Math.max(10,10*z)}px sans-serif`;c.textAlign="center";c.lineWidth=Math.max(2,2*z);c.strokeStyle="#07131f";c.fillStyle="#ffd98a";c.strokeText("制作中",x,y-h*.88);c.fillText("制作中",x,y-h*.88)}c.restore()}
}function npc(c,x,y,type,name,dir="d",frame=1){
 const k={child:"child",woman:"woman",teagirl:"teagirl",man:"man",elder:"elder",merchant:"merchant",ferryman:"ferryman",miko:"miko",guard:"guard",traveler:"traveler",hotkeeper:"hotkeeper"}[type]||"woman";
 const dk={d:"down",l:"left",r:"right",u:"up"}[dir]||"down", set=B9NPC[k];
 const idx=Math.max(0,Math.min(2,Number(frame)||0));
 const candidate=set?.frames?.[dk]?.[idx];
 const im=(candidate&&candidate.complete&&candidate.naturalWidth)?candidate:set?.legacy;
 if(im&&im.complete&&im.naturalWidth){c.save();c.imageSmoothingEnabled=false;const scale=(k==="woman"||k==="teagirl")?1.04:1;const w=76*scale,h=91*scale;shadow(c,x,y+8,26*scale,8*scale,.25);c.drawImage(im,x-w/2,y-h*.79,w,h);c.restore()}
 c.font="600 12px sans-serif";c.textAlign="center";c.fillStyle="#fff";c.strokeStyle="#07131f";c.lineWidth=4;c.strokeText(name,x,y+36);c.fillText(name,x,y+36)
}function map(){
 g.clearRect(0,0,768,768);g.imageSmoothingEnabled=false;
 if(S.area==="village") drawVillageMap(g);
 else if(S.area==="teahouse") drawInterior(g,"tea");
 else if(S.area==="osumiHome") drawInterior(g,"home");
 else {const art=S.area==="forest"?B9IMG.forest:null;if(art&&art.complete&&art.naturalWidth)g.drawImage(art,0,0,768,768);else{const im=IMG[S.area]||IMG.field;if(im&&im.complete&&im.naturalWidth)g.drawImage(im,0,0,768,768);else{g.fillStyle="#274738";g.fillRect(0,0,768,768)}}}
 drawNPCs();hero(g,S.x,S.y,S.dir,S.frame,S.outfit,1.25)
}const NPCS={
 village:[
  {x:175,y:370,type:"child",name:"里の子",talk:["夜叉姫さま、おかえりなさい！","川べりに花びらが流れてきたよ。"]},
  {x:570,y:390,type:"merchant",name:"よろず屋",talk:["旅支度なら任せておくれ。","社へ行くなら、森道には気をつけな。"]},
  {id:"village-woman-osumi",x:300,y:565,type:"woman",name:"里の女・お澄",dir:"r",frame:1,role:"村仕事",talk:["夜叉姫さま、お帰りなさい。","今日は花染めの糸がよく乾きそうですね。"]},
  {id:"teahouse-girl-odango",x:686,y:315,type:"teagirl",name:"茶屋娘・お団子",dir:"d",frame:1,role:"茶屋",talk:["いらっしゃいませ！ 花見団子はいかがですか？","ひと休みしたら、天妖の社への坂道も楽になりますよ。"]},
  {x:455,y:270,type:"elder",name:"里長",talk:["天妖の社へ向かいなされ。","失われた想いを結ぶ鍵が、あそこに眠っております。"]}
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
function nearestNPC(max=92){let best=null,bd=max;for(const n of areaNPCs()){const dx=n.x-S.x,dy=n.y-S.y,d=Math.hypot(dx,dy);if(d>=bd)continue;const facing={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]}[S.dir]||[0,1],dot=(dx*facing[0]+dy*facing[1])/(d||1);if(dot<-.15)continue;best=n;bd=d}return best}
function npcBlocked(x,y){return areaNPCs().some(n=>Math.hypot(x-n.x,y-n.y)<48)}
function faceNPC(n){const dx=n.x-S.x,dy=n.y-S.y;if(Math.abs(dx)>Math.abs(dy)){S.dir=dx>0?"r":"l";n.dir=dx>0?"l":"r"}else{S.dir=dy>0?"d":"u";n.dir=dy>0?"u":"d"}}

function hud(){const a=D.areas[S.area];$("hud").innerHTML=`HP ${S.hp}/${S.maxhp}<br>Lv.${S.lv}　${S.gold}文<br><span class="outfitHud">衣装：${D.outfits[S.outfit]?.name||"花守り装束"}${OUTFIT_READY[S.outfit]?"":"（制作中）"}</span>`;$("objective").textContent="目的： "+D.objectives[Math.min(S.quest,D.objectives.length-1)];map()}
function message(t,ms=1300){clearTimeout(msgTimer);$("message").textContent=t;$("message").style.display="block";msgTimer=setTimeout(()=>$("message").style.display="none",ms)}
function inRect(x,y,r){return x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3]}
const VILLAGE_BUILDINGS=[
 // rendered footprint + small safety padding
 [26,116,258,276],   // inn / NW
 [498,128,742,284],  // teahouse / NE
 [516,255,723,371]   // Osumi home / SE
];
function villageBlocked(x,y){
 const r=12;
 if(x<r||y<r||x>768-r||y>768-r)return true;
 const hit=(a,b,c,d)=>{
   const qx=Math.max(a,Math.min(x,c)),qy=Math.max(b,Math.min(y,d));
   return (x-qx)*(x-qx)+(y-qy)*(y-qy)<r*r;
 };
 const buildings=[[26,116,258,276],[498,96,742,250],[494,312,701,430]];
 if(buildings.some(v=>hit(v[0],v[1],v[2],v[3])))return true;
 // river/canal: only the central bridge corridor is traversable.
 if(hit(0,477,768,585)){
   if(!(x>=312&&x<=456))return true;
 }
 return false;
}
function collision(x,y){if(x<27||x>741||y<34||y>736)return true;if(npcBlocked(x,y))return true;if(S.area==="village"&&villageBlocked(x,y))return true;if((S.area==="teahouse"||S.area==="osumiHome")&&interiorBlocked(x,y))return true;if(S.area==="field"&&y>605)return true;if(S.area==="waterfall"&&x>200&&x<565&&y<500)return true;return false}
function exitArea(){if(S.area==="teahouse"||S.area==="osumiHome")return null;if(S.x<42)return "field";if(S.x>726){const m={field:"village",village:"shrine",shrine:"cove",cove:"forest",forest:"waterfall",waterfall:"hotspring",hotspring:"fox",fox:"field"};return m[S.area]}return null}
function move(dx,dy,dir){if(busy)return;S.dir=dir;const sp=Number($("speedSelect").value)||1,nx=S.x+dx*sp,ny=S.y+dy*sp;if(collision(nx,ny))return;S.x=clamp(nx,27,741);S.y=clamp(ny,34,736);S.frame=(S.frame+1)%3;S.walk++;S.encounterSteps++;if(S.encounterGrace>0)S.encounterGrace--;const ex=exitArea();if(ex&&ex!==S.area){S.area=ex;S.x=ex==="field"?690:70;S.y=430;S.encounterSteps=0;message(D.areas[ex].name);YK_SAVE.auto(S)}else encounter();hud();if(S.walk%10===0)YK_SAVE.auto(S)}
function encounter(){const a=D.areas[S.area];if(!a?.encounter||S.encounterGrace>0||S.encounterSteps<a.min)return;if(Math.random()<a.encounter){S.encounterSteps=0;startBattle()}}
function talk(o){busy=true;dialogQueue=[...o.t];dialogAfter=typeof o.after==="function"?o.after:null;$("speaker").textContent=o.n;$("dialog").classList.add("show");nextDialog()}
function nextDialog(){if(!dialogQueue.length){$("dialog").classList.remove("show");const after=dialogAfter;dialogAfter=null;busy=false;if(after)after();hud();return}$("dialogText").textContent=dialogQueue.shift()}
function teaService(n){const price=5,need=S.hp<S.maxhp;if(!need){talk({n:n.name,t:[...n.talk,"顔色もよさそうですね。お団子は旅の帰りにでもどうぞ！"]});return}if(S.gold<price){talk({n:n.name,t:[...n.talk,`お茶と花見団子は${price}文ですが……今日は香りだけでもどうぞ。`]});return}talk({n:n.name,t:[...n.talk,`お茶と花見団子、${price}文です。ゆっくりしていってくださいね。`],after:()=>{S.gold-=price;S.hp=Math.min(S.maxhp,S.hp+30);S.teaVisits=(S.teaVisits||0)+1;YK_AUDIO.beep(620,.1);YK_SAVE.auto(S);message("お茶と団子でHPが30回復した。",1800)}})}
function action(){if(busy)return;if(interiorDoorAction())return;if(villageDoorAction())return;const n=nearestNPC();if(n){faceNPC(n);hud();if(n.id==="teahouse-girl-odango"||n.id==="teahouse-girl-odango-inside")teaService(n);else talk({n:n.name,t:n.talk});if(S.area!=="hotspring"){S.quest=Math.min(5,S.quest+1);YK_SAVE.auto(S)}return}if(S.area==="hotspring"){openHotSpring();return}message("近くに話せる相手はいない。")}
function openHotSpring(){busy=true;$("hotSpring").classList.add("show");$("hotSpringText").textContent="湯気の向こうで、花びらが静かに揺れている。";const im=B9IMG.hot,cv=$("hotSpringCanvas"),cx=cv.getContext("2d");cx.clearRect(0,0,768,430);if(im&&im.complete&&im.naturalWidth)cx.drawImage(im,0,0,768,430)}
function hotChoice(choice){if(choice==="bath"){S.hp=S.maxhp;$("hotSpringText").textContent="ゆっくり湯につかった。HPが全回復した。";YK_AUDIO.beep(620,.12);YK_SAVE.auto(S);hud()}else if(choice==="overheat"){S.hp=Math.max(1,S.hp-10);$("hotSpringText").textContent="少し長湯しすぎた……。HPが10減った。";YK_AUDIO.beep(130,.12);YK_SAVE.auto(S);hud()}else{$("hotSpring").classList.remove("show");busy=false;hud()}}
function startBattle(){const pool=D.enemies[S.area]||D.enemies.field,e=pool[Math.floor(Math.random()*pool.length)];battle={name:e[0],hp:e[1],max:e[1],atk:e[2],xp:e[3],gold:e[4]};S.battles++;busy=true;battleCursor=0;$("battle").classList.add("show");renderBattle();selectCmd(0);YK_AUDIO.beep(170,.12,"sawtooth")}
function enemyArt(c,x,y){
 const k=S.area==="fox"?"ninefox":S.area==="waterfall"?"umibozu":S.area==="forest"?"crowtengu":"redoni",im=B9EN[k];
 if(im&&im.complete&&im.naturalWidth){c.save();c.imageSmoothingEnabled=false;c.drawImage(im,x-116,y-108,232,232);c.restore()}
}function renderBattle(){
 bg.clearRect(0,0,768,430);bg.imageSmoothingEnabled=false;
 const im=B9IMG.battle;if(im&&im.complete&&im.naturalWidth)bg.drawImage(im,0,0,768,430);else{bg.fillStyle="#14283d";bg.fillRect(0,0,768,430)}
 // Darken lower UI baked into reference so live battle UI remains readable.
 bg.fillStyle="rgba(5,15,25,.48)";bg.fillRect(0,315,768,115);
 hero(bg,150,275,"r",S.frame,S.outfit,2.0);enemyArt(bg,585,225);
 $("enemyName").textContent=battle.name;$("enemyHp").textContent=Math.max(0,battle.hp)+"/"+battle.max;$("battleHp").textContent=S.hp+"/"+S.maxhp
}
function selectCmd(i){battleCursor=(i+4)%4;document.querySelectorAll("[data-cmd]").forEach((b,n)=>b.classList.toggle("selected",n===battleCursor))}
function cmd(n){if(!battle)return;if(n==="attack"||n==="skill"){const d=n==="skill"?20+S.lv*3+Math.floor(Math.random()*12):S.atk+Math.floor(Math.random()*8);battle.hp-=d;$("battleText").textContent=(n==="skill"?"花結び！ ":"")+`${d}ダメージ！`;YK_AUDIO.beep(n==="skill"?720:330,.08);renderBattle();if(battle.hp<=0)return win();setTimeout(foe,330)}else if(n==="item"){if(S.potions<=0)return $("battleText").textContent="薬草がない！";S.potions--;S.hp=Math.min(S.maxhp,S.hp+35);$("battleText").textContent="HPを35回復！";renderBattle();setTimeout(foe,300)}else{if(Math.random()<.78){$("battleText").textContent="逃げ切った！";setTimeout(endBattle,350)}else{ $("battleText").textContent="逃げられない！";setTimeout(foe,300)}}}
function foe(){if(!battle)return;const d=Math.max(1,battle.atk-Math.floor(S.def/2)+Math.floor(Math.random()*5));S.hp-=d;$("battleText").textContent=`${battle.name}の攻撃！ ${d}ダメージ`;renderBattle();YK_AUDIO.beep(110,.08);if(S.hp<=0)setTimeout(defeat,400)}
function win(){S.wins++;S.xp+=battle.xp;S.gold+=battle.gold;$("battleText").textContent=`勝利！ ${battle.xp}経験 / ${battle.gold}文`;while(S.xp>=S.lv*40){S.xp-=S.lv*40;S.lv++;S.maxhp+=12;S.hp=S.maxhp;S.atk+=3;S.def++}setTimeout(endBattle,650)}
function endBattle(){battle=null;$("battle").classList.remove("show");busy=false;S.encounterGrace=D.areas[S.area]?.grace||8;YK_SAVE.auto(S);hud()}
function defeat(){battle=null;$("battle").classList.remove("show");S.hp=1;YK_SAVE.auto(S);$("gameover").classList.add("show");busy=true}
function menu(){if(busy)return;busy=true;$("statusPanel").innerHTML=`夜叉姫　Lv.${S.lv}<br>HP ${S.hp}/${S.maxhp}　攻撃 ${S.atk}　防御 ${S.def}<br>武器：${S.weapon}`;$("itemsPanel").textContent=`薬草 × ${S.potions}　潮花の花びら × ${S.petals}`;$("recordPanel").textContent=`歩数 ${S.walk} / 戦闘 ${S.battles} / 勝利 ${S.wins}`;$("outfits").innerHTML=Object.entries(D.outfits).map(([k,v])=>`<button data-outfit="${k}" class="${S.outfit===k?"selected":""}"><span>${v.name}</span><small>${OUTFIT_READY[k]?"実装済":"制作中・切替確認用"}</small></button>`).join("");document.querySelectorAll("[data-outfit]").forEach(b=>YK_INPUT.tap(b,()=>{S.outfit=b.dataset.outfit;YK_SAVE.auto(S);$("menu").classList.remove("show");busy=false;hud();menu()}));$("menu").classList.add("show")}
function slots(){$("slots").innerHTML=[1,2,3].map(n=>{const i=YK_SAVE.slotInfo(n);return `<div class="slot"><b>${n}番</b>　${i?`Lv.${i.lv} / ${i.area}`:"記録なし"}<div class="slotBtns"><button data-save="${n}">保存</button><button data-load="${n}">読込</button></div></div>`}).join("");document.querySelectorAll("[data-save]").forEach(b=>YK_INPUT.tap(b,()=>{YK_SAVE.saveSlot(+b.dataset.save,S);slots()}));document.querySelectorAll("[data-load]").forEach(b=>YK_INPUT.tap(b,()=>{const v=YK_SAVE.loadSlot(+b.dataset.load);if(v){state(v);close("saveMenu")}}))}
function close(id){$(id).classList.remove("show");busy=false;hud()}
function worldMap(){if(busy)return;busy=true;$("worldMap").classList.add("show");drawWorld()}
function drawWorld(){const c=wg;c.clearRect(0,0,720,720);if(cover(c,IMG.world,720,720,1)){c.fillStyle="#06111c33";c.fillRect(0,0,720,720);return;}const grad=c.createLinearGradient(0,0,720,720);grad.addColorStop(0,"#2c7793");grad.addColorStop(1,"#17455e");c.fillStyle=grad;c.fillRect(0,0,720,720);c.fillStyle="#75975c";c.beginPath();c.moveTo(95,580);c.bezierCurveTo(15,430,100,190,270,110);c.bezierCurveTo(430,20,650,125,665,310);c.bezierCurveTo(690,500,525,665,335,650);c.bezierCurveTo(210,665,145,635,95,580);c.fill();c.fillStyle="#c9b078";c.lineWidth=14;c.strokeStyle="#c9b078";c.beginPath();c.moveTo(180,535);c.quadraticCurveTo(260,440,325,370);c.quadraticCurveTo(390,290,520,170);c.stroke();const pts={village:[190,535,"鬼灯の里"],shrine:[520,170,"天妖の社"],cove:[115,590,"海の入り江"],forest:[320,370,"忘れの森"],waterfall:[410,230,"龍神の滝"],fox:[565,485,"九尾の祠"]};for(const [k,p] of Object.entries(pts)){if(k==="village"||k==="shrine"||k==="fox")torii(c,p[0],p[1]-30,.65);else if(k==="waterfall")water(c,p[0]-20,p[1]-45,40,60);else sakura(c,p[0],p[1]-20,.55);rr(c,p[0]-55,p[1]+20,110,28,5,k===S.area?"#9c3e5d":"#07131fe8","#d8b66e");c.font="13px sans-serif";c.fillStyle="#fff";c.textAlign="center";c.fillText(p[2],p[0],p[1]+39)}}
function battlePad(d){if(!$("battle").classList.contains("show"))return false;selectCmd(battleCursor+(d==="u"||d==="l"?-1:1));return true}
YK_INPUT.hold($("up"),()=>battlePad("u")||move(0,-22,"u"));YK_INPUT.hold($("down"),()=>battlePad("d")||move(0,22,"d"));YK_INPUT.hold($("left"),()=>battlePad("l")||move(-22,0,"l"));YK_INPUT.hold($("right"),()=>battlePad("r")||move(22,0,"r"));
YK_INPUT.tap($("ok"),()=>battle?cmd(["attack","skill","item","escape"][battleCursor]):action());YK_INPUT.tap($("cancel"),()=>{if($("menu").classList.contains("show"))close("menu")});
YK_INPUT.tap($("dialogNext"),nextDialog);YK_INPUT.tap($("bookBtn"),menu);YK_INPUT.tap($("worldBtn"),worldMap);YK_INPUT.tap($("saveBtn"),()=>{if(busy)return;busy=true;slots();$("saveMenu").classList.add("show")});YK_INPUT.tap($("settingsBtn"),()=>{if(busy)return;busy=true;$("soundToggle").checked=S.sound;$("settings").classList.add("show")});
document.querySelectorAll("[data-close]").forEach(b=>YK_INPUT.tap(b,()=>close(b.dataset.close)));document.querySelectorAll("[data-cmd]").forEach((b,i)=>YK_INPUT.tap(b,()=>{selectCmd(i);cmd(b.dataset.cmd)}));
document.querySelectorAll("[data-hot]").forEach(b=>YK_INPUT.tap(b,()=>hotChoice(b.dataset.hot)));
$("soundToggle").addEventListener("change",e=>{S.sound=e.target.checked;YK_SAVE.auto(S)});
YK_INPUT.tap($("resetBtn"),()=>{if(confirm("セーブデータをすべて初期化しますか？"))YK_SAVE.reset()});
YK_INPUT.tap($("newGame"),()=>{state(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;hud();setTimeout(()=>talk({n:"夜叉姫",t:["ふふっ……今日も面白いことが起きそうね。","鬼灯の里へ行ってみましょう。"]}),200)});
YK_INPUT.tap($("continueGame"),()=>{const v=YK_SAVE.loadAuto();if(!v)return message("自動保存データがありません");state(v);$("title").classList.remove("show");busy=false;hud()});
YK_INPUT.tap($("retryBtn"),()=>{state(YK_SAVE.loadAuto()||YK_SAVE.fresh());$("gameover").classList.remove("show");busy=false;hud()});YK_INPUT.tap($("goTitleBtn"),()=>{$("gameover").classList.remove("show");$("title").classList.add("show");busy=true});
document.addEventListener("keydown",e=>{if(e.repeat)return;({ArrowUp:()=>move(0,-22,"u"),ArrowDown:()=>move(0,22,"d"),ArrowLeft:()=>move(-22,0,"l"),ArrowRight:()=>move(22,0,"r"),Enter:()=>battle?cmd(["attack","skill","item","escape"][battleCursor]):action()}[e.key]||(()=>{}))()});
window.addEventListener("error",e=>{console.error(e.error||e.message);busy=false;message("操作を復旧しました",1500)});
function titleHero(){const c=$("titleHero"),q=c?.getContext("2d");if(!q)return;q.clearRect(0,0,c.width,c.height);const im=B9IMG.title;if(im&&im.complete&&im.naturalWidth){q.drawImage(im,0,0,c.width,c.height)}else{hero(q,210,300,"d",0,"normal",4.4)}}
function loop(t){if(!busy)S.playtime+=(t-last)/1000;last=t;requestAnimationFrame(loop)}
titleHero();hud();requestAnimationFrame(loop);
})();


// β14.2 field-test shortcut: does not overwrite manual save slots.
(function(){
 const bindVillageTestWarp=()=>{
   const b=document.getElementById("villageTestWarp");
   if(!b || b.dataset.bound)return;
   b.dataset.bound="1";
   b.addEventListener("pointerup",(e)=>{
     e.preventDefault(); e.stopPropagation();
     try{
       S.area="village";
       S.x=384; S.y=420;
       S.dir="u"; S.frame=0;
       S.busy=false;
       if(typeof message==="function")message("鬼灯の里：配置・当たり判定テスト");
       if(typeof hud==="function")hud();
     }catch(err){ console.error("Village test warp failed",err); }
   },{passive:false});
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bindVillageTestWarp,{once:true});
 else bindVillageTestWarp();
})();

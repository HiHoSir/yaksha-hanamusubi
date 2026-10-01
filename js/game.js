(()=>{
"use strict";
const $=id=>document.getElementById(id), C=$("game"),ctx=C.getContext("2d"),B=$("battleCanvas"),bctx=B.getContext("2d");
window.gameState=YK_SAVE.fresh();let s=window.gameState,busy=true,dialogQueue=[],battle=null,battleCursor=0,lastFrame=performance.now(),msgTimer=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function setState(v){s=window.gameState=YK_SAVE.migrate(v)}
function message(t,ms=1300){clearTimeout(msgTimer);$("message").textContent=t;$("message").style.display="block";msgTimer=setTimeout(()=>$("message").style.display="none",ms)}
function roundRect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
function flower(c,x,y,col="#f6a8c1",scale=1){c.save();c.translate(x,y);c.fillStyle=col;for(let i=0;i<5;i++){c.rotate(Math.PI*2/5);c.beginPath();c.ellipse(0,-5*scale,3*scale,6*scale,0,0,Math.PI*2);c.fill()}c.fillStyle="#f6d779";c.beginPath();c.arc(0,0,2*scale,0,7);c.fill();c.restore()}
function tree(c,x,y,scale=1){
 c.save();c.translate(x,y);c.scale(scale,scale);
 c.fillStyle="#37271f";c.fillRect(-7,0,14,40);c.fillStyle="#5a3a28";c.fillRect(-3,2,5,36);
 const crowns=[[-19,-2,25,"#244f38"],[18,0,27,"#2b5d3f"],[0,-23,31,"#356b47"],[-5,-43,22,"#42764d"]];
 for(const q of crowns){c.fillStyle=q[3];c.beginPath();c.arc(q[0],q[1],q[2],0,7);c.fill()}
 c.fillStyle="#e9a3b8";for(const p of [[-22,-20],[14,-29],[3,-48],[29,-8]])flower(c,p[0],p[1],"#ef9eb7",.45);
 c.restore()
}
function house(c,x,y,w=120,h=90){
 c.save();c.fillStyle="#d7bd8f";c.fillRect(x,y+28,w,h-28);
 c.fillStyle="#6d4a34";for(let yy=y+35;yy<y+h;yy+=17)c.fillRect(x,yy,w,2);
 c.fillStyle="#20364b";c.beginPath();c.moveTo(x-15,y+32);c.lineTo(x+w/2,y-10);c.lineTo(x+w+15,y+32);c.closePath();c.fill();
 c.strokeStyle="#71829a";c.lineWidth=3;for(let i=0;i<6;i++){c.beginPath();c.moveTo(x-6+i*w/5,y+27);c.lineTo(x+w/2,y-6);c.stroke()}
 c.fillStyle="#3d2a27";c.fillRect(x+w/2-17,y+51,34,39);c.fillStyle="#e3b252";c.fillRect(x+w/2-3,y+65,5,5);
 c.fillStyle="#8db4b1";c.fillRect(x+13,y+48,27,20);c.strokeStyle="#4f4035";c.strokeRect(x+13,y+48,27,20);c.beginPath();c.moveTo(x+26,y+48);c.lineTo(x+26,y+68);c.moveTo(x+13,y+58);c.lineTo(x+40,y+58);c.stroke();
 c.restore()
}
function torii(c,x,y){
 c.save();c.translate(x,y);c.fillStyle="#a92f3e";c.fillRect(-35,0,9,70);c.fillRect(26,0,9,70);c.fillStyle="#c7474b";c.fillRect(-51,-5,102,10);c.fillRect(-43,11,86,7);c.fillStyle="#2b1b25";c.fillRect(-56,-9,112,5);c.restore()
}
function stone(c,x,y){c.fillStyle="#7f8580";c.beginPath();c.ellipse(x,y,16,10,-.2,0,7);c.fill();c.fillStyle="#aeb2a7";c.beginPath();c.ellipse(x-4,y-3,7,3,-.2,0,7);c.fill()}
function lantern(c,x,y){c.fillStyle="#553526";c.fillRect(x-3,y,6,25);c.fillStyle="#9d4a31";c.fillRect(x-9,y-15,18,18);c.fillStyle="#ffd078";c.fillRect(x-5,y-11,10,10);c.fillStyle="#3d2b28";c.fillRect(x-11,y-18,22,4)}
function bridge(c,x,y,w=150){c.fillStyle="#6d4a31";c.fillRect(x,y,w,38);for(let i=0;i<w;i+=20){c.fillStyle=i%40?"#8b633e":"#795235";c.fillRect(x+i,y+3,16,32)}c.fillStyle="#4b3328";c.fillRect(x,y-5,w,5);c.fillRect(x,y+38,w,5)}
function drawTitleHero(){
 const tc=$("titleHero");if(!tc)return;const q=tc.getContext("2d");q.clearRect(0,0,tc.width,tc.height);
 q.save();q.translate(205,245);
 // flowing purple hair
 q.fillStyle="#321848";q.beginPath();q.ellipse(0,25,100,155,-.08,0,7);q.fill();
 q.fillStyle="#45215f";q.beginPath();q.moveTo(-70,-40);q.bezierCurveTo(-155,80,-120,220,-35,240);q.bezierCurveTo(-70,120,-35,40,-10,-25);q.fill();
 q.beginPath();q.moveTo(55,-35);q.bezierCurveTo(155,80,135,205,60,245);q.bezierCurveTo(80,115,35,50,15,-20);q.fill();
 // red bow
 q.fillStyle="#bd3858";q.beginPath();q.moveTo(-15,-112);q.lineTo(-105,-145);q.lineTo(-75,-65);q.closePath();q.fill();q.beginPath();q.moveTo(15,-112);q.lineTo(105,-145);q.lineTo(75,-65);q.closePath();q.fill();q.fillStyle="#d34b67";q.beginPath();q.ellipse(0,-105,27,20,0,0,7);q.fill();
 // face
 q.fillStyle="#f2c9b7";q.beginPath();q.ellipse(0,-45,61,70,0,0,7);q.fill();
 q.fillStyle="#3a1d50";q.beginPath();q.arc(-23,-52,9,0,7);q.arc(23,-52,9,0,7);q.fill();q.fillStyle="#fff";q.beginPath();q.arc(-20,-55,3,0,7);q.arc(26,-55,3,0,7);q.fill();
 q.strokeStyle="#a4556c";q.lineWidth=3;q.beginPath();q.arc(0,-24,12,.2,2.8);q.stroke();
 // outfit
 q.fillStyle="#f6eee5";q.beginPath();q.moveTo(-56,25);q.lineTo(56,25);q.lineTo(74,145);q.lineTo(-75,145);q.closePath();q.fill();
 q.fillStyle="#c83d62";q.fillRect(-58,55,116,22);q.beginPath();q.moveTo(-78,138);q.lineTo(78,138);q.lineTo(102,225);q.lineTo(-102,225);q.closePath();q.fill();
 q.fillStyle="#f2d5ca";q.fillRect(-87,35,35,95);q.fillRect(52,35,35,95);
 // sword
 q.strokeStyle="#e9f2f3";q.lineWidth=10;q.beginPath();q.moveTo(74,75);q.lineTo(137,-2);q.stroke();q.strokeStyle="#7c4931";q.lineWidth=8;q.beginPath();q.moveTo(58,94);q.lineTo(84,64);q.stroke();
 q.restore()
}
function drawMap(){
 const a=YK_DATA.areas[s.area];ctx.fillStyle=a.ground;ctx.fillRect(0,0,768,768);
 // organic grass tiles
 for(let y=0;y<768;y+=32)for(let x=0;x<768;x+=32){const k=((x*7+y*11)/32)%5;ctx.fillStyle=k<1?"#ffffff0b":"#00000008";ctx.fillRect(x,y,32,32);ctx.strokeStyle="#ffffff08";ctx.strokeRect(x+.5,y+.5,31,31)}
 if(s.area==="field"){
   ctx.fillStyle=a.path;ctx.fillRect(0,315,768,150);ctx.fillRect(315,0,150,768);
   ctx.fillStyle=a.water;ctx.fillRect(0,610,768,158);for(let y=625;y<760;y+=24){ctx.strokeStyle="#a7d8dc55";ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(190,y-8,380,y+8,768,y);ctx.stroke()}
   bridge(ctx,309,600,162);for(let i=0;i<14;i++)flower(ctx,55+i*52,285+(i%2)*195,"#ef91b0",.8);
   for(let i=0;i<5;i++){tree(ctx,60+i*165,90+(i%2)*80,.8)}
 } else if(s.area==="village"){
   ctx.fillStyle="#cdb681";ctx.fillRect(0,300,768,180);ctx.fillRect(325,0,125,768);
   house(ctx,45,75,155,110);house(ctx,280,80,170,115);house(ctx,545,72,155,112);house(ctx,70,535,160,110);house(ctx,520,535,170,110);
   for(let i=0;i<8;i++)lantern(ctx,245+i*62,250+(i%2)*250);for(let i=0;i<10;i++)flower(ctx,55+i*70,500+(i%2)*165);
 } else if(s.area==="shrine"){
   ctx.fillStyle="#a79a72";ctx.fillRect(320,0,128,768);torii(ctx,384,575);torii(ctx,384,390);house(ctx,275,25,220,125);
   for(let i=0;i<12;i++)tree(ctx,55+(i%6)*132,210+Math.floor(i/6)*370,.95);for(let i=0;i<5;i++)lantern(ctx,285+i*50,250+i*75);
 } else if(s.area==="cove"){
   ctx.fillStyle=a.water;ctx.fillRect(0,0,768,305);ctx.fillStyle="#e3ce96";ctx.fillRect(0,275,768,215);
   for(let y=285;y<325;y+=10){ctx.strokeStyle="#eaf8f077";ctx.beginPath();ctx.moveTo(0,y);ctx.quadraticCurveTo(380,y+12,768,y);ctx.stroke()}
   ctx.fillStyle=a.ground;ctx.fillRect(0,490,768,278);house(ctx,540,530,155,105);for(let i=0;i<13;i++)flower(ctx,35+i*58,520+(i%3)*55,"#fff0bd",.7);
 } else if(s.area==="forest"){
   ctx.fillStyle="#756e55";ctx.beginPath();ctx.moveTo(305,768);ctx.bezierCurveTo(250,580,480,440,325,0);ctx.lineTo(470,0);ctx.bezierCurveTo(580,440,350,610,470,768);ctx.fill();
   for(let i=0;i<24;i++)tree(ctx,35+(i%6)*140,70+Math.floor(i/6)*210,1);for(let i=0;i<14;i++)stone(ctx,70+(i*83)%650,100+(i*127)%600);
 } else if(s.area==="waterfall"){
   ctx.fillStyle="#274d48";ctx.fillRect(0,0,768,768);ctx.fillStyle="#478fa5";ctx.beginPath();ctx.moveTo(275,0);ctx.lineTo(500,0);ctx.lineTo(540,768);ctx.lineTo(220,768);ctx.closePath();ctx.fill();
   ctx.fillStyle="#d8f0ee";ctx.fillRect(305,0,160,330);ctx.globalAlpha=.45;for(let y=0;y<330;y+=22){ctx.fillStyle="#fff";ctx.fillRect(320,y,130,7)}ctx.globalAlpha=1;
   bridge(ctx,205,520,355);for(let i=0;i<11;i++)tree(ctx,40+(i%3)*610,70+i*62,.75);
 } else {
   ctx.fillStyle="#837359";ctx.fillRect(320,0,128,768);for(let y=80;y<680;y+=145)torii(ctx,384,y);for(let i=0;i<12;i++)lantern(ctx,280+(i%2)*210,100+i*50);for(let i=0;i<12;i++)tree(ctx,55+(i%2)*610,70+i*60,.8)
 }
 drawNpcs();drawHero(ctx,s.x,s.y,s.dir,s.frame,s.outfit,1.15);
}function drawNpcs(){
 const list={village:[[190,380,"子供","#f0b8a5"],[580,390,"商人","#d6a95d"],[390,555,"村娘","#8a5b91"]],shrine:[[500,370,"巫女","#e9e3d6"]],cove:[[580,560,"漁師","#577d8e"]],forest:[[520,380,"旅人","#8a765b"]],waterfall:[[150,590,"童子","#6b8e91"]],fox:[[530,650,"妖狐","#d49a55"]]}[s.area]||[];
 list.forEach(([x,y,n,col])=>{ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(x,y+18,18,7,0,0,7);ctx.fill();ctx.fillStyle=col;ctx.fillRect(x-13,y-5,26,30);ctx.fillStyle="#f2d1ba";ctx.beginPath();ctx.arc(x,y-14,13,0,7);ctx.fill();ctx.fillStyle="#3a2935";ctx.fillRect(x-13,y-25,26,8);ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText(n,x,y+40)})
}
function drawHero(c,x,y,dir,frame,outfit,scale=1){
 const o=YK_DATA.outfits[outfit]||YK_DATA.outfits.normal,bob=frame?1.5:0;c.save();c.translate(x,y+bob);c.scale(scale,scale);
 c.fillStyle="#0005";c.beginPath();c.ellipse(0,27,20,6,0,0,7);c.fill();
 // hair behind body
 c.fillStyle="#38204f";c.beginPath();c.ellipse(0,-5,22,33,0,0,7);c.fill();c.fillRect(-19,-5,38,36);
 // ribbon
 c.fillStyle="#c93859";c.beginPath();c.moveTo(-4,-31);c.lineTo(-30,-45);c.lineTo(-25,-18);c.closePath();c.fill();c.beginPath();c.moveTo(4,-31);c.lineTo(30,-45);c.lineTo(25,-18);c.closePath();c.fill();c.fillStyle="#e05a72";c.beginPath();c.arc(0,-29,7,0,7);c.fill();
 // head
 c.fillStyle="#f1cbb8";c.beginPath();c.arc(0,-11,15,0,7);c.fill();
 // bangs
 c.fillStyle="#48255f";c.beginPath();c.arc(0,-19,15,Math.PI,0);c.fill();c.beginPath();c.moveTo(-14,-19);c.lineTo(-5,-6);c.lineTo(0,-21);c.lineTo(7,-6);c.lineTo(14,-18);c.fill();
 c.fillStyle="#331d43";
 if(dir==="u"){c.fillRect(-13,-17,26,12)}
 else if(dir==="l"){c.fillRect(-9,-12,4,4);c.fillStyle="#fff";c.fillRect(-8,-13,1,1)}
 else if(dir==="r"){c.fillRect(5,-12,4,4);c.fillStyle="#fff";c.fillRect(7,-13,1,1)}
 else{c.fillRect(-8,-12,4,4);c.fillRect(4,-12,4,4);c.fillStyle="#fff";c.fillRect(-7,-13,1,1);c.fillRect(6,-13,1,1)}
 // sleeves/body
 c.fillStyle=o.body;c.fillRect(-15,3,30,21);c.fillRect(-22,5,8,18);c.fillRect(14,5,8,18);c.fillStyle=o.trim;c.fillRect(-15,9,30,5);
 c.fillStyle=o.skirt;c.beginPath();c.moveTo(-16,22);c.lineTo(16,22);c.lineTo(20,38);c.lineTo(-20,38);c.closePath();c.fill();
 c.fillStyle="#e9bca8";let d=frame?4:-2;c.fillRect(-10+d,37,6,12);c.fillRect(4-d,37,6,12);c.fillStyle="#6a3344";c.fillRect(-11+d,47,8,4);c.fillRect(3-d,47,8,4);
 // sword and flower knot
 c.strokeStyle="#e3edf0";c.lineWidth=3;c.beginPath();c.moveTo(17,7);c.lineTo(30,-13);c.stroke();c.strokeStyle="#805136";c.beginPath();c.moveTo(14,11);c.lineTo(21,2);c.stroke();flower(c,-1,13,"#f5a2bd",.45);
 c.restore()
}
function ui(){const a=YK_DATA.areas[s.area];$("hud").innerHTML=`HP ${s.hp}/${s.maxhp}<br>Lv.${s.lv}　${s.gold}文`;$("objective").textContent="目的： "+YK_DATA.objectives[Math.min(s.quest,YK_DATA.objectives.length-1)];drawMap()}
function collision(nx,ny){if(nx<28||nx>740||ny<35||ny>735)return true;if(s.area==="field"&&ny>600)return true;if(s.area==="waterfall"&&nx>245&&nx<525&&ny<510)return true;return false}
function exits(){
 if(s.x<45)return ["field","village","shrine"].includes(s.area)?"field":"field";
 if(s.x>723){const map={field:"village",village:"shrine",shrine:"cove",cove:"forest",forest:"waterfall",waterfall:"fox",fox:"field"};return map[s.area]}
 return null
}
function move(dx,dy,dir){
 if(busy)return;s.dir=dir;const speed=Number($("speedSelect").value)||1,nx=s.x+dx*speed,ny=s.y+dy*speed;if(!collision(nx,ny)){s.x=clamp(nx,28,740);s.y=clamp(ny,35,735);s.frame=1-s.frame;s.walk++;s.encounterSteps++;if(s.encounterGrace>0)s.encounterGrace--;const ex=exits();if(ex&&ex!==s.area){s.area=ex;s.x=ex==="field"?690:70;s.y=430;s.encounterSteps=0;message(YK_DATA.areas[ex].name);YK_SAVE.auto(s)}else encounterCheck()}ui();if(s.walk%10===0)YK_SAVE.auto(s)
}
function encounterCheck(){const a=YK_DATA.areas[s.area];if(!a||!a.encounter||s.encounterGrace>0||s.encounterSteps<a.min)return;if(Math.random()<a.encounter){s.encounterSteps=0;startBattle()}}
function nearestNpc(){return s.area==="village"&&s.x>500?{n:"商人",t:["忘れの森へ向かうなら、薬草を忘れずに。","東へ進めば天妖の社、その先に海があるよ。"]}:s.area==="shrine"?{n:"巫女",t:["花結びの力は、失われた記憶を結び直す力。","九尾の祠には古い約束が眠っています。"]}:null}
function action(){if(busy&&$("battle").style.display!=="block")return;const n=nearestNpc();if(n){talk(n);if(s.quest<1)s.quest=1;return}if(s.area==="cove"&&s.quest<3){s.petals++;s.quest=3;message("潮花の花びらを手に入れた！");YK_SAVE.auto(s);return}message("あたりを調べた。")}
function talk(d){busy=true;dialogQueue=[...d.t];$("speaker").textContent=d.n;$("dialog").classList.add("show");nextDialog()}
function nextDialog(){if(!dialogQueue.length){$("dialog").classList.remove("show");busy=false;ui();return}$("dialogText").textContent=dialogQueue.shift()}
function startBattle(){
 const pool=YK_DATA.enemies[s.area]||YK_DATA.enemies.field,e=pool[Math.floor(Math.random()*pool.length)];battle={name:e[0],hp:e[1],max:e[1],atk:e[2],xp:e[3],gold:e[4]};s.battles++;busy=true;battleCursor=0;$("battle").classList.add("show");renderBattle();selectCmd(0);YK_AUDIO.beep(180,.12,"sawtooth")
}
function renderBattle(){
 const a=YK_DATA.areas[s.area];bctx.fillStyle="#15263a";bctx.fillRect(0,0,768,430);bctx.fillStyle=a.ground;bctx.fillRect(0,300,768,130);
 for(let i=0;i<18;i++)flower(bctx,20+i*45,320+(i%2)*35,"#eaa3ba",.6);
 drawHero(bctx,155,290,"r",s.frame,s.outfit,2.1);
 const x=590,y=245;bctx.fillStyle="#0006";bctx.beginPath();bctx.ellipse(x,y+70,75,18,0,0,7);bctx.fill();bctx.fillStyle=s.area==="fox"?"#d08455":"#5c456c";bctx.beginPath();bctx.arc(x,y,62,0,7);bctx.fill();bctx.fillStyle="#f1c65c";bctx.beginPath();bctx.arc(x-22,y-10,7,0,7);bctx.arc(x+22,y-10,7,0,7);bctx.fill();bctx.strokeStyle="#2d1b30";bctx.lineWidth=8;bctx.beginPath();bctx.moveTo(x-32,y+25);bctx.quadraticCurveTo(x,y+48,x+32,y+25);bctx.stroke();
 $("enemyName").textContent=battle.name;$("enemyHp").textContent=Math.max(0,battle.hp)+"/"+battle.max;$("battleHp").textContent=s.hp+"/"+s.maxhp
}
function selectCmd(i){battleCursor=(i+4)%4;document.querySelectorAll("[data-cmd]").forEach((b,n)=>b.classList.toggle("selected",n===battleCursor))}
function command(name){
 if(!battle)return;
 if(name==="attack"){const d=s.atk+Math.floor(Math.random()*8);battle.hp-=d;$("battleText").textContent=`${d}ダメージ！`;YK_AUDIO.beep(330,.06);renderBattle();if(battle.hp<=0)return winBattle();setTimeout(foeTurn,320)}
 if(name==="skill"){const d=20+s.lv*3+Math.floor(Math.random()*12);battle.hp-=d;$("battleText").textContent=`花結び！ ${d}ダメージ！`;YK_AUDIO.beep(720,.12,"sine");renderBattle();if(battle.hp<=0)return winBattle();setTimeout(foeTurn,380)}
 if(name==="item"){if(s.potions<=0){$("battleText").textContent="薬草がない！";return}s.potions--;s.hp=Math.min(s.maxhp,s.hp+35);$("battleText").textContent="HPを35回復！";renderBattle();setTimeout(foeTurn,300)}
 if(name==="escape"){if(Math.random()<.78){$("battleText").textContent="うまく逃げ切った！";setTimeout(endBattle,350)}else{$("battleText").textContent="逃げられない！";setTimeout(foeTurn,300)}}
}
function foeTurn(){if(!battle)return;const d=Math.max(1,battle.atk-Math.floor(s.def/2)+Math.floor(Math.random()*5));s.hp-=d;$("battleText").textContent=`${battle.name}の攻撃！ ${d}ダメージ`;YK_AUDIO.beep(120,.08,"sawtooth");renderBattle();if(s.hp<=0)setTimeout(defeat,450)}
function winBattle(){s.wins++;s.xp+=battle.xp;s.gold+=battle.gold;$("battleText").textContent=`勝利！ ${battle.xp}経験 / ${battle.gold}文`;while(s.xp>=s.lv*40){s.xp-=s.lv*40;s.lv++;s.maxhp+=12;s.hp=s.maxhp;s.atk+=3;s.def+=1}$("enemyHp").textContent="0";setTimeout(endBattle,700)}
function endBattle(){battle=null;$("battle").classList.remove("show");busy=false;s.encounterGrace=(YK_DATA.areas[s.area]||{}).grace||8;YK_SAVE.auto(s);ui()}
function defeat(){battle=null;$("battle").classList.remove("show");s.hp=1;YK_SAVE.auto(s);$("gameover").classList.add("show");busy=true}
function openMenu(){if(busy)return;busy=true;renderMenu();$("menu").classList.add("show")}
function renderMenu(){
 $("statusPanel").innerHTML=`夜叉姫　Lv.${s.lv}<br>HP ${s.hp}/${s.maxhp}　攻撃 ${s.atk}　防御 ${s.def}<br>武器：${s.weapon}`;
 $("itemsPanel").textContent=`薬草 × ${s.potions}　潮花の花びら × ${s.petals}`;
 $("recordPanel").textContent=`歩数 ${s.walk} / 戦闘 ${s.battles} / 勝利 ${s.wins}`;
 $("outfits").innerHTML=Object.entries(YK_DATA.outfits).map(([k,v])=>`<button data-outfit="${k}" class="${s.outfit===k?"selected":""}">${v.name}</button>`).join("");
 document.querySelectorAll("[data-outfit]").forEach(b=>YK_INPUT.tap(b,()=>{s.outfit=b.dataset.outfit;renderMenu();ui();YK_SAVE.auto(s)}))
}
function closeOverlay(id){$(id).classList.remove("show");busy=false;ui()}
function renderSlots(){$("slots").innerHTML=[1,2,3].map(n=>{const i=YK_SAVE.slotInfo(n);return `<div class="slot"><b>${n}番</b>　${i?`Lv.${i.lv} / ${i.area}`:"記録なし"}<div class="slotBtns"><button data-save="${n}">保存</button><button data-load="${n}">読込</button></div></div>`}).join("");document.querySelectorAll("[data-save]").forEach(b=>YK_INPUT.tap(b,()=>{YK_SAVE.saveSlot(+b.dataset.save,s);renderSlots();message(`${b.dataset.save}番に保存しました`)}));document.querySelectorAll("[data-load]").forEach(b=>YK_INPUT.tap(b,()=>{const v=YK_SAVE.loadSlot(+b.dataset.load);if(!v)return message("記録がありません");setState(v);closeOverlay("saveMenu");message("旅を再開しました")}))}
function battlePad(dir){if(!$("battle").classList.contains("show"))return false;if(dir==="u"||dir==="l")selectCmd(battleCursor-1);else selectCmd(battleCursor+1);return true}
YK_INPUT.hold($("up"),()=>battlePad("u")||move(0,-22,"u"));YK_INPUT.hold($("down"),()=>battlePad("d")||move(0,22,"d"));YK_INPUT.hold($("left"),()=>battlePad("l")||move(-22,0,"l"));YK_INPUT.hold($("right"),()=>battlePad("r")||move(22,0,"r"));
YK_INPUT.tap($("ok"),()=>{if($("battle").classList.contains("show"))command(["attack","skill","item","escape"][battleCursor]);else action()});YK_INPUT.tap($("cancel"),()=>{if($("menu").classList.contains("show"))closeOverlay("menu")});
YK_INPUT.tap($("dialogNext"),nextDialog);YK_INPUT.tap($("bookBtn"),openMenu);YK_INPUT.tap($("saveBtn"),()=>{if(busy)return;busy=true;renderSlots();$("saveMenu").classList.add("show")});YK_INPUT.tap($("settingsBtn"),()=>{if(busy)return;busy=true;$("soundToggle").checked=s.sound;$("settings").classList.add("show")});
document.querySelectorAll("[data-close]").forEach(b=>YK_INPUT.tap(b,()=>closeOverlay(b.dataset.close)));
document.querySelectorAll("[data-cmd]").forEach((b,i)=>YK_INPUT.tap(b,()=>{selectCmd(i);command(b.dataset.cmd)}));
$("soundToggle").addEventListener("change",e=>{s.sound=e.target.checked;YK_SAVE.auto(s);YK_AUDIO.beep(520,.08)});
YK_INPUT.tap($("resetBtn"),()=>{if(confirm("セーブデータをすべて初期化しますか？")){YK_SAVE.reset();message("初期化しました")}});
YK_INPUT.tap($("newGame"),()=>{setState(YK_SAVE.fresh());$("title").classList.remove("show");busy=false;ui();setTimeout(()=>talk({n:"夜叉姫",t:["ふふっ……今日も面白いことが起きそうね。","まずは東へ。鬼灯の里で話を聞いてみようかしら。"]}),250)});
YK_INPUT.tap($("continueGame"),()=>{const v=YK_SAVE.loadAuto();if(!v)return message("自動保存データがありません");setState(v);$("title").classList.remove("show");busy=false;ui()});
YK_INPUT.tap($("retryBtn"),()=>{const v=YK_SAVE.loadAuto();setState(v||YK_SAVE.fresh());$("gameover").classList.remove("show");busy=false;ui()});YK_INPUT.tap($("goTitleBtn"),()=>{$("gameover").classList.remove("show");$("title").classList.add("show");busy=true});
document.addEventListener("keydown",e=>{if(e.repeat)return;const k=e.key;if(k==="ArrowUp"||k==="w")move(0,-22,"u");else if(k==="ArrowDown"||k==="s")move(0,22,"d");else if(k==="ArrowLeft"||k==="a")move(-22,0,"l");else if(k==="ArrowRight"||k==="d")move(22,0,"r");else if(k==="Enter"||k===" "){if(battle)command(["attack","skill","item","escape"][battleCursor]);else action()}});
window.addEventListener("error",e=>{console.error(e.error||e.message);busy=false;message("エラーを検出しました。操作を復旧します。",1800)});
function loop(now){const dt=(now-lastFrame)/1000;lastFrame=now;if(!busy&&s){s.playtime+=dt}requestAnimationFrame(loop)}requestAnimationFrame(loop);
drawTitleHero();ui();
})();
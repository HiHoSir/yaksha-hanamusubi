(()=>{
"use strict";
const $=id=>document.getElementById(id), C=$("game"),ctx=C.getContext("2d"),B=$("battleCanvas"),bctx=B.getContext("2d");
window.gameState=YK_SAVE.fresh();let s=window.gameState,busy=true,dialogQueue=[],battle=null,battleCursor=0,lastFrame=performance.now(),msgTimer=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function setState(v){s=window.gameState=YK_SAVE.migrate(v)}
function message(t,ms=1300){clearTimeout(msgTimer);$("message").textContent=t;$("message").style.display="block";msgTimer=setTimeout(()=>$("message").style.display="none",ms)}
function roundRect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
function flower(c,x,y,col="#f6a8c1",scale=1){c.save();c.translate(x,y);c.fillStyle=col;for(let i=0;i<5;i++){c.rotate(Math.PI*2/5);c.beginPath();c.ellipse(0,-5*scale,3*scale,6*scale,0,0,Math.PI*2);c.fill()}c.fillStyle="#f6d779";c.beginPath();c.arc(0,0,2*scale,0,7);c.fill();c.restore()}
function tree(c,x,y,scale=1){c.fillStyle="#553b2d";c.fillRect(x-8*scale,y,16*scale,35*scale);for(const [dx,dy,r,col] of [[0,-10,30,"#244e3b"],[-20,2,22,"#315f43"],[20,2,22,"#2b5a40"],[0,-30,24,"#386b49"]]){c.fillStyle=col;c.beginPath();c.arc(x+dx*scale,y+dy*scale,r*scale,0,7);c.fill()}}
function house(c,x,y,w=120,h=90){c.fillStyle="#ead6ae";c.fillRect(x,y+28,w,h-28);c.fillStyle="#553044";c.beginPath();c.moveTo(x-12,y+32);c.lineTo(x+w/2,y-8);c.lineTo(x+w+12,y+32);c.closePath();c.fill();c.fillStyle="#3a2631";c.fillRect(x+w/2-15,y+55,30,35);c.fillStyle="#c7e1df";c.fillRect(x+15,y+50,24,18);c.strokeStyle="#6b5444";c.strokeRect(x+15,y+50,24,18)}
function torii(c,x,y){c.fillStyle="#b83d43";c.fillRect(x-36,y,8,65);c.fillRect(x+28,y,8,65);c.fillRect(x-50,y,100,9);c.fillRect(x-42,y+13,84,7);c.fillStyle="#321e25";c.fillRect(x-55,y-5,110,6)}
function drawMap(){
 const a=YK_DATA.areas[s.area];ctx.fillStyle=a.ground;ctx.fillRect(0,0,768,768);
 // tile texture
 ctx.globalAlpha=.13;for(let y=0;y<768;y+=32)for(let x=0;x<768;x+=32){ctx.fillStyle=((x+y)/32)%2?"#fff":"#000";ctx.fillRect(x,y,32,32)}ctx.globalAlpha=1;
 if(s.area==="field"){ctx.fillStyle=a.path;ctx.fillRect(0,320,768,140);ctx.fillRect(320,0,130,768);ctx.fillStyle=a.water;ctx.fillRect(0,610,768,158);for(let i=0;i<12;i++)flower(ctx,70+i*55,285+(i%2)*170)}
 if(s.area==="village"){ctx.fillStyle=a.path;ctx.fillRect(0,320,768,150);house(ctx,70,80);house(ctx,300,95);house(ctx,540,80);house(ctx,110,540);house(ctx,520,540);torii(ctx,384,210)}
 if(s.area==="shrine"){ctx.fillStyle=a.path;ctx.fillRect(325,0,118,768);torii(ctx,384,120);house(ctx,290,20,190,105);for(let i=0;i<7;i++){tree(ctx,80+i*105,250+(i%2)*280,.9)}}
 if(s.area==="cove"){ctx.fillStyle=a.water;ctx.fillRect(0,0,768,300);ctx.fillStyle="#e6d29b";ctx.fillRect(0,270,768,210);ctx.fillStyle=a.ground;ctx.fillRect(0,480,768,288);for(let i=0;i<10;i++)flower(ctx,55+i*72,520+(i%3)*55,"#fff1c7",.7)}
 if(s.area==="forest"){ctx.fillStyle=a.path;ctx.fillRect(300,0,165,768);for(let i=0;i<18;i++)tree(ctx,45+(i%6)*135,90+Math.floor(i/6)*300,.95)}
 if(s.area==="waterfall"){ctx.fillStyle=a.water;ctx.fillRect(250,0,268,768);ctx.fillStyle="#d9e9ec";ctx.fillRect(290,0,188,300);ctx.globalAlpha=.35;for(let y=0;y<300;y+=28){ctx.fillStyle="#fff";ctx.fillRect(310,y,148,8)}ctx.globalAlpha=1;ctx.fillStyle=a.path;ctx.fillRect(0,520,768,180)}
 if(s.area==="fox"){ctx.fillStyle=a.path;ctx.fillRect(300,0,168,768);for(let y=90;y<650;y+=130)torii(ctx,384,y);for(let i=0;i<8;i++)tree(ctx,70+(i%2)*560,100+i*75,.8)}
 // border markers / NPCs
 drawNpcs();drawHero(ctx,s.x,s.y,s.dir,s.frame,s.outfit,1);
}
function drawNpcs(){
 const list={village:[[190,380,"子供","#f0b8a5"],[580,390,"商人","#d6a95d"],[390,555,"村娘","#8a5b91"]],shrine:[[500,370,"巫女","#e9e3d6"]],cove:[[580,560,"漁師","#577d8e"]],forest:[[520,380,"旅人","#8a765b"]],waterfall:[[150,590,"童子","#6b8e91"]],fox:[[530,650,"妖狐","#d49a55"]]}[s.area]||[];
 list.forEach(([x,y,n,col])=>{ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(x,y+18,18,7,0,0,7);ctx.fill();ctx.fillStyle=col;ctx.fillRect(x-13,y-5,26,30);ctx.fillStyle="#f2d1ba";ctx.beginPath();ctx.arc(x,y-14,13,0,7);ctx.fill();ctx.fillStyle="#3a2935";ctx.fillRect(x-13,y-25,26,8);ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText(n,x,y+40)})
}
function drawHero(c,x,y,dir,frame,outfit,scale=1){
 const o=YK_DATA.outfits[outfit]||YK_DATA.outfits.normal, bob=frame?2:0;c.save();c.translate(x,y+bob);c.scale(scale,scale);
 c.fillStyle="#0006";c.beginPath();c.ellipse(0,23,22,8,0,0,7);c.fill();
 // hair mass
 c.fillStyle="#4b2768";c.beginPath();c.ellipse(0,-10,21,28,0,0,7);c.fill();c.fillRect(-18,-7,36,36);
 // huge ribbon
 c.fillStyle="#c83858";c.beginPath();c.moveTo(-5,-32);c.lineTo(-31,-49);c.lineTo(-27,-20);c.closePath();c.fill();c.beginPath();c.moveTo(5,-32);c.lineTo(31,-49);c.lineTo(27,-20);c.closePath();c.fill();
 // face
 c.fillStyle="#f3d0bb";c.beginPath();c.arc(0,-13,15,0,7);c.fill();
 c.fillStyle="#38213f";if(dir==="l"||dir==="r"){c.fillRect(dir==="l"?-9:5,-16,4,4)}else if(dir!=="u"){c.fillRect(-8,-16,4,4);c.fillRect(4,-16,4,4)}
 // body/skirt
 c.fillStyle=o.body;c.fillRect(-15,1,30,22);c.fillStyle=o.trim;c.fillRect(-15,7,30,5);c.fillStyle=o.skirt;c.beginPath();c.moveTo(-16,21);c.lineTo(16,21);c.lineTo(21,39);c.lineTo(-21,39);c.closePath();c.fill();
 // legs animate
 c.fillStyle="#f0c8b1";let d=frame?5:-3;c.fillRect(-11+d,37,7,13);c.fillRect(4-d,37,7,13);
 // sword
 c.strokeStyle="#d9e5ea";c.lineWidth=4;c.beginPath();c.moveTo(18,5);c.lineTo(31,-15);c.stroke();c.strokeStyle="#8b5a35";c.lineWidth=3;c.beginPath();c.moveTo(15,9);c.lineTo(21,1);c.stroke();
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
ui();
})();
window.YK_AUDIO=(()=>{
let ctx=null;
const fieldBgm=new Audio("audio/field-bgm.mp3");
fieldBgm.loop=true;fieldBgm.preload="auto";fieldBgm.volume=.42;fieldBgm.playsInline=true;
let bgmWanted=false;
function soundOn(){return !window.gameState||gameState.sound!==false}
function syncBgm(area){
 bgmWanted=area==="field";
 if(!bgmWanted||!soundOn()){fieldBgm.pause();return}
 const p=fieldBgm.play();if(p&&p.catch)p.catch(()=>{});
}
function unlock(){
 try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume()}catch(e){}
 if(bgmWanted&&soundOn()){const p=fieldBgm.play();if(p&&p.catch)p.catch(()=>{})}
}
["pointerdown","touchend","keydown"].forEach(ev=>document.addEventListener(ev,unlock,{passive:true}));
function beep(freq=440,dur=.07,type="square"){
 try{
  if(!window.gameState||!gameState.sound)return;
  ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
  if(ctx.state==="suspended")ctx.resume();
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;
  g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);
  o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur);
 }catch(e){}
}
return {beep,syncBgm,unlock};
})();
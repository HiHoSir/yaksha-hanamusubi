// beta15.57.92: Safari-safe single-media BGM, preserving voice and SE synthesis.
window.YK_AUDIO=(()=>{
 let ctx=null,enabledByGesture=false,currentArea="",player=null,duckUntil=0,duckTimer=null,lastError="";
 const tracks={
  field:{url:"audio/field-v10.mp3?v=15.57.92",loopStart:7.7419354839},
  village:{url:"audio/hoozuki-v13.mp3?v=15.57.92",loopStart:4.8}
 };
 const players={};let seeking=false,backgrounded=document.hidden;
 // Prefer game/ambient audio routing: respect the iPhone silent switch where supported.
 try{if(navigator.audioSession&&"type" in navigator.audioSession)navigator.audioSession.type="ambient"}catch{}
 function soundOn(){return !window.gameState||window.gameState.sound!==false}
 function zone(area){return area==="field"?"field":"village"}
 function setup(key){
  if(players[key])return players[key];
  const a=new Audio(tracks[key].url);a.preload="auto";a.playsInline=true;a.loop=false;a.load();
  a.addEventListener("ended",()=>{if(player!==a||!soundOn())return;reloop(a,key)});
  a.addEventListener("error",()=>{lastError="media error "+(a.error?.code||0)});
  // Seek just before the end, avoiding a second media player and its playback permission.
  a.addEventListener("timeupdate",()=>{if(a!==player||seeking||!Number.isFinite(a.duration))return;
    if(a.currentTime>=a.duration-.075)reloop(a,key)});
  return players[key]=a;
 }
 function reloop(a,key){if(seeking||a!==player)return;seeking=true;
  try{a.currentTime=tracks[key].loopStart;const p=a.play();if(p?.catch)p.catch(e=>lastError="loop "+String(e?.name||e))}
  catch(e){lastError="loop "+String(e)}finally{seeking=false}
 }
 function attenuate(){if(player)player.volume=performance.now()<duckUntil?.23:.4}
 function play(){if(!player||!soundOn()||!enabledByGesture||document.hidden||backgrounded)return;
  if(!player.paused)return;
  try{const p=player.play();if(p?.catch)p.catch(e=>lastError="play "+String(e?.name||e))}
  catch(e){lastError="play "+String(e)}
 }
 function syncBgm(area){
  const key=zone(area);
  if(key!==currentArea){
   if(player)player.pause();
   currentArea=key;player=setup(key);try{player.currentTime=0}catch{}
  }
  if(!soundOn()){if(player)player.pause();return}
  attenuate();play();
 }
 function unlock(){
  if(document.hidden||backgrounded)return;
  enabledByGesture=true;
  try{ctx??=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume().catch(()=>{})}catch{}
  play();
 }
 ["pointerdown","touchend","keydown"].forEach(ev=>document.addEventListener(ev,unlock,{passive:true}));
 function suspendForBackground(){backgrounded=true;for(const a of Object.values(players))a.pause();try{if(ctx?.state==="running")ctx.suspend().catch(()=>{})}catch{}}
 function resumeForeground(){if(document.hidden)return;backgrounded=false;try{if(ctx?.state==="suspended"&&enabledByGesture)ctx.resume().catch(()=>{})}catch{};play()}
 document.addEventListener("visibilitychange",()=>{if(document.hidden)suspendForBackground();else resumeForeground()});
 window.addEventListener("pagehide",suspendForBackground);
 window.addEventListener("pageshow",resumeForeground);
 function diagnostics(){return {area:currentArea,enabledByGesture,soundOn:soundOn(),paused:player?.paused??true,readyState:player?.readyState??0,time:player?.currentTime??0,duration:player?.duration??0,lastError,backgrounded,audioSession:navigator.audioSession?.type||"unsupported"}}
 function sound(freq=.0,dur=.08,type="triangle",gainLevel=.035,cutoff=1400){
  try{if(!soundOn()||!enabledByGesture||backgrounded||document.hidden)return;ctx??=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();
   const now=ctx.currentTime,o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();
   o.type=type;o.frequency.setValueAtTime(Math.max(55,freq),now);o.frequency.exponentialRampToValueAtTime(Math.max(50,freq*.89),now+dur);
   f.type="lowpass";f.frequency.value=cutoff;
   g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(Math.min(.12,gainLevel*1.75),now+.012);g.gain.setTargetAtTime(.00001,now+dur*.43,Math.max(.012,dur*.16));
   o.connect(f).connect(g).connect(ctx.destination);o.start(now);o.stop(now+dur+.09);
  }catch{}
 }
 function beep(freq=440,dur=.07,type="triangle"){sound(freq,dur,type,.027,1900)}
 const voices={child:[480,.047,1600,"triangle"],female:[345,.045,1400,"sine"],male:[215,.049,1000,"triangle"],elder:[245,.039,720,"sawtooth"],hostile:[174,.025,820,"sawtooth"],boss:[128,.052,680,"triangle"]};
 function talkChar(ch,voice="male",index=0){
  if(!/[ぁ-ゖァ-ヺー]/.test(ch)||!soundOn()||backgrounded||document.hidden)return;
  const p=voices[voice]||voices.male;let f=p[0];
  if(/[あかさたなはまやらわアカサタナハマヤラワ]/.test(ch))f*=1.08;
  else if(/[いきしちにひみりイキシチニヒミリ]/.test(ch))f*=1.13;
  else if(/[おこそとのほもよろをオコソトノホモヨロヲ]/.test(ch))f*=.90;
  if(/[んン]/.test(ch))sound(f*.65,.104,"triangle",p[1]*.65,550);
  else sound(f*(1+(index%3)*.025),.078,p[3],p[1],p[2]);
  duckUntil=performance.now()+260;attenuate();clearTimeout(duckTimer);duckTimer=setTimeout(()=>{duckUntil=0;attenuate()},340);
 }
 function dialogEnd(){clearTimeout(duckTimer);duckUntil=0;attenuate()}
 return {beep,syncBgm,unlock,talkChar,dialogEnd,diagnostics};
})();
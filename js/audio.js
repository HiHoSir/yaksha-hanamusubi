// Beta 15.57.88: reliable BGM state machine for iPhone Safari.
// Keep intro and loop separately: never restart intro after advancing to loop.
window.YK_AUDIO=(()=>{
 let ctx=null,enabledByGesture=false,currentArea="",current=null,duckUntil=0,duckTimer=null;
 let phase="intro",pausedBySetting=false,attemptPending=false,lastError="",lastAttempt=0;
 const tracks={
  field:{intro:"audio/field-v10.ogg?v=15.57.88",loop:"audio/field-v10-loop.ogg?v=15.57.88"},
  village:{intro:"audio/hoozuki-v13.ogg?v=15.57.88",loop:"audio/hoozuki-v13-loop.ogg?v=15.57.88"}
 };
 const buffer={};
 function soundOn(){return !window.gameState||window.gameState.sound!==false}
 function zone(area){return area==="field"?"field":"village"}
 function setup(key){
  if(buffer[key])return buffer[key];
  const intro=new Audio(tracks[key].intro),loop=new Audio(tracks[key].loop);
  for(const a of [intro,loop]){a.preload="auto";a.playsInline=true;a.addEventListener("error",()=>{lastError="media "+(a.error?.code||"unknown")})}
  loop.loop=true;
  return buffer[key]={intro,loop};
 }
 function active(){return current?.[phase]||null}
 function attenuate(){
  const target=performance.now()<duckUntil?.23:.40;
  if(current){current.intro.volume=target;current.loop.volume=target}
 }
 function tryPlay(force=false){
  if(!current||!soundOn()||!enabledByGesture||document.hidden)return;
  const a=active();if(!a||!a.paused||attemptPending)return;
  const now=performance.now();if(!force&&now-lastAttempt<1200)return;
  lastAttempt=now;attemptPending=true;
  try{
   const p=a.play();
   if(p&&typeof p.then==="function")p.then(()=>{attemptPending=false;lastError=""},e=>{attemptPending=false;lastError=String(e?.name||e)});
   else attemptPending=false;
  }catch(e){attemptPending=false;lastError=String(e?.name||e)}
 }
 function advance(pair){
  if(current!==pair||phase!=="intro")return;
  phase="loop";pair.loop.currentTime=0;
  tryPlay(true);
 }
 function syncBgm(area){
  const key=zone(area);
  if(currentArea!==key){
   if(current){current.intro.pause();current.loop.pause()}
   currentArea=key;current=setup(key);phase="intro";attemptPending=false;lastAttempt=0;
   current.intro.currentTime=0;current.loop.currentTime=0;
   const pair=current;pair.intro.onended=()=>advance(pair);
  }
  if(!soundOn()){
   pausedBySetting=true;if(current){current.intro.pause();current.loop.pause()}
   return;
  }
  if(pausedBySetting){pausedBySetting=false;lastAttempt=0}
  attenuate();
  tryPlay(false);
 }
 function unlock(){
  enabledByGesture=true;
  try{ctx??=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume().catch(()=>{})}catch{}
  tryPlay(true);
 }
 ["pointerdown","touchend","keydown"].forEach(ev=>document.addEventListener(ev,unlock,{passive:true}));
 document.addEventListener("visibilitychange",()=>{if(!document.hidden){attemptPending=false;tryPlay(true)}});
 window.addEventListener("pageshow",()=>{attemptPending=false;tryPlay(true)});
 function diagnostics(){const a=active();return {area:currentArea,phase,enabledByGesture,soundOn:soundOn(),paused:a?.paused??true,readyState:a?.readyState??0,time:a?.currentTime??0,lastError}}
 function sound(freq=.0,dur=.08,type="triangle",gainLevel=.035,cutoff=1400){
  try{if(!soundOn()||!enabledByGesture)return;ctx??=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();
   const now=ctx.currentTime,o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();
   o.type=type;o.frequency.setValueAtTime(Math.max(55,freq),now);o.frequency.exponentialRampToValueAtTime(Math.max(50,freq*.89),now+dur);
   f.type="lowpass";f.frequency.value=cutoff;
   g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(gainLevel,now+.012);g.gain.setTargetAtTime(.00001,now+dur*.43,Math.max(.012,dur*.16));
   o.connect(f).connect(g).connect(ctx.destination);o.start(now);o.stop(now+dur+.09);
  }catch{}
 }
 function beep(freq=440,dur=.07,type="triangle"){sound(freq,dur,type,.027,1900)}
 const voices={child:[480,.047,1600,"triangle"],female:[345,.045,1400,"sine"],male:[215,.049,1000,"triangle"],elder:[245,.039,720,"sawtooth"],hostile:[174,.025,820,"sawtooth"],boss:[128,.052,680,"triangle"]};
 function talkChar(ch,voice="male",index=0){
  if(!/[ぁ-ゖァ-ヺー]/.test(ch)||!soundOn())return;
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
// beta15.57.105: Safari-safe single-media BGM, preserving voice and SE synthesis.
window.YK_AUDIO=(()=>{
 let ctx=null,enabledByGesture=false,currentArea="",duckUntil=0,duckTimer=null,lastError="";
 const tracks={
  field:{url:"audio/kikoku-field-v11.mp3?v=15.57.190",loopStart:8.888875,loopEnd:71.111125},
  village:{url:"audio/hoozuki-v13.mp3?v=15.57.105",loopStart:4.8}
 };
 // Web Audio BGM is the approved default; HTMLAudio is opt-in diagnostics only.
 const audioParams=new URLSearchParams(location.search);
 // Ambient session on supported Safari respects the device silent switch.
 const audioSessionTest=audioParams.get("audioSessionTest")||"ambient";
 const bufferTest=audioParams.get("audioRouteTest")!=="html";
 const silentTest=audioSessionTest!=="auto";
 let audioSessionResult="unchanged";
 function applySessionTest(){
  if(!silentTest)return;
  try{
   if(navigator.audioSession&&"type" in navigator.audioSession){
    navigator.audioSession.type=audioSessionTest;
    audioSessionResult=audioSessionTest+" (readback: "+navigator.audioSession.type+")";
   }else audioSessionResult="unsupported";
  }catch(e){audioSessionResult="error "+String(e?.name||e)}
 }
 applySessionTest();
 const player=new Audio();player.preload="auto";player.playsInline=true;player.loop=false;
 let seeking=false,playPending=false,playError="",requestId=0,backgroundPaused=false;
 function soundOn(){return !window.gameState||window.gameState.sound!==false}
 function zone(area){return area==="field"?"field":"village"}
 let bufferSource=null,bufferGain=null,bufferKey="",bufferLoading="",bufferError="",bufferGeneration=0,bufferStartedAt=0,bufferOffset=0;
 let resumeSerial=0,restorePending=false;
 let encounterMuted=false,battleMusicTimer=null,battleMusicStep=0,battleMusicActive=false;
 // Dedicated battle track. Keep it isolated from field/village playback.
 const battlePlayer=new Audio("audio/kikoku-battle-hybrid-fm-v4.mp3?v=15.57.182");
 battlePlayer.preload="auto";battlePlayer.loop=true;battlePlayer.playsInline=true;
 function stopBattleMusic(){battleMusicActive=false;clearTimeout(battleMusicTimer);battleMusicTimer=null;battlePlayer.pause();battlePlayer.currentTime=0;}
 function startBattleMusic(){
  if(battleMusicActive)return;
  battleMusicActive=true;
  if(!soundOn()||!enabledByGesture||document.hidden||backgroundPaused)return;
  battlePlayer.volume=.43;
  const p=battlePlayer.play();if(p?.catch)p.catch(e=>{lastError="battle play "+String(e?.name||e)});
 }
 // Layered percussion and filtered noise: softer and less oscillator-like than the old SE.
 function battleSe(kind){
  if(!soundOn()||!enabledByGesture||document.hidden||backgroundPaused)return;
  const effects={
   slash:{length:.24,pitch:830,noise:.09,low:2400,drop:.35},
   skill:{length:.38,pitch:690,noise:.055,low:3200,drop:1.38},
   hit:{length:.29,pitch:170,noise:.18,low:1100,drop:.28},
   guard:{length:.25,pitch:310,noise:.12,low:1800,drop:.60},
   heal:{length:.50,pitch:570,noise:.024,low:3800,drop:1.5},
   victory:{length:.54,pitch:660,noise:.035,low:3900,drop:1.3}
  };
  const p=effects[kind];if(!p)return;
  try{
   ctx??=new(window.AudioContext||window.webkitAudioContext)();
   if(ctx.state!=="running")void ctx.resume();
   const t=ctx.currentTime,d=p.length;
   const out=ctx.createGain();out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(.22,t+.012);out.gain.exponentialRampToValueAtTime(.0001,t+d);out.connect(ctx.destination);
   const oscillator=ctx.createOscillator();oscillator.type=kind==="hit"?"sine":"triangle";
   oscillator.frequency.setValueAtTime(p.pitch,t);oscillator.frequency.exponentialRampToValueAtTime(Math.max(60,p.pitch*p.drop),t+d*.76);
   const tone=ctx.createGain();tone.gain.value=kind==="hit"?.13:.095;oscillator.connect(tone).connect(out);oscillator.start(t);oscillator.stop(t+d);
   const count=Math.ceil(ctx.sampleRate*d),buffer=ctx.createBuffer(1,count,ctx.sampleRate),data=buffer.getChannelData(0);
   // Deterministic short transient avoids repeating pitched electronic beeps.
   let seed=kind.length*214013+2531011;
   for(let j=0;j<count;j++){seed=(Math.imul(seed,1664525)+1013904223)|0;data[j]=((seed>>>8)/8388608-1)*Math.exp(-j/ctx.sampleRate*(kind==="slash"?19:kind==="hit"?12:15));}
   const noise=ctx.createBufferSource();noise.buffer=buffer;
   const filter=ctx.createBiquadFilter();filter.type="lowpass";filter.frequency.setValueAtTime(p.low,t);filter.frequency.exponentialRampToValueAtTime(Math.max(180,p.low*.28),t+d);
   const level=ctx.createGain();level.gain.value=p.noise;noise.connect(filter).connect(level).connect(out);noise.start(t);
   noise.onended=()=>{try{noise.disconnect();filter.disconnect();level.disconnect();oscillator.disconnect();tone.disconnect();out.disconnect()}catch{}};
  }catch(e){lastError="battle SE "+String(e?.name||e)}
 }
 function stopBgmForEncounter(){
  encounterMuted=true;requestId++;playPending=false;player.pause();
  if(bufferTest){bufferGeneration++;bufferLoading="";if(bufferSource){try{bufferSource.stop()}catch{}bufferSource.disconnect();bufferSource=null}bufferKey="";bufferOffset=0;}
 }
 function endEncounterAudio(options={}){
  stopBattleMusic();
  // Keep the field/village track muted for the ENTIRE game-over screen,
  // including visibility changes and taps, until retry/title explicitly exits.
  if(options.resumeBgm===false){encounterMuted=true;return;}
  encounterMuted=false;
  if(currentArea&&soundOn())play();
 }
 function stopForTitle(){
  stopBattleMusic();encounterMuted=true;requestId++;playPending=false;player.pause();
  if(bufferTest){
   bufferGeneration++;bufferLoading="";
   if(bufferSource){try{bufferSource.stop()}catch{}bufferSource.disconnect();bufferSource=null;}
   bufferKey="";bufferOffset=0;
  }
 }

 const lifecycleTrace=[];
 function traceAudio(event){
  lifecycleTrace.push({event,at:Math.round(performance.now()),hidden:document.hidden,paused:backgroundPaused,state:ctx?.state||"none",source:!!bufferSource,loading:bufferLoading,key:bufferKey,pending:restorePending});
  if(lifecycleTrace.length>24)lifecycleTrace.shift();
 }

 function resumeContext(){
  if(!enabledByGesture||document.hidden||backgroundPaused||!soundOn()||!ctx)return;
  const serial=++resumeSerial;traceAudio("resume-request");
  try{
   const p=ctx.resume();
   if(p?.then)p.then(()=>{
    if(serial!==resumeSerial||document.hidden||backgroundPaused)return;
    restorePending=false;traceAudio("resume-resolved");
    if(bufferTest&&currentArea&&!bufferSource&&!bufferLoading)void playBuffer(currentArea);
   },e=>{bufferError="resume "+String(e?.name||e)});
  }catch(e){bufferError="resume "+String(e?.name||e)}
 }
 function bindContext(){
  if(!ctx||ctx.__ykRecoveryBound)return;
  ctx.__ykRecoveryBound=true;
  ctx.addEventListener?.("statechange",()=>{
   traceAudio("statechange");
   if(ctx.state==="running"&&!document.hidden&&!backgroundPaused&&soundOn()&&currentArea){
    restorePending=false;
    if(bufferTest&&!bufferSource&&!bufferLoading)void playBuffer(currentArea);
   }
  });
 }
 const decodedBuffers={};
 function forceResumeFromTap(){
  enabledByGesture=true;bufferError="";
  try{
   ctx??=new(window.AudioContext||window.webkitAudioContext)();
   if(ctx.state!=="running")resumeContext();
   if(bufferTest&&currentArea&&!bufferSource){if(!bufferLoading)void playBuffer(currentArea)}
   else play();
  }catch(e){bufferError="tap "+String(e)}
 }
 async function playBuffer(key){
  if(!bufferTest||!enabledByGesture||backgroundPaused||document.hidden||!soundOn()||encounterMuted)return;
  if(bufferKey===key&&bufferSource)return;
  if(bufferLoading===key)return;
  const gen=++bufferGeneration;bufferLoading=key;
  let deferredUntilRunning=false;
  try{
   ctx??=new(window.AudioContext||window.webkitAudioContext)();bindContext();
   // Safari may leave resume() pending after foreground. Do not block buffer reconstruction.
   // Do not await resume: iOS Safari may keep this promise pending until a later user gesture.
   if(ctx.state!=="running")resumeContext();
   let buffer=decodedBuffers[key];
   if(!buffer){const resp=await fetch(tracks[key].url);if(!resp.ok)throw Error("HTTP "+resp.status);
    buffer=await ctx.decodeAudioData(await resp.arrayBuffer());decodedBuffers[key]=buffer;}
   if(gen!==bufferGeneration||backgroundPaused||document.hidden||!soundOn()||currentArea!==key||encounterMuted)return;
   // Safari can accept start() on a suspended/interrupted context without
   // producing sound. Keep the decoded buffer and create the source only once
   // the context really reports running; resume callbacks/taps will retry.
   if(ctx.state!=="running"){deferredUntilRunning=true;restorePending=true;resumeContext();return;}
   if(bufferSource){try{bufferSource.stop()}catch{}bufferSource.disconnect();bufferSource=null;}
   bufferGain??=ctx.createGain();bufferGain.connect(ctx.destination);
   const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
   source.loopStart=tracks[key].loopStart;source.loopEnd=tracks[key].loopEnd||buffer.duration;
   source.connect(bufferGain);bufferGain.gain.value=performance.now()<duckUntil?.23:.4;
   const offset=Math.max(0,Math.min(bufferOffset,buffer.duration-.01));
   source.start(0,offset);traceAudio("source-start");bufferStartedAt=ctx.currentTime;bufferSource=source;bufferKey=key;bufferError="";
  }catch(e){bufferError=String(e?.message||e)}
  finally{
   if(gen===bufferGeneration){
    bufferLoading="";
    // resume() may resolve during decoding while bufferLoading was still set.
    // Retry once the pending loader relinquishes ownership, never creating
    // a silent/stale node or restarting after a track change.
    if(deferredUntilRunning&&ctx?.state==="running"&&currentArea===key&&!bufferSource)
     queueMicrotask(()=>{if(gen===bufferGeneration&&!backgroundPaused&&!document.hidden&&soundOn()&&!encounterMuted)void playBuffer(key);});
   }
  }
 }
 function attenuate(){if(bufferTest){if(bufferGain)bufferGain.gain.value=performance.now()<duckUntil?.23:.4;}else player.volume=performance.now()<duckUntil?.23:.4}
 function play(){
  if(encounterMuted)return;
  if(bufferTest){if(currentArea)void playBuffer(currentArea);return}
  if(!soundOn()||!enabledByGesture||document.hidden||backgroundPaused||!currentArea||!player.paused||playPending)return;
  const id=requestId;playPending=true;
  try{const p=player.play();if(p?.then)p.then(()=>{if(id===requestId){playPending=false;playError="";if(document.hidden||backgroundPaused)player.pause()}},e=>{if(id===requestId){playPending=false;playError=String(e?.name||e);lastError="play "+playError}});
   else playPending=false;
  }catch(e){playPending=false;playError=String(e);lastError=playError}
 }
 function setTrack(key){
  if(key===currentArea)return;
  requestId++;playPending=false;player.pause();
  if(bufferTest){bufferGeneration++;bufferLoading="";if(bufferSource){try{bufferSource.stop()}catch{}bufferSource.disconnect();bufferSource=null}bufferKey="";bufferOffset=0;currentArea=key;play();return}
  currentArea=key;seeking=false;player.src=tracks[key].url;player.load();
  // Do not seek before metadata exists; Safari may otherwise cancel the queued playback.
  attenuate();play();
 }
 function syncBgm(area){
  const key=zone(area);
  // The game may load a different area while BGM is temporarily muted
  // (battle, game-over, title). Track the *desired* area even during mute;
  // otherwise unmuting resumes the previous zone's music or stays silent.
  if(encounterMuted){if(key!==currentArea)setTrack(key);return;}
  if(key!==currentArea)setTrack(key);
  if(!soundOn()){player.pause();if(bufferTest){bufferGeneration++;bufferLoading="";if(bufferSource){try{bufferSource.stop()}catch{}bufferSource.disconnect();bufferSource=null}bufferKey="";bufferOffset=0}return}
  attenuate();play()
 }
 function reloop(){
  if(seeking||!currentArea||!soundOn())return;seeking=true;
  try{player.currentTime=tracks[currentArea].loopStart;playPending=false;play()}
  catch(e){lastError="loop "+String(e)}finally{seeking=false}
 }
 player.addEventListener("ended",reloop);
 player.addEventListener("timeupdate",()=>{if(!seeking&&currentArea&&Number.isFinite(player.duration)&&player.duration>0&&player.currentTime>=player.duration-.085)reloop()});
 player.addEventListener("error",()=>{lastError="media error "+(player.error?.code||"unknown")+" "+currentArea});
 player.addEventListener("canplay",()=>{if(player.paused)play()});
 function unlock(){if(document.hidden||backgroundPaused)return;applySessionTest();enabledByGesture=true;
  void preloadHoragai();
  try{
   ctx??=new(window.AudioContext||window.webkitAudioContext)();bindContext();
   if(ctx.state!=="running")resumeContext();
  }catch(e){bufferError="unlock "+String(e)}
  if(battleMusicActive&&soundOn()&&!document.hidden){const p=battlePlayer.play();if(p?.catch)p.catch(()=>{})}
  play();
 }
 ["pointerdown","touchend","keydown"].forEach(ev=>document.addEventListener(ev,unlock,{passive:true}));
 function pauseForBackground(){
  if(backgroundPaused)return;
  backgroundPaused=true;clearTimeout(battleMusicTimer);battleMusicTimer=null;battlePlayer.pause();restorePending=false;resumeSerial++;traceAudio("background");player.pause();
  if(bufferTest){
   bufferGeneration++;bufferLoading="";
   if(bufferSource){
    const duration=decodedBuffers[bufferKey]?.duration||0;
    if(duration&&ctx){
     const elapsed=Math.max(0,ctx.currentTime-bufferStartedAt);
     const loop=tracks[bufferKey]?.loopStart||0;
     const total=bufferOffset+elapsed;
     bufferOffset=total<duration?total:loop+(total-loop)%(duration-loop);
    }
    try{bufferSource.stop()}catch{}
    bufferSource.disconnect();bufferSource=null;
   }
   bufferKey="";
  }
  // Suspending SE's WebAudio context prevents lingering synthesized notes.
  try{if(ctx?.state==="running")ctx.suspend().catch(()=>{})}catch{}
 }
 function resumeFromBackground(){
  if(document.hidden)return;
  traceAudio("foreground");
  backgroundPaused=false;
  if(battleMusicActive&&soundOn()&&enabledByGesture){const p=battlePlayer.play();if(p?.catch)p.catch(e=>{lastError="battle resume "+String(e?.name||e)})}
  applySessionTest();
  if(!enabledByGesture||!soundOn())return;
  // Rebuild the stopped node only when the context can run, rather than marking
  // a silent source as active while Safari is still interrupted.
  restorePending=true;
  if(ctx?.state==="running"){restorePending=false;play();}
  else resumeContext();
 }
 // Safari sometimes resumes page visibility before its audio context can run again.
 // Preserve the decoded track and retry reconstruction only on a subsequent gesture.
 function recoverFromGesture(){
  if(document.hidden||backgroundPaused||!soundOn()||!enabledByGesture)return;
  applySessionTest();
  if(!bufferTest){play();return;}
  if(battleMusicActive){const p=battlePlayer.play();if(p?.catch)p.catch(()=>{});return;}
  if(!currentArea)return;
  if(ctx?.state==="running"){if(!bufferSource&&!bufferLoading)void playBuffer(currentArea);}
  else resumeContext();
 }
 ["pointerup","keydown"].forEach(ev=>document.addEventListener(ev,recoverFromGesture,{passive:true}));
 document.addEventListener("visibilitychange",()=>{if(document.hidden)pauseForBackground();else resumeFromBackground()});
 window.addEventListener("pagehide",pauseForBackground);
 window.addEventListener("pageshow",resumeFromBackground);
 function diagnostics(){return {battleMusicActive,battlePaused:battlePlayer.paused,battleTime:battlePlayer.currentTime,area:currentArea,enabledByGesture,soundOn:soundOn(),paused:player.paused,readyState:player.readyState,networkState:player.networkState,time:player.currentTime,duration:player.duration,src:player.currentSrc,lastError,playError,backgroundPaused,hidden:document.hidden,silentTest,bufferTest,bufferKey,bufferLoading,bufferError,bufferOffset,restorePending,lifecycleTrace:lifecycleTrace.slice(),contextState:ctx?.state||"none",audioSessionTest,audioSessionResult,sessionType:navigator.audioSession?.type??"unsupported",sessionState:navigator.audioSession?.state??"unknown"}}
 function sound(freq=.0,dur=.08,type="triangle",gainLevel=.035,cutoff=1400){
  try{if(!soundOn()||!enabledByGesture||document.hidden||backgroundPaused)return;ctx??=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();
   const now=ctx.currentTime,o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();
   o.type=type;o.frequency.setValueAtTime(Math.max(55,freq),now);o.frequency.exponentialRampToValueAtTime(Math.max(50,freq*.89),now+dur);
   f.type="lowpass";f.frequency.value=cutoff;
   g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(Math.min(.12,gainLevel*1.75),now+.012);g.gain.setTargetAtTime(.00001,now+dur*.43,Math.max(.012,dur*.16));
   o.connect(f).connect(g).connect(ctx.destination);o.start(now);o.stop(now+dur+.09);
  }catch{}
 }
 function beep(freq=440,dur=.07,type="triangle"){sound(freq,dur,type,.027,1900)}
 let horagaiBuffer=null,horagaiLoading=null;
 function preloadHoragai(){
  if(horagaiBuffer)return Promise.resolve(horagaiBuffer);
  if(horagaiLoading)return horagaiLoading;
  horagaiLoading=fetch("audio/horagai-encounter.mp3?v=15.57.154")
   .then(r=>{if(!r.ok)throw Error("horagai HTTP "+r.status);return r.arrayBuffer()})
   .then(bytes=>{ctx??=new(window.AudioContext||window.webkitAudioContext)();bindContext();return ctx.decodeAudioData(bytes)})
   .then(b=>{horagaiBuffer=b;return b})
   .catch(e=>{lastError="horagai load "+String(e?.message||e);horagaiLoading=null;return null});
  return horagaiLoading;
 }
 function horagai(){
  if(!soundOn()||!enabledByGesture||document.hidden||backgroundPaused)return;
  const start=()=>{
   if(!horagaiBuffer||!soundOn()||document.hidden||backgroundPaused||ctx?.state!=="running")return;
   try{
    const src=ctx.createBufferSource(),gain=ctx.createGain();
    src.buffer=horagaiBuffer;gain.gain.value=1;
    src.connect(gain);gain.connect(ctx.destination);
    src.onended=()=>{try{src.disconnect();gain.disconnect()}catch{}};
    src.start();
   }catch(e){lastError="horagai play "+String(e?.name||e)}
  };
  if(horagaiBuffer){start();return;}
  void preloadHoragai().then(start);
 }

 const voices={child:[480,.047,1600,"triangle"],female:[345,.045,1400,"sine"],male:[215,.049,1000,"triangle"],elder:[245,.039,720,"sawtooth"],hostile:[174,.025,820,"sawtooth"],boss:[128,.052,680,"triangle"]};
 function talkChar(ch,voice="male",index=0){
  if(!/[ぁ-ゖァ-ヺー]/.test(ch)||!soundOn()||document.hidden||backgroundPaused)return;
  const p=voices[voice]||voices.male;let f=p[0];
  if(/[あかさたなはまやらわアカサタナハマヤラワ]/.test(ch))f*=1.08;
  else if(/[いきしちにひみりイキシチニヒミリ]/.test(ch))f*=1.13;
  else if(/[おこそとのほもよろをオコソトノホモヨロヲ]/.test(ch))f*=.90;
  if(/[んン]/.test(ch))sound(f*.65,.104,"triangle",p[1]*.65,550);
  else sound(f*(1+(index%3)*.025),.078,p[3],p[1],p[2]);
  duckUntil=performance.now()+260;attenuate();clearTimeout(duckTimer);duckTimer=setTimeout(()=>{duckUntil=0;attenuate()},340);
 }
 function dialogEnd(){clearTimeout(duckTimer);duckUntil=0;attenuate()}
 // Enable an explicit on-screen audio test only when ?audioDebug=1 is supplied.
 if(audioParams.get("audioDebug")==="1"||audioParams.has("audioSessionTest")||audioParams.get("audioSilentTest")==="1"){
  const panel=document.createElement("div");
  panel.style.cssText="position:fixed;top:calc(env(safe-area-inset-top) + 8px);right:8px;z-index:99999;background:#141e23ee;color:white;border:1px solid #fff;padding:6px;font:12px monospace;max-width:min(85vw,420px);max-height:75dvh;overflow:auto;border-radius:8px";
  const togglePanel=document.createElement("button");togglePanel.textContent="音声診断を開く";
  togglePanel.style.cssText="display:block;font-size:12px;padding:5px 9px;min-height:32px;background:#24344d;color:#fff;border:1px solid #baa26e;border-radius:5px";
  const details=document.createElement("div");details.hidden=true;
  togglePanel.onclick=()=>{details.hidden=!details.hidden;togglePanel.textContent=details.hidden?"音声診断を開く":"音声診断を閉じる"};
  panel.append(togglePanel,details);
  const out=document.createElement("pre");out.style.cssText="white-space:pre-wrap;margin:5px 0";
  const button=document.createElement("button");button.textContent="BGM再生テスト";button.style.cssText="font-size:14px;padding:8px";
  const status=document.createElement("div");status.style.cssText="font-size:14px;font-weight:bold;padding:5px 0;color:#ffe5a7";
  const enable=document.createElement("button");enable.textContent="音声をONにする";enable.style.cssText="font-size:14px;padding:8px;background:#e9d49b;color:#172237";
  enable.onclick=()=>{
   if(window.gameState){window.gameState.sound=true;try{window.YK_SAVE?.auto?.(window.gameState)}catch{}}
   const toggle=document.getElementById("soundToggle");if(toggle)toggle.checked=true;
   unlock();syncBgm(window.gameState?.area||"field");beep(660,.14);refreshStatus();
  };
  function refreshStatus(){
   const d=diagnostics();status.textContent=d.soundOn?"音声設定：ON":"音声設定：OFF（BGM・SEとも停止）";
   enable.style.display=d.soundOn?"none":"inline-block";
   out.textContent=JSON.stringify(d,null,2);
  }
  button.onclick=()=>{unlock();if(!currentArea){syncBgm(window.gameState?.area||"village")}play();refreshStatus()};
  details.append(status,enable,button);
  if(bufferTest){
   const resumeButton=document.createElement("button");resumeButton.textContent="復帰後の音声を再開";
   resumeButton.style.cssText="font-size:14px;padding:8px";
   resumeButton.onclick=forceResumeFromTap;details.append(resumeButton);
  }
  details.append(out);document.body.append(panel);
  refreshStatus();setInterval(refreshStatus,1500);
 }
 return {beep,horagai,battleSe,startBattleMusic,syncBgm,stopBgmForEncounter,endEncounterAudio,stopForTitle,unlock,talkChar,dialogEnd,diagnostics};
})();
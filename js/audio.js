// beta15.57.105: Safari-safe single-media BGM, preserving voice and SE synthesis.
window.YK_AUDIO=(()=>{
 let ctx=null,enabledByGesture=false,currentArea="",duckUntil=0,duckTimer=null,lastError="";
 const tracks={
  field:{url:"audio/field-v10.mp3?v=15.57.105",loopStart:7.7419354839},
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
   if(ctx.state==="suspended")ctx.resume().catch(e=>{bufferError="tap resume "+String(e?.name||e)});
   if(bufferTest&&currentArea&&!bufferSource){if(!bufferLoading)void playBuffer(currentArea)}
   else play();
  }catch(e){bufferError="tap "+String(e)}
 }
 async function playBuffer(key){
  if(!bufferTest||!enabledByGesture||backgroundPaused||document.hidden||!soundOn())return;
  if(bufferKey===key&&bufferSource)return;
  if(bufferLoading===key)return;
  const gen=++bufferGeneration;bufferLoading=key;
  try{
   ctx??=new(window.AudioContext||window.webkitAudioContext)();bindContext();
   // Safari may leave resume() pending after foreground. Do not block buffer reconstruction.
   // Do not await resume: iOS Safari may keep this promise pending until a later user gesture.
   if(ctx.state!=="running")resumeContext();
   let buffer=decodedBuffers[key];
   if(!buffer){const resp=await fetch(tracks[key].url);if(!resp.ok)throw Error("HTTP "+resp.status);
    buffer=await ctx.decodeAudioData(await resp.arrayBuffer());decodedBuffers[key]=buffer;}
   if(gen!==bufferGeneration||backgroundPaused||document.hidden||!soundOn()||currentArea!==key)return;
   if(bufferSource){try{bufferSource.stop()}catch{}bufferSource.disconnect();bufferSource=null;}
   bufferGain??=ctx.createGain();bufferGain.connect(ctx.destination);
   const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
   source.loopStart=tracks[key].loopStart;source.loopEnd=buffer.duration;
   source.connect(bufferGain);bufferGain.gain.value=performance.now()<duckUntil?.23:.4;
   const offset=Math.max(0,Math.min(bufferOffset,buffer.duration-.01));
   source.start(0,offset);traceAudio("source-start");bufferStartedAt=ctx.currentTime;bufferSource=source;bufferKey=key;bufferError="";
  }catch(e){bufferError=String(e?.message||e)}
  finally{if(gen===bufferGeneration)bufferLoading=""}
 }
 function attenuate(){if(bufferTest){if(bufferGain)bufferGain.gain.value=performance.now()<duckUntil?.23:.4;}else player.volume=performance.now()<duckUntil?.23:.4}
 function play(){
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
  const key=zone(area);if(key!==currentArea)setTrack(key);
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
  try{
   ctx??=new(window.AudioContext||window.webkitAudioContext)();bindContext();
   if(ctx.state!=="running")resumeContext();
  }catch(e){bufferError="unlock "+String(e)}
  play();
 }
 ["pointerdown","touchend","keydown"].forEach(ev=>document.addEventListener(ev,unlock,{passive:true}));
 function pauseForBackground(){
  if(backgroundPaused)return;
  backgroundPaused=true;restorePending=false;resumeSerial++;traceAudio("background");player.pause();
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
  if(!currentArea)return;
  if(ctx?.state==="running"){if(!bufferSource&&!bufferLoading)void playBuffer(currentArea);}
  else resumeContext();
 }
 ["pointerup","keydown"].forEach(ev=>document.addEventListener(ev,recoverFromGesture,{passive:true}));
 document.addEventListener("visibilitychange",()=>{if(document.hidden)pauseForBackground();else resumeFromBackground()});
 window.addEventListener("pagehide",pauseForBackground);
 window.addEventListener("pageshow",resumeFromBackground);
 function diagnostics(){return {area:currentArea,enabledByGesture,soundOn:soundOn(),paused:player.paused,readyState:player.readyState,networkState:player.networkState,time:player.currentTime,duration:player.duration,src:player.currentSrc,lastError,playError,backgroundPaused,hidden:document.hidden,silentTest,bufferTest,bufferKey,bufferLoading,bufferError,bufferOffset,restorePending,lifecycleTrace:lifecycleTrace.slice(),contextState:ctx?.state||"none",audioSessionTest,audioSessionResult,sessionType:navigator.audioSession?.type??"unsupported",sessionState:navigator.audioSession?.state??"unknown"}}
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
 return {beep,syncBgm,unlock,talkChar,dialogEnd,diagnostics};
})();
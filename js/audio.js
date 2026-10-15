// Beta 15.57.89: gapless AudioBuffer BGM with media fallback for Safari.
window.YK_AUDIO=(()=>{
 let ctx=null,enabledByGesture=false,currentArea="",current=null,phase="intro",duckUntil=0,duckTimer=null;
 let master=null,sourceIntro=null,sourceLoop=null,epoch=0,lastError="",mediaPhase="intro",mediaPending=false,lastMediaAttempt=0;
 const tracks={
  field:{intro:"audio/field-v10.ogg?v=15.57.89",loop:"audio/field-v10-loop.ogg?v=15.57.89"},
  village:{intro:"audio/hoozuki-v13.ogg?v=15.57.89",loop:"audio/hoozuki-v13-loop.ogg?v=15.57.89"}
 };
 const decoded={},pending={},fallback={};
 function soundOn(){return !window.gameState||window.gameState.sound!==false}
 function zone(a){return a==="field"?"field":"village"}
 function ensureCtx(){try{ctx??=new(window.AudioContext||window.webkitAudioContext)();if(!master){master=ctx.createGain();master.gain.value=.4;master.connect(ctx.destination)}if(ctx.state==="suspended")ctx.resume().catch(e=>{lastError=String(e?.name||e)});return true}catch(e){lastError=String(e);return false}}
 function setupMedia(key){if(fallback[key])return fallback[key];const p=tracks[key],intro=new Audio(p.intro),loop=new Audio(p.loop);for(const a of [intro,loop]){a.preload="auto";a.playsInline=true;a.addEventListener("error",()=>lastError="media error "+(a.error?.code||0))}loop.loop=true;return fallback[key]={intro,loop}}
 async function load(key){if(decoded[key])return decoded[key];if(pending[key])return pending[key];if(!ensureCtx())throw Error("WebAudio unavailable");const p=tracks[key];
 pending[key]=Promise.all([p.intro,p.loop].map(async url=>{const response=await fetch(url);if(!response.ok)throw Error("BGM HTTP "+response.status);return ctx.decodeAudioData(await response.arrayBuffer())})).then(([intro,loop])=>decoded[key]={intro,loop}).catch(e=>{lastError="decode: "+String(e);throw e}).finally(()=>{pending[key]=null});return pending[key]}
 function stopSources(){for(const s of [sourceIntro,sourceLoop]){try{s?.stop()}catch{}try{s?.disconnect()}catch{}}sourceIntro=sourceLoop=null;for(const m of Object.values(fallback)){m.intro.pause();m.loop.pause()}}
 function attenuate(){let volume=performance.now()<duckUntil?.23:.40;if(master)master.gain.setTargetAtTime(volume,ctx.currentTime,.035);for(const m of Object.values(fallback)){m.intro.volume=volume;m.loop.volume=volume}}
 function startBuffer(key,token){if(token!==epoch||!soundOn()||document.hidden||!enabledByGesture)return;const d=decoded[key];if(!d||!ensureCtx())return;stopSources();
 const intro=ctx.createBufferSource(),loop=ctx.createBufferSource();intro.buffer=d.intro;loop.buffer=d.loop;loop.loop=true;intro.connect(master);loop.connect(master);
 const time=ctx.currentTime+.035;sourceIntro=intro;sourceLoop=loop;phase="intro";
 try{intro.start(time);loop.start(time+intro.buffer.duration);intro.onended=()=>{if(epoch===token)phase="loop"};attenuate()}catch(e){lastError=String(e);startMedia(key,token)}
 }
 function startMedia(key,token){if(token!==epoch||!enabledByGesture||!soundOn()||document.hidden)return;let m=setupMedia(key);current=m;mediaPhase="intro";phase="media-intro";m.intro.currentTime=0;m.loop.currentTime=0;
 m.intro.onended=()=>{if(token!==epoch)return;mediaPhase="loop";phase="media-loop";mediaPlay(m.loop,true)};
 mediaPlay(m.intro,true);attenuate();
 }
 function mediaPlay(a,force=false){if(!a||!a.paused||mediaPending||!soundOn())return;const now=performance.now();if(!force&&now-lastMediaAttempt<1200)return;lastMediaAttempt=now;mediaPending=true;try{Promise.resolve(a.play()).then(()=>{mediaPending=false},e=>{mediaPending=false;lastError="play "+String(e?.name||e)})}catch(e){mediaPending=false;lastError=String(e)}}
 function begin(key){const token=++epoch;stopSources();current=null;phase=enabledByGesture&&soundOn()?"loading":"await-gesture";if(!enabledByGesture||!soundOn())return;
 load(key).then(()=>startBuffer(key,token)).catch(()=>startMedia(key,token));
 }
 function syncBgm(area){const key=zone(area);if(key!==currentArea){currentArea=key;begin(key)}
 if(!soundOn()){stopSources();phase="off";return}
 if(enabledByGesture&&(phase==="off"||phase==="loading"&&!pending[key]&&!decoded[key]))begin(key);
 if(phase.startsWith("media")&&current)mediaPlay(current[mediaPhase],false);
 attenuate()}
 function unlock(){enabledByGesture=true;ensureCtx();if(currentArea&&(!sourceIntro&&!sourceLoop)&&phase!=="loading"&&!phase.startsWith("media"))begin(currentArea);
 else if(phase.startsWith("media")&&current)mediaPlay(current[mediaPhase],true)}
 ["pointerdown","touchend","keydown"].forEach(ev=>document.addEventListener(ev,unlock,{passive:true}));
 document.addEventListener("visibilitychange",()=>{if(!document.hidden){ensureCtx();if(currentArea&&enabledByGesture){if(phase.startsWith("media"))mediaPlay(current?.[mediaPhase],true);else if(!sourceLoop)begin(currentArea)}}});
 window.addEventListener("pageshow",()=>{if(currentArea&&enabledByGesture&&phase.startsWith("media"))mediaPlay(current?.[mediaPhase],true)});
 function diagnostics(){return {area:currentArea,phase,enabledByGesture,context:ctx?.state,decoded:Object.keys(decoded),lastError}}
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
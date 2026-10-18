// Approved movie player. No save or quest mutation; completion is owned by game.js.
window.YK_PROLOGUE=(()=>{
 'use strict';let active=false;
 const SRC='assets/prologue/pixel-v2/prologue-pixel-v2-complete.mp4?v=15.57.201';
 function play({sound=true,onComplete}){
  if(active)return false;active=true;
  const layer=document.createElement('section');layer.id='prologuePlayer';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','序章');
  layer.innerHTML='<video playsinline webkit-playsinline preload="auto" aria-label="鬼哭の花契り 序章"></video><div class="prologueControls"><button type="button" data-play>一時停止</button><button type="button" data-sound></button><button type="button" data-skip>スキップして始める</button></div><p class="prologueStatus" role="status">序章を読み込んでいます…</p><small class="prologueCredit">音声：VOICEVOX:玄野武宏 ／ 川の音：RandomMind（CC0）</small>';
  const video=layer.querySelector('video'),resume=layer.querySelector('[data-play]'),mute=layer.querySelector('[data-sound]'),skip=layer.querySelector('[data-skip]'),status=layer.querySelector('[role="status"]');
  let finished=false,failed=false;const oldFocus=document.activeElement;
  video.muted=!sound;video.volume=1;video.src=SRC;
  const updateSound=()=>{mute.textContent=video.muted?'音声を入れる':'消音';mute.setAttribute('aria-pressed',String(video.muted));};updateSound();
  function finish(reason){if(finished)return;finished=true;video.pause();video.removeAttribute('src');video.load();document.removeEventListener('keydown',keys,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pause);layer.remove();active=false;window.YK_INPUT?.stopAll();oldFocus?.focus?.();onComplete(reason);}
  function start(){if(finished)return;if(failed){failed=false;video.load();}status.textContent='読み込み中…';try{const promise=video.play();promise?.catch(()=>{if(!finished){status.textContent='「再生する」を押してください。';resume.textContent='再生する';}});}catch(_){status.textContent='「再生する」を押してください。';resume.textContent='再生する';}}
  function pause(){if(finished)return;video.pause();resume.textContent='再生する';}
  function visibility(){if(document.hidden)pause();else if(video.paused){status.textContent='「再生する」で続きを再生できます。';resume.textContent='再生する';}}
  function keys(e){if(!active)return;if(e.key==='Tab'){e.preventDefault();const a=[resume,mute,skip],i=a.indexOf(document.activeElement);a[(i+(e.shiftKey?2:1)+3)%3].focus();}else if(e.key==='Escape'){e.preventDefault();skip.focus();}else if((e.key==='Enter'||e.key===' ')&&layer.contains(document.activeElement)){e.preventDefault();document.activeElement.click();}e.stopImmediatePropagation();}
  resume.addEventListener('click',()=>video.paused?start():pause());mute.addEventListener('click',()=>{video.muted=!video.muted;updateSound();if(video.paused)start();});skip.addEventListener('click',()=>finish('skip'));
  video.addEventListener('ended',()=>finish('ended'));video.addEventListener('playing',()=>{status.textContent='';resume.textContent='一時停止';});video.addEventListener('pause',()=>{resume.textContent='再生する';});video.addEventListener('waiting',()=>{status.textContent='読み込み中…';});
  video.addEventListener('error',()=>{if(finished)return;failed=true;status.textContent='映像を読み込めません。再試行するか、スキップして始められます。';resume.textContent='再試行';});
  document.addEventListener('keydown',keys,true);document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pause);
  document.body.appendChild(layer);resume.focus();start();return true;
 }
 return {play,get active(){return active;}};
})();

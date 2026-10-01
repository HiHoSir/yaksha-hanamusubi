window.YK_AUDIO=(()=>{
let ctx=null;
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
return {beep};
})();
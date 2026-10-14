// Pure dialogue data normalization; UI, audio, and progression remain in game.js.
window.YK_DIALOGUE=(()=>{
 function normalize(entry){
  if(!entry)return [];
  const speaker=entry.n||entry.name||"";
  const lines=Array.isArray(entry.t)?entry.t:(Array.isArray(entry.talk)?entry.talk:[String(entry.t||entry.talk||"")]);
  return lines.filter(Boolean).map(t=>typeof t==="object"&&t!==null?{speaker:String(t.speaker||speaker),text:String(t.text||"")}:{speaker,text:String(t)});
 }
 // Voice categories are metadata only; sound playback is deliberately deferred.
 const voices=['child','female','male','hostile','boss'];
 function voiceKind(value){
  return voices.includes(value)?value:'male';
 }
 return {normalize,voiceKind,voices};
})();

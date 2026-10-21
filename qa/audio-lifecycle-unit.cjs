// Deterministic Safari-style BGM route/lifecycle regression.
// Simulate a suspended AudioContext while the field MP3 finishes decoding.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const events={};let pendingResumes=[],starts=[],stops=0;
class Audio {
 constructor(url=''){this.src=url;this.paused=true;this.volume=1;this.currentTime=0;this.loop=false;this.readyState=4;this.listeners={};}
 pause(){this.paused=true;}
 play(){this.paused=false;return Promise.resolve();}
 load(){}
 addEventListener(type,cb){this.listeners[type]=cb;}
}
class Context {
 constructor(){this.state='suspended';this.currentTime=0;this.destination={};this.listeners={};Context.latest=this;}
 resume(){return new Promise(resolve=>pendingResumes.push(resolve));}
 suspend(){this.state='suspended';return Promise.resolve();}
 addEventListener(type,cb){this.listeners[type]=cb;}
 createGain(){return {gain:{value:0},connect(){}};}
 createBufferSource(){
  const node={buffer:null,loop:false,loopStart:0,loopEnd:0,connect(){},disconnect(){},stop(){stops++;},start(time,offset){starts.push({state:Context.latest.state,key:this.buffer.key,offset});}};
  return node;
 }
 decodeAudioData(bytes){return Promise.resolve({duration:86,key:bytes.key});}
}
const doc={hidden:false,addEventListener:(ev,fn)=>{(events[ev]??=[]).push(fn);},body:{append(){}},createElement:()=>({style:{},append(){},onclick:null})};
const sandbox={window:null,document:doc,navigator:{},location:{search:''},URLSearchParams,performance:{now:()=>1000},Audio,AudioContext:Context,fetch:async url=>({ok:true,arrayBuffer:async()=>({key:url.includes('field')?'field':url.includes('hoozuki')?'village':'other'})}),setTimeout,clearTimeout,queueMicrotask,console};
sandbox.window=sandbox;sandbox.window.addEventListener=(ev,fn)=>{(events['window:'+ev]??=[]).push(fn);};
vm.runInNewContext(fs.readFileSync('js/audio.js','utf8'),sandbox,{filename:'audio.js'});
const audio=sandbox.YK_AUDIO;
const flush=async()=>{for(let n=0;n<10;n++)await new Promise(resolve=>setImmediate(resolve));};
(async()=>{
 audio.syncBgm('field');
 assert.equal(audio.diagnostics().area,'field');
 assert.equal(starts.length,0,'no autoplay before gesture');
 audio.unlock();
 await flush();
 assert.equal(audio.diagnostics().bufferKey,'','suspended context must NOT be counted as playing');
 assert.equal(starts.length,0,'suspended context must NOT start a silent source');
 Context.latest.state='running';
 for(const resolve of pendingResumes.splice(0))resolve();
 await flush();
 assert.equal(audio.diagnostics().bufferKey,'field','field begins after Safari resumes');
 assert.equal(starts.at(-1).key,'field');
 assert.equal(starts.at(-1).state,'running');
 audio.syncBgm('village');
 await flush();
 assert.equal(audio.diagnostics().bufferKey,'village','village transition replaces field source');
 assert.equal(starts.at(-1).key,'village');
 assert(stops>=1,'old track source must stop on a transition');
 const oldStarts=starts.length;
 audio.stopBgmForEncounter();
 audio.startBattleMusic();
 assert(audio.diagnostics().battleMusicActive);
 assert.equal(audio.diagnostics().bufferKey,'','field/village background source stopped for battle');
 audio.endEncounterAudio({resumeBgm:false});
 await flush();
 assert.equal(starts.length,oldStarts,'game over must not restart background BGM');
 assert.equal(audio.diagnostics().battleMusicActive,false);
 audio.endEncounterAudio();
 await flush();
 assert.equal(audio.diagnostics().bufferKey,'village','manual retry can re-arm appropriate BGM');
 audio.stopForTitle();
 assert.equal(audio.diagnostics().bufferKey,'','title must silence background audio');
 audio.syncBgm('field');
 await flush();
 assert.equal(audio.diagnostics().bufferKey,'','title mute blocks restart');
 audio.endEncounterAudio();
 await flush();
 assert.equal(audio.diagnostics().bufferKey,'field','manual load from title re-arms field music');
 console.log('PASS Safari audio routing: deferred field source, village switch, gameover silence, title and manual resume');
})().catch(e=>{console.error(e);process.exitCode=1});

// Deterministic audio state-machine checks. No iPhone silent-switch claims.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/audio.js','utf8');
const listeners={},docListeners={},sources=[],oscillators=[],fetched=[];
let ctx;
class MockAudio{
 constructor(){this.paused=true;this.volume=1;this.currentTime=0;this.duration=45;this.listeners={};this.error=null;}
 addEventListener(n,fn){this.listeners[n]=fn}
 pause(){this.paused=true}
 play(){this.paused=false;return Promise.resolve()}
 load(){}
}
class MockSource{
 constructor(){this.stopped=false;this.started=false;this.loop=false;this.loopStart=0;this.loopEnd=0;sources.push(this)}
 connect(){} disconnect(){} start(t,offset=0){this.started=true;this.offset=offset} stop(){this.stopped=true}
}
class MockContext{
 constructor(){this.state='running';this.currentTime=0;this.destination={};ctx=this}
 resume(){this.state='running';return Promise.resolve()}
 suspend(){this.state='suspended';return Promise.resolve()}
 decodeAudioData(){return Promise.resolve({duration:43.2})}
 createBufferSource(){return new MockSource()}
 createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){}},connect(){}}}
 createOscillator(){const o={frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){oscillators.push(o)},stop(){}};return o}
 createBiquadFilter(){return {frequency:{value:0},connect(){}}}
}
const document={hidden:false,addEventListener:(n,f)=>(docListeners[n]??=[]).push(f),createElement:()=>({style:{},append(){},onclick:null}),body:{append(){}}};
const sandbox={document,location:{search:'?audioRouteTest=buffer'},navigator:{},Audio:MockAudio,AudioContext:MockContext,URLSearchParams,
 fetch:async url=>{fetched.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}},
 performance:{now:()=>1000},console,clearTimeout(){},setTimeout(){return 1},
 addEventListener:(n,f)=>(listeners[n]??=[]).push(f),gameState:{sound:true}};
sandbox.window=sandbox;vm.runInNewContext(source,sandbox);
const audio=sandbox.YK_AUDIO;
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
(async()=>{
 audio.unlock();audio.syncBgm('field');await tick();
 assert.equal(audio.diagnostics().bufferKey,'field','field BGM starts');
 assert.equal(audio.diagnostics().contextState,'running');
 assert.equal(sources.filter(x=>x.started&&!x.stopped).length,1,'only one active BGM');
 audio.talkChar('あ','female',0);
 assert.ok(oscillators.length>0,'dialogue SE coexists with BGM');
 audio.syncBgm('village');await tick();
 assert.equal(audio.diagnostics().bufferKey,'village','village BGM starts');
 assert.equal(sources.filter(x=>x.started&&!x.stopped).length,1,'field BGM released on village change');
 sandbox.gameState.sound=false;audio.syncBgm('village');await tick();
 assert.equal(sources.filter(x=>x.started&&!x.stopped).length,0,'sound OFF stops BGM');
 const seCount=oscillators.length;audio.talkChar('あ','female',1);
 assert.equal(oscillators.length,seCount,'sound OFF suppresses SE');
 sandbox.gameState.sound=true;audio.syncBgm('village');await tick();
 assert.equal(audio.diagnostics().bufferKey,'village','sound ON resumes BGM');
 ctx.currentTime+=6;document.hidden=true;for(const f of docListeners.visibilitychange||[])f();await tick();
 assert.equal(audio.diagnostics().backgroundPaused,true);
 assert.equal(audio.diagnostics().contextState,'suspended');
 assert.equal(sources.filter(x=>x.started&&!x.stopped).length,0,'background releases BGM');
 document.hidden=false;for(const f of docListeners.visibilitychange||[])f();await tick();
 assert.equal(audio.diagnostics().backgroundPaused,false);
 assert.equal(audio.diagnostics().contextState,'running');
 assert.equal(audio.diagnostics().bufferKey,'village','foreground restores BGM');
 assert.ok(sources.at(-1).offset>0,'foreground resumes from previous position');
 assert.equal(sources.filter(x=>x.started&&!x.stopped).length,1,'no duplicate BGM after resume');
 assert.ok(fetched.some(x=>x.includes('field-v10.mp3'))&&fetched.some(x=>x.includes('hoozuki-v13.mp3')));
 console.log('Audio field/village switching, SE, mute, and background resume contracts OK');
})().catch(e=>{console.error(e);process.exitCode=1});

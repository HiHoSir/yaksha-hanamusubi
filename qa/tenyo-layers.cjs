const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const env={console,Image:class{constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1024}},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('assets/maps/tenyo/walkability-48x32.json'))})};
env.window=env;vm.runInNewContext(fs.readFileSync('js/tenyo-main-scene.js','utf8'),env);
const scene=env.YK_TENYO;
function order(y){
 const calls=[];
 let clip=null,rect=null;const stack=[];
 const ctx={save(){stack.push(clip)},restore(){clip=stack.pop()},setTransform(){},beginPath(){rect=null},rect(x,y,w,h){rect={x,y,w,h}},clip(){clip=rect},drawImage(im){const layer=im.src.match(/layer-([\w-]+)/)[1];calls.push(layer==='torii'?(clip&&clip.y>0?'torii-base':'torii-upper'):layer)}};
 scene.draw(ctx,{x:588,y},()=>calls.push('hero'),i=>calls.push('npc'+i),()=>calls.push('chest'));
 return calls;
}
const before=(list,a,b)=>{assert(list.includes(a),a+' missing');assert(list.includes(b),b+' missing');assert(list.indexOf(a)<list.indexOf(b),a+' must draw below '+b+': '+list.join(' -> '));};
for(const y of [444,492,503.9,504,504.1,516,708]){
 const list=order(y);
 before(list,'background','torii-base');before(list,'torii-base','trees-back');
 before(list,'trees-back','shrine');before(list,'shrine','hero');
 for(const actor of ['hero','npc0','npc1','chest','torii-upper'])before(list,actor,'trees-front');
 assert.equal(list.filter(x=>x==='torii-base').length,1,'torii base is drawn once');
 assert.equal(list.filter(x=>x==='torii-upper').length,1,'torii upper is drawn once');
 assert.equal(list.filter(x=>x==='hero').length,1,'hero is drawn exactly once');
 // Front edge of the authored row-20 contact cells, in the map's render units.
 if(y<21*scene.WALK_CELL)before(list,'hero','torii-upper');
 else before(list,'torii-upper','hero');
 before(list,'shrine','npc0');before(list,'shrine','npc1');
 before(list,'npc0','torii-upper');before(list,'torii-upper','chest');
}
console.log('Tenyo layers: torii base < back trees < shrine < actors < front trees; torii upper depth switches at contact edge using rendered foot, including ties and fractional motion');

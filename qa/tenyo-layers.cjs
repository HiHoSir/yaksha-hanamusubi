const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const env={console,Image:class{constructor(){this.complete=true;this.naturalWidth=1536}},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('assets/maps/tenyo/walkability-48x32.json'))})};
env.window=env;vm.runInNewContext(fs.readFileSync('js/tenyo-main-scene.js','utf8'),env);
const scene=env.YK_TENYO;
function order(y){
 const calls=[];
 const ctx={save(){},restore(){},setTransform(){},drawImage(im){calls.push(im.src.match(/layer-(\w+)/)[1])}};
 scene.draw(ctx,{x:588,y},()=>calls.push('hero'),i=>calls.push('npc'+i),()=>calls.push('chest'));
 return calls;
}
const before=(list,a,b)=>assert(list.indexOf(a)<list.indexOf(b),a+' must draw below '+b+': '+list.join(' -> '));
for(const y of [444,492,503.9,504,504.1,516,708]){
 const list=order(y);
 before(list,'background','trees');before(list,'trees','shrine');before(list,'shrine','hero');
 assert.equal(list.filter(x=>x==='torii').length,1,'torii is drawn exactly once');
 assert.equal(list.filter(x=>x==='hero').length,1,'hero is drawn exactly once');
 // Front edge of the authored row-20 contact cells, in the map's render units.
 if(y<21*scene.WALK_CELL)before(list,'hero','torii');
 else before(list,'torii','hero');
 before(list,'shrine','npc0');before(list,'shrine','npc1');
 before(list,'npc0','torii');before(list,'torii','chest');
}
console.log('Tenyo layers: trees < shrine < actors; torii depth switches at contact edge using rendered foot, including ties and fractional motion');

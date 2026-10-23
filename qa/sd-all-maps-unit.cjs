const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'../js/game.js'),'utf8');
const body=source.slice(source.indexOf('function hero('),source.indexOf('// Measure opaque character bounds'));
const sd={complete:true,naturalWidth:96,naturalHeight:128,datasetSrc:'sd.png'},hd={complete:true,naturalWidth:768,naturalHeight:1024};
const env={hizukiArt:'sd',S:{area:'field',dir:'d',frame:1,outfit:'normal'},HIZUKI_FIELD_SD:sd,HIZUKI_4DIR:hd,HIZUKI_PIXEL:{},HIZUKI_8DIR:{},HIZUKI_4DIR_ROW:{d:0,u:1,r:2,l:3},characterScale:()=>1,ensureImage:im=>{im.src||=im.datasetSrc},layerReady:im=>!!(im?.complete&&im.naturalWidth),sdFieldBounds:()=>({left:4,width:23,bottom:30,height:28}),shadow:()=>{}};
vm.createContext(env);vm.runInContext(body,env);
let cases=0;
for(const area of ['field','village','teahouse','osumiHome','villageRoom','shrine','forest','cave','mountain','capital','debugField'])for(const dir of ['d','u','r','l'])for(const frame of [0,1,2])for(const z of [.16,.56,.92]){
 env.S.area=area;env.S.dir=dir;const before=JSON.stringify(env.S);let args,smoothing;
 const ctx={save(){},restore(){},drawImage(...a){args=a;smoothing=this.imageSmoothingEnabled;}};
 env.hero(ctx,100,90,dir,frame,'normal',z);
 assert.equal(args?.[0],sd,`${area} must use SD, not area-dependent HD`);
 assert.equal(args[2],env.HIZUKI_4DIR_ROW[dir]*32);
 assert.equal(args[3],32);assert.equal(args[4],32);
 assert.equal(args[1],(frame===1?0:frame===0?1:(env.HIZUKI_4DIR_ROW[dir]>=2?1:2))*32);
 assert(Math.abs(args[6]+31*args[8]/32-(90+9*z))<1e-8,'preserve rendered foot');
 assert(Math.abs(28*args[8]/32-28*z/.56)<1e-8,'shared nominal height');
 assert.equal(smoothing,false);assert.equal(JSON.stringify(env.S),before);cases++;
}
assert.equal(sd.src,'sd.png','load SD outside world field too');
sd.complete=false;
let fallback;env.hero({save(){},restore(){},drawImage(im){fallback=im}},100,90,'d',1,'normal',.56);
assert.equal(fallback,hd,'keep visible approved fallback if SD fails to load');
console.log(`PASS ${cases} SD map/direction/frame/scale draws, shared foot, state preservation and HD fallback`);

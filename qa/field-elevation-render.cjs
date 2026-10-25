const fs=require('fs'),vm=require('vm'),{createCanvas,Image}=require('@napi-rs/canvas');
class LocalImage extends Image{set src(p){super.src=fs.readFileSync(p.split('?')[0]);}}
const env={Image:LocalImage,document:{createElement:()=>createCanvas(1,1)},YK_AUTOTILE:{ready:()=>true}};env.window=env;
for(const f of ['field-terrain','elevation-model','field-elevation','world','landscape','elevation-view'])vm.runInNewContext(fs.readFileSync('js/'+f+'.js','utf8'),env);
const hero=new LocalImage();hero.src='assets/characters/hizuki/field-sd-v1/walk-atlas-32.png';env.YK_LANDSCAPE.load();
setTimeout(()=>{
 if(!env.YK_LANDSCAPE.ready())throw Error(JSON.stringify(env.YK_LANDSCAPE.errors));
 fs.mkdirSync('qa/results/field-elevation',{recursive:true});
 const points=[...Object.entries(env.YK_WORLD.places).map(([id,p])=>[id,p.point]),['fox-ramp',[1296,352]],['waterfall-ramp',[2160,720]],['west-terrace',[384,1184]]];
 for(const [id,[x,y]] of points){
  const c=createCanvas(640,544),ctx=c.getContext('2d');
  const actor={x,foot:y,draw:(px,py,z)=>ctx.drawImage(hero,32,0,32,32,px-16*z,py-32*z,32*z,32*z)};
  const start=performance.now();env.YK_LANDSCAPE.drawQuarter(ctx,env.YK_WORLD.mapData,actor,1.4,{oceanOutside:true,elevationTerrain:true});
  fs.writeFileSync('qa/results/field-elevation/'+id+'.png',c.toBuffer('image/png'));
  const times=[];for(let n=0;n<5;n++){const t=performance.now();env.YK_LANDSCAPE.drawQuarter(ctx,env.YK_WORLD.mapData,actor,1.4,{elevationTerrain:true});times.push(performance.now()-t);}
  console.log(id,'warm median ms',times.sort((a,b)=>a-b)[2].toFixed(1));c.width=1;c.height=1;if(global.gc)global.gc();
 }
},100);

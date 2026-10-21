// Exact pixel-parity regression for the field projection memoization.
// Both worlds use the same real assets and chunk-cache policy. Only the
// projection function differs, so all pixels must remain unchanged.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,Image}=require('@napi-rs/canvas');
class LocalImage extends Image {set src(src){super.src=fs.readFileSync(src.split('?')[0]);}}
const source=fs.readFileSync('js/elevation-view.js','utf8');
const marker=/  \/\/ Exact world-space vertices[\s\S]*?  const diagnostic=window\.YK_CLIFF_DEBUG===true;/;
assert(marker.test(source),'projection optimization contract changed');
const classic=source.replace(marker,`  const point=(x,y,h)=>{
   const p=YK_LANDSCAPE.project(x,y,camera,zoom);
   return p&&{...p,y:p.y-h*rise*p.scale};
  };
  const diagnostic=window.YK_CLIFF_DEBUG===true;`);
const files=['field-terrain','elevation-model','field-elevation','world','landscape'];
function setup(viewSource){
 const env={Image:LocalImage,document:{createElement:()=>createCanvas(1,1)},YK_AUTOTILE:{ready:()=>true}};
 env.window=env;
 const context=vm.createContext(env);
 for(const file of files)vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),context,{filename:file+'.js'});
 vm.runInContext(viewSource,context,{filename:'elevation-view.js'});
 const hero=new LocalImage();hero.src='assets/characters/hizuki/field-sd-v1/walk-atlas-32.png';
 env.YK_LANDSCAPE.load();
 return {env,hero};
}
const before=setup(classic),after=setup(source);
function render(session,x,y){
 const canvas=createCanvas(640,544),c=canvas.getContext('2d');
 const actor={x,foot:y,draw:(px,py,z)=>c.drawImage(session.hero,32,0,32,32,px-16*z,py-32*z,32*z,32*z)};
 session.env.YK_LANDSCAPE.drawQuarter(c,session.env.YK_WORLD.mapData,actor,1.4,{oceanOutside:true,elevationTerrain:true});
 return c.getImageData(0,0,640,544).data;
}
async function main(){
 for(let n=0;n<40&&(!before.env.YK_LANDSCAPE.ready()||!after.env.YK_LANDSCAPE.ready());n++)
  await new Promise(resolve=>setTimeout(resolve,50));
 assert(before.env.YK_LANDSCAPE.ready(),JSON.stringify(before.env.YK_LANDSCAPE.errors));
 assert(after.env.YK_LANDSCAPE.ready(),JSON.stringify(after.env.YK_LANDSCAPE.errors));
 const w=after.env.YK_WORLD;
 const samples=[
  ['village',w.places.village.point],
  ['waterfall-ramp',[2160,720]],
  ['fox-ramp',[1296,352]],
  ['western-terrace',[384,1184]],
  ['shore',[1280,1920]]
 ];
 for(const [name,[x,y]] of samples){
  const a=render(before,x,y),b=render(after,x,y);
  assert.equal(a.length,b.length,'canvas bytes '+name);
  let changes=0,first=-1;
  for(let i=0;i<a.length;i++)if(a[i]!==b[i]){changes++;if(first===-1)first=i;}
  assert.equal(changes,0,'pixel parity '+name+' ('+changes+' channels differ, first '+first+')');
  console.log('PASS pixel parity '+name+' 640x544');
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});

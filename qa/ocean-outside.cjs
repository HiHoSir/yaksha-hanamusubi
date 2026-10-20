const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{createCanvas,Image}=require('@napi-rs/canvas');
class LocalImage extends Image{set src(p){super.src=fs.readFileSync(p.split('?')[0]);}}
const env={Image:LocalImage,document:{createElement:()=>createCanvas(1,1)},YK_AUTOTILE:{ready:()=>true}};env.window=env;
vm.runInNewContext(fs.readFileSync('js/landscape.js','utf8'),env);const land=env.YK_LANDSCAPE;land.load();
setTimeout(()=>{
 assert(land.ready(),JSON.stringify(land.errors));const map=Array.from({length:8},()=>Array(8).fill('sea'));map.referencePlacedObjects=true;
 const sheet=createCanvas(1280,1088),out=sheet.getContext('2d');
 for(const [i,[x,y]] of [[0,0],[256,0],[0,256],[256,256]].entries()){
  const c=createCanvas(640,544),ctx=c.getContext('2d');
  land.drawQuarter(ctx,map,{x,foot:y,draw:()=>{}},1.4,{oceanOutside:true,objects:[]});
  const pixels=ctx.getImageData(x===0?0:580,400,60,120).data,colors=new Set();for(let p=0;p<pixels.length;p+=4){assert.equal(pixels[p+3],255);colors.add(pixels.slice(p,p+3).join(','));}
  assert(colors.size>20,'ocean outside edge must retain texture');out.drawImage(c,i%2*640,Math.floor(i/2)*544);
 }
 fs.mkdirSync('qa/results/destinations',{recursive:true});fs.writeFileSync('qa/results/destinations/ocean-corners.png',sheet.toBuffer('image/png'));console.log('All four map corners: textured opaque ocean outside bounds');
},100);

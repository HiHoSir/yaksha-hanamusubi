const fs=require('fs'),vm=require('vm'),{createCanvas,Image}=require('@napi-rs/canvas');
class LocalImage extends Image{set src(path){super.src=fs.readFileSync(path.split('?')[0]);}get src(){return super.src;}}
const env={Image:LocalImage,document:{createElement:()=>createCanvas(1,1)},YK_AUTOTILE:{ready:()=>true}};env.window=env;
for(const name of ['field-terrain','world','landscape'])vm.runInNewContext(fs.readFileSync('js/'+name+'.js','utf8'),env);
const art=env.YK_LANDSCAPE,w=env.YK_WORLD;art.load();
setTimeout(()=>{
 if(!art.ready())throw Error(JSON.stringify(art.errors));
 fs.mkdirSync('qa/results/reference-field',{recursive:true});
 const id=process.argv[2]||'forest';
 const [wx,wy]=w.places[id].point,ox=Math.max(0,Math.floor(wx/32)-12),oy=Math.max(0,Math.floor(wy/32)-16);
 const map=w.mapData.slice(oy,oy+28).map(r=>r.slice(ox,ox+26));
 map.referencePlacedObjects=true;map.shoreRelief=true;
 map.bridgeWaterCells=new Set(env.YK_FIELD_TERRAIN.referenceComposition.bridgeWaterCells.map(([x,y])=>(x-ox)+','+(y-oy)));
 map.paths=w.roads.map(r=>r.map(([x,y])=>[x-ox*32,y-oy*32]));
 map.decorations=w.mapData.decorations.filter(o=>o.x+o.width>=ox*32&&o.x<(ox+26)*32&&o.y+o.height>=oy*32&&o.y<(oy+28)*32).map(o=>({...o,x:o.x-ox*32,y:o.y-oy*32,foot:o.foot-oy*32}));
 const c=createCanvas(640,544);
 art.drawQuarter(c.getContext('2d'),map,{x:wx-ox*32,foot:wy-oy*32+96,draw:()=>{}},1.4);
 fs.writeFileSync('qa/results/reference-field/'+id+'.png',c.toBuffer('image/png'));
 console.log('Rendered production ground, art and perspective:',id);
},100);

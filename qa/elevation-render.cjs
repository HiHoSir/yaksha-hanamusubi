const fs=require('fs'),vm=require('vm'),{createCanvas,Image}=require('@napi-rs/canvas');
class LocalImage extends Image{set src(p){super.src=fs.readFileSync(p.split('?')[0]);}}
const env={Image:LocalImage,document:{createElement:()=>createCanvas(1,1)}};env.window=env;for(const f of ['landscape','elevation-model','elevation-view'])vm.runInNewContext(fs.readFileSync('js/'+f+'.js','utf8'),env);
(async()=>{const art=await env.YK_ELEVATION_VIEW.load();fs.mkdirSync('qa/results/elevation',{recursive:true});
for(const mat of ['mixed','grass','sand','snow']){const c=createCanvas(640,544),m=env.YK_ELEVATION.fixture(mat);env.YK_ELEVATION_VIEW.render(c.getContext('2d'),m,art,{x:240,y:400,dir:'u'},{});fs.writeFileSync('qa/results/elevation/'+mat+'.png',c.toBuffer('image/png'));}console.log('Four material variants rendered with production projection and heroine');})();

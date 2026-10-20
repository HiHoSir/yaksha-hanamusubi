const fs=require('fs'),vm=require('vm'),{createCanvas,Image}=require('@napi-rs/canvas');
class LocalImage extends Image{set src(p){super.src=fs.readFileSync(p.split('?')[0]);}}
const env={Image:LocalImage,document:{createElement:()=>createCanvas(1,1)}};env.window=env;for(const f of ['landscape','elevation-model','elevation-view'])vm.runInNewContext(fs.readFileSync('js/'+f+'.js','utf8'),env);
(async()=>{const art=await env.YK_ELEVATION_VIEW.load();fs.mkdirSync('qa/results/elevation',{recursive:true});
for(const mat of ['mixed','grass','sand','snow']){const c=createCanvas(640,544),m=env.YK_ELEVATION.fixture(mat);env.YK_ELEVATION_VIEW.render(c.getContext('2d'),m,art,{x:240,y:400,dir:'u'},{});fs.writeFileSync('qa/results/elevation/'+mat+'.png',c.toBuffer('image/png'));}const sheet=createCanvas(1280,800),q=sheet.getContext('2d');q.fillStyle='#102a35';q.fillRect(0,0,1280,800);
for(const [i,cut] of [0,24].entries()){
 const c=createCanvas(640,544),m=env.YK_ELEVATION.fixture('grass');m.cornerCut=cut;
 env.YK_ELEVATION_VIEW.render(c.getContext('2d'),m,art,{x:240,y:400,dir:'u'},{});
 q.drawImage(c,i*640,28);q.fillStyle='#fff';q.font='18px sans-serif';q.fillText(cut?'Diagonal / 24px':'Square / 0px',i*640+16,21);
 q.imageSmoothingEnabled=false;q.drawImage(c,130,285,390,100,i*640,584,640,164);
}
fs.writeFileSync('qa/results/elevation/corner-comparison.png',sheet.toBuffer('image/png'));
console.log('Four materials and square/diagonal comparison rendered');})();


// Native Canvas integration QA; does not claim browser or Safari device coverage.
const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const html=fs.readFileSync(process.argv[2]||'interior-map-editor.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
 const sandbox={};vm.createContext(sandbox);vm.runInContext(script.slice(script.indexOf('const assets='),script.indexOf('const old='))+';globalThis.catalog=assets;',sandbox);
 const assets=sandbox.catalog,by=Object.fromEntries(assets.map(x=>[x.id,x])),images=new Map();
 for(const src of new Set(assets.filter(x=>x.src).map(x=>x.src))){const path=src.split('?')[0];a(fs.existsSync(path),'missing '+path);images.set(src,await loadImage(path));}
 for(const x of assets.filter(x=>x.crop)){const im=images.get(x.src),[sx,sy,w,h]=x.crop;a(sx+w<=im.width&&sy+h<=im.height,'crop '+x.id);}
 const canvas=createCanvas(96,96);canvas.style={};const ctx=canvas.getContext('2d');
 const controls={zoom:{value:'1'},coll:{checked:false},grid:{checked:false},heroPreview:{checked:false},summary:{},layer:{value:'object'}};
 const data={floor:Array(9).fill(null),structure:Array(9).fill(null),object:Array(9).fill(null),stairs:Array(9).fill(null),collision:Array(9).fill(null),elevation:Array(9).fill(0),spawn:null,exits:[]};
 const c={canvas,ctx,w:3,h:3,S:32,data,$:id=>controls[id],byId:()=>by,getImage:x=>images.get(x?.src),fallback:()=>{},selectedCell:null,heroPos:null};vm.createContext(c);
 vm.runInContext(script.slice(script.indexOf('function drawHearthFire'),script.indexOf('function migrateStairs')),c);
 data.stairs[4]='stairs_m';c.draw();const expected=createCanvas(96,96),e=expected.getContext('2d');e.imageSmoothingEnabled=false;e.drawImage(images.get(by.stairs_m.src),...by.stairs_m.crop,32,32,32,32);
 a.deepEqual(Buffer.from(ctx.getImageData(32,32,32,32).data),Buffer.from(e.getImageData(32,32,32,32).data),'stair map pixels must match registered artwork, not a primitive override');
 for(const [id,start,end] of [['wall_side_l',24,32],['wall_side_r',0,8]]){const p=createCanvas(32,32),q=p.getContext('2d');c.drawSideWall(q,images.get(by[id].src),by[id],0,0);const d=q.getImageData(0,0,32,32).data;for(let y=0;y<32;y++)for(let x=0;x<32;x++)a.equal(d[(y*32+x)*4+3]>0,x>=start&&x<end,id+' inner strip');}
 data.stairs.fill(null);data.floor.fill('wood');data.object[4]='table';a.equal(c.canStep(1,2,1,1),false);data.object[4]='cushion';a.equal(c.canStep(1,2,1,1),true);
 data.object.fill(null);data.floor[1]='raised_wood';a.equal(c.canStep(1,1,1,0),false);data.stairs[4]='stairs_m';a.equal(c.canStep(1,1,1,0),true);a.equal(c.canStep(1,0,1,1),true);
 // Capture a real draw() room with new materials and the adopted SD heroine.
 c.w=10;c.h=8;for(const l of ['floor','structure','object','stairs','collision','elevation'])data[l]=Array(80).fill(l==='floor'?'wood':l==='elevation'?0:null);
 for(let x=0;x<10;x++){data.structure[x]='wall';data.structure[70+x]='wall';}for(let y=1;y<7;y++){data.structure[y*10]='wall_side_l';data.structure[y*10+9]='wall_side_r';}
 for(const [x,y,id] of [[2,1,'shelf_l'],[3,1,'shelf_m'],[4,1,'shelf_r'],[2,3,'table'],[2,4,'cushion'],[6,3,'table'],[6,4,'cushion']])data.object[y*10+x]=id;
 c.draw();const hero=await loadImage('assets/characters/hizuki/field-sd-v2/walk-atlas-32.png');ctx.drawImage(hero,0,0,32,32,128,128,32,32);
 fs.writeFileSync('/tmp/interior-polish-room.png',canvas.toBuffer('image/png'));
 console.log('PASS: registered assets/crops, JavaScript startup syntax, actual stair pixels, inward side walls, whole-cell furniture collision, stair transitions, native Canvas room rendering');
})().catch(e=>{console.error(e);process.exitCode=1});

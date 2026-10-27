const assert=require('node:assert/strict'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const M=require('../js/settlement-map/model.js'),R=require('../js/settlement-map/render.js'),C=require('../js/settlement-map/catalog.js');
global.document={createElement:()=>createCanvas(32,32)};
(async()=>{const images={};for(const t of C.templates.filter(x=>x.id.startsWith('clear_water_')))images[t.id]=await loadImage(t.src);
const rock=createCanvas(96,64),rc=rock.getContext('2d');rc.fillStyle='#f04020';rc.fillRect(0,0,96,64);images.rock_island_lantern_base=rock;
let m=M.createMap(8,8);m=M.place(m,'rock_island_lantern_base',2,4);const canvas=createCanvas(256,256),ctx=canvas.getContext('2d');
const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data);R.draw(ctx,m,{images,forExport:true});const dryTop=pixel(80,115),dryFoot=pixel(80,155);
m=M.paintWater(m,'surface','mid',[[2,4],[3,4],[4,4]],1);R.draw(ctx,m,{images,forExport:true});assert.deepEqual(pixel(80,115),dryTop,'upper rock stays above water');assert.notDeepEqual(pixel(80,155),dryFoot,'submerged foot is tinted by water');
const p=pixel(80,155);assert(p[0]>0&&p[2]>0,'rock and water both remain visible');console.log('PASS: submerged rock is tinted only where water exists');})();

const assert=require('node:assert/strict'),fs=require('node:fs'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const O=require('../js/sprite-outline.js'),P=require('../js/hozuki-village-core.js'),R=require('../js/settlement-map/render.js');
(async()=>{
 const atlas=await loadImage(process.argv[2]),bounds=P.fieldBounds(atlas,createCanvas),preview=createCanvas(96*6,128*6),pc=preview.getContext('2d');pc.fillStyle='#d8dfb1';pc.fillRect(0,0,576,768);pc.imageSmoothingEnabled=false;
 for(const [r,dir]of ['d','u','r','l'].entries())for(let col=0;col<3;col++){
  const canvas=createCanvas(48,48),c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  O.draw(c,atlas,col*32,r*32,32,32,8,8,32,32,createCanvas);
  const actual=c.getImageData(8,8,32,32).data,src=createCanvas(32,32).getContext('2d');src.drawImage(atlas,col*32,r*32,32,32,0,0,32,32);const raw=src.getImageData(0,0,32,32).data;
  for(let i=0;i<raw.length;i+=4)if(raw[i+3]===255)assert.deepEqual(Array.from(actual.slice(i,i+4)),Array.from(raw.slice(i,i+4)),'original colours unchanged');
  pc.drawImage(canvas,7,7,34,34,col*192,r*192,192,192);
  const state=P.spriteState({x:0,y:0,dir,frame:[1,0,2][col]});assert.equal(state.frame,col);
  R.actor(c,state,atlas,bounds,32,(...args)=>O.draw(...args,createCanvas));
 }
 const game=fs.readFileSync(__dirname+'/../js/game.js','utf8'),village=fs.readFileSync(__dirname+'/../js/hozuki-village-game.js','utf8');
 assert(!village.includes('field-sd-v1/'));assert(village.includes('field-sd-v3/walk-atlas-32.png?v='));
 assert(!game.includes('hizukiArt==="sd"&&S.area==="field"'));assert.equal((game.match(/YKSpriteOutline.draw\(c,HIZUKI_FIELD_SD/g)||[]).length,2);
 fs.writeFileSync(__dirname+'/outline-preview.png',preview.toBuffer('image/png'));
 console.log('PASS 12 outlined frames: exact opaque colours, boundary padding, village actor path, all directions/steps, new village atlas and loading/field calls');
})();


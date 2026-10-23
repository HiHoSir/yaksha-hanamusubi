const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),R=require('../js/rules.js'),V=require('../js/renderer.js'),Motion=require('../js/motion.js');
(async()=>{
const a={atlas:JSON.parse(fs.readFileSync(root+'/assets/atlas.json'))};for(const [k,p] of Object.entries({objects:'objects.png',hero:'hizuki.png'}))a[k]=await loadImage(root+'/assets/'+p);
const temp=createCanvas(96,128);a.heroBounds=V.actorBounds(temp.getContext('2d'),a.hero);
const ground=createCanvas(512,448),g=ground.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#b6ad43';g.fillRect(0,0,512,448);
// Dedicated village ground, drawn at native resolution. No field-map tiles loaded.
let seed=87612;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<2000;i++){const x=Math.floor(rand()*512),y=Math.floor(rand()*448);g.fillStyle=rand()<.5?'#b3a83e':'#baae46';g.fillRect(x,y,2,1);}
const clear=new Set(Object.values(R.layout.routes).flat().map(p=>p.join(',')));
for(let ty=0;ty<14;ty++)for(let tx=0;tx<16;tx++){if(tx===13||clear.has(tx+','+ty)||R.objectOwners.has(tx+','+ty))continue;for(let i=0;i<18;i++){const x=tx*32+Math.floor(rand()*30),y=ty*32+Math.floor(rand()*30);g.fillStyle=['#729331','#879c30','#a0a52f'][Math.floor(rand()*3)];g.fillRect(x,y,3,2);g.fillStyle='#5e8d31';g.fillRect(x+1,y-1,1,2);}}
for(let y=0;y<448;y+=4){const x=416;g.fillStyle='#697f36';g.fillRect(x,y,32,4);const inset=y%12?3:5;g.fillStyle='#3779a5';g.fillRect(x+inset,y,32-2*inset,4);g.fillStyle='#4c9bba';if(y%16===0)g.fillRect(x+11,y,8,1);g.fillStyle='#a6a36b';g.fillRect(x+1,y,2,2);g.fillRect(x+29,y+2,2,2);}
for(const [tx,ty] of R.layout.bridgeDeckTiles){const x=tx*32,y=ty*32;g.fillStyle='#5d452e';g.fillRect(x,y,32,32);for(let i=0;i<5;i++){g.fillStyle=i%2?'#aa8250':'#ba945c';g.fillRect(x+1+i*6,y+2,5,28);g.fillStyle='#d6b67b';g.fillRect(x+1+i*6,y+2,1,28);g.fillStyle='#88633d';g.fillRect(x+3+i*6,y+9,1,7);}g.fillStyle='#5d452e';g.fillRect(x,y,32,3);g.fillRect(x,y+29,32,3);g.fillStyle='#c5a06c';g.fillRect(x,y,32,1);g.fillRect(x,y+29,32,1);}
fs.writeFileSync(root+'/assets/ground.png',ground.toBuffer('image/png'));a.ground=ground;
for(const t of R.targets)assert(R.path({x:6,y:13},{x:t.cell[0],y:t.cell[1]}),'unreachable '+t.id);
for(const [k,owners] of R.objectOwners)assert.equal(owners.length,1,k);
for(const o of R.objects){for(const p of o.occupiedTiles)assert(!R.walkable(...p));const isolated=createCanvas(512,448),cc=isolated.getContext('2d');cc.imageSmoothingEnabled=false;const out=V.drawObject(cc,a,o),[x,y,w,h]=V.spriteRect(o);assert(out.dest[0]>=x&&out.dest[1]>=y&&out.dest[0]+out.dest[2]<=x+w+1e-7&&out.dest[1]+out.dest[3]<=y+h+1e-7,'art overhang '+o.id);const pix=cc.getImageData(0,0,512,448).data;for(let yy=0;yy<448;yy++)for(let xx=0;xx<512;xx++)if(pix[(yy*512+xx)*4+3])assert(xx>=x&&xx<x+w&&yy>=y&&yy<y+h,'alpha overhang '+o.id);}
for(const d of ['d','u','r','l'])for(let f=0;f<3;f++){const cv=createCanvas(512,448),c=cv.getContext('2d');V.drawHero(c,a,{x:7,y:7},d,f);const p=c.getImageData(0,0,512,448).data;for(let y=0;y<448;y++)for(let x=0;x<512;x++)if(p[(y*512+x)*4+3])assert(x>=224&&x<256&&y>=224&&y<256,'hero outside cell');}
let attempts=0;for(let y=0;y<R.height;y++)for(let x=0;x<R.width;x++)if(R.walkable(x,y))for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const m=Motion.create();m.reset({x,y});const ok=m.start(dx,dy,0);assert.equal(ok,R.walkable(x+dx,y+dy));if(ok){const half=m.sample(72);assert.equal(half.x,x+dx*.5);assert.equal(half.y,y+dy*.5);m.tick(144);assert.deepEqual(m.position,{x:x+dx,y:y+dy});}else{m.tick(144);assert.deepEqual(m.position,{x,y});}attempts++;}
for(const [name,opts] of [['clean',{}],['grid',{grid:true,collision:true,centers:true}]]){const native=createCanvas(512,448),c=native.getContext('2d');V.draw(c,a,R.spawn,opts);const cv=createCanvas(1024,896),out=cv.getContext('2d');out.imageSmoothingEnabled=false;out.drawImage(native,0,0,1024,896);fs.writeFileSync(root+'/qa/'+name+'.png',cv.toBuffer('image/png'));}
console.log(JSON.stringify({result:'PASS',targets:R.targets.length,objectFootprints:R.objects.length,heroFrames:12,movementAttempts:attempts,world:'16x14 /512x448',layers:'background+hero',fieldMapTilesUsed:false}));
})().catch(e=>{console.error(e);process.exitCode=1});

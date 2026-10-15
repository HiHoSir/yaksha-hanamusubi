// Pack the generated pixel illustration. No pose synthesis: opposite directions mirror exactly.
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
(async()=>{
 const dir=path.resolve(__dirname,'../assets/characters/hizuki/pixel-v1');
 const im=await loadImage(path.join(dir,'source.png'));
 const src=createCanvas(im.width,im.height),s=src.getContext('2d');s.drawImage(im,0,0);
 const pixels=s.getImageData(0,0,im.width,im.height).data;
 const frames=[];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const x0=Math.round(col*im.width/3),x1=Math.round((col+1)*im.width/3),y0=Math.round(row*im.height/4),y1=Math.round((row+1)*im.height/4);
  const seen=new Set();let best=[];
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const id=y*im.width+x;if(seen.has(id)||pixels[id*4+3]<=128)continue;
   const q=[id];seen.add(id);
   for(let j=0;j<q.length;j++){const id=q[j],px=id%im.width,py=Math.floor(id/im.width);
    for(const [nx,ny] of [[px-1,py],[px+1,py],[px,py-1],[px,py+1]]){
     const n=ny*im.width+nx;if(nx<x0||nx>=x1||ny<y0||ny>=y1||seen.has(n)||pixels[n*4+3]<=128)continue;
     seen.add(n);q.push(n);
    }
   }if(q.length>best.length)best=q;
  }
  let l=x1,r=x0,t=y1,b=y0;for(const id of best){const x=id%im.width,y=Math.floor(id/im.width);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  const h=b-t+1,w=r-l+1,dw=Math.round(w*58/h);
  const cell=createCanvas(64,64),c=cell.getContext('2d');c.imageSmoothingEnabled=false;
  c.drawImage(im,l,t,w,h,Math.round((64-dw)/2),4,dw,58);frames.push(cell);
 }
 const mirror=a=>{const o=createCanvas(64,64),c=o.getContext('2d');c.translate(64,0);c.scale(-1,1);c.drawImage(a,0,0);return o};
 frames[2]=mirror(frames[0]);frames[5]=mirror(frames[3]);frames.push(...frames.slice(6,9).map(mirror));
 const atlas=createCanvas(192,256),a=atlas.getContext('2d');frames.forEach((f,i)=>a.drawImage(f,(i%3)*64,Math.floor(i/3)*64));
 fs.writeFileSync(path.join(dir,'walk-atlas-64.png'),atlas.toBuffer('image/png'));
 const p=createCanvas(768,1024),c=p.getContext('2d');c.fillStyle='#8b9d8a';c.fillRect(0,0,768,1024);c.imageSmoothingEnabled=false;c.drawImage(atlas,0,0,768,1024);
 fs.writeFileSync(path.join(dir,'preview.png'),p.toBuffer('image/png'));
 console.log('Packed 12 cells, 64px cells, 58px body, anchor (32,62).');
})();

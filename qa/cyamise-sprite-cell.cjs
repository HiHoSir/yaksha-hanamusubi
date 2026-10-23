const assert=require('assert/strict'),path=require('path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),R=require(root+'/js/cyamise-walk-rules.js'),renderer=require(root+'/js/cyamise-walk-renderer.js');
(async()=>{
 const art=await loadImage(root+'/assets/interiors/cyamise-v1/scene-preview.png'),hero=await loadImage(root+'/assets/characters/hizuki/field-sd-v1/walk-atlas-32.png');
 const source=createCanvas(96,128),sc=source.getContext('2d');sc.drawImage(hero,0,0);const alpha=sc.getImageData(0,0,96,128).data;
 const p={x:5,y:6},left=R.origin.x+p.x*32,top=R.origin.y+p.y*32;
 let cases=0;
 for(const dir of ['d','u','r','l'])for(const frame of [0,1,2]){
  const canvas=createCanvas(384,320),c=canvas.getContext('2d'),original=c.drawImage.bind(c);let args;
  c.drawImage=(im,...a)=>{if(im===hero)args=a;original(im,...a)};
  renderer.draw(c,art,hero,p,{grid:false,collision:false,dir,frame});assert(args,'actual sprite must be drawn');
  const [sx,sy,sw,sh,dx,dy,dw,dh]=args;let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(alpha[((sy+y)*96+sx+x)*4+3]>=32){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  const visual={left:dx+minX*dw/sw,right:dx+(maxX+1)*dw/sw,top:dy+minY*dh/sh,bottom:dy+(maxY+1)*dh/sh};
  assert(visual.left>=left&&visual.right<=left+32,dir+' horizontal fit');
  assert(visual.top>=top&&visual.bottom<=top+32,dir+' entire sprite must fit vertically in its cell');
  assert(Math.abs(visual.bottom-(top+30))<1e-7,'boots end 2px above cell edge');cases++;
 }
 console.log(`PASS ${cases} actual-alpha frame bounds fully inside one32px cell, stable boot line`);
})();

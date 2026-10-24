((root,make)=>{const api=make();if(typeof module==='object'&&module.exports)module.exports=api;else root.YKSpriteOutline=api;})(globalThis,()=>{
'use strict';
const cache=new WeakMap();
// Flood only exterior transparency: white eyes, sleeve gaps enclosed by opaque
// pixels, and interior alpha holes must never receive an outline.
function exteriorRing(alpha,w,h){
 const pw=w+2,ph=h+2,solid=new Uint8Array(pw*ph),outside=new Uint8Array(pw*ph),ring=new Uint8Array(pw*ph);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)solid[(y+1)*pw+x+1]=alpha[y*w+x]>=32?1:0;
 const q=[0];outside[0]=1;
 for(let i=0;i<q.length;i++){const p=q[i],x=p%pw,y=Math.floor(p/pw);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=pw||ny>=ph)continue;const n=ny*pw+nx;if(!solid[n]&&!outside[n]){outside[n]=1;q.push(n);}}}
 for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){const p=y*pw+x;if(!outside[p])continue;for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<pw&&ny<ph&&solid[ny*pw+nx]){ring[p]=1;break;}}}
 return ring;
}
function draw(c,image,sx,sy,sw,sh,dx,dy,dw,dh,createCanvas){
 let frames=cache.get(image);if(!frames){frames=new Map();cache.set(image,frames);}const key=[sx,sy,sw,sh].join(',');let frame=frames.get(key);
 if(!frame){
  const make=createCanvas||((w,h)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;});
  const source=make(sw,sh),sc=source.getContext('2d');sc.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);const pixels=sc.getImageData(0,0,sw,sh),alpha=new Uint8Array(sw*sh);
  for(let i=0;i<alpha.length;i++)alpha[i]=pixels.data[i*4+3];
  const ring=exteriorRing(alpha,sw,sh);frame=make(sw+2,sh+2);const fc=frame.getContext('2d'),data=fc.createImageData(sw+2,sh+2);
  for(let i=0;i<ring.length;i++)if(ring[i]){data.data[i*4]=30;data.data[i*4+1]=23;data.data[i*4+2]=37;data.data[i*4+3]=255;}
  fc.putImageData(data,0,0);fc.drawImage(source,1,1);frames.set(key,frame);
 }
 // Padding expands the visual only; original body position/scale and collision stay fixed.
 c.drawImage(frame,dx-dw/sw,dy-dh/sh,dw*(sw+2)/sw,dh*(sh+2)/sh);
}
return {draw,exteriorRing};
});

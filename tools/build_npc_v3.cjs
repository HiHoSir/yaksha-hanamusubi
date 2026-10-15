// Build approved v2-design refresh. Run with @napi-rs/canvas installed.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'../assets/characters/npc-v3');
async function extract(file,row,col,single=false){
 const im=await loadImage(file),cw=single?im.width:im.width/3,ch=single?im.height:im.height/4;
 const x0=Math.round(col*cw),w=Math.round((col+1)*cw)-x0;
 let y0=Math.round(row*ch),h=Math.round((row+1)*ch)-y0;
 if(/(?:osumi|teagirl)\.png$/.test(file)){
  // Generated rows are uneven. Use actual alpha-separated vertical bands.
  const column=createCanvas(w,im.height),cc=column.getContext('2d');cc.drawImage(im,-x0,0);
  const data=cc.getImageData(0,0,w,im.height).data,runs=[];let start=-1;
  for(let y=0;y<=im.height;y++){
   let count=0;if(y<im.height)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=128)count++;
   if(count>2&&start<0)start=y;
   if(count<=2&&start>=0){if(y-start>60)runs.push([start,y]);start=-1;}
  }
  if(runs.length!==4)throw Error('Expected 4 separated characters: '+file+' col'+col+' '+JSON.stringify(runs));
  y0=Math.max(0,runs[row][0]-3);h=Math.min(im.height,runs[row][1]+3)-y0;
 }
 const cv=createCanvas(w,h),c=cv.getContext('2d');c.drawImage(im,-x0,-y0);
 const id=c.getImageData(0,0,w,h),d=id.data,seen=new Uint8Array(w*h);let best=[];
 for(let i=0;i<w*h;i++){
  if(seen[i]||d[i*4+3]<128)continue;const q=[i];seen[i]=1;
  for(let j=0;j<q.length;j++){const n=q[j],x=n%w,y=Math.floor(n/w);for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const v=b*w+a;if(a<0||a>=w||b<0||b>=h||seen[v]||d[v*4+3]<128)continue;seen[v]=1;q.push(v);}}
  if(q.length>best.length)best=q;
 }
 let l=w,t=h,r=-1,b=-1;const mask=new Uint8Array(w*h),support=new Uint8Array(w*h);
 for(const i of best){mask[i]=1;const x=i%w,y=Math.floor(i/w);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h)support[(y+dy)*w+x+dx]=1;
 }
 if(best.length<100)throw Error('Empty component '+file);
 let semi=0;for(let i=0;i<w*h;i++){if(mask[i]){if(d[i*4+3]<255)semi++;d[i*4+3]=255;}else if(!support[i])d[i*4+3]=0;}
 c.putImageData(id,0,0);
 const bh=b-t+1,bw=r-l+1,scale=192/bh,dw=Math.round(bw*scale);
 // Center the boot contact span, not the hair/sleeve extent.
 let fl=w,fr=0;for(const i of best){const y=Math.floor(i/w);if(y>b-24){fl=Math.min(fl,i%w);fr=Math.max(fr,i%w);}}
 const foot=(fl+fr+1)/2,dx=96-(foot-l)*scale;
 const cell=createCanvas(192,224),g=cell.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(cv,l,t,bw,bh,dx,20,dw,192);
 return {cell,meta:{source:path.relative(root,file),sourceCell:[row,col],crop:[l,t,bw,bh],sourceOpaqueCore:best.length,normalizedCoreAlpha:semi,footX:foot}};
}
const mirror=f=>{const c=createCanvas(192,224),g=c.getContext('2d');g.translate(192,0);g.scale(-1,1);g.drawImage(f.cell,0,0);return {cell:c,meta:{...f.meta,mirror:!f.meta.mirror}}};
(async()=>{
 const manifest={cell:[192,224],foot:[96,212],visibleHeight:192,rows:['front','back','left','right'],columns:['walk-a','idle','walk-b'],frames:{},sources:{}};
 for(const name of ['elder','satoko','merchant','osumi','teagirl']){
  const file=path.join(root,'source',name+'.png');const f=[];
  const fa=await extract(file,0,0),fi=await extract(file,0,1);f.push(fa,fi,mirror(fa));
  const ba=await extract(file,1,name==='merchant'?2:0),bi=await extract(file,1,1);f.push(ba,bi,mirror(ba));
  const right=[name==='osumi'?mirror(await extract(file,2,0)):await extract(file,3,0),await extract(file,3,1),name==='satoko'?await extract(path.join(root,'source/satoko-arms-fixed.png'),3,2):await extract(file,3,2)];
  f.push(...right.map(mirror),...right);
  const atlas=createCanvas(576,896),g=atlas.getContext('2d');f.forEach((p,i)=>g.drawImage(p.cell,i%3*192,Math.floor(i/3)*224));
  fs.writeFileSync(path.join(root,name+'.png'),atlas.toBuffer('image/png'));manifest.frames[name]=f.map(p=>p.meta);
 }
 for(const name of fs.readdirSync(path.join(root,'source'))){const data=fs.readFileSync(path.join(root,'source',name));manifest.sources[name]={bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')};}
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const preview=createCanvas(2880,896),g=preview.getContext('2d');g.fillStyle='#a5af9f';g.fillRect(0,0,2880,896);
 for(const [i,k] of ['elder','satoko','merchant','osumi','teagirl'].entries())g.drawImage(await loadImage(path.join(root,k+'.png')),i*576,0);
 fs.writeFileSync(path.join(root,'preview.png'),preview.toBuffer('image/png'));
 console.log('5 atlases, 60 cells built');
})();

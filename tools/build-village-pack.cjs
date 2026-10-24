const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas'),A=require('../js/settlement-map/autotile.js');
const root=path.join(__dirname,'..'),dir=root+'/assets/settlement-editor/pack-v1';
const canvas=(w,h)=>{const cv=createCanvas(w,h);cv.getContext('2d').imageSmoothingEnabled=false;return cv;};
const write=(id,cv)=>fs.writeFileSync(dir+'/'+id+'.png',cv.toBuffer('image/png'));
(async()=>{
 const grass=await loadImage(root+'/assets/settlement-editor/terrain-v1/grass-source.png');
 for(const id of ['cobble','gravel','soil']){const src=await loadImage(dir+'/source/'+id+'.png'),c=canvas(32,32).getContext('2d');c.drawImage(src,0,0);const md=c.getImageData(0,0,32,32).data;
  for(let y=0;y<32;y++)for(let k=0;k<4;k++)md[(y*32+31)*4+k]=md[y*32*4+k];for(let x=0;x<32;x++)for(let k=0;k<4;k++)md[(31*32+x)*4+k]=md[x*4+k];
  const sheet=canvas(256,192),s=sheet.getContext('2d'),g=canvas(32,32).getContext('2d');g.drawImage(grass,0,0);const gd=g.getImageData(0,0,32,32).data;
  for(const mask of A.masks){const p=s.createImageData(32,32);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;p.data.set((A.core(mask,x,y)?md:gd).slice(i,i+4),i);}const i=A.indices[mask];s.putImageData(p,i%8*32,Math.floor(i/8)*32);}write(id+'-47',sheet);const icon=canvas(32,32),i=A.indices[255];icon.getContext('2d').drawImage(sheet,i%8*32,Math.floor(i/8)*32,32,32,0,0,32,32);write(id+'-preview',icon);
 }
 const fence=await loadImage(root+'/assets/settlement-editor/chips/fence.png'),shrub=await loadImage(root+'/assets/settlement-editor/chips/shrub.png');
 for(const id of ['fence','hedge']){const sheet=canvas(256,64),s=sheet.getContext('2d');for(let mask=0;mask<16;mask++){const tile=canvas(32,32),c=tile.getContext('2d');
   if(id==='fence'){
    // Recompose the original posts and rail. End posts occur only at closed ends.
    const h=mask&10,v=mask&5;if(h||!mask){c.drawImage(fence,7,12,17,6,mask&8?0:6,13,mask&2?(mask&8?32:26):(mask&8?26:20),6);if(!(mask&8))c.drawImage(fence,2,8,5,15,4,8,5,15);if(!(mask&2))c.drawImage(fence,24,8,5,15,23,8,5,15);}
    if(v){c.save();c.translate(32,0);c.rotate(Math.PI/2);c.drawImage(fence,7,12,17,6,mask&1?0:6,13,mask&4?(mask&1?32:26):(mask&1?26:20),6);c.restore();c.drawImage(fence,2,8,5,15,14,8,5,15);}
   }else{
    c.drawImage(shrub,4,5,23,22,4,5,24,23);if(mask&1)c.drawImage(shrub,4,5,23,22,4,-11,24,27);if(mask&4)c.drawImage(shrub,4,5,23,22,4,16,24,27);if(mask&8)c.drawImage(shrub,4,5,23,22,-12,5,28,23);if(mask&2)c.drawImage(shrub,4,5,23,22,16,5,28,23);
   }
   // Share each opening's exact cross-section, independent of the far-side mask.
   const p=c.getImageData(0,0,32,32);for(let k=0;k<32;k++)for(let ch=0;ch<4;ch++){if(mask&2)p.data[(k*32+31)*4+ch]=id==='fence'?(k>=13&&k<19?[125,83,33,255][ch]:0):(k>=7&&k<27?[41,123,25,255][ch]:0);if(mask&8)p.data[k*32*4+ch]=id==='fence'?(k>=13&&k<19?[125,83,33,255][ch]:0):(k>=7&&k<27?[41,123,25,255][ch]:0);if(mask&1)p.data[k*4+ch]=id==='fence'?(k>=13&&k<19?[125,83,33,255][ch]:0):(k>=6&&k<27?[41,123,25,255][ch]:0);if(mask&4)p.data[(31*32+k)*4+ch]=id==='fence'?(k>=13&&k<19?[125,83,33,255][ch]:0):(k>=6&&k<27?[41,123,25,255][ch]:0);}c.putImageData(p,0,0);s.drawImage(tile,mask%8*32,Math.floor(mask/8)*32);
  }write(id+'-16',sheet);const icon=canvas(32,32);icon.getContext('2d').drawImage(sheet,2*32,32,32,32,0,0,32,32);write(id+'-preview',icon);}
 const C=require('../js/settlement-map/catalog.js'),M=require('../js/settlement-map/model.js'),R=require('../js/settlement-map/render.js'),ts=C.templates.filter(t=>t.pack==='v1'),images={};for(const t of ts)images[t.id]=await loadImage(root+'/'+t.src);
 const cv=canvas(512,Math.ceil(ts.length/4)*96),c=cv.getContext('2d');c.fillStyle='#53624c';c.fillRect(0,0,cv.width,cv.height);
 for(let i=0;i<ts.length;i++){const t=ts[i],x=i%4*128,y=Math.floor(i/4)*96;c.drawImage(images[t.id],...(t.autotile?[0,0,32,32]:t.sourceRect),x+16,y+4,t.displayCells[0]*32,t.displayCells[1]*32);c.fillStyle='#fff';c.font='10px sans-serif';c.fillText(t.id,x+4,y+83);}
 fs.writeFileSync(root+'/qa/village-pack-preview.png',cv.toBuffer('image/png'));
 images.ground_grass=grass;let m=M.createMap(20,16);for(let y=0;y<16;y++)m=M.paintCells(m,'ground_grass',Array.from({length:20},(_,x)=>[x,y]));
 for(const [id,x,y]of [['small_medicine',2,3],['small_weapon',8,3],['building_barn',14,3],['barrel',2,12],['rice_bale',4,12],['firewood',6,12],['basket',8,12],['signpost',10,12],['stairs_stone',3,4],['stepping_stone',9,4],['decor_leaves',12,12],['decor_pebbles',14,12]])m=M.place(m,id,x,y);
 for(const [id,x0]of [['ground_cobble',1],['ground_gravel',8],['ground_soil',15]]){const cells=[];for(let y=6;y<9;y++)for(let x=x0;x<x0+4;x++)cells.push([x,y]);m=M.paintCells(m,id,cells);}
 m=M.paintCells(m,'auto_fence',[[2,10],[3,10],[4,10],[5,10],[5,11]]);m=M.paintCells(m,'auto_hedge',[[11,10],[12,10],[13,10],[14,10],[14,11]]);
 const hero=await loadImage(root+'/assets/settlement-editor/hizuki.png'),bounds=R.actorBounds(hero,createCanvas),scene=canvas(640,512);m.spawn=[9,11];R.draw(scene.getContext('2d'),m,{images,hero,bounds,actor:{x:9,y:11,dir:'d',frame:0}});
 fs.writeFileSync(root+'/qa/village-pack-scene.png',scene.toBuffer('image/png'));fs.writeFileSync(root+'/qa/village-pack-scene.json',M.serialize(m));console.log('Built pack atlases and native-scale catalog/SD scene:',ts.length);
})().catch(e=>{console.error(e);process.exitCode=1;});

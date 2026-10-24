// Reassemble the approved bridge artwork into exact 32px cells. No new source art.
const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.join(__dirname,'..'),out=root+'/assets/settlement-editor/terrain-v1';
function openings(index){if(index===16)return 5;const m=index&15;return !m?10:(m===1||m===4||m===5)?5:(m===2||m===8||m===10)?10:m;}
function deck(mask,x,y){return x>=4&&x<28&&y>=4&&y<28||!!(mask&1)&&x>=4&&x<28&&y<4||!!(mask&2)&&x>=28&&y>=4&&y<28||!!(mask&4)&&x>=4&&x<28&&y>=28||!!(mask&8)&&x<4&&y>=4&&y<28;}
(async()=>{
 const im=await loadImage(out+'/bridge-source.png');
 // Keep the illustrated rails with their deck, cropping away the original end posts.
 const material=createCanvas(32,32).getContext('2d');material.imageSmoothingEnabled=false;material.drawImage(im,16,0,32,32,0,4,32,24);
 const pixels=material.getImageData(0,0,32,32).data;
 for(let y=0;y<32;y++)for(let c=0;c<4;c++)pixels[(y*32+31)*4+c]=pixels[y*32*4+c];
 const horizontal=(x,y)=>pixels.slice((y*32+x)*4,(y*32+x)*4+4);
 const vertical=(x,y)=>horizontal(y,31-x);
 const atlas=createCanvas(256,96),ac=atlas.getContext('2d');
 for(let index=0;index<17;index++){
  const mask=openings(index),p=ac.createImageData(32,32);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   if(!deck(mask,x,y))continue;
   const i=(y*32+x)*4;
   // Rotate the WHOLE straight tile. Never leave an unrotated boundary collar.
   let color=mask===5?vertical(x,y):horizontal(x,y);
   if(mask!==5&&mask!==10){
    // At every open side use the same complete deck-and-rail cross-section.
    if(y<4||y>=28)color=vertical(x,y);
    else if(x<4||x>=28)color=horizontal(x,y);
    else {
     color=horizontal(x,Math.min(23,Math.max(8,y)));
     if(!(mask&1)&&y<7)color=horizontal(x,y);
     if(!(mask&4)&&y>=25)color=horizontal(x,y);
     if(!(mask&8)&&x<7)color=vertical(x,y);
     if(!(mask&2)&&x>=25)color=vertical(x,y);
     // Join the two rail ends at concave corners without capping an opening.
     if((mask&3)===3&&x>=25&&y<7)color=vertical(x,y);
     if((mask&6)===6&&x>=25&&y>=25)color=vertical(x,y);
     if((mask&12)===12&&x<7&&y>=25)color=vertical(x,y);
     if((mask&9)===9&&x<7&&y<7)color=vertical(x,y);
    }
   }
   p.data.set(color,i);p.data[i+3]=255;
  }
  ac.putImageData(p,index%8*32,Math.floor(index/8)*32);
 }
 fs.writeFileSync(out+'/bridge-v2-17.png',atlas.toBuffer('image/png'));
 const icon=createCanvas(32,32);icon.getContext('2d').drawImage(atlas,0,0,32,32,0,0,32,32);fs.writeFileSync(out+'/bridge-v2-preview.png',icon.toBuffer('image/png'));
 fs.writeFileSync(out+'/bridge-v2-17.json',JSON.stringify({tileSize:32,columns:8,rows:3,frames:17,cardinalBits:{N:1,E:2,S:4,W:8},isolatedHorizontal:0,isolatedVertical:16,singleEnd:'open both ends along the bridge axis',source:'bridge-source.png',artRevision:2,rails:'continuous source-art strips; whole-tile rotation',alpha:'transparent outside deck; hard alpha',collision:'bridgePassages [[0,0]]; water only'},null,2));
 const C=require('../js/settlement-map/catalog.js'),M=require('../js/settlement-map/model.js'),R=require('../js/settlement-map/render.js'),images={};
 for(const id of ['auto_bridge','auto_river','auto_road','ground_grass'])images[id]=await loadImage(root+'/'+C.byId[id].src);
 let m=M.createMap(12,9);for(let y=0;y<9;y++)m=M.paintCells(m,'ground_grass',Array.from({length:12},(_,x)=>[x,y]));
 m=M.paintCells(m,'auto_river',Array.from({length:9},(_,y)=>[3,y]));m=M.paintCells(m,'auto_river',Array.from({length:12},(_,x)=>[x,5]));m=M.paintCells(m,'auto_river',Array.from({length:12},(_,x)=>[x,6]));
 m=M.paintCells(m,'auto_bridge',[[3,2],[7,5],[7,6]]);
 // Land boardwalk example: long run, a corner, a T and a cross.
 m=M.paintCells(m,'auto_bridge',[[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[10,3],[7,1],[7,3],[9,1]]);
 const cv=createCanvas(384,288),pc=cv.getContext('2d');R.draw(pc,m,{images,forExport:true});
 const hero=await loadImage(root+'/assets/settlement-editor/hizuki.png'),bounds=R.actorBounds(hero,createCanvas);
 R.actor(pc,{x:3,y:2,dir:'r',frame:0},hero,bounds);R.actor(pc,{x:7,y:6,dir:'d',frame:0},hero,bounds);
 fs.writeFileSync(root+'/qa/village-bridge-preview.png',cv.toBuffer('image/png'));
 console.log('Built 17 bridge states (32px cells, 256x96 RGBA atlas) and native-scale preview');
})().catch(e=>{console.error(e);process.exitCode=1;});

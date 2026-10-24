// Final-grid feature correction, following new-npc eye-shapes-v2 practice.
// The source is the NEW Jizo draft, never the rejected or legacy statue.
const fs=require('fs'),path=require('path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
(async()=>{
 const im=await loadImage(root+'/assets/terrain/places-v2/source/jizo-before-feature-fix.png');
 const c=createCanvas(32,32),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,0,0);
 // Restore the face ground before authoring both eyelids at final pixel coordinates.
 g.fillStyle='#acaeb2';g.fillRect(10,12,12,5);
 const pixel=(x,y,color)=>{g.fillStyle=color;g.fillRect(x,y,1,1);};
 const ink='#292a31',light='#d0d1d3',shade='#787c86';
 for(const [x,y]of [[10,13],[13,13],[11,14],[12,14],[18,13],[21,13],[19,14],[20,14],[14,16],[17,16],[15,17],[16,17]])pixel(x,y,ink);
 // Two readable joined hands: two light columns separated by a dark crease.
 g.fillStyle=ink;g.fillRect(13,21,6,6);
 g.fillStyle=light;g.fillRect(14,21,2,4);g.fillRect(17,21,1,4);
 g.fillStyle=shade;g.fillRect(14,25,2,1);g.fillRect(17,25,1,1);
 fs.writeFileSync(root+'/assets/terrain/places-v1/jizo.png',c.toBuffer('image/png'));
 // Native-size row plus a nearest-neighbor enlargement using actual approved NPC art.
 const h=await loadImage(root+'/assets/characters/hizuki/field-sd-v1/walk-atlas-32.png'),npc=await loadImage(root+'/assets/characters/new-npc/chief.png');
 const row=createCanvas(128,40),r=row.getContext('2d');r.imageSmoothingEnabled=false;
 r.fillStyle='#95bf69';r.fillRect(0,0,128,40);r.drawImage(h,32,0,32,32,8,4,32,32);r.drawImage(npc,32,0,32,32,48,4,32,32);r.drawImage(c,88,2);
 const preview=createCanvas(512,220),p=preview.getContext('2d');p.fillStyle='#95bf69';p.fillRect(0,0,512,220);p.imageSmoothingEnabled=false;p.drawImage(row,0,0);p.drawImage(row,0,52,512,160);
 fs.writeFileSync(root+'/qa/jizo-npc-scale.png',preview.toBuffer('image/png'));
 console.log('Final 32px face and hands authored; eyes symmetric, no later downscale.');
})();

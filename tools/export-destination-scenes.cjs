// Deterministic runtime export; original generated illustrations remain untouched.
const fs=require('fs'),path=require('path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const files={shrine:'3e8e55b4-67fd-41dc-b51e-b662e46e5195',cove:'caeddbb6-6c51-43c3-83e3-ce4d34785f53',forest:'9848b374-5e58-4867-94cd-baad126771ce',fox:'51a2d562-2134-4f14-886e-55eba33da2dc',waterfall:'42b73232-64a6-411f-b1a0-601dcd16a0ab',hotspring:'cbaaa585-37a1-47bd-bb1b-6f7f0c8623d8'};
(async()=>{fs.mkdirSync('assets/scenes/destinations-v1',{recursive:true});for(const [id,file] of Object.entries(files)){
 const im=await loadImage(path.join(process.argv[2]||'../generated_images','exec-'+file+'.png'));
 const c=createCanvas(768,768);c.getContext('2d').drawImage(im,0,0,768,768);
 const out='assets/scenes/destinations-v1/'+id+'.webp';fs.writeFileSync(out,c.toBuffer('image/webp',85));console.log(id,im.width,im.height,fs.statSync(out).size);
}})();

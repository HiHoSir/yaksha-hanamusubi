// Pixel assembly only: no scaling or antialiasing when creating the final 32px tiles.
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/terrain/original-32-v2');
const patterns={core:{n:1,e:1,s:1,w:1},edge_top:{e:1,s:1,w:1},edge_right:{n:1,s:1,w:1},edge_bottom:{n:1,e:1,w:1},edge_left:{n:1,e:1,s:1},corner_tl:{e:1,s:1},corner_tr:{s:1,w:1},corner_bl:{n:1,e:1},corner_br:{n:1,w:1}};
(async()=>{
 fs.mkdirSync(out,{recursive:true});const core=await loadImage(path.join(root,'art-source/forest-core32-v2.png'));
 // Preserve the phase of all four quadrants. Only exposed outer edges are cut.
 const rim=[3,2,2,1,1,2,1,1,2,1,1,2,2,1,2,3,3,2,2,1,1,2,1,1,2,1,1,2,2,1,2,3];
 for(const [name,m] of Object.entries(patterns)){
  const c=createCanvas(32,32),q=c.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(core,0,0);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   if((!m.n&&y<rim[x])||(!m.s&&31-y<rim[x])||(!m.w&&x<rim[y])||(!m.e&&31-x<rim[y]))q.clearRect(x,y,1,1);
  }
  fs.writeFileSync(path.join(out,'forest_'+name+'.png'),c.toBuffer('image/png'));
 }
 const c=createCanvas(32,32),q=c.getContext('2d');
 // One quiet ground overlay, not random variants. The renderer owns the solid base colour.
 q.fillStyle='#88b850';for(const [x,y] of [[7,10],[8,10],[23,25],[24,25]])q.fillRect(x,y,1,1);
 q.fillStyle='#7fb149';for(const [x,y] of [[8,11],[9,11],[24,26],[25,26]])q.fillRect(x,y,1,1);
 fs.writeFileSync(path.join(out,'grass_base.png'),c.toBuffer('image/png'));
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({schema:1,size:32,subtileSize:16,baseColor:'#83b54d',alpha:'binary 0/255',grass:'grass_base.png',forest:Object.keys(patterns).map(n=>'forest_'+n+'.png'),source:'Original artwork; analysis informs connections only'},null,2)+'\n');
})();

// Based on 夜叉姫_Work引き継ぎ_ROM解析.md §§11,14,16,18–21.
// Original 32×32 RGBA assets, assembled from 16px parts without stretching.
window.YK_AUTOTILE=(()=>{
 const forestKeys=['core','edge_top','edge_right','edge_bottom','edge_left','corner_tl','corner_tr','corner_bl','corner_br'].map(k=>'forest_'+k);
 const keys=['grass_base',...forestKeys],specs=Object.fromEntries(keys.map(k=>[k,[32,32]])),art={},errors={};
 const baseColor='#83b54d';let started=false;
 const ready=()=>keys.every(k=>art[k]?.complete&&art[k].naturalWidth===32&&art[k].naturalHeight===32&&!errors[k]);
 function load(onChange=()=>{}){
  if(started)return;started=true;
  for(const key of keys){const im=art[key]=new Image();im.onload=()=>{if(im.naturalWidth!==32||im.naturalHeight!==32)errors[key]='size';onChange();};im.onerror=()=>{errors[key]='load';onChange();};im.src='assets/terrain/original-32-v1/'+key+'.png';}
 }
 function roles(kind,{n=false,e=false,s=false,w=false}={}){
  if(kind==='grass')return [[0,0],[0,0],[0,0],[0,0]];
  if(kind==='forest')return [[w?1:0,n?1:0],[e?1:2,n?1:0],[w?1:0,s?1:2],[e?1:2,s?1:2]];
  throw new Error('Unknown terrain: '+kind);
 }
 // Representative 16px quadrant from each delivered 32px role image.
 const parts=[['forest_corner_tl',0,0],['forest_edge_top',0,0],['forest_corner_tr',16,0],['forest_edge_left',0,0],['forest_core',0,0],['forest_edge_right',16,0],['forest_corner_bl',0,16],['forest_edge_bottom',0,16],['forest_corner_br',16,16]];
 function neighbors(map,x,y){const t=map[y]?.[x];return {n:map[y-1]?.[x]===t,e:map[y]?.[x+1]===t,s:map[y+1]?.[x]===t,w:map[y]?.[x-1]===t};}
 function drawAsset(c,key,x,y,size=32){if(!ready())return false;c.imageSmoothingEnabled=false;c.drawImage(art[key],x,y,size,size);return true;}
 function drawCell(c,kind,n,x,y){
  if(!ready())return false;c.imageSmoothingEnabled=false;
  c.fillStyle=baseColor;c.fillRect(x,y,32,32);drawAsset(c,'grass_base',x,y);
  if(kind==='grass')return true;
  roles(kind,n).forEach(([col,row],i)=>{const [key,sx,sy]=parts[row*3+col];c.drawImage(art[key],sx,sy,16,16,x+(i%2)*16,y+(i>>1)*16,16,16);});return true;
 }
 function drawMap(c,map,ox=0,oy=0){if(!ready())return false;for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++)drawCell(c,map[y][x],neighbors(map,x,y),ox+x*32,oy+y*32);return true;}
 function fixture(){
  const m=Array.from({length:17},()=>Array(20).fill('grass'));
  for(let y=1;y<=5;y++)for(let x=1;x<=6;x++)m[y][x]='forest';
  for(let y=1;y<=5;y++)for(let x=11;x<=17;x++)m[y][x]='forest';
  m[4][17]=m[5][17]=m[5][16]='grass';
  for(let x=1;x<=6;x++)m[8][x]='forest';for(let y=9;y<=12;y++)m[y][1]='forest';m[11][5]='forest';
  for(let x=10;x<=17;x++)m[8][x]='forest';m[11][10]='forest';for(let y=11;y<=13;y++)m[y][15]='forest';
  return m;
 }
 return {load,ready,roles,neighbors,drawCell,drawMap,drawAsset,fixture,errors,specs,keys,baseColor};
})();

// Original art. Structure: 32px cell = four 16px quadrants.
// Forest uses nine roles; mountains use ridge/core/foot bands, never random peaks.
window.YK_AUTOTILE=(()=>{
 const specs={grass:[16,16],forest:[48,48],mountain:[64,48]},art={},errors={};
 let started=false;
 const ready=()=>Object.keys(specs).every(k=>art[k]?.complete&&art[k].naturalWidth===specs[k][0]&&art[k].naturalHeight===specs[k][1]&&!errors[k]);
 function load(onChange=()=>{}){
  if(started)return;started=true;
  for(const [key,[w,h]] of Object.entries(specs)){
   const im=art[key]=new Image();
   im.onload=()=>{if(im.naturalWidth!==w||im.naturalHeight!==h)errors[key]='size';onChange();};
   im.onerror=()=>{errors[key]='load';onChange();};
   im.src='assets/terrain/original-16-v2/'+key+'.png';
  }
 }
 function roles(kind,{n=false,e=false,s=false,w=false}={}){
  if(kind==='grass')return [[0,0],[0,0],[0,0],[0,0]];
  if(kind==='forest')return [[w?1:0,n?1:0],[e?1:2,n?1:0],[w?1:0,s?1:2],[e?1:2,s?1:2]];
  if(kind==='mountain')return [[w?1:0,n?1:0],[e?2:3,n?1:0],[w?1:0,s?1:2],[e?2:3,s?1:2]];
  throw new Error('Unknown terrain: '+kind);
 }
 function neighbors(map,x,y){const t=map[y]?.[x];return {n:map[y-1]?.[x]===t,e:map[y]?.[x+1]===t,s:map[y+1]?.[x]===t,w:map[y]?.[x-1]===t};}
 function drawCell(c,kind,n,x,y){
  if(!ready())return false;c.imageSmoothingEnabled=false;
  roles(kind,n).forEach(([sx,sy],i)=>c.drawImage(art[kind],sx*16,sy*16,16,16,x+(i%2)*16,y+(i>>1)*16,16,16));return true;
 }
 function drawMap(c,map,ox=0,oy=0){if(!ready())return false;for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++)drawCell(c,map[y][x],neighbors(map,x,y),ox+x*32,oy+y*32);return true;}
 function fixture(){
  const m=Array.from({length:17},()=>Array(20).fill('grass'));
  for(let y=1;y<=5;y++)for(let x=1;x<=6;x++)m[y][x]='forest';
  for(let y=1;y<=5;y++)for(let x=11;x<=17;x++)m[y][x]='mountain';
  m[4][6]=m[5][6]=m[5][5]='grass'; // concave staircase for the nine-role limitation
  for(let x=1;x<=6;x++)m[8][x]='forest';for(let y=9;y<=12;y++)m[y][1]='forest';m[11][5]='forest';
  for(let x=10;x<=17;x++)m[8][x]='mountain';m[11][10]='mountain';for(let y=11;y<=13;y++)m[y][15]='mountain';
  return m;
 }
 return {load,ready,roles,neighbors,drawCell,drawMap,fixture,errors,specs};
})();

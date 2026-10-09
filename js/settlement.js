// Shared settlement kit: world coordinates, separate ground/objects/actors and reusable roles.
window.YK_SETTLEMENT=(()=>{
 const size=[1536,1280],revision=3,spawn=[768,1190],art={},errors={};
 const paths={home:'home',inn:'inn',shop:'shop',tea:'tea',tree:'tree',well:'well',door:'door',rocks:'rocks',fence:'fence',crates:'crates',basket:'basket',crops:'crops',hozuki:'hozuki',wall:'wall',stairs:'stairs'};
 let started=false;
 function load(change=()=>{}){if(started)return;started=true;for(const [k,file] of Object.entries(paths)){const im=art[k]=new Image();im.onload=change;im.onerror=()=>{errors[k]=true;change();};im.src=`assets/settlements/common-v1/${file}.png`;}}
 const ready=()=>Object.keys(paths).every(k=>art[k]?.complete&&art[k].naturalWidth&&!errors[k]);
 const buildings=[
  {id:'inn',kind:'inn',name:'旅人の宿',x:320,y:864,w:256,target:'villageRoom',role:'innkeeper'},
  {id:'shop',kind:'shop',name:'よろず屋',x:592,y:852,w:224,target:'villageRoom',role:'merchant'},
  {id:'teahouse',kind:'tea',name:'花見茶屋',x:1040,y:660,w:256,target:'teahouse',role:'teagirl'},
  {id:'osumiHome',kind:'home',name:'お澄の家',x:384,y:470,w:224,target:'osumiHome',role:'woman'},
  {id:'farmHome',kind:'home',name:'畑守りの家',x:752,y:336,w:224,target:'villageRoom',role:'farmer'},
  {id:'weaverHome',kind:'home',name:'織り手の家',x:1040,y:336,w:208,target:'villageRoom',role:'weaver'},
  {id:'riverHome',kind:'home',name:'川辺の仕事小屋',x:1120,y:928,w:192,target:'villageRoom',role:'fisher'},
  {id:'shrine',kind:'shrine',name:'里の小社',x:1424,y:290,w:112}
 ];
 const doors=buildings.filter(b=>b.target).map(b=>({id:b.id,target:b.target,name:b.name,x:b.x,y:b.y+18,halfW:27,halfH:20}));
 const roles={
  child:{type:'child',name:'里の子',talk:['橋の下を見て！　水がきらきら流れてるよ。','あれ？　昨日は鈴が鳴っていたっけ？　ぼく、思い出せないや。']},
  merchant:{type:'merchant',name:'よろず屋',talk:['旅支度なら任せておくれ。']},
  woman:{type:'woman',name:'里の女・お澄',talk:['お帰りなさい、緋月さま。','朝、お地蔵さまに挨拶したはずなのに、誰もその場所を知らないの。','鬼灯の実まで、昨日と違う色に見えるわ。']},
  teagirl:{type:'teagirl',name:'茶屋娘',talk:['いらっしゃいませ。川を眺めながら一服どうぞ。','同じお団子を二度注文するお客さまが増えて、ちょっと困っています。']},
  elder:{type:'elder',name:'里長',talk:['里の鈴が沈黙した理由を、天妖の社で調べるのじゃ。','結び札は大切に持ちなされ。旅の前には、店で装備を整えるとよい。']},
  farmer:{type:'merchant',name:'畑守り',service:null,talk:['川から水を引いて、畑を育てとるんじゃ。','去年の収穫を手伝ってくれた人の顔が、どうしても思い出せなくてのう。']},
  weaver:{type:'woman',name:'織り手',talk:['この里の糸は、草花で染めているんですよ。','切れた糸を結ぶと、なぜか知らない景色が浮かぶことがあります。']},
  fisher:{type:'elder',name:'川仕事の老人',talk:['川を渡るなら橋を使いなされ。岸は滑るからの。','橋の向こうにあったはずの道を、誰も覚えておらんのが気がかりじゃ。']},
  innkeeper:{type:'teagirl',name:'宿の女将',service:'rest',talk:['旅の疲れはためないこと。ゆっくり休んでおいで。']},
  traveler:{type:'merchant',name:'旅人',service:null,talk:['この先にも集落があると聞いたよ。','昨日の約束を忘れた旅人がいるらしい。妙なことが続くな。','里の小社へは、東の小橋を渡るんだって。']}
 };
 function resident(role,id,x,y,dir='d',extra={}){return {...roles[role],role,id,x,y,dir,frame:1,service:role==='merchant'?'shop':roles[role].service,...extra};}
 const residents=[
  resident('elder','chief',716,648,'d'),resident('child','child-square',842,728,'l'),


  resident('farmer','farmer',576,470,'l'),resident('weaver','weaver',984,390,'d'),
  resident('child','child-garden',560,648,'r'),resident('fisher','fisher',1160,992,'l'),
  resident('traveler','traveler',896,868,'u'),resident('elder','shrine-keeper',1406,350,'d',{name:'社の世話役',talk:['大きな社は里の北。ここは里を見守る小さなお社じゃ。','このところ、お供えの数が一つ多い。誰が置いたか分からぬのじゃ。']})
 ];
 const mapData=Array.from({length:40},(_,y)=>Array.from({length:48},(_,x)=>x<3||x>45||y<3?'forest':'grass'));
 for(let y=0;y<34;y++)for(let x=39;x<=41;x++)mapData[y][x]='river';
 for(let y=32;y<=34;y++)for(let x=0;x<48;x++)mapData[y][x]='river';
 // Two clear crossings and a north exit, including forest gaps.
 for(let y=0;y<5;y++)for(let x=22;x<=25;x++)mapData[y][x]='grass';
 for(let y=35;y<40;y++)for(let x=0;x<48;x++)mapData[y][x]=(x<19||x>29)?'forest':'grass';
 const bridges=[{kind:'bridgeNS',x:704,y:1000,width:128,height:140,foot:1140,ground:true},{kind:'bridge',x:1212,y:370,width:160,height:88,foot:458,ground:true}];
 mapData.decorations=bridges;
 mapData.paths=[[[768,1260],[768,600],[768,70]],[[768,896],[320,896]],[[768,710],[1100,710]],[[768,540],[384,540],[384,482]],[[768,390],[1040,390],[1040,346]],[[768,402],[768,350]],[[1040,710],[1190,710],[1190,414],[1376,414],[1376,464],[1424,464],[1424,312]],[[1040,710],[1120,710],[1120,978]]];
 // Wide connected town lanes, sharing the field's earth texture.
 const original=mapData.paths.slice();mapData.paths=[];
 for(const p of original)for(const delta of [-22,0,22])mapData.paths.push(p.map(([x,y],i)=>{const next=p[i+1]||p[i-1];return Math.abs(next[0]-x)>Math.abs(next[1]-y)?[x,y+delta]:[x+delta,y];}));
 const trees=[{x:842,y:584,w:180},{x:226,y:520,w:148},{x:530,y:312,w:148},{x:1180,y:260,w:140},{x:218,y:728,w:136},{x:968,y:972,w:136}];
 const well={x:672,y:638,w:68};
 const gardens=[{x:548,y:416,w:150},{x:922,y:322,w:124},{x:458,y:624,w:144}];
 const props=[
  {kind:'rocks',x:248,y:1000,w:80,r:29},{kind:'rocks',x:938,y:1010,w:64,r:23},{kind:'rocks',x:1214,y:944,w:54,r:18},
  {kind:'fence',x:450,y:680,w:96,r:0},{kind:'fence',x:920,y:430,w:80,r:0},{kind:'fence',x:1020,y:810,w:70,r:0},
  {kind:'crates',x:718,y:864,w:56,r:20},{kind:'basket',x:436,y:552,w:36,r:12},{kind:'hozuki',x:890,y:624,w:42,r:11}
 ];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function camera(x,y){return {x,y};}
 let projectionKey='',projectionRows=new Map();
 function project(x,y,cam){
  const key=cam.x+','+cam.y;if(key!==projectionKey){projectionKey=key;projectionRows.clear();}
  let p=projectionRows.get(y);if(p===undefined){p=YK_LANDSCAPE.project(cam.x,y,cam,1.4);projectionRows.set(y,p);}
  return p?{...p,x:320+(x-cam.x)*p.xScale}:null;
 }
 const unproject=(x,y,cam)=>YK_LANDSCAPE.unproject(x,y,cam,1.4);
 const terrace={left:1360,right:1504,back:192,front:352,height:32,stairLeft:1392,stairRight:1456,stairBottom:432};
 const upland={front:560,height:80,bottom:688,ramps:[[704,832],[1136,1216]],river:[1248,1344]};
 function northHeight(x,y){const n=upland;if(y<=n.front)return n.height;if(y<n.bottom&&n.ramps.some(([l,r])=>x>=l&&x<=r))return n.height*(n.bottom-y)/(n.bottom-n.front);return 0;}
 function elevation(x,y){return northHeight(x,y)+shrineHeight(x,y);}
 function shrineHeight(x,y){const t=terrace;if(x>=t.left&&x<=t.right&&y>=t.back&&y<=t.front)return t.height;if(x>=t.stairLeft&&x<=t.stairRight&&y>t.front&&y<t.stairBottom)return t.height*(t.stairBottom-y)/(t.stairBottom-t.front);return 0;}
 function blocked(x,y){
  if(!YK_LANDSCAPE.walkable(mapData,x,y,9))return true;
  const hit=(l,t,r,b)=>Math.hypot(x-clamp(x,l,r),y-clamp(y,t,b))<8;
  const n=upland;
  if(y>=n.front-12&&y<=n.front+12&&!n.ramps.some(([l,r])=>x>l+12&&x<r-12))return true;
  if(y>n.front&&y<n.bottom-8&&n.ramps.some(([l,r])=>Math.abs(x-l)<12||Math.abs(x-r)<12))return true;
  const t=terrace;
  if(hit(t.left-4,t.back,t.left+4,t.front)||hit(t.right-4,t.back,t.right+4,t.front)||hit(t.left,t.back-4,t.right,t.back+4)||hit(t.left,t.front-4,t.stairLeft-4,t.front+4)||hit(t.stairRight+4,t.front-4,t.right,t.front+4)||hit(t.stairLeft-4,t.front,t.stairLeft,t.stairBottom-8)||hit(t.stairRight,t.front,t.stairRight+4,t.stairBottom-8))return true;
  if(buildings.some(b=>hit(b.x-b.w*.39,b.y-70,b.x+b.w*.39,b.y)))return true;
  if(hit(well.x-27,well.y-24,well.x+27,well.y+6))return true;
  if(props.some(p=>p.kind==='fence'?hit(p.x-p.w*.45,p.y-8,p.x+p.w*.45,p.y+2):Math.hypot(x-p.x,y-p.y)<p.r+8))return true;
  if(gardens.some(a=>hit(a.x-a.w/2,a.y-68,a.x+a.w/2,a.y+8)))return true;
  return trees.some(t=>Math.hypot(x-t.x,y-t.y)<18);
 }
 const aperture={home:[.429,.66,.165,.273],inn:[.411,.714,.175,.212],shop:[.435,.62,.139,.314],tea:[.406,.616,.168,.319]};
 function doorRect(b,cam){const p=project(b.x,b.y,cam);if(p)p.y-=elevation(b.x,b.y)*p.scale;if(!p)return null;const im=art[b.kind],w=b.w*p.scale,h=w*im.height/im.width,a=aperture[b.kind];return {x:p.x-w/2+w*a[0],y:p.y-h+h*a[1],w:w*a[2],h:h*a[3]};}
 function drawDoor(c,b,x,y,w,h,openness){
  const a=aperture[b.kind],r={x:x+w*a[0],y:y+h*a[1],w:w*a[2],h:h*a[3]},im=art.door,half=im.width/2;
  c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();
  c.drawImage(im,0,0,half,im.height,r.x-r.w*.5*openness,r.y,r.w*.5,r.h);
  c.drawImage(im,half,0,half,im.height,r.x+r.w*.5+r.w*.5*openness,r.y,r.w*.5,r.h);c.restore();
 }
 const riverDepth=24;
 function waterHeight(x,y){return northHeight(x,y)-riverDepth;}
 let riverBed=null;
 function riverBedLayer(){
  if(riverBed)return riverBed;
  const bed=riverBed=document.createElement('canvas');bed.width=1536;bed.height=1280;const q=bed.getContext('2d');q.imageSmoothingEnabled=false;
  // Muted earth texture and submerged stones, covered by a translucent turquoise sheet.
  for(let y=0;y<1280;y+=64)for(let x=0;x<1536;x+=64)YK_LANDSCAPE.drawAsset(q,'road',x,y,64,64);
  q.fillStyle='#549b8380';q.fillRect(0,0,1536,1280);
  for(let i=0;i<430;i++){const x=(i*179+37)%1536,y=(i*97+41)%1280;q.fillStyle=i%3?'#476e6280':'#d1d3a080';q.fillRect(x,y,3+i%5,2+i%3);}
  for(let i=0;i<180;i++){const vertical=i<110,x=vertical?1256+(i*29)%78:(i*113)%1536,y=vertical?(i*83)%1024:1034+(i*17)%74;q.fillStyle=i%2?'#8b9d79':'#6c8973';q.fillRect(x,y,4+i%7,3+i%4);q.fillStyle='#b6bea077';q.fillRect(x+1,y,3+i%4,1);}
  q.fillStyle='#168fa966';q.fillRect(0,0,1536,1280);return bed;
 }
 function riverTerrain(c,cam){
  const g=riverBedLayer(),reflection=groundLayer(),at=(x,y,z)=>{const p=project(x,y,cam);return p?{...p,y:p.y-z*p.scale}:null;};
  c.save();c.beginPath();c.rect(0,136,640,408);c.clip();
  // Texture coordinates stay attached to the bank in world space, never the screen.
  // Draw complete water first, then banks: strips must not overwrite earlier bank faces.
  const wall=(x1,y1,x2,y2)=>{
   const z=northHeight((x1+x2)/2,(y1+y2)/2),a=at(x1,y1,z),b=at(x2,y2,z),d=at(x1,y1,z-riverDepth),e=at(x2,y2,z-riverDepth);
   if(!a||!b||!d||!e||Math.max(d.y,e.y)<136||Math.min(a.y,b.y)>544||Math.max(a.x,b.x)<0||Math.min(a.x,b.x)>640)return;
   const f=clamp((Math.min(a.y,b.y)-136)/72,0,1),length=Math.hypot(x2-x1,y2-y1),source=((x1===x2?y1:x1)%96+96)%96;
   c.save();c.globalAlpha=f*f*(3-2*f);c.imageSmoothingEnabled=true;
   c.transform((b.x-a.x)/length,(b.y-a.y)/length,(d.x-a.x)/riverDepth,(d.y-a.y)/riverDepth,a.x,a.y);
   c.drawImage(art.wall,source/96*art.wall.width,0,length/96*art.wall.width,art.wall.height,0,-.4,length+.35,riverDepth+1);
   c.fillStyle=x1===x2?'#29443333':'#203a4038';c.fillRect(0,0,length+.35,riverDepth+1);c.restore();
  };
  const surface=(l,r,y)=>{const z=waterHeight((l+r)/2,y),a=at(l,y,z),b=at(r,y,z),d=at(l,y+4,waterHeight((l+r)/2,y+3.99));if(!a||!b||!d||d.y<=a.y||d.y<136||a.y>544)return;const f=clamp((a.y-136)/72,0,1);c.globalAlpha=f*f*(3-2*f);c.drawImage(g,l,y,r-l,4,a.x,a.y,b.x-a.x,d.y-a.y+.8);c.globalAlpha*=.32;c.drawImage(reflection,l+512,y+512,r-l,4,a.x,a.y,b.x-a.x,d.y-a.y+.8);};
  // Banks descend to the water while bridge decks retain the ground elevation.
  for(let y=0;y<1024;y+=4){surface(1248,1344,y);}
  for(let y=1024;y<1120;y+=4){surface(0,1536,y);}
  for(let y=0;y<1024;y+=16){wall(1248,y,1248,y+16);wall(1344,y,1344,y+16);}
  for(const [l,r] of [[0,1248],[1344,1536]])for(let x=l;x<r;x+=16)wall(x,1024,Math.min(r,x+16),1024);
  for(const [l,r] of [[0,1536]])for(let x=l;x<r;x+=16)wall(x,1120,Math.min(r,x+16),1120);
  c.restore();
 }
 function riverLife(c,cam,time){
  c.save();c.beginPath();c.rect(0,136,640,408);c.clip();
  for(let i=0;i<16;i++){
   const phase=time*.00035+i*2.3,vertical=i<10;
   const x=vertical?1296+Math.sin(phase*.73+i)*25:240+(i-10)*202+Math.sin(phase)*54;
   const y=vertical?(i<3?220+i*24:674+(i-3)*40)+Math.sin(phase)*18:1070+Math.sin(phase*.71+i)*22;
   if(bridges.some(b=>x>b.x-16&&x<b.x+b.width+16&&y>b.y-16&&y<b.y+b.height+16))continue;
   const p=project(x,y,cam);if(!p)continue;p.y-=waterHeight(x,y)*p.scale;
   if(p.x<0||p.x>640||p.y<145||p.y>544)continue;
   const fade=clamp((p.y-145)/72,0,1),z=p.scale*(i%3===0?1.1:.85),angle=vertical?Math.PI/2+Math.sin(phase)*.25:Math.cos(phase)>=0?0:Math.PI;
   c.save();c.translate(p.x,p.y);c.rotate(angle);c.scale(z,z);
   const shape=()=>{c.fillRect(-4,-1,9,2);c.fillRect(-3,-2,6,4);c.fillRect(-2,-3,3,1);const tail=Math.round(Math.sin(time*.009+i));c.fillRect(-7,-2+tail,2,4);c.fillRect(-5,-1+tail,2,2);};
   c.save();c.translate(1,3);c.globalAlpha=fade*.12;c.fillStyle='#123a48';shape();c.restore();
   c.globalAlpha=fade*.68;c.fillStyle=i%4===0?'#936f48':'#285e65';shape();c.globalAlpha=fade*.45;c.fillStyle='#9ac7b8';c.fillRect(-2,-2,5,1);c.restore();
  }c.restore();
 }
 function flow(c,cam,time){
  c.save();c.strokeStyle='#c0f4ea';c.globalAlpha=.48;c.lineWidth=1.5;
  for(let i=0;i<96;i++){
   const vertical=i<32;let x,y;
   if(vertical){x=1264+(i%3)*24;y=(i*93+time*.035)%1030;}
   else{x=(i*91-time*.047)%1536;if(x<0)x+=1536;y=1042+(i%3)*24;}
   if(bridges.some(b=>x>b.x-12&&x<b.x+b.width+12&&y>b.y-8&&y<b.y+b.height+8))continue;
   const p=project(x,y,cam),q=project(x+(vertical?4:12),y+(vertical?8:0),cam);if(p)p.y-=waterHeight(x,y)*p.scale;if(q)q.y-=waterHeight(x+(vertical?4:12),y+(vertical?8:0))*q.scale;
   if(!p||!q||p.x<0||p.x>640||p.y<136||p.y>544)continue;
   c.globalAlpha=.48*Math.min(1,(p.y-136)/72);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();
  }c.restore();
 }
 let ground=null;
 function groundLayer(){
  if(ground)return ground;
  ground=document.createElement('canvas');ground.width=size[0]+1024;ground.height=size[1]+1024;const c=ground.getContext('2d');c.imageSmoothingEnabled=false;
  for(let y=0;y<ground.height;y+=256)for(let x=0;x<ground.width;x+=256)YK_LANDSCAPE.drawAsset(c,'grass',x,y,256,256);
  c.translate(512,512);const floorMap=mapData.map(row=>row.slice());floorMap.paths=mapData.paths;floorMap.decorations=[];c.drawImage(YK_LANDSCAPE.groundLayer(floorMap),0,0);
  for(const [x,y] of [[242,966],[438,958],[632,974],[906,982],[1178,822],[1194,560],[1150,484],[876,626],[258,590],[584,354]])YK_LANDSCAPE.drawAsset(c,'flowers',x-24,y-16,48,28);
  for(const a of gardens){c.save();c.beginPath();c.rect(a.x-a.w/2,a.y-68,a.w,76);c.clip();for(let y=a.y-68;y<a.y+8;y+=64)for(let x=a.x-a.w/2;x<a.x+a.w/2;x+=64)YK_LANDSCAPE.drawAsset(c,'road',x,y,64,64);c.fillStyle='#4b301c88';c.fillRect(a.x-a.w/2,a.y-68,a.w,76);c.restore();}
  return ground;
 }
 function northTerrain(c,cam,time){
  const n=upland,g=groundLayer();c.save();c.beginPath();c.rect(0,136,640,408);c.clip();
  const at=(x,y,z)=>{const p=project(x,y,cam);return p?{...p,y:p.y-z*p.scale,depth:p.y}:null;};
  const strip=(l,r,y,z,nextZ)=>{const a=at(l,y,z),b=at(r,y,z),d=at(l,y+4,nextZ);if(!a||!b||!d||d.y<136||a.y>544||d.y<=a.y)return;const f=clamp((a.y-136)/72,0,1);c.globalAlpha=f*f*(3-2*f);c.drawImage(g,l+512,y+512,r-l,4,a.x,a.y,b.x-a.x,d.y-a.y+.8);};
  for(let y=-512;y<n.front;y+=4)strip(-512,2048,y,n.height,n.height);
  const spans=[[-512,704],[832,1136],[1216,1248],[1344,2048]];
  for(const [l,r] of spans){const a=at(l,n.front,0),b=at(r,n.front,0);if(!a||!b)continue;const f=clamp((a.y-136)/72,0,1);c.globalAlpha=f*f*(3-2*f);c.save();c.beginPath();c.rect(a.x,a.y-n.height*a.scale,b.x-a.x,n.height*a.scale);c.clip();for(let x=l;x<r;x+=96){const u=at(x,n.front,0),v=at(Math.min(r,x+96),n.front,0);c.drawImage(art.wall,u.x,u.y-n.height*u.scale,v.x-u.x,n.height*u.scale);}c.restore();}
  for(const [l,r] of n.ramps){
   // Visible side faces taper towards the foot of each slope.
   for(const [x,dark] of [[l,false],[r,true]]){const a=at(x,n.front,n.height),b=at(x,n.front,0),d=at(x,n.bottom,0);if(!a||!b||!d)continue;c.globalAlpha=clamp((d.y-136)/72,0,1)*.85;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(d.x,d.y);c.closePath();c.fillStyle=dark?'#304b35':'#648054';c.fill();}
   for(let y=n.front;y<n.bottom;y+=4){
    strip(l,r,y,northHeight((l+r)/2,y),northHeight((l+r)/2,y+4));
    const a=at(l,y,northHeight(l,y)),b=at(r,y,northHeight(r,y)),d=at(l,y+4,northHeight(l,y+4));if(!a||!b||!d||d.y<=a.y||d.y<136||a.y>544)continue;
    const fade=clamp((a.y-136)/72,0,1),progress=(y-n.front)/(n.bottom-n.front);c.globalAlpha=fade;
    const shade=c.createLinearGradient(a.x,0,b.x,0);shade.addColorStop(0,'#e5d59c55');shade.addColorStop(.12,'#d9cd9614');shade.addColorStop(.72,'#1e342816');shade.addColorStop(1,'#1e342876');c.fillStyle=shade;c.fillRect(a.x,a.y,b.x-a.x,d.y-a.y+.5);
    c.globalAlpha=fade*(.06+.12*progress);c.fillStyle='#253e28';c.fillRect(a.x,a.y,b.x-a.x,d.y-a.y+.5);
    c.globalAlpha=fade*.85;const rim=Math.max(2,5*a.scale);c.drawImage(art.wall,0,(y%32)/32*art.wall.height,art.wall.width,art.wall.height/8,a.x,a.y,rim,d.y-a.y+.5);c.drawImage(art.wall,0,(y%32)/32*art.wall.height,art.wall.width,art.wall.height/8,b.x-rim,a.y,rim,d.y-a.y+.5);
   }
  }
  c.restore();
 }
 function waterfall(c,cam,time){
  const n=upland,g=groundLayer(),at=(x,y)=>{const p=project(x,y,cam);return p?{...p,depth:p.y,y:p.y+riverDepth*p.scale}:null;};
  c.save();c.beginPath();c.rect(0,136,640,408);c.clip();
  const a=at(n.river[0],n.front),b=at(n.river[1],n.front);
  if(a&&b&&a.y>=136&&a.y-n.height*a.scale<544){
   const w=b.x-a.x,h=n.height*a.scale,top=a.y-h,f=clamp((a.y-136)/72,0,1);c.globalAlpha=f*f*(3-2*f);
   // Reuse the river texture for the falling sheet; moving highlights and foam give it flow.
   c.drawImage(g,1248+512,480+512,96,48,a.x,top,w,h);const curtain=c.createLinearGradient(a.x,0,b.x,0);curtain.addColorStop(0,'#185d7370');curtain.addColorStop(.18,'#b2efea38');curtain.addColorStop(.7,'#b2efea18');curtain.addColorStop(1,'#185d7370');c.fillStyle=curtain;c.fillRect(a.x,top,w,h);
   c.save();c.beginPath();c.rect(a.x,top,w,h+8*a.scale);c.clip();
   c.fillStyle='#dcfff0';for(let i=0;i<19;i++){const x=a.x+(i+.5)*w/19,y=top+((time*.065+i*17)%n.height)*a.scale;c.globalAlpha=f*(.25+(i%3)*.12);c.fillRect(x,y,Math.max(1,2*a.scale),(8+i%5)*a.scale);}
   c.globalAlpha=f*.8;for(let i=0;i<16;i++){const wave=Math.sin(time*.004+i*2);c.fillRect(a.x+i*w/16,a.y+(wave*2-2)*a.scale,w/18,(3+i%3)*a.scale);}c.restore();
   // Flattened rings sit on the pool, while droplets arc upwards in front of the falling sheet.
   for(let i=0;i<5;i++){const phase=(time*.00055+i*.2)%1,rx=w*(.14+phase*.43),ry=a.scale*(3+phase*12);c.globalAlpha=f*(1-phase)*.30;c.strokeStyle='#d9fff3';c.lineWidth=Math.max(1,a.scale);c.beginPath();c.ellipse(a.x+w*.5,a.y+5*a.scale,rx,ry,0,0,Math.PI*2);c.stroke();}
   for(let i=0;i<9;i++){const pulse=Math.sin(time*.003+i*1.7),px=a.x+(i+.5)*w/9,py=a.y+(2-pulse*3)*a.scale,sz=(4+i%3)*a.scale;c.globalAlpha=f*.22;c.fillStyle='#bdeee8';c.fillRect(px-sz,py-sz,sz*2,sz);c.fillRect(px-sz*.6,py-sz*1.5,sz*1.2,sz*2);}
   for(let i=0;i<34;i++){const phase=(time*.0009+i*.618)%1,origin=(i%17+.5)/17,drift=((i*13)%11-5)*phase,px=a.x+origin*w+drift*a.scale,py=a.y+(phase*10-4*Math.sin(phase*Math.PI)*(3+i%4))*a.scale;
    c.globalAlpha=f*(1-phase)*.8;c.fillStyle=i%3?'#e7fff5':'#84d6df';const sz=Math.max(1,(i%3+1)*a.scale*.7);c.fillRect(px,py,sz,sz);}

  }c.restore();
 }
 function raisedTerrain(c,cam){
  const t=terrace,ground=groundLayer();c.save();c.beginPath();c.rect(0,136,640,408);c.clip();
  const at=(x,y,z=0)=>{const p=project(x,y,cam);return p?{x:p.x,y:p.y-(z+northHeight(x,y))*p.scale,scale:p.scale}:null;};
  const side=(x)=>{const a=at(x,t.back),b=at(x,t.front),u=at(x,t.back,t.height),v=at(x,t.front,t.height);if(!a||!b||!u||!v)return;c.save();c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(v.x,v.y);c.lineTo(u.x,u.y);c.closePath();c.fillStyle=c.createPattern(art.wall,'repeat');c.fill();c.restore();};
  side(t.left);side(t.right);
  for(const [l,r] of [[t.left,t.stairLeft],[t.stairRight,t.right]]){const a=at(l,t.front),b=at(r,t.front);if(a&&b)c.drawImage(art.wall,a.x,a.y-t.height*a.scale,b.x-a.x,t.height*a.scale);}
  for(let y=t.back;y<t.front;y+=2){const a=at(t.left,y,t.height),b=at(t.right,y,t.height),d=at(t.left,y+2,t.height);if(a&&b&&d&&d.y>a.y)c.drawImage(ground,t.left+512,y+512,t.right-t.left,2,a.x,a.y,b.x-a.x,d.y-a.y+.6);}
  for(let y=t.front;y<t.stairBottom;y+=2){const a=at(t.stairLeft,y,shrineHeight(1424,y)),b=at(t.stairRight,y,shrineHeight(1424,y)),d=at(t.stairLeft,y+2,shrineHeight(1424,y+2));if(a&&b&&d&&d.y>a.y)c.drawImage(art.stairs,0,(y-t.front)/(t.stairBottom-t.front)*art.stairs.height,art.stairs.width,2/(t.stairBottom-t.front)*art.stairs.height,a.x,a.y,b.x-a.x,d.y-a.y+.6);}
  c.restore();
 }
 const bridgeTextures={};
 function bridgeDecks(c,cam){
  c.save();c.beginPath();c.rect(0,136,640,408);c.clip();
  for(const b of bridges){
   if(!bridgeTextures[b.kind]){const im=document.createElement('canvas');im.width=b.kind==='bridge'?96:48;im.height=b.kind==='bridge'?40:96;YK_LANDSCAPE.drawAsset(im.getContext('2d'),b.kind,0,0,im.width,im.height);bridgeTextures[b.kind]=im;}
   const im=bridgeTextures[b.kind],crop=b.kind==='bridge'?[4,10,88,18]:[9,8,30,80],height=elevation(b.x+b.width/2,b.y+b.height/2);
   for(let y=b.y;y<b.y+b.height;y+=2){const next=Math.min(y+2,b.y+b.height),a=project(b.x,y,cam),r=project(b.x+b.width,y,cam),d=project(b.x,next,cam);if(!a||!r||!d)continue;
    a.y-=height*a.scale;r.y-=height*r.scale;d.y-=height*d.scale;if(d.y<=a.y||d.y<136||a.y>544)continue;
    const f=clamp((a.y-136)/72,0,1);c.globalAlpha=f*f*(3-2*f);c.drawImage(im,crop[0],crop[1]+(y-b.y)/b.height*crop[3],crop[2],(next-y)/b.height*crop[3],a.x,a.y,r.x-a.x,d.y-a.y+.6);
   }
  }c.restore();
 }
 function bridgeObjects(sprite,cam){
  const ns=bridges[0],ew=bridges[1],parts=[];
  // Short world-space sections keep the rail perspective and actor depth order aligned.
  for(const x of [ns.x+8,ns.x+ns.width-8]){
   const first=ns.y+8,last=ns.y+ns.height-8;
   for(let y=first;y<last;y+=16){const end=Math.min(y+16,last);
    parts.push({x:x-4,foot:(y+end)/2,width:8,height:28,draw:(c)=>{
     const a=project(x,y,cam),b=project(x,end,cam);if(!a||!b)return;c.save();
     for(const h of [12,24]){
      const ay=a.y-(elevation(x,y)+h)*a.scale,by=b.y-(elevation(x,end)+h)*b.scale;
      c.lineCap='round';c.strokeStyle='#594026';c.lineWidth=5*(a.scale+b.scale)/2;c.beginPath();c.moveTo(a.x,ay);c.lineTo(b.x,by);c.stroke();
      c.strokeStyle='#bf9754';c.lineWidth=2*(a.scale+b.scale)/2;c.beginPath();c.moveTo(a.x-1,ay-1);c.lineTo(b.x-1,by-1);c.stroke();
     }c.restore();
    }});
   }
   for(const foot of [first,(first+last)/2,last])parts.push({x:x-4,foot,width:8,height:28,draw:(c,l,t,w,h)=>c.drawImage(art.fence,9,0,14,art.fence.height,l,t,w,h)});
  }
  return [...parts,{...sprite('fence',ew.x+ew.width/2,ew.y+12,ew.width),height:28},{...sprite('fence',ew.x+ew.width/2,ew.y+ew.height-8,ew.width),height:28}];
 }
 const wander=new WeakMap();let previousTick=0;
 function updateResidents(now,state,list,isBlocked,enabled,random=Math.random){
  const dt=Math.min(.05,Math.max(0,(now-previousTick)/1000));previousTick=now;
  if(!enabled){for(const n of list)n.frame=1;return false;}
  let changed=false;
  for(const n of list){
   const fixed=n.stationary||['shop','rest'].includes(n.service)||n.role==='teagirl'||n.type==='hotkeeper'||(n.type==='merchant'&&n.service===undefined);
   if(fixed)continue;
   let m=wander.get(n);if(!m){m={home:[n.x,n.y],wait:.4+random()*1.8,left:0,phase:0};wander.set(n,m);}
   if(Math.hypot(state.x-n.x,state.y-n.y)<68){if(n.frame!==1)changed=true;n.frame=1;continue;}
   const allowed=(x,y)=>!isBlocked(x,y)&&Math.hypot(x-m.home[0],y-m.home[1])<=(n.id==='chief'?64:96)&&Math.hypot(x-state.x,y-state.y)>44&&!list.some(o=>o!==n&&Math.hypot(x-o.x,y-o.y)<38)&&
    (state.area!=='village'||y>90&&y<1170&&!doors.some(d=>Math.abs(x-d.x)<52&&Math.abs(y-d.y)<38))&&
    (!['teahouse','osumiHome','villageRoom'].includes(state.area)||y<580);
   if(m.left<=0){n.frame=1;m.wait-=dt;if(m.wait>0)continue;
    let chosen=false;for(let a=0;a<8;a++){const dirs=[[0,-1,'u'],[0,1,'d'],[-1,0,'l'],[1,0,'r']],v=dirs[Math.floor(random()*4)],distance=24+Math.floor(random()*3)*8;
     let valid=true;for(let d=4;d<=distance;d+=4)if(!allowed(n.x+v[0]*d,n.y+v[1]*d)){valid=false;break;}
     if(valid){m.dx=v[0];m.dy=v[1];m.dir=v[2];m.left=distance;chosen=true;break;}
    }if(!chosen){m.wait=.6+random();continue;}
   }
   const step=Math.min(m.left,dt*(n.type==='child'?46:n.type==='elder'?30:38));
   if(!allowed(n.x+m.dx*step,n.y+m.dy*step)){m.left=0;m.wait=.8+random();n.frame=1;changed=true;continue;}
   n.x+=m.dx*step;n.y+=m.dy*step;m.left-=step;m.phase+=dt;n.dir=m.dir;n.frame=[1,0,1,2][Math.floor(m.phase/.14)%4];changed=true;
   if(m.left<.01){m.left=0;m.wait=.9+random()*2;n.frame=1;}
  }
  return changed;
 }
 function draw(c,state,actors,doorState,time=performance.now()){
  load();YK_LANDSCAPE.load();YK_AUTOTILE.load();if(!ready()||!YK_LANDSCAPE.ready()||!YK_AUTOTILE.ready())return false;
  const sprite=(key,x,y,width,draw)=>({kind:key,x:x-width/2,foot:y,width,height:width*art[key].height/art[key].width*(key==='fence'?.5:1),draw:draw||((q,l,t,w,h)=>q.drawImage(art[key],l,t,w,h))});
  const objects=[...YK_LANDSCAPE.objects(mapData),...trees.map(t=>sprite('tree',t.x,t.y,t.w)),...props.map(p=>sprite(p.kind,p.x,p.y,p.w)),...gardens.flatMap(a=>[-42,-20,2].map(d=>sprite('crops',a.x,a.y+d,a.w*.92))),...gardens.map(a=>sprite('hozuki',a.x+a.w/2+12,a.y-6,34)),...bridgeObjects(sprite,camera(state.x,state.y)),sprite('well',well.x,well.y,well.w),
   ...buildings.map(b=>b.kind==='shrine'?{kind:'shrine',x:b.x-b.w/2,foot:b.y,width:b.w,height:b.w}:sprite(b.kind,b.x,b.y,b.w,(q,x,y,w,h)=>{q.drawImage(art[b.kind],x,y,w,h);drawDoor(q,b,x,y,w,h,doorState?.id===b.id?doorState.open:0);})),
   ...actors.filter(a=>!a.hero).map(a=>({x:a.x-36,foot:a.y,width:72,height:80,draw:(q,x,y,w,h,p)=>a.draw(p.x,p.y,p.scale)}))];
  const hero=actors.find(a=>a.hero);projectionRows.clear();
  c.save();c.translate(0,32);c.scale(1.2,1.2);
  YK_LANDSCAPE.drawQuarter(c,mapData,{x:state.x,foot:state.y,draw:(x,y,z)=>hero?.draw(x,y,z)},1.4,{ground:groundLayer(),groundOrigin:{x:-512,y:-512},objects,edgeColor:'#527a49',elevation,afterGround:(q,cam)=>{northTerrain(q,cam,time);riverTerrain(q,cam);waterfall(q,cam,time);raisedTerrain(q,cam);riverLife(q,cam,time);flow(q,cam,time);bridgeDecks(q,cam);}});
  const near=doors.find(d=>Math.abs(state.x-d.x)<58&&Math.abs(state.y-d.y)<64);
  if(near){const p=project(near.x,near.y,camera(state.x,state.y));if(p){p.y-=elevation(near.x,near.y)*p.scale;c.font='bold 14px sans-serif';c.textAlign='center';c.fillStyle='#142525e8';c.fillRect(p.x-82,p.y-116,164,26);c.fillStyle='#fff2cb';c.fillText('A：'+near.name,p.x,p.y-98);}}
  c.restore();return true;
 }
 // One authoritative residence per person: these four live indoors; others stay outdoors.
 const indoor={inn:['innkeeper','inn-host'],shop:['merchant','shopkeeper'],teahouse:['teagirl','tea-host'],osumiHome:['woman','osumi']};
 const roomResidents=Object.fromEntries(Object.entries(indoor).map(([id,[role,person]])=>[id,[resident(role,person,384,id==='teahouse'?245:390,'d')]]));
 function insideResidents(id){return roomResidents[id]||[];}
 return {riverDepth,waterHeight,upland,northHeight,terrace,elevation,props,updateResidents,size,revision,spawn,buildings,doors,roles,residents,resident,insideResidents,mapData,bridges,trees,well,gardens,load,ready,errors,blocked,camera,project,unproject,draw,doorRect};
})();

// Shared settlement kit: world coordinates, separate ground/objects/actors and reusable roles.
window.YK_SETTLEMENT=(()=>{
 const size=[1536,1280],revision=3,spawn=[768,1190],art={},errors={};
 const paths={home:'home',inn:'inn',shop:'shop',tea:'tea',tree:'tree',well:'well',garden:'garden',door:'door'};
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
  child:{type:'child',name:'里の子',talk:['橋の下を見て！　水がきらきら流れてるよ。']},
  merchant:{type:'merchant',name:'よろず屋',talk:['旅支度なら任せておくれ。']},
  woman:{type:'woman',name:'里の女・お澄',talk:['お帰りなさい、夜叉姫さま。','鬼灯の実が色づいて、里もにぎやかになりましたね。']},
  teagirl:{type:'teagirl',name:'茶屋娘',talk:['いらっしゃいませ。川を眺めながら一服どうぞ。']},
  elder:{type:'elder',name:'里長',talk:['天妖の社へ向かいなされ。','旅の前には、店で装備を整えるとよい。']},
  farmer:{type:'merchant',name:'畑守り',service:null,talk:['川から水を引いて、畑を育てとるんじゃ。']},
  weaver:{type:'woman',name:'織り手',talk:['この里の糸は、草花で染めているんですよ。']},
  fisher:{type:'elder',name:'川仕事の老人',talk:['川を渡るなら橋を使いなされ。岸は滑るからの。']},
  innkeeper:{type:'teagirl',name:'宿の女将',service:'rest',talk:['旅の疲れはためないこと。ゆっくり休んでおいで。']},
  traveler:{type:'merchant',name:'旅人',service:null,talk:['この先にも集落があると聞いたよ。','里の小社へは、東の小橋を渡るんだって。']}
 };
 function resident(role,id,x,y,dir='d',extra={}){return {...roles[role],role,id,x,y,dir,frame:1,service:role==='merchant'?'shop':roles[role].service,...extra};}
 const residents=[
  resident('elder','chief',716,648,'d'),resident('child','child-square',842,728,'l'),


  resident('farmer','farmer',576,470,'l'),resident('weaver','weaver',984,390,'d'),
  resident('child','child-garden',530,620,'r'),resident('fisher','fisher',1140,974,'l'),
  resident('traveler','traveler',896,868,'u'),resident('elder','shrine-keeper',1406,350,'d',{name:'社の世話役',talk:['大きな社は里の北。ここは里を見守る小さなお社じゃ。']})
 ];
 const mapData=Array.from({length:40},(_,y)=>Array.from({length:48},(_,x)=>x<3||x>45||y<3?'forest':'grass'));
 for(let y=0;y<34;y++)for(let x=39;x<=41;x++)mapData[y][x]='river';
 for(let y=32;y<=34;y++)for(let x=0;x<48;x++)mapData[y][x]='river';
 // Two clear crossings and a north exit, including forest gaps.
 for(let y=0;y<5;y++)for(let x=22;x<=25;x++)mapData[y][x]='grass';
 for(let y=35;y<40;y++)for(let x=0;x<48;x++)mapData[y][x]=(x<19||x>29)?'forest':'grass';
 const bridges=[{kind:'bridgeNS',x:704,y:1000,width:128,height:140,foot:1140,ground:true},{kind:'bridge',x:1212,y:370,width:160,height:88,foot:458,ground:true}];
 mapData.decorations=bridges;
 mapData.paths=[[[768,1260],[768,600],[768,70]],[[768,896],[320,896]],[[768,710],[1100,710]],[[768,540],[384,540],[384,482]],[[768,390],[1040,390],[1040,346]],[[768,402],[768,350]],[[1040,710],[1190,710],[1190,414],[1424,414],[1424,312]],[[1040,710],[1120,710],[1120,978]]];
 // Wide connected town lanes, sharing the field's earth texture.
 const original=mapData.paths.slice();mapData.paths=[];
 for(const p of original)for(const delta of [-22,0,22])mapData.paths.push(p.map(([x,y],i)=>{const next=p[i+1]||p[i-1];return Math.abs(next[0]-x)>Math.abs(next[1]-y)?[x,y+delta]:[x+delta,y];}));
 const trees=[{x:842,y:584,w:180},{x:226,y:520,w:148},{x:530,y:312,w:148},{x:1180,y:260,w:140},{x:218,y:728,w:136},{x:968,y:972,w:136}];
 const well={x:672,y:638,w:68};
 const gardens=[{x:548,y:416,w:150},{x:922,y:322,w:124},{x:458,y:624,w:144}];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function camera(x,y){return {x,y};}
 const project=(x,y,cam)=>YK_LANDSCAPE.project(x,y,cam,1.4);
 const unproject=(x,y,cam)=>YK_LANDSCAPE.unproject(x,y,cam,1.4);
 function blocked(x,y){
  if(!YK_LANDSCAPE.walkable(mapData,x,y,9))return true;
  const hit=(l,t,r,b)=>Math.hypot(x-clamp(x,l,r),y-clamp(y,t,b))<8;
  if(buildings.some(b=>hit(b.x-b.w*.39,b.y-70,b.x+b.w*.39,b.y)))return true;
  if(hit(well.x-27,well.y-24,well.x+27,well.y+6))return true;
  return trees.some(t=>Math.hypot(x-t.x,y-t.y)<18);
 }
 const aperture={home:[.429,.66,.165,.273],inn:[.411,.714,.175,.212],shop:[.435,.62,.139,.314],tea:[.406,.616,.168,.319]};
 function doorRect(b,cam){const p=project(b.x,b.y,cam);if(!p)return null;const im=art[b.kind],w=b.w*p.scale,h=w*im.height/im.width,a=aperture[b.kind];return {x:p.x-w/2+w*a[0],y:p.y-h+h*a[1],w:w*a[2],h:h*a[3]};}
 function drawDoor(c,b,x,y,w,h,openness){
  const a=aperture[b.kind],r={x:x+w*a[0],y:y+h*a[1],w:w*a[2],h:h*a[3]},im=art.door,half=im.width/2;
  c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();
  c.drawImage(im,0,0,half,im.height,r.x-r.w*.5*openness,r.y,r.w*.5,r.h);
  c.drawImage(im,half,0,half,im.height,r.x+r.w*.5+r.w*.5*openness,r.y,r.w*.5,r.h);c.restore();
 }
 function flow(c,cam,time){
  c.save();c.strokeStyle='#c0f4ea';c.globalAlpha=.48;c.lineWidth=1.5;
  for(let i=0;i<96;i++){
   const vertical=i<32;let x,y;
   if(vertical){x=1264+(i%3)*24;y=(i*93+time*.035)%1030;}
   else{x=(i*91-time*.047)%1536;if(x<0)x+=1536;y=1042+(i%3)*24;}
   if(bridges.some(b=>x>b.x-12&&x<b.x+b.width+12&&y>b.y-8&&y<b.y+b.height+8))continue;
   const p=project(x,y,cam),q=project(x+(vertical?4:12),y+(vertical?8:0),cam);
   if(!p||!q||p.x<0||p.x>640||p.y<136||p.y>544)continue;
   c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();
  }c.restore();
 }
 let ground=null;
 function groundLayer(){
  if(ground)return ground;
  ground=document.createElement('canvas');ground.width=size[0]+1024;ground.height=size[1]+1024;const c=ground.getContext('2d');c.imageSmoothingEnabled=false;
  for(let y=0;y<ground.height;y+=256)for(let x=0;x<ground.width;x+=256)YK_LANDSCAPE.drawAsset(c,'grass',x,y,256,256);
  c.translate(512,512);c.drawImage(YK_LANDSCAPE.groundLayer(mapData),0,0);
  for(const [x,y] of [[242,966],[438,958],[632,974],[906,982],[1178,822],[1194,560],[1150,484],[876,626],[258,590],[584,354]])YK_LANDSCAPE.drawAsset(c,'flowers',x-24,y-16,48,28);
  for(const a of gardens){const im=art.garden;c.drawImage(im,a.x-a.w/2,a.y-a.w*im.height/im.width,a.w,a.w*im.height/im.width);}
  return ground;
 }
 function draw(c,state,actors,doorState,time=performance.now()){
  load();YK_LANDSCAPE.load();YK_AUTOTILE.load();if(!ready()||!YK_LANDSCAPE.ready()||!YK_AUTOTILE.ready())return false;
  const sprite=(key,x,y,width,draw)=>({kind:key,x:x-width/2,foot:y,width,height:width*art[key].height/art[key].width,draw:draw||((q,l,t,w,h)=>q.drawImage(art[key],l,t,w,h))});
  const objects=[...YK_LANDSCAPE.objects(mapData),...trees.map(t=>sprite('tree',t.x,t.y,t.w)),sprite('well',well.x,well.y,well.w),
   ...buildings.map(b=>b.kind==='shrine'?{kind:'shrine',x:b.x-b.w/2,foot:b.y,width:b.w,height:b.w}:sprite(b.kind,b.x,b.y,b.w,(q,x,y,w,h)=>{q.drawImage(art[b.kind],x,y,w,h);drawDoor(q,b,x,y,w,h,doorState?.id===b.id?doorState.open:0);})),
   ...actors.filter(a=>!a.hero).map(a=>({x:a.x-36,foot:a.y,width:72,height:80,draw:(q,x,y,w,h,p)=>a.draw(p.x,p.y,p.scale)}))];
  const hero=actors.find(a=>a.hero);
  c.save();c.translate(0,32);c.scale(1.2,1.2);
  YK_LANDSCAPE.drawQuarter(c,mapData,{x:state.x,foot:state.y,draw:(x,y,z)=>hero?.draw(x,y,z)},1.4,{ground:groundLayer(),groundOrigin:{x:-512,y:-512},objects,edgeColor:'#527a49',afterGround:(q,cam)=>flow(q,cam,time)});
  const near=doors.find(d=>Math.abs(state.x-d.x)<58&&Math.abs(state.y-d.y)<64);
  if(near){const p=project(near.x,near.y,camera(state.x,state.y));if(p){c.font='bold 14px sans-serif';c.textAlign='center';c.fillStyle='#142525e8';c.fillRect(p.x-82,p.y-116,164,26);c.fillStyle='#fff2cb';c.fillText('A：'+near.name,p.x,p.y-98);}}
  c.restore();return true;
 }
 // One authoritative residence per person: these four live indoors; others stay outdoors.
 const indoor={inn:['innkeeper','inn-host'],shop:['merchant','shopkeeper'],teahouse:['teagirl','tea-host'],osumiHome:['woman','osumi']};
 const roomResidents=Object.fromEntries(Object.entries(indoor).map(([id,[role,person]])=>[id,[resident(role,person,384,id==='teahouse'?245:390,'d')]]));
 function insideResidents(id){return roomResidents[id]||[];}
 return {size,revision,spawn,buildings,doors,roles,residents,resident,insideResidents,mapData,bridges,trees,well,gardens,load,ready,errors,blocked,camera,project,unproject,draw,doorRect};
})();

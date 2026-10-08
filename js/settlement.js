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
  resident('child','child-garden',560,648,'r'),resident('fisher','fisher',1160,992,'l'),
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
 const project=(x,y,cam)=>YK_LANDSCAPE.project(x,y,cam,1.4);
 const unproject=(x,y,cam)=>YK_LANDSCAPE.unproject(x,y,cam,1.4);
 const terrace={left:1360,right:1504,back:192,front:352,height:32,stairLeft:1392,stairRight:1456,stairBottom:432};
 function elevation(x,y){const t=terrace;if(x>=t.left&&x<=t.right&&y>=t.back&&y<=t.front)return t.height;if(x>=t.stairLeft&&x<=t.stairRight&&y>t.front&&y<t.stairBottom)return t.height*(t.stairBottom-y)/(t.stairBottom-t.front);return 0;}
 function blocked(x,y){
  if(!YK_LANDSCAPE.walkable(mapData,x,y,9))return true;
  const hit=(l,t,r,b)=>Math.hypot(x-clamp(x,l,r),y-clamp(y,t,b))<8;
  const t=terrace;
  if(hit(t.left-4,t.back,t.left+4,t.front)||hit(t.right-4,t.back,t.right+4,t.front)||hit(t.left,t.back-4,t.right,t.back+4)||hit(t.left,t.front-4,t.stairLeft-4,t.front+4)||hit(t.stairRight+4,t.front-4,t.right,t.front+4)||hit(t.stairLeft-4,t.front,t.stairLeft,t.stairBottom-8)||hit(t.stairRight,t.front,t.stairRight+4,t.stairBottom-8))return true;
  if(buildings.some(b=>hit(b.x-b.w*.39,b.y-70,b.x+b.w*.39,b.y)))return true;
  if(hit(well.x-27,well.y-24,well.x+27,well.y+6))return true;
  if(props.some(p=>p.kind==='fence'?hit(p.x-p.w*.45,p.y-8,p.x+p.w*.45,p.y+2):Math.hypot(x-p.x,y-p.y)<p.r+8))return true;
  if(gardens.some(a=>hit(a.x-a.w/2,a.y-68,a.x+a.w/2,a.y+8)))return true;
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
   c.globalAlpha=.48*Math.min(1,(p.y-136)/72);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();
  }c.restore();
 }
 let ground=null;
 function groundLayer(){
  if(ground)return ground;
  ground=document.createElement('canvas');ground.width=size[0]+1024;ground.height=size[1]+1024;const c=ground.getContext('2d');c.imageSmoothingEnabled=false;
  for(let y=0;y<ground.height;y+=256)for(let x=0;x<ground.width;x+=256)YK_LANDSCAPE.drawAsset(c,'grass',x,y,256,256);
  c.translate(512,512);c.drawImage(YK_LANDSCAPE.groundLayer(mapData),0,0);
  for(const [x,y] of [[242,966],[438,958],[632,974],[906,982],[1178,822],[1194,560],[1150,484],[876,626],[258,590],[584,354]])YK_LANDSCAPE.drawAsset(c,'flowers',x-24,y-16,48,28);
  for(const a of gardens){c.save();c.beginPath();c.rect(a.x-a.w/2,a.y-68,a.w,76);c.clip();for(let y=a.y-68;y<a.y+8;y+=64)for(let x=a.x-a.w/2;x<a.x+a.w/2;x+=64)YK_LANDSCAPE.drawAsset(c,'road',x,y,64,64);c.fillStyle='#4b301c88';c.fillRect(a.x-a.w/2,a.y-68,a.w,76);c.restore();}
  return ground;
 }
 function raisedTerrain(c,cam){
  const t=terrace,ground=groundLayer();c.save();c.beginPath();c.rect(0,136,640,408);c.clip();
  const at=(x,y,z=0)=>{const p=project(x,y,cam);return p?{x:p.x,y:p.y-z*p.scale,scale:p.scale}:null;};
  const side=(x)=>{const a=at(x,t.back),b=at(x,t.front),u=at(x,t.back,t.height),v=at(x,t.front,t.height);if(!a||!b||!u||!v)return;c.save();c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(v.x,v.y);c.lineTo(u.x,u.y);c.closePath();c.fillStyle=c.createPattern(art.wall,'repeat');c.fill();c.restore();};
  side(t.left);side(t.right);
  for(const [l,r] of [[t.left,t.stairLeft],[t.stairRight,t.right]]){const a=at(l,t.front),b=at(r,t.front);if(a&&b)c.drawImage(art.wall,a.x,a.y-t.height*a.scale,b.x-a.x,t.height*a.scale);}
  for(let y=t.back;y<t.front;y+=2){const a=at(t.left,y,t.height),b=at(t.right,y,t.height),d=at(t.left,y+2,t.height);if(a&&b&&d&&d.y>a.y)c.drawImage(ground,t.left+512,y+512,t.right-t.left,2,a.x,a.y,b.x-a.x,d.y-a.y+.6);}
  for(let y=t.front;y<t.stairBottom;y+=2){const a=at(t.stairLeft,y,elevation(1424,y)),b=at(t.stairRight,y,elevation(1424,y)),d=at(t.stairLeft,y+2,elevation(1424,y+2));if(a&&b&&d&&d.y>a.y)c.drawImage(art.stairs,0,(y-t.front)/(t.stairBottom-t.front)*art.stairs.height,art.stairs.width,2/(t.stairBottom-t.front)*art.stairs.height,a.x,a.y,b.x-a.x,d.y-a.y+.6);}
  c.restore();
 }
 function bridgeObjects(sprite){
  const ns=bridges[0],ew=bridges[1];
  const posts=[];for(const x of [ns.x+8,ns.x+ns.width-8])for(const foot of [ns.y+8,ns.y+ns.height-8])posts.push({x:x-4,foot,width:8,height:28,draw:(c,l,t,w,h)=>c.drawImage(art.fence,9,0,14,art.fence.height,l,t,w,h)});
  return [...posts,{...sprite('fence',ew.x+ew.width/2,ew.y+12,ew.width),height:28},{...sprite('fence',ew.x+ew.width/2,ew.y+ew.height-8,ew.width),height:28}];
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
  const objects=[...YK_LANDSCAPE.objects(mapData),...trees.map(t=>sprite('tree',t.x,t.y,t.w)),...props.map(p=>sprite(p.kind,p.x,p.y,p.w)),...gardens.flatMap(a=>[-42,-20,2].map(d=>sprite('crops',a.x,a.y+d,a.w*.92))),...gardens.map(a=>sprite('hozuki',a.x+a.w/2+12,a.y-6,34)),...bridgeObjects(sprite),sprite('well',well.x,well.y,well.w),
   ...buildings.map(b=>b.kind==='shrine'?{kind:'shrine',x:b.x-b.w/2,foot:b.y,width:b.w,height:b.w}:sprite(b.kind,b.x,b.y,b.w,(q,x,y,w,h)=>{q.drawImage(art[b.kind],x,y,w,h);drawDoor(q,b,x,y,w,h,doorState?.id===b.id?doorState.open:0);})),
   ...actors.filter(a=>!a.hero).map(a=>({x:a.x-36,foot:a.y,width:72,height:80,draw:(q,x,y,w,h,p)=>a.draw(p.x,p.y,p.scale)}))];
  const hero=actors.find(a=>a.hero);
  c.save();c.translate(0,32);c.scale(1.2,1.2);
  YK_LANDSCAPE.drawQuarter(c,mapData,{x:state.x,foot:state.y,draw:(x,y,z)=>hero?.draw(x,y,z)},1.4,{ground:groundLayer(),groundOrigin:{x:-512,y:-512},objects,edgeColor:'#527a49',elevation,afterGround:(q,cam)=>{flow(q,cam,time);raisedTerrain(q,cam);}});
  const near=doors.find(d=>Math.abs(state.x-d.x)<58&&Math.abs(state.y-d.y)<64);
  if(near){const p=project(near.x,near.y,camera(state.x,state.y));if(p){c.font='bold 14px sans-serif';c.textAlign='center';c.fillStyle='#142525e8';c.fillRect(p.x-82,p.y-116,164,26);c.fillStyle='#fff2cb';c.fillText('A：'+near.name,p.x,p.y-98);}}
  c.restore();return true;
 }
 // One authoritative residence per person: these four live indoors; others stay outdoors.
 const indoor={inn:['innkeeper','inn-host'],shop:['merchant','shopkeeper'],teahouse:['teagirl','tea-host'],osumiHome:['woman','osumi']};
 const roomResidents=Object.fromEntries(Object.entries(indoor).map(([id,[role,person]])=>[id,[resident(role,person,384,id==='teahouse'?245:390,'d')]]));
 function insideResidents(id){return roomResidents[id]||[];}
 return {terrace,elevation,props,updateResidents,size,revision,spawn,buildings,doors,roles,residents,resident,insideResidents,mapData,bridges,trees,well,gardens,load,ready,errors,blocked,camera,project,unproject,draw,doorRect};
})();

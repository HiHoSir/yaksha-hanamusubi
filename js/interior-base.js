// Base artwork placement and footprint geometry share 768px screen coordinates.
window.YK_INTERIOR_BASE=(()=>{
 const area=s=>['teahouse','osumiHome','villageRoom'].includes(s.area);
 const kind=s=>s.lastInterior==='inn'?'inn':s.lastInterior==='shop'?'armory':s.area==='teahouse'?'teahouse':'home';
 const images={};
 // Opt-in structural tea-room pilot. The approved artwork remains the default.
 // Activate with ?interiorStructure=1; no save-state or other room changes.
 const teaStructureEnabled=()=>false; // Deprecated flat-color prototype: never display as game art.
 const teaTables=[
  {id:'tea-table-back-left',x:234,y:376,w:116,h:48},
  {id:'tea-table-back-right',x:532,y:376,w:116,h:48},
  {id:'tea-table-front-left',x:234,y:476,w:116,h:48},
  {id:'tea-table-front-right',x:532,y:476,w:116,h:48}
 ].map(t=>({...t,footprint:[t.x-t.w*.38,t.y-19,t.x+t.w*.38,t.y+5]}));
 const teaObjects=teaTables.map(t=>({...t,kind:'tea-table',y:t.y+5}));
 function teaRect(c,x,y,w,h,fill,stroke){c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.strokeRect(x+1,y+1,w-2,h-2);}}
 function teaStructure(c){
  // Room is authored in 768x768 *world* units: no painted-perspective scaling.
  c.fillStyle='#201b1a';c.fillRect(0,0,768,768);
  teaRect(c,48,196,672,410,'#a77650','#402c26');
  // Back wall: timber frame, plaster, hanging banners.
  teaRect(c,60,206,648,89,'#d9be8b','#61402c');
  for(let x=64;x<710;x+=128)teaRect(c,x,206,11,88,'#70482d','#3d2a24');
  for(let x=82;x<706;x+=46)teaRect(c,x,219,28,48,'#c5a879','#ab8d63');
  teaRect(c,60,286,648,14,'#6e422b','#3c291f');
  // Central raised timber floor, built on explicit parallel world rows.
  teaRect(c,82,300,604,236,'#996a41','#5a3927');
  for(let y=308;y<533;y+=17){teaRect(c,88,y,592,14,(y/17|0)%2?'#aa7647':'#b38250','#866039');for(let x=118;x<678;x+=124){c.fillStyle='#6d4830';c.fillRect(x,y+2,2,2);}}
  // Sliding threshold: front-facing edge; flat stepping stones on the earth floor.
  teaRect(c,82,526,604,16,'#593921','#38281f');
  teaRect(c,82,540,604,12,'#c08b54','#5e412e');
  teaRect(c,48,552,672,57,'#755641','#4a392e');
  for(let x=64;x<707;x+=38){c.fillStyle=x%3?'#846148':'#66503d';c.fillRect(x,566+(x%13),16,5);}
  for(const [x,y,w] of [[342,558,68],[369,584,59]]){c.beginPath();c.ellipse(x+w/2,y+8,w/2,11,0,0,Math.PI*2);c.fillStyle='#c5b395';c.fill();c.strokeStyle='#7a705d';c.stroke();}
  // Entrance in foreground must remain open and at character-scale.
  teaRect(c,51,593,256,17,'#533726');
  teaRect(c,461,593,256,17,'#533726');
  for(const x of [51,701])teaRect(c,x,286,15,316,'#765034','#3c2b25');
  // Non-interactive floor shadow remains in the base, never on sortable objects.
  for(const t of teaTables){c.fillStyle='rgba(40,23,15,.24)';c.beginPath();c.ellipse(t.x,t.y+3,58,14,0,0,Math.PI*2);c.fill();}
 }
 function drawTeaTable(c,t){
  const {x,y,w}=t;
  // Mats have no footprint: they cannot stop navigation.
  for(const dx of [-72,72]){teaRect(c,x+dx-19,y-20,38,34,'#9e9b65','#6f7048');teaRect(c,x+dx-13,y-14,26,22,'#beb883');}
  teaRect(c,x-w*.33,y-13,w*.66,25,'#543723','#38251c');
  teaRect(c,x-w*.5,y-43,w,34,'#a77445','#4c3123');
  teaRect(c,x-w*.44,y-38,w*.88,22,'#b78955','#d4a46b');
  for(const dx of [-w*.36,w*.36])teaRect(c,x+dx-4,y-9,8,20,'#62422b','#3b291d');
  c.fillStyle='#e6d7a7';c.beginPath();c.ellipse(x,y-27,14,5,0,0,7);c.fill();
  c.fillStyle='#86a57c';c.beginPath();c.ellipse(x,y-28,8,3,0,0,7);c.fill();
 }

 // Original-image coordinates. Clip the SAME original pixels for the foreground;
 // no regenerated furniture, resizing, or independent layer alignment.
 const counterOutline=[[493,342],[499,341],[499,290],[508,280],[511,266],[522,263],[523,255],[532,252],[541,258],[542,265],[555,267],[562,281],[565,327],[585,326],[592,336],[605,330],[627,331],[646,335],[678,338],[681,343],[914,343],[915,339],[981,339],[986,343],[1036,342],[1045,373],[1065,373],[1071,441],[1044,443],[1044,484],[493,484],[491,443],[466,442],[465,374],[491,372]];
 const counter={id:'armory-counter',y:370,footprint:[249,340,520,370],outline:counterOutline};
 const loaded=im=>!!(im?.complete&&im.naturalWidth);
 const layeredReady=()=>loaded(images.armory)&&loaded(images.armoryClean);
 function clipObject(c,o){c.beginPath();o.outline.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x/2,128+y/2));c.closePath();c.clip();}
 function drawObject(c,s,o){if(kind(s)==='teahouse'&&teaStructureEnabled()&&o.kind==='tea-table'){drawTeaTable(c,o);return;}if(kind(s)!=='armory'||!layeredReady())return;c.save();clipObject(c,o);c.drawImage(images.armory,0,128,768,512);c.restore();}
 function objects(s){if(kind(s)==='teahouse'&&teaStructureEnabled())return teaObjects;if(kind(s)==='armory'&&layeredReady())return [counter];return [];}
 // DEBUG ONLY: non-art calibration overlay on the approved painted room.
 // Does not change collisions, actor scale, saves, or normal rendering.
 const measureEnabled=()=>new URLSearchParams(location.search).get('interiorMeasure')==='1';
 function drawCalibration(c,s){
  if(!measureEnabled())return;
  const l=layouts[kind(s)];
  c.save();c.strokeStyle='rgba(16,255,228,.27)';c.lineWidth=1;
  for(let x=64;x<=704;x+=32){c.beginPath();c.moveTo(x,272);c.lineTo(x,608);c.stroke();}
  for(let y=288;y<=608;y+=32){c.beginPath();c.moveTo(48,y);c.lineTo(720,y);c.stroke();}
  c.strokeStyle='#ffb93b';c.lineWidth=2;
  for(const [a,b,d,e] of l.solids)c.strokeRect(a,b,d-a,e-b);
  c.beginPath();c.arc(l.spawn[0],l.spawn[1],9,0,Math.PI*2);c.stroke();
  c.font='11px sans-serif';c.fillStyle='#f5fff9';c.shadowColor='#000';c.shadowBlur=5;
  c.fillText('DEBUG: 32px lattice / amber=legacy hitboxes / ring=spawn',78,269);
  c.restore();
 }
 const layouts={
  teahouse:{top:306,spawn:[384,560],npc:[384,400],solids:[[75,300,286,365],[477,300,697,365],[65,385,286,467],[475,385,700,467]]},
  inn:{top:246,spawn:[384,560],npc:[128,384],solids:[[130,247,210,315],[237,247,322,315],[445,247,525,315],[550,247,640,315],[68,342,202,364],[278,342,360,364],[360,215,407,364],[407,342,477,364],[567,342,700,364],[22,400,228,478]]},
  armory:{top:286,spawn:[384,560],npc:[384,312],solids:[counter.footprint,[25,315,155,451],[642,322,744,451],[25,447,140,520],[650,460,744,520]]},
  home:{top:300,spawn:[432,560],npc:[400,400],solids:[[81,369,264,436],[193,278,257,310],[584,292,735,331]]}
 };
 function load(change){for(const name of Object.keys(layouts)){const im=images[name]=new Image();im.onload=change;im.src='assets/interiors/base-v1/'+name+'.webp?v=15.57.116';}const clean=images.armoryClean=new Image();clean.onload=change;clean.src='assets/interiors/layers-v1/armory-clean.webp?v=15.57.116';}
 function blocked(s,x,y){const k=kind(s),l=layouts[k];if(k==='teahouse'&&teaStructureEnabled()){if(x<66||x>700||y<300||y>612)return true;if(y>588&&(x<310||x>460))return true;return teaTables.some(t=>{const [a,b,c,d]=t.footprint;return x>=a&&x<=c&&y>=b&&y<=d;});}if(x<48||x>720||y<l.top||y>612)return true;if(y>548&&(x<310||x>490))return true;return l.solids.some(([a,b,c,d])=>x>=a&&x<=c&&y>=b&&y<=d);}
 function draw(c,s){if(kind(s)==='teahouse'&&teaStructureEnabled()){teaStructure(c);return;}c.fillStyle='#171416';c.fillRect(0,0,768,768);const im=images[kind(s)];if(loaded(im)){c.drawImage(im,0,128,768,512);if(kind(s)==='armory'&&layeredReady()){c.save();clipObject(c,counter);c.drawImage(images.armoryClean,0,128,768,512);c.restore();}drawCalibration(c,s);}else{c.fillStyle='#fff2cb';c.font='20px sans-serif';c.fillText('内観を読込中…',300,380);}}
 const spawn=s=>layouts[kind(s)].spawn.slice();
 const exit=(s)=>s.y>=580&&s.x>=310&&s.x<=490;
 // Static base-image trial: keep NPC feet on the same walkable floor as the player.
 function residents(s,list){const p=layouts[kind(s)].npc;for(const n of list){if(n.baseInteriorKey!==kind(s)){[n.x,n.y]=p;n.baseInteriorKey=kind(s);}}return list;}
 return {area,kind,layouts,load,blocked,draw,spawn,exit,residents,objects,drawObject,layeredReady};
})();

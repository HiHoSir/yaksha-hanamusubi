// Base artwork placement and footprint geometry share 768px screen coordinates.
window.YK_INTERIOR_BASE=(()=>{
 const area=s=>['teahouse','osumiHome','villageRoom'].includes(s.area);
 const kind=s=>s.lastInterior==='inn'?'inn':s.lastInterior==='shop'?'armory':s.area==='teahouse'?'teahouse':'home';
 const images={};
 // Original-image coordinates. Clip the SAME original pixels for the foreground;
 // no regenerated furniture, resizing, or independent layer alignment.
 const counterOutline=[[493,342],[499,341],[499,290],[508,280],[511,266],[522,263],[523,255],[532,252],[541,258],[542,265],[555,267],[562,281],[565,327],[585,326],[592,336],[605,330],[627,331],[646,335],[678,338],[681,343],[914,343],[915,339],[981,339],[986,343],[1036,342],[1045,373],[1065,373],[1071,441],[1044,443],[1044,484],[493,484],[491,443],[466,442],[465,374],[491,372]];
 const counter={id:'armory-counter',y:370,footprint:[249,340,520,370],outline:counterOutline};
 const loaded=im=>!!(im?.complete&&im.naturalWidth);
 const layeredReady=()=>loaded(images.armory)&&loaded(images.armoryClean);
 function clipObject(c,o){c.beginPath();o.outline.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x/2,128+y/2));c.closePath();c.clip();}
 function drawObject(c,s,o){if(kind(s)!=='armory'||!layeredReady())return;c.save();clipObject(c,o);c.drawImage(images.armory,0,128,768,512);c.restore();}
 function objects(s){return kind(s)==='armory'&&layeredReady()?[counter]:[];}
 const layouts={
  teahouse:{top:306,spawn:[384,560],npc:[384,400],solids:[[75,300,286,365],[477,300,697,365],[65,385,286,467],[475,385,700,467]]},
  inn:{top:246,spawn:[384,560],npc:[128,384],solids:[[130,247,210,315],[237,247,322,315],[445,247,525,315],[550,247,640,315],[68,342,202,364],[278,342,360,364],[360,215,407,364],[407,342,477,364],[567,342,700,364],[22,400,228,478]]},
  armory:{top:286,spawn:[384,560],npc:[384,312],solids:[counter.footprint,[25,315,155,451],[642,322,744,451],[25,447,140,520],[650,460,744,520]]},
  home:{top:300,spawn:[432,560],npc:[400,400],solids:[[81,369,264,436],[193,278,257,310],[584,292,735,331]]}
 };
 function load(change){for(const name of Object.keys(layouts)){const im=images[name]=new Image();im.onload=change;im.src='assets/interiors/base-v1/'+name+'.webp?v=15.57.116';}const clean=images.armoryClean=new Image();clean.onload=change;clean.src='assets/interiors/layers-v1/armory-clean.webp?v=15.57.116';}
 function blocked(s,x,y){const k=kind(s),l=layouts[k];if(x<48||x>720||y<l.top||y>612)return true;if(y>548&&(x<310||x>490))return true;return l.solids.some(([a,b,c,d])=>x>=a&&x<=c&&y>=b&&y<=d);}
 function draw(c,s){c.fillStyle='#171416';c.fillRect(0,0,768,768);const im=images[kind(s)];if(loaded(im)){c.drawImage(im,0,128,768,512);if(kind(s)==='armory'&&layeredReady()){c.save();clipObject(c,counter);c.drawImage(images.armoryClean,0,128,768,512);c.restore();}}else{c.fillStyle='#fff2cb';c.font='20px sans-serif';c.fillText('内観を読込中…',300,380);}}
 const spawn=s=>layouts[kind(s)].spawn.slice();
 const exit=(s)=>s.y>=580&&s.x>=310&&s.x<=490;
 // Static base-image trial: keep NPC feet on the same walkable floor as the player.
 function residents(s,list){const p=layouts[kind(s)].npc;for(const n of list){if(n.baseInteriorKey!==kind(s)){[n.x,n.y]=p;n.baseInteriorKey=kind(s);}}return list;}
 return {area,kind,layouts,load,blocked,draw,spawn,exit,residents,objects,drawObject,layeredReady};
})();

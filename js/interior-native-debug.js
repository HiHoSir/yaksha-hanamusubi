// Native indoor QA: reuse actual game canvas, actor renderer and movement; no iframe.
window.YK_INDOOR_NATIVE_DEBUG=(()=>{
 const W=10,H=8,S=32,ox=224,oy=272;
 const placements=[[2,2],[6,2],[2,4],[6,4]],pillars=[[0,0],[9,0],[0,7],[9,7]];
 const sprites={};
 sprites.table=new Image();sprites.table.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAoCAMAAAB5EAzbAAAAYFBMVEUAAACWSy5vOCYtGBSIKyvRmFaiUDCefkyJPi7Kh057Ri9EJB+zaUEyIB57YjI4NDzcomIYDg5DPRIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADr33QXAAAAIHRSTlMA////////////////////////AAAAAAAAAAAAAAAAAG84GDUAAAGbSURBVHja7ZXploMwCIUbNAshC/b9H3YAderWc8b+nd7jljR8XoJJH4+vvjINH2gbD8HdF2zefyMs/L4LXh6q/XIasQkKF/1bQJJ2BlFerjnND3ZKUx6yS1ActGZtl7aAQQAA46o0Ar1aLwEwQ4P5cedgEH/SX1AlXkheTDLEWYfHRe0ZS2BGLEIIIe9TEAB6UQSoGRzkKpTIUeRnMbYYM7NnBbhTCuKADUCSZ+/CGSFiXAhodOamtxNAq2ApFAPkrIDeiUqMz2dsuBjBJp444BmQZ4CUiwXQtAAC6ENpscmhPsS+h5ahyaj3DgKqgz5rIIqlSyj4ZkZKb41qKYuDvKuCAdZJtPhKSQxLMlTYjORCmQSwzsG5CgsgQVVRUoDHItOnRnpmqFQB308istZK8yciu2ldtDRcZGqRUb5K9BdlNACMSeU0muxCkFY5O+xUHb9EW0xwSxercV5zeg2ntXi1Xew+5Xktr4BjULiGpk0Z4SMNuy2x3tsQ62FTHKT609/34Am2U7gkQbcAcAA8pune/8Dd8V/9A/0ARhMXjod3kw0AAAAASUVORK5CYII=';
 sprites.stone=new Image();sprites.stone.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAMAAACVQ462AAAAYFBMVEUAAACsqKO5saWrpZqhnZdnZFhVVUqCfXiUjYRyb3CcmphKSkLIv6tAQD2JjVOamGl7fEkwMC8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACOIIxyAAAAIHRSTlMA//////////////////////8AAAAAAAAAAAAAAAAAAFCw8GQAAAGKSURBVHja7VTblsMgCKwCXqMk//+zO6Cbbvu8j5nTNIowDEj7ej148J+QDBRmzjXXuo1VRP76iFQujvoVPZlINR4bkRhcFCMFArhkj4IBZwbzyDeJnFN1nucMhhjxLBqso1uOHUchBmI2myrpVtfntOgzWzgvjhX5hu8gCeFQ5BtlPdPW78l5Rzs/HAO5mm8uuilCKC5BIuXcGiI5/Lr7cjHEDznws0rmZCwbN5MgaAh61bZ2S2IqvGr6KMEZijMQNwgpwSQkPqApxrY8uNCqYqf1lt1ovoNHa4rGkylIUqLfFXy5qJ7Ku9g7P9zxWPxbClp4ah0gGFKFo2kwuyr73bOVaLm8cO8b29tPbWjs6iQZASQIRpCmlMMPaF05Pryyk21i5j0M2BEu7kyS+xqEIblK6lfOgpdUzLLNNZFPN7gLpkR6xQKNMxMcOxxl7FEcyeIvWCAKBBV8gBiw7k5rp+YAOxx6T9Kv949hjOs1rp5St28EDKAbi1lw2rvtkXes0AvG5x/owf/hB9+BEQQUwhK5AAAAAElFTkSuQmCC';
 sprites.cushion=new Image();sprites.cushion.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAYFBMVEUAAABzh0o4RyVmekJVaTdgcz6Hl1VIWS8oNhoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArDpsqAAAAIHRSTlMA//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAORL9MUAAADKSURBVHja3ZILDoMwDEPJn/ufeHY7JBK2A2xGULV5OGna4/gdSdZYMdP7NCXCojw8wjlQd0AtU0QiIeErrs1BdwQMwwRMzzvgO3gJk+oOJZkNsJnC6ArJGvCpFj9q5zDHXgxIDAMUsVNgi86w10fAmLkAgHgAO7mXKUuJLwCdFc385hDm+BdVSswaKpIZIsRkswPQ9y7BkAIw+uCrk4hRvk62W7BPxmedsz8BRepYBuhRoVuzU6IUQnrp1GiAadep0i6hjqK5cvyRXuK3BRk4FpAUAAAAAElFTkSuQmCC';
 sprites.pillar=new Image();sprites.pillar.src='assets/interiors/prototypes/pillar-32x160.png?v=3684894b';

 // The same ground projection and depth queue as settlement.draw() uses.
 const road=new Image();let roadReady=false;
 road.onload=()=>{roadReady=true;groundsDirty=true};road.src='assets/terrain/landscape-v3/road.png?v=15.57.116';
 let ground=null,groundsDirty=true;
 const wallImage=document.createElement('canvas');wallImage.width=32;wallImage.height=96;
 {const c=wallImage.getContext('2d');
  c.fillStyle='#69513b';c.fillRect(0,0,32,96);
  c.fillStyle='#24201d';c.fillRect(0,0,32,23);
  c.fillStyle='#866547';c.fillRect(0,23,32,56);
  c.fillStyle='#503b2c';c.fillRect(0,79,32,17);
  c.strokeStyle='#ab8157';c.beginPath();c.moveTo(4,23);c.lineTo(4,96);c.stroke();
  c.strokeStyle='#392b23';c.beginPath();c.moveTo(30,23);c.lineTo(30,96);c.stroke();
 }
 const cell=(x,y)=>[Math.floor((x-ox)/S),Math.floor((y-oy)/S)];
 function blocked(x,y){
  const [cx,cy]=cell(x,y);
  if(cx<1||cx>8||cy<1||cy>6)return true;
  return placements.some(([tx,ty])=>cy===ty&&cx>=tx&&cx<tx+2);
 }
 function floor(){
  if(ground&&!groundsDirty)return ground;
  const c=document.createElement('canvas');c.width=W*S;c.height=H*S;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const X=x*S,Y=y*S;
   // Existing village road tile, untouched: 2x2 quadrants of road.png.
   if(roadReady)g.drawImage(road,(x%2)*32,(y%2)*32,32,32,X,Y,32,32);
   else {g.fillStyle='#95734e';g.fillRect(X,Y,32,32)}
   if(y>=1&&y<=5&&x>=1&&x<=8){
    // DEBUG ART ONLY: wood floor until approved floor tiles exist.
    g.fillStyle='#bc915c';g.fillRect(X,Y,32,32);
    g.strokeStyle='#95693f';g.lineWidth=1;for(let yy=6;yy<=31;yy+=11){g.beginPath();g.moveTo(X,Y+yy);g.lineTo(X+32,Y+yy);g.stroke()}
   }
   if((y===0||y===7||x===0||x===9)){
    // DEBUG ART ONLY: wall contact cells. Real three-layer wall art pending.
    g.fillStyle='#63472f';g.fillRect(X,Y,32,32);
   }
  }
  ground=c;groundsDirty=false;return ground;
 }
 function render(g,heroDraw,actorFoot){
  if(!YK_LANDSCAPE.ready()){YK_LANDSCAPE.load();return}
  const objects=[];
  function add(kind,x,y,w,h,renderHeight=h){
   const image=sprites[kind];if(!image?.complete||!image.naturalWidth)return;
   objects.push({kind,x:x+ox,foot:y+oy+h,width:w,height:renderHeight,draw:(q,l,t,W,H)=>{q.imageSmoothingEnabled=false;q.drawImage(image,l,t,W,H)}});
  }
  for(const [x,y] of placements){
   add('table',x*32,y*32,64,32,40);
   for(const cx of [x-1,x+2])add('cushion',cx*32,y*32,32,32);
  }
  add('stone',4*32,6*32,64,32);
  // Provisional north wall: 3 vertical bands in the village depth queue.
  for(let tx=1;tx<=8;tx++)objects.push({kind:'wall',x:ox+tx*32,foot:oy+32,width:32,height:96,draw:(q,l,t,W,H)=>{q.imageSmoothingEnabled=false;q.drawImage(wallImage,l,t,W,H)}});

  for(const [x,y] of pillars)add('pillar',x*32,y*32,32,32,122);
  const map=Array.from({length:H},()=>Array(W).fill('road'));
  g.fillStyle='#171416';g.fillRect(0,0,768,768);
  // Indoor framing: fill more of the available stage while retaining the village projection.
  g.save();g.translate(-96,-95);g.scale(1.5,1.5);
  YK_LANDSCAPE.drawQuarter(g,map,{x:actorFoot.x,foot:actorFoot.y,draw:(x,y,z)=>heroDraw({x,y,z})},1.4,{
   preset:3,ground:floor(),groundOrigin:{x:ox,y:oy},objects,edgeColor:'#211a17',interiorBackdrop:'#211a17'
  });
  g.restore();
  g.save();g.fillStyle='#ffffff';g.font='16px sans-serif';g.fillText('茶店・室内画角テスト／10×8',18,66);g.restore();
 }
 return {blocked,render,spawn:()=>[ox+4.5*S,oy+6.5*S],pillars};
})();

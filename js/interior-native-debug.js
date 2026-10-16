// Native indoor QA: reuse actual game canvas, actor renderer and movement; no iframe.
window.YK_INDOOR_NATIVE_DEBUG=(()=>{
 const W=10,H=8,S=32,ox=224,oy=272;
 const placements=[[2,2],[6,2],[2,4],[6,4]],pillars=[[0,0],[9,0],[0,7],[9,7]];
 const sprites={};
 sprites.table=new Image();sprites.table.src='assets/interiors/prototypes/teahouse-table-dango-64x40.png?v=15.57.118';
 sprites.stone=new Image();sprites.stone.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAMAAACVQ462AAAAYFBMVEUAAACsqKO5saWrpZqhnZdnZFhVVUqCfXiUjYRyb3CcmphKSkLIv6tAQD2JjVOamGl7fEkwMC8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACOIIxyAAAAIHRSTlMA//////////////////////8AAAAAAAAAAAAAAAAAAFCw8GQAAAGKSURBVHja7VTblsMgCKwCXqMk//+zO6Cbbvu8j5nTNIowDEj7ej148J+QDBRmzjXXuo1VRP76iFQujvoVPZlINR4bkRhcFCMFArhkj4IBZwbzyDeJnFN1nucMhhjxLBqso1uOHUchBmI2myrpVtfntOgzWzgvjhX5hu8gCeFQ5BtlPdPW78l5Rzs/HAO5mm8uuilCKC5BIuXcGiI5/Lr7cjHEDznws0rmZCwbN5MgaAh61bZ2S2IqvGr6KMEZijMQNwgpwSQkPqApxrY8uNCqYqf1lt1ovoNHa4rGkylIUqLfFXy5qJ7Ku9g7P9zxWPxbClp4ah0gGFKFo2kwuyr73bOVaLm8cO8b29tPbWjs6iQZASQIRpCmlMMPaF05Pryyk21i5j0M2BEu7kyS+xqEIblK6lfOgpdUzLLNNZFPN7gLpkR6xQKNMxMcOxxl7FEcyeIvWCAKBBV8gBiw7k5rp+YAOxx6T9Kv949hjOs1rp5St28EDKAbi1lw2rvtkXes0AvG5x/owf/hB9+BEQQUwhK5AAAAAElFTkSuQmCC';
 sprites.cushion=new Image();sprites.cushion.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAYFBMVEUAAABzh0o4RyVmekJVaTdgcz6Hl1VIWS8oNhoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArDpsqAAAAIHRSTlMA//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAORL9MUAAADKSURBVHja3ZILDoMwDEPJn/ufeHY7JBK2A2xGULV5OGna4/gdSdZYMdP7NCXCojw8wjlQd0AtU0QiIeErrs1BdwQMwwRMzzvgO3gJk+oOJZkNsJnC6ArJGvCpFj9q5zDHXgxIDAMUsVNgi86w10fAmLkAgHgAO7mXKUuJLwCdFc385hDm+BdVSswaKpIZIsRkswPQ9y7BkAIw+uCrk4hRvk62W7BPxmedsz8BRepYBuhRoVuzU6IUQnrp1GiAadep0i6hjqK5cvyRXuK3BRk4FpAUAAAAAElFTkSuQmCC';
 for(const kind of ['cushion','stone'])sprites[kind].addEventListener('load',()=>{groundsDirty=true});
 sprites.pillar=new Image();sprites.pillar.src='assets/interiors/prototypes/pillar-32x160.png?v=3684894b';
 // QA prototype: assemble a single front-facing 32x160 sprite from 32px tiles.
 // Keep the prior approved visual as an image-load fallback. No new footprints.
 const pillarTiles={};
 for(const role of ['top','middle','base']){
  const im=pillarTiles[role]=new Image();
  im.onload=()=>{
   if(!['top','middle','base'].every(k=>pillarTiles[k]?.complete&&pillarTiles[k].naturalWidth===32&&pillarTiles[k].naturalHeight===32))return;
   const canvas=document.createElement('canvas');canvas.width=32;canvas.height=160;
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   ctx.drawImage(pillarTiles.top,0,0);
   for(let i=1;i<=3;i++)ctx.drawImage(pillarTiles.middle,0,i*32);
   ctx.drawImage(pillarTiles.base,0,128);
   sprites.pillar=canvas;
  };
  im.src='assets/interiors/prototypes/pillar-repeat-v2-'+role+'-32.png?v=15.57.127';
 }

 // The same ground projection and depth queue as settlement.draw() uses.
 const road=new Image();let roadReady=false;
 road.onload=()=>{roadReady=true;groundsDirty=true};road.src='assets/terrain/landscape-v3/road.png?v=15.57.116';
 let ground=null,groundsDirty=true;
 // Evaluation-only 4x4/32px floor atlas. Original full-palette candidate is preserved locally.
 const woodFloor=new Image();let woodReady=false;
 woodFloor.onload=()=>{woodReady=true;groundsDirty=true};
 woodFloor.onerror=()=>{woodReady=false};
 woodFloor.src='assets/interiors/prototypes/teahouse-wood-floor-4x4-preview.png?v=83f83db';
 // Layered wall evaluation using preexisting 32px candidate textures.
 const plasterWall=new Image(),woodWainscot=new Image();
 let plasterReady=false,wainscotReady=false;
 const fullBackWall=new Image();
 let fullBackWallReady=false;
 fullBackWall.onload=()=>{fullBackWallReady=fullBackWall.naturalWidth===256&&fullBackWall.naturalHeight===96};
 fullBackWall.onerror=()=>{fullBackWallReady=false};
 fullBackWall.src='assets/interiors/prototypes/teahouse-back-wall-clean-256x96-v2.png?v=15.57.133';
 const wallImage=document.createElement('canvas');wallImage.width=32;wallImage.height=96;
 const wallEdges={left:document.createElement('canvas'),right:document.createElement('canvas')};
 for(const edge of Object.values(wallEdges)){edge.width=32;edge.height=96}
 function finishWallEdge(edge,side){
  const ctx=edge.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,32,96);
  ctx.drawImage(wallImage,0,0);
  // Thin shared timber facing ties plaster/wainscot into the corner pillars.
  const x=side==='left'?0:29;
  ctx.fillStyle='#493021';ctx.fillRect(x,0,3,96);
  ctx.fillStyle='#92623b';ctx.fillRect(x+(side==='left'?2:0),23,1,73);
  // Respect the adopted fade rule: only the upper 23px of the trim darkens.
  window.YK_INTERIOR_WALL_SHADE?.apply(ctx,x,0,3,23,{height:23,topAlpha:1,midAlpha:.52});
 }
 function rebuildWall(){
  const c=wallImage.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,32,96);
  // Three vertical zones: top 0..22, plaster 23..78, wood panel 79..95.
  // Apply the shared 32px plaster texture to the top zone as well.
  c.fillStyle='#866547';c.fillRect(0,0,32,79);
  if(plasterReady){
   c.drawImage(plasterWall,0,0,32,23,0,0,32,23);
   c.drawImage(plasterWall,0,23,32,56);
  }
  c.fillStyle='#503b2c';c.fillRect(0,79,32,17);
  if(wainscotReady)c.drawImage(woodWainscot,0,0,32,17,0,79,32,17);
  c.fillStyle='#65482f';c.fillRect(0,77,32,2);
  // Only topmost 23px fades upward to black: middle and wainscot remain unmasked.
  window.YK_INTERIOR_WALL_SHADE?.apply(c,0,0,32,23,{height:23,topAlpha:1,midAlpha:.52});
  finishWallEdge(wallEdges.left,'left');finishWallEdge(wallEdges.right,'right');
 }
 plasterWall.onload=()=>{plasterReady=true;rebuildWall()};
 plasterWall.onerror=()=>{plasterReady=false;rebuildWall()};
 woodWainscot.onload=()=>{wainscotReady=true;rebuildWall()};
 woodWainscot.onerror=()=>{wainscotReady=false;rebuildWall()};
 plasterWall.src='assets/interiors/prototypes/plaster-wall-32-candidate.png?v=15.57.123';
 woodWainscot.src='assets/interiors/prototypes/wood-wainscot-32-candidate.png?v=15.57.123';
 rebuildWall();
 // Raised wood floor is visual only; collision remains unchanged.
 const stepY=oy+6*S,stepHeight=7;
 function elevation(x,y){
  if(x<ox+S||x>ox+9*S)return 0;
  // A narrow visual transition keeps free walking across the stepping stone.
  return stepHeight*Math.max(0,Math.min(1,(stepY-y)/12));
 }
 function drawPlatformEdge(q,camera){
  const left=YK_LANDSCAPE.project(ox+S,stepY,camera,1.4);
  const right=YK_LANDSCAPE.project(ox+9*S,stepY,camera,1.4);
  if(!left||!right)return;
  const h=stepHeight*(left.scale+right.scale)/2;
  // A narrow fascia painted over the ground, not a collision-bearing wall.
  q.save();q.imageSmoothingEnabled=false;
  q.fillStyle='#55381f';q.fillRect(left.x,left.y-h,right.x-left.x,h);
  q.fillStyle='#a77b4b';q.fillRect(left.x,left.y-h,right.x-left.x,Math.max(1,h*.18));
  q.fillStyle='#34251c';q.fillRect(left.x,left.y-1,right.x-left.x,Math.max(1,h*.16));
  q.restore();
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
    // Real 32px atlas cells, repeating every four tiles in both axes.
    if(woodReady)g.drawImage(woodFloor,(x%4)*S,(y%4)*S,S,S,X,Y,S,S);
    else {g.fillStyle='#bc915c';g.fillRect(X,Y,S,S)}

   }
   if((y===0||y===7||x===0||x===9)){
    // DEBUG ART ONLY: wall contact cells. Real three-layer wall art pending.
    g.fillStyle='#63472f';g.fillRect(X,Y,32,32);
   }
  }
  // Walkable floor decorations are baked into the ground BEFORE perspective projection.
  for(const [tx,ty] of placements)for(const cx of [tx-1,tx+2]){
   const im=sprites.cushion;if(im.complete&&im.naturalWidth)g.drawImage(im,cx*S,ty*S,S,S);
  }
  if(sprites.stone.complete&&sprites.stone.naturalWidth)g.drawImage(sprites.stone,4*S,6*S,2*S,S);
  ground=c;groundsDirty=false;return ground;
 }
 let horizontalCameraX=null;
 function trackHorizontal(x){
  // 18 world-pixel dead zone: preserve perspective; only camera translation changes.
  if(horizontalCameraX===null)horizontalCameraX=x;
  const slack=18;
  if(x>horizontalCameraX+slack)horizontalCameraX=x-slack;
  else if(x<horizontalCameraX-slack)horizontalCameraX=x+slack;
  return horizontalCameraX;
 }
 function render(g,heroDraw,actorFoot){
  if(!YK_LANDSCAPE.ready()){YK_LANDSCAPE.load();return}
  const objects=[];
  function add(kind,x,y,w,h,renderHeight=h){
   const image=sprites[kind];if(!image||(!image.complete&&!(image instanceof HTMLCanvasElement))||!image.width&&!image.naturalWidth)return;
   objects.push({kind,x:x+ox,foot:y+oy+h,width:w,height:renderHeight,draw:(q,l,t,W,H,p)=>{
    q.imageSmoothingEnabled=false;
    if(kind==='table'){
     // Contact shadow belongs to the table's projected floor anchor; collision is unchanged.
     const base=t+H,shift=3*p.scale;
     q.save();q.fillStyle='rgba(38,24,16,.23)';
     q.beginPath();q.ellipse(l+W*.5,base+shift*.35,W*.39,Math.max(1,3*p.scale),0,0,Math.PI*2);q.fill();
     q.restore();
     q.drawImage(image,l,t+shift,W,H);
    }else q.drawImage(image,l,t,W,H);
   }});
  }
  for(const [x,y] of placements){
   add('table',x*32,y*32,64,32,40);

  }

  // Textured wall plane: the existing wall tiles are the solid surface.
  // Projected visual surface shares the rear pillars' floor-contact plane.
  // The entire composition (plaster, paneling, lamps and hanging scroll) is
  // a surface texture, not a separate depth-sorted background or decal.
  window.YK_INTERIOR_ARCHITECTURE.addRearWall(objects,{
   originX:ox,originY:oy,cellSize:S,roomWidth:W,
   wallHeight:96,pillarOverlap:6,
   wallImage,wallEdges,fullBackWall,fullBackWallReady
  });

  for(const [x,y] of pillars)add('pillar',x*32,y*32,32,32,122);
  const map=Array.from({length:H},()=>Array(W).fill('road'));
  g.fillStyle='#171416';g.fillRect(0,0,768,768);
  // Indoor framing: fill more of the available stage while retaining the village projection.
  g.save();g.translate(-96,-95);g.scale(1.5,1.5);
  YK_LANDSCAPE.drawQuarter(g,map,{x:actorFoot.x,foot:actorFoot.y,draw:(x,y,z)=>heroDraw({x,y,z})},1.4,{
   preset:3,cameraX:trackHorizontal(actorFoot.x),ground:floor(),groundOrigin:{x:ox,y:oy},objects,elevation,afterGround:drawPlatformEdge,edgeColor:'#211a17',interiorBackdrop:'#211a17'
  });
  g.restore();
  g.save();g.fillStyle='#ffffff';g.font='16px sans-serif';g.fillText('茶店・室内画角テスト／10×8',18,66);g.restore();
 }
 return {blocked,render,spawn:()=>[ox+4.5*S,oy+6.5*S],pillars};
})();

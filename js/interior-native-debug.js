// Native indoor QA: reuse actual game canvas, actor renderer and movement; no iframe.
window.YK_INDOOR_NATIVE_DEBUG=(()=>{
 const W=10,H=8,S=32,ox=224,oy=272;
 const placements=[[2,2],[6,2],[2,4],[6,4]],pillars=[[0,0],[9,0],[0,7],[9,7]];
 const sprites={};
 sprites.table=new Image();sprites.table.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAoCAMAAAB5EAzbAAAAYFBMVEUAAACWSy5vOCYtGBSIKyvRmFaiUDCefkyJPi7Kh057Ri9EJB+zaUEyIB57YjI4NDzcomIYDg5DPRIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADr33QXAAAAIHRSTlMA////////////////////////AAAAAAAAAAAAAAAAAG84GDUAAAGbSURBVHja7ZXploMwCIUbNAshC/b9H3YAderWc8b+nd7jljR8XoJJH4+vvjINH2gbD8HdF2zefyMs/L4LXh6q/XIasQkKF/1bQJJ2BlFerjnND3ZKUx6yS1ActGZtl7aAQQAA46o0Ar1aLwEwQ4P5cedgEH/SX1AlXkheTDLEWYfHRe0ZS2BGLEIIIe9TEAB6UQSoGRzkKpTIUeRnMbYYM7NnBbhTCuKADUCSZ+/CGSFiXAhodOamtxNAq2ApFAPkrIDeiUqMz2dsuBjBJp444BmQZ4CUiwXQtAAC6ENpscmhPsS+h5ahyaj3DgKqgz5rIIqlSyj4ZkZKb41qKYuDvKuCAdZJtPhKSQxLMlTYjORCmQSwzsG5CgsgQVVRUoDHItOnRnpmqFQB308istZK8yciu2ldtDRcZGqRUb5K9BdlNACMSeU0muxCkFY5O+xUHb9EW0xwSxercV5zeg2ntXi1Xew+5Xktr4BjULiGpk0Z4SMNuy2x3tsQ62FTHKT609/34Am2U7gkQbcAcAA8pune/8Dd8V/9A/0ARhMXjod3kw0AAAAASUVORK5CYII=';
 sprites.stone=new Image();sprites.stone.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAMAAACVQ462AAAAYFBMVEUAAACsqKO5saWrpZqhnZdnZFhVVUqCfXiUjYRyb3CcmphKSkLIv6tAQD2JjVOamGl7fEkwMC8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACOIIxyAAAAIHRSTlMA//////////////////////8AAAAAAAAAAAAAAAAAAFCw8GQAAAGKSURBVHja7VTblsMgCKwCXqMk//+zO6Cbbvu8j5nTNIowDEj7ej148J+QDBRmzjXXuo1VRP76iFQujvoVPZlINR4bkRhcFCMFArhkj4IBZwbzyDeJnFN1nucMhhjxLBqso1uOHUchBmI2myrpVtfntOgzWzgvjhX5hu8gCeFQ5BtlPdPW78l5Rzs/HAO5mm8uuilCKC5BIuXcGiI5/Lr7cjHEDznws0rmZCwbN5MgaAh61bZ2S2IqvGr6KMEZijMQNwgpwSQkPqApxrY8uNCqYqf1lt1ovoNHa4rGkylIUqLfFXy5qJ7Ku9g7P9zxWPxbClp4ah0gGFKFo2kwuyr73bOVaLm8cO8b29tPbWjs6iQZASQIRpCmlMMPaF05Pryyk21i5j0M2BEu7kyS+xqEIblK6lfOgpdUzLLNNZFPN7gLpkR6xQKNMxMcOxxl7FEcyeIvWCAKBBV8gBiw7k5rp+YAOxx6T9Kv949hjOs1rp5St28EDKAbi1lw2rvtkXes0AvG5x/owf/hB9+BEQQUwhK5AAAAAElFTkSuQmCC';
 sprites.cushion=new Image();sprites.cushion.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAYFBMVEUAAABzh0o4RyVmekJVaTdgcz6Hl1VIWS8oNhoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArDpsqAAAAIHRSTlMA//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAORL9MUAAADKSURBVHja3ZILDoMwDEPJn/ufeHY7JBK2A2xGULV5OGna4/gdSdZYMdP7NCXCojw8wjlQd0AtU0QiIeErrs1BdwQMwwRMzzvgO3gJk+oOJZkNsJnC6ArJGvCpFj9q5zDHXgxIDAMUsVNgi86w10fAmLkAgHgAO7mXKUuJLwCdFc385hDm+BdVSswaKpIZIsRkswPQ9y7BkAIw+uCrk4hRvk62W7BPxmedsz8BRepYBuhRoVuzU6IUQnrp1GiAadep0i6hjqK5cvyRXuK3BRk4FpAUAAAAAElFTkSuQmCC';
 sprites.pillar=new Image();sprites.pillar.src='assets/interiors/prototypes/pillar-32x160.png?v=3684894b';
 const tile=(x,y)=>({x:ox+x*S,y:oy+y*S});
 const cell=(x,y)=>[Math.floor((x-ox)/S),Math.floor((y-oy)/S)];
 function blocked(x,y){const [cx,cy]=cell(x,y);if(cx<1||cx>8||cy<1||cy>6)return true;return placements.some(([tx,ty])=>cy===ty&&cx>=tx&&cx<tx+2);}
 function perspective(y){return Math.max(.74,Math.min(1.32,1+(y-400)/930));}
 function project(x,y){const z=perspective(y);return{x:384+(x-384)*z,y:384+(y-384)*(1+(y-384)/1860),z};}
 function sprite(g,img,x,y,w,h,dh=h){if(!img.complete||!img.naturalWidth)return;const p=project(x+w/2,y+h);g.save();g.imageSmoothingEnabled=false;g.drawImage(img,p.x-w*p.z/2,p.y-dh*p.z,w*p.z,dh*p.z);g.restore();}
 function render(g,heroDraw,actorFoot){g.fillStyle='#171416';g.fillRect(0,0,768,768);
 for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){
  const x=ox+tx*S,y=oy+ty*S,p=project(x,y),q=project(x+S,y+S);
  g.fillStyle=tx===0||tx===9||ty===0||ty===7?'#69482f':ty>=6?'#94774d':'#bb9563';
  g.fillRect(p.x,p.y,q.x-p.x+.9,q.y-p.y+.9);
  g.strokeStyle='rgba(42,28,18,.23)';g.strokeRect(p.x,p.y,q.x-p.x,q.y-p.y);
 }
 const objects=[];
 for(const [tx,ty] of placements){
  objects.push({kind:'table',x:ox+tx*S,y:oy+ty*S,w:64,h:32,depth:oy+(ty+1)*S});
  for(const cx of [tx-1,tx+2])objects.push({kind:'cushion',x:ox+cx*S,y:oy+ty*S,w:32,h:32,depth:oy+(ty+1)*S});
 }
 objects.push({kind:'stone',x:ox+4*S,y:oy+6*S,w:64,h:32,depth:oy+7*S});
 for(const [tx,ty] of pillars)objects.push({kind:'pillar',x:ox+tx*S,y:oy+ty*S,w:32,h:32,depth:oy+(ty+1)*S});
 objects.push({kind:'hero',depth:actorFoot.y});objects.sort((a,b)=>a.depth-b.depth);
 for(const o of objects){if(o.kind==='hero')heroDraw(project(actorFoot.x,actorFoot.y));else sprite(g,sprites[o.kind],o.x,o.y,o.w,o.h,o.kind==='pillar'?160:o.kind==='table'?40:o.h);}
 g.save();g.font='15px sans-serif';g.fillStyle='#ffedbd';g.fillText('室内ネイティブ検証／10×8・四隅柱',18,58);g.restore();
 }
 return {blocked,render,spawn:()=>[ox+4.5*S,oy+6.5*S],pillars};
})();
((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./hozuki-compact-rules.js'):root.HOZUKI_RULES);if(typeof module==='object'&&module.exports)module.exports=api;else root.HOZUKI_RENDERER=api;})(globalThis,R=>{
'use strict';
const directionRow={d:0,u:1,r:2,l:3};
function actorBounds(c,hero){const rows={};c.save();c.clearRect(0,0,c.canvas.width,c.canvas.height);c.drawImage(hero,0,0);const pixels=c.getImageData(0,0,96,128).data;c.restore();for(const [dir,row] of Object.entries(directionRow)){let l=32,t=32,r=0,b=0;for(let frame=0;frame<3;frame++)for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(pixels[((row*32+y)*96+frame*32+x)*4+3]>=32){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+1);b=Math.max(b,y+1);}rows[dir]={left:l,top:t,width:r-l,height:b-t};}return rows;}
function spriteRect(o){if(o.rect)return o.rect.map(n=>n*32);const [w,h]=o.size;return [(o.cell[0]+.5-w/2)*32,(o.cell[1]+.5-h)*32,w*32,h*32];}
function contain(source,rect,align='bottom'){const [sx,sy,sw,sh]=source,[x,y,w,h]=rect,s=Math.min(w/sw,h/sh);return {source:[sx,sy,sw,sh],dest:[x+(w-sw*s)/2,y+(align==='top'?0:h-sh*s),sw*s,sh*s]};}
function drawObject(c,assets,o){const p=o.sprite===8?{source:assets.atlas.sourceRects[o.sprite],dest:spriteRect(o)}:contain(assets.atlas.sourceRects[o.sprite],spriteRect(o));c.drawImage(assets.objects,...p.source,...p.dest);return p;}
function heroScale(b){const cx=b.left+b.width/2,cy=b.top+b.height/2;return Math.min(28/b.width,28/b.height,16/Math.max(cx,32-cx),16/Math.max(cy,32-cy));}
function drawHero(c,assets,p,dir='d',frame=1){const b=assets.heroBounds[dir],s=heroScale(b),center=R.center(p.x,p.y),dest=[center.x-(b.left+b.width/2)*s,center.y-(b.top+b.height/2)*s,32*s,32*s];c.drawImage(assets.hero,frame*32,directionRow[dir]*32,32,32,...dest);return {dest,b,scale:s,center,foot:center.y+b.height*s/2};}
function drawGround(c,a){
 // Dedicated Hozuki ground artwork only; no field-map tile assets or repeats.
 c.drawImage(a.ground,0,0,a.ground.width,a.ground.height,0,0,R.width*32,R.height*32);
}
function bake(c,a){c.save();c.imageSmoothingEnabled=false;drawGround(c,a);for(const o of R.objects)drawObject(c,a,o);c.restore();}
function draw(c,a,actor=R.spawn,options={}){c.save();c.imageSmoothingEnabled=false;if(a.base)c.drawImage(a.base,0,0);else bake(c,a);
 const dir=options.dir||'d',frame=options.frame??1,b=a.heroBounds[dir],s=heroScale(b),foot=R.center(actor.x,actor.y).y+b.height*s/2;
 drawHero(c,a,actor,dir,frame);const sorted=[{id:'hero'}];
 if(options.collision){c.fillStyle='rgba(210,35,63,.3)';for(const [x,y] of R.occupiedTiles)c.fillRect(x*32,y*32,32,32);}
 if(options.grid){c.lineWidth=1;c.strokeStyle='rgba(255,255,255,.3)';c.beginPath();for(let x=0;x<=R.width;x++){c.moveTo(x*32+.5,0);c.lineTo(x*32+.5,R.height*32);}for(let y=0;y<=R.height;y++){c.moveTo(0,y*32+.5);c.lineTo(R.width*32,y*32+.5);}c.stroke();}
 if(options.centers){const p=R.center(actor.x,actor.y);c.strokeStyle='#fff16a';c.strokeRect(Math.floor(actor.x)*32+1,Math.floor(actor.y)*32+1,30,30);c.fillStyle='#fff16a';c.fillRect(p.x-1,p.y-1,3,3);c.fillStyle='#00ffff';c.fillRect(p.x-2,foot-1,5,2);}
 c.restore();return {depthOrder:sorted.map(o=>o.id),hero:drawHeroGeometry(a,actor,dir)};}
function drawHeroGeometry(a,p,dir){const b=a.heroBounds[dir],s=heroScale(b),center=R.center(p.x,p.y);return {left:center.x-b.width*s/2,top:center.y-b.height*s/2,right:center.x+b.width*s/2,bottom:center.y+b.height*s/2};}
return {actorBounds,spriteRect,contain,drawObject,drawHero,drawHeroGeometry,drawGround,bake,draw};
});

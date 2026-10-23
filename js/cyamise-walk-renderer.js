((root,factory)=>{if(typeof module==='object'&&module.exports)module.exports=factory(require('./cyamise-walk-rules.js'));else root.CYAMISE_RENDERER=factory(root.CYAMISE_RULES);})(globalThis,R=>{
'use strict';
const shapes={
 'bench-back':{foot:[430,493],points:[[306,389],[550,389],[560,408],[566,459],[562,473],[551,475],[550,490],[531,490],[530,474],[326,474],[325,491],[305,491],[306,475],[297,470],[294,447]]},
 table:{foot:[430,650],points:[[304,509],[369,509],[381,498],[401,494],[422,498],[434,504],[449,504],[450,509],[552,509],[556,514],[556,607],[546,610],[545,646],[532,650],[526,612],[481,612],[480,628],[383,628],[382,612],[330,612],[328,650],[308,650],[308,612],[301,610]]},
 'bench-front':{foot:[430,765],points:[[306,659],[552,659],[563,675],[568,735],[560,747],[550,747],[549,762],[530,765],[529,747],[329,747],[328,764],[306,764],[306,747],[296,744],[293,720]]}
};
function background(c,art){c.drawImage(art,0,0,384,256);for(const x of [280,950])c.drawImage(art,600/4,375/4,310/4,410/4,x/4,375/4,310/4,410/4);}
function object(c,art,o){const s=shapes[o.type],x=R.origin.x+(o.occupiedTiles[0][0]+1)*32,dx=x-s.foot[0]/4,dy=o.depth-s.foot[1]/4;c.save();c.translate(dx,dy);c.beginPath();s.points.forEach(([x,y],i)=>i?c.lineTo(x/4,y/4):c.moveTo(x/4,y/4));c.closePath();c.clip();c.drawImage(art,0,0,384,256);c.restore();}
function draw(c,art,hero,position,{grid=true,collision=true,dir='d',frame=1}={}){
 c.save();c.imageSmoothingEnabled=false;c.clearRect(0,0,384,256);background(c,art);
 const foot=position.foot||R.foot(position.x,position.y);
 const queue=R.objects.map(o=>({depth:o.depth,draw:()=>object(c,art,o)}));
 queue.push({depth:foot.y,draw:()=>{const row=({d:0,u:1,r:2,l:3})[dir]??0,col=frame===1?0:frame===0?1:(row>=2?1:2);const bounds=[{left:4,width:23,height:28},{left:4,width:24,height:30},{left:5,width:21,height:26},{left:5,width:21,height:26}][row],scale=28/bounds.height;c.drawImage(hero,col*32,row*32,32,32,foot.x-(bounds.left+bounds.width/2)*scale,foot.y-31*scale,32*scale,32*scale);}});
 queue.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
 if(collision){c.fillStyle='rgba(244,52,75,.25)';for(const [x,y] of R.occupiedTiles)c.fillRect(R.origin.x+x*32,R.origin.y+y*32,32,32);}
 if(grid){c.lineWidth=.35;c.strokeStyle='rgba(255,255,255,.65)';for(let x=0;x<=R.width;x++){c.beginPath();c.moveTo(R.origin.x+x*32,0);c.lineTo(R.origin.x+x*32,256);c.stroke();}for(let y=0;y<=R.height;y++){c.beginPath();c.moveTo(0,R.origin.y+y*32);c.lineTo(384,R.origin.y+y*32);c.stroke();}}
 c.strokeStyle='#ffe589';c.lineWidth=1;c.strokeRect(R.origin.x+position.x*32+1,R.origin.y+position.y*32+1,30,30);
 c.fillStyle='#7ee9ff';c.beginPath();c.arc(foot.x,foot.y,1.3,0,Math.PI*2);c.fill();c.restore();
}
return {draw};
});

((root,factory)=>{if(typeof module==='object'&&module.exports)module.exports=factory(require('./cyamise-walk-rules.js'));else root.CYAMISE_RENDERER=factory(root.CYAMISE_RULES);})(globalThis,R=>{
'use strict';
const sourceScale=384/1386,sourceY=3;
const shapes={
 'bench-back':[[280,355],[535,355],[542,363],[543,447],[538,458],[526,459],[524,469],[511,469],[510,459],[298,459],[296,469],[281,468],[279,459],[271,453],[272,370]],
 table:[[280,466],[531,466],[537,475],[537,638],[531,644],[527,662],[512,665],[507,644],[302,644],[297,665],[283,662],[283,644],[277,639]],
 'bench-front':[[281,675],[531,675],[541,684],[543,771],[533,781],[527,782],[524,791],[512,793],[510,783],[298,783],[296,793],[282,791],[279,782],[270,776],[271,691]]
};
function prepare(canvas,art){canvas.width=384;canvas.height=320;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(art,0,0);for(const x of [260,830])c.drawImage(art,550*sourceScale,335*sourceScale+sourceY,280*sourceScale,475*sourceScale,x*sourceScale,335*sourceScale+sourceY,300*sourceScale,475*sourceScale);return canvas;}
function object(c,art,o){const pts=shapes[o.type].map(([x,y])=>[x*sourceScale,y*sourceScale+sourceY]),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(60/(maxX-minX),(o.rows*32-4)/(maxY-minY));
 const centerX=R.origin.x+(o.occupiedTiles[0][0]+1)*32,dx=centerX-(minX+maxX)/2*scale,dy=o.depth-2-maxY*scale;c.save();c.translate(dx,dy);c.scale(scale,scale);c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(art,0,0);c.restore();}
function draw(c,art,hero,position,{grid=true,collision=true,dir='d',frame=1,clean=art}={}){
 c.save();c.imageSmoothingEnabled=false;c.clearRect(0,0,384,320);c.drawImage(clean,0,0);
 // The logical cell center drives movement; the entire visible sprite is centered here.
 const center=position.foot||R.foot(position.x,position.y),foot={x:center.x,y:center.y+14};
 const queue=R.objects.map(o=>({depth:o.depth,draw:()=>object(c,art,o)}));
 queue.push({depth:foot.y,draw:()=>{const row=({d:0,u:1,r:2,l:3})[dir]??0,col=frame===1?0:frame===0?1:(row>=2?1:2);const bounds=[{left:4,top:3,width:23,height:28},{left:3,top:1,width:25,height:30},{left:5,top:5,width:22,height:26},{left:5,top:5,width:22,height:26}][row],scale=28/bounds.height;c.drawImage(hero,col*32,row*32,32,32,center.x-(bounds.left+bounds.width/2)*scale,center.y-(bounds.top+bounds.height/2)*scale,32*scale,32*scale);}});
 queue.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
 if(collision){c.fillStyle='rgba(244,52,75,.25)';for(const [x,y] of R.occupiedTiles)c.fillRect(R.origin.x+x*32,R.origin.y+y*32,32,32);}
 if(grid){c.lineWidth=.35;c.strokeStyle='rgba(255,255,255,.65)';for(let x=0;x<=R.width;x++){c.beginPath();c.moveTo(R.origin.x+x*32,0);c.lineTo(R.origin.x+x*32,320);c.stroke();}for(let y=0;y<=R.height;y++){c.beginPath();c.moveTo(0,R.origin.y+y*32);c.lineTo(384,R.origin.y+y*32);c.stroke();}}
 c.strokeStyle='#ffe589';c.lineWidth=1;c.strokeRect(R.origin.x+position.x*32+1,R.origin.y+position.y*32+1,30,30);
 c.fillStyle='#7ee9ff';c.beginPath();c.arc(foot.x,foot.y,1.3,0,Math.PI*2);c.fill();c.restore();
}
return {draw,prepare};
});

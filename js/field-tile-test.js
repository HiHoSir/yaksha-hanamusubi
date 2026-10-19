/* Opt-in field map-tile movement test. ?tiletest=1 ; normal saves/maps unchanged. */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('tiletest')!=='1')return;
const world=window.YK_WORLD,map=world.mapData,unit=32;
const defs=[
 ['mountain-large',4,2,[[0,1,4,1]]],
 ['mountain-small',1,1,[[0,0,1,1]]],
 ['house',1,1,[[0,0,1,1]]],
 ['village',2,1,[[0,0,2,1]]],
 ['torii',1,1,[[0,0,1,1]]],
 ['trees',1,1,[[0,0,1,1]]],
 ['cave-small',1,1,[[0,0,1,1]]],
 ['cave-large',2,1,[[0,0,2,1]]],
 ['hole',1,1,[[0,0,1,1]]],
 ['pagoda',1,2,[[0,0,1,2]]],
 ['fort',2,1,[[0,0,2,1]]]
];
const images=new Map();
for(const [name] of defs){const im=new Image();im.src='assets/field-map-objects-v2/'+name+'.png?v=16.0.37';images.set(name,im);}
const valid=(x,y,w,h)=>{for(let yy=y-1;yy<y+h+1;yy++)for(let xx=x-1;xx<x+w+1;xx++)if(map[yy]?.[xx]!=='grass')return false;return true;};
const occupied=new Set();
const fits=(x,y,w,h)=>{if(!valid(x,y,w,h))return false;for(let yy=y-1;yy<y+h+1;yy++)for(let xx=x-1;xx<x+w+1;xx++)if(occupied.has(xx+','+yy))return false;return true;};
const start=[Math.floor(world.start[0]/32),Math.floor(world.start[1]/32)];
const candidates=[];
for(let y=2;y<map.length-3;y++)for(let x=2;x<map[0].length-5;x++)candidates.push([x,y]);
candidates.sort((a,b)=>Math.hypot(a[0]-start[0],a[1]-start[1])-Math.hypot(b[0]-start[0],b[1]-start[1]));
const pagodaCrop=new WeakMap();
const drawPagoda=(c,im,x,y,w,h)=>{
 if(!im.complete||!im.naturalWidth)return;
 let crop=pagodaCrop.get(im);
 if(!crop){
  const tmp=document.createElement('canvas');tmp.width=im.naturalWidth;tmp.height=im.naturalHeight;
  const ctx=tmp.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(im,0,0);
  const pixels=ctx.getImageData(0,0,tmp.width,tmp.height).data;
  let left=tmp.width,top=tmp.height,right=-1,bottom=-1;
  for(let yy=0;yy<tmp.height;yy++)for(let xx=0;xx<tmp.width;xx++){
   if(pixels[(yy*tmp.width+xx)*4+3]>12){
    left=Math.min(left,xx);top=Math.min(top,yy);right=Math.max(right,xx);bottom=Math.max(bottom,yy);
   }
  }
  crop=right>=left?[left,top,right-left+1,bottom-top+1]:[0,0,tmp.width,tmp.height];
  pagodaCrop.set(im,crop);
 }
 c.drawImage(im,...crop,x,y,w,h);
};
const placed=[];
for(const [name,w,h,solid] of defs){
 const found=candidates.find(([x,y])=>fits(x,y,w,h));if(!found)continue;
 const [cx,cy]=found;
 for(let yy=cy;yy<cy+h;yy++)for(let xx=cx;xx<cx+w;xx++)occupied.add(xx+','+yy);
 const im=images.get(name);
 const o={kind:'tiletest-'+name,x:cx*unit,y:cy*unit,width:w*unit,height:h*unit,foot:(cy+h)*unit,tileFootprints:solid,draw:(c,x,y,w,h)=>{if(im.complete&&im.naturalWidth)name==='pagoda'?drawPagoda(c,im,x,y,w,h):c.drawImage(im,x,y,w,h);},tileImage:name==='hole'?im:null};
 map.decorations.push(o);placed.push({name,cell:[cx,cy],size:[w,h],blocked:solid});
}
window.YK_FIELD_TILE_TEST=Object.freeze({placed,enabled:true});
})();
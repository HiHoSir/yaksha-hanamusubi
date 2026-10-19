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
for(const [name] of defs){const im=new Image();im.src='assets/field-map-objects-v2/'+name+'.png?v=16.0.34';images.set(name,im);}
const valid=(x,y,w,h)=>{for(let yy=y-1;yy<y+h+1;yy++)for(let xx=x-1;xx<x+w+1;xx++)if(map[yy]?.[xx]!=='grass')return false;return true;};
const occupied=new Set();
const fits=(x,y,w,h)=>{if(!valid(x,y,w,h))return false;for(let yy=y-1;yy<y+h+1;yy++)for(let xx=x-1;xx<x+w+1;xx++)if(occupied.has(xx+','+yy))return false;return true;};
const start=[Math.floor(world.start[0]/32),Math.floor(world.start[1]/32)];
const candidates=[];
for(let y=2;y<map.length-3;y++)for(let x=2;x<map[0].length-5;x++)candidates.push([x,y]);
candidates.sort((a,b)=>Math.hypot(a[0]-start[0],a[1]-start[1])-Math.hypot(b[0]-start[0],b[1]-start[1]));
const placed=[];
for(const [name,w,h,solid] of defs){
 const found=candidates.find(([x,y])=>fits(x,y,w,h));if(!found)continue;
 const [cx,cy]=found;
 for(let yy=cy;yy<cy+h;yy++)for(let xx=cx;xx<cx+w;xx++)occupied.add(xx+','+yy);
 const im=images.get(name);
 const o={kind:'tiletest-'+name,x:cx*unit,y:cy*unit,width:w*unit,height:h*unit,foot:(cy+h)*unit,tileFootprints:solid,draw:(c,x,y,dw,dh)=>{if(im.complete&&im.naturalWidth)c.drawImage(im,x,y,dw,dh);}};
 map.decorations.push(o);placed.push({name,cell:[cx,cy],size:[w,h],blocked:solid});
}
// Allow character overlap on the mountain's upper row by splitting its image into
// a background upper strip and depth-sorted lower strip.
const mountain=map.decorations.find(o=>o.kind==='tiletest-mountain-large');
if(mountain){
 const im=images.get('mountain-large'),draw=mountain.draw;
 mountain.draw=(c,x,y,w,h)=>{if(im.complete&&im.naturalWidth)c.drawImage(im,0,im.naturalHeight/2,im.naturalWidth,im.naturalHeight/2,x,y+h/2,w,h/2);};
 map.decorations.push({kind:'tiletest-mountain-upper',x:mountain.x,y:mountain.y,width:mountain.width,height:32,foot:mountain.y+1,tileFootprints:[],draw:(c,x,y,w,h)=>{if(im.complete&&im.naturalWidth)c.drawImage(im,0,0,im.naturalWidth,im.naturalHeight/2,x,y,w,h);}});
}
window.YK_FIELD_TILE_TEST=Object.freeze({placed,enabled:true});
})();
// Temporary illustrated locations, in 768px local-map coordinates (not field tiles).
// Hand-authored walk polygons follow clear ground; illustrations have no depth layers.
window.YK_DESTINATION_SCENES=(()=>{
 const layouts={
  shrine:{spawn:[70,330],floor:[[27,310],[145,310],[210,240],[560,240],[690,310],[690,680],[170,705],[125,400],[27,360]]},
  cove:{spawn:[70,430],floor:[[27,405],[140,400],[185,245],[570,245],[590,330],[680,370],[610,590],[640,690],[210,690],[145,470],[27,455]]},
  forest:{spawn:[70,430],floor:[[27,410],[175,390],[220,280],[580,270],[700,390],[695,520],[580,640],[240,640],[145,465],[27,450]]},
  fox:{spawn:[70,380],floor:[[27,360],[160,360],[260,260],[590,255],[700,365],[705,570],[600,700],[325,705],[170,430],[27,410]]},
  waterfall:{spawn:[70,600],floor:[[27,575],[85,575],[100,515],[160,490],[215,515],[550,515],[650,430],[690,435],[700,530],[620,620],[460,685],[180,660],[90,625],[27,625]]},
  hotspring:{spawn:[70,280],floor:[[27,265],[150,265],[230,240],[540,270],[630,325],[680,430],[665,650],[610,690],[175,690],[65,610],[100,400],[125,320],[27,300]]}
 };
 const images={};
 function contains(poly,x,y){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
 }return yes;}
 function blocked(area,x,y){return !!layouts[area]&&!contains(layouts[area].floor,x,y);}
 function draw(c,area,change){if(!layouts[area])return false;
  if(!images[area]){const im=images[area]=new Image();im.onload=change;im.src='assets/scenes/destinations-v1/'+area+'.webp';}
  const im=images[area];if(!im.complete||!im.naturalWidth)return false;c.drawImage(im,0,0,768,768);return true;
 }
 return {layouts,blocked,draw};
})();

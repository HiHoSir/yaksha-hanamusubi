// A journey along one connected road, with roadside stops and a hot-spring detour.
window.YK_WORLD=(()=>{
 const start=[230,534],hub=start; // hub retained only as a save/test compatibility alias.
 const places={
  village:{point:[211,565],name:"鬼灯の里",note:"旅の出発点。北へ歩いて天妖の社へ。"},
  shrine:{point:[194,366],name:"天妖の社",note:"里の北の社。参拝したら東の川沿いを浜へ。"},
  cove:{point:[467,610],name:"海の入り江",note:"川沿いの橋を渡った先の浜。北東の森へ道が続く。"},
  forest:{point:[661,405],name:"忘れの森",note:"東の森を抜け、北の龍神の滝を目指そう。"},
  waterfall:{point:[637,191],name:"龍神の滝",note:"旅路の北端。滝を訪ねたら西の祠へ。"},
  hotspring:{point:[431,214],name:"月見の湯",note:"滝から祠へ向かう道中の寄り道。湯でひと休み。"},
  fox:{point:[171,111],name:"九尾の祠",note:"北の街道の先、紅葉に囲まれた祠。"}
 };
 const shrineJunction=[289,415],springJunction=[458,138];
 const roads=[
  [places.village.point,start,[231,489],[241,471],[265,460],[284,445],shrineJunction],
  [shrineJunction,[246,405],[216,398],[197,382],places.shrine.point],
  [shrineJunction,[330,423],[348,435],[348,473],[357,489],[378,503],[379,542],[385,565],[407,581],[429,590],[448,607],places.cove.point],
  [places.cove.point,[485,587],[507,576],[524,560],[524,551],[549,539],[582,534],[591,515],[591,492],[608,478],[634,468],[660,451],[661,422],places.forest.point],
  [places.forest.point,[655,386],[638,368],[628,341],[629,326],[647,307],[662,291],[675,274],[678,253],[676,242],[659,225],[657,208],[657,190],places.waterfall.point],
  [places.waterfall.point,[600,192],[572,188],[555,170],[544,154],[514,142],springJunction,[412,139],[370,131],[318,138],[261,138],[225,138],[203,132],[183,124],places.fox.point],
  [springJunction,[457,179],[438,199],places.hotspring.point]
 ];
 const distance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
 const walkable=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&(Math.hypot(x-start[0],y-start[1])<=22||roads.some(r=>r.slice(1).some((b,i)=>distance(x,y,r[i],b)<=14)));
 const near=(x,y)=>Object.keys(places).find(k=>Math.hypot(x-places[k].point[0],y-places[k].point[1])<=22)||null;
 return {start,hub,places,roads,walkable,near,revision:3};
})();

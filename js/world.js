// Positions and road corridors share the artwork's 768 x 768 coordinate space.
window.YK_WORLD=(()=>{
 const hub=[378,389];
 const places={
  village:{point:[321,479],name:"鬼灯の里",note:"桜に囲まれた故郷。旅の支度と里人との語らい。"},
  shrine:{point:[278,242],name:"天妖の社",note:"山腹の朱い鳥居。花結びの手がかりを訪ねよう。"},
  waterfall:{point:[415,286],name:"龍神の滝",note:"社の東、川に架かる橋から水鏡の滝へ。"},
  forest:{point:[536,239],name:"忘れの森",note:"深緑の木々と石の祈り。妖の気配に気をつけて。"},
  hotspring:{point:[203,342],name:"月見の湯",note:"西の湯けむり。疲れた身体を休める場所。"},
  fox:{point:[625,397],name:"九尾の祠",note:"紅葉の奥にたたずむ祠。忘れられた約束の地。"},
  cove:{point:[625,480],name:"海の入り江",note:"東の坂道を下り、潮風が届く浜辺へ。"}
 };
 // Trace visible roads; branches meet at identical coordinates.
 const roads=[
  [hub,[363,409],[345,429],[334,454],places.village.point],
  [hub,[355,366],[332,347],[324,324],[334,300],[326,279],[305,254],places.shrine.point],
  [[334,300],[359,295],[388,288],places.waterfall.point,[442,289]],
  [hub,[405,365],[428,339],[451,322],[469,307],[488,278],[511,256],places.forest.point],
  [hub,[355,408],[324,415],[294,409],[266,400],[243,391],[219,380],[196,369],[203,357],places.hotspring.point],
  [hub,[402,405],[432,415],[467,417],[501,414],[535,405],[561,408],[577,416],[596,406],places.fox.point],
  [[577,416],[566,433],[578,449],[601,463],[616,475],places.cove.point]
 ];
 const distance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
 const walkable=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&roads.some(r=>r.slice(1).some((b,i)=>distance(x,y,r[i],b)<=12));
 const near=(x,y)=>Object.keys(places).find(k=>Math.hypot(x-places[k].point[0],y-places[k].point[1])<=22)||null;
 return {hub,places,roads,walkable,near,revision:1};
})();

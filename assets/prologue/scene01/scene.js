/* Scene 01: fixed registration, canonical cels; no game-state dependency. */
(function(root){
'use strict';
const W=960,H=540,DURATION=26;
const paths={background:'assets/prologue/scene01/layers/background.png',foreground:'assets/prologue/scene01/layers/foreground.png',petals:'assets/prologue/scene01/layers/petals.png',hizuki:'assets/characters/hizuki/bluebob-v1/walk-atlas-256.png',child:'assets/characters/npc-v3/satoko.png',merchant:'assets/characters/npc-v3/merchant.png',tea:'assets/characters/npc-v3/teagirl.png'};
const captions=[{from:1,to:5.7,speaker:'',text:'桜の花がほころぶ、鬼灯の里。'},{from:6,to:10.7,speaker:'',text:'朝の鐘が、今日もみんなの一日を告げる。'},{from:12,to:15.5,speaker:'里の子',text:'緋月さま、おはよう！　今日は橋まで競争ね！'},{from:16,to:19.5,speaker:'緋月',text:'おはよう！　橋の上では走っちゃだめよ。'},{from:20,to:23.5,speaker:'里の子',text:'はーい！　じゃあ、ここで待ってる！'}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function mix(a,b,t){return a+(b-a)*clamp(t,0,1)}
function actor(c,im,key,x,y,height,dir,walking,t){
 const hero=key==='hizuki',cw=hero?256:192,ch=hero?256:224,base=hero?232:192,ax=hero?128:96,ay=hero?248:212;
 const row=(hero?{d:0,u:1,r:2,l:3}:{d:0,u:1,l:2,r:3})[dir];
 const col=walking?[0,1,2,1][Math.floor(t*6)%4]:1,s=height/base;
 c.save();c.fillStyle='rgba(42,40,24,.16)';c.beginPath();c.ellipse(x,y-1,height*.19,height*.038,0,0,Math.PI*2);c.fill();
 c.drawImage(im,col*cw,row*ch,cw,ch,x-ax*s,y-ay*s,cw*s,ch*s);c.restore();
}
function render(c,images,time,{subtitles=true}={}){
 const t=clamp(time,0,DURATION);c.clearRect(0,0,W,H);c.save();
 // One transform for ALL registered layers; never move cut-out scenery independently.
 const close=t>=11&&t<24,z=close?1.65:mix(1,1.05,t/26);c.translate(480,close?265:300);c.scale(z,z);c.translate(close?-484:-480,close?-365:-300);
 c.drawImage(images.background,0,0,W,H);
 // A shopkeeper crosses the rear lane, then turns to welcome a customer.
 actor(c,images.merchant,'merchant',mix(650,608,t/7),284,62,t<7?'l':'d',t<7,t);
 actor(c,images.tea,'tea',mix(416,445,(t-2)/6),282,60,t<8?'r':'l',t>2&&t<8,t+.6);
 // Child walks down the bridge: shrinking is tied to the same depth path.
 let cy=mix(310,418,(t-2)/8),cx=mix(499,512,(t-2)/8);
 actor(c,images.child,'child',cx,cy,mix(51,76,(cy-310)/108),t<10?'d':'l',t>2&&t<10,t+.3);
 // Hizuki approaches, stops, faces the child, and finally looks along the bridge.
 let hx=mix(340,457,(t-5)/6),hy=mix(486,448,(t-5)/6),hd=t<11?'r':t<20?'r':t<22?'d':'u';
 actor(c,images.hizuki,'hizuki',hx,hy,103,hd,t>5&&t<11,t);
 c.drawImage(images.foreground,0,0,W,H);
 // Reuse actual extracted petals as an independent alpha layer, seamless wrapped motion.
 const px=(t*10)%W,py=(t*5)%H;c.save();c.globalAlpha=.62;
 for(const x of [px-W,px])for(const y of [py-H,py])c.drawImage(images.petals,x,y,W,H);c.restore();
 c.restore();
 if(subtitles){const cap=captions.find(v=>t>=v.from&&t<v.to);if(cap){
 c.save();c.fillStyle='rgba(20,25,29,.83)';c.fillRect(60,462,840,66);c.fillStyle='#fff5df';c.font='bold 20px sans-serif';c.textAlign='center';
 if(cap.speaker){c.font='bold 15px sans-serif';c.fillStyle='#ffdaa2';c.fillText(cap.speaker,480,482);c.font='bold 20px sans-serif';c.fillStyle='#fff5df';c.fillText(cap.text,480,511);}else c.fillText(cap.text,480,502);c.restore();}}
 const fade=t<1?1-t:t>25?t-25:0;if(fade>0){c.fillStyle=`rgba(18,25,26,${fade})`;c.fillRect(0,0,W,H)}
}
async function load(prefix=''){const pairs=await Promise.all(Object.entries(paths).map(([key,path])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve([key,im]);im.onerror=()=>reject(new Error('素材を読み込めません: '+path));im.src=prefix+path;})));return Object.fromEntries(pairs)}
root.KikokuScene01={W,H,DURATION,paths,captions,render,load};
})(typeof window==='undefined'?globalThis:window);

const fs=require('fs'),{spawn}=require('child_process'),{createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
(async()=>{GlobalFonts.registerFromPath('/tmp/NotoSansCJKjp-Regular.otf','JP');const p='assets/prologue/pixel-v2';const bg=await loadImage(p+'/source/village.png'),concern=await loadImage(p+'/source/hizuki-concern.png'),npc=await Promise.all([0,1,2,3].map(i=>loadImage(p+`/cels/npc-${i}.png`))),hero=await Promise.all([0,1,2,3].map(i=>loadImage(p+`/cels/acting-${i}.png`)));
const caps=JSON.parse(fs.readFileSync('assets/prologue/assembly-v2/timeline.json')).captions.filter(a=>a[0]>=47).map(a=>[a[0]-46,a[1]-46,a[2],a[3]]);fs.writeFileSync(p+'/tail-timeline.json',JSON.stringify({duration:62,offset:44,captions:caps},null,2));
const c=createCanvas(640,360),q=c.getContext('2d'),enc=spawn('ffmpeg',['-y','-v','error','-f','rawvideo','-pixel_format','rgba','-video_size','640x360','-framerate','24','-i','pipe:0','-an','-c:v','libx264','-profile:v','baseline','-level','3.0','-crf','23','-pix_fmt','yuv420p','/tmp/pixel-v2-tail.mp4'],{stdio:['pipe','inherit','inherit']});
function draw(im,x,y,h){q.drawImage(im,x,Math.round(y),h*im.width/im.height,h)}
for(let f=0;f<1488;f++){let t=f/24,cap=caps.find(a=>t>=a[0]&&t<a[1]),talk=cap&&Math.floor(t*5)%3!==0;q.imageSmoothingEnabled=false;q.drawImage(bg,0,0,640,360);
if(t<7.5){draw(npc[t<5.5?1:0],25,15,425)}
else if(t<8.5){draw(concern,100,0,440)}
else if(t<14){draw(npc[talk?3:2],240,10,420)}
else if(t<15){draw(concern,100,0,440)}
else if(t<22){draw(concern,90,0,440)}
else if(t<30){draw(hero[talk?1:0],25,0,450)}
else if(t<37.5){draw(npc[0],15,10,440)}
else if(t<45){draw(npc[talk?3:2],225,5,440)}
else if(t<52){draw(hero[talk?1:0],45,0,450)}
else {let departure=t>59?(t-59)*22:0;draw(hero[talk?3:2],45+departure,-Math.sin(Math.max(0,t-59)*7)*Math.min(2,Math.max(0,t-59)),450)}
if(cap){q.font='18px JP';let lines=[''];for(const ch of cap[3]){let i=lines.length-1;if(q.measureText(lines[i]+ch).width>565)lines.push(ch);else lines[i]+=ch}let y=lines.length>1?274:292;q.fillStyle='#142333eb';q.fillRect(19,y,602,352-y);q.textAlign='center';q.font='12px JP';q.fillStyle='#f5d8a6';q.fillText(cap[2],320,y+16);q.font='18px JP';q.fillStyle='#fff9ed';lines.forEach((l,i)=>q.fillText(l,320,y+40+i*21));q.textAlign='left';}
let a=t<.4?1-t/.4:t>60?(t-60)/2:0;if(a){q.fillStyle=`rgba(10,15,25,${a})`;q.fillRect(0,0,640,360)}
if([3,10,18,26,33,40,48,56].includes(t))fs.writeFileSync(p+`/tail-${t}.png`,c.toBuffer('image/png'));
if(!enc.stdin.write(Buffer.from(q.getImageData(0,0,640,360).data)))await new Promise(r=>enc.stdin.once('drain',r));}
enc.stdin.end();await new Promise((r,j)=>enc.on('exit',x=>x?j(x):r()));})();

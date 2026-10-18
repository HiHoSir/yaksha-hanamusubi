const fs=require('fs'),{spawn}=require('child_process'),{createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
(async()=>{GlobalFonts.registerFromPath('/tmp/NotoSansCJKjp-Regular.otf','JP');const p='assets/prologue/pixel-v2',bell=await loadImage(p+'/source/bell.png'),river=await loadImage(p+'/source/village.png'),hero=await loadImage(p+'/source/hizuki-concern.png'),c=createCanvas(640,360),q=c.getContext('2d');
const enc=spawn('ffmpeg',['-y','-v','error','-f','rawvideo','-pixel_format','rgba','-video_size','640x360','-framerate','24','-i','pipe:0','-an','-c:v','libx264','-profile:v','baseline','-level','3.0','-crf','23','-pix_fmt','yuv420p','/tmp/pixel-v2-silence.mp4'],{stdio:['pipe','inherit','inherit']});
for(let f=0;f<288;f++){let t=f/24;q.imageSmoothingEnabled=false;q.drawImage(t<7?bell:river,0,0,640,360);if(t>=7){let h=440,w=h*hero.width/hero.height;q.drawImage(hero,80,0,w,h)}
let cap=t<3?'そして、ある朝。':t>=4&&t<7?'いつもの音が、聞こえない。':t>=8&&t<11?'……鐘は？':null;
if(cap){q.fillStyle='#142333eb';q.fillRect(19,292,602,60);q.textAlign='center';q.font='12px JP';q.fillStyle='#f5d8a6';q.fillText(t>=8?'緋月':'',320,308);q.font='18px JP';q.fillStyle='#fff9ed';q.fillText(cap,320,333)}
let a=t<.5?1-t/.5:t>11?t-11:0;if(a){q.fillStyle=`rgba(10,15,25,${a})`;q.fillRect(0,0,640,360)}
if(t===5||t===9)fs.writeFileSync(p+`/silence-${t}.png`,c.toBuffer('image/png'));
if(!enc.stdin.write(Buffer.from(q.getImageData(0,0,640,360).data)))await new Promise(r=>enc.stdin.once('drain',r));}
enc.stdin.end();await new Promise((r,j)=>enc.on('exit',x=>x?j(x):r()));})();

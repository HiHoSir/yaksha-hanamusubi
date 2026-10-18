const fs=require('fs'),{spawn}=require('child_process'),{createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
(async()=>{
GlobalFonts.registerFromPath('/tmp/NotoSansCJKjp-Regular.otf','JP');const p='assets/prologue/pixel-v2';
const bg=await loadImage(p+'/source/village.png'),hero=await Promise.all([0,1,2].map(i=>loadImage(p+`/cels/hero-${i}.png`))),kid=await Promise.all([0,1,2,3].map(i=>loadImage(p+`/cels/child-${i}.png`)));
const captions=[[.6,3.6,'語り','かつて、人と鬼は争っていた。'],[4.05,9.1,'語り','その契りが憎しみを鎮め、ふたたび花が咲いたという。'],[14,16.7,'さとこ','緋月さま、おはよう！'],[18,20.8,'緋月','おはよう、さとこ。どこまで行くの？'],[21.4,24,'さとこ','橋まで！　みんなが待ってるの。'],[24.6,28,'緋月','そう。足もとに気をつけてね。'],[28.5,29.8,'さとこ','うん！']];
fs.writeFileSync(p+'/timeline.json',JSON.stringify({duration:32,captions,status:'redrawn opening review, not full prologue'},null,2));
const c=createCanvas(960,540),q=c.getContext('2d');const enc=spawn('ffmpeg',['-y','-v','error','-f','rawvideo','-pixel_format','rgba','-video_size','960x540','-framerate','24','-i','pipe:0','-an','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','/tmp/pixel-v2-silent.mp4'],{stdio:['pipe','inherit','inherit']});
function actor(im,x,y,height){q.imageSmoothingEnabled=false;q.drawImage(im,x,Math.round(y),height,height)}
for(let f=0;f<768;f++){
 let T=f/24,t=T-10;q.imageSmoothingEnabled=false;q.drawImage(bg,0,0,960,540);
 // Same pixel background, alternate framing keeps the dialogue eyeline consistent.
 if(T>=12&&T<30){let child=t<7||t>=11&&t<14.3||t>=18.3;
 if(child){q.drawImage(bg,0,0,bg.width*.72,bg.height*.72,0,0,960,540);let talk=(t>=4&&t<6.7)||(t>=11.4&&t<14)||(t>=18.5&&t<19.8),idx=t>=4&&t<7?(talk&&Math.floor(t*6)%3?2:3):talk&&Math.floor(t*6)%3?1:0;let settle=t<3?Math.max(0,1-(t-2))*15:0;let nod=t>=18.3&&t<19?Math.sin((t-18.3)/.7*Math.PI)*5:0;actor(kid[idx],200,settle+nod,800)}
 else {let talking=t>=8&&t<10.8||t>=14.6&&t<18,blink=t>=9.3&&t<9.46||t>=16.1&&t<16.26;actor(hero[blink?2:talking&&Math.floor(t*6)%3?1:0],-70,-20,800)}
 }
 // Separate, deterministic pixel-petal effect, never painted into a character.
 if(T>=10&&(T<12||T>=30)){q.fillStyle='#f5bfcb';for(let i=0;i<14;i++){let x=(i*137+T*17)%1020-30,y=(i*71+T*(9+i%3))%590-25;q.fillRect(Math.round(x/3)*3,Math.round(y/3)*3,6,3)}}
 if(T>=10&&T<12){q.font='27px JP';q.fillStyle='#fff8e6';q.shadowColor='#202838';q.shadowBlur=4;q.fillText('鬼灯の里',48,65);q.shadowBlur=0;}
 let cap=captions.find(a=>T>=a[0]&&T<a[1]);if(cap){q.fillStyle='#142333eb';q.fillRect(28,438,904,90);q.textAlign='center';q.font='18px JP';q.fillStyle='#f5d8a6';q.fillText(cap[2],480,463);q.font='26px JP';q.fillStyle='#fff9ed';q.fillText(cap[3],480,500);q.textAlign='left';}
 let a=T<.5?1-T/.5:T>31?(T-31):0;if(a){q.fillStyle=`rgba(10,15,25,${a})`;q.fillRect(0,0,960,540)}
 if([2,11,15,19,23,26,29].includes(T))fs.writeFileSync(p+`/frame-${T}.png`,c.toBuffer('image/png'));
 if(!enc.stdin.write(Buffer.from(q.getImageData(0,0,960,540).data)))await new Promise(r=>enc.stdin.once('drain',r));
}enc.stdin.end();await new Promise((r,j)=>enc.on('exit',x=>x?j(x):r()));})();

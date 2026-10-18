// Deterministic offline render using the same browser scene implementation.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
require('../../assets/prologue/scene01/scene.js');
(async()=>{const root=path.resolve(__dirname,'../..'),api=globalThis.KikokuScene01,images={};
 for(const [k,p] of Object.entries(api.paths))images[k]=await loadImage(path.join(root,p));
 const font=process.env.PROLOGUE_FONT||'/tmp/NotoSansCJKjp-Regular.otf';if(!fs.existsSync(font))throw new Error('Set PROLOGUE_FONT to a Japanese font');GlobalFonts.registerFromPath(font,'PrologueJP');
 const baseRender=api.render;api.render=(ctx,...args)=>{const fill=ctx.fillText.bind(ctx);ctx.fillText=(...a)=>{ctx.font=ctx.font.replace('sans-serif','PrologueJP');fill(...a)};baseRender(ctx,...args);ctx.fillText=fill;};
 const out=process.argv[2]||'/tmp/scene01-silent.mp4',c=createCanvas(api.W,api.H),ctx=c.getContext('2d');
 const enc=spawn('ffmpeg',['-y','-v','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${api.W}x${api.H}`,'-framerate','24','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
 for(let i=0;i<api.DURATION*24;i++){api.render(ctx,images,i/24);if(!enc.stdin.write(Buffer.from(ctx.getImageData(0,0,api.W,api.H).data)))await new Promise(r=>enc.stdin.once('drain',r));}
 enc.stdin.end();await new Promise((r,j)=>enc.on('exit',x=>x?j(new Error('ffmpeg '+x)):r()));console.log(out);
 for(const t of [3,9,13,18,23]){api.render(ctx,images,t);fs.writeFileSync(`/tmp/scene01-${t}.png`,c.toBuffer('image/png'));}
})();

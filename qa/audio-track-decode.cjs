// Verify shipped BGM media can actually decode and is not silent.
// This catches broken MP3 references that code-only audio smoke tests miss.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const root=path.resolve(__dirname,'..');
const targets=[
 {name:'field',file:'audio/kikoku-field-v11.mp3',required:72},
 {name:'village',file:'audio/hoozuki-v13.mp3',required:5},
 {name:'battle',file:'audio/kikoku-battle-hybrid-fm-v4.mp3',required:5}
];
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,pathname==='/'?'index.html':pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 const ext=path.extname(file);
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mp3':'audio/mpeg','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');
 res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  for(const target of targets){
   const d=await page.evaluate(async file=>{
    const response=await fetch(file);
    if(!response.ok)throw Error('audio HTTP '+response.status+' '+file);
    const bytes=await response.arrayBuffer();
    const context=new (window.AudioContext||window.webkitAudioContext)();
    const decoded=await context.decodeAudioData(bytes);
    const channel=decoded.getChannelData(0);
    let energy=0,peak=0;
    for(let i=0;i<channel.length;i+=Math.max(1,Math.floor(channel.length/25000))){
     energy+=channel[i]*channel[i];peak=Math.max(peak,Math.abs(channel[i]));
    }
    await context.close();
    return {duration:decoded.duration,channels:decoded.numberOfChannels,sampleRate:decoded.sampleRate,bytes:bytes.byteLength,peak,energy};
   },target.file);
   assert(d.duration>=target.required,target.name+' duration below loop bounds: '+JSON.stringify(d));
   assert(d.peak>0.01&&d.energy>0.5,target.name+' media is inaudible or nearly silent: '+JSON.stringify(d));
   console.log('PASS shipped '+target.name+' mp3 decode '+JSON.stringify(d));
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

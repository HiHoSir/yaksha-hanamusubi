const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/tenyo-main-scene.js','utf8');
function setup(){const images=[];class Image{constructor(){this.complete=false;this.naturalWidth=0;images.push(this)}}const env={Image,console,fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('assets/maps/tenyo/walkability-48x32.json'))})};env.window=env;vm.runInNewContext(source,env);return {scene:env.YK_TENYO,images}}
(async()=>{
 const {scene,images}=setup();let changes=0,ready=false;scene.load(()=>changes++);scene.whenReady().then(()=>ready=true);
 for(const im of images.slice(0,-1)){im.complete=true;im.naturalWidth=1536;im.onload()}
 await Promise.resolve();assert.equal(ready,false,'wait for final foreground PNG');
 const last=images.at(-1);last.complete=true;last.naturalWidth=1536;last.onload();await scene.whenReady();assert.equal(changes,images.length,'all image loads schedule redraw without input');assert.equal(ready,true);
 const broken=setup();broken.scene.whenReady();broken.images.at(-1).onerror();await assert.rejects(broken.scene.whenReady(),/画像を読み込めません/);assert.equal(broken.scene.failed(),true);
 const ctx={save(){},restore(){},setTransform(){},drawImage(){}};let actors=0;
 broken.scene.draw(ctx,{x:564,y:708},()=>actors++,()=>actors++,()=>actors++);assert.equal(actors,4,'one failed cutout cannot permanently hide all actors');
 const game=fs.readFileSync('js/game.js','utf8');
 const wait=game.match(/function waitAreaAssets\(destination,assetState\)\{([\s\S]*?)\n\}/)[0];
 const context={assetLoaded(){},YK_TENYO_NPC:{whenReady:()=>Promise.resolve()},YK_TENYO:{whenReady:()=>Promise.reject(Error('cutout missing'))},IMG:{}};
 vm.runInNewContext(wait+';this.wait=waitAreaAssets;',context);await assert.rejects(context.wait('shrine'),/cutout missing/);
 assert(game.includes('YK_TENYO.load(assetLoaded)'),'main scene connects redraw callback');
 console.log('PASS Tenyo loading: delayed PNG awaited, redraw without input, failed transition rejected, actors retained on error');
})().catch(e=>{console.error(e);process.exit(1)});

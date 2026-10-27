const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom'),{createCanvas,ImageData}=require('@napi-rs/canvas');
const html=fs.readFileSync('pixel-editor.html','utf8');
function boot(ua,coarse){
 const errors=[],surfaces=new WeakMap(),downloads=[];let win;
 const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/pixel-editor.html',virtualConsole,beforeParse(w){win=w;Object.defineProperty(w.navigator,'userAgent',{value:ua});w.matchMedia=()=>({matches:coarse});w.ImageData=ImageData;w.Blob=Blob;w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.confirm=()=>true;
  w.URL.createObjectURL=b=>{downloads.push(b);return 'blob:test'};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
  const surface=el=>{let c=surfaces.get(el);if(!c||c.width!==el.width||c.height!==el.height){c=createCanvas(el.width,el.height);surfaces.set(el,c);}return c;};
  w.HTMLCanvasElement.prototype.getContext=function(){const c=surface(this).getContext('2d');return new Proxy(c,{get(t,k){if(k==='drawImage')return(im,...a)=>t.drawImage(im instanceof w.HTMLCanvasElement?surface(im):im,...a);const v=t[k];return typeof v==='function'?v.bind(t):v;},set(t,k,v){t[k]=v;return true}})};
 }});assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));return {dom,w:win,downloads};
}
(async()=>{
 for(const [name,ua,coarse,touch]of [['iPhone','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',false,true],['Android','Mozilla/5.0 Android',false,true],['iPad','Mozilla/5.0 iPad',false,true],['coarse desktop UA','Mozilla/5.0 Macintosh',true,true],['desktop','Mozilla/5.0 X11',false,false]]){
  const {dom,w}=boot(ua,coarse),d=w.document,mode=d.getElementById('cursorMode'),bar=d.querySelector('.cursorbar');
  if(touch){assert(d.body.classList.contains('touch-workspace'),name);assert(mode.checked,name+' starts in cursor mode');assert(bar.classList.contains('cursor-active'));assert.equal(w.getComputedStyle(d.querySelector('.cursorpad')).display,'grid');
   const toggle=d.getElementById('cursorToggle');assert(toggle,'always-addressable toggle');assert.equal(toggle.getAttribute('aria-pressed'),'true');
   mode.click();assert(!bar.classList.contains('cursor-active'));assert.equal(toggle.getAttribute('aria-pressed'),'false');
   mode.click();assert(bar.classList.contains('cursor-active'));assert.equal(toggle.getAttribute('aria-pressed'),'true');
   toggle.click();assert(!mode.checked);toggle.click();assert(mode.checked);
   d.getElementById('cursorRight').click();assert.equal(d.getElementById('cursorXY').textContent,'（17,16）');
   d.getElementById('cursorUp').click();assert.equal(d.getElementById('cursorXY').textContent,'（17,15）');
  }else assert(!mode.checked,'desktop retains direct drawing');
  dom.window.close();console.log('PASS',name,'cursor initialization, checkbox/button synchronization, arrows');
 }
 // Cursor overlays and movement must never alter imported RGBA.
 const file=process.argv[2];if(file){const source=JSON.parse(fs.readFileSync(file));const {dom,w,downloads}=boot('iPhone',true),d=w.document;
  await d.getElementById('jsonFile').onchange({target:{files:[{text:async()=>JSON.stringify(source)}]}});
  d.getElementById('cursorRight').click();d.getElementById('exportJSON').click();assert.deepEqual(JSON.parse(await downloads.at(-1).text()),source);dom.window.close();console.log('PASS imported JSON remains byte-equivalent RGBA after cursor operations and export');
 }
})().catch(e=>{console.error(e);process.exit(1)});

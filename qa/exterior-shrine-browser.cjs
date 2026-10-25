const fs=require('fs'),path=require('path'),http=require('http'),a=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results/exterior-shrine');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1100},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:'+server.address().port+'/settlement-map-editor.html');
 await page.waitForFunction(()=>document.getElementById('assetCount').textContent==='74 / 74'&&!document.getElementById('exportPng').disabled);
 a.equal(await page.title(),'外観マップツール');
 a.equal(await page.locator('.asset img').evaluateAll(xs=>xs.filter(x=>!x.complete||!x.naturalWidth).length),0);
 for(const [id,x,y]of [['building_jinja',7,3],['komainu_left',6,5],['komainu_right',10,5],['torii',7,10],['temizu',5,8],['stone_lantern',11,8]]){
   await page.locator('[data-asset="'+id+'"]').click();await page.locator('#map').click({position:{x:x*32+16,y:y*32+16}});
 }
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('yaksha.settlementEditor.v1')));
 let m=await saved();a.equal(m.objects.length,6);a.deepEqual(m.objects.find(o=>o.templateId==='torii').occupiedTiles,[[7,10],[9,10]]);
 a(await page.evaluate(()=>!!SMModel.path(JSON.parse(localStorage.getItem('yaksha.settlementEditor.v1')),[8,12],[8,4])));
 const download=async id=>{const p=page.waitForEvent('download');await page.locator(id).click();const d=await p,file=path.join(out,d.suggestedFilename());await d.saveAs(file);return file;};
 const json=await download('#exportJson');await download('#exportPng');
 await page.locator('#new').click();await page.locator('#import').setInputFiles(json);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('yaksha.settlementEditor.v1')).objects.length===6);
 await page.reload();await page.waitForFunction(()=>document.getElementById('assetCount').textContent==='74 / 74'&&!document.getElementById('exportPng').disabled);a.deepEqual(await saved(),m);
 await page.screenshot({path:path.join(out,'editor-desktop.png')});
 await page.setViewportSize({width:393,height:852});await page.locator('[data-open-sheet=palette]').click();await page.locator('[data-asset=temizu]').click();a.equal(await page.locator('body').getAttribute('data-panel'),'');
 await page.screenshot({path:path.join(out,'editor-mobile.png')});a.deepEqual(errors,[]);
 a.deepEqual(await page.evaluate(()=>Object.keys(localStorage).filter(k=>/^yaksha_beta/.test(k))),[]);
 console.log('PASS exterior editor: 74 images, new props, open gate, PNG/JSON export/import/reload, mobile palette, isolated saves.');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

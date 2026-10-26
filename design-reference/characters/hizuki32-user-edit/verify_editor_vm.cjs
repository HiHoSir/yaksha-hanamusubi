const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const {createCanvas,ImageData,Image}=require('@napi-rs/canvas');
const root=__dirname,out=fs.existsSync(path.join(root,'hizuki32-edited.json'))?root:path.join(root,'hizuki32_review');
const html=fs.readFileSync(path.join(root,'reference/pixel-editor.html'),'utf8');
const elements=new Map(),urls=new Map(),downloads=[];
function element(tag='div'){
 const e=tag==='canvas'?createCanvas(32,32):{};
 Object.assign(e,{children:[],style:{},dataset:{},checked:false,value:'0',textContent:'',
 setAttribute(){},addEventListener(){},appendChild(c){this.children.push(c);return c},replaceChildren(){this.children=[]},remove(){},click(){if(this.onclick)this.onclick();if(this.download)downloads.push({name:this.download,blob:urls.get(this.href)})}});
 if(tag==='canvas')e.toBlob=fn=>fn(new Blob([e.toBuffer('image/png')],{type:'image/png'}));
 return e;
}
for(const match of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
 const e=element(match[1]);const width=match[0].match(/width="(\d+)"/),height=match[0].match(/height="(\d+)"/);
 if(width)e.width=+width[1];if(height)e.height=+height[1];elements.set(match[2],e);
}
const document={getElementById:id=>elements.get(id),createElement:element,querySelectorAll:()=>[],body:element()};
const context={document,ImageData,Image,Blob,Uint8ClampedArray,Uint8Array,console,navigator:{userAgent:'headless-source-harness'},matchMedia:()=>({matches:false}),setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},confirm:()=>true,URL:{createObjectURL(blob){const id='blob:'+urls.size;urls.set(id,blob);return id},revokeObjectURL(){}}};
vm.createContext(context);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
(async()=>{
 const target=JSON.parse(fs.readFileSync(path.join(out,'hizuki32-edited.json')));
 await elements.get('jsonFile').onchange({target:{files:[{text:async()=>JSON.stringify(target)}]}});
 assert(elements.get('status').textContent.includes('12コマJSON'));
 for(let d=0;d<4;d++)for(let p=0;p<3;p++){
  elements.get('direction'+d).click();elements.get('pose'+p).click();
  assert.deepStrictEqual(Array.from(elements.get('preview').getContext('2d').getImageData(0,0,32,32).data),target.frames[target.order[d]][p]);
 }
 elements.get('exportJSON').click();elements.get('exportWalk').click();
 assert.deepStrictEqual(JSON.parse(await downloads[0].blob.text()),target);
 fs.writeFileSync(path.join(out,'editor-roundtrip.json'),await downloads[0].blob.text());
 fs.writeFileSync(path.join(out,'editor-roundtrip-atlas.png'),Buffer.from(await downloads[1].blob.arrayBuffer()));
 console.log('PASS: unmodified main pixel-editor.html import handler, 12 preview buffers and export handler preserve every RGBA value; atlas exported for independent PNG comparison. Node VM + native Canvas DOM harness; browser/Safari not tested.');
})().catch(e=>{console.error(e);process.exit(1)});

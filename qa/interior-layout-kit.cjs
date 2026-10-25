// Test the authored raised-shop arrangement against the actual editor movement/draw functions.
const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict'),{createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const html=fs.readFileSync('interior-map-editor.html','utf8'),src=html.match(/<script>([\s\S]*?)<\/script>/)[1],catalog={};vm.createContext(catalog);vm.runInContext(src.slice(src.indexOf('const assets='),src.indexOf('const old='))+';globalThis.catalog=assets;',catalog);
 const assets=Object.fromEntries(catalog.catalog.map(x=>[x.id,x]));const map=JSON.parse(fs.readFileSync('assets/interior-editor/layout-kit-v1/raised-shop-example.json','utf8')),images=new Map();
 a.equal(map.tileSize,32);for(const l of ['floor','structure','object','stairs','collision','elevation'])a.equal(map.layers[l].length,map.width*map.height);
 for(const l of ['floor','structure','object','stairs'])for(const id of new Set(map.layers[l].filter(Boolean))){a(assets[id],'unknown '+id);const path=assets[id].src;if(path&&!images.has(path))images.set(path,await loadImage(path.split('?')[0]));}
 for(const id of ['red_bench_l','red_bench_r','counter_l','counter_r','rail_l','rail_m','rail_r','drawer_upper','drawer_lower']){const im=await loadImage(assets[id].src.split('?')[0]);a.deepEqual([im.width,im.height],[32,32]);const q=createCanvas(32,32).getContext('2d');q.drawImage(im,0,0);const d=q.getImageData(0,0,32,32).data;let visible=false;for(let i=3;i<d.length;i+=4){a(d[i]===0||d[i]===255,id+' alpha');visible ||= d[i]>0;}a(visible,id+' empty');a.equal(assets[id].walk,false);}
 const canvas=createCanvas(32,32);canvas.style={};const ctx=canvas.getContext('2d'),controls={zoom:{value:'1'},coll:{checked:false},grid:{checked:false},heroPreview:{checked:false},summary:{},layer:{value:'object'}};
 const c={canvas,ctx,w:map.width,h:map.height,S:32,data:map.layers,$:id=>controls[id],byId:()=>assets,getImage:x=>images.get(x?.src),selectedCell:null,heroPos:null,fallback:(x,px,py)=>{a.equal(x.id,'outside_black');ctx.fillStyle='#000';ctx.fillRect(px,py,32,32)}};vm.createContext(c);vm.runInContext(src.slice(src.indexOf('function drawHearthFire'),src.indexOf('function migrateStairs')),c);
 const start=map.layers.spawn,seen=new Set([start.join(',')]),q=[start];for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const xx=x+dx,yy=y+dy,k=xx+','+yy;if(!seen.has(k)&&c.canStep(x,y,xx,yy)){seen.add(k);q.push([xx,yy])}}}
 for(const p of [[7,12],[3,7],[3,6],[3,5],[3,3],[6,4],[6,7],[9,4],[9,7]])a(seen.has(p.join(',')),'unreachable entrance/stair/counter/bench approach '+p);
 a.equal(c.canStep(3,7,3,6),true);a.equal(c.canStep(3,6,3,7),true);a.equal(c.canStep(6,5,5,5),false,'no sideways height crossing');
 const roundtrip=JSON.parse(JSON.stringify(map));a.deepEqual(roundtrip,map);
 const markers={spawn:c.data.spawn,exits:c.data.exits};c.data.spawn=null;c.data.exits=[];c.draw();Object.assign(c.data,markers);
 const hero=await loadImage('assets/characters/hizuki/field-sd-v2/walk-atlas-32.png');ctx.drawImage(hero,0,0,32,32,7*32,9*32,32,32);
 fs.writeFileSync('/tmp/interior-raised-shop-native.png',canvas.toBuffer('image/png'));
 console.log('PASS: kit PNGs and binary alpha, registered IDs, JSON roundtrip, raised-corner route from entry through stairs to both sides of counter and all bench approaches, native editor draw without placeholder furniture');
})().catch(e=>{console.error(e);process.exitCode=1});

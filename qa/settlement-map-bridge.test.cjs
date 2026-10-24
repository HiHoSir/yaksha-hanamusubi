const test=require('node:test'),a=require('node:assert/strict'),M=require('../js/settlement-map/model.js'),C=require('../js/settlement-map/catalog.js');
const bridges=m=>m.objects.filter(o=>o.templateId==='auto_bridge');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
test('vertical straight bridge rotates the complete horizontal tile, including cell boundaries',async()=>{const im=await loadImage(__dirname+'/../'+C.byId.auto_bridge.src),c=createCanvas(256,96).getContext('2d');c.drawImage(im,0,0);const h=c.getImageData(0,0,32,32).data,v=c.getImageData(0,64,32,32).data;for(let y=0;y<32;y++)for(let x=0;x<32;x++)for(let k=0;k<4;k++)a.equal(v[(y*32+x)*4+k],h[((31-x)*32+y)*4+k],'whole-tile rotation at '+x+','+y);});
test('bridge atlas has 17 exact RGBA cells and every joined edge matches',async()=>{
 const im=await loadImage(__dirname+'/../'+C.byId.auto_bridge.src);a.equal(im.width,256);a.equal(im.height,96);
 const c=createCanvas(256,96).getContext('2d');c.drawImage(im,0,0);const p=c.getImageData(0,0,256,96).data;
 const pixel=(i,x,y)=>[...p.slice(((Math.floor(i/8)*32+y)*256+i%8*32+x)*4,((Math.floor(i/8)*32+y)*256+i%8*32+x)*4+4)];
 for(let i=0;i<17;i++){let opaque=0,clear=0;for(let y=0;y<32;y++)for(let x=0;x<32;x++){const alpha=pixel(i,x,y)[3];a(alpha===0||alpha===255);if(alpha)opaque++;else clear++;}a(opaque>0);a(clear>0);}
 for(let i=0;i<16;i++)for(let j=0;j<16;j++)for(let k=0;k<32;k++){
  if((i&2)&&(j&8))a.deepEqual(pixel(i,31,k),pixel(j,0,k),'horizontal '+i+','+j);
  if((i&4)&&(j&1))a.deepEqual(pixel(i,k,31),pixel(j,k,0),'vertical '+i+','+j);
 }
});
test('one bridge cell opens exactly one water cell; deleting only bridges restores the river',()=>{
 let m=M.paintCells(M.createMap(5,5),'auto_river',[[2,0],[2,1],[2,2],[2,3],[2,4]]);
 a.equal(M.path(m,[0,2],[4,2]),null);
 m=M.paintCells(m,'auto_bridge',[[2,2]]);
 a.deepEqual(C.byId.auto_bridge.displayCells,[1,1]);a.deepEqual(M.visualRect(m,bridges(m)[0]),{x:64,y:64,width:32,height:32});
 a(M.path(m,[0,2],[4,2]));a(M.collision(m).has('2,1'));a(M.collision(m).has('2,3'));
 a.equal(M.autotileLayout(m).get(bridges(m)[0].id),0);
 m=M.paintCells(m,'eraseBridge',[[2,2]]);a.equal(bridges(m).length,0);a.equal(m.objects.length,5);a.equal(M.path(m,[0,2],[4,2]),null);
});
test('single bridge chooses its orientation from river; neighboring bridge cells form corners and junctions',()=>{
 let m=M.paintCells(M.createMap(7,7),'auto_river',[[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3]]);
 m=M.paintCells(m,'auto_bridge',[[3,3]]);a.equal(M.autotileLayout(m).get(bridges(m)[0].id),16);a(M.path(m,[3,0],[3,6]));
 m=M.paintCells(m,'auto_bridge',[[3,2],[3,4],[4,3]]);const center=bridges(m).find(o=>o.y===3&&o.x===3);a.equal(M.autotileLayout(m).get(center.id),7);
 m=M.paintCells(m,'auto_bridge',[[2,3]]);a.equal(M.autotileLayout(m).get(center.id),15);
 m=M.paintCells(m,'eraseBridge',[[3,4],[2,3]]);a.equal(M.autotileLayout(m).get(center.id),3);
 a.deepEqual(M.parse(M.serialize(m)),m);
});
test('bridge brush never duplicates cells and does not remove underlying water or override walls and objects',()=>{
 let m=M.paintCells(M.createMap(),'auto_river',[[3,3],[4,3]]);m=M.paintCells(m,'auto_bridge',[[3,3],[4,3],[3,3]]);a.equal(m.objects.length,4);
 m.terrainBlocks=[[3,3]];a(M.collision(m).has('3,3'));a(!M.collision(m).has('4,3'));
 let dry=M.place(M.createMap(),'well',3,3);dry=M.paintCells(dry,'auto_bridge',[[3,3]]);a(M.collision(dry).has('3,3'));
 const b=bridges(m).find(o=>o.x===4);m=M.move(m,b.id,5,3);a(M.collision(m).has('4,3'));
 a.equal(C.byId.bridge.displayCells[0],2);a(C.byId.bridge.hidden);a(C.byId.bridge_vertical.hidden);
});

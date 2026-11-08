// Dedicated 80x112 walk atlas contract: 32px collision grid is not changed.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const p=path.join(root,"assets/characters/hizuki/hana-20261107/walk/walk-atlas-80x112.png");
const b=fs.readFileSync(p);
assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a","PNG signature");
assert.equal(b.readUInt32BE(16),240);assert.equal(b.readUInt32BE(20),448);
assert.equal(b[25],6,"must be true RGBA PNG");
const calls=[];
globalThis.Image=class FakeImage{
 constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;this.onload=null;}
 set src(p){this.path=p;this.complete=true;this.naturalWidth=240;this.naturalHeight=448;this.onload?.();}
 get src(){return this.path;}
};
const atlas=require("../js/hizuki-hana-walk.js");
assert.equal(atlas.ready(),false);
assert.equal(atlas.ensure(),false);
assert.equal(atlas.ready(),true);
assert(atlas.PATH.endsWith("/walk-atlas-80x112.png"));
for(const [dir,row] of Object.entries({d:0,u:1,r:2,l:3})){
 for(const [frame,col] of [[1,0],[0,1],[2,2]]){
  const c={imageSmoothingEnabled:true,save(){},restore(){},drawImage(...a){calls.push(a)}};
  const foot=125,x=80;
  assert(atlas.draw(c,x,foot,dir,frame,48));
  const a=calls.at(-1),scale=48/[99,100,97,97][row];
  assert.equal(a[1],col*80);assert.equal(a[2],row*112);
  assert.deepEqual(a.slice(3,5),[80,112]);
  assert(Math.abs(a[5]+40*scale-x)<1e-6,"x aligned to foot anchor");
  assert(Math.abs(a[6]+106*scale-foot)<1e-6,"boots aligned to foot anchor");
  assert(Math.abs(a[7]-80*scale)<1e-6);assert(Math.abs(a[8]-112*scale)<1e-6);
  assert.equal(c.imageSmoothingEnabled,false,"nearest-neighbor walk art");
 }
}
assert.equal(calls.length,12);
// Prove the preview highlight shares the exact source-cell mapping used by
// draw(), including the third column of the bottom two directional rows.
for(const [dir,row] of [["r",2],["l",3]]){
 for(const [frame,col] of [[1,0],[0,1],[2,2]]){
  const cell=atlas.sourceCell(dir,frame);
  assert.deepEqual([cell.x,cell.y,cell.w,cell.h],[col*80,row*112,80,112],
   dir+" "+frame+" crop coordinates");
  const marks=[];
  const c={save(){},restore(){},clearRect(){},fillRect(){},drawImage(...args){marks.push(args);},
   strokeRect(...args){marks.push(["outline",...args]);}};
  const selected=atlas.drawSourceProof(c,dir,frame);
  assert.deepEqual([selected.row,selected.col],[row,col]);
  const draw=marks.find(x=>x.length===9);
  assert(draw&&draw[2]===row*112,"full direction row drawn");
  const stroke=marks.find(x=>x[0]==="outline");
  assert(stroke&&stroke[1]===col*80+1.5,"yellow source highlight selects same column");
 }
}

const game=fs.readFileSync(path.join(root,"js/game.js"),"utf8");
const village=fs.readFileSync(path.join(root,"js/hozuki-village-game.js"),"utf8");
const interior=fs.readFileSync(path.join(root,"js/interior-maps.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
assert(game.includes('hizukiArt==="hana"&&typeof YK_HANA_WALK!=="undefined"&&YK_HANA_WALK.ready()'),"real field artist switch");
assert(game.includes('hizukiArt==="hana");return;'),"real village/interior switches");
assert(village.includes('host.YK_HANA_WALK.draw(wc,'),"village uses shared renderer");
assert(interior.includes('host.YK_HANA_WALK.draw(c,'),"interior uses shared renderer");
assert(html.includes('<option value="hana">'),"user setting exists");
assert(html.includes('js/hizuki-hana-walk.js'),"shared module loaded");
assert(game.includes('localStorage.setItem(HANA_WALK_SETTING,hizukiArt)'),"selection persists");
assert(game.includes('S.frame=hizukiArt==="hana"?(walkPhase%2?0:2):[1,0,1,2][walkPhase]'),
 "Hana uses A/B without idle; legacy retains A/idle/B/idle");
console.log("Hana walking PASS: 240x448 RGBA, 12 frames, feet, draw sizing, field/village/interior toggle and persistence");

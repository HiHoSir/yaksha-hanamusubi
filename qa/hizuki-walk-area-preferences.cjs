// Exercise the actual area-specific walking-skin selection code, not a reimplementation.
// Safe for CI: no save-game files, browser or network access.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const js=fs.readFileSync(path.join(root,"js/game.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
function section(from,to){
 const a=js.indexOf(from),b=js.indexOf(to,a+from.length);
 assert(a>=0&&b>a,"missing code section: "+from);
 return js.slice(a,b);
}
const definitions=section('const HANA_WALK_FIELD_SETTING=', '// Approved coarse pixel-art battle-only idle artwork;');
const ui=section('const heroArtSelect=$("heroArtSelect");','const npcArtSelect=$("npcArtSelect");');
assert.match(html,/<select id="fieldHeroArtSelect"/);
assert.match(html,/<select id="heroArtSelect"/);
assert.match(js,/S.frame=currentHizukiArt\(\)==="hana"\?/);
assert.match(js,/if\(fieldMotion&&currentHizukiArt\(\)==="hana"/);
let mapCalls=0,titleCalls=0;
function build(search="",initial={}){
 const store=new Map(Object.entries(initial)),elements=new Map();
 const loadCalls=[];
 const location={href:"https://game.test/index.html"+search};
 const history={replaceState(_state,_title,url){location.href=new URL(url,location.href).href;}};
 const localStorage={
  getItem(k){return store.has(k)?store.get(k):null;},
  setItem(k,v){store.set(k,v);}
 };
 const $=id=>{
  if(!elements.has(id))elements.set(id,{
   value:"",events:{},addEventListener(type,callback){this.events[type]=callback;},
   change(value){this.value=value;assert(this.events.change);this.events.change();}
  });
  return elements.get(id);
 };
 const S={area:"field"};
 const context={S,charSizeParams:new URLSearchParams(search),localStorage,$,location,history,
  URL,YK_HANA_WALK:{ensure(callback){loadCalls.push("hana");return true;}},
  assetLoaded(){},map(){mapCalls++;},titleHero(){titleCalls++;},console};
 vm.runInNewContext(definitions+ui+
  '\nthis.qa={get:currentHizukiArt,select:persistHeroAreaChoice};',context);
 return {S,get:context.qa.get,select:context.qa.select,$,store,loadCalls,location};
}
// No settings: SD world/field, new Hana village + all indoor and shrine maps.
const a=build();
assert.equal(a.get(),"sd","default field=SD");
for(const area of ["village","shrine","teahouse","inn","interior-house"]){
 a.S.area=area;assert.equal(a.get(),"hana",area+" starts with new Hana");
}
a.S.area="debugField";assert.equal(a.get(),"sd");
a.S.area="field";
// Switching field never mutates village.
a.$("fieldHeroArtSelect").change("hana");
assert.equal(a.get(),"hana");
a.S.area="village";assert.equal(a.get(),"hana");
assert.equal(a.store.get("yaksha_hana_walk_field_variant_v1"),"hana");
a.$("heroArtSelect").change("sd");
assert.equal(a.get(),"sd");
a.S.area="field";assert.equal(a.get(),"hana");
assert.equal(a.store.get("yaksha_hana_walk_settlement_variant_v1"),"sd");
assert.equal(new URL(a.location.href).searchParams.get("fieldHeroArt"),"hana");
assert.equal(new URL(a.location.href).searchParams.get("settlementHeroArt"),"sd");
assert.equal(a.store.has("yaksha_hana_walk_variant_v1"),false,"leave prior legacy preference alone");
assert.equal(a.store.has("YK_SAVE"),false,"do not touch game save");
assert(a.loadCalls.length>=1,"Hana asset is still prefetched");
assert(mapCalls>1&&titleCalls>1,"both art switches redraw UI");
const reload=build("",Object.fromEntries(a.store));
assert.equal(reload.get(),"hana","field preference restored");
reload.S.area="village";assert.equal(reload.get(),"sd","settlement preference restored");
const invalid=build("?fieldHeroArt=oops&settlementHeroArt=legacy");
assert.equal(invalid.get(),"sd","invalid field URL falls back to SD");
invalid.S.area="village";assert.equal(invalid.get(),"hana","unsupported settlement value falls back to Hana");
const explicit=build("?fieldHeroArt=hana&settlementHeroArt=sd");
assert.equal(explicit.get(),"hana","valid field override");
explicit.S.area="shrine";assert.equal(explicit.get(),"sd","valid settlement override also applies to shrine");
const oldLink=build("?heroArt=hana");
assert.equal(oldLink.get(),"hana","old global test links still work when explicitly used");
oldLink.S.area="village";assert.equal(oldLink.get(),"hana","old explicit global test link works in village");
console.log("PASS independent art switches: defaults field SD, village/interior/shrine Hana, persisted independently, URL overrides, legacy link, old saves untouched");

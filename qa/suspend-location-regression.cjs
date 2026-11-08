// Regression: title "中断から再開" must restore the precise field position.
// Test an actual game runtime, storage, and the resume button, not just strings.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const boot=require("./helpers/hozuki-game-runtime.cjs");
const source=fs.readFileSync("js/game.js","utf8");
assert(source.includes("py-9*spriteScale*characterScale()")&&!source.includes("const fieldFootOffset="),
 "field boots use projected terrain contact for every sprite, without per-skin offset");
assert(!source.includes("if(S.walk%10===0)YK_SAVE.auto(S)"),
 "successful grid steps must no longer leave stale ten-step autosaves");
assert(source.includes("hud(!fieldStyle);\n // Every successful atomic tile move"),
 "checkpoint follows completed movement, not a frame or sprite flip");
assert(source.includes("restoreState(saved,false); // Reading a checkpoint"),
 "title suspension must restore without immediately overwriting the source");
async function actualGame(){
 const b=await boot();
 try{
  const w=b.w,local=w.localStorage;
  assert(w.document.getElementById("title").classList.contains("show"),
   "the game must start on the title, without an active checkpoint");
  const snapshot=b.eval(`(()=>{
   const fresh=YK_SAVE.fresh(),point=YK_WORLD.safePosition([YK_WORLD.start[0],YK_WORLD.start[1]]);
   fresh.area="field";fresh.x=point[0];fresh.y=point[1];
   fresh.worldPosition=point.slice();fresh.worldRevision=YK_WORLD.revision;
   fresh.gold=777;fresh.quest=2;fresh.encounterGrace=9999;
   if(!YK_SAVE.auto(fresh))throw Error("seed checkpoint failed");
   return {x:fresh.x,y:fresh.y};
  })()`);
  const slot={area:"field",x:1408,y:1808,quest:3,gold:999,lastSave:123};
  local.setItem("yaksha_beta_slot1",JSON.stringify(slot));
  const original=local.getItem("yaksha_beta_auto");
  w.document.getElementById("resumeSuspend").click();
  await b.pump(100);
  assert(!w.document.getElementById("title").classList.contains("show"),
   "tap on actual suspension button resumes active gameplay");
  assert.equal(w.gameState.area,"field");
  assert.deepEqual([w.gameState.x,w.gameState.y],[snapshot.x,snapshot.y],
   "saved field grid position survives title resume, not reset to Hozuki village");
  assert.equal(w.gameState.gold,777);
  assert.equal(w.gameState.quest,2);
  assert.equal(local.getItem("yaksha_beta_auto"),original,
   "reading a suspension cannot overwrite its own saved source");

  const moved=b.eval(`(()=>{
   const opts=[[1,0,"r"],[-1,0,"l"],[0,1,"d"],[0,-1,"u"]];
   const allowed=opts.find(([dx,dy])=>{
    const x=S.x+dx*32,y=S.y+dy*32;
    return YK_WORLD.canMove(S.x,S.y,x,y)
       &&!YK_AREA_TRANSITIONS.contact(YK_WORLD,x,y)&&!YK_WORLD.restStopAt(x,y);
   });
   if(!allowed)throw Error("no safe neighboring field tile");
   const [dx,dy,dir]=allowed;
   move(dx,dy,dir);
   return {area:S.area,x:S.x,y:S.y};
  })()`);
  assert.equal(moved.area,"field");
  assert.notDeepEqual([moved.x,moved.y],[snapshot.x,snapshot.y],
   "the test must perform an actual grid move");
  const checkpoint=JSON.parse(local.getItem("yaksha_beta_auto"));
  assert.deepEqual([checkpoint.x,checkpoint.y],[moved.x,moved.y],
   "every successful move writes the new field location immediately");
  assert.equal(checkpoint.area,"field");
  assert.equal(checkpoint.quest,2);
  assert.equal(checkpoint.gold,777);
  assert.deepEqual(JSON.parse(local.getItem("yaksha_beta_auto_backup")).worldPosition,
   JSON.parse(original).worldPosition,"backup retains original state");
  assert.equal(local.getItem("yaksha_beta_slot1"),JSON.stringify(slot),
   "manual slot is unchanged by automated movement checkpoints");
  const savedMove=local.getItem("yaksha_beta_auto");
  w.dispatchEvent(new w.Event("pagehide"));
  assert.equal(JSON.parse(local.getItem("yaksha_beta_auto")).x,moved.x,
   "Safari pagehide flush preserves active position");
  assert.equal(local.getItem("yaksha_beta_slot1"),JSON.stringify(slot));
  w.document.getElementById("title").classList.add("show");
  const titleCheckpoint=local.getItem("yaksha_beta_auto");
  w.dispatchEvent(new w.Event("pagehide"));
  assert.equal(local.getItem("yaksha_beta_auto"),titleCheckpoint,
   "hidden title cannot overwrite a valid field checkpoint");
  assert(!b.errors.length,"unexpected browser errors: "+b.errors.join("; "));
 }finally{b.close();}
}
function missingWorldShouldNotClamp(){
 // Simulate the rare startup race with the world module not yet loaded.
 const start=source.indexOf("function restoreState(v,persist=true){"),
  end=source.indexOf("// On iPhone Safari",start);
 assert(start>=0&&end>start);
 let state={},saved=0,stabilized=0;
 const env={
  state(v){state=v;env.S=v;},
  S:state,
  preferredSound:()=>true,
  YK_DESTINATION_SCENES:{blocked:()=>false},
  YK_SAVE:{auto(){saved++;}},
  stabilizeLoadedState(){stabilized++;}
 };
 vm.createContext(env);
 vm.runInContext(source.slice(start,end),env);
 const raw={area:"field",x:1392,y:2256,worldPosition:[1392,2256],
  hp:20,maxhp:70,sound:true};
 env.restoreState(raw,false);
 assert.deepEqual([env.S.x,env.S.y],[1392,2256],
  "unloaded world may not clamp a real 2560px field coordinate to 768px");
 assert.equal(saved,0);assert.equal(stabilized,0);
}
(async()=>{
 missingWorldShouldNotClamp();
 await actualGame();
 console.log("PASS title suspension restores field location, tile-level checkpoint and backup, pagehide, title guard, save slots and terrain-contact anchor");
})().catch(e=>{console.error(e);process.exitCode=1});

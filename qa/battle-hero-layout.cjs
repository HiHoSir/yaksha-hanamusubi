// Visual contract for the central foreground Hana battle heroine.
// HUD is allowed to cover the lower legs; it must not block touch commands.
module.exports=async function checkHero(page,assert){
 const originalViewport=page.viewportSize();
 const poses=[
  ["idle","battle-idle-512.png"],["attack","battle-attack-512.png"],
  ["skill","battle-skill-512.png"],["guard","battle-guard-512.png"],
  ["hit","battle-hit-512.png"],["victory","battle-victory-512.png"],
  ["levelup","level-up.png"]
 ];
 await page.evaluate(()=>{window.__qaEval('setBattleHizukiVariant("hana20261107")');window.__heroQaNow=performance.now.bind(performance);
  const now=performance.now();Object.defineProperty(performance,"now",{configurable:true,value:()=>now});
  window.__qaEval("resetBattleAnimation()");});
 try{
  for(const size of [
   {width:393,height:852},{width:375,height:667},{width:320,height:568},
   {width:852,height:393},{width:667,height:375}
  ]){
   await page.setViewportSize(size);
   for(const safe of [null,size.width>size.height?[8,69,29,69]:[67,10,42,10]]){
    await page.locator("#battle").evaluate((e,p)=>{e.style.padding=p?p.map(n=>n+"px").join(" "):"";},safe);
    for(const [pose,file] of poses){
     await page.evaluate(pose=>window.__qaEval(`battle.phase=${JSON.stringify(pose==="victory"||pose==="levelup"?"result":"command")};battle.menu="root";battle.levelUpResult=${pose==="levelup"};battleLocked=false;battlePose=${JSON.stringify(pose==="levelup"?"victory":pose)};battleFx=null;renderBattle();`),pose);
     await page.waitForFunction(file=>{const img=document.getElementById("battleHeroOverlay");return img&&img.complete&&img.naturalWidth>0&&img.src.includes("/"+file);},file);
     const actual=await page.locator("#battleHeroOverlay").evaluate(el=>{
      const r=el.getBoundingClientRect(),s=getComputedStyle(el),panel=document.getElementById("battle").getBoundingClientRect();
      return {x:r.x,y:r.y,w:r.width,h:r.height,cx:r.x+r.width/2,
       targetCx:panel.x+panel.width*(panel.width>panel.height?.36:.22),
       naturalW:el.naturalWidth,naturalH:el.naturalHeight,position:s.position,fit:s.objectFit,visible:s.visibility};
     });
     assert.equal(actual.position,"absolute","actor must be independent of HUD");
     assert.equal(actual.visible,"visible","actor hidden "+pose);
     assert.equal(await page.locator("#battle").evaluate(e=>getComputedStyle(e).display),"flex","battle flex layout");
     if(pose!=="levelup"){
      assert.equal(actual.naturalW,512,"approved 512px source "+pose);
      assert.equal(actual.naturalH,384,"approved 384px source "+pose);
      // The source PNG includes substantial transparent padding. Its IMAGE
      // frame anchors to 22% (portrait) / 36% (landscape), which visually
      // places the occupied sprite at approx. 36% / 42% respectively.
      assert(Math.abs(actual.cx-actual.targetCx)<8,"hero left foreground anchor shifted "+JSON.stringify({size,safe,pose,actual}));
      const silhouette=await page.locator("#battleHeroOverlay").evaluate(a=>{
       const p=document.getElementById("battle").getBoundingClientRect(),r=a.getBoundingClientRect();
       const c=document.createElement("canvas");c.width=a.naturalWidth;c.height=a.naturalHeight;
       const ctx=c.getContext("2d");ctx.drawImage(a,0,0);
       const d=ctx.getImageData(0,0,c.width,c.height).data;
       let minX=c.width,maxX=-1,minY=c.height;
       for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
        if(d[(y*c.width+x)*4+3]>=16){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);}
       }
       return {left:r.left+(minX/c.width)*r.width-p.left,
        right:r.left+((maxX+1)/c.width)*r.width-p.left,
        head:r.top+(minY/c.height)*r.height-p.top,screenWidth:p.width,screenHeight:p.height};
      });
      assert(silhouette.left>=-2&&silhouette.right<=silhouette.screenWidth+2,
       "approved sprite is horizontally clipped "+JSON.stringify({size,safe,pose,silhouette}));
      assert(silhouette.head>=-2&&silhouette.head<silhouette.screenHeight*.83,
       "hero head clipped/hidden "+JSON.stringify({size,safe,pose,silhouette}));
      assert(actual.y>=-8,"actor head clipped "+pose);
     }
     if(pose==="idle"){
      const status=page.locator("#battlePartyCards .battlePartyCard:not(.is-empty)");
      assert.equal(await status.count(),1,"solo heroine status only");
      assert.equal(await page.locator("#battlePartyCards .battlePartyCard.is-empty:visible").count(),0,"old party placeholders visible");
     }
     if(pose==="victory"){
      const alpha=await page.locator("#battleHeroOverlay").evaluate(a=>{
       const c=document.createElement("canvas");c.width=a.naturalWidth;c.height=a.naturalHeight;
       const x=c.getContext("2d");x.drawImage(a,0,0);
       const d=x.getImageData(0,0,c.width,c.height).data;
       let clear=0,filled=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)clear++;else if(d[i]>16)filled++;}
       return {clear,filled};
      });
      assert(alpha.clear>20000&&alpha.filled>5000,"victory sprite must use transparent RGBA");
     }
     if(safe&&size.width===393&&["idle","victory"].includes(pose))
      await page.screenshot({path:require("path").join(__dirname,`results/autotile/hana-${pose}-393.png`)});
    }
   }
  }
  // Functional switch uses the same production state and actor rendering path.
  await page.evaluate(()=>window.__qaEval('battle.levelUpResult=false;battlePose="victory";renderBattle();'));
  await page.locator("#battleHizukiLiveSelect").selectOption("legacy");
  await page.waitForFunction(()=>document.getElementById("battleHeroOverlay").src.includes("/battle-expressions-v2/victory-full.png"));
  assert.equal(await page.locator("#battleHizukiSelect").inputValue(),"legacy","settings control synced");
  assert.equal(await page.evaluate(()=>localStorage.getItem("yaksha_battle_hizuki_variant_v1")),"legacy","choice persisted separately from saves");
  assert.equal(await page.evaluate(()=>new URL(location.href).searchParams.get("battleHizuki")),"legacy","URL switch synced");
  await page.evaluate(()=>window.__qaEval('battle.phase="command";battle.menu="root";battle.levelUpResult=false;battlePose="idle";battleFx=null;renderBattle();'));
  await page.waitForFunction(()=>document.getElementById("battleHeroOverlay").src.includes("/battle-v2/hizuki_battle_idle_approved.png"));
  assert(await page.locator("#battleHeroOverlay").evaluate(a=>a.classList.contains("battleHeroLegacy")),"legacy CSS style applied");
  await page.evaluate(()=>window.__qaEval('battlePose="attack";battleFx={kind:"slash",target:"enemy",start:performance.now()-550,duration:1100,impactDelay:600,amount:null};renderBattle();'));
  await page.waitForFunction(()=>document.getElementById("battleHeroOverlay").src.includes("/battle-attack-v1/attack-02.png"));
  await page.evaluate(()=>window.__qaEval('battlePose="skill";battleFx={kind:"petals",target:"enemy",start:performance.now()-550,duration:1100,impactDelay:600,amount:null};renderBattle();'));
  await page.waitForFunction(()=>document.getElementById("battleHeroOverlay").src.includes("/battle-skill-v1/skill-02.PNG"));
  await page.locator("#battleHizukiLiveSelect").selectOption("hana20261107");
  await page.waitForFunction(()=>document.getElementById("battleHeroOverlay").src.includes("/battle-skill-512.png"));
  assert.equal(await page.locator("#battleHizukiSelect").inputValue(),"hana20261107","new setting synced");
  assert(!(await page.locator("#battleHeroOverlay").evaluate(a=>a.classList.contains("battleHeroLegacy"))),"new style restored");
  console.log("PASS legacy/new live switching, attack/skill legacy frames, settings synchronization, URL and preference");
  console.log("PASS Hana six poses + levelup: left foreground (portrait 22%, landscape 36% image anchor), no clipping, safe areas");
  await page.evaluate(()=>{Object.defineProperty(performance,"now",{configurable:true,value:window.__heroQaNow});
   window.__qaEval('resetBattleAnimation();battle.phase="command";battle.menu="root";battleLocked=false;battle.levelUpResult=false;battle.hp=battle.max=99999;battle.rareTrait=null;battlePose="idle";renderBattle();');
   window.__heroObserved=[];
   window.__heroObserver=new MutationObserver(()=>window.__heroObserved.push(document.getElementById("battleHeroOverlay").src.split("/").pop().split("?")[0]));
   window.__heroObserver.observe(document.getElementById("battleHeroOverlay"),{attributes:true,attributeFilter:["src"]});
   window.__qaEval('cmd("attack");cmd("target-0");');
  });
  await page.waitForFunction(()=>window.__heroObserved.includes("battle-attack-512.png")&&window.__qaEval('battlePose==="idle"'));
  await page.evaluate(()=>{window.__heroObserver.disconnect();delete window.__heroObserver;delete window.__heroObserved;});
  console.log("PASS live attack: accepted attack sprite appears, then returns to idle");
 }finally{
  await page.evaluate(()=>{Object.defineProperty(performance,"now",{configurable:true,value:window.__heroQaNow});delete window.__heroQaNow;window.__qaEval("resetBattleAnimation();battleLocked=false;");});
  await page.locator("#battle").evaluate(e=>e.style.padding="");
  await page.setViewportSize(originalViewport);
 }
};

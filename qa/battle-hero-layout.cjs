// Exercise the production renderBattle() frame selection and the painted image
// rectangle, including object-fit padding, instead of merely checking CSS classes.
module.exports=async function checkHero(page,assert){
 const originalViewport=page.viewportSize();
 const poses=[['idle',0,'hizuki_battle_idle_approved.png'],['attack',0,'attack-01.png'],['attack',550,'attack-02.png'],['attack',650,'attack-03.png'],['skill',0,'skill-01.PNG'],['skill',550,'skill-02.PNG'],['skill',650,'skill-03.png'],['victory',0,'battle-end.png'],['levelup',0,'level-up.png']];
 await page.evaluate(()=>{window.__heroQaNow=performance.now.bind(performance);const now=performance.now();Object.defineProperty(performance,'now',{configurable:true,value:()=>now});window.__qaEval('resetBattleAnimation()');});
 try{for(const size of [{width:393,height:852},{width:375,height:667},{width:320,height:568},{width:852,height:393},{width:667,height:375}]){
  await page.setViewportSize(size);
  for(const safe of [null,size.width>size.height?[8,69,29,69]:[67,10,42,10]]){
   await page.locator('#battle').evaluate((e,p)=>{e.style.padding=p?p.map(n=>n+'px').join(' '):'';},safe);
   for(const [pose,elapsed,file] of poses){
    await page.evaluate(({pose,elapsed})=>window.__qaEval(`battle.phase=${JSON.stringify(['victory','levelup'].includes(pose)?'result':'command')};battle.menu='root';battle.levelUpResult=${pose==='levelup'};battleLocked=${['attack','skill'].includes(pose)};battlePose=${JSON.stringify(pose==='levelup'?'victory':pose)};battleFx=${['attack','skill'].includes(pose)?`{kind:'${pose==='attack'?'slash':'petals'}',target:'enemy',start:performance.now()-${elapsed},duration:1100,impactDelay:600}`:'null'};renderBattle();`),{pose,elapsed});
    await page.waitForFunction(file=>{const a=document.getElementById('battleHeroOverlay');return a.complete&&a.naturalWidth>0&&a.src.includes('/'+file);},file);
    const g=await page.evaluate(()=>{
     const e=document.getElementById('battle'),a=document.getElementById('battleHeroOverlay'),r=a.getBoundingClientRect(),p=getComputedStyle(e),s=getComputedStyle(a),m=new DOMMatrix(s.transform),scale=Math.abs(m.a),box=e.getBoundingClientRect();
     const pl=parseFloat(s.paddingLeft)*scale,pr=parseFloat(s.paddingRight)*scale,pt=parseFloat(s.paddingTop)*scale,pb=parseFloat(s.paddingBottom)*scale;
     const w=r.width-pl-pr,h=r.height-pt-pb,fit=Math.min(w/a.naturalWidth,h/a.naturalHeight),iw=a.naturalWidth*fit,ih=a.naturalHeight*fit;
     // Production object-position is left bottom. Track the actual contained
     // artwork, not the whole img box whose transparent gutters may move.
     return {left:r.left+pl,top:r.top+pt+h-ih,right:r.left+pl+iw,bottom:r.bottom-pb,width:iw,height:ih,heading:e.querySelector('.battleTop').getBoundingClientRect().bottom,footer:e.querySelector('.battlePartyCards').getBoundingClientRect().top,safeLeft:box.left+parseFloat(p.paddingLeft),safeRight:box.right-parseFloat(p.paddingRight),visibility:s.visibility};
    });
    const label=JSON.stringify({size,safe,pose,elapsed,g});
    assert(g.width>0&&g.height>0&&g.visibility==='visible','pose not displayed '+label);
    assert(g.top>=g.heading,'pose hidden by heading '+label);
    assert(g.bottom<=g.footer,'pose hidden by HUD '+label);
    assert(g.left>=g.safeLeft&&g.right<=g.safeRight,'pose outside side safe areas '+label);
    if(safe&&size.width===393&&['attack','victory'].includes(pose))await page.screenshot({path:require('path').join(__dirname,`results/autotile/hero-${pose}-${elapsed}.png`)});
   }
  }
 }
 console.log('PASS all 3 attack frames, all 3 skill frames, idle, victory and level-up: 5 viewports x safe areas on/off');
 }finally{
  await page.evaluate(()=>{Object.defineProperty(performance,'now',{configurable:true,value:window.__heroQaNow});delete window.__heroQaNow;window.__qaEval('resetBattleAnimation();battleLocked=false;');});
  await page.locator('#battle').evaluate(e=>e.style.padding='');await page.setViewportSize(originalViewport);
 }
};

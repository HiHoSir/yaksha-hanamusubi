// Called by battle-layout.cjs in a real browser. This checks the displayed image
// box, including its bottom edge, rather than only checking result-state classes.
module.exports=async function checkVictory(page,assert){
 await page.evaluate(()=>window.__qaEval('battle.phase="result";battle.levelUpResult=false;battlePose="victory";battleLocked=false;renderBattle();'));
 await page.waitForFunction(()=>{const a=document.getElementById('battleHeroOverlay');return a.complete&&a.naturalWidth>0&&a.src.includes('/battle-end.png');});
 const previous=page.viewportSize();
 try{for(const size of [{width:393,height:852},{width:375,height:667},{width:320,height:568},{width:852,height:393},{width:667,height:375}]){
  await page.setViewportSize(size);
  // Chromium cannot emulate iOS env() values. Supply representative resolved
  // safe-area padding to exercise the same grid with a notch/home indicator.
  for(const safe of [null,size.width>size.height?[8,69,29,69]:[67,10,42,10]]){
   await page.locator('#battle').evaluate((e,p)=>{e.style.padding=p?p.map(n=>n+'px').join(' '):'';},safe);
   const geometry=await page.evaluate(()=>{
    const e=document.getElementById('battle'),a=document.getElementById('battleHeroOverlay'),r=a.getBoundingClientRect(),p=getComputedStyle(e),bounds=e.getBoundingClientRect();
    const top=e.querySelector('.battleTop').getBoundingClientRect(),foot=e.querySelector('.battlePartyCards').getBoundingClientRect();
    return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,heading:top.bottom,footer:foot.top,left:bounds.left+parseFloat(p.paddingLeft),rightLimit:bounds.right-parseFloat(p.paddingRight),transform:getComputedStyle(a).transform};
   });
   const label=JSON.stringify({size,safe,geometry});
   assert(geometry.width>0&&geometry.height>0,'victory image has no stage '+label);
   assert(geometry.y>=geometry.heading,'head clips under heading '+label);
   assert(geometry.bottom<=geometry.footer,'original image bottom hidden by HUD '+label);
   assert(geometry.x>=geometry.left&&geometry.right<=geometry.rightLimit,'image clips in side safe area '+label);
   assert.equal(geometry.transform,'none','result animation can move artwork outside its stage '+label);
   for(const selector of ['.battleTop','.battlePartyCards','.battleInfo','.battleCommands']){
    assert(await page.locator('#battle '+selector).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;}),'result UI clipped '+selector+' '+label);
   }
  }
 }
 }finally{await page.locator('#battle').evaluate(e=>e.style.padding='');await page.setViewportSize(previous);}
};

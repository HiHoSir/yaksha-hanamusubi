// Guard the accepted large battle composition. Intentional viewport/HUD overlap
// is allowed; user rejected shrinking every pose to fit above the HUD.
module.exports=async function checkHero(page,assert){
 const originalViewport=page.viewportSize(),baseline=require('fs').readFileSync(require('path').join(__dirname,'fixtures/battle-approved-hero.css'),'utf8');
 const poses=[['idle',0,'hizuki_battle_idle_approved.png'],['attack',0,'attack-01.png'],['attack',550,'attack-02.png'],['attack',650,'attack-03.png'],['skill',0,'skill-01.PNG'],['skill',550,'skill-02.PNG'],['skill',650,'skill-03.png'],['guard',0,'hizuki_battle_idle_approved.png'],['hit',10,'hizuki_battle_idle_approved.png'],['victory',0,'victory-full.png'],['levelup',0,'level-up.png']];
 await page.evaluate(()=>{window.__heroQaNow=performance.now.bind(performance);const now=performance.now();Object.defineProperty(performance,'now',{configurable:true,value:()=>now});window.__qaEval('resetBattleAnimation()');});
 try{for(const size of [{width:393,height:852},{width:375,height:667},{width:320,height:568},{width:852,height:393},{width:667,height:375}]){
  await page.setViewportSize(size);
  for(const safe of [null,size.width>size.height?[8,69,29,69]:[67,10,42,10]]){
   await page.locator('#battle').evaluate((e,p)=>{e.style.padding=p?p.map(n=>n+'px').join(' '):'';},safe);
   for(const [pose,elapsed,file] of poses){
    await page.evaluate(({pose,elapsed})=>window.__qaEval(`battle.phase=${JSON.stringify(['victory','levelup'].includes(pose)?'result':'command')};battle.menu='root';battle.levelUpResult=${pose==='levelup'};battleLocked=${['attack','skill','guard','hit'].includes(pose)};battlePose=${JSON.stringify(pose==='levelup'?'victory':pose)};battleFx=${['attack','skill','hit'].includes(pose)?`{kind:'${pose==='attack'?'slash':pose==='hit'?'impact':'petals'}',target:'${pose==='hit'?'hero':'enemy'}',start:performance.now()-${elapsed},duration:1100,impactDelay:600,amount:null}`:'null'};renderBattle();`),{pose,elapsed});
    await page.waitForFunction(file=>{const a=document.getElementById('battleHeroOverlay');return a.complete&&a.naturalWidth>0&&a.src.includes('/'+file);},file);
    // Compare the real actor box against the accepted 16.1.35 CSS, rather
    // than shrinking all poses to satisfy an invented containment condition.
    const measure=()=>{const a=document.getElementById('battleHeroOverlay'),r=a.getBoundingClientRect(),s=getComputedStyle(a);return {x:r.x,y:r.y,width:r.width,height:r.height,position:s.position,padding:s.padding,fit:s.objectFit,anchor:s.objectPosition};};
    const actual=await page.evaluate(measure),reference=await page.addStyleTag({content:baseline});
    const approved=await page.evaluate(measure);await reference.evaluate(e=>e.remove());
    assert.deepEqual(actual,approved,'approved placement changed '+JSON.stringify({size,safe,pose,elapsed}));
    assert.equal(await page.locator('#battle').evaluate(e=>getComputedStyle(e).display),'flex','do not replace approved composition with a grid');
    if(pose==='levelup')assert(await page.locator('#battleHeroOverlay').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41< -e.clientWidth*.49),'keep level-up centered');
    if(pose==='victory'){
     const alpha=await page.evaluate(()=>{const a=document.getElementById('battleHeroOverlay'),c=document.createElement('canvas');c.width=a.naturalWidth;c.height=a.naturalHeight;const x=c.getContext('2d');x.drawImage(a,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let l=c.width,t=c.height,r=-1,b=-1,clear=0;for(let y=0;y<c.height;y++)for(let z=0;z<c.width;z++){const v=d[(y*c.width+z)*4+3];if(!v)clear++;if(v>=16){l=Math.min(l,z);t=Math.min(t,y);r=Math.max(r,z);b=Math.max(b,y);}}return {w:c.width,h:c.height,l,t,r,b,clear};});
     assert.equal(alpha.w,1024);assert.equal(alpha.h,1536,'victory must match attack canvas dimensions');
     assert(alpha.clear>100000,'victory must be transparent');
     assert(alpha.l>4&&alpha.t>4&&alpha.r<alpha.w-5&&alpha.b<alpha.h-5,'full-body source is cropped '+JSON.stringify(alpha));
    }
    if(safe&&size.width===393&&['attack','victory'].includes(pose))await page.screenshot({path:require('path').join(__dirname,`results/autotile/hero-${pose}-${elapsed}.png`)});
   }
  }
 }
 console.log('PASS approved 16.1.35 placement for idle/attack/skill/guard/hit/levelup and full-body victory: 5 viewports x safe areas on/off');
 // Also run the real command/timer sequence after the deterministic frame probes.
 await page.evaluate(()=>{Object.defineProperty(performance,'now',{configurable:true,value:window.__heroQaNow});window.__qaEval('resetBattleAnimation();battle.phase="command";battle.menu="root";battleLocked=false;battle.levelUpResult=false;battle.hp=battle.max=99999;battle.rareTrait=null;battlePose="idle";renderBattle();');window.__heroObserved=[];window.__heroObserver=new MutationObserver(()=>{window.__heroObserved.push(document.getElementById('battleHeroOverlay').src.split('/').pop().split('?')[0]);});window.__heroObserver.observe(document.getElementById('battleHeroOverlay'),{attributes:true,attributeFilter:['src']});window.__qaEval('cmd("attack");cmd("target-0");');});
 await page.waitForFunction(()=>['attack-01.png','attack-02.png','attack-03.png'].every(f=>window.__heroObserved.includes(f))&&window.__qaEval('battlePose==="idle"'));
 await page.evaluate(()=>{window.__heroObserver.disconnect();delete window.__heroObserver;delete window.__heroObserved;});
 console.log('PASS live attack command: wind-up -> strike -> idle');
 }finally{
  await page.evaluate(()=>{Object.defineProperty(performance,'now',{configurable:true,value:window.__heroQaNow});delete window.__heroQaNow;window.__qaEval('resetBattleAnimation();battleLocked=false;');});
  await page.locator('#battle').evaluate(e=>e.style.padding='');await page.setViewportSize(originalViewport);
 }
};

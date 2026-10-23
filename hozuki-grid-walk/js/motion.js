((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./rules.js'):root.HOZUKI_RULES);if(typeof module==='object'&&module.exports)module.exports=api;else root.HOZUKI_MOTION=api;})(globalThis,R=>{
'use strict';
function create(){let pos={...R.spawn},motion=null,queue=[],dir='u',held=null,started=0;const duration=144;
 function start(dx,dy,now){if(motion)return false;dir=dx<0?'l':dx>0?'r':dy<0?'u':'d';if(!R.canStep(pos,dx,dy))return false;motion={from:{...pos},to:{x:pos.x+dx,y:pos.y+dy},start:now};started=now;return true;}
 function tick(now){if(motion&&now-motion.start>=duration){pos={...motion.to};motion=null;}if(!motion){if(held)start(...held,now);else if(queue.length){const next=queue.shift();if(!start(next.x-pos.x,next.y-pos.y,now))queue=[];}}return sample(now);}
 function sample(now){if(!motion)return {x:pos.x,y:pos.y,dir,frame:1,moving:false};const f=Math.min(1,Math.max(0,(now-motion.start)/duration));return {x:motion.from.x+(motion.to.x-motion.from.x)*f,y:motion.from.y+(motion.to.y-motion.from.y)*f,dir,frame:[1,0,1,2][Math.floor((now-started)/72)%4],moving:true};}
 function walkTo(x,y){const start=motion?motion.to:pos,p=R.path(start,{x,y});held=null;queue=p||[];return p!==null;}
 function hold(dx,dy){held=[dx,dy];queue=[];}
 function release(){held=null;}
 function reset(cell=R.spawn){if(!R.walkable(cell.x,cell.y))return false;pos={...cell};motion=null;queue=[];held=null;dir='d';return true;}
 return {duration,tick,sample,walkTo,hold,release,reset,start,get position(){return {...pos};},get pending(){return queue.length;},get moving(){return !!motion;}};
}
return {create};
});

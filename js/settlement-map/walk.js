((root,f)=>{const api=f(typeof module==='object'&&module.exports?require('./model.js'):root.SMModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.SMWalk=api;})(globalThis,M=>{
'use strict';function create(map){let pos=[...map.spawn],motion=null,queue=[],held=null,dir='d';const blocked=M.collision(map),duration=144;
function start(dx,dy,now){if(motion||Math.abs(dx)+Math.abs(dy)!==1)return false;dir=dx<0?'l':dx>0?'r':dy<0?'u':'d';const to=[pos[0]+dx,pos[1]+dy];if(!M.inside(map,to)||blocked.has(M.key(to))||blocked.has(M.key(pos)))return false;motion={from:[...pos],to,start:now};return true;}
function sample(now){if(!motion)return {x:pos[0],y:pos[1],dir,frame:1};const t=Math.min(1,Math.max(0,(now-motion.start)/duration));return {x:motion.from[0]+(motion.to[0]-motion.from[0])*t,y:motion.from[1]+(motion.to[1]-motion.from[1])*t,dir,frame:[1,0,1,2][Math.floor(t*4)%4]};}
function tick(now){if(motion&&now-motion.start>=duration){pos=motion.to;motion=null;}if(!motion){if(held)start(...held,now);else if(queue.length){const n=queue.shift();if(!start(n[0]-pos[0],n[1]-pos[1],now))queue=[];}}return sample(now);}
function walkTo(to){const p=M.path(map,motion?motion.to:pos,to);held=null;queue=p||[];return p!==null;}
function cancel(){motion=null;queue=[];held=null;}
function reset(cell=map.spawn){if(!M.inside(map,cell)||blocked.has(M.key(cell)))return false;cancel();pos=[...cell];return true;}
return {duration,start,sample,tick,walkTo,cancel,reset,hold(dx,dy){held=[dx,dy];queue=[];},release(){held=null;},get position(){return [...pos];},get moving(){return !!motion;},get pending(){return queue.length;}};
}return {create};
});

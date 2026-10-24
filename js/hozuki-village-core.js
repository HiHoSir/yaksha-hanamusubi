((root,f)=>{const api=f(typeof module==='object'&&module.exports?require('./settlement-map/model.js'):root.SMModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.HozukiVillage=api;})(globalThis,M=>{
'use strict';
const WIDTH=672,HEIGHT=576;
// main 74234d9d: game.js field outer scale 1.2, landscape zoom 1.4,
// player projection at anchor 354/543, standard preset (.34,1.30,1.85).
const FIELD_ZOOM=1.2*1.4*(.34+(1.30-.34)*Math.pow(354/543,1.85));
function fieldZoom(w,h){return FIELD_ZOOM*Math.max(w,h)/768;}
function prepare(raw,collision){const map=M.parse(JSON.stringify(raw));if(map.width!==21||map.height!==18||map.tileSize!==32)throw Error('鬼灯村の寸法が一致しません');if(collision.width!==map.width||collision.height!==map.height||collision.tileSize!==map.tileSize)throw Error('添付判定の寸法が一致しません');const blocked=M.collision(map),given=new Set(collision.blocked.map(M.key));if(given.size!==collision.blocked.length||blocked.size!==given.size||[...blocked].some(k=>!given.has(k))||JSON.stringify(map.spawn)!==JSON.stringify(collision.spawn)||JSON.stringify(map.entrances)!==JSON.stringify(collision.entrances))throw Error('配置と添付判定が一致しません');const audit=M.audit(map);if(audit.errors.length||audit.targets.some(t=>!t.reachable||!audit.reachable.has(M.key(t.marker))))throw Error('出現点から入口へ到達できません');return {map,blocked,audit};}
// Normal play follows the interpolated actor even beyond the authored map edge.
// Only the explicit overview centers the whole map instead of the heroine.
function view(actor,w,h,zoom,overview){const scale=overview?Math.min(w/WIDTH,h/HEIGHT):zoom,vw=w/scale,vh=h/scale;return {scale,x:overview?(WIDTH-vw)/2:(actor.x+.5)*32-vw/2,y:overview?(HEIGHT-vh)/2:(actor.y+.5)*32-vh/2};}
function worldPoint(v,x,y){return [Math.floor((x/v.scale+v.x)/32),Math.floor((y/v.scale+v.y)/32)];}
function nearby(map,s){return map.entrances.find(e=>e.marker[0]===s.x&&e.marker[1]===s.y||e.approach[0]===s.x&&e.approach[1]===s.y&&({u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]}[s.dir]||[]).every((n,i)=>e.marker[i]===e.approach[i]+n))||null;}
// Use the field renderer's neutral-column alpha threshold and one stable transform per direction.
function fieldBounds(image,createCanvas){const c=createCanvas(96,128).getContext('2d');c.drawImage(image,0,0);const data=c.getImageData(0,0,96,128).data,out={};for(const [dir,row]of Object.entries({d:0,u:1,r:2,l:3})){let left=32,right=-1,top=32,bottom=-1;for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(data[((row*32+y)*96+x)*4+3]>=32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(right<left)throw Error('緋月のフレームが空です');out[dir]={left,top,width:right-left+1,height:bottom-top+1};}return out;}
function spriteState(s){return {...s,frame:s.frame===1?0:s.frame===0?1:2};}
return {prepare,fieldZoom,view,worldPoint,nearby,spriteState,fieldBounds,FIELD_ZOOM};
});


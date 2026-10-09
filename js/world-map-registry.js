/* Yaksha: opt-in two-field map registry. Public data must be original. */
(function(root){
'use strict';
const TYPES=new Set(['sea','shallow','river','grass','forest','mountain','snow','desert','lava','sand','barren','bridge','town']);
const SIZE=256,NEW_SIZE=80,ID_NEW='new_continent',ID_GLOBAL='whole_world';
let globalMap=null;
function validateRows(rows,w,h){
 if(!Array.isArray(rows)||rows.length!==h)throw new Error('map height mismatch');
 for(let y=0;y<h;y++){
  if(!Array.isArray(rows[y])||rows[y].length!==w)throw new Error('map width mismatch at '+y);
  for(let x=0;x<w;x++)if(!TYPES.has(rows[y][x]))throw new Error('invalid terrain at '+x+','+y);
 }
 return true;
}
function passable(t,vehicle){
 if(t==='sea'||t==='shallow')return vehicle==='ship';
 if(t==='river'||t==='mountain'||t==='lava')return false;
 return true;
}
function registerGlobalOriginal(data){
 if(!data||data.source!=='original')throw new Error('only independently authored original tiles accepted');
 validateRows(data.rows,SIZE,SIZE);
 globalMap={id:ID_GLOBAL,width:SIZE,height:SIZE,tileSize:32,rows:data.rows,source:'original'};
 return {id:ID_GLOBAL,width:SIZE,height:SIZE};
}
function get(id){
 if(id===ID_NEW){
  if(!root.YK_WORLD)throw new Error('New Continent not loaded');
  return {id:ID_NEW,width:NEW_SIZE,height:NEW_SIZE,tileSize:32,legacy:root.YK_WORLD};
 }
 if(id===ID_GLOBAL)return globalMap;
 return null;
}
function tileAt(id,x,y){
 const m=get(id);if(!m)throw new Error('map unavailable: '+id);
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=m.width||y>=m.height)return 'void';
 return m.rows?m.rows[y][x]:m.legacy.mapData[y][x];
}
function transition(current,target,cell,flags){
 if(!current||![ID_NEW,ID_GLOBAL].includes(current.mapId))throw new Error('unknown source map');
 if(current.mapId===target)throw new Error('same-map navigation');
 const map=get(target);if(!map)throw new Error('destination unavailable');
 if(!flags||!flags.shipUnlocked)throw new Error('ship progression is locked');
 const [x,y]=cell||[];
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=map.width||y>=map.height)throw new Error('invalid entry cell');
 return {mapId:target,tileX:x,tileY:y,lastMapId:current.mapId};
}
root.YK_MAP_REGISTRY=Object.freeze({SIZE,NEW_SIZE,ID_NEW,ID_GLOBAL,validateRows,passable,registerGlobalOriginal,get,tileAt,transition});
})(typeof window==='undefined'?globalThis:window);

// Tea-house floor/wall authoring grid, transcribed from the approved 10x8 editor export.
// Only floor and wall layers use this module; furniture stays in its existing render queue.
window.YK_TEAHOUSE_LAYERS=(()=>{
 const tileSize=32,width=10,height=8;
 const tiles=[
 ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
 ['wall','wood','wood','wood','wood','wood','wood','wood','wood','wall'],
 ['wall','cushion','table','table','cushion','cushion','table','table','cushion','wall'],
 ['wall','wood','wood','wood','wood','wood','wood','wood','wood','wall'],
 ['wall','cushion','table','table','cushion','cushion','table','table','cushion','wall'],
 ['wall','raised','raised','raised','raised','raised','raised','raised','raised','wall'],
 ['wall','road','road','road','stone','stone','road','road','road','wall'],
 ['wall','wall','wall','road','entrance','entrance','road','wall','wall','wall']
 ];
 const floorType=t=>['wood','table','cushion','raised'].includes(t)?'wood':'road';
 const get=(x,y)=>tiles[y]?.[x]??null;
 const wallCells=()=>tiles.flatMap((row,y)=>row.flatMap((type,x)=>type==='wall'?[[x,y]]:[]));
 return Object.freeze({tileSize,width,height,tiles,get,floorType,wallCells});
})();

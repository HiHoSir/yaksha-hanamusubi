// 天妖の社 — 24×16 logical collision grid; 64 source-image pixels = 32 world pixels.
// Derived from the three-layer visual review. Coordinates are (column,row), top-left origin.
// . open ground, L lower-path leaf overhang (walkable at the footpoint),
// # forest/trunk blocked, S shrine blocked.
// IMPORTANT: L permits footpoint passage only; render trees above the character.
export const TENYO_COLLISION = Object.freeze({
  width:24,height:16,sourceCellPx:64,worldCellPx:32,
  rows:[
    "#########SSSSSS#########",
    "#########SSSSSS#########",
    "#########SSSSSS.########",
    "#######..SSSSSS....#####",
    "#####....SSSSSS.....####",
    "#####...............####",
    "#######............#####",
    "########L.........######",
    "##########.....L########",
    "##########L..LL#########",
    "#########L#L.###########",
    "#########LL..L##########",
    "##########L..L##########",
    "##########...L##########",
    "##########...L##########",
    "##########L..L##########"
  ]
});
export function tenyoCellAt(sourceX,sourceY){
  const x=Math.floor(sourceX/TENYO_COLLISION.sourceCellPx);
  const y=Math.floor(sourceY/TENYO_COLLISION.sourceCellPx);
  if(x<0||x>=24||y<0||y>=16)return '#';
  return TENYO_COLLISION.rows[y][x];
}
export function canWalkTenyo(sourceX,sourceY){
  const tile=tenyoCellAt(sourceX,sourceY);
  return tile==='.'||tile==='L';
}
export function moveTenyoFootpoint(x,y,dx,dy){
  // Axis-separated resolution permits sliding along a blocked tree or shrine edge.
  const nx=canWalkTenyo(x+dx,y)?x+dx:x;
  const ny=canWalkTenyo(nx,y+dy)?y+dy:y;
  return {x:nx,y:ny};
}

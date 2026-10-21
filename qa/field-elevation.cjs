const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const w={console,localStorage:{getItem:()=>null},Date};w.window=w;
for(const f of ['field-terrain','elevation-model','field-elevation','world','landscape','movement-rules','data','equipment','save'])vm.runInNewContext(fs.readFileSync('js/'+f+'.js','utf8'),w);
const E=w.YK_ELEVATION,W=w.YK_WORLD,m=W.mapData,source=w.YK_FIELD_TERRAIN;
const expectedTerrain=source.tiles.map(row=>row.map(tile=>tile==='road'?'grass':tile));
assert.equal(JSON.stringify(m),JSON.stringify(expectedTerrain),'authored terrain preserved except deprecated road surfaces converted to grass');
assert(!m.some(row=>row.includes('road')),'production terrain must not render constructed roads');
assert.equal(m.cornerCut,30);assert.deepEqual(Array.from(E.validate(m)),[]);
const move=(x,y,nx,ny)=>{if(!W.canMove(x,y,nx,ny))return false;const end=w.YK_MOVEMENT.step('field',x,y,(nx-x)/32,(ny-y)/32,1,W.size,(a,b)=>!W.walkable(a,b));return end.x===nx&&end.y===ny;};
const queue=[[37,71]],seen=new Set(['37,71']);for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of Object.values(E.dirs)){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&move(x*32+16,y*32+16,nx*32+16,ny*32+16)){assert(move(nx*32+16,ny*32+16,x*32+16,y*32+16),'return step');seen.add(key);queue.push([nx,ny]);}}}
for(const [id,p] of Object.entries(W.places))assert(seen.has((p.point[0]>>5)+','+(p.point[1]>>5)),id+' reachable');
for(const stop of W.restStops)assert(seen.has(stop.cell.join(',')),stop.name+' reachable');
for(const g of W.guides)assert(seen.has((g.x>>5)+','+(g.y>>5)),'guide reachable');
for(const bridge of m.decorations.filter(o=>['bridge','bridgeNS'].includes(o.kind))){const ns=bridge.kind==='bridgeNS';for(const [tx,ty] of bridge.contactTiles)for(const offset of [-3,0,3]){const x=tx*32+16+(ns?offset:0),y=ty*32+16+(ns?0:offset);assert(W.walkable(x,y),'bridge off-center deck');}}
let cuts=0;for(let y=0;y<80;y++)for(let x=0;x<80;x++)for(const cut of E.outline(m,x,y).cuts){cuts++;const [cx,cy]=cut.corner;assert(!E.pointWalkable(m,x*32+cx+(cx?-1:1),y*32+cy+(cy?-1:1)),'cut forbidden');}
assert(cuts>50,'production uses clipped cliffs');
for(const o of m.decorations.filter(o=>!o.ground)){const levels=o.contactTiles.filter(([x,y])=>!['sea','river'].includes(m[y][x])).map(([x,y])=>m.heights[y][x]);assert(levels.every(h=>h===o.supportHeight),'flat object support '+o.kind);}
const good=W.places.village.point,old=w.YK_SAVE.fresh();Object.assign(old,{area:'field',x:good[0],y:good[1],worldPosition:good.slice(),worldRevision:113,gold:4321,quest:2});const migrated=w.YK_SAVE.migrate(old);assert.equal(migrated.x,old.x);assert.equal(migrated.y,old.y);assert.equal(migrated.gold,4321);assert.equal(migrated.quest,2);assert.equal(migrated.worldRevision,119);
let stranded;for(let y=1;y<79&&!stranded;y++)for(let x=1;x<79;x++)if(['grass','forest','sand','road'].includes(m[y][x])&&!m.travelReachable.has(x+','+y)&&!m.occupiedTiles.has(x+','+y)){stranded=[x*32+16,y*32+16];break;}
assert(stranded);const repaired=w.YK_SAVE.migrate({...old,x:stranded[0],y:stranded[1],worldPosition:stranded});assert(W.walkable(repaired.x,repaired.y));assert(m.travelReachable.has((repaired.x>>5)+','+(repaired.y>>5)));
const html=fs.readFileSync('index.html','utf8'),game=fs.readFileSync('js/game.js','utf8');assert(html.indexOf('js/elevation-model.js')<html.indexOf('js/world.js'));assert(html.indexOf('js/elevation-view.js')<html.indexOf('js/game.js'));assert(game.includes('elevationTerrain:true'));assert(game.includes('YK_WORLD.canMove(S.x,S.y'));
console.log('PASS: production routes both ways, seven destinations, rest stops, guides, bridge offsets, '+cuts+' cuts, foundations, existing save progress and invalid-position repair');

#!/usr/bin/env python3
"""Author and verify a 32px cave layout from the approved 84+24 candidate atlas.

Only the map and PNG preview are generated; no existing map/gameplay data is edited.
"""
import json
from collections import deque
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
ASSETS=ROOT/'assets/dungeons/natural-cave-v1'
sample=json.loads((ASSETS/'cave-map-v7.json').read_text())
W,H=sample['width'],sample['height']
assert (W,H,sample['tileSize'])==(32,22,32)
base=[row[:] for row in sample['tileIds']]
walk=set(map(tuple,sample['walkable']))
blocked=set(map(tuple,sample.get('blockedProps',[])))
horizontal=[
 (8,2,[84,85,86,87,88]),
 (22,5,[84,85,86,87,88]),
 (8,3,[90,91,92,93,94]),
 (22,6,[90,91,92,93,94]),
]
vertical=[
 (2,8,[96,97,98,96,97,98,96,97]),
 (29,9,[99,100,101,99,100,101,99,100]),
 (18,14,[105,106]),
]
wall_cells=[]
for segments,dx,dy in ((horizontal,1,0),(vertical,0,1)):
 for x,y,ids in segments:
  for k,id in enumerate(ids):
   xx,yy=x+dx*k,y+dy*k
   assert 0<=xx<W and 0<=yy<H and 84<=id<108
   base[yy][xx]=id
   walk.discard((xx,yy));blocked.discard((xx,yy))
   wall_cells.append((xx,yy))
assert len(set(wall_cells))==38
water=[(27,9,7)]
for x,y,id in water:
 assert (x,y) in walk
 base[y][x]=id;walk.remove((x,y))
decorations=[
 (5,8,51),(6,7,78),(11,5,80),(16,7,52),
 (5,14,79),(10,14,82),(13,16,48),(17,12,68),
 (23,8,83),(27,12,79),(23,16,69),(28,10,50),
 (10,17,78),(15,8,81),(24,13,70),
]
solid_props={48,50,51,52,68,69,70,80,81,82,83}
for x,y,id in decorations:
 assert (x,y) in walk,(x,y,id)
 if id in solid_props:blocked.add((x,y))
start=(10,7)
assert start in walk and start not in blocked
open_cells=walk-blocked
seen={start};queue=deque([start])
while queue:
 x,y=queue.popleft()
 for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
  p=(x+dx,y+dy)
  if p in open_cells and p not in seen:seen.add(p);queue.append(p)
assert seen==open_cells,(len(seen),len(open_cells))
assert len(open_cells)==293,len(open_cells)
for point in ((24,8),(24,15),(10,17),(17,11),(11,11),(20,11)):
 assert point in seen,point
map_data={
 'format':'yaksha-cave-mapchips-v1','version':9,'tileSize':32,
 'width':W,'height':H,'atlasColumns':12,'atlasRows':9,
 'tileIds':base,
 'walkable':[list(p) for p in sorted(walk,key=lambda p:(p[1],p[0]))],
 'blockedProps':[list(p) for p in sorted(blocked,key=lambda p:(p[1],p[0]))],
 'decorations':[list(d) for d in decorations],
 'archOverlays':[{'sprite':'assets/dungeons/natural-cave-v1/cave-corrected-arch-2x2.png','x':18,'y':10,'widthCells':2,'heightCells':2,'walkable':True,'occupiedTiles':[]}],
 'start':list(start),'heightLevels':None,'elevation':None,
 'renderer':'pure 32px tile-only; no height projection',
 'tileAtlas':'assets/dungeons/natural-cave-v1/cave-wall-straights-atlas-12x9.png',
 'overlayAtlas':'assets/dungeons/natural-cave-v1/cave-wall-straights-overlay-12x9.png',
 'notes':'Straight wall test placement: 4 horizontal segments and 3 vertical segments; 293 reachable cells.'
}
(ASSETS/'cave-map-108-layout.json').write_text(json.dumps(map_data,ensure_ascii=False,indent=2)+'\n')
atlas=Image.open(ASSETS/'cave-wall-straights-atlas-12x9.png').convert('RGB')
over=Image.open(ASSETS/'cave-wall-straights-overlay-12x9.png').convert('RGBA')
arch=Image.open(ASSETS/'cave-corrected-arch-2x2.png').convert('RGBA')
assert atlas.size==over.size==(384,288) and arch.size==(64,64)
image=Image.new('RGBA',(W*32,H*32),(10,9,13,255))
for y,row in enumerate(base):
 for x,id in enumerate(row):
  if id>=0:
   rect=(id%12*32,id//12*32,id%12*32+32,id//12*32+32)
   image.paste(atlas.crop(rect),(x*32,y*32))
for x,y,id in decorations:
 rect=(id%12*32,id//12*32,id%12*32+32,id//12*32+32)
 image.alpha_composite(over.crop(rect),(x*32,y*32))
image.alpha_composite(arch,(18*32,10*32))
image.convert('RGB').save(ASSETS/'cave-map-108-layout-preview.png',optimize=True)
print('PASS: 32x22 cave; 38 straight-wall cells; 293/293 reachable; 15 props; PNG 1024x704')
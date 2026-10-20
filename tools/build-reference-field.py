"""Author the 80x80 reference composition using existing sprites; no new image art.

Run against the pre-composition terrain export passed as argv[1]. The baked output
contains exact movement cells, contacts and routes; runtime does not infer occupancy.
"""
import json, math, heapq, sys
from pathlib import Path
src=Path(sys.argv[1]).read_text().split('=',1)[1].strip().rstrip(';')
data=json.loads(src); tiles=[r[:] for r in data['tiles']]; N=80
water={'sea','river'}
# Reviewed coastline trace, independent of illustration shadows/labels. Preserve
# 80x80 grid and the two-cell shallow-water fringe requested for the original map.
trace=json.loads(Path('tools/reference-coast-80.json').read_text());coast=trace['rows']
for y in range(N):
    for x in range(N):
        if coast[y][x]!='~':tiles[y][x]='grass';continue
        near_land=any(0<=x+dx<N and 0<=y+dy<N and coast[y+dy][x+dx]!='~'
                      for dy in range(-2,3) for dx in range(-2,3))
        tiles[y][x]='river' if near_land else 'sea'
# Remove only tiny enclosed sampling holes in the original rough coastline.
# The large lakes and ocean-connected channels remain, then authored rivers follow.
seen=set()
for sy in range(N):
    for sx in range(N):
        if (sx,sy) in seen or tiles[sy][sx] not in water:continue
        q=[(sx,sy)];seen.add((sx,sy));edge=False
        for x,y in q:
            edge|=x in (0,79) or y in (0,79)
            for xx,yy in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if 0<=xx<N and 0<=yy<N and (xx,yy) not in seen and tiles[yy][xx] in water:seen.add((xx,yy));q.append((xx,yy))
        if not edge and len(q)<=8:
            for x,y in q:tiles[y][x]='grass'
def inside(x,y,p):
    hit=False
    for (a,b),(c,d) in zip(p,p[1:]+p[:1]):
        if (b>y)!=(d>y) and x<(c-a)*(y-b)/(d-b)+a: hit=not hit
    return hit
def zone(poly,kind):
    for y in range(N):
        for x in range(N):
            if tiles[y][x] not in water and inside(x+.5,y+.5,poly): tiles[y][x]=kind
forests=[
 ('southern-grove',[(17,53),(23,51),(29,54),(31,59),(27,62),(22,59),(18,58)]),
 ('village-grove',[(33,66),(38,64),(43,66),(46,70),(43,74),(35,73)]),
 ('shrine-woods',[(15,36),(22,36),(28,39),(31,43),(28,47),(23,50),(17,48)]),
 ('south-river-woods',[(29,39),(35,40),(40,44),(43,47),(39,51),(33,53),(29,48)]),
 ('forgotten-forest',[(53,25),(61,24),(67,27),(71,31),(69,37),(63,39),(57,37),(52,32)]),
 ('central-grove',[(38,28),(45,25),(51,26),(54,29),(49,32),(43,34),(38,32)]),
 ('river-grove',[(41,35),(48,34),(51,37),(48,41),(43,41)]),
 ('lake-south',[(25,20),(29,19),(32,22),(38,22),(40,25),(35,27),(29,26),(26,24)]),
 ('hotspring-forest',[(12,15),(17,10),(26,7),(29,9),(29,15),(27,20),(23,22),(17,20)]),
 ('western-woods',[(13,23),(19,21),(24,24),(26,29),(23,33),(19,32),(16,28)]),
 ('north-foothills',[(37,10),(44,10),(48,13),(47,16),(42,17),(38,15)]),
 ('northeast-grove',[(64,9),(69,9),(70,13),(67,15),(63,13)])
]
for _,p in forests:zone(p,'forest')
mountains=[
 ('western-ridge',[(23,33),(26,31),(31,32),(35,36),(33,39),(28,40),(24,38)]),
 ('central-ridge',[(44,22),(47,18),(51,20),(53,23),(59,25),(57,28),(51,27),(47,26)]),
 ('northern-ridge',[(43,7),(47,6),(50,9),(54,11),(57,14),(55,18),(51,16),(47,13)]),
 ('northeastern-ridge',[(61,3),(64,1),(67,5),(73,9),(76,12),(73,16),(68,14),(64,11),(60,9)]),
 ('waterfall-cliffs',[(65,15),(70,14),(73,18),(71,23),(67,25),(64,22)]),
 ('snowy-crown',[(33,4),(36,1),(41,0),(45,3),(47,6),(44,9),(39,10),(34,8)])
]
for _,p in mountains:zone(p,'mountain')
# Restore the northern enclosing massif rather than leaving the shrine on
# disconnected coastal sampling fragments. This is an intentional land edit.
for y in range(1,11):
    for x in range(32,48):
        if inside(x+.5,y+.5,mountains[-1][1]):tiles[y][x]='mountain'
def stroke(points,kind,radius=.8):
    for (ax,ay),(bx,by) in zip(points,points[1:]):
        n=max(abs(bx-ax),abs(by-ay))*4
        for i in range(n+1):
            cx=ax+(bx-ax)*i/n;cy=ay+(by-ay)*i/n
            for y in range(max(0,int(cy)-2),min(N,int(cy)+3)):
                for x in range(max(0,int(cx)-2),min(N,int(cx)+3)):
                    if math.hypot(x-cx,y-cy)<=radius:tiles[y][x]=kind
stroke([(39,20),(38,23),(36,26),(35,31),(35,35),(37,38),(41,40),(45,43),(49,45)],'river',.8)
stroke([(12,44),(18,43),(24,42),(29,41),(35,36)],'river',.8)
stroke([(67,15),(67,20),(69,23),(70,27)],'river',.8)
# The waterfall's western foot is a continuous land terrace in the reference.
for y in range(20,27):
    for x in range(60,67):
        if tiles[y][x] in water:tiles[y][x]='grass'
# A connected lake ring and its wooded island, positioned at the reference lake.
for y in range(15,23):
    for x in range(29,40):
        if ((x-34)/5.1)**2+((y-18.5)/3.2)**2<=1:tiles[y][x]='river'
for y in range(17,19):
    for x in range(33,35):tiles[y][x]='forest'
# The eastern lake outlet follows the reference's small basin below the ridge.
stroke([(39,19),(42,20),(45,20),(47,18),(48,17),(49,18),(52,20)],'river',.7)
places={'village':[37,70],'shrine':[20,45],'cove':[49,50],'forest':[60,33],
        'waterfall':[67,20],'hotspring':[22,17],'fox':[40,5]}
stops=[('roadside-tea','花かげ茶屋',[24,56],'tea'),('bridge-inn','渡しの旅籠',[31,30],'inn'),
       ('forest-tea','木漏れ日の茶屋',[49,36],'tea'),('highland-inn','峠の旅籠',[41,16],'inn')]
# Destination clearings are intentional terrain edits, including the northern
# shrine courtyard. Leave a three-cell south approach for solid shrine bases.
for x,y in list(places.values())+[s[2] for s in stops]:
    for dy in range(-2,3):
        for dx in range(-2,3):
            if 0<=x+dx<N and 0<=y+dy<N:tiles[y+dy][x+dx]='grass'
# The reference shrine has a southern pass through its enclosing crown.
for y in range(7,12):
    for x in range(39,42):tiles[y][x]='grass'
objects=[]
stroke([(63,24),(65,24),(65,20),(67,20)],'grass',.8)
def obj(kind,x,y,w,h,contacts,blocked=(),**extra):
    objects.append(dict(kind=kind,x=x*32,y=y*32,width=w,height=h,foot=y*32+h,
        contactTiles=[list(p) for p in contacts],occupiedTiles=[list(p) for p in blocked],walkThrough=not blocked,**extra))
for id,(x,y) in places.items():
    if id=='village':obj('newVillage',x,y-1,64,32,[(x,y-1),(x+1,y-1)],destination=id)
    elif id in ('shrine','fox'):obj('shrine',x,y-3,64,64,[(x,y-2),(x+1,y-2)],[(x,y-2),(x+1,y-2)],destination=id)
    elif id=='forest':obj('newTorii',x,y-1,32,32,[(x,y-1)],destination=id)
    elif id=='hotspring':obj('newHouse',x,y-1,32,32,[(x,y-1)],destination=id)
    elif id=='waterfall':obj('waterfall',x-1,y-4,80,96,[(x-1,y-2),(x,y-2),(x+1,y-2)],[(x-1,y-2),(x,y-2),(x+1,y-2)],destination=id)
    elif id=='cove':obj('newHouse',x,y-1,32,32,[(x,y-1)],destination=id)
for id,name,(x,y),typ in stops:obj('newHouse',x,y-1,32,32,[(x,y-1)],restStop=id)
solid={tuple(c) for o in objects for c in o['occupiedTiles']}
# Route waypoints follow the composition's clearings and river crossings.
legs=[['village','shrine',[(35,62),(30,56),(26,50)]],
      ['shrine','cove',[(27,46),(34,46),(42,48)]],
      ['cove','forest',[(48,44),(50,39),(56,37)]],
      ['forest','waterfall',[(63,29),(63,24),(65,23)]],
      ['waterfall','hotspring',[(62,22),(57,21),(54,18),(50,18),(44,19),(41,16),(29,13)]],
      ['hotspring','fox',[(29,13),(34,11),(40,11),(40,8)]]]
bridge_specs=[('bridge',38,23),('bridge',35,35),('bridgeNS',48,44),('bridge',48,18)]
bridgeWater=[]
for kind,x,y in bridge_specs:
    cells=[(x+d,y) for d in [-1,0,1]] if kind=='bridge' else [(x,y+d) for d in [-1,0,1]]
    for xx,yy in cells:
        if tiles[yy][xx] in water:bridgeWater.append([xx,yy])
        tiles[yy][xx]='bridge'
    # Explicitly authored dry abutments, one cell past either end of the deck.
    ends=[(x-2,y),(x+2,y)] if kind=='bridge' else [(x,y-2),(x,y+2)]
    for xx,yy in ends:tiles[yy][xx]='grass'
def route(a,b):
    a=tuple(a);b=tuple(b);q=[(0,a)];dist={a:0};prev={a:None}
    while q:
        cost,p=heapq.heappop(q)
        if cost!=dist[p]:continue
        if p==b:break
        x,y=p
        for n in [(x+1,y),(x,y+1),(x-1,y),(x,y-1)]:
            xx,yy=n
            if not(1<=xx<79 and 1<=yy<79) or n in solid:continue
            t=tiles[yy][xx]
            if t in ['mountain','sea','river']:continue
            # Preserve woods as masses. Rivers are costly and crossed narrowly.
            c=cost+{'river':35,'forest':4,'grass':1,'road':.65,'bridge':.65}.get(t,1)
            if c<dist.get(n,float('inf')):dist[n]=c;prev[n]=p;heapq.heappush(q,(c,n))
    if b not in prev:raise ValueError(('unreachable waypoint',a,b))
    out=[];p=b
    while p is not None:out.append(list(p));p=prev[p]
    return out[::-1]
def without_loops(path):
    out=[];seen={}
    for p in path:
        k=tuple(p)
        if k in seen:
            out=out[:seen[k]+1];seen={tuple(c):i for i,c in enumerate(out)}
        else:seen[k]=len(out);out.append(p)
    return out
roads=[]
for a,b,via in legs:
    checkpoints=[places[a]]+via+[places[b]];path=[]
    for u,v in zip(checkpoints,checkpoints[1:]):path+=route(u,v)[bool(path):]
    roads.append(without_loops(path))
# A cross-valley branch uses the central river bridge, as in the reference.
path=[]
for u,v in zip([(31,30),(33,35),(37,35),(45,35),(49,36)],[(33,35),(37,35),(45,35),(49,36)]):path+=route(u,v)[bool(path):]
roads.append(path)
# Short facility branches connect actual buildings, not decorative fake entrances.
for _,_,p,_ in stops:
    target=min([c for r in roads for c in r],key=lambda c:abs(c[0]-p[0])+abs(c[1]-p[1]))
    roads.append(route(p,target))
roadCells={tuple(c) for r in roads for c in r}
crossings=bridgeWater
for x,y in roadCells:
    tiles[y][x]='bridge' if tiles[y][x]=='bridge' else 'road'
# Reserve a clear walking corridor before placing trees/mountains. Water stays
# water beside bridge decks; no route raises an arbitrary land causeway.
for x,y in roadCells:
    for dx,dy in [(0,0),(1,0),(-1,0),(0,1),(0,-1)]:
        xx,yy=x+dx,y+dy
        if (xx,yy) not in roadCells and tiles[yy][xx] in ('forest','mountain'):tiles[yy][xx]='grass'
# Reference-colored beaches belong on land, never on top of a water cell.
# Restrict them to sea-facing grass, preserving roads, forests and mountain feet.
for x,y in trace['beachCandidates']:
    if tiles[y][x]=='grass' and any(0<=x+dx<N and 0<=y+dy<N and coast[y+dy][x+dx]=='~' for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]):
        tiles[y][x]='sand'
# Bridge sprites retain existing dimensions. Their explicit traversable cells
# are the authored bridge terrain; bounds do not grant water walkability.
for kind,x,y in bridge_specs:
    if kind=='bridgeNS':
        deck=[(x,y-1),(x,y),(x,y+1)];obj('bridgeNS',x-.25,y-1,48,96,deck,ground=True)
    else:
        deck=[(x-1,y),(x,y),(x+1,y)];obj('bridge',x-1,y-.125,96,40,deck,ground=True)
# Preserve inspectable landmarks beside explicit, unobstructed route approaches.
obj('castle',25,46,64,64,[(25,47),(26,47)],[(25,47),(26,47)])
obj('newCaveLarge',26,25,64,32,[(26,25),(27,25)])
obj('sacredTree',58,31,64,64,[(58,32),(59,32)],[(58,32),(59,32)])
reserved={tuple(c) for o in objects for c in o['contactTiles']}
# Dense forests reuse the approved 32x32 tree object, with deliberately open
# grassy pockets. These cells are walkable as approved in the user's review.
for y in range(N):
    for x in range(N):
        if tiles[y][x]=='forest' and (x,y) not in reserved:
            obj('newTrees',x,y,32,32,[(x,y)],biome='forest');reserved.add((x,y))
# Mountain contact rows: 4x1 blocked cells under each 4x2 picture. The top
# overhang adds no collision. Remaining single cells use the 1x1 small mountain.
for y in range(1,N):
    x=0
    while x<N:
        if tiles[y][x]!='mountain' or (x,y) in reserved:x+=1;continue
        large=x+3<N and all(tiles[y][xx]=='mountain' and (xx,y) not in reserved for xx in range(x,x+4))
        cells=[(xx,y) for xx in range(x,x+(4 if large else 1))]
        obj('newMountainLarge' if large else 'newMountainSmall',x,y-1 if large else y,128 if large else 32,64 if large else 32,cells,cells,biome='mountain')
        reserved.update(cells);x+=len(cells)
# Scattered coast vegetation is restricted to existing dry islands/peninsulas.
for x,y in [(10,10),(11,11),(13,7),(11,27),(7,56),(9,63),(7,70),(67,39),(69,39),(66,60),(43,63),(48,62)]:
    if tiles[y][x]=='grass' and (x,y) not in reserved:obj('newTrees',x,y,32,32,[(x,y)],biome='coastal')
# Flowers in the southern meadows, reused from the village ground atlas.
for x,y in [(30,61),(32,60),(34,58),(38,61),(39,63),(32,65),(42,66),(17,48),(23,48)]:
    if tiles[y][x]=='grass':obj('wildflowers',x,y,32,32,[(x,y)],ground=True)
# Water added or removed by tracing must not retain the old terrain's elevation.
heights=[row[:] for row in data['heights']]
for y,row in enumerate(tiles):
    for x,t in enumerate(row):
        if t in water or t=='bridge':heights[y][x]=0
data.update(tiles=tiles,heights=heights,referenceComposition={
 'revision':111,'source':'User reference map 2026-10-20; reviewed coast trace, beach cells and authored interior terrain',
 'places':places,'restStops':[dict(id=i,name=n,cell=p,type=t) for i,n,p,t in stops],
 'roads':roads,'bridgeWaterCells':bridgeWater,'decorations':objects,'forestRegions':[n for n,_ in forests],
 'mountainRegions':[n for n,_ in mountains],
 'assetGaps':['snow-capped mountain group compatible with current art (legacy snowMountain.png candidate exists)','brown bare mountain group','conifer tree group','cherry blossom tree','connected coastal cliff faces','harbor pier and boat','large connected waterfall and rock face']})
Path('js/field-terrain.js').write_text('window.YK_FIELD_TERRAIN='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'objects':len(objects),'forest':sum(o.get('biome')=='forest' for o in objects),'mountains':sum(o.get('biome')=='mountain' for o in objects),'crossings':crossings,'roads':[len(r) for r in roads]},ensure_ascii=False))

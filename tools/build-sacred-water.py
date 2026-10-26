"""Deterministic sanctuary study using repository artwork only. No generated art.
32px cells; explicit route/occupancy; shared elevation outlines; independent scene.
Run from repo root: python3 tools/build-sacred-water.py
"""
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance
from pathlib import Path
import numpy as np,json,math,random,subprocess
random.seed(94)
OUT=Path('assets/maps/sacred-water-v1');OUT.mkdir(parents=True,exist_ok=True)
for old in OUT.glob('*.png'):old.unlink()
W,H=1024,832;COLS,ROWS=32,26;T=32
load=lambda p:Image.open(p).convert('RGBA')
atlas=load('assets/maps/world-atlas-v15.32.png')
# Reviewed image rectangles only. They never supply contact or collision cells.
rects={'grove':(0,0,357,287),'pine':(363,0,722,292),'tree':(728,0,1086,286),'sakura':(1090,0,1431,289),'rock':(0,291,358,545),'ravine':(362,293,727,547),'mountain':(731,286,1086,544),'falls':(0,805,358,1099),'lamp':(1095,810,1431,1099)}
def art(k,w):
 im=atlas.crop(rects[k]);b=im.getbbox();im=im.crop(b);return im.resize((w,round(im.height*w/im.width)),Image.Resampling.NEAREST)
# Outer shores, inset terraces, and isolated rock islands are separate heights.
levels=[[0]*COLS for _ in range(ROWS)]
for y in range(ROWS):
 for x in range(COLS):
  edge=4+round(1.4*math.sin(y*.55)+.8*math.sin(y*1.8))
  if x<edge or x>=COLS-edge or (y<3 and not 13<=x<=18):levels[y][x]=2 if x<edge-2 or x>=COLS-edge+2 or y<1 else 1
  if y>=23 and (x<12 or x>19):levels[y][x]=1
islands=[(9,8),(22,8),(10,13),(21,13),(10,18),(21,18),(5,12),(27,16),(7,19),(25,11)]
for cx,cy in islands:
 for dy in (-1,0):
  for dx in (-1,0,1):levels[cy+dy][cx+dx]=1
# Central dry landing and a physically continuous submerged causeway at level 0.
walk=[[x,y] for y in range(5,26) for x in range(14,18)]
walk += [[x,y] for y in (6,7,8) for x in range(12,20)]
walk += [[x,y] for y in (22,23,24,25) for x in range(12,20)]
walk=list(dict.fromkeys(map(tuple,walk)));walk=[list(p) for p in walk]
terrain=[['grass' if levels[y][x] else 'sea' for x in range(COLS)] for y in range(ROWS)]
for x,y in walk:terrain[y][x]='road';levels[y][x]=0
# Two gate posts at each side; central opening is two full movement cells.
occupied=[[13,7],[18,7],[13,23],[18,23]]
walk=[p for p in walk if p not in occupied]
model={'id':'sacred-water-v1','status':'prototype','width':COLS,'height':ROWS,'tileSize':32,'camera':'topdown-orthographic','spawn':[15,25],'goal':[15,5],'tiles':terrain,'heights':levels,'cornerCut':30,'occupiedTiles':occupied,'walkableCells':walk,'objects':[],'artSource':'assets/maps/world-atlas-v15.32.png'}
# Call the production model for the actual clipped polygons, not a new bevel rule.
js="global.window=global;require('./js/elevation-model.js');let d=JSON.parse(require('fs').readFileSync(0,'utf8')),m=d.tiles;m.heights=d.heights;m.cornerCut=30;YK_ELEVATION.prepare(m);process.stdout.write(JSON.stringify(m.map((r,y)=>r.map((_,x)=>YK_ELEVATION.outline(m,x,y)))));"
polys=json.loads(subprocess.run(['node','-e',js],input=json.dumps(model),text=True,capture_output=True,check=True).stdout)
yy,xx=np.mgrid[0:H,0:W];dist=np.abs(xx-W/2)
# World phase textures: no random per-tile rotation or visible checkerboard.
def tiled(im):
 cv=Image.new('RGBA',(W,H))
 for y in range(0,H,im.height):
  for x in range(0,W,im.width):cv.alpha_composite(im,(x,y))
 return cv
water=load('assets/animation/fluid-v1/field-water.png')
pebbles=load('assets/settlement-editor/pack-v1/cobble.png')
base=Image.new('RGBA',(W,H));bed=tiled(pebbles.resize((64,64),Image.Resampling.NEAREST));a=np.asarray(bed).copy().astype(float)
gray=a[:,:,:3].mean(axis=2);light=np.exp(-(dist/135)**2)
# Clear shallows reveal real stone texture beneath tint; deeper water hides it.
for c,mul,offset in [(0,.30,25),(1,.52,96),(2,.44,96)]:a[:,:,c]=gray*mul+offset
bed=Image.fromarray(np.uint8(np.clip(a,0,255)),'RGBA')
# Actual approved pebble silhouettes, deterministically laid along the shallow bed.
pebble=load('assets/settlement-editor/pack-v1/stepping_stone.png').crop((7,18,25,32))
pa=np.array(pebble);g=pa[:,:,:3].mean(axis=2)
for c,mul,off in [(0,.65,35),(1,.69,75),(2,.42,70)]:pa[:,:,c]=np.uint8(np.clip(g*mul+off,0,255))
pebble=Image.fromarray(pa)
for y in range(105,765,15):
 for x in range(417,610,20):
  px=x+random.randint(-7,7);py=y+random.randint(-5,5)
  im=pebble.resize((random.randint(16,24),random.randint(11,17)),Image.Resampling.NEAREST)
  bed.alpha_composite(im,(px,py))
for phase in (0,1):
 wim=tiled(water.crop((64*phase,0,64*(phase+1),64)));wa=np.asarray(wim).copy().astype(float);g=wa[:,:,:3].mean(axis=2)
 for c,mul,off in [(0,.20,1),(1,.65,21),(2,.80,36)]:wa[:,:,c]=g*mul+off
 sea=Image.fromarray(np.uint8(np.clip(wa,0,255)),'RGBA')
 # Depth blends are continuous over world coordinates, with a broad illuminated path.
 mask=Image.fromarray(np.uint8(np.clip(light*(.91+.04*np.sin(yy*.025))*255,0,240)),'L');scene=Image.composite(bed,sea,mask)
 # Fine existing surface highlights over the underwater stone; only water animates.
 overlay=wim.copy();oa=np.array(overlay);oa[:,:,3]=48;overlay=Image.fromarray(oa);scene.alpha_composite(overlay)
 scene.save(OUT/f'water-{phase}.png')
# One immutable terrain layer, with stone faces below raised grass polygons.
land=Image.new('RGBA',(W,H));draw=ImageDraw.Draw(land);grass=tiled(load('assets/terrain/grass-v1/grass.png'))
cliff=load('assets/terrain/cliffs-v1/grass-cliff-32.png');ca=np.array(cliff);lum=ca[:,:,:3].mean(axis=2)
for c,mul,off in [(0,.57,20),(1,.61,23),(2,.63,29)]:ca[:,:,c]=np.uint8(lum*mul+off)
cliff=Image.fromarray(ca);stone=tiled(cliff)
# Top and front faces share the exact production outline. 12px per height unit.
for y in range(ROWS):
 for x in range(COLS):
  h=levels[y][x]
  if not h:continue
  p=[(x*32+u,y*32+v-h*22) for u,v in polys[y][x]['polygon']]
  mask=Image.new('L',(W,H));md=ImageDraw.Draw(mask);md.polygon(p,fill=255)
  # Frontal and diagonal faces; all outer walls read as the same stone material.
  for i,(ax,ay) in enumerate(p):
   bx,by=p[(i+1)%len(p)]
   if bx>ax:
    floor=0 if y==ROWS-1 else levels[y+1][x]
    drop=max(0,h-floor)*22
    if drop:
     face=[(ax,ay),(bx,by),(bx,by+drop),(ax,ay+drop)];fm=Image.new('L',(W,H));ImageDraw.Draw(fm).polygon(face,fill=255);land.alpha_composite(Image.composite(stone,Image.new('RGBA',(W,H)),fm));draw=ImageDraw.Draw(land);draw.line(face[:2],fill='#c0be96',width=1);draw.line(face[2:],fill='#172f36',width=2)
  land.alpha_composite(Image.composite(stone if any(abs(x-cx)<=1 and cy-1<=y<=cy for cx,cy in islands) else grass,Image.new('RGBA',(W,H)),mask))
# Dry entrance preserves the central path and does not share any old map coordinates.
dirt=tiled(load('assets/settlement-editor/pack-v1/cobble.png'))
dm=Image.new('L',(W,H));dd=ImageDraw.Draw(dm);dd.polygon([(440,735),(584,735),(628,832),(396,832)],fill=255)
land.alpha_composite(Image.composite(dirt,Image.new('RGBA',(W,H)),dm))
land.save(OUT/'terrain.png')
objects=[]
def obj(kind,cx,foot,width,contact=None):
 im=art(kind,width);name=f'{kind}-{width}.png';im.save(OUT/name);objects.append({'id':f'{kind}-{len(objects)}','src':f'assets/maps/sacred-water-v1/{name}','x':round(cx-im.width/2),'y':round(foot-im.height),'width':im.width,'height':im.height,'depth':foot,'occupiedTiles':contact or [],'kind':kind})
# Dense framing, with varied silhouettes, honest overlap and open central water.
for side in (0,1):
 for y in range(-10,855,96):
  for j in (0,1):
   cx=(25+j*65+random.randint(-18,18)) if side==0 else W-(25+j*65+random.randint(-18,18))
   obj('pine' if (y//96+j)%3==0 else 'grove',cx,y+80,130)
 for y in (110,355,620,790):obj('sakura',95 if side==0 else W-95,y,115)
for x in (230,345,690,800):obj('grove',x,70,150)
for side in (0,1):
 for cy in range(90,780,80):obj('grove',random.randint(112,150) if side==0 else W-random.randint(112,150),cy,105)
# Rocks soften grid shores without becoming the terrain collision source.
for x,y,w in [(150,230,110),(860,280,115),(172,510,104),(865,580,98),(195,707,100),(820,725,110),(220,88,130),(790,110,125)]:obj('rock',x,y,w)
# Existing complete waterfall sprites: no hand-painted white streak substitute.
obj('falls',272,191,160);obj('falls',842,214,118)
for cx,cy in islands[:6]:
 obj('tree',cx*32+5,cy*32-3,70)
 obj('lamp',cx*32+16,(cy+1)*32-12,78)
for cx,cy in islands[6:]:obj('mountain',cx*32+16,(cy+1)*32,68)
# The gate shares visible width, ground anchors and explicit post-only occupancy.
gate=load('assets/maps/tenyo/layer-torii-upper.png');gate.alpha_composite(load('assets/maps/tenyo/layer-torii-base.png'));gate=gate.crop((620,440,940,700)).resize((192,160),Image.Resampling.NEAREST);gate.save(OUT/'gate.png')
for y in (7,23):
 objects.append({'id':f'gate-{y}','src':'assets/maps/sacred-water-v1/gate.png','x':416,'y':(y+1)*32-160,'width':192,'height':160,'depth':(y+1)*32,'occupiedTiles':[[13,y],[18,y]],'kind':'gate'})
# Forecourt lanterns reused directly from the atlas, including their illustrated rock base.
obj('lamp',393,790,86);obj('lamp',631,790,86)
model['objects']=objects
(OUT/'scene.json').write_text(json.dumps(model,ensure_ascii=False,indent=2))
# Lantern bloom and vertical water reflections: visual effects, never geometry.
for phase in (0,1):
 surface=load(str(OUT/f'water-{phase}.png'));fx=Image.new('RGBA',(W,H));fd=ImageDraw.Draw(fx)
 for o in objects:
  if o['kind']!='lamp':continue
  cx=o['x']+o['width']*.46;cy=o['y']+o['height']*.46
  for r in range(26,0,-2):fd.ellipse((cx-r,cy-r,cx+r,cy+r),fill=(255,190,55,round((1-r/28)*30)))
  for k in range(12):
   sy=o['depth']+9+k*4;half=max(1,7-k//3)+((k+phase)%3);cx+=math.sin(k*3.1+phase)*2
   fd.line((cx-half,sy,cx+half,sy),fill=(255,204,102,max(0,100-k*4)),width=1)
 surface.alpha_composite(fx);surface.save(OUT/f'water-{phase}.png')
# Compose a static frame from exactly the runtime layers and sort anchors.
preview=load(str(OUT/'water-0.png'));preview.alpha_composite(land)
for o in sorted(objects,key=lambda o:o['depth']):preview.alpha_composite(load(o['src']),(o['x'],o['y']))
preview.convert('RGB').save(OUT/'overview.png')
print(json.dumps({'output':str(OUT),'pixels':[W,H],'cells':[COLS,ROWS],'objects':len(objects),'walkCells':len(walk),'sharedElevation':True}))

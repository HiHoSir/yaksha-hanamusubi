#!/usr/bin/env python3
"""Independent chips to assemble a raised shop corner; reference screenshot is not copied."""
from PIL import Image,ImageDraw
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];P=R/'assets/interior-editor/layout-kit-v1';P.mkdir(parents=True,exist_ok=True)
def read(p):return Image.open(R/p).convert('RGBA')
def norm(im):
 a=im.getchannel('A').point(lambda v:255 if v>=128 else 0);rgb=im.convert('RGB').quantize(colors=32,method=Image.Quantize.MEDIANCUT).convert('RGBA');rgb.putalpha(a);return rgb
canon=read('design-reference/maps/topview-v1/cyamise-approved.png')
def make_pair(name,box,poly,size,at):
 im=canon.crop(box);a=Image.new('L',im.size);ImageDraw.Draw(a).polygon(poly,fill=255);im.putalpha(a);im=norm(im.resize(size,Image.Resampling.NEAREST));o=Image.new('RGBA',(64,32));o.alpha_composite(im,at);o.save(P/(name+'-64x32.png'))
 for i,n in enumerate(['l','r']):o.crop((i*32,0,i*32+32,32)).save(P/(name+'_'+n+'.png'))
make_pair('red_bench',(77,102,150,131),[(4,0),(69,0),(72,6),(72,23),(68,28),(4,28),(0,23),(0,6)],(62,25),(1,6))
make_pair('counter',(99,35,169,72),[(3,0),(65,0),(69,4),(69,31),(65,36),(3,36),(0,31),(0,4)],(60,31),(2,0))
fence=norm(read('assets/settlement-editor/chips/fence.png'));strip=fence.crop((2,8,30,23));base=Image.new('RGBA',(32,32));base.alpha_composite(strip,(2,12))
# Preserve illustrated endposts; fill the two-pixel outer margin with adjacent beam pixels.
for y in range(32):
 for x in [0,1]:base.putpixel((x,y),base.getpixel((8,y)))
 for x in [30,31]:base.putpixel((x,y),base.getpixel((23,y)))
mid=base.copy()
for x in list(range(0,8))+list(range(24,32)):
 for y in range(32):mid.putpixel((x,y),base.getpixel((10+(x%10),y)))
left=base.copy();right=base.copy()
for x in range(24,32):
 for y in range(32):left.putpixel((x,y),mid.getpixel((x,y)))
for x in range(8):
 for y in range(32):right.putpixel((x,y),mid.getpixel((x,y)))
# Add balusters sampled from the same village post; all wood pixels remain source-derived.
post=fence.crop((2,9,6,22)).resize((3,10),Image.Resampling.NEAREST)
bar=fence.crop((8,13,24,16)).resize((32,3),Image.Resampling.NEAREST)
for im in [left,mid,right]:
 for x in [8,16,24]:im.alpha_composite(post,(x,16))
 im.alpha_composite(bar,(0,13));im.alpha_composite(bar,(0,25))
 for y in range(32):im.putpixel((31,y),im.getpixel((0,y)))
for n,im in [('rail_l',left),('rail_m',mid),('rail_r',right)]:im.save(P/(n+'.png'))
# A two-piece cupboard source is supplied separately; never synthesize a primitive stand-in.
cab=P/'drawer-32x64.png'
if cab.exists():
 im=read(str(cab.relative_to(R)));im.crop((0,0,32,32)).save(P/'drawer_upper.png');im.crop((0,32,32,64)).save(P/'drawer_lower.png')
w,h=14,13
layers={k:[None]*(w*h) for k in ['floor','structure','object','stairs','collision']};layers['floor']=['outside_black']*(w*h);layers['elevation']=[0]*(w*h)
def put(l,x,y,id):layers[l][y*w+x]=id
for y in range(1,h-1):
 for x in range(1,w-1):put('floor',x,y,'earth')
for y in range(1,7):
 for x in range(1,6):put('floor',x,y,'raised_wood');put('elevation',x,y,1)
for x in range(w):put('structure',x,0,'wall');put('structure',x,h-1,'wall')
for y in range(1,h-1):put('structure',0,y,'wall_side_l');put('structure',w-1,y,'wall_side_r')
put('structure',7,h-1,'opening');put('floor',7,h-1,'earth')
for x in [1,2,3]:put('object',x,1,'wall_drawer')
for x,id in [(3,'counter_l'),(4,'counter_r')]:put('object',x,4,id)
for x,id in [(1,'rail_l'),(2,'rail_r'),(4,'rail_l'),(5,'rail_r')]:put('object',x,6,id)
put('stairs',3,7,'stairs_m')
for x in [7,10]:
 for y in [4,7]:put('object',x,y,'red_bench_l');put('object',x+1,y,'red_bench_r')
for x,y,id in [(1,8,'village_firewood'),(1,9,'village_rice_bale'),(1,10,'village_basket'),(2,10,'village_basket'),(11,10,'village_pot'),(12,10,'village_pot')]:put('object',x,y,id)
layers['spawn']=[7,11];layers['exits']=[[7,12]]
sample={'schema':'yaksha-interior-editor-v1','tileSize':32,'width':w,'height':h,'room':'custom','layers':layers,'assets':[],'note':'Original village artwork kit; raised corner layout reference, not a copy of reference game pixels.'}
(P/'raised-shop-example.json').write_text(json.dumps(sample,ensure_ascii=False,indent=2)+'\n')
(P/'manifest.json').write_text(json.dumps({'tileSize':32,'status':'candidate; visual approval pending','category':'independent furniture and railing','parts':{'red_bench':['red_bench_l','red_bench_r'],'counter':['counter_l','counter_r'],'drawer':['wall_drawer'],'rail':['rail_l','rail_m','rail_r']},'assemblies':{'red_bench':{'size':[2,1],'occupiedTiles':[[0,0],[1,0]]},'counter':{'size':[2,1],'occupiedTiles':[[0,0],[1,0]]},'drawer':{'size':[1,1],'occupiedTiles':[[0,0]],'renderRect':[0,-32,32,64],'requires':'solid structure directly north'},'rail':{'size':[1,1],'occupiedTiles':[[0,0]]}},'source':'Adopted village fence and topview teahouse; original generated drawer only','rebuild':'python3 tools/build-interior-layout-kit.py'},ensure_ascii=False,indent=2)+'\n')
print('Built layout chips and example')

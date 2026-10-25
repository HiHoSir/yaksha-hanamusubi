#!/usr/bin/env python3
"""Rebuild interior candidates from adopted original art; no image generation.
Run from repository root. All crops and authored placement metadata are explicit.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parents[1]
def read(p):return Image.open(ROOT/p).convert('RGBA')
def resize(im,size):return im.resize(size,Image.Resampling.NEAREST)
out=ROOT/'assets/interior-editor/polish-v2';out.mkdir(parents=True,exist_ok=True)
canon=read('design-reference/maps/topview-v1/cyamise-approved.png')
old=read('assets/interior-editor/interior-atlas-9x1.png')
# A common palette comes from the actual village crate, house and accepted room.
refs=[read('assets/settlement-editor/chips/crate.png'),canon]
palette=Image.new('RGB',(384,352));palette.paste(canon.convert('RGB'),(0,0));palette.paste(refs[0].convert('RGB'),(0,320))
palette=palette.quantize(colors=48,method=Image.Quantize.MEDIANCUT)
def polish(im):
 alpha=im.getchannel('A').point(lambda x:255 if x>=128 else 0)
 rgb=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');rgb.putalpha(alpha);return rgb

def seamless(im):
 im=im.copy()
 for y in range(32):
  a,b=im.getpixel((0,y)),im.getpixel((31,y));c=tuple((a[k]+b[k])//2 for k in range(3))+(255,)
  im.putpixel((0,y),c);im.putpixel((31,y),c)
 for x in range(32):
  a,b=im.getpixel((x,0)),im.getpixel((x,31));c=tuple((a[k]+b[k])//2 for k in range(3))+(255,)
  im.putpixel((x,0),c);im.putpixel((x,31),c)
 return im
# Readable plank grain from the unobstructed central aisle, not procedural noise.
wood=seamless(polish(canon.crop((176,144,208,176))))
earth=seamless(old.crop((32,0,64,32)).convert('RGB').quantize(colors=12,method=Image.Quantize.MEDIANCUT).convert('RGBA'))
beam=polish(resize(canon.crop((112,18,144,27)),(32,8)))
# Remove end seams in horizontally connected beams.
for y in range(8):beam.putpixel((31,y),beam.getpixel((0,y)))
# Village house plaster, sampled above its window; mirror native pixels without stretching.
sample=read('assets/settlement-editor/chips/building_southwest_home.png').crop((15,55,24,59)).convert('L')
plaster=Image.new('RGBA',(32,20))
for y in range(20):
 for x in range(32):
  sx=x%18;sx=sx if sx<9 else 17-sx
  sy=y%8;sy=sy if sy<4 else 7-sy
  delta=round((sample.getpixel((sx,sy))-190)*.35/3)*3
  plaster.putpixel((x,y),tuple(max(0,min(255,v+delta)) for v in (220,198,158))+(255,))
for y in range(20):plaster.putpixel((31,y),plaster.getpixel((0,y)))
wall=Image.new('RGBA',(32,32));wall.paste(beam,(0,0));wall.paste(plaster,(0,8));wall.paste(beam.crop((0,4,32,8)),(0,28))
post=polish(resize(canon.crop((21,80,29,112)),(8,32)))
# Keep old architecture silhouette/placement; only replace material pixels.
pillar=wall.copy();pillar.paste(post,(0,0));left=pillar.copy();right=wall.copy();right.paste(post,(24,0))
# Existing illustrated stair shape is preserved and cleaned rather than replaced by rectangles.
steps=[polish(old.crop((i*32,0,(i+1)*32,32)).filter(ImageFilter.MedianFilter(3))) for i in (6,7,8)]
step=Image.new('RGBA',(32,32));step.alpha_composite(resize(steps[1].crop((0,8,32,32)),(28,21)),(2,0));steps[1]=step
atlas=Image.new('RGBA',(288,32))
for i,im in enumerate([wood,earth,wall,pillar,left,right,*steps]):atlas.paste(im,(i*32,0));im.save(out/(['wood','earth','wall','pillar','end_l','end_r','stairs_l','stairs_m','stairs_r'][i]+'.png'))
atlas.save(out/'interior-atlas-9x1.png')
# Object cutouts from canon, with deliberate alpha polygons; no floor color key.
def cut(name,box,polygon,size,at):
 im=canon.crop(box);mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon(polygon,fill=255);im.putalpha(mask);im=polish(resize(im,size));frame=Image.new('RGBA',(32,32));frame.alpha_composite(im,at);frame.save(out/(name+'.png'));return frame
cut('table',(77,132,150,188),[(4,0),(69,0),(72,7),(72,47),(67,55),(61,55),(61,49),(11,49),(11,55),(5,55),(0,47),(0,7)],(30,23),(1,8))
cut('cushion',(77,102,150,131),[(4,0),(69,0),(72,6),(72,23),(68,28),(4,28),(0,23),(0,6)],(30,12),(1,10))
cut('tea_set',(91,144,133,164),[(3,0),(35,0),(41,4),(41,19),(0,19),(0,4)],(27,13),(2,10))
# Sharpen the shelf's small goods by reusing the actual village pottery and basket.
shelf=read('assets/interior-editor/furniture-v1/shop-shelf-96x32.png')
for start,end in [(6,30),(66,90)]:
 for x in range(start,end):
  for y in range(14,27):shelf.putpixel((x,y),shelf.getpixel((44+(x%12),y)))
for name,size,at in [('chips/pot.png',(10,12),(8,14)),('chips/pot.png',(7,9),(21,17)),('pack-v1/basket.png',(11,9),(69,17)),('chips/pot.png',(8,11),(82,15))]:
 im=read('assets/settlement-editor/'+name);im=im.crop(im.getbbox());shelf.alpha_composite(resize(im,size),at)
shelf=polish(shelf)
# All module joins retain the same continuous beam column.
for x in [31,32,63,64]:shelf.paste(shelf.crop((48,0,49,32)),(x,0))
shelf.save(out/'shop-shelf-96x32.png')
for i,n in enumerate(['shelf_l','shelf_m','shelf_r']):shelf.crop((i*32,0,i*32+32,32)).save(out/(n+'.png'))
manifest={'status':'candidate; user visual approval and Safari pending','method':'deterministic reuse of adopted village and topview art, no generation','tileSize':32,'architectureIds':['wood','earth','wall','pillar','end_l','end_r','stairs_l','stairs_m','stairs_r'],'sourceAtlas':'assets/interior-editor/interior-atlas-9x1.png','sourceCanon':'design-reference/maps/topview-v1/cyamise-approved.png','script':'tools/polish-interior-assets.py','sideWalls':{'strip':[64,0,32,8],'leftX':24,'rightX':0},'objects':{n:{'image':[32,32],'occupiedTiles':[] if n in ['cushion','tea_set'] else [[0,0]],'contactY':31,'overhang':False} for n in ['table','cushion','tea_set','shelf_l','shelf_m','shelf_r']},'note':'Furniture sizes, authored maps, collision logic, movement and save keys unchanged; tea set shares existing object layer.'}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Built',out)

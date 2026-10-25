#!/usr/bin/env python3
"""Illustrated materials and furniture at authored scale; no 1-cell size cap."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
import json
R=Path(__file__).resolve().parents[1];P=R/'assets/interior-editor/quality-v1';P.mkdir(exist_ok=True)
def read(p):return Image.open(R/p).convert('RGBA')
def native(im,size,margin=1,colors=48):
    im=im.crop(im.getbbox());r=min((size[0]-margin*2)/im.width,(size[1]-margin*2)/im.height)
    im=im.resize((round(im.width*r),round(im.height*r)),Image.Resampling.NEAREST)
    alpha=im.getchannel('A').point(lambda v:255 if v>=128 else 0);im=im.convert('RGB').quantize(colors=colors,method=Image.Quantize.MEDIANCUT).convert('RGBA');im.putalpha(alpha)
    out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,(size[1]-im.height)//2));return out
def save(name,im):im.save(P/(name+'.png'));return im
mat=save('mushiro-320x192',native(read('assets/interior-editor/quality-v1/source/mushiro.png'),(320,192),2))
wood=read('assets/interior-editor/polish-v2/wood.png');floor=Image.new('RGBA',mat.size)
for y in range(0,192,32):
    for x in range(0,320,32):floor.alpha_composite(wood,(x,y))
floor.alpha_composite(mat);save('mushiro-floor-320x192',floor)

hearth=native(read('assets/interior-editor/quality-v1/source/irori.png'),(96,64),1)
cold=hearth.copy()
for y in range(18,45):
    for x in range(18,78):
        r,g,b,a=cold.getpixel((x,y))
        if r>120 and r>g*1.7 and r>b*2:cold.putpixel((x,y),(50+g//5,43+g//6,37+g//7,a))
save('irori-unlit-96x64',cold)
fire=read('assets/interior-editor/fire-v1/flame.png');atlas=Image.new('RGBA',(192,64))
for i in range(2):
    flame=fire.crop((i*32,0,i*32+32,32));flame=flame.crop(flame.getbbox()).resize((17,26),Image.Resampling.NEAREST)
    lit=hearth.copy();lit.alpha_composite(flame,(40,18));atlas.alpha_composite(lit,(i*96,0))
save('irori-lit-192x64',atlas)
save('zabuton-32x32',native(read('assets/interior-editor/quality-v1/source/zabuton.png'),(32,32),2,24))

# Restore the table's actual original detail instead of squeezing73px to30px.
canon=read('design-reference/maps/topview-v1/cyamise-approved.png');table=canon.crop((77,132,150,188));mask=Image.new('L',table.size)
ImageDraw.Draw(mask).polygon([(4,0),(69,0),(72,7),(72,47),(67,55),(61,55),(61,49),(11,49),(11,55),(5,55),(0,47),(0,7)],fill=255);table.putalpha(mask)
save('low-table-64x64',native(table,(64,64),1))
save('weapon-rack-96x32',native(read('assets/interior-editor/completion-v1/source/weapon_rack.png'),(96,32),1))
armor=native(read('assets/interior-editor/completion-v1/source/armor_display.png'),(32,48),1)
stand=Image.new('RGBA',(32,64));stand.alpha_composite(armor,(0,16));save('armor-32x64',stand)

# Tatami uses illustrated long fibers, not a two-color checker formula.
fiber=mat.crop((53,50,81,82)).convert('RGB');fiber=ImageOps.colorize(ImageOps.grayscale(fiber),'#686b3e','#b4b385').convert('RGBA')
t=Image.new('RGBA',(64,32))
for y in range(32):
    for x in range(64):t.putpixel((x,y),fiber.getpixel((x%28,y%32)))
binding=mat.crop((7,25,10,165)).resize((64,3),Image.Resampling.NEAREST).convert('RGB');binding=ImageOps.colorize(ImageOps.grayscale(binding),'#354537','#637054').convert('RGBA')
t.alpha_composite(binding,(0,0));t.alpha_composite(binding.transpose(Image.Transpose.FLIP_TOP_BOTTOM),(0,29));save('tatami-64x32',t)
v=t.transpose(Image.Transpose.ROTATE_270);save('tatami-32x64',v)
for i,n in enumerate(['l','r']):save('tatami_'+n,t.crop((i*32,0,i*32+32,32)))
for i,n in enumerate(['u','d']):save('tatami_'+n,v.crop((0,i*32,32,i*32+32)))
entries=[]
for y in range(6):
    for x in range(10):entries.append(dict(id=f'mushiro_{x}_{y}',name='ムシロ内部',layer='floor',walk=True,elevation=1,legacy=True,src='assets/interior-editor/quality-v1/mushiro-floor-320x192.png?v=quality-v1',crop=[x*32,y*32,32,32]))
entries.append(dict(id='mushiro_whole',name='ムシロ・一枚（大）',layer='floor',walk=True,elevation=1,span=[10,6],parts=[[x,y,f'mushiro_{x}_{y}'] for y in range(6) for x in range(10)],src='assets/interior-editor/quality-v1/mushiro-floor-320x192.png?v=quality-v1'))
for id,name,src,span in [('irori_lit','囲炉裏・点火（四方枠）','irori-lit-192x64',[3,2]),('irori_unlit','囲炉裏・消火（四方枠）','irori-unlit-96x64',[3,2]),('low_table','座卓（原画の細部を維持）','low-table-64x64',[2,2]),('weapon_rack_large','刀・槍の武器掛け','weapon-rack-96x32',[3,1])]:
    e=dict(id=id,name=name,layer='object',walk=False,span=span,occupiedTiles=[[x,y] for y in range(span[1]) for x in range(span[0])],src='assets/interior-editor/quality-v1/'+src+'.png?v=quality-v1')
    if id=='irori_lit':e.update(frames=[[0,0,96,64],[96,0,96,64]],crop=[0,0,96,64])
    entries.append(e)
entries.append(dict(id='armor_wall_display',name='鎧飾り（壁際）',layer='object',walk=False,occupiedTiles=[[0,0]],requiresWall=True,renderRect=[0,-32,32,64],src='assets/interior-editor/quality-v1/armor-32x64.png?v=quality-v1'))
(P/'catalog.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
(P/'manifest.json').write_text(json.dumps(dict(status='revised candidate, visual approval pending',tileSize=32,noFixedObjectCellCap=True,matSize=[320,192],iroriSize=[96,64],tableSize=[64,64],weaponRackSize=[96,32],source='three original illustrations; adopted project table, rack and armor; original sources retained',rebuild='python3 tools/build-interior-quality.py'),indent=2)+'\n')
print('Built illustrated mat, hearth, cushion, table, tatami and larger weapon display')

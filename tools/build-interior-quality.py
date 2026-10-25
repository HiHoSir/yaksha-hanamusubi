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
wood=read('assets/interior-editor/polish-v2/wood.png')
# Only interior straw is sampled. The previous bound perimeter is never reused.
base=mat.crop((64,64,96,96));variants={}
for j in range(32):
    for a,b in [((0,j),(31,j)),((j,0),(j,31))]:
        ca,cb=base.getpixel(a),base.getpixel(b);color=tuple((ca[k]+cb[k])//2 for k in range(4));base.putpixel(a,color);base.putpixel(b,color)
corners=[(0,0),(31,0),(0,31),(31,31)];color=tuple(sum(base.getpixel(v)[k] for v in corners)//4 for k in range(4))
for corner in corners:base.putpixel(corner,color)
for name,x in [('c',64),('c2',128),('c3',192)]:
    tile=mat.crop((x,64,x+32,96))
    for j in range(32):
        for edge in [(0,j),(31,j),(j,0),(j,31)]:tile.putpixel(edge,base.getpixel(edge))
    variants[name]=tile
roles={'c':'','c2':'','c3':'','n':'n','s':'s','w':'w','e':'e','nw':'nw','ne':'ne','sw':'sw','se':'se'}
rag=[0,2,1,3,1,0,2,1,3,2,0,1,2,3,1,0,2,1,0,3,2,1,3,0,1,2,0,3,1,2,1,0]
for name,edges in roles.items():
    tile=variants.get(name,base).copy()
    for y in range(32):
        for x in range(32):
            if ('n' in edges and y<rag[x]) or ('s' in edges and 31-y<rag[(x+9)%32]) or ('w' in edges and x<rag[(y+5)%32]) or ('e' in edges and 31-x<rag[(y+17)%32]):
                r,g,b,_=tile.getpixel((x,y));tile.putpixel((x,y),(r,g,b,0))
    save('mushiro_'+name,tile)
    background=wood.copy();background.alpha_composite(tile);save('mushiro_floor_'+name,background)
floor=Image.new('RGBA',(320,192))
for y in range(6):
    for x in range(10):
        edge=('n' if y==0 else 's' if y==5 else '')+('w' if x==0 else 'e' if x==9 else '')
        role=edge or ['c','c2','c3'][(x//2+2*(y//2))%3]
        floor.alpha_composite(read('assets/interior-editor/quality-v1/mushiro_floor_'+role+'.png'),(x*32,y*32))
save('mushiro-floor-320x192',floor)

hearth=native(read('assets/interior-editor/quality-v1/source/irori-topdown.png'),(32,32),1)
cold=hearth.copy()
for y in range(7,25):
    for x in range(7,25):
        r,g,b,a=cold.getpixel((x,y))
        if r>120 and r>g*1.7 and r>b*2:cold.putpixel((x,y),(50+g//5,43+g//6,37+g//7,a))
save('irori-unlit-32x32',cold)
fire=read('assets/interior-editor/fire-v1/flame.png');atlas=Image.new('RGBA',(64,32))
for i in range(2):
    flame=fire.crop((i*32,0,i*32+32,32));flame=flame.crop(flame.getbbox()).resize((10,16),Image.Resampling.NEAREST)
    lit=hearth.copy();lit.alpha_composite(flame,(11,8));atlas.alpha_composite(lit,(i*32,0))
save('irori-lit-64x32',atlas)
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
    for x in range(10):entries.append(dict(id=f'mushiro_{x}_{y}',name='ムシロ内部',layer='floor',walk=True,elevation=1,legacy=True,src='assets/interior-editor/quality-v1/mushiro-floor-320x192.png?v=patchwork-v1',crop=[x*32,y*32,32,32]))
entries.append(dict(id='mushiro_whole',name='ムシロ・旧一式（互換）',legacy=True,layer='floor',walk=True,elevation=1,span=[10,6],parts=[[x,y,f'mushiro_{x}_{y}'] for y in range(6) for x in range(10)],src='assets/interior-editor/quality-v1/mushiro-floor-320x192.png?v=patchwork-v1'))
labels={'c':'中央','c2':'中央・つぎはぎ2','c3':'中央・つぎはぎ3','n':'上端','s':'下端','w':'左端','e':'右端','nw':'左上','ne':'右上','sw':'左下','se':'右下'}
for raised in [False,True]:
    for role,label in labels.items():
        entries.append(dict(id=('raised_mushiro_' if raised else 'mushiro_')+role,name=('高床・' if raised else '')+'ムシロ・'+label,layer='floor',walk=True,elevation=1 if raised else 0,src='assets/interior-editor/quality-v1/mushiro_floor_'+role+'.png?v=patchwork-v1'))
for id,name,src,span in [('irori_lit','囲炉裏・点火（真上・1マス）','irori-lit-64x32',[1,1]),('irori_unlit','囲炉裏・消火（真上・1マス）','irori-unlit-32x32',[1,1]),('low_table','座卓（原画の細部を維持）','low-table-64x64',[2,2]),('weapon_rack_large','刀・槍の武器掛け','weapon-rack-96x32',[3,1])]:
    e=dict(id=id,name=name,layer='object',walk=False,span=span,occupiedTiles=[[x,y] for y in range(span[1]) for x in range(span[0])],src='assets/interior-editor/quality-v1/'+src+'.png?v=quality-v1')
    if id=='irori_lit':e.update(frames=[[0,0,32,32],[32,0,32,32]],crop=[0,0,32,32])
    entries.append(e)
entries.append(dict(id='armor_wall_display',name='鎧飾り（壁際）',layer='object',walk=False,occupiedTiles=[[0,0]],requiresWall=True,renderRect=[0,-32,32,64],src='assets/interior-editor/quality-v1/armor-32x64.png?v=quality-v1'))
(P/'catalog.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
(P/'manifest.json').write_text(json.dumps(dict(status='revised candidate, visual approval pending',tileSize=32,noFixedObjectCellCap=True,matSize=[320,192],mushiroModuleSize=[32,32],mushiroBorder="raw-cut, no bound rim",iroriSize=[32,32],iroriView="topdown",iroriOccupiedTiles=[[0,0]],tableSize=[64,64],weaponRackSize=[96,32],source='three original illustrations; adopted project table, rack and armor; original sources retained',rebuild='python3 tools/build-interior-quality.py'),indent=2)+'\n')
print('Built illustrated mat, hearth, cushion, table, tatami and larger weapon display')

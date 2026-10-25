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
# Original coarse horizontal straw source; the old fine-woven rug is not sampled.
# Quantize to an authored seven-tone village palette, then work at native pixels.
coarse=read('assets/interior-editor/quality-v1/source/mushiro-coarse.png').resize((96,96),Image.Resampling.NEAREST)
palette=[(76,65,26),(103,88,31),(127,109,36),(149,130,43),(165,145,52),(178,158,62),(189,171,76)]
gray=ImageOps.grayscale(coarse);lo,hi=gray.getextrema()
for y in range(96):
    for x in range(96):
        level=min(6,max(0,int((gray.getpixel((x,y))-lo)*7/(hi-lo+1))))
        coarse.putpixel((x,y),(*palette[level],255))
base=coarse.crop((0,0,32,32));variants={}
# Shared 2px material bands preserve continuity while interiors vary.
for j in range(32):
    base.putpixel((31,j),base.getpixel((0,j)))
    base.putpixel((j,31),base.getpixel((j,0)))
for corner in [(0,0),(31,0),(0,31),(31,31)]:base.putpixel(corner,base.getpixel((0,0)))
for name,xx,yy in [('c',0,0),('c2',32,32),('c3',64,64)]:
    tile=coarse.crop((xx,yy,xx+32,yy+32))
    for y in range(32):
        for x in range(32):
            if x<2 or x>=30 or y<2 or y>=30:tile.putpixel((x,y),base.getpixel((x,y)))
    variants[name]=tile
roles={'c':'','c2':'','c3':'','n':'n','s':'s','w':'w','e':'e','nw':'nw','ne':'ne','sw':'sw','se':'se'}
# Grouped loose straw ends, rather than a decorative binding or a sawtooth rim.
rag=[1,1,3,3,2,2,0,0,2,2,4,4,1,1,0,0,3,3,1,1,2,2,0,0,4,4,2,2,1,1,0,0]
for name,edges in roles.items():
    tile=variants.get(name,base).copy()
    for y in range(32):
        for x in range(32):
            cut=(('n' in edges and y<rag[x]//2) or ('s' in edges and 31-y<rag[x]) or ('w' in edges and x<rag[(y+6)%32]//2) or ('e' in edges and 31-x<rag[(y+18)%32]//2))
            r,g,b,a=tile.getpixel((x,y))
            if cut:tile.putpixel((x,y),(r,g,b,0))
            elif 's' in edges and (y>=29 or (x%7<3 and y>=25+rag[x]//2)):
                # Uneven hanging tips have a short dark underside, not a frame.
                tile.putpixel((x,y),(int(r*.60),int(g*.60),int(b*.60),a))
    save('mushiro_'+name,tile)
    background=wood.copy();background.alpha_composite(tile);save('mushiro_floor_'+name,background)
def patch_role(x,y):
    # Three raw-cut panels across, two rows; irregular internal vertical joins.
    row=y//3;cuts=[0,4,7,10] if row==0 else [0,3,6,10]
    left=max(v for v in cuts if v<=x);right=min(v for v in cuts if v>x)
    edge=('n' if y%3==0 else 's' if y%3==2 else '')+('w' if x==left else 'e' if x==right-1 else '')
    return edge or ['c','c2','c3'][(left+row)%3]
floor=Image.new('RGBA',(320,192))
for y in range(6):
    for x in range(10):floor.alpha_composite(read('assets/interior-editor/quality-v1/mushiro_floor_'+patch_role(x,y)+'.png'),(x*32,y*32))
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
    for x in range(10):entries.append(dict(id=f'mushiro_{x}_{y}',name='ムシロ内部',layer='floor',walk=True,elevation=1,legacy=True,src='assets/interior-editor/quality-v1/mushiro-floor-320x192.png?v=coarse-straw-v2',crop=[x*32,y*32,32,32]))
entries.append(dict(id='mushiro_whole',name='ムシロ・旧一式（互換）',legacy=True,layer='floor',walk=True,elevation=1,span=[10,6],parts=[[x,y,f'mushiro_{x}_{y}'] for y in range(6) for x in range(10)],src='assets/interior-editor/quality-v1/mushiro-floor-320x192.png?v=coarse-straw-v2'))
labels={'c':'中央','c2':'中央・つぎはぎ2','c3':'中央・つぎはぎ3','n':'上端','s':'下端','w':'左端','e':'右端','nw':'左上','ne':'右上','sw':'左下','se':'右下'}
for raised in [False,True]:
    for role,label in labels.items():
        entries.append(dict(id=('raised_mushiro_' if raised else 'mushiro_')+role,name=('高床・' if raised else '')+'ムシロ・'+label,layer='floor',walk=True,elevation=1 if raised else 0,src='assets/interior-editor/quality-v1/mushiro_floor_'+role+'.png?v=coarse-straw-v2'))
for id,name,src,span in [('irori_lit','囲炉裏・点火（真上・1マス）','irori-lit-64x32',[1,1]),('irori_unlit','囲炉裏・消火（真上・1マス）','irori-unlit-32x32',[1,1]),('low_table','座卓（原画の細部を維持）','low-table-64x64',[2,2]),('weapon_rack_large','刀・槍の武器掛け','weapon-rack-96x32',[3,1])]:
    e=dict(id=id,name=name,layer='object',walk=False,span=span,occupiedTiles=[[x,y] for y in range(span[1]) for x in range(span[0])],src='assets/interior-editor/quality-v1/'+src+'.png?v=quality-v1')
    if id=='irori_lit':e.update(frames=[[0,0,32,32],[32,0,32,32]],crop=[0,0,32,32])
    entries.append(e)
entries.append(dict(id='armor_wall_display',name='鎧飾り（壁際）',layer='object',walk=False,occupiedTiles=[[0,0]],requiresWall=True,renderRect=[0,-32,32,64],src='assets/interior-editor/quality-v1/armor-32x64.png?v=quality-v1'))
(P/'catalog.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
(P/'manifest.json').write_text(json.dumps(dict(status='revised candidate, visual approval pending',tileSize=32,noFixedObjectCellCap=True,matSize=[320,192],mushiroModuleSize=[32,32],mushiroBorder="coarse horizontal straw; raw overlapping cut ends; no bound rim",iroriSize=[32,32],iroriView="topdown",iroriOccupiedTiles=[[0,0]],tableSize=[64,64],weaponRackSize=[96,32],source='three original illustrations; adopted project table, rack and armor; original sources retained',rebuild='python3 tools/build-interior-quality.py'),indent=2)+'\n')
print('Built illustrated mat, hearth, cushion, table, tatami and larger weapon display')

#!/usr/bin/env python3
"""Two-frame water textures; preserve shore/stone alpha and authored geometry."""
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageDraw
import subprocess,json
R=Path(__file__).resolve().parents[1];P=R/'assets/animation/fluid-v1';P.mkdir(parents=True,exist_ok=True)
def read(p):return Image.open(R/p).convert('RGBA')
def pair(name,a,b,vertical=False):
    out=Image.new('RGBA',(a.width,a.height*2) if vertical else (a.width*2,a.height));out.paste(a,(0,0));out.paste(b,(0,a.height) if vertical else (a.width,0));out.save(P/(name+'.png'))
    return dict(file=name+'.png',frames=2,frameSize=list(a.size),layout='vertical' if vertical else 'horizontal',frameMs=360)
def moving_water(im,mask,dx,dy):
    # Color classification is visual-only; collision never uses these masks.
    out=im.copy();mask=mask.filter(ImageFilter.MinFilter(5))
    for y in range(im.height):
        for x in range(im.width):
            sx,sy=x-dx,y-dy
            if 0<=sx<im.width and 0<=sy<im.height and mask.getpixel((x,y)) and mask.getpixel((sx,sy)):
                r,g,b,_=im.getpixel((sx,sy));out.putpixel((x,y),(r,g,b,im.getpixel((x,y))[3]))
    return out
items=[]
water=read('assets/terrain/landscape-v1/water.png');items.append(pair('field-water',water,ImageChops.offset(water,2,1)))
small=read('assets/settlement-editor/terrain-v1/water-source.png');shift=ImageChops.offset(small,2,1)
for y in range(32):shift.putpixel((31,y),shift.getpixel((0,y)))
for x in range(32):shift.putpixel((x,31),shift.getpixel((x,0)))
items.append(pair('water-surface',small,shift))
river=read('assets/settlement-editor/terrain-v1/river-47.png');other=river.copy()
program="const A=require('./js/settlement-map/autotile.js');console.log(JSON.stringify(A.masks.map(m=>({index:A.indices[m],inside:Array.from({length:1024},(_,i)=>A.core(m,i%32,Math.floor(i/32))&&[[0,1],[0,-1],[1,0],[-1,0]].every(([x,y])=>A.core(m,i%32+x,Math.floor(i/32)+y)))}))));"
for tile in json.loads(subprocess.check_output(['node','-e',program],cwd=R,text=True)):
    ox,oy=tile['index']%8*32,tile['index']//8*32
    for i,inside in enumerate(tile['inside']):
        if inside:other.putpixel((ox+i%32,oy+i//32),shift.getpixel((i%32,i//32)))
items.append(pair('river-47',river,other,True))
pond=read('assets/interior-editor/completion-v1/garden_pond.png');mask=Image.new('L',pond.size)
for y in range(pond.height):
    for x in range(pond.width):
        r,g,b,a=pond.getpixel((x,y))
        if a and g>r*1.2 and b>r*1.1:mask.putpixel((x,y),255)
mask.save(P/'pond-water-mask.png');items.append(pair('garden-pond',pond,moving_water(pond,mask,2,1)))
fall=read('assets/terrain/quarter-v1/waterfall.png');mask=Image.new('L',fall.size);d=ImageDraw.Draw(mask)
d.polygon([(39,14),(49,19),(51,28),(48,47),(54,72),(45,82),(27,78),(30,64),(35,45),(33,29)],fill=255)
# Keep the explicitly authored cascade polygon and all external rocks fixed.
mask.save(P/'waterfall-water-mask.png');items.append(pair('waterfall',fall,moving_water(fall,mask,0,3)))
(P/'manifest.json').write_text(json.dumps(dict(tileSize=32,policy='two frames by default; no geometry/collision changes',assets=items),indent=2)+'\n')
print('Built 5 two-frame fluid atlases')

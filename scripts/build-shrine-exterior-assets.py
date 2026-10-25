"""Normalize the two generated sources; keep contact data separate from alpha."""
import argparse
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
def normalize(path,size,visible):
    im=Image.open(path).convert('RGBA')
    alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
    im.putalpha(alpha);im=im.crop(alpha.getbbox())
    scale=min(visible[0]/im.width,visible[1]/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
    alpha=im.getchannel('A');rgb=im.convert('RGB').quantize(colors=32,method=Image.Quantize.MEDIANCUT).convert('RGBA');rgb.putalpha(alpha)
    out=Image.new('RGBA',size);out.alpha_composite(rgb,((size[0]-rgb.width)//2,size[1]-rgb.height))
    return out
def build(torii,basin):
    out=ROOT/'assets/settlement-editor/shrine-v1';out.mkdir(parents=True,exist_ok=True)
    gate=normalize(torii,(96,96),(92,92));gate.save(out/'torii.png')
    water=normalize(basin,(32,32),(28,26));water.save(out/'temizu-preview.png')
    second=water.copy();p=water.load();q=second.load();changed=[]
    for y in range(32):
        row=[x for x in range(32) if p[x,y][3] and p[x,y][2]>p[x,y][0]*1.2 and p[x,y][2]>p[x,y][1]*1.03]
        for i,x in enumerate(row):
            q[x,y]=p[row[(i+1)%len(row)],y]
            if (i+y)%4==0:
                r,g,b,a=q[x,y];q[x,y]=(min(255,r+12),min(255,g+18),min(255,b+18),a)
            if q[x,y]!=p[x,y]:changed.append((x,y))
    assert changed,'Water frame must visibly change'
    atlas=Image.new('RGBA',(32,64));atlas.alpha_composite(water);atlas.alpha_composite(second,(0,32));atlas.save(out/'temizu.png')
    for name,im in [('torii',gate),('temizu',atlas)]:
        assert set(im.getchannel('A').getdata())=={0,255},name
    print('RGBA / binary alpha / torii96x96 / basin32x64 / water-only changed pixels:',len(changed))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('torii');p.add_argument('basin');a=p.parse_args();build(a.torii,a.basin)

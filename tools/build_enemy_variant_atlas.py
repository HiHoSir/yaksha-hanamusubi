#!/usr/bin/env python3
from PIL import Image, ImageFile
from pathlib import Path
from collections import deque
import json

ImageFile.LOAD_TRUNCATED_IMAGES = True
CELL=128
COLS=4
CANVAS=512

def strip_edge_dark(im, threshold=28):
    im=im.convert("RGBA")
    w,h=im.size
    px=im.load()
    samples=[]
    for x in range(0,w,max(1,w//32)):
        samples += [px[x,0][3],px[x,h-1][3]]
    for y in range(0,h,max(1,h//32)):
        samples += [px[0,y][3],px[w-1,y][3]]
    if sum(a<16 for a in samples) > len(samples)*0.25:
        return im
    seen=bytearray(w*h)
    q=deque()
    def dark(x,y):
        r,g,b,a=px[x,y]
        return a>0 and max(r,g,b)<=threshold
    for x in range(w):
        if dark(x,0): q.append((x,0))
        if dark(x,h-1): q.append((x,h-1))
    for y in range(h):
        if dark(0,y): q.append((0,y))
        if dark(w-1,y): q.append((w-1,y))
    while q:
        x,y=q.popleft(); i=y*w+x
        if seen[i]: continue
        seen[i]=1
        if not dark(x,y): continue
        r,g,b,a=px[x,y]
        px[x,y]=(r,g,b,0)
        if x: q.append((x-1,y))
        if x+1<w: q.append((x+1,y))
        if y: q.append((x,y-1))
        if y+1<h: q.append((x,y+1))
    return im

def fit(im, size=512, padding=20, bottom=488):
    bbox=im.getchannel("A").getbbox() or (0,0,*im.size)
    crop=im.crop(bbox)
    max_side=size-2*padding
    scale=min(max_side/crop.width,max_side/crop.height,1)
    wh=(max(1,round(crop.width*scale)),max(1,round(crop.height*scale)))
    crop=crop.resize(wh,Image.Resampling.LANCZOS)
    out=Image.new("RGBA",(size,size),(0,0,0,0))
    x=(size-wh[0])//2
    y=max(padding,bottom-wh[1])
    out.alpha_composite(crop,(x,y))
    return out

def make_atlas(files, output):
    atlas=Image.new("RGBA",(CELL*COLS,CELL*3),(0,0,0,0))
    for i,path in enumerate(files):
        im=Image.open(path).convert("RGBA")
        bbox=im.getchannel("A").getbbox() or (0,0,*im.size)
        crop=im.crop(bbox)
        scale=min(112/crop.width,112/crop.height)
        wh=(max(1,round(crop.width*scale)),max(1,round(crop.height*scale)))
        crop=crop.resize(wh,Image.Resampling.LANCZOS)
        cell=Image.new("RGBA",(CELL,CELL),(0,0,0,0))
        cell.alpha_composite(crop,((CELL-wh[0])//2,max(8,120-wh[1])))
        atlas.alpha_composite(cell,((i%COLS)*CELL,(i//COLS)*CELL))
    atlas.save(output,optimize=True)

# Project-specific source mapping should be supplied by a manifest.
# Keep manifest order identical to variantAtlas indices.

#!/usr/bin/env python3
"""Build aligned RGBA room layers from editor JSON and approved tile images.

Usage: python3 scripts/build_interior_layers.py layout.json --assets . --out output
The canvas has a fixed 96px top gutter for wall height. No layer is cropped.
"""
import argparse
import json
from pathlib import Path
from PIL import Image

FLOOR={'wood','table','cushion','raised','tatami','futon'}
WALL={'wall'}
def build(layout,assets,out):
    data=json.loads(Path(layout).read_text(encoding='utf-8'))
    s=data['tileSize']; w=data['width']; h=data['height']
    tiles=data['tiles']
    if s!=32 or not 1<=w<=64 or not 1<=h<=64 or len(tiles)!=h or any(len(row)!=w for row in tiles):
        raise ValueError('invalid 32px room layout')
    # Keep one immutable pixel origin for every layer.
    gutter=96
    floor=Image.new('RGBA',(w*s,(h*s)+gutter))
    walls=Image.new('RGBA',floor.size)
    road=Image.open(assets/'assets/terrain/landscape-v3/road.png').convert('RGBA')
    wood=Image.open(assets/'assets/interiors/prototypes/teahouse-wood-floor-4x4-preview.png').convert('RGBA')
    plaster=Image.open(assets/'assets/interiors/prototypes/plaster-wall-32-candidate.png').convert('RGBA')
    panel=Image.open(assets/'assets/interiors/prototypes/wood-wainscot-32-candidate.png').convert('RGBA')
    if road.size!=(64,64) or wood.size!=(128,128) or plaster.width!=32 or panel.width!=32:
        raise ValueError('source art dimension mismatch')
    wall=Image.new('RGBA',(32,96))
    wall.paste(plaster.crop((0,0,32,23)),(0,0))
    wall.paste(plaster.crop((0,0,32,32)).resize((32,56),Image.Resampling.NEAREST),(0,23))
    wall.paste(panel.crop((0,0,32,17)),(0,79))
    for y,row in enumerate(tiles):
        for x,t in enumerate(row):
            dest=(x*s,gutter+y*s)
            if t in FLOOR:
                tile=wood.crop(((x%4)*s,(y%4)*s,(x%4+1)*s,(y%4+1)*s))
            else:
                tile=road.crop(((x%2)*s,(y%2)*s,(x%2+1)*s,(y%2+1)*s))
            floor.paste(tile,dest,tile)
            if t in WALL:
                # Wall foot is at the bottom edge of its authored cell.
                walls.alpha_composite(wall,(x*s,gutter+(y+1)*s-96))
    out.mkdir(parents=True,exist_ok=True)
    floor.save(out/'floor.png')
    walls.save(out/'walls.png')
    composed=Image.alpha_composite(floor,walls)
    composed.save(out/'floor-walls-composite.png')
    (out/'manifest.json').write_text(json.dumps({'room':data['room'],'tileSize':s,'width':w,'height':h,'canvas':[w*s,h*s+gutter],'floorOrigin':[0,gutter],'layers':['floor.png','walls.png'],'preview':'floor-walls-composite.png'},ensure_ascii=False,indent=2)+'\n')
    return out

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('layout',type=Path)
    p.add_argument('--assets',type=Path,default=Path('.'))
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    print(build(a.layout,a.assets,a.out))

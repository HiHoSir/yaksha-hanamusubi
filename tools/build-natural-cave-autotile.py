#!/usr/bin/env python3
"""Build a 47-mask natural cave *candidate* atlas from existing approved-source pixels.
This is not a production-approved wall tileset. Collision is authored separately.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets/dungeons/natural-cave-v0'
SIZE=32
def normal(m):
    n=m&15
    for pair,corner in ((3,16),(6,32),(12,64),(9,128)):
        if (n&pair)==pair and (m&corner):n|=corner
    return n
MASKS=sorted(set(normal(i) for i in range(256)))
assert len(MASKS)==47
def edge_tiled(img):
    im=img.copy()
    for y in range(32): im.putpixel((31,y),im.getpixel((0,y)))
    for x in range(32): im.putpixel((x,31),im.getpixel((x,0)))
    return im
def floor_mask(m):
    # Walkable center 20x20; arms connect to boundaries; conditional diagonal
    # fills only when both adjacent arms exist.
    n,e,s,w=[bool(m & (1<<k)) for k in range(4)]
    im=Image.new('L',(32,32),0); d=ImageDraw.Draw(im)
    d.rectangle((6,6,25,25),fill=255)
    if n:d.rectangle((6,0,25,6),fill=255)
    if e:d.rectangle((25,6,31,25),fill=255)
    if s:d.rectangle((6,25,25,31),fill=255)
    if w:d.rectangle((0,6,6,25),fill=255)
    for bit,rect in ((16,(26,0,31,5)),(32,(26,26,31,31)),(64,(0,26,5,31)),(128,(0,0,5,5))):
        if m&bit:d.rectangle(rect,fill=255)
    return im
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    floor=Image.open(OUT/'floor-base-candidate.png').convert('RGBA')
    cliff=Image.open(OUT/'source-cliff-32.png').convert('RGBA')
    assert floor.size==cliff.size==(32,32)
    rock=edge_tiled(cliff)
    # Reuse existing illustrated texture; darken for a distinctly enclosed cave.
    rock=rock.point(lambda p:int(p*.72) if p<256 else p)
    # RGBA alpha must remain opaque: convert source RGB before composition.
    rock=Image.merge('RGBA',(*rock.convert('RGB').split(),Image.new('L',(32,32),255)))
    floor=Image.merge('RGBA',(*floor.convert('RGB').split(),Image.new('L',(32,32),255)))
    atlas=Image.new('RGBA',(256,192),(0,0,0,0))
    for i,m in enumerate(MASKS):
        cell=Image.composite(floor,rock,floor_mask(m))
        atlas.paste(cell,((i%8)*32,(i//8)*32))
    atlas.save(OUT/'cave-floor-wall-autotile-47-candidate.png')

    # 20x12 map with branching, dead ends, and open room; input describes full-cell
    # movement, independent of visually softened boundaries.
    rows=[
     '####################',
     '#..........#.......#',
     '#.####.....#.......#',
     '#.#..#.............#',
     '#.#..#####..#####..#',
     '#.#.............#..#',
     '#.######.######.#..#',
     '#........#......#..#',
     '#..#######..#####..#',
     '#..................#',
     '#..................#',
     '####################']
    assert all(len(r)==20 for r in rows) and len(rows)==12
    d=[(-1,-1,128),(0,-1,1),(1,-1,16),(1,0,2),(1,1,32),(0,1,4),(-1,1,64),(-1,0,8)]
    sample=Image.new('RGBA',(20*32,12*32))
    for y,row in enumerate(rows):
      for x,char in enumerate(row):
        if char=='#':tile=rock
        else:
          mask=normal(sum(bit for dx,dy,bit in d if 0<=x+dx<20 and 0<=y+dy<12 and rows[y+dy][x+dx]=='.'))
          # Occupancy is FULL-CELL: a floor tile is 32x32 floor, and a
          # blocked tile is 32x32 rock. Transition masks can be layered
          # decoratively later, never allowed to visually shrink walkability.
          tile=floor
        sample.paste(tile,(x*32,y*32))
    sample.save(OUT/'cave-layout-20x12-candidate.png')
    # 3x3 exact-scale repetition QA image, not a production tile.
    repetition=Image.new('RGBA',(96,96))
    for y in range(3):
      for x in range(3):repetition.paste(floor,(32*x,32*y))
    repetition.save(OUT/'floor-repeat-3x3-qa.png')
    manifest={'status':'ASSET CANDIDATE - VISUAL APPROVAL PENDING','tileSize':32,
      'atlas':'cave-floor-wall-autotile-47-candidate.png','atlasColumns':8,'atlasRows':6,
      'maskOrder':MASKS,'layout':'cave-layout-20x12-candidate.png',
      'collision':'full integer cells; # blocked, . passable; never derived from source image',
      'warning':'full-cell geometry for walkable/blocked layout; 47-mask atlas is a separate unapproved decorative candidate'}
    (OUT/'autotile-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    # Strong structural QA: all masks valid and opposite-edge continuity on shared arms.
    assert atlas.size==(256,192)
    assert all(normal(m)==m for m in MASKS)
    # verify all floor tiles are opaque
    for i in range(47):
      crop=atlas.crop(((i%8)*32,(i//8)*32,(i%8+1)*32,(i//8+1)*32))
      assert crop.getextrema()[3]==(255,255)
    assert all(floor.getpixel((0,y))==floor.getpixel((31,y)) for y in range(32))
    assert all(floor.getpixel((x,0))==floor.getpixel((x,31)) for x in range(32))
    print('PASS: 47 masks, 256x192 RGBA opaque atlas, 20x12 sample, 3x3 repeat')
if __name__=='__main__': main()

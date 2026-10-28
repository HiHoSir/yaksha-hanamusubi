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
    # No visible cliff top: blocked cells represent unlit cave void.
    # Keep the original cliff source for later side-facing wall treatment.
    rock=Image.new('RGBA',(32,32),(8,9,12,255))
    cliff=Image.open(OUT/'source-cliff-32.png').convert('RGBA')
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
    # SFC-era cave wall treatment: connected hand-shaped silhouettes, tonal
    # separation, and reused original rock texture. All depth pixels stay in
    # the BLOCKED cell, never intruding on the 32px movement footprint.
    # Use a low-frequency interpolated contour sampled in world coordinates;
    # restarting a rectangle every tile is the cause of the FC-like appearance.
    palette=[
      (13,15,20), (25,28,35), (36,39,46),
      (49,51,57), (65,65,70), (79,77,79),
      (99,95,93), (117,109,103)]
    def variation(wx,seed):
      # Continuous contour between 8px-spaced hand-tuned control points.
      def knot(k):
        h=((k*1103515245+seed*12345+0x9e3779b9)&0xffffffff)
        h^=h>>13
        return (-3,-1,0,1,3,2,-2,0)[h&7]
      k=wx//8; t=(wx%8)/8
      t=t*t*(3-2*t)
      return round(knot(k)*(1-t)+knot(k+1)*t)
    def tone(rgb, wx, wy, is_rim=False, is_base=False):
      lum=(rgb[0]*3+rgb[1]*6+rgb[2])//10
      # Convert source to one coherent rock palette, retaining its detailed
      # original luminance instead of painting flat colors or random speckles.
      idx=max(1,min(6,(lum//34)+1))
      if is_rim: idx=min(7,idx+1)
      if is_base: idx=max(0,idx-2)
      return palette[idx]+(255,)
    for y,row in enumerate(rows):
      for x,ch in enumerate(row):
        if ch!='#': continue
        south=(y+1<len(rows) and rows[y+1][x]=='.')
        west=(x>0 and row[x-1]=='.')
        east=(x+1<len(row) and row[x+1]=='.')
        if not (south or west or east): continue
        for lx in range(32):
          wx=x*32+lx
          # An uninterrupted contour across consecutive wall cells.
          upper=13+variation(wx,y*37+17)
          lower=29+variation(wx,y*37+49)//2
          # Silhouette naturally rolls back at exposed ends.
          if south and west: upper+=max(0,12-lx)//2
          if south and east: upper+=max(0,lx-19)//2
          # Recede rounded side corners into the dark void; corners are
          # defined across multiple pixels, not one-cell rectangular caps.
          if south and west and lx<8: lower-=((8-lx)*2)//3
          if south and east and lx>23: lower-=((lx-23)*2)//3
          for py in range(32):
            wy=y*32+py
            front=south and upper<=py<=lower
            # Dark, narrower lateral rock faces turn into the black void
            # rather than terminating as vertical rectangle edges.
            left=west and lx<=max(2,5+variation(wy,11)) and py>=7
            right=east and lx>=min(29,26-variation(wy,29)) and py>=7
            if not(front or left or right):continue
            src=cliff.getpixel(((wx+py//9)%32,(wy+wx//13)%32))
            is_rim=front and py<=upper+2
            is_base=front and py>=lower-3
            color=tone(src[:3],wx,wy,is_rim,is_base)
            # Side planes are in deeper shadow than front-facing wall.
            if (left or right) and not front:
              i=max(1,palette.index(color[:3])-2)
              color=palette[i]+(255,)
            sample.putpixel((wx,wy),color)
    # Ground-to-wall contact shadow: keep it within blocked cells to protect
    # collision and SD character visibility. Thin stepped tonal transition.
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
      'wallTop':'opaque near-black','wallFace':'SFC 8-tone rock, interpolated connected silhouettes and side planes; rendered only within blocked cells','warning':'candidate presentation; visual approval pending'}
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

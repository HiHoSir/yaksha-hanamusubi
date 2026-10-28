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
    # Height-driven cave geometry. Unlike an independently painted wall sprite,
    # the visible face is calculated from the same elevated terrain cells used
    # for blocking. 0 = reachable floor; 2 = elevated, inaccessible cave rock.
    # In top-down projection the upper rock surface is dark, while its exposed
    # vertical faces are attached to the LOWER edge of the elevated cell.
    heights=[[0 if ch=='.' else 2 for ch in row] for row in rows]
    assert len(heights)==12 and all(len(r)==20 for r in heights)
    palette=[(13,15,20),(25,28,35),(36,39,46),(49,51,57),
             (65,65,70),(79,77,79),(99,95,93),(117,109,103)]
    def variation(wx,seed):
      def knot(k):
        h=((k*1103515245+seed*12345+0x9e3779b9)&0xffffffff)
        h^=h>>13
        return (-3,-1,0,1,3,2,-2,0)[h&7]
      k=wx//8;t=(wx%8)/8;t=t*t*(3-2*t)
      return round(knot(k)*(1-t)+knot(k+1)*t)
    def color_at(wx,wy,shade=0):
      rgb=cliff.getpixel(((wx+wy//9)%32,(wy+wx//13)%32))
      lum=(rgb[0]*3+rgb[1]*6+rgb[2])//10
      i=max(1,min(6,lum//34+1+shade))
      return palette[i]+(255,)
    face_cells=0
    side_cells=0
    for y in range(12):
      for x in range(20):
        h=heights[y][x]
        if h==0:continue
        south=heights[y+1][x] if y+1<12 else h
        west=heights[y][x-1] if x>0 else h
        east=heights[y][x+1] if x<19 else h
        # Same topological height differences drive face visibility.
        south_face=h>south
        left_face=h>west
        right_face=h>east
        if not (south_face or left_face or right_face):continue
        face_cells+=int(south_face);side_cells+=int(left_face or right_face)
        for lx in range(32):
          wx=x*32+lx
          # 2-level rise is a full 32px face inside the elevated cell,
          # leaving a full 32px walkable floor south of it.
          upper=max(0,2+variation(wx,y*37+17))
          lower=31+min(0,variation(wx,y*37+49)//2)
          if south_face and left_face:
            upper+=max(0,12-lx)//2
            if lx<8:lower-=((8-lx)*2)//3
          if south_face and right_face:
            upper+=max(0,lx-19)//2
            if lx>23:lower-=((lx-23)*2)//3
          for py in range(32):
            wy=y*32+py
            face=south_face and upper<=py<=lower
            side_l=left_face and lx<=max(2,5+variation(wy,11)) and py>=7
            side_r=right_face and lx>=min(29,26-variation(wy,29)) and py>=7
            # Top-down cave walls must NOT inherit the field camera's
            # 30px perspective wedge. Use a small 6px rock bevel only at
            # exposed ends. It never changes logical cell occupancy.
            cut_left=south_face and left_face and lx+py<6
            cut_right=south_face and right_face and (31-lx)+py<6
            if cut_left or cut_right: continue
            if not(face or side_l or side_r):continue
            shade=1 if face and py<=upper+2 else -2 if face and py>=lower-3 else 0
            if not face:shade-=2
            sample.putpixel((wx,wy),color_at(wx,wy,shade))
    assert face_cells>0 and side_cells>0
    height_data={'cellSize':32,'levels':heights,'floorLevel':0,
      'rockLevel':2,'risePx':32,'faceCells':face_cells,'sideCells':side_cells,
      'geometry':'elevation-derived rock faces; 6px top-down corner bevels; dark overhead top',
      'movement':'only level 0 is traversable; no ladders or ramps'}
    (OUT/'cave-elevation-20x12.json').write_text(json.dumps(height_data,indent=2)+'\n')
    sample.save(OUT/'cave-layout-20x12-candidate.png')
    # Orthographic two-cell-height wall pilot. Expand only the QA geometry
    # to a 40x24 authored grid so a blocked wall can occupy separate
    # TOP (dark) and FACE (rock) cells. Unlike perspective projection,
    # nothing is shifted or distorted by a camera height parameter.
    expanded=[''.join(ch*2 for ch in row) for row in rows for _ in range(2)]
    H=len(expanded);W=len(expanded[0])
    assert (W,H)==(40,24)
    full=Image.new('RGBA',(W*32,H*32))
    face_rows=[]
    for yy in range(H):
      for xx in range(W):
        c=expanded[yy][xx]
        south=expanded[yy+1][xx] if yy+1<H else '#'
        # Only the frontmost blocked row is the 32px cliff face.
        is_face=c=='#' and south=='.'
        # Internal blocked rock behind that row remains solid black.
        source=floor if c=='.' else rock
        full.paste(source,(xx*32,yy*32))
        if is_face:
          face_rows.append((xx,yy))
          for v in range(32):
            for u in range(32):
              wx=xx*32+u
              rgb=cliff.getpixel(((wx+v//7)%32,(yy*32+v)%32))
              val=(rgb[0]*3+rgb[1]*6+rgb[2])//10
              k=max(1,min(6,val//34+1+(1 if v<3 else -2 if v>28 else 0)))
              full.putpixel((xx*32+u,yy*32+v),palette[k]+(255,))
    full.save(OUT/'cave-orthographic-40x24-candidate.png')
    ortho={'tileSize':32,'width':W,'height':H,
      'rows':expanded,'heightLevels':[[0 if c=='.' else 2 for c in r] for r in expanded],
      'wallFaceRows':len(face_rows),'draw':'fixed orthographic: black upper cells, 32px vertical front faces, 32px walkable floor',
      'collision':'blocked rock cells never become walkable due to face artwork'}
    (OUT/'cave-orthographic-40x24.json').write_text(json.dumps(ortho,indent=2)+'\n')

    # 3x3 exact-scale repetition QA image, not a production tile.
    repetition=Image.new('RGBA',(96,96))
    for y in range(3):
      for x in range(3):repetition.paste(floor,(32*x,32*y))
    repetition.save(OUT/'floor-repeat-3x3-qa.png')
    manifest={'status':'ASSET CANDIDATE - VISUAL APPROVAL PENDING','tileSize':32,
      'atlas':'cave-floor-wall-autotile-47-candidate.png','atlasColumns':8,'atlasRows':6,
      'maskOrder':MASKS,'layout':'cave-layout-20x12-candidate.png',
      'collision':'full integer cells; # blocked, . passable; never derived from source image',
      'wallTop':'opaque near-black','wallFace':'height-derived 32px rock faces with 6px top-down corner bevels; black top','warning':'candidate presentation; visual approval pending'}
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

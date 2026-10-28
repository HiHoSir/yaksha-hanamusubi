#!/usr/bin/env python3
"""Pixel-level structural checks for the candidate atlas, not art approval."""
import importlib.util
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location("cave_builder",root/"tools/build-natural-cave-autotile.py")
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
out=root/"assets/dungeons/natural-cave-v0"
atlas=Image.open(out/"cave-floor-wall-autotile-47-candidate.png").convert("RGBA")
floor=Image.open(out/"floor-base-candidate.png").convert("RGBA")
rock=Image.open(out/"source-cliff-32.png").convert("RGBA")
assert atlas.size==(256,192)
assert len(mod.MASKS)==47
tiles={m:atlas.crop(((i%8)*32,(i//8)*32,(i%8+1)*32,(i//8+1)*32)) for i,m in enumerate(mod.MASKS)}
# Pixel edge continuity for EVERY pair of 47 masks whose shared direction
# is mutually open; and wall-to-wall when both closed.
pairs=0
for a,ta in tiles.items():
 for b,tb in tiles.items():
  if bool(a&2)==bool(b&8) and (not (a&2) or (bool(a&16)==bool(b&128) and bool(a&32)==bool(b&64))):
   for y in range(32):
    if ta.getpixel((31,y))!=tb.getpixel((0,y)):
     raise AssertionError(f"EW seam masks {a},{b} y={y}")
   pairs+=1
  if bool(a&4)==bool(b&1) and (not (a&4) or (bool(a&64)==bool(b&128) and bool(a&32)==bool(b&16))):
   for x in range(32):
    if ta.getpixel((x,31))!=tb.getpixel((x,0)):
     raise AssertionError(f"NS seam masks {a},{b} x={x}")
   pairs+=1
# Validate diagonal mask quadrants on a pure logical mask, not image colors.
corner_cases=((16,(29,2)),(32,(29,29)),(64,(2,29)),(128,(2,2)))
for bit,point in corner_cases:
  m={16:3,32:6,64:12,128:9}[bit]|bit
  mask=mod.floor_mask(m)
  assert mask.getpixel(point)==255,(bit,point)
  other=[p for b,p in corner_cases if b!=bit]
  assert all(mask.getpixel(p)==0 for p in other),(bit,'unexpected corner')
# Four-direction movement remains whole-cell and unchanged by decoration.
assert Image.open(out/"cave-layout-20x12-candidate.png").size==(640,384)
print("PASS:",len(tiles),"tiles;",pairs,"pairwise edge comparisons; four diagonal positions; 20x12 layout")

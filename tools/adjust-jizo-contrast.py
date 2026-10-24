"""Color-only alternatives on final 32px pixels. No regeneration or resampling."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/settlement-editor/jizo-prayer-v1'
src=Image.open(OUT/'jizo-32.png').convert('RGBA')
def clamp(v):return max(0,min(255,round(v)))
contrast=src.copy();features=src.copy()
for y in range(32):
 for x in range(32):
  r,g,b,a=src.getpixel((x,y))
  if not a:continue
  gray=max(r,g,b)-min(r,g,b)<40
  if not gray:continue # Preserve the red bib and its original shadows.
  # Increase separation of light stone and carved gray without changing shape.
  c=tuple(clamp(168+(v-168)*1.4)for v in (r,g,b))
  contrast.putpixel((x,y),c+(a,))
  eye_mouth=((10<=x<=13 or 18<=x<=21) and 13<=y<=15) or (14<=x<=17 and 16<=y<=17)
  hands=13<=x<=18 and 20<=y<=27
  if eye_mouth or hands:
   lum=.2126*r+.7152*g+.0722*b
   # Darken existing incisions, preserve the light face around them.
   if lum<180:c=tuple(clamp(v*(.5 if eye_mouth else .62))for v in (r,g,b))
   elif hands and lum>190:c=tuple(clamp(v+(255-v)*.4)for v in (r,g,b))
   else:c=(r,g,b)
  else:c=(r,g,b)
  features.putpixel((x,y),c+(a,))
for name,im in [('contrast',contrast),('features',features)]:
 assert im.size==src.size and im.getchannel('A').tobytes()==src.getchannel('A').tobytes()
 im.save(OUT/f'jizo-32-{name}.png')
preview=Image.new('RGB',(576,330),'#95bf69');draw=ImageDraw.Draw(preview)
for i,(name,im)in enumerate([('A Original',src),('B Contrast',contrast),('C Face + hands',features)]):
 preview.paste(im,(i*192+80,4),im)
 big=im.resize((160,160),Image.Resampling.NEAREST);preview.paste(big,(i*192+16,65),big)
 draw.rectangle((i*192+16,65,i*192+175,224),outline='#d5e5c2')
 draw.text((i*192+42,244),name,fill='black')
 # Also test a darker, neutral background below the grass comparison.
 draw.rectangle((i*192+16,273,i*192+175,320),fill='#404654')
 preview.paste(im,(i*192+80,280),im)
preview.save(ROOT/'qa/jizo-contrast-comparison.png')
print('2 alternatives: exact 32x32, alpha and silhouette unchanged, no generation/resampling.')

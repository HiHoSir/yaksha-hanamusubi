"""Audit the actual side-view leg silhouettes before changing art.

The stdout PNG is a deterministic crop of existing art for image-level visual
inspection via the authenticated CI log. It does not create a new illustration.
"""
from PIL import Image,ImageDraw
from pathlib import Path
from io import BytesIO
import base64,json
P=Path(__file__).resolve().parents[1]/"assets/characters/hizuki/hana-20261107/walk/walk-atlas-80x112.png"
im=Image.open(P).convert("RGBA")
assert im.size==(240,448)
scale=3
out=Image.new("RGBA",(80*3*scale,76*2*scale),(46,54,62,255))
for row,label in [(2,"right"),(3,"left")]:
 for col,pose in enumerate(("idle","step-a","step-b")):
  f=im.crop((col*80,row*112+36,col*80+80,(row+1)*112))
  o=Image.new("RGBA",f.size,(55,57,61,255));o.alpha_composite(f)
  out.paste(o.resize((80*scale,76*scale),Image.Resampling.NEAREST),(col*80*scale,(row-2)*76*scale))
  # Count dominant red/blue/black shoe pixels by horizontal strips.
  data=f.load();rows=[]
  for ylo,yhi in ((39,55),(55,76)):
   a=[]
   for y in range(ylo,yhi):
    for x in range(80):
     r,g,b,al=data[x,y]
     if al<24:continue
     if (r<125 and g<145 and b<170 and y>39):
      a.append(x)
   if a:rows.append((round(sum(a)/len(a),2),min(a),max(a),len(a)))
  print("SIDE_POSE",json.dumps({"direction":label,"pose":pose,"bottom_color_centers":rows}))
buf=BytesIO();out.convert("RGB").save(buf,format="PNG",optimize=True)
print("BEGIN_SIDE_CROP_PNG_BASE64")
print(base64.b64encode(buf.getvalue()).decode())
print("END_SIDE_CROP_PNG_BASE64")

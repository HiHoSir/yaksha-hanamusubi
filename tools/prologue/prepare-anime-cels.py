from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import numpy as np
p=Path('assets/prologue/anime-v1');(p/'cels').mkdir(exist_ok=True)
src=Image.open(p/'source/hizuki-greeting-cels.png').convert('RGBA')
w,h=src.size;cw=w//3
cells=[src.crop((i*cw,0,(i+1)*cw,h)) for i in range(3)]
base=cells[0]
# Align stable hair/forehead region, then transfer ONLY mouth/eyelid areas.
a=np.array(base);template=a[45:185:4,180:480:4,:3].astype(float)
aligned=[]
for c in cells:
 arr=np.array(c)
 _,dx,dy=min((np.mean((arr[45+dy:185+dy:4,180+dx:480+dx:4,:3].astype(float)-template)**2),dx,dy) for dx in range(-16,17) for dy in range(-16,17))
 n=Image.new('RGBA',base.size);n.alpha_composite(c,(-dx,-dy));aligned.append(n)
 print('registration',dx,dy)
base.save(p/'cels/idle.png')
for name,index,rects in [('speak',1,[(382,322,472,386)]),('blink',2,[(330,228,535,328)])]:
 mask=Image.new('L',base.size);d=ImageDraw.Draw(mask)
 for r in rects:d.ellipse(r,fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(3))
 out=Image.composite(aligned[index],base,mask);out.save(p/f'cels/{name}.png')
print('size',base.size)

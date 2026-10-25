from PIL import Image
from pathlib import Path
import json
P=Path(__file__).resolve().parents[1]/'assets/interior-editor/soft-v1';P.mkdir(exist_ok=True)
# Woven ground textures, deliberately authored at native32px; no smooth source scaling.
def weave(coarse):
 im=Image.new('RGBA',(32,32))
 colors=[(157,126,70,255),(178,149,88,255),(195,167,106,255),(168,137,78,255)] if coarse else [(157,157,91,255),(174,171,105,255),(184,181,114,255),(164,164,96,255)]
 for y in range(32):
  for x in range(32):
   k=((x//2+y//3)%2)*2+(y%3==0) if coarse else (y%2)+(x//4%2)*2
   im.putpixel((x,y),colors[k])
 # exact periodic boundary pixels
 for y in range(32):im.putpixel((31,y),im.getpixel((0,y)))
 for x in range(32):im.putpixel((x,31),im.getpixel((x,0)))
 return im
base=weave(True)
for n,edges in {'c':'','n':'n','s':'s','w':'w','e':'e','nw':'nw','ne':'ne','sw':'sw','se':'se'}.items():
 im=base.copy()
 for y in range(32):
  for x in range(32):
   if ('n' in edges and y<2) or ('s' in edges and y>=30) or ('w' in edges and x<2) or ('e' in edges and x>=30):im.putpixel((x,y),(122+(x+y)%2*15,94+(x+y)%2*12,47,255))
 im.save(P/('goza_'+n+'.png'))
t=Image.new('RGBA',(64,32));q=weave(False);t.paste(q,(0,0));t.paste(q,(32,0))
for y in [0,1,30,31]:
 for x in range(64):t.putpixel((x,y),(64+(x%2)*12,85+(x%2)*10,58,255))
for i,n in enumerate(['l','r']):t.crop((i*32,0,i*32+32,32)).save(P/('tatami_'+n+'.png'))
v=t.transpose(Image.Transpose.ROTATE_270)
for i,n in enumerate(['u','d']):v.crop((0,i*32,32,i*32+32)).save(P/('tatami_'+n+'.png'))
print('Built9 goza parts and4 tatami parts')
# Futon-32x64 is the normalized illustrated source; preserve it unchanged.
f=P/'futon-32x64.png'
if f.exists():
 im=Image.open(f).convert('RGBA')
 for i,n in enumerate(['u','d']):im.crop((0,32*i,32,32*i+32)).save(P/('futon_'+n+'.png'))
 folded=Image.new('RGBA',(32,32))
 cloth=im.crop((4,20,28,27)).resize((28,5),Image.Resampling.NEAREST)
 folded.alpha_composite(cloth,(2,23))
 folded.alpha_composite(im.crop((2,32,30,61)).resize((28,16),Image.Resampling.NEAREST),(2,7))
 folded.save(P/'folded_futon.png')

from PIL import Image
from pathlib import Path
P=Path(__file__).resolve().parents[1]/'assets/interior-editor/fire-v1';P.mkdir(exist_ok=True)
def normalize(path,size,at,name,colors=24):
 im=Image.open(path).convert('RGBA');im.putalpha(im.getchannel('A').point(lambda v:255 if v>=128 else 0));im=im.crop(im.getbbox());im.thumbnail(size,Image.Resampling.NEAREST);a=im.getchannel('A');q=im.convert('RGB').quantize(colors=colors).convert('RGBA');q.putalpha(a);o=Image.new('RGBA',(32,32));o.alpha_composite(q,((32-q.width)//2,at-q.height));o.save(P/(name+'.png'));return o
# Native sources are retained for reconstruction without a repeat generation.
if not (P/'flame_source.png').exists():
 normalize('/workspace/scratch/58cf5c1e4c98/generated_images/exec-62b6dbaa-736c-4882-98f8-1c5523d420fe.png',(28,28),31,'hibachi')
 normalize('/workspace/scratch/58cf5c1e4c98/generated_images/exec-b139dc8b-9b76-4b21-bd41-a37b6b2a84db.png',(28,30),31,'kamado')
 normalize('/workspace/scratch/58cf5c1e4c98/generated_images/exec-0e947410-6ab5-4169-a12a-2fccbf3b9dce.png',(12,20),26,'flame_source',8)
f=Image.open(P/'flame_source.png').convert('RGBA');alt=Image.new('RGBA',(32,32))
for y in range(32):
 for x in range(32):
  if f.getpixel((x,y))[3]:alt.putpixel((x+(1 if y<15 else -1 if y<20 else 0),y),f.getpixel((x,y)))
for name,base,size,at in [('flame',None,None,None),('campfire_lit','campfire_unlit',None,None),('hearth','hearth_unlit',None,None),('hibachi_lit','hibachi',(10,14),(11,4)),('kamado_lit','kamado',(8,8),(12,22))]:
 atlas=Image.new('RGBA',(64,32))
 for i,fire in enumerate([f,alt]):
  o=Image.open(P/(base+'.png')).convert('RGBA') if base else Image.new('RGBA',(32,32))
  if size:o.alpha_composite(fire.crop(fire.getbbox()).resize(size,Image.Resampling.NEAREST),at)
  else:o.alpha_composite(fire)
  atlas.alpha_composite(o,(i*32,0))
 atlas.save(P/(name+'.png'))
print('Built2-frame fire atlases and extinguished objects')

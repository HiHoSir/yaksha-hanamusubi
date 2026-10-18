from PIL import Image,ImageOps
from pathlib import Path
import numpy as np,json
p=Path('assets/prologue/pixel-v2');(p/'cels').mkdir(exist_ok=True)
meta={}
for name in ['hero','child']:
 im=Image.open(p/'source'/f'{name}-cels.png').convert('RGBA');w=im.width//3;cells=[]
 for i in range(3):
  c=im.crop((i*w,0,(i+1)*w,im.height))
  # Uniform padded square keeps aspect ratio; never stretch body.
  size=max(w,im.height);canvas=Image.new('RGBA',(size,size));canvas.alpha_composite(c,((size-w)//2,0));cells.append(canvas)
 # Register head before extracting facial patches. Pad before translation.
 offsets=[0,25,51] if name=='hero' else [0,95,201]
 aligned=[]
 for c,dx in zip(cells,offsets):
  canvas=Image.new('RGBA',(1040,1040));canvas.alpha_composite(c,(80+dx,30));aligned.append(canvas)
 cells=aligned
 if name=='hero':
  mouth=(490,365,565,420)
  op=cells[0].copy();op.paste(cells[1].crop(mouth),mouth[:2])
  eyes=(425,280,625,370);blink=cells[0].copy();blink.paste(cells[2].crop(eyes),eyes[:2]);cells=[cells[0],op,blink]
 else:
  mouth=(645,295,710,350)
  op=cells[0].copy();op.paste(cells[1].crop(mouth),mouth[:2]);waveclosed=cells[2].copy();waveclosed.paste(cells[0].crop(mouth),mouth[:2]);cells=[cells[0],op,cells[2],waveclosed]
  cells=[ImageOps.mirror(c) for c in cells]
 for i,c in enumerate(cells):c.save(p/'cels'/f'{name}-{i}.png')
 meta[name]={'source_size':im.size,'cell_canvas':cells[0].size,'body_fixed_for_mouth':True,'mirror':name=='child'}
(p/'cels/registration.json').write_text(json.dumps(meta,indent=2))

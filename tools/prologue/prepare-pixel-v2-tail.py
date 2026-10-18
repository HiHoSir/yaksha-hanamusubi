from pathlib import Path
from PIL import Image
import numpy as np,json
p=Path('assets/prologue/pixel-v2');meta={}
# NPC sheet; isolate equal cells with fixed padding.
im=Image.open(p/'source/npc-cels.png').convert('RGBA');w,h=im.width//2,im.height//2;cells=[]
for i in range(4):
 c=im.crop(((i%2)*w,(i//2)*h,(i%2+1)*w,(i//2+1)*h));can=Image.new('RGBA',(w+100,w+100));can.alpha_composite(c,(30,20));cells.append(can)
# Woman: head alignment + mouth-only replacement preserves body silhouette.
donor=Image.new('RGBA',cells[2].size);donor.alpha_composite(cells[3],(33,-1));box=(300,255,365,305)
op=cells[2].copy();op.paste(donor.crop(box),box[:2]);cells[3]=op
for i,c in enumerate(cells):c.save(p/'cels'/f'npc-{i}.png')
meta['npc']={'source':im.size,'canvas':cells[0].size,'woman_donor_translation':[33,-1],'mouth_box':box}
im=Image.open(p/'source/hizuki-acting.png').convert('RGBA');w=im.width//3;raw=[];centers=[]
for i in range(3):
 c=im.crop((i*w,0,(i+1)*w,im.height));a=np.array(c)[:int(w*.4)];r,g,b=a[:,:,:3].astype(float).transpose(2,0,1);mask=(b>r*1.3)&(b>80)&(g>r*1.2)&(a[:,:,3]>128);y,x=np.where(mask);centers.append(x.mean());raw.append(c)
cells=[]
for i,c in enumerate(raw):
 can=Image.new('RGBA',(w+80,w+80));can.alpha_composite(c,(40+round(centers[0]-centers[i]),20));cells.append(can)
box=(40+round(w*.59),20+round(w*.445),40+round(w*.67),20+round(w*.515));op=cells[0].copy();op.paste(cells[1].crop(box),box[:2]);cells[1]=op
resolved=cells[2].copy();resolved.paste(cells[1].crop(box),box[:2]);cells.append(resolved)
for i,c in enumerate(cells):c.save(p/'cels'/f'acting-{i}.png')
meta['acting']={'source':im.size,'canvas':cells[0].size,'head_centers':centers,'mouth_box':box}
(p/'tail-registration.json').write_text(json.dumps(meta,indent=2))

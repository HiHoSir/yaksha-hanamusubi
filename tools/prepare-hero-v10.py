"""Pack approved generated strips into registered 512px game frames.
Run with a directory containing the five named generated source PNGs.
Only crops, uniform resampling, alpha cleanup and padding; no redraw.
"""
from pathlib import Path
from PIL import Image
import numpy as np
import json,sys
root=Path(__file__).resolve().parents[1]
src=Path(sys.argv[1])
sheets={'front':'466c0fbe-fbb2-4a2b-96fb-db3e5c4a456c','back':'862f3c39-16ae-4c9a-b0ed-1e87eb093132','right':'2936d57a-066d-49b5-8362-5af7017fcbe9','left':'b112a059-f986-4ac1-946f-4747082630a0','battle':'66b7f2b5-c157-41df-9fc5-804d4c9ebe88'}
out=root/'assets/characters/yashahime/normal-v10';out.mkdir(parents=True,exist_ok=True)
manifest={}
def clean(im):
 a=np.array(im.convert('RGBA'));a[:,:,3][a[:,:,3]<12]=0;a[:,:,3][a[:,:,3]>=245]=255
 return Image.fromarray(a)
def bbox(im):return im.getchannel('A').point(lambda x:255 if x>16 else 0).getbbox()
def center(im,lo,hi):
 b=bbox(im);a=np.array(im.getchannel('A')); ys=slice(int(b[1]+(b[3]-b[1])*lo),int(b[1]+(b[3]-b[1])*hi)); y,x=np.where(a[ys]>128)
 return (x.min()+x.max())/2
for direction,key in sheets.items():
 sheet=clean(Image.open(src/f'exec-{key}.png'));cols=3;rows=2 if direction=='battle' else 1
 cells=[sheet.crop((i%3*sheet.width//3,i//3*sheet.height//rows,(i%3+1)*sheet.width//3,(i//3+1)*sheet.height//rows)) for i in range(cols*rows)]
 neutral=cells[0 if direction=='battle' else 1];nb=bbox(neutral)
 neutral_offset=center(neutral,.88,1)-center(neutral,.22,.42)
 names=['idle','attack','hit','guard','victory','skill'] if direction=='battle' else ['right-leg-up','neutral','left-leg-up']
 for name,im in zip(names,cells):
  b=bbox(im);scale=312/(b[3]-b[1]) if direction=='battle' else 312/(nb[3]-nb[1])
  # Register all walking phases to the neutral foot center, keeping head stable.
  anchor=center(im,.22,.42)+neutral_offset if direction!='battle' else center(im,.86,1)
  cut=im.crop(b);size=(round(cut.width*scale),round(cut.height*scale));cut=cut.resize(size,Image.Resampling.LANCZOS)
  result=Image.new('RGBA',(512,512));pos=(round(256-(anchor-b[0])*scale),480-size[1]);result.alpha_composite(cut,pos)
  filename=(f'battle-{name}' if direction=='battle' else f'{direction}-{name}')+'.png'
  # Palette PNG keeps the registered frame and real alpha while reducing transfer size.
  result.quantize(colors=256,method=Image.Quantize.FASTOCTREE).save(out/filename,optimize=True)
  manifest[filename]={'bounds':bbox(result),'anchor':[256,480],'source':f'exec-{key}.png','cell':names.index(name)}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'frames':len(manifest),'bytes':sum(p.stat().st_size for p in out.glob('*.png'))}))

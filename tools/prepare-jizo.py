from PIL import Image
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/settlement-editor/jizo-v1'
sources={'jizo_small':ROOT/'assets/terrain/places-v1/jizo.png','jizo_kasa':ROOT.parent/'generated_images/exec-c94426f6-4c59-4e8b-8683-08b01bf97a57.png','jizo_bosatsu':ROOT.parent/'generated_images/exec-e3233e8e-cd70-4172-9994-89837d40e035.png'}
records=[]
for name,original in sources.items():
    saved=OUT/'source'/f'{name}.png'
    if original.exists():
        im=Image.open(original).convert('RGBA')
        im.putalpha(im.getchannel('A').point(lambda a:255 if a>=128 else 0))
        im=im.crop(im.getbbox())
        # Retain a bounded, reproducible source without relying on transient paths.
        im.thumbnail((64,128),Image.Resampling.NEAREST);im.save(saved)
    im=Image.open(saved).convert('RGBA');height=64 if name=='jizo_bosatsu' else 32
    ratio=min(28/im.width,(height-2)/im.height)
    im=im.resize((max(1,round(im.width*ratio)),max(1,round(im.height*ratio))),Image.Resampling.NEAREST)
    alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
    rgb=im.convert('RGB').quantize(colors=24,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGBA');rgb.putalpha(alpha)
    canvas=Image.new('RGBA',(32,height));canvas.paste(rgb,((32-im.width)//2,height-im.height));canvas.save(OUT/f'{name}.png')
    records.append({'id':name,'displayCells':[1,height//32],'occupiedTiles':[[0,0]],'sourceRect':[0,0,32,height],'anchor':'ground-bottom-center','layer':'object'})
(OUT/'manifest.json').write_text(json.dumps(records,indent=2)+'\n')
print('Prepared 3 independent RGBA chips, binary alpha and 24-color palettes.')

from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/settlement-editor/religious-v1'
assets=json.loads((OUT/'generation.json').read_text())['assets']
# The shared manifest also contains 32px komainu; only normalize buildings here.
for key in ['building_belltower','building_jinja']:
    item=assets[key]
    raw=Path(item['source'])
    if not raw.exists():
        assert (OUT/(key+'.png')).exists();continue
    im=Image.open(raw).convert('RGBA');box=im.getchannel('A').point(lambda x:255 if x>=128 else 0).getbbox()
    if box is None:raise ValueError('empty alpha')
    im=im.crop(box);scale=min(96/im.width,64/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
    alpha=im.getchannel('A').point(lambda x:255 if x>=128 else 0);im=im.convert('RGB').quantize(colors=32).convert('RGB');im.putalpha(alpha)
    cv=Image.new('RGBA',(96,64));cv.alpha_composite(im,((96-im.width)//2,64-im.height));cv.save(OUT/(key+'.png'))
print('Prepared two 96x64 building sprites; original shrine untouched')

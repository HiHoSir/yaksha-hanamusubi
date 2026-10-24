from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/settlement-editor/religious-v1'
meta=json.loads((OUT/'generation.json').read_text())
for key in ['komainu_left','komainu_right']:
    raw=Path(meta['assets'][key]['source'])
    if not raw.exists():
        assert (OUT/(key+'.png')).exists();continue
    im=Image.open(raw).convert('RGBA');box=im.getchannel('A').point(lambda x:255 if x>=128 else 0).getbbox()
    if box is None:raise ValueError('empty alpha')
    im=im.crop(box);scale=min(32/im.width,32/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
    alpha=im.getchannel('A').point(lambda x:255 if x>=128 else 0)
    im=im.convert('RGB').quantize(colors=32).convert('RGB');im.putalpha(alpha)
    cv=Image.new('RGBA',(32,32));cv.alpha_composite(im,((32-im.width)//2,32-im.height));cv.save(OUT/(key+'.png'))
print('Prepared two 32x32 komainu sprites')

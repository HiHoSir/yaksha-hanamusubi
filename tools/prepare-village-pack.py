from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'assets/settlement-editor/pack-v1'; CHIPS=ROOT/'assets/settlement-editor/chips'
paths=json.loads((OUT/'generation.json').read_text())['sources']
def hard(im):
    im=im.convert('RGBA');alpha=im.getchannel('A').point(lambda x:255 if x>=128 else 0)
    rgb=im.convert('RGB').quantize(colors=32).convert('RGB');rgb.putalpha(alpha);return rgb
def obj(raw,w=32,h=32,pad=2):
    im=Image.open(raw).convert('RGBA');mask=im.getchannel('A').point(lambda x:255 if x>=128 else 0);box=mask.getbbox()
    if not box:raise ValueError('empty alpha '+str(raw))
    im=im.crop(box);s=min((w-pad*2)/im.width,(h-pad)/im.height);im=hard(im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.Resampling.NEAREST))
    out=Image.new('RGBA',(w,h));out.alpha_composite(im,((w-im.width)//2,h-im.height));return out
for key,p in paths.items():
    if not Path(p).exists():
        Image.open(OUT/'source'/f'{key}.png').save(OUT/f'{key}.png');continue
    if key in ['cobble','gravel']:
        im=Image.open(p).convert('RGBA');w,h=im.size;im=hard(im.crop((w//4,h//4,w*3//4,h*3//4)).resize((32,32),Image.Resampling.NEAREST));im.putalpha(255)
    else:im=obj(p,96,64,0) if key=='barn' else obj(p)
    im.save(OUT/'source'/f'{key}.png');im.save(OUT/f'{key}.png')
# Existing approved materials and object art are reused without generation.
im=Image.open(CHIPS/'building_west_home.png').crop((2,17,94,79)).resize((96,64),Image.Resampling.NEAREST);im=hard(im)
font=ImageFont.truetype('/tmp/settlement-NotoSansJP.ttf',13) if Path('/tmp/settlement-NotoSansJP.ttf').exists() else None
boards=Image.new('RGBA',(108,14)) if font else Image.open(OUT/'source/sign-boards.png')
labels=[('shop','店'),('inn','宿'),('medicine','薬'),('weapon','武'),('armor','防'),('tools','具')]
for index,(key,label) in enumerate(labels):
    board=Image.open(CHIPS/'building_inn.png').crop((66,48,93,66)).resize((18,14),Image.Resampling.NEAREST).convert('RGBA')
    if font:
        d=ImageDraw.Draw(board);d.rectangle((1,1,16,12),fill=(234,231,207,255));d.text((9,6),label,font=font,anchor='mm',fill=(29,26,20,255),stroke_width=0);board=hard(board);boards.alpha_composite(board,(index*18,0))
    else:board=boards.crop((index*18,0,index*18+18,14))
    sign=Image.new('RGBA',(32,32));sign.alpha_composite(board,(7,18));sign.save(OUT/f'sign_{key}.png')
    shop=im.copy();shop.alpha_composite(board,(39,31));shop.save(OUT/f'small_{key}.png')
boards.save(OUT/'source/sign-boards.png')
for key,src in [('stepping_stone','rocks'),('pebbles','rocks')]:
    stone=obj(CHIPS/f'{src}.png',32,16 if key=='stepping_stone' else 10,2);out=Image.new('RGBA',(32,32));out.alpha_composite(stone,(0,32-stone.height));out.save(OUT/f'{key}.png')
soil=Image.open(ROOT/'assets/settlement-editor/terrain-v1/road-source.png');soil.save(OUT/'source/soil.png')
print('Prepared source art, six shop variants, six signs and small ground decorations')

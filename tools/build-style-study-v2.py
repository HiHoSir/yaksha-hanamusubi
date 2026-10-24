"""Near-full-cell candidates; preserve illustrated shapes, edit repeated Jizo rows."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/characters/style-study-v2'
frames={}
manifest=[]
for name in ['chief','jizo']:
    im=Image.open(OUT/'source'/f'{name}.png').convert('RGBA')
    if name=='chief':
        s=min(28/im.width,30/im.height)
        im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
    else:
        # Uniform width-first sampling, followed by intentional pixel-row editing.
        # Remove only repeated forehead, lower robe and pedestal rows. Never stretch X.
        im=im.resize((26,33),Image.Resampling.LANCZOS)
        kept=[y for y in range(33) if y not in (4,26,31)]
        edited=Image.new('RGBA',(26,30))
        for y,sy in enumerate(kept): edited.paste(im.crop((0,sy,26,sy+1)),(0,y))
        im=edited
    im.putalpha(im.getchannel('A').point(lambda a:255 if a>=100 else 0))
    frame=Image.new('RGBA',(32,32));frame.alpha_composite(im,((32-im.width)//2,(32-im.height)//2))
    frame.save(OUT/f'{name}-32.png');frames[name]=frame
    b=frame.getbbox();manifest.append({'id':name,'frame':[32,32],'bounds':b,'visibleSize':[b[2]-b[0],b[3]-b[1]],'status':'visual candidate','placement':'visible-center'})
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
hero=Image.open(ROOT/'assets/characters/hizuki/field-sd-v1/walk-atlas-32.png').convert('RGBA').crop((32,0,64,32))
cells=[('Hizuki',hero),('Chief v1',Image.open(ROOT/'assets/characters/style-study-v1/chief-32.png')),('Chief v2',frames['chief']),('Jizo v1',Image.open(ROOT/'assets/characters/style-study-v1/jizo-32.png')),('Jizo v2',frames['jizo'])]
preview=Image.new('RGB',(800,240),'#95bf69');d=ImageDraw.Draw(preview)
for i,(name,im) in enumerate(cells):
    preview.paste(im,(i*160+64,6),im)
    big=im.resize((128,128),Image.Resampling.NEAREST);preview.paste(big,(i*160+16,62),big)
    d.rectangle((i*160+16,62,i*160+143,189),outline='#cce1b5')
    b=im.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox();d.text((i*160+38,203),name,fill='black');d.text((i*160+46,219),f'{b[2]-b[0]} x {b[3]-b[1]}',fill='black')
preview.save(ROOT/'qa/style-study-v2.png')
print(json.dumps(manifest))

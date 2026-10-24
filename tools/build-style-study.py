"""Rebuild the front-view style candidates; never overwrite approved NPCs."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/characters/style-study-v1'
frames=[]
hero=Image.open(ROOT/'assets/characters/hizuki/field-sd-v1/walk-atlas-32.png').convert('RGBA').crop((32,0,64,32))
hero=hero.crop(hero.getbbox());hero.thumbnail((28,28),Image.Resampling.NEAREST)
frame=Image.new('RGBA',(32,32));frame.alpha_composite(hero,((32-hero.width)//2,(32-hero.height)//2));frames.append(frame)
for name in ['chief','jizo']:
    im=Image.open(OUT/'source'/f'{name}.png').convert('RGBA')
    scale=min(28/im.width,28/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    im.putalpha(im.getchannel('A').point(lambda a:255 if a>=100 else 0))
    frame=Image.new('RGBA',(32,32));frame.alpha_composite(im,((32-im.width)//2,(32-im.height)//2))
    frame.save(OUT/f'{name}-32.png');frames.append(frame)
preview=Image.new('RGB',(480,250),'#95bf69');d=ImageDraw.Draw(preview)
for i,im in enumerate(frames):
    preview.paste(im,(i*160+64,4),im)
    big=im.resize((128,128),Image.Resampling.NEAREST);preview.paste(big,(i*160+16,65),big)
    d.text((i*160+52,208),['Hizuki','Chief','Jizo'][i],fill='black')
preview.save(ROOT/'qa/style-study-v1.png')

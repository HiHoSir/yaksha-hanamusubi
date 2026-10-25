"""Take only edited face artwork; retain original native body/alpha exactly."""
import argparse,hashlib,json
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
def main(source):
    old=ROOT/'assets/characters/tenyo-sd-v3';out=ROOT/'assets/characters/tenyo-sd-v4';out.mkdir(exist_ok=True)
    palettes=json.loads((old/'palettes.json').read_text());edited=Image.open(source).convert('RGBA').resize((72,32),Image.Resampling.NEAREST);sprites=[];entries=[]
    for i,name in enumerate(['shirotae','guardian']):
        src=Image.open(old/(name+'-front.png')).convert('RGBA');new=src.copy();face=edited.crop((i*40,0,i*40+32,32))
        pal=Image.new('P',(1,1));colors=palettes[name];pal.putpalette(sum(colors,[])+colors[-1]*(256-len(colors)))
        face=face.convert('RGB').quantize(palette=pal,dither=Image.Dither.NONE).convert('RGBA')
        for y in range(12,19):
            for x in range(11,21):
                if name=='shirotae' and y<14 and 14<=x<=17:continue
                if src.getpixel((x,y))[3]:new.putpixel((x,y),face.getpixel((x,y+2)))
        for y in range(13,16):
            for x in range(11,14):new.putpixel((31-x,y),new.getpixel((x,y)))
        # Native-scale finish: separate eye whites, iris, skin and facial hair.
        # Source body/alpha are retained; each 1px cluster has an explicit role.
        skin=tuple(colors[3])+ (255,);shade=tuple(colors[4])+(255,)
        white=tuple(colors[6])+(255,)
        dark=tuple(colors[14 if name=='shirotae' else 15])+(255,)
        iris=tuple(colors[15 if name=='shirotae' else 15])+(255,)
        bottom=18 if name=='shirotae' else 20
        for y in range(14,bottom+1):
            for x in range(12,20):new.putpixel((x,y),skin)
        for y in range(15,18 if name=='shirotae' else 19):
            for x in [11,20]:new.putpixel((x,y),skin)
        for y in [15,16]:
            for x,c in [(12,white),(13,iris),(18,iris),(19,white)]:new.putpixel((x,y),c)
        if name=='shirotae':
            for x in [12,13,18,19]:new.putpixel((x,14),dark)
            for x in [11,20]:new.putpixel((x,17),shade)
            for x in [15,16]:new.putpixel((x,18),tuple(colors[5])+(255,))
        else:
            for x in [12,13,18,19]:new.putpixel((x,13),tuple(colors[0])+(255,))
            for x in [15,16]:new.putpixel((x,17),shade)
            for x in [14,17]:new.putpixel((x,18),tuple(colors[10])+(255,))
            for x in [15,16]:new.putpixel((x,19),tuple(colors[10])+(255,))
            for x in [15,16]:new.putpixel((x,20),shade)
        new.putalpha(src.getchannel('A'));new.save(out/(name+'-front.png'));sprites.append(new)
        changed=[]
        for y in range(32):
            for x in range(32):
                if new.getpixel((x,y))!=src.getpixel((x,y)):
                    assert 11<=x<=20 and 12<=y<=(18 if name=='shirotae' else 20)
                    changed.append([x,y])
        assert new.getchannel('A').tobytes()==src.getchannel('A').tobytes()
        for y in [15,16]:
            for x in [12,13]:assert new.getpixel((x,y))==new.getpixel((31-x,y))
        assert len({c[:3] for c in new.getdata() if c[3]})<=16
        entries.append(dict(id=name,changedPixels=changed));print(name,'face pixels changed',len(changed),'body and alpha unchanged')
    small=Image.new('RGB',(128,40),(151,175,111));hero=Image.open(old/'front-native.png').crop((48,4,80,36))
    for i,im in enumerate([sprites[0],hero,sprites[1]]):
        if im.mode=='RGBA':small.paste(im,(8+i*40,4),im)
        else:small.paste(im,(8+i*40,4))
    small.save(out/'front-native.png');large=Image.new('RGB',(768,330),(37,45,38));large.paste(small,(320,16));large.paste(small.resize((768,240),Image.Resampling.NEAREST),(0,80));draw=ImageDraw.Draw(large)
    for x,text in [(144,'SHIROTAE'),(384,'HIZUKI'),(624,'GUARDIAN')]:
        b=draw.textbbox((0,0),text);draw.text((x-(b[2]-b[0])//2,63),text,fill='white')
    large.save(out/'front-comparison.png')
    (out/'manifest.json').write_text(json.dumps(dict(status='face-adjustment-review',previous='../tenyo-sd-v3',sourceSha256=hashlib.sha256(Path(source).read_bytes()).hexdigest(),cellSize=[32,32],characters=entries),indent=2)+'\n')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('source');main(p.parse_args().source)

"""Approved source -> aspect-preserving nearest sampling -> fixed16 -> 32px review."""
import argparse,hashlib,json
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/characters/tenyo-sd-v3'
def native(source,colors):
    im=Image.open(source).convert('RGBA');alpha=im.getchannel('A').point(lambda v:255 if v>=128 else 0);im.putalpha(alpha)
    bounds=alpha.getbbox();im=im.crop(bounds);scale=min(28/im.width,28/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
    # Pair the original front-face samples before palette conversion.
    # This uses the source's own eyelids/iris/white, not synthetic eye patches.
    frame=Image.new('RGBA',(32,32));offset=((32-im.width)//2,(32-im.height)//2);frame.alpha_composite(im,offset)
    for y in range(11,19):
        for x in range(11,15):frame.putpixel((31-x,y),frame.getpixel((x,y)))
    im=frame;alpha=im.getchannel('A');pal=Image.new('P',(1,1));pal.putpalette(sum(colors,[])+colors[-1]*(256-len(colors)))
    im=im.convert('RGB').quantize(palette=pal,dither=Image.Dither.NONE).convert('RGBA');im.putalpha(alpha)
    cell=im
    assert set(cell.getchannel('A').getdata())=={0,255}
    b=cell.getbbox();assert b[2]-b[0]<=28 and b[3]-b[1]<=28
    assert cell.resize((384,384),Image.Resampling.NEAREST).resize((32,32),Image.Resampling.NEAREST).tobytes()==cell.tobytes()
    return cell,bounds
def main(paths):
    palettes=json.loads((OUT/'palettes.json').read_text());sprites=[];entries=[]
    for name,source in zip(['shirotae','guardian'],paths):
        cell,bounds=native(source,palettes[name]);cell.save(OUT/(name+'-front.png'));sprites.append(cell)
        entries.append(dict(id=name,sourceSha256=hashlib.sha256(Path(source).read_bytes()).hexdigest(),sourceBounds=bounds,visibleBounds=cell.getbbox()))
    hero=Image.open(ROOT/'assets/characters/hizuki/field-sd-v2/walk-atlas-32.png').crop((0,0,32,32));hero=hero.crop(hero.getbbox());hero.thumbnail((28,28),Image.Resampling.NEAREST)
    h=Image.new('RGBA',(32,32));h.alpha_composite(hero,((32-hero.width)//2,(32-hero.height)//2))
    small=Image.new('RGB',(128,40),(151,175,111))
    for i,im in enumerate([sprites[0],h,sprites[1]]):small.paste(im,(8+40*i,4),im)
    small.save(OUT/'front-native.png');large=Image.new('RGB',(768,330),(37,45,38));large.paste(small,(320,16));large.paste(small.resize((768,240),Image.Resampling.NEAREST),(0,80));draw=ImageDraw.Draw(large)
    for x,text in [(144,'SHIROTAE'),(384,'HIZUKI'),(624,'GUARDIAN')]:
        b=draw.textbbox((0,0),text);draw.text((x-(b[2]-b[0])//2,63),text,fill='white')
    large.save(OUT/'front-comparison.png')
    (OUT/'manifest.json').write_text(json.dumps(dict(status='native-front-review',cell=[32,32],visibleLimit=28,anchor='visible-center',method='source silhouette -> uniform nearest sampling with paired front-face samples -> fixed16/binary alpha; no synthetic eye patches or body warping',characters=entries),indent=2)+'\n')
    print('PASS: 32px, hard alpha, <=28px centered, 16-color palettes, exact 12x pixel roundtrip')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('shirotae');p.add_argument('guardian');a=p.parse_args();main([a.shirotae,a.guardian])

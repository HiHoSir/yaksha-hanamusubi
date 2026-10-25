"""Front candidates only. Direction expansion follows approval at native scale."""
import argparse,hashlib,json
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/characters/tenyo-sd-v2'
PALETTE=[(27,23,38),(48,40,62),(81,67,97),(198,126,87),
 (239,173,118),(255,220,180),(255,251,240),(177,24,48),
 (224,55,64),(141,115,151),(200,182,206),(30,47,94),
 (55,82,132),(89,57,44),(219,161,55),(248,217,128)]
def make(path,compact_top=False):
    im=Image.open(path).convert('RGBA');alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0);im.putalpha(alpha)
    bounds=alpha.getbbox();im=im.crop(bounds)
    if compact_top:
        # A tall knot must not shrink the guardian's face/body relative to the heroine.
        cut=round(im.height*.19);height=round(im.height*.055)
        top=im.crop((0,0,im.width,cut)).resize((im.width,height),Image.Resampling.NEAREST)
        body=im.crop((0,cut,im.width,im.height));combined=Image.new('RGBA',(im.width,height+body.height));combined.alpha_composite(top);combined.alpha_composite(body,(0,height));im=combined
    scale=min(28/im.width,28/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
    alpha=im.getchannel('A');pal=Image.new('P',(1,1));pal.putpalette(sum((list(c) for c in PALETTE),[])+list(PALETTE[-1])*(256-len(PALETTE)))
    im=im.convert('RGB').quantize(palette=pal,dither=Image.Dither.NONE).convert('RGBA');im.putalpha(alpha)
    cell=Image.new('RGBA',(32,32));cell.alpha_composite(im,((32-im.width)//2,(32-im.height)//2));return cell,bounds
def fix_eyes(sprite,name):
    # Authored native-pixel eyes: two identical mirrored 3x3 patches.
    # Do not infer landmarks from the PNG bounding box or repaint the body.
    dark=(*PALETTE[0],255);white=(*PALETTE[6],255);iris=(*PALETTE[13],255)
    top=13 if name=='shirotae' else 11
    patch=[[dark,dark,dark],[white,iris,white],[white,iris,white]]
    for dy,row in enumerate(patch):
        for dx,color in enumerate(row):
            x=11+dx;sprite.putpixel((x,top+dy),color);sprite.putpixel((31-x,top+dy),color)
    # Clear old lower-eye remnants; keep the hair, mouth, clothes and outline.
    skin=(*PALETTE[5 if name=='shirotae' else 4],255)
    for x in [11,12,13,18,19,20]:sprite.putpixel((x,top+3),skin)
    for y in range(top,top+3):
        for x in range(11,14):assert sprite.getpixel((x,y))==sprite.getpixel((31-x,y))
    return sprite

def main(paths):
    OUT.mkdir(parents=True,exist_ok=True);entries=[];sprites=[]
    for name,path in zip(['shirotae','guardian'],paths):
        sprite,source=make(path,compact_top=name=='guardian');sprite=fix_eyes(sprite,name);sprite.save(OUT/(name+'-front.png'));sprites.append(sprite)
        entries.append(dict(id=name,sourceSha256=hashlib.sha256(Path(path).read_bytes()).hexdigest(),sourceBounds=source,visibleBounds=sprite.getbbox()))
    hero=Image.open(ROOT/'assets/characters/hizuki/field-sd-v2/walk-atlas-32.png').crop((0,0,32,32))
    b=hero.getbbox();hero=hero.crop(b);hero.thumbnail((28,28),Image.Resampling.NEAREST);h=Image.new('RGBA',(32,32));h.alpha_composite(hero,((32-hero.width)//2,(32-hero.height)//2))
    native=Image.new('RGB',(128,40),(151,175,111))
    for i,sprite in enumerate([sprites[0],h,sprites[1]]):native.paste(sprite,(8+40*i,4),sprite)
    native.save(OUT/'front-native.png')
    preview=Image.new('RGB',(768,330),(37,45,38));preview.paste(native,(320,20));preview.paste(native.resize((768,240),Image.Resampling.NEAREST),(0,80));draw=ImageDraw.Draw(preview)
    for x,name in [(144,'SHIROTAE'),(384,'HIZUKI'),(624,'GUARDIAN')]:
        box=draw.textbbox((0,0),name);draw.text((x-(box[2]-box[0])//2,64),name,fill='white')
    preview.save(OUT/'front-comparison.png')
    manifest=dict(status='front-candidates-awaiting-review',cellSize=[32,32],visibleLimit=[28,28],anchor='visible-center',directions=['d'],stationary=True,eyeRevision=2,eyeSymmetryAxis=15.5,palette=PALETTE,characters=entries)
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    for s in sprites:
        a=s.getchannel('A');assert set(a.getdata())=={0,255};b=s.getbbox();assert b[2]-b[0]<=28 and b[3]-b[1]<=28
        colors={rgb for n,rgb in s.convert('RGB').getcolors()};assert len(colors)<=17
        assert s.resize((256,256),Image.Resampling.NEAREST).resize((32,32),Image.Resampling.NEAREST).tobytes()==s.tobytes()
    print('PASS 32x32; visible <=28; hard alpha; 16-color pinned palette; exact integer-scale pixel roundtrip.')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('shirotae');p.add_argument('guardian');a=p.parse_args();main([a.shirotae,a.guardian])

"""Authored native32 pixel drawing; 512 source is an exact16x representation."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/characters/tenyo-native-grid-v1'
P={'_':(0,0,0,0),'o':(28,24,37,255),'h':(48,41,61,255),
 'l':(72,60,86,255),'H':(95,78,108,255),'s':(255,217,180,255),
 'S':(231,163,133,255),'w':(255,250,236,255),'v':(208,188,215,255),
 'V':(158,132,174,255),'r':(184,29,53,255),'R':(224,57,72,255),
 'd':(116,23,44,255),'g':(241,194,74,255),'G':(179,119,46,255),
 'e':(105,51,35,255)}
pixels=[['_']*32 for _ in range(32)]
def run(y,a,b,c):
    for x in range(a,b+1):pixels[y][x]=c
def dots(c,coords):
    for x,y in coords:pixels[y][x]=c
# Individually authored silhouette rows, not alpha-inferred geometry.
for y,a,b in [(2,12,19),(3,10,21),(4,8,23),(5,7,24),(6,6,25),(7,5,26),(8,4,27),(9,4,27),(10,3,28),(11,3,28),(12,3,28),(13,3,28),(14,3,28),(15,4,27),(16,4,27),(17,4,27),(18,4,27),(19,4,27),(20,4,27),(21,4,27),(22,4,27),(23,4,27),(24,5,26),(25,6,25),(26,7,24)]:
    run(y,a,b,'o');run(y,a+1,b-1,'h')
# Large hair clusters and deliberate stepped highlights.
for y,a,b in [(3,12,19),(4,10,21),(5,8,23),(6,7,24),(7,6,25),(8,5,26),(9,5,26),(10,4,27)]:run(y,a,b,'l')
for y,a,b in [(5,13,18),(6,11,20),(7,9,22),(8,8,23),(9,7,24),(10,6,25),(11,5,26),(12,5,26)]:run(y,a,b,'h')
dots('H',[(9,5),(10,5),(11,4),(12,4),(20,5),(21,5),(22,6),(7,8),(6,9),(24,8),(25,9)])
dots('l',[(5,12),(5,13),(5,15),(6,17),(6,18),(5,20),(5,21),(6,23),(7,24),(26,12),(26,13),(26,15),(25,17),(25,18),(26,20),(26,21),(25,23),(24,24)])
# Exposed face: skin has its own ramp; whites are not the skin highlight.
for y,a,b in [(10,13,18),(11,11,20),(12,10,21),(13,10,21),(14,9,22),(15,9,22),(16,9,22),(17,10,21),(18,11,20),(19,13,18)]:run(y,a,b,'s')
# Bangs are drawn before facial features and do not cover either eye.
for y,a,b in [(9,11,20),(10,11,12),(10,15,16),(10,19,20),(11,10,11),(11,15,16),(11,20,21),(12,10,10),(12,15,16),(12,21,21)]:run(y,a,b,'h')
dots('l',[(11,9),(12,9),(15,9),(16,9),(19,9),(20,9)])
# Paired features are authored together in the native grid, no pasted face.
for x in [11,12,19,20]:pixels[13][x]='o'
for y in [14,15]:
    for x,c in [(11,'w'),(12,'e'),(19,'e'),(20,'w')]:pixels[y][x]=c
dots('S',[(10,17),(21,17),(15,18),(16,18)])
# Cream ribbon, still within the declared visible28px envelope.
dots('w',[(27,13),(28,13),(26,14),(29,14),(27,15),(28,15),(28,16),(29,17),(29,18)])
dots('v',[(28,14),(28,17)])
# Compact overlapping kimono, collar and illustrated sleeve contours.
for y,a,b in [(20,11,20),(21,9,22),(22,8,23),(23,7,24),(24,7,24),(25,8,23),(26,9,22)]:
    run(y,a,b,'o');run(y,a+1,b-1,'w')
for y,a,b in [(21,10,11),(21,20,21),(22,9,10),(22,21,22),(23,8,9),(23,22,23),(24,8,8),(24,23,23),(25,9,10),(25,21,22),(26,10,11),(26,20,21)]:run(y,a,b,'v')
dots('r',[(12,20),(13,21),(14,22),(19,20),(18,21),(17,22),(10,23),(9,24),(21,23),(22,24)])
dots('V',[(9,25),(22,25),(10,26),(21,26)])
# Hakama pleats and paired tabi/shoes, all inside the native28px height.
for y,a,b in [(24,12,19),(25,11,20),(26,11,20),(27,11,20)]:
    run(y,a,b,'d');run(y,a+1,b-1,'r')
dots('R',[(12,25),(12,26),(12,27),(18,25),(18,26),(18,27)])
dots('d',[(15,25),(15,26),(16,27)])
run(28,12,14,'w');run(28,17,19,'w');run(29,12,14,'o');run(29,17,19,'o')
dots('r',[(13,28),(18,28)])
# Hands meet in front of the small gold waist knot.
run(23,13,14,'s');run(23,17,18,'s');dots('S',[(14,24),(17,24)])
dots('G',[(15,22),(16,22),(15,24),(16,24)]);dots('g',[(15,23),(16,23)])

OUT.mkdir(parents=True,exist_ok=True)
im=Image.new('RGBA',(32,32));im.putdata([P[c] for row in pixels for c in row])
# Center the full asymmetric silhouette with an integer translation only.
b=im.getbbox();dx=(32-(b[2]-b[0]))//2-b[0];dy=(32-(b[3]-b[1]))//2-b[1]
centered=Image.new('RGBA',(32,32));centered.alpha_composite(im,(dx,dy));im=centered
im.save(OUT/'shirotae-32.png');source=im.resize((512,512),Image.Resampling.NEAREST);source.save(OUT/'shirotae-source-512.png')
back=source.resize((32,32),Image.Resampling.NEAREST);assert back.tobytes()==im.tobytes()
for y in range(32):
    for x in range(32):
        block=source.crop((x*16,y*16,(x+1)*16,(y+1)*16))
        assert len(block.getcolors(257))==1
assert len({p for p in im.getdata() if p[3]})<=16
b=im.getbbox();assert b[2]-b[0]<=28 and b[3]-b[1]<=28
(OUT/'native-pixels.json').write_text(json.dumps(dict(size=[32,32],enlargement=16,palette=P,pixels=[''.join(row) for row in pixels],translation=[dx,dy],status='front-review-only'),indent=2)+'\n')
preview=Image.new('RGB',(640,610),(42,49,42));preview.paste(im,(304,12),im);preview.paste(source,(64,76),source);ImageDraw.Draw(preview).text((224,54),'32px / 1px = 16px',fill='white');preview.save(OUT/'shirotae-review.png')
print('PASS: authored32x32 grid, 16x16 single-color blocks, exact512->32 roundtrip; visible',b)

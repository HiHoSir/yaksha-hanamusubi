from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
from collections import Counter
import json, hashlib, copy

ROOT=Path(__file__).parent
src=ROOT/'input/sprite-walk-4dir(1).json'
if not src.exists():src=ROOT/'source-user-edited.json'
OUT=ROOT/('hizuki32_review' if src.parent.name=='input' else 'rebuilt')
OUT.mkdir(exist_ok=True)
original=json.loads(src.read_text())
assert original['format']=='yaksha-pixel-v3'
assert original['width']==original['height']==32
assert original['order']==['front','back','left','right']
assert original['poses']==['idle','walkA','walkB']
for direction in original['order']:
    assert len(original['frames'][direction])==3
    for a in original['frames'][direction]:
        assert len(a)==4096 and all(type(v)==int and 0<=v<=255 for v in a)
before={k:[Image.frombytes('RGBA',(32,32),bytes(a)) for a in original['frames'][k]] for k in original['order']}
T=(0,0,0,0)
skin=(246,198,165,255); shade=(231,166,144,255)
dark=(26,19,36,255); red=(152,52,63,255); lightred=(192,69,76,255)
white=(249,238,224,255); gold=(247,190,90,255)
eye=(93,18,26,255); blue=(128,185,229,255); bluedark=(96,150,199,255)
line=(34,45,74,255)

# User face is locked; only two red-brown chin pixels are softened.
front=before['front'][0].copy()
for x in [14,17]:
    assert front.getpixel((x,16))==(186,101,95,255)
    front.putpixel((x,16),shade)

# Rear outline is centered one pixel left; preserve the original bob's shape.
back=Image.new('RGBA',(32,32))
back.alpha_composite(before['back'][0],(-1,0))
for y in range(2,16):
    for x in range(32):
        if back.getpixel((x,y))==(38,48,75,255):back.putpixel((x,y),line)
# Match the front's 1px sole baseline without resampling or trimming the head.
for y in range(27,32):
    for x in range(32):back.putpixel((x,y),T)
for x in [12,13,16,17]:back.putpixel((x,27),skin)
for y in [28,29]:
    for x,c in [(11,dark),(12,red),(13,red),(14,dark),(15,dark),(16,red),(17,red),(18,dark)]:back.putpixel((x,y),c)
for x in [12,13,16,17]:back.putpixel((x,30),dark)

# Use the existing left as the profile master, never the rejected generated art.
left=before['left'][0].copy()
# Preserve face silhouette and base skin; match the user's small two-pixel eye.
for y in [13,14]:
    assert left.getpixel((12,y))==(185,67,89,255)
    left.putpixel((12,y),eye)
# Existing profile boots were red all the way down; add a dark short-boot sole.
for y in range(27,32):
    for x in range(32):left.putpixel((x,y),T)
for x,c in [(14,skin),(15,shade),(16,skin)]:left.putpixel((x,27),c)
for y in [28,29]:
    for x,c in [(13,dark),(14,red),(15,red),(16,red),(17,dark)]:left.putpixel((x,y),c)
for x in range(14,18):left.putpixel((x,30),dark)
right=left.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
idle={'front':front,'back':back,'left':left,'right':right}
after={k:[v.copy(),v.copy(),v.copy()] for k,v in idle.items()}

def lift_leg(im,x0,x1):
    # Lift one leg 1px from a fixed origin; never translate head/face/body.
    patch=im.crop((x0,27,x1+1,31))
    for y in range(27,31):
        for x in range(x0,x1+1):im.putpixel((x,y),T)
    im.alpha_composite(patch,(x0,26))

for k in ['front','back']:
    # Opposite legs lift in A/B. Tiny sleeve changes provide opposite arm swing.
    for p,(x0,x1,arm_x) in enumerate([(12,14,20),(16,18,10)],1):
        im=after[k][p]
        lift_leg(im,x0,x1)
        # Foreground hand/sleeve highlight changes stay below the fixed head.
        im.putpixel((arm_x,23),white)
        im.putpixel((arm_x,24),skin)
        im.putpixel((arm_x,25),red)

def profile_step(im,pose):
    for y in range(27,32):
        for x in range(32):im.putpixel((x,y),T)
    # Two short legs, alternating which boot reaches ground. Facing left.
    ground,raised=((11,18) if pose==1 else (17,12))
    for x0,base in [(ground,30),(raised,29)]:
        for x in [x0+1,x0+2]:im.putpixel((x,26),shade if x0==raised else skin)
        for x in [x0+1,x0+2]:im.putpixel((x,27),skin)
        for y in range(28,base):
            for dx,c in [(0,dark),(1,red),(2,red),(3,dark)]:im.putpixel((x0+dx,y),c)
        for dx in range(1,4):im.putpixel((x0+dx,base),dark)
    # A small near sleeve/hand shifts opposite the near leg; body stays fixed.
    dx=1 if pose==1 else -1
    for x,y in [(18,20),(19,20),(19,21),(19,22)]:
        if im.getpixel((x,y))[3]:im.putpixel((x,y),red)
    for x,y,c in [(18,20,white),(19,20,white),(19,21,red),(19,22,skin)]:im.putpixel((x+dx,y),c)

for p in [1,2]:
    profile_step(after['left'][p],p)
    after['right'][p]=after['left'][p].transpose(Image.Transpose.FLIP_LEFT_RIGHT)

edited=copy.deepcopy(original)
diff=[]; metrics={}
for k in original['order']:
    metrics[k]=[]
    for p,im in enumerate(after[k]):
        edited['frames'][k][p]=list(im.tobytes())
        im.save(OUT/f'hizuki-{k}-{original["poses"][p]}-32.png')
        for y in range(32):
            for x in range(32):
                a=before[k][p].getpixel((x,y));b=im.getpixel((x,y))
                if a!=b:diff.append(dict(direction=k,pose=original['poses'][p],x=x,y=y,old=list(a),new=list(b)))
        bbox=im.getbbox(); colors=Counter(im.getdata()); alpha=Counter(im.getchannel('A').getdata())
        # Connected component sizes under 4-neighbour adjacency.
        seen=set();components=[]
        for yy in range(32):
            for xx in range(32):
                if (xx,yy) in seen or not im.getpixel((xx,yy))[3]:continue
                stack=[(xx,yy)];seen.add((xx,yy));n=0
                while stack:
                    x,y=stack.pop();n+=1
                    for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                        if 0<=nx<32 and 0<=ny<32 and (nx,ny) not in seen and im.getpixel((nx,ny))[3]:
                            seen.add((nx,ny));stack.append((nx,ny))
                components.append(n)
        metrics[k].append(dict(pose=original['poses'][p],bbox_exclusive=list(bbox),width=bbox[2]-bbox[0],height=bbox[3]-bbox[1],bottom=bbox[3]-1,opaque_pixels=alpha[255],opaque_colors=len(colors)-1,alpha_values=list(alpha),components=sorted(components,reverse=True),head_matches_idle=im.crop((0,0,32,17)).tobytes()==after[k][0].crop((0,0,32,17)).tobytes()))

(OUT/'hizuki32-edited.json').write_text(json.dumps(edited,separators=(',',':')))
(OUT/'pixel-diff.json').write_text(json.dumps({'coordinate_origin':'0-based top-left','source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'changes':diff},ensure_ascii=False,indent=2))
atlas=Image.new('RGBA',(96,128))
for row,k in enumerate(['front','back','right','left']):
    for col,im in enumerate(after[k]):atlas.alpha_composite(im,(col*32,row*32))
atlas.save(OUT/'hizuki-walk-atlas-96x128.png')
strip=Image.new('RGBA',(128,32))
for col,k in enumerate(original['order']):strip.alpha_composite(after[k][0],(col*32,0))
strip.save(OUT/'hizuki-idle-4dir-128x32.png')

def backed(im):
    bg=Image.new('RGBA',im.size,(88,101,114,255));bg.alpha_composite(im);return bg.convert('RGB')
def contact(frames):
    result=Image.new('RGB',(4*224,3*244),(30,37,46));d=ImageDraw.Draw(result)
    for col,k in enumerate(original['order']):
        for row,im in enumerate(frames[k]):
            d.text((col*224+8,row*244+5),f'{k} / {original["poses"][row]}',fill='white')
            result.paste(backed(im).resize((192,192),Image.Resampling.NEAREST),(col*224+8,row*244+26))
            result.paste(backed(im),(col*224+204-32,row*244+26+192+4))
    return result
contact(after).save(OUT/'hizuki-12frames-preview-6x.png')
comparison=Image.new('RGB',(4*208,2*230),(30,37,46));d=ImageDraw.Draw(comparison)
for col,k in enumerate(original['order']):
    for row,im in enumerate([before[k][0],after[k][0]]):
        d.text((col*208+8,row*230+4),f'{k} / '+('BEFORE' if row==0 else 'EDITED'),fill='white')
        comparison.paste(backed(im).resize((192,192),Image.Resampling.NEAREST),(col*208+8,row*230+24))
comparison.save(OUT/'hizuki-before-after-6x.png')
gif=[]
for p in [0,1,0,2]:
    canvas=Image.new('RGB',(4*144,164),(30,37,46));d=ImageDraw.Draw(canvas)
    for col,k in enumerate(original['order']):
        d.text((col*144+8,4),k,fill='white')
        canvas.paste(backed(after[k][p]).resize((128,128),Image.Resampling.NEAREST),(col*144+8,24))
    gif.append(canvas)
gif[0].save(OUT/'hizuki-walk-preview-4x.gif',save_all=True,append_images=gif[1:],duration=150,loop=0,disposal=2)
report={'status':'ASSET CANDIDATE - user visual approval pending','baseline_main':'97f0fc06e8fcf2d110cca0461742d870363c87af','beta':'16.1.58','source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'dimensions':[32,32],'atlas':{'dimensions':[96,128],'rows':['front','back','right','left'],'columns':['idle','walkA','walkB']},'static_strip_order':original['order'],'head_lock_rows':[0,16],'front_idle_changes':sum(d['direction']=='front' and d['pose']=='idle' for d in diff),'front_eyes_unchanged':all(before['front'][0].getpixel((x,y))==after['front'][0].getpixel((x,y)) for x in [13,18] for y in [12,13]),'raw_height_29px_intentional':True,'runtime_scale_note':'game.js uses fixed idle bounds: scale = 28 / idle opaque height (camera excluded). Front 29px => 0.965517; no image resampling or runtime changes made.','frames':metrics,'changed_pixels':len(diff),'github':'pending','editor_roundtrip':'pending','safari':'not tested','pages':'not published'}
(OUT/'qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))

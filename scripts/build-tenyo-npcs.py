"""Prepare approved static NPCs without changing illustration or aspect ratio."""
from pathlib import Path
import hashlib, json, itertools
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'assets/characters/tenyo-npc-v1'
SPECS = [('shirotae', '白妙', 'miko', [(0,0),(1,0),(0,1),(1,1)]),
         ('guardian', '社守', 'guard', [(0,0),(1,0),(1,1),(0,1)])]
manifest = {'format':'yaksha-static-npc-v1','cellSize':[256,256],
            'directions':['d','u','l','r'],'visibleHeight':232,'footAnchor':[128,248],
            'adultHeightRatio':.96,'characters':[]}
for name, label, role, cells in SPECS:
    path = ROOT / 'source' / (name+'.png')
    source = Image.open(path).convert('RGBA')
    cw = source.width//2
    # Generated rows are not assumed to divide at half the canvas height.
    full_mask = source.getchannel('A').point(lambda a:255 if a>8 else 0)
    gaps = [y for y in range(int(source.height*.44),int(source.height*.56))
            if full_mask.crop((0,y,source.width,y+1)).getbbox() is None]
    runs = [list(g) for _,g in itertools.groupby(gaps,key=lambda y,c=itertools.count():y-next(c))]
    assert runs, 'a clear row gap is required'
    gap = max(runs,key=len)
    ys = [0,(gap[0]+gap[-1]+1)//2,source.height]
    atlas = Image.new('RGBA', (256,1024))
    frames = []
    for row, (cx, cy) in enumerate(cells):
        source_rect = (cx*cw,ys[cy],(cx+1)*cw,ys[cy+1])
        frame = source.crop(source_rect)
        mask = frame.getchannel('A').point(lambda a:255 if a>8 else 0)
        box = mask.getbbox()
        assert box, (name,row)
        x0,y0,x1,y1 = box
        assert 0<x0<x1<frame.width and 0<y0<y1<frame.height, 'source frame touches cell edge'
        # Ground anchor uses the illustrated soles, rather than long hair/sleeves.
        alpha = frame.getchannel('A')
        weights = [(x,alpha.getpixel((x,y))) for y in range(max(y0,y1-10),y1) for x in range(x0,x1)]
        total = sum(a for _,a in weights)
        foot_x = sum((x+.5)*a for x,a in weights)/total
        padded = (max(0,x0-2),max(0,y0-2),min(cw,x1+2),min(frame.height,y1+2))
        piece = frame.crop(padded)
        scale = 232/(y1-y0)
        size = (round(piece.width*scale),round(piece.height*scale))
        piece = piece.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')
        px = round(128-(foot_x-padded[0])*scale)
        py = round(248-(y1-padded[1])*scale)
        assert px>=0 and py>=0 and px+piece.width<=256 and py+piece.height<=256, 'no clipping'
        atlas.alpha_composite(piece,(px,row*256+py))
        frames.append({'direction':manifest['directions'][row],'sourceCell':[cx,cy],
                       'sourceRect':list(source_rect),'sourceBounds':list(box),'sourceFoot':[round(foot_x,3),y1],
                       'scale':scale,'destination':[px,row*256+py,*size]})
    atlas.save(ROOT/(name+'.png'),optimize=True)
    manifest['characters'].append({'id':name,'name':label,'type':role,
        'sourceSize':list(source.size),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
        'frames':frames})
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Built 2 RGBA atlases: 256x1024, d/u/l/r, 232px bodies at (128,248)')

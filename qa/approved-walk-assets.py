from pathlib import Path
from PIL import Image
import hashlib,json
for directory in ['assets/characters/hizuki/field-sd-v3','assets/characters/tenyo-npc-v3']:
    root=Path(directory)
    m=json.loads((root/'manifest.json').read_text())
    raw=(root/'editor.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest()==m['source_sha256'],'original JSON changed'
    d=json.loads(raw)
    assert d['format']=='yaksha-pixel-v3' and d['width']==d['height']==32
    atlas=Image.open(root/m['atlas'])
    assert atlas.mode=='RGBA' and atlas.size==(96,128)
    for row,direction in enumerate(['front','back','right','left']):
        assert len(d['frames'][direction])==3
        for col,a in enumerate(d['frames'][direction]):
            assert len(a)==4096 and all(type(v)==int and 0<=v<=255 for v in a)
            frame=atlas.crop((col*32,row*32,col*32+32,row*32+32))
            assert frame.tobytes()==bytes(a),(directory,direction,col,'RGBA mismatch')
            assert frame.getbbox()==tuple(m['bounds'][direction][col])
            assert set(a[3::4])=={0,255}
    print('PASS',m['id'],': all 12 frames match user RGBA and authored bounce')

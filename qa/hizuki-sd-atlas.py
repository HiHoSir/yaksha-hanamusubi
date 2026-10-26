from pathlib import Path
from PIL import Image
import json

root=Path('assets/characters/hizuki/field-sd-v3')
atlas=Image.open(root/'walk-atlas-32.png').convert('RGBA')
editor=json.loads((root/'editor.json').read_text())
assert atlas.size==(96,128)
for row,direction in enumerate(['front','back','right','left']):
    head=None
    for col in range(3):
        im=atlas.crop((col*32,row*32,col*32+32,row*32+32))
        assert im.tobytes()==bytes(editor['frames'][direction][col])
        assert im.getbbox()[1]==3 and im.getbbox()[3]==30
        pixels=list(im.getdata())
        assert all(v[3] in (0,255) and (v[3] or v==(0,0,0,0)) for v in pixels)
        current=im.crop((0,0,32,18)).tobytes()
        if head is None:head=current
        else:assert head==current,(direction,col,'head flicker')
        remaining={(i%32,i//32) for i,v in enumerate(pixels) if v[3]}
        todo=[remaining.pop()]
        while todo:
            x,y=todo.pop()
            for p in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if p in remaining:remaining.remove(p);todo.append(p)
        assert not remaining,(direction,col,'stray fragment')
approved=Image.open('design-reference/characters/hizuki32-user-edit/hair-highlight/hizuki-front-hair-highlight-32.png').convert('RGBA')
assert atlas.crop((0,0,32,32)).tobytes()==approved.tobytes()
print('PASS: 12 connected 27px sprites; source RGBA match; stable heads; approved front exact')

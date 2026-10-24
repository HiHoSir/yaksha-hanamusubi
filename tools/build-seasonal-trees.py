#!/usr/bin/env python3
"""Recolor approved tree foliage only. No generation, resize or alpha changes."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/settlement-editor/seasonal-trees-v1'
PALETTES = {
    'sakura_pale': [(65, 34, 61), (151, 71, 111), (226, 146, 177), (255, 224, 231)],
    'sakura_pink': [(58, 24, 55), (137, 41, 98), (220, 93, 154), (255, 191, 218)],
    'autumn_red': [(48, 25, 37), (120, 30, 41), (202, 62, 43), (255, 155, 88)],
    'autumn_orange': [(53, 31, 26), (136, 60, 29), (223, 117, 35), (255, 218, 102)],
    'autumn_yellow': [(48, 37, 25), (124, 87, 26), (218, 170, 41), (255, 243, 141)],
}
SOURCES = {
    'tree': 'assets/settlement-editor/chips/tree_broadleaf.png',
    'trees_1cell': 'assets/field-map-objects-v3/trees.png',
}

def foliage(c):
    r, g, b, a = c
    return a > 0 and g > r and g > b

def recolor(im, ramp):
    out = im.copy()
    for y in range(im.height):
        for x in range(im.width):
            c = im.getpixel((x, y))
            if not foliage(c):
                continue
            # Preserve the source's light/dark clusters; recolor only green pixels.
            light = c[1] / 255
            v = max(0, min(3, light * 3.2))
            i = min(2, int(v))
            t = v - i
            out.putpixel((x, y), tuple(round(ramp[i][j]*(1-t)+ramp[i+1][j]*t) for j in range(3))+(c[3],))
    assert out.getchannel('A').tobytes() == im.getchannel('A').tobytes()
    for a, b in zip(im.getdata(), out.getdata()):
        assert foliage(a) or a == b, 'Trunk or non-foliage modified'
    return out

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    records = []
    preview = Image.new('RGB', (768, 360), '#a7bc95')
    draw = ImageDraw.Draw(preview)
    for row, (prefix, path) in enumerate(SOURCES.items()):
        im = Image.open(ROOT/path).convert('RGBA')
        for col, (key, ramp) in enumerate([('original', None), *PALETTES.items()]):
            result = im if ramp is None else recolor(im, ramp)
            if ramp:
                name = prefix+'_'+key+'.png'
                result.save(OUT/name, optimize=True)
                records.append({'id': prefix+'_'+key, 'source': path, 'sourceSha256': hashlib.sha256((ROOT/path).read_bytes()).hexdigest(), 'src': str((OUT/name).relative_to(ROOT)), 'size': list(result.size), 'bounds': list(result.getbbox()), 'occupiedTiles': [[0,0]], 'displayCells': [1, 2 if prefix=='tree' else 1], 'alphaPreserved': True, 'nonFoliagePreserved': True})
            b = result.getbbox()
            crop = result.crop(b).resize(((b[2]-b[0])*4, (b[3]-b[1])*4), Image.Resampling.NEAREST)
            preview.paste(crop, (col*128+(128-crop.width)//2, row*180+132-crop.height), crop)
            draw.text((col*128+4,row*180+144),key,fill='#172c20')
    (OUT/'manifest.json').write_text(json.dumps({'method':'deterministic foliage palette mapping', 'variants':records},indent=2)+'\n')
    preview.save(ROOT/'qa/seasonal-trees-preview.png')
    print('Validated 10 RGBA sprites: source dimensions, exact alpha, trunks and non-foliage preserved.')

if __name__ == '__main__':
    main()

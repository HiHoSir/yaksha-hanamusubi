"""Prepare generated original art for the game without smoothing pixel edges.
Usage: python3 tools/prepare-landscape-asset.py greenMountain /path/to/source.png
"""
import argparse
from pathlib import Path
from PIL import Image

SIZES = {'grass': (256,256), 'greenMountain': (96, 88), 'snowMountain': (96, 88),
         'shrine': (64, 64), 'lantern': (24, 40),
         'bridge': (96, 40), 'flowers': (40, 24),
         'village': (112,80), 'town': (144,104), 'hermit': (72,72),
         'jizo': (24,40), 'cave': (80,64), 'torii': (64,64)}
PLACES = {'village','town','hermit','jizo','cave','torii'}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('kind', choices=SIZES)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    im = Image.open(args.source).convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda value: 255 if value >= 128 else 0))
    bounds = im.getbbox()
    if bounds is None:
        raise ValueError('Source is empty')
    im = im.crop(bounds).resize(SIZES[args.kind], Image.Resampling.NEAREST)
    alpha = im.getchannel('A')
    im = im.convert('RGB').quantize(colors=16, method=Image.Quantize.MEDIANCUT,
                                   dither=Image.Dither.NONE).convert('RGBA')
    im.putalpha(alpha)
    if args.kind == 'grass':
        # Identical border texels keep the repeating ground continuous.
        for y in range(im.height): im.putpixel((im.width-1,y),im.getpixel((0,y)))
        for x in range(im.width): im.putpixel((x,im.height-1),im.getpixel((x,0)))
    target = Path(__file__).resolve().parent.parent / 'assets/terrain' / ('grass-v1' if args.kind == 'grass' else 'places-v1' if args.kind in PLACES else 'landscape-v2')
    target.mkdir(parents=True, exist_ok=True)
    im.save(target / (args.kind + '.png'))

if __name__ == '__main__':
    main()

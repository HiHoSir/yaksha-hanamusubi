"""Lossless fixed-origin layer partitions. Run from the repository root (Pillow)."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'assets/maps/tenyo'
SIZE = (1536, 1024)
CUT_Y = 19 * 32  # Authored contact rows, independent of the art's bounds.


def partition(source, mask, names):
    original = Image.open(ROOT / source).convert('RGBA')
    assert original.size == SIZE
    empty = Image.new('RGBA', SIZE)
    parts = [Image.composite(original, empty, m) for m in (mask, ImageChops.invert(mask))]
    # Disjoint binary masks retain every source RGBA value at its original pixel.
    for name, part in zip(names, parts):
        part.save(ROOT / ('layer-' + name + '.png'), optimize=True)
    for m, part in zip((mask, ImageChops.invert(mask)), parts):
        # Recovering selected RGBA bytes must be exact, including soft alpha.
        assert Image.composite(part, empty, m).tobytes() == Image.composite(original, empty, m).tobytes()
    a = original.getchannel('A')
    assert ImageChops.add(*(p.getchannel('A') for p in parts)).tobytes() == a.tobytes()
    return parts


if __name__ == '__main__':
    base_mask = Image.new('L', SIZE)
    base_mask.paste(255, (0, CUT_Y, SIZE[0], SIZE[1]))
    partition('layer-torii.webp', base_mask, ['torii-base', 'torii-upper'])
    # Each hand-authored region follows a coherent forest cluster. Nearer
    # clusters own shared source pixels first, preserving the flattened art.
    # These visual depth anchors never create or change occupied tiles.
    spec = json.loads((ROOT / 'forest-occlusion.json').read_text())
    assert tuple(spec['sourceSize']) == SIZE and spec['visualOnly'] is True
    original = Image.open(ROOT / 'layer-trees.webp').convert('RGBA')
    shrine = Image.open(ROOT / 'layer-shrine.webp').convert('RGBA')
    shrine_mask = shrine.getchannel('A').point(lambda a: 255 if a else 0)
    claimed = shrine_mask.copy()
    empty = Image.new('RGBA', SIZE)
    parts = [('trees-back', Image.composite(original, empty, shrine_mask))]
    for group in reversed(spec['groups']):
        mask = Image.new('L', SIZE)
        ImageDraw.Draw(mask).polygon([tuple(p) for p in group['polygon']], fill=255)
        mask = ImageChops.subtract(mask, claimed)
        parts.append((group['name'], Image.composite(original, empty, mask)))
        claimed = ImageChops.lighter(claimed, mask)
    parts.append(('trees-front', Image.composite(original, empty, ImageChops.invert(claimed))))
    merged_alpha = Image.new('L', SIZE)
    reconstructed = empty.copy()
    for name, part in parts:
        part.save(ROOT / ('layer-' + name + '.png'), optimize=True)
        merged_alpha = ImageChops.add(merged_alpha, part.getchannel('A'))
        # Parts are disjoint; byte-wise addition recovers even transparent RGB.
        reconstructed = ImageChops.add(reconstructed, part)
    assert merged_alpha.tobytes() == original.getchannel('A').tobytes()
    assert reconstructed.tobytes() == original.tobytes()
    print('Tenyo: 8 forest clusters + shrine back/foreground, exact source RGBA retained')

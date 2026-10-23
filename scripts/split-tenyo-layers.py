"""Lossless fixed-origin layer partitions. Run from the repository root (Pillow)."""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1] / 'assets/maps/tenyo'
SIZE = (1536, 1024)
NORTH_FOREST_END = 7 * 32  # Bottom edge of the screenshot standing cell (row 6).
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
    # The northern forest (source rows 0..6) and foliage directly under the
    # shrine silhouette belong behind actors. Keep all southern foliage in front.
    # This is a visual mask, never a collision mask.
    shrine = Image.open(ROOT / 'layer-shrine.webp').convert('RGBA')
    shrine_mask = shrine.getchannel('A').point(lambda a: 255 if a else 0)
    north_mask = Image.new('L', SIZE)
    north_mask.paste(255, (0, 0, SIZE[0], NORTH_FOREST_END))
    back_mask = ImageChops.lighter(shrine_mask, north_mask)
    partition('layer-trees.webp', back_mask, ['trees-back', 'trees-front'])
    print('Tenyo: four 1536x1024 RGBA cutouts; source pixels/origin retained')

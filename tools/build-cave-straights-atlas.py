#!/usr/bin/env python3
"""Verify the cave editor's original 84 IDs and extract 24 added straight wall chips.

The source of truth is the committed 12x9 atlas. The 12x2 extension is exported
losslessly so the combined atlas can be rebuilt from the original 12x7 atlas.
No height/cliff projection is involved.
"""
from pathlib import Path
from PIL import Image, ImageChops
P=Path('assets/dungeons/natural-cave-v1')
old=Image.open(P/'cave-corrected-atlas-12x7.png').convert('RGB')
old_overlay=Image.open(P/'cave-corrected-overlay-12x7.png').convert('RGBA')
atlas=Image.open(P/'cave-wall-straights-atlas-12x9.png').convert('RGB')
overlay=Image.open(P/'cave-wall-straights-overlay-12x9.png').convert('RGBA')
assert old.size==old_overlay.size==(384,224)
assert atlas.size==overlay.size==(384,288)
assert ImageChops.difference(old,atlas.crop((0,0,384,224))).getbbox() is None
assert ImageChops.difference(old_overlay,overlay.crop((0,0,384,224))).getbbox() is None
assert overlay.crop((0,224,384,288)).getbbox() is None
extension=atlas.crop((0,224,384,288))
assert extension.size==(384,64)
rebuilt=Image.new('RGB',(384,288))
rebuilt.paste(old,(0,0));rebuilt.paste(extension,(0,224))
assert ImageChops.difference(rebuilt,atlas).getbbox() is None
extension.save(P/'cave-wall-straights-new24-12x2.png',optimize=True)
print('PASS: 84 original tiles pixel-identical, 24 new straight wall tiles (84..107), 32px cells')

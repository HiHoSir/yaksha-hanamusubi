#!/usr/bin/env python3
"""Create cave ASSET CANDIDATES from existing original repo artwork.

Run in repository root: python tools/build-natural-cave-candidates.py
Needs Pillow. Does not change the main game or approved source files.
"""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/dungeons/natural-cave-v0"
TILE = 32

def load(path):
    return Image.open(ROOT / path).convert("RGBA")

def save(name, image):
    assert image.size[0] % TILE == 0 and image.size[1] % TILE == 0, (name, image.size)
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT / name)

def edge_loop(tile):
    """Produce matched opposite edges. Changes only a 2px border.
    This is a candidate; matching edges alone does not prove attractive repetition."""
    p = tile.copy()
    for y in range(TILE):
        for x in (0, TILE - 1):
            p.putpixel((x,y), tile.getpixel((1,y)))
    for x in range(TILE):
        for y in (0, TILE - 1):
            p.putpixel((x,y), p.getpixel((x,1)))
    for y in range(TILE):
        p.putpixel((TILE-1,y),p.getpixel((0,y)))
    for x in range(TILE):
        p.putpixel((x,TILE-1),p.getpixel((x,0)))
    return p

def validate_repetition(im):
    for y in range(TILE):
        assert im.getpixel((0,y))==im.getpixel((TILE-1,y))
    for x in range(TILE):
        assert im.getpixel((x,0))==im.getpixel((x,TILE-1))

def main():
    # 64px source is already rendered as quadrants in original landscape engine.
    barren = load("assets/terrain/landscape-v1/barren.png")
    assert barren.size == (64,64)
    floor = barren.crop((0,0,32,32))
    floor = edge_loop(floor)
    validate_repetition(floor)
    save("floor-base-candidate.png",floor)

    cliff = load("assets/terrain/cliffs-v1/grass-cliff-32.png")
    assert cliff.size == (32,32)
    save("wall-face-reference.png",cliff)

    rock = load("assets/settlement-editor/chips/rocks.png")
    assert rock.size == (32,32)
    save("rock-source-candidate.png",rock)

    shallow=load("assets/settlement-editor/clear-water-v1/shallow.png")
    assert shallow.size==(32,128)
    save("water-frames-reference.png",shallow)

    sheet=Image.new("RGBA",(128,64),(0,0,0,0))
    for i,im in enumerate((floor,cliff,rock,shallow.crop((0,0,32,32)))):
        sheet.paste(im,(i*32,0))
    # second row intentionally transparent: not falsely advertised as 47 autotiles
    save("source-candidates-4x2.png",sheet)
    manifest={
      "status":"ASSET CANDIDATE — NOT APPROVED",
      "tileSize":32,"sheet":{"path":"source-candidates-4x2.png","cols":4,"rows":2},
      "tiles":[
        {"id":"cave_floor_candidate","cell":[0,0],"walkable":True,"origin":"assets/terrain/landscape-v1/barren.png","processing":"crop upper-left quadrant; 2px edge loop"},
        {"id":"cave_wall_face_reference","cell":[1,0],"walkable":False,"origin":"assets/terrain/cliffs-v1/grass-cliff-32.png","processing":"copy; visual reference, not autotile"},
        {"id":"cave_rock_candidate","cell":[2,0],"walkable":False,"origin":"assets/settlement-editor/chips/rocks.png","occupiedTilesRelative":[[0,0]],"processing":"copy; transparency review pending"},
        {"id":"cave_shallow_water_reference","cell":[3,0],"walkable":False,"origin":"assets/settlement-editor/clear-water-v1/shallow.png","processing":"first of four frames; color/opacity review pending"}
      ],
      "todo":["review visual consistency and alpha","3x3 visual repetition","build connected wall transitions","47-mask compatibility","real SD and field transition testing"]
    }
    (OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("Created candidate sheet",OUT/"source-candidates-4x2.png")
if __name__=="__main__":
    main()

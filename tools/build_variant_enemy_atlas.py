#!/usr/bin/env python3
"""Build game-ready rare-enemy HD sprites and 128px atlases.

Input:
  <input>/intact/01_oni.png ... 10_ninefox.png
  <input>/worn/01_oni.png   ... 10_ninefox.png

Output:
  hd512/{stem}-{state}-512.png
  enemy-variant-atlas-128.png
  enemy-variant-worn-atlas-128.png
  manifest.json
  b64/*.png.b64 (optional)
"""
from __future__ import annotations

import argparse
import base64
import json
from pathlib import Path
from PIL import Image

ORDER = [
    "oni", "tanuki", "lantern_fox", "crab", "jelly",
    "tree", "spider", "snake", "falls", "ninefox",
]

PREFIX = {
    "oni": "01",
    "tanuki": "02",
    "lantern_fox": "03",
    "crab": "04",
    "jelly": "05",
    "tree": "06",
    "spider": "07",
    "snake": "08",
    "falls": "09",
    "ninefox": "10",
}

HD_SIZE = 512
CELL = 128
COLS = 4
ROWS = 3
ATLAS_SIZE = (COLS * CELL, ROWS * CELL)


def load_rgba(path: Path) -> Image.Image:
    with Image.open(path) as src:
        im = src.convert("RGBA")
    if im.width <= 0 or im.height <= 0:
        raise ValueError(f"invalid image size: {path}")
    if im.getchannel("A").getbbox() is None:
        raise ValueError(f"empty alpha image: {path}")
    return im


def fit_to_canvas(im: Image.Image, size: int, margin: int, bottom: int | None = None) -> Image.Image:
    # Approved 512px RGBA assets are canonical. Never crop, resample, or
    # alpha-composite them again; doing so can change antialiased outlines.
    if size == HD_SIZE and im.size == (HD_SIZE, HD_SIZE):
        return im.copy()
    bbox = im.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("image has no visible pixels")
    crop = im.crop(bbox)
    avail = size - margin * 2
    scale = min(avail / crop.width, avail / crop.height)
    new_size = (
        max(1, round(crop.width * scale)),
        max(1, round(crop.height * scale)),
    )
    crop = crop.resize(new_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - crop.width) // 2
    if bottom is None:
        y = (size - crop.height) // 2
    else:
        y = min(size - margin - crop.height, bottom - crop.height)
        y = max(margin, y)
    canvas.alpha_composite(crop, (x, y))
    return canvas


def source_path(root: Path, state: str, stem: str) -> Path:
    exact = root / state / f"{PREFIX[stem]}_{stem}.png"
    if exact.exists():
        return exact
    # tolerate a source file with extra suffix after canonical stem
    matches = sorted((root / state).glob(f"{PREFIX[stem]}_{stem}*.png"))
    if len(matches) == 1:
        return matches[0]
    raise FileNotFoundError(f"missing unique source for {state}/{PREFIX[stem]}_{stem}.png")


def build(args: argparse.Namespace) -> None:
    src_root = args.input.resolve()
    out = args.output.resolve()
    hd = out / "hd512"
    hd.mkdir(parents=True, exist_ok=True)

    manifest = []
    normalized: dict[tuple[str, str], Image.Image] = {}

    for state in ("intact", "worn"):
        for stem in ORDER:
            src = source_path(src_root, state, stem)
            im = load_rgba(src)
            hd_im = fit_to_canvas(im, HD_SIZE, margin=22, bottom=HD_SIZE - 20)
            name = f"{stem}-{state}-512.png"
            path = hd / name
            hd_im.save(path, optimize=True)
            normalized[(state, stem)] = hd_im

            alpha = hd_im.getchannel("A")
            hist = alpha.histogram()
            manifest.append({
                "stem": stem,
                "state": state,
                "source": str(src),
                "file": name,
                "bytes": path.stat().st_size,
                "transparent": hist[0],
                "opaque": hist[255],
            })

    def make_atlas(state: str, filename: str) -> Path:
        atlas = Image.new("RGBA", ATLAS_SIZE, (0, 0, 0, 0))
        for idx, stem in enumerate(ORDER):
            thumb = fit_to_canvas(normalized[(state, stem)], CELL, margin=4, bottom=CELL - 4)
            x = (idx % COLS) * CELL
            y = (idx // COLS) * CELL
            atlas.alpha_composite(thumb, (x, y))
        if atlas.size != ATLAS_SIZE or atlas.mode != "RGBA":
            raise AssertionError("atlas format mismatch")
        path = out / filename
        atlas.save(path, optimize=True)
        return path

    intact_atlas = make_atlas("intact", "enemy-variant-atlas-128.png")
    worn_atlas = make_atlas("worn", "enemy-variant-worn-atlas-128.png")

    (out / "manifest.json").write_text(
        json.dumps({
            "order": ORDER,
            "atlas": {
                "cell": CELL,
                "cols": COLS,
                "rows": ROWS,
                "size": list(ATLAS_SIZE),
                "intact": intact_atlas.name,
                "worn": worn_atlas.name,
            },
            "sprites": manifest,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    if args.emit_base64:
        b64 = out / "b64"
        b64.mkdir(exist_ok=True)
        pngs = sorted(hd.glob("*.png")) + [intact_atlas, worn_atlas]
        for p in pngs:
            encoded = base64.b64encode(p.read_bytes()).decode("ascii")
            (b64 / f"{p.name}.b64").write_text(encoded, encoding="ascii")

    print(f"Built {len(manifest)} HD sprites")
    print(f"Intact atlas: {intact_atlas} ({intact_atlas.stat().st_size} bytes)")
    print(f"Worn atlas:   {worn_atlas} ({worn_atlas.stat().st_size} bytes)")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--emit-base64", action="store_true")
    return p.parse_args()


if __name__ == "__main__":
    build(parse_args())

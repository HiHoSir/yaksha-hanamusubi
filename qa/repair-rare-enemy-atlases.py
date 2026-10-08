#!/usr/bin/env python3
"""Repair source rare enemy atlases in place with Pillow.

Keep fully transparent background empty, convert visible body pixels to
opaque using straight-alpha unmatting against local opaque neighbours,
and normalize intact/worn visual bounds within every 128x128 cell.
Run intentionally (not as part of deploying user gameplay code).
"""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1] / "assets/enemies"
PATHS = [ROOT / "enemy-variant-atlas-128.png", ROOT / "enemy-variant-worn-atlas-128.png"]
CELL = 128
THRESHOLD = 12


def repair_cell(cell):
    a = np.array(cell.convert("RGBA"), dtype=np.uint8)
    alpha = a[:, :, 3].astype(np.int16)
    visible = alpha >= THRESHOLD
    solid = alpha >= 245
    rgb = a[:, :, :3].astype(np.float32)
    # Repair translucent edges using nearby solid colors to avoid dark halos.
    # Do not alter the interior RGB artwork unnecessarily.
    ys, xs = np.where(visible & ~solid)
    for y, x in zip(ys, xs):
        y0, y1 = max(0, y - 3), min(CELL, y + 4)
        x0, x1 = max(0, x - 3), min(CELL, x + 4)
        region = solid[y0:y1, x0:x1]
        if region.any():
            reference = np.median(rgb[y0:y1, x0:x1][region], axis=0)
            f = alpha[y, x] / 255.0
            rgb[y, x] = np.clip(rgb[y, x] * f + reference * (1 - f), 0, 255)
    a[:, :, :3] = rgb.astype(np.uint8)
    a[:, :, 3] = np.where(visible, 255, 0).astype(np.uint8)
    return Image.fromarray(a, "RGBA")


def bounds(img):
    a = np.asarray(img.getchannel("A"))
    yy, xx = np.where(a > 0)
    if not len(xx):
        return None
    return int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1


def normalized_pair(original, worn):
    original = repair_cell(original)
    worn = repair_cell(worn)
    b0, b1 = bounds(original), bounds(worn)
    if b0 is None or b1 is None:
        return original, worn
    # Keep intact as canonical scale and baseline. Normalize worn art.
    cw, ch = b0[2] - b0[0], b0[3] - b0[1]
    sw, sh = b1[2] - b1[0], b1[3] - b1[1]
    scale = min(cw / sw, ch / sh)
    target_w, target_h = max(1, round(sw * scale)), max(1, round(sh * scale))
    region = worn.crop(b1).resize((target_w, target_h), Image.Resampling.NEAREST)
    result = Image.new("RGBA", (CELL, CELL))
    left = max(0, min(CELL - target_w, (b0[0] + b0[2] - target_w) // 2))
    top = max(0, min(CELL - target_h, b0[3] - target_h))
    result.alpha_composite(region, (left, top))
    return original, result


def main():
    before = [Image.open(p).convert("RGBA") for p in PATHS]
    assert all(im.size == before[0].size for im in before)
    w, h = before[0].size
    assert w % CELL == 0 and h % CELL == 0
    outputs = [Image.new("RGBA", (w, h)) for _ in PATHS]
    for y in range(0, h, CELL):
        for x in range(0, w, CELL):
            repaired = normalized_pair(*(im.crop((x, y, x+CELL, y+CELL)) for im in before))
            for out, tile in zip(outputs, repaired):
                out.paste(tile, (x, y))
    for path, image in zip(PATHS, outputs):
        arr = np.asarray(image.getchannel("A"))
        assert not np.any((arr > 0) & (arr < 255)), path
        image.save(path, optimize=True)
        print(f"{path.name}: {image.size}, alpha=0/255 only")


if __name__ == "__main__":
    main()

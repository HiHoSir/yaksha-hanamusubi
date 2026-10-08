#!/usr/bin/env python3
"""Compare pre-baked individual oni PNGs against current atlas source pixels."""
from pathlib import Path
import subprocess, io, json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "design-reference/enemies/original-investigation"
OUT.mkdir(parents=True, exist_ok=True)
ref = "476f84d98fa3b3fe062f61205739f31748643587"
sources = [
    ("prebake-intact", f"{ref}:assets/enemies/variants/oni-woman.png"),
    ("prebake-worn", f"{ref}:assets/enemies/variants/oni-woman-worn.png"),
    ("design-worn", f"{ref}:design-reference/enemies/oni-woman-worn-v1.png"),
]
items=[]
for label, gitref in sources:
    raw=subprocess.check_output(["git","show",gitref],cwd=ROOT)
    im=Image.open(io.BytesIO(raw)).convert("RGBA")
    im.save(OUT / f"{label}.png")
    al=list(im.getchannel("A").getdata())
    items.append((label,im,dict(width=im.width,height=im.height,alpha0=al.count(0),alpha255=al.count(255),alphaPartial=sum(0<a<255 for a in al))))
atlas=Image.open(ROOT/"assets/enemies/enemy-variant-atlas-128.png").convert("RGBA")
cell=atlas.crop((0,0,128,128))
al=list(cell.getchannel("A").getdata())
items.append(("baked-atlas-oni",cell,dict(width=128,height=128,alpha0=al.count(0),alpha255=al.count(255),alphaPartial=sum(0<a<255 for a in al))))
tilew,tileh=260,300
sheet=Image.new("RGB",(tilew*len(items),tileh),(34,44,56));draw=ImageDraw.Draw(sheet)
report={}
for i,(label,im,metrics) in enumerate(items):
    # Checkerboard makes internal transparency visible.
    sw=Image.new("RGBA",(220,240),(68,94,104,255))
    d=ImageDraw.Draw(sw)
    for yy in range(0,240,20):
        for xx in range(0,220,20):
            if ((xx+yy)//20)%2==0:d.rectangle((xx,yy,xx+19,yy+19),fill=(109,132,119,255))
    image=im.copy();image.thumbnail((210,225),Image.Resampling.NEAREST)
    sw.alpha_composite(image,((220-image.width)//2, (240-image.height)//2))
    sheet.paste(sw.convert("RGB"),(i*tilew+20,30))
    draw.text((i*tilew+10,10),label,fill="white")
    draw.text((i*tilew+10,275),f"opaque {metrics['alpha255']} semi {metrics['alphaPartial']}",fill="white")
    report[label]=metrics
sheet.save(OUT/"comparison.png")
(OUT/"alpha-report.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
print(json.dumps(report,indent=2))

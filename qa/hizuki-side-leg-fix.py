"""Deterministically correct side-view B-leg contradiction without regenerating art.

Source 80x112 atlas has both side A/B with forward-facing near boot. Arms have
opposite swings, so B's legs are mirrored under the skirt to restore a
contralateral gait. Preserve original atlas and face/torso pixel-perfect.
"""
from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
from io import BytesIO
import argparse,base64,hashlib,json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"assets/characters/hizuki/hana-20261107/walk/walk-atlas-80x112.png"
DEST=ROOT/"assets/characters/hizuki/hana-20261107/walk/walk-atlas-80x112-sidefix.png"
W,H=80,112
def fix(src,seam=76):
 out=src.copy()
 for row in (2,3):
  box=(2*W,row*H,3*W,(row+1)*H)
  frame=src.crop(box)
  bottom=frame.crop((0,seam,W,H))
  frame.paste(ImageOps.mirror(bottom),(0,seam))
  out.paste(frame,box)
 return out
def compare(src):
 # Show the right and left pose A, original B, then repaired B with seam
 # in fixed source coordinates (crop lower torso + both legs only).
 dst=Image.new("RGB",(4*80*3,2*76*3),(46,54,62))
 for rr,row in enumerate((2,3)):
  origin=[src.crop((W,row*H,2*W,(row+1)*H)),
          src.crop((2*W,row*H,3*W,(row+1)*H))]
  for cc,seam in enumerate((72,76,80)):
   candidate=fix(src,seam=seam)
   frame=candidate.crop((2*W,row*H,3*W,(row+1)*H))
   origin.append(frame)
  # A, unmodified B, repair 72,76,80 would be five cols; prefer B, then 3 repairs
  for cc,im in enumerate(origin[1:]):
   cropped=im.crop((0,36,W,H))
   bg=Image.new("RGBA",cropped.size,(54,58,61,255))
   bg.alpha_composite(cropped)
   dst.paste(bg.convert("RGB").resize((W*3,76*3),Image.Resampling.NEAREST),(cc*W*3,rr*76*3))
 return dst
def audit(src,modified,seam):
 for row,name in ((2,"right"),(3,"left")):
  frame=src.crop((160,row*H,240,(row+1)*H))
  changed=modified.crop((160,row*H,240,(row+1)*H))
  assert frame.crop((0,0,W,seam)).tobytes()==changed.crop((0,0,W,seam)).tobytes()
  assert frame.crop((0,seam,W,H)).tobytes()!=changed.crop((0,seam,W,H)).tobytes()
  # Frame A/idle are never changed.
  assert src.crop((0,row*H,160,(row+1)*H)).tobytes()==modified.crop((0,row*H,160,(row+1)*H)).tobytes()
 print("LEG_FIX_INSPECTION",json.dumps({"seam_y":seam,"source_sha256":hashlib.sha256(SOURCE.read_bytes()).hexdigest(),"original_preserved":True,"changed_only":"side B rows 2/3 below seam","pixels_changed":sum(1 for a,b in zip(src.tobytes(),modified.tobytes()) if a!=b)}))
def emit(image,label):
 b=BytesIO();image.save(b,"PNG",optimize=True)
 print(f"BEGIN_{label}_BASE64")
 print(base64.b64encode(b.getvalue()).decode("ascii"))
 print(f"END_{label}_BASE64")
if __name__=="__main__":
 p=argparse.ArgumentParser();p.add_argument("--ci-crop",action="store_true");p.add_argument("--asset-base64",action="store_true");p.add_argument("--seam",type=int,default=76)
 args=p.parse_args()
 src=Image.open(SOURCE).convert("RGBA")
 assert src.size==(240,448)
 out=fix(src,args.seam);audit(src,out,args.seam)
 if args.ci_crop: emit(compare(src),"SIDE_FIX_COMPARE_PNG")
 if args.asset_base64:emit(out,"SIDE_FIX_ATLAS_PNG")

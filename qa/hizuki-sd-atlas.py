from PIL import Image
from scipy.ndimage import label
import numpy as np
im=Image.open('assets/characters/hizuki/field-sd-v2/walk-atlas-32.png').convert('RGBA')
assert im.size==(96,128)
for r in range(4):
 for c in range(3):
  tile=im.crop((c*32,r*32,c*32+32,r*32+32))
  mask=np.array(tile)[:,:,3]>0
  _,n=label(mask,np.ones((3,3)))
  assert n==1,(r,c,'stray fragment',n)
  if c==0:assert tile.getbbox()[1]==0 and tile.getbbox()[3]==32,(r,c,'height')
print('PASS: 12 connected sprites, equal neutral heights')

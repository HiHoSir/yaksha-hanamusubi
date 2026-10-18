"""Create an original short morning bell SE. BGM is the approved hoozuki-v13."""
import wave, math, struct
from pathlib import Path
rate=48000; duration=26
out=Path('/tmp/scene01-bell.wav')
with wave.open(str(out),'wb') as w:
 w.setparams((1,2,rate,0,'NONE','not compressed'))
 for i in range(rate*duration):
  t=i/rate;v=0
  for onset in (1.2,5.0):
   q=t-onset
   if 0<=q<7:
    attack=min(1,q/.008)
    for ratio,gain,decay in ((1,.28,2.3),(2.01,.12,1.7),(2.74,.065,.9),(4.07,.035,.45)):
     v+=attack*gain*math.exp(-q/decay)*math.sin(2*math.pi*392*ratio*q)
  w.writeframesraw(struct.pack('<h',int(max(-1,min(1,v))*32767)))
print(out)

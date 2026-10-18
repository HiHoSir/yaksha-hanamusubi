#!/usr/bin/env bash
set -euo pipefail
node tools/prologue/render-pixel-v2-tail.cjs
ffmpeg -y -v error -i /tmp/pixel-v2-tail.mp4 -ss 74 -i assets/prologue/pixel-v2/audio/river-140s.ogg -stream_loop -1 -i audio/hoozuki-v13.mp3 -filter_complex "[1:a]atrim=0:62,asetpts=PTS-STARTPTS,highpass=f=90,lowpass=f=6000,loudnorm=I=-35:TP=-9:LRA=7,afade=t=out:st=60:d=2[r];[2:a]atrim=0:62,asetpts=PTS-STARTPTS,volume='if(lt(t,2),0,if(lt(t,5),0.025*(t-2),if(lt(t,45),0.075,if(lt(t,49),0.075+0.06*(t-45),0.315))))':eval=frame,afade=t=out:st=59:d=3[m];[r][m]amix=inputs=2:duration=longest:normalize=0[s]" -map 0:v -map '[s]' -t 62 -c:v copy -c:a aac -b:a 96k -ar 48000 -ac 2 /tmp/pixel-v2-tail-audio.mp4
ffmpeg -y -v error -i assets/prologue/pixel-v2/prologue-pixel-v2-44s.mp4 -i /tmp/pixel-v2-tail-audio.mp4 -filter_complex '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -profile:v baseline -level 3.0 -crf 22 -pix_fmt yuv420p -c:a aac -b:a 96k -ar 48000 -movflags +faststart -metadata comment='Voice: VOICEVOX:玄野武宏. River: RandomMind / CC0. See CREDITS.md.' /tmp/prologue-pixel-v2-complete.mp4
ffmpeg -v error -xerror -i /tmp/prologue-pixel-v2-complete.mp4 -f null -
python3 - <<'PY'
from pathlib import Path
import os,hashlib,json
b=Path('/tmp/prologue-pixel-v2-complete.mp4').read_bytes();assert 0<b.find(b'moov')<b.find(b'mdat')
p=Path('assets/prologue/pixel-v2/prologue-pixel-v2-complete.mp4')
with p.open('wb') as f:f.write(b);f.flush();os.fsync(f.fileno())
assert hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256(b).digest()
p.with_suffix('.QA.json').write_text(json.dumps({'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'moov_before_mdat':True,'full_decode':'passed','iphone_safari':'not tested','github':'not uploaded'},indent=2))
PY
python3 tools/prologue/normalize-pixel-v2-full.py

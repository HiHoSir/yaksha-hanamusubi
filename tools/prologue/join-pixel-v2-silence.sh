#!/usr/bin/env bash
set -euo pipefail
node tools/prologue/render-pixel-v2-silence.cjs
ffmpeg -y -v error -i /tmp/pixel-v2-silence.mp4 -ss 62 -i assets/prologue/pixel-v2/audio/river-140s.ogg -map 0:v -map 1:a -t 12 -af 'highpass=f=90,lowpass=f=6000,loudnorm=I=-37:TP=-9:LRA=7,afade=t=out:st=11:d=1' -c:v copy -c:a aac -ar 48000 -ac 2 /tmp/pixel-v2-silence-audio.mp4
ffmpeg -y -v error -i assets/prologue/pixel-v2/prologue-pixel-v2-playable.mp4 -i /tmp/pixel-v2-silence-audio.mp4 -filter_complex '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -c:v libx264 -profile:v baseline -level 3.0 -crf 23 -pix_fmt yuv420p -c:a aac -b:a 96k -ar 48000 -movflags +faststart -metadata comment='Voice: VOICEVOX:玄野武宏. River: RandomMind / CC0. See CREDITS.md.' /tmp/prologue-pixel-v2-44s.mp4
ffmpeg -v error -xerror -i /tmp/prologue-pixel-v2-44s.mp4 -f null -
python3 - <<'PY'
from pathlib import Path
import os,hashlib,json
src=Path('/tmp/prologue-pixel-v2-44s.mp4');dst=Path('assets/prologue/pixel-v2/prologue-pixel-v2-44s.mp4');b=src.read_bytes();assert b.find(b'moov')>0
with dst.open('wb') as f:f.write(b);f.flush();os.fsync(f.fileno())
assert hashlib.sha256(dst.read_bytes()).digest()==hashlib.sha256(b).digest()
Path('assets/prologue/pixel-v2/container-QA.json').write_text(json.dumps({'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'moov_offset':b.find(b'moov'),'mdat_offset':b.find(b'mdat'),'full_decode':'passed','device':'not tested'},indent=2))
PY
ffprobe -v error -show_entries format=duration,size -of json assets/prologue/pixel-v2/prologue-pixel-v2-44s.mp4

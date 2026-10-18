#!/usr/bin/env bash
set -euo pipefail
ffmpeg -y -v error -i /tmp/pixel-v2-silent.mp4 -i assets/prologue/pixel-v2/audio/male-narration.mp3 -stream_loop -1 -i audio/hoozuki-v13.mp3 -i assets/prologue/pixel-v2/audio/river-140s.ogg -i assets/prologue/scene01/morning-bell.m4a -filter_complex "[1:a]adelay=600|600[v];[2:a]atrim=0:32,asetpts=PTS-STARTPTS,volume='if(lt(t,10),0,if(lt(t,12),0.22*(t-10),0.44))':eval=frame,afade=t=out:st=30:d=2[m];[3:a]atrim=start=30:end=62,asetpts=PTS-STARTPTS,highpass=f=90,lowpass=f=6000,loudnorm=I=-32:TP=-8:LRA=7,volume='if(lt(t,10),0.2,1)':eval=frame,afade=t=in:d=1,afade=t=out:st=30:d=2[r];[4:a]atrim=0:4,afade=t=out:st=3:d=1,adelay=10000|10000[b];[v][m][r][b]amix=inputs=4:duration=longest:normalize=0,loudnorm=I=-18:TP=-1.5:LRA=12[s]" -map 0:v -map '[s]' -t 32 -c:v copy -c:a aac -b:a 128k -ar 48000 -metadata comment='Voice: VOICEVOX:玄野武宏. River: RandomMind / Sea and river wave sounds / CC0. See CREDITS.md.' -movflags +faststart /tmp/pixel-v2-verified-master.mp4

# Verify the completed container before exposing it to a preview link.
ffmpeg -v error -xerror -i /tmp/pixel-v2-verified-master.mp4 -f null -
python3 - <<'VERIFY'
from pathlib import Path
import os
src=Path('/tmp/pixel-v2-verified-master.mp4')
dst=Path('assets/prologue/pixel-v2/opening-redrawn-review.mp4')
b=src.read_bytes()
assert b.find(b'moov')>=0 and b.find(b'mdat')>=0
stage=dst.with_suffix('.verified.tmp')
with stage.open('wb') as f:
 f.write(b);f.flush();os.fsync(f.fileno())
os.replace(stage,dst)
VERIFY

# Baseline rendition consumed by the following scene assembly.
ffmpeg -y -v error -i /tmp/pixel-v2-verified-master.mp4 -vf scale=640:360:flags=neighbor -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -crf 20 -c:a copy -movflags +faststart /tmp/pixel-v2-playable.mp4
ffmpeg -v error -xerror -i /tmp/pixel-v2-playable.mp4 -f null -
cp /tmp/pixel-v2-playable.mp4 assets/prologue/pixel-v2/prologue-pixel-v2-playable.mp4

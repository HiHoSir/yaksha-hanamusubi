"""Two-pass loudness control; call after join-pixel-v2-full.sh."""
import subprocess as sp,json,re,os,hashlib
from pathlib import Path
p=Path('assets/prologue/pixel-v2/prologue-pixel-v2-complete.mp4')
def measure(path):
 r=sp.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-18:TP=-2:LRA=14:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 return json.loads(re.findall(r'\{[^{}]+\}',r.stderr)[-1])
d=measure(p);f='loudnorm=I=-18:TP=-2:LRA=14:linear=false:'+':'.join(k+'='+d[v] for k,v in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')]);tmp=Path('/tmp/pixel-v2-full-normalized.mp4')
sp.run(['ffmpeg','-y','-v','error','-i',str(p),'-af',f,'-c:v','copy','-c:a','aac','-b:a','128k','-ar','48000','-movflags','+faststart',str(tmp)],check=True)
sp.run(['ffmpeg','-v','error','-xerror','-i',str(tmp),'-f','null','-'],check=True)
b=tmp.read_bytes();assert 0<b.find(b'moov')<b.find(b'mdat')
with p.open('wb') as o:o.write(b);o.flush();os.fsync(o.fileno())
q=p.with_suffix('.QA.json');qa=json.loads(q.read_text());qa.update(audio=measure(p),bytes=len(b),sha256=hashlib.sha256(b).hexdigest());q.write_text(json.dumps(qa,ensure_ascii=False,indent=2))

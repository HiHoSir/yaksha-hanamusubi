"""Review narration. Requires VOICEVOX Core 0.17, model 4.vvm (0.16.4).
Credit required: VOICEVOX:玄野武宏. Do not redistribute engine/model here.
"""
import os,json,io,wave,dataclasses
from pathlib import Path
import numpy as np
from voicevox_core.blocking import Onnxruntime,OpenJtalk,Synthesizer,VoiceModelFile
root=Path(os.environ.get('VOICEVOX_RUNTIME','/tmp/voicevox'))
r=Path('assets/prologue/pixel-v2/audio');r.mkdir(parents=True,exist_ok=True)
ort=Onnxruntime.load_once(filename=str(root/'voicevox_onnxruntime-linux-x64-1.17.3/lib/libvoicevox_onnxruntime.so.1.17.3'))
syn=Synthesizer(ort,OpenJtalk('/root/.local/lib/python3.12/site-packages/pyopenjtalk/open_jtalk_dic_utf_8-1.11'),acceleration_mode='CPU',cpu_num_threads=4)
with VoiceModelFile.open(root/'4.vvm') as m:syn.load_voice_model(m)
parts=[];report=[]
for text in ['かつて、人と鬼は争っていた。','その契りが、憎しみを鎮め、ふたたび花が咲いたという。']:
 q=syn.create_audio_query(text,11);q.speed_scale=.92;q.intonation_scale=1.05;q.pre_phoneme_length=.15;q.post_phoneme_length=.3
 raw=syn.synthesis(q,11)
 with wave.open(io.BytesIO(raw),'rb') as w:sr=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').copy()
 parts.append(x);report.append({'text':text,'duration':len(x)/sr,'query':dataclasses.asdict(q)})
x=np.concatenate([parts[0],np.zeros(int(sr*.65),dtype='<i2'),parts[1]])
with wave.open(str(r/'male-narration.wav'),'wb') as w:w.setparams((1,2,sr,0,'NONE','none'));w.writeframes(x.tobytes())
(r/'male-narration.json').write_text(json.dumps({'credit':'VOICEVOX:玄野武宏','duration':len(x)/sr,'parts':report},ensure_ascii=False,indent=2))
print('duration',len(x)/sr)

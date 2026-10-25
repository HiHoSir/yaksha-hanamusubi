#!/usr/bin/env python3
"""Facility-specific counters, fuller original benches and illustrated platform face."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
R=Path(__file__).resolve().parents[1];P=R/'assets/interior-editor/facility-v1';P.mkdir(exist_ok=True)
def read(p):return Image.open(R/p).convert('RGBA')
def hard(im,colors=48):
 a=im.getchannel('A').point(lambda v:255 if v>=128 else 0);im=im.convert('RGB').quantize(colors=colors,method=Image.Quantize.MEDIANCUT).convert('RGBA');im.putalpha(a);return im
def fit(im,size):
 im=hard(im);im=im.crop(im.getbbox());z=min((size[0]-2)/im.width,(size[1]-2)/im.height);im=im.resize((round(im.width*z),round(im.height*z)),Image.Resampling.NEAREST);out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,size[1]-1-im.height));return hard(out)
entries=[]
for name,label,size in [('doctor_counter','薬の調合台（すり鉢・薬瓶・薬草）',(96,32)),('inn_counter','宿の受付（台帳・硯・鍵盆）',(96,32)),('armory_counter','武具の展示台（刀・槍先）',(96,64))]:
 fit(read('assets/interior-editor/facility-v1/source/'+name+'.png'),size).save(P/(name+'.png'))
 span=[size[0]//32,size[1]//32];entries.append(dict(id=name,name=label,layer='object',walk=False,span=span,occupiedTiles=[[x,y] for y in range(span[1]) for x in range(span[0])],src='assets/interior-editor/facility-v1/'+name+'.png?v=facility-v1'))
# The accepted red bench already has complete wooden feet. Keep more vertical detail.
canon=read('design-reference/maps/topview-v1/cyamise-approved.png');bench=canon.crop((77,102,150,131));mask=Image.new('L',bench.size);ImageDraw.Draw(mask).polygon([(4,0),(69,0),(72,6),(72,23),(68,28),(4,28),(0,23),(0,6)],fill=255);bench.putalpha(mask)
bench=hard(bench.resize((62,28),Image.Resampling.NEAREST));out=Image.new('RGBA',(64,32));out.alpha_composite(bench,(1,3));out.save(P/'tea_bench.png')
entries.append(dict(id='tea_bench',name='赤い長椅子（座面・木脚）',layer='object',walk=False,span=[2,1],occupiedTiles=[[0,0],[1,0]],src='assets/interior-editor/facility-v1/tea_bench.png?v=facility-v1'))
# Reuse illustrated village grain for the existing seven-pixel riser geometry.
beam=read('assets/interior-editor/polish-v2/interior-atlas-9x1.png').crop((64,0,96,8)).resize((32,7),Image.Resampling.NEAREST);edge=Image.new('RGBA',(32,32));edge.alpha_composite(beam,(0,0));edge.save(P/'platform_face.png')
entries.append(dict(id='platform_face_art',name='高床の木目（描画専用）',layer='object',walk=True,legacy=True,occupiedTiles=[],src='assets/interior-editor/facility-v1/platform_face.png?v=facility-v1'))
(P/'catalog.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
(P/'manifest.json').write_text(json.dumps(dict(tileSize=32,status='local visual candidate',source='Three generated original counters; adopted village bench and beam; source checkpoints retained',mushiro='accepted version preserved',rebuild='python3 tools/build-interior-facilities.py',assets=entries),ensure_ascii=False,indent=2)+'\n')
# Compact contact sheet, rendered at the same native scale as the actual character.
out=Image.new('RGBA',(224,96),(39,45,35,255))
for name,xy in [('doctor_counter',(0,0)),('inn_counter',(112,0)),('armory_counter',(0,32)),('tea_bench',(112,48))]:out.alpha_composite(Image.open(P/(name+'.png')).convert('RGBA'),xy)
out.save(P/'furniture-preview.png')
print('Built four facility furniture assets and source-derived platform face')

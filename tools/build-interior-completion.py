#!/usr/bin/env python3
"""Rebuild the additional interior kit from retained native sources and adopted art."""
from pathlib import Path
from PIL import Image, ImageDraw
import json

R=Path(__file__).resolve().parents[1]
P=R/'assets/interior-editor/completion-v1'; P.mkdir(parents=True,exist_ok=True)
def read(p): return Image.open(R/p).convert('RGBA')
def hard(im,colors=32):
    alpha=im.getchannel('A').point(lambda v:255 if v>=128 else 0)
    im=im.convert('RGB').quantize(colors=colors,method=Image.Quantize.MEDIANCUT).convert('RGBA'); im.putalpha(alpha); return im
def fit(im,size,margin=1):
    im=hard(im); im=im.crop(im.getbbox()); ratio=min((size[0]-margin*2)/im.width,(size[1]-margin*2)/im.height)
    im=im.resize((max(1,round(im.width*ratio)),max(1,round(im.height*ratio))),Image.Resampling.NEAREST)
    out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,size[1]-margin-im.height)); return hard(out)
def save(id,im):hard(im).save(P/(id+'.png'))

# Source-native PNGs preserve the complete normalized silhouettes, not screenshot pixels.
for id,size in [('weapon_rack',(64,32)),('armor_display',(32,32)),('garden_pond',(64,64))]:
    save(id,fit(read('assets/interior-editor/completion-v1/source/'+id+'.png'),size))

# Shoji/fusuma use adopted village lattice, wood grain and paper, recomposed at native resolution.
home=read('assets/settlement-editor/chips/building_southwest_home.png')
wood=read('assets/interior-editor/layout-kit-v1/drawer-32x64.png')
inn=read('assets/interiors/base-v1/inn.webp')
beam=wood.crop((5,17,26,23)); post=wood.crop((4,24,7,63))
paper=home.crop((15,56,28,61))
def hbeam(im,y,width):im.alpha_composite(beam.resize((width,3),Image.Resampling.NEAREST),(0,y))
def vpost(im,x,height):im.alpha_composite(post.resize((3,height),Image.Resampling.NEAREST),(x,0))
def panel(kind):
    im=Image.new('RGBA',(32,32));im.alpha_composite(paper.resize((28,26),Image.Resampling.NEAREST),(2,2))
    if kind=='shoji':
        # Illustrated wooden lattice bars are sampled, rather than flat-color stand-ins.
        slat=home.crop((70,59,71,70))
        for x in [8,15,23]:im.alpha_composite(slat.resize((1,26),Image.Resampling.NEAREST),(x,2))
        for y in [8,14,20]:im.alpha_composite(beam.resize((28,1),Image.Resampling.NEAREST),(2,y))
    else:
        # Plain paper leaves plus a small source-derived metal pull.
        im.alpha_composite(wood.crop((14,33,17,35)),(25,17))
    vpost(im,0,32);vpost(im,29,32);hbeam(im,0,32);hbeam(im,29,32);return im
for kind in ['shoji','fusuma']:
    leaf=panel(kind); closed=Image.new('RGBA',(64,32));closed.alpha_composite(leaf,(0,0));closed.alpha_composite(leaf.transpose(Image.Transpose.FLIP_LEFT_RIGHT),(32,0));save(kind+'_closed',closed)
    opened=Image.new('RGBA',(64,32));opened.alpha_composite(leaf,(0,0));hbeam(opened,29,64);vpost(opened,61,32);save(kind+'_open',opened)
door=Image.new('RGBA',(32,32));hbeam(door,29,32);vpost(door,0,32);vpost(door,29,32);save('doorway',door)
atlas=read('assets/interior-editor/polish-v2/interior-atlas-9x1.png')
save('partition_h',atlas.crop((64,0,96,32)))
save('partition_v',atlas.crop((64,0,96,8)).rotate(90,expand=True).resize((8,32),Image.Resampling.NEAREST).copy().resize((8,32),Image.Resampling.NEAREST))
vertical=Image.new('RGBA',(32,32));vertical.alpha_composite(Image.open(P/'partition_v.png'),(12,0));save('partition_v',vertical)

# Genuine original inn paintings, retained in their frame with native-scale correction.
scroll=inn.crop((438,97,520,206));save('wall_scroll',fit(scroll,(32,32),3))
landscape=inn.crop((448,111,510,188))
screen=Image.new('RGBA',(64,32))
for i in range(3):
    face=Image.new('RGBA',(21,30));face.alpha_composite(landscape.resize((17,24),Image.Resampling.NEAREST),(2,2));vpost(face,0,30);vpost(face,18,30);hbeam(face,0,21);hbeam(face,27,21);screen.alpha_composite(face,(i*21,2))
save('byobu_set',screen)
# Medicine cabinet uses the same adopted drawer wood and fittings, with many small drawers.
cab=wood.copy();small=wood.crop((6,26,25,37)).resize((10,8),Image.Resampling.NEAREST)
for y in [27,35,43,51]:
    for x in [6,16]:cab.alpha_composite(small,(x,y))
save('medicine_drawer',cab)
# Wall labels intentionally contain no fake readable kanji at 32px.
labels=Image.new('RGBA',(32,32));label=inn.crop((1050,102,1110,204)).resize((7,23),Image.Resampling.NEAREST)
for x in [3,12,21]:labels.alpha_composite(label,(x,3))
save('wall_labels',labels)
# Wall weapon is the same actual rack, compactly displayed on a single wall cell.
save('wall_weapons',fit(Image.open(P/'weapon_rack.png').convert('RGBA'),(32,32),1))
save('stone_lantern',fit(read('assets/terrain/landscape-v2/lantern.png'),(32,32),1))
save('garden_shrub',fit(read('assets/settlement-editor/chips/shrub.png'),(32,32),1))
save('garden_tree',fit(read('assets/settlement-editor/chips/tree_conifer.png'),(32,32),1))
save('stepping_stone',read('assets/settlement-editor/pack-v1/stepping_stone.png'))

specs=[
('shoji_closed','障子・閉（2×1）','structure',[2,1],[[0,0],[1,0]],False),
('shoji_open','障子・開（右1マス通行）','structure',[2,1],[[0,0]],False),
('fusuma_closed','襖・閉（2×1）','structure',[2,1],[[0,0],[1,0]],False),
('fusuma_open','襖・開（右1マス通行）','structure',[2,1],[[0,0]],False),
('doorway','出入口の木枠','structure',[1,1],[],True),
('partition_h','間仕切り・横','structure',[1,1],[[0,0]],False),
('partition_v','間仕切り・縦','structure',[1,1],[[0,0]],False),
('byobu_set','屏風・一式（2×1）','object',[2,1],[[0,0],[1,0]],False),
('medicine_drawer','壁付け薬箪笥（床1マス）','object',[1,1],[[0,0]],False),
('wall_scroll','掛け軸（壁に重ねる）','object',[1,1],[],True),
('wall_labels','壁の札（壁に重ねる）','object',[1,1],[],True),
('weapon_rack','刀・槍の武器掛け（2×1）','object',[2,1],[[0,0],[1,0]],False),
('wall_weapons','壁掛け武具','object',[1,1],[],True),
('armor_display','鎧飾り','object',[1,1],[[0,0]],False),
('garden_pond','庭池・一式（2×2）','object',[2,2],[[0,0],[1,0],[0,1],[1,1]],False),
('stone_lantern','石灯籠','object',[1,1],[[0,0]],False),
('garden_shrub','庭の低木','object',[1,1],[[0,0]],False),
('garden_tree','庭の常緑樹','object',[1,1],[[0,0]],False),
('stepping_stone','庭の踏み石（通行可）','object',[1,1],[],True)]
entries=[]
for id,name,layer,span,cells,walk in specs:
    e=dict(id=id,name=name,layer=layer,span=span,occupiedTiles=cells,walk=walk,src='assets/interior-editor/completion-v1/'+id+'.png?v=completion-v1')
    if span==[1,1]:del e['span']
    if id=='medicine_drawer':e.update(renderRect=[0,-32,32,64],requiresWall=True)
    if id in ['wall_scroll','wall_labels','wall_weapons']:e['requiresStructure']=True
    entries.append(e)
(P/'catalog.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
(P/'manifest.json').write_text(json.dumps(dict(tileSize=32,camera='topdown-orthographic',status='candidate; in-editor visual approval and Safari pending',sourcePolicy='Original project artwork only; reference game screenshots were used for object roles, never extracted',rebuild='python3 tools/build-interior-completion.py',assets=entries),ensure_ascii=False,indent=2)+'\n')
print('Built',len(entries),'additional assets')

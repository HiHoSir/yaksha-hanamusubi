#!/usr/bin/env python3
"""Five original placement examples; reference screenshots specify roles, not copied pixels."""
from pathlib import Path
import json
P=Path(__file__).resolve().parents[1]/'assets/interior-editor/completion-v1'
def room(kind,w,h):
    l={k:[None]*(w*h) for k in ['floor','structure','object','stairs','collision']};l['floor']=['outside_black']*(w*h);l['elevation']=[0]*(w*h)
    def put(layer,x,y,id):l[layer][y*w+x]=id
    for y in range(1,h-1):
        for x in range(1,w-1):put('floor',x,y,'earth')
    for x in range(1,w-1):put('structure',x,0,'wall');put('structure',x,h-1,'wall')
    for y in range(h):put('structure',0,y,'wall_side_l');put('structure',w-1,y,'wall_side_r')
    entry=w//2;put('structure',entry,h-1,'opening');put('floor',entry,h-1,'earth');l['spawn']=[entry,h-2];l['exits']=[[entry,h-1]]
    def floorbox(x0,y0,x1,y1,id):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):put('floor',x,y,id);put('elevation',x,y,1 if id.startswith('raised_') else 0)
    return dict(schema='yaksha-interior-editor-v1',tileSize=32,width=w,height=h,room='custom',layers=l,assets=[],example=kind),put,floorbox
def output(m,goals):
    m['qaApproaches']=goals;(P/(m['example']+'-example.json')).write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

m,p,f=room('inn',18,18);f(1,1,16,11,'raised_wood')
for x in [7,12]:
    for y in range(1,9):p('structure',x,y,'partition_v')
for x0,x1 in [(8,11),(13,16)]:
    for y in range(1,8):
        for x in range(x0,x1+1):p('floor',x,y,'raised_mat_tatami_l' if (x-x0)%2==0 else 'raised_mat_tatami_r')
    for x in [x0,x0+2]:
        for y in [2,5]:p('object',x,y,'futon_set')
for x in [8,11,13,16]:p('structure',x,8,'partition_h')
p('structure',9,8,'shoji_open');p('structure',14,8,'fusuma_open')
p('stairs',14,12,'stairs_m');p('object',2,1,'wall_drawer');p('object',4,0,'wall_scroll');p('object',2,4,'counter_set');p('object',4,2,'byobu_set')
p('object',2,7,'red_bench_set');p('object',1,10,'village_barrel');
p('object',3,13,'garden_pond');p('object',6,14,'stone_lantern')
for x,y in [(15,14),(15,15),(16,15)]:p('object',x,y,'garden_shrub')
for y in [13,14,15,16]:p('object',14,y,'stepping_stone')
output(m,[[9,17],[14,12],[14,11],[10,8],[15,8],[10,4],[14,4],[3,5],[5,14]])

m,p,f=room('doctor',12,12);f(1,1,10,7,'raised_wood');p('stairs',6,8,'stairs_m')
for x in [7,8,9]:p('object',x,1,'medicine_drawer')
p('object',7,3,'byobu_set');p('object',3,0,'wall_scroll');p('object',5,0,'wall_labels');p('object',3,4,'counter_set');p('object',5,3,'hibachi_lit');p('object',8,4,'futon_set');p('object',1,9,'village_firewood');p('object',10,9,'village_pot')
output(m,[[6,11],[6,8],[6,7],[7,2],[9,2],[4,5],[8,6]])

m,p,f=room('armory',14,12);f(4,1,12,7,'raised_wood');p('stairs',10,8,'stairs_m')
p('object',5,1,'wall_drawer');p('object',7,1,'wall_drawer');p('object',9,1,'armor_wall_display');p('object',11,1,'armor_wall_display');p('object',7,4,'weapon_rack_large');p('object',6,6,'counter_set')
for x,y,id in [(1,2,'village_basket'),(2,2,'village_firewood'),(1,4,'village_rice_bale'),(1,9,'village_pot'),(12,9,'village_pot')]:p('object',x,y,id)
output(m,[[7,11],[10,8],[10,7],[9,3],[11,3],[8,5],[5,2],[7,2]])

m,p,f=room('home',12,11);f(1,1,10,6,'raised_wood');p('stairs',6,7,'stairs_m')
for y in range(6):
    for x in range(10):
        edge=('n' if y==0 else 's' if y==5 else '')+('w' if x==0 else 'e' if x==9 else '')
        role=edge or ['c','c2','c3'][(x//2+2*(y//2))%3]
        p('floor',x+1,y+1,'raised_mushiro_'+role)
p('object',8,1,'wall_drawer');p('object',3,0,'wall_scroll');p('object',3,3,'irori_lit');p('object',7,3,'low_table');p('object',4,5,'cushion');p('object',2,3,'cushion');p('object',8,5,'cushion');p('object',1,8,'kamado_lit');p('object',2,8,'village_firewood');p('object',10,8,'village_pot')
output(m,[[6,10],[6,7],[6,6],[4,5],[2,3],[8,5],[8,2]])

m,p,f=room('teahouse',14,13);f(1,1,5,6,'raised_wood');p('stairs',3,7,'stairs_m')
for x in [1,2,3]:p('object',x,1,'wall_drawer')
p('object',7,0,'wall_labels');p('object',3,4,'counter_set')
for x in [7,10]:
    for y in [4,7]:p('object',x,y,'red_bench_set')
p('object',1,8,'kamado');p('object',1,9,'kamado_lit');p('object',1,10,'village_basket');p('object',11,10,'village_pot');p('object',12,10,'village_pot')
output(m,[[7,12],[3,7],[3,6],[3,3],[7,5],[10,5],[7,8],[10,8],[2,9]])
print('Built five room examples')

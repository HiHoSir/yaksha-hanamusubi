((root,f)=>{const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else root.SMCatalog=api;})(globalThis,()=>{
'use strict';
// x,y is the leftmost ground cell on the front contact row. Negative dy is rear ground.
const single=[[0,0]],tree=single,house=[[0,0],[1,0],[2,0]],
inn=[[0,-1],[1,-1],[2,-1],[3,-1],[4,-1],[0,0],[1,0],[2,0],[3,0],[4,0]],shop=inn,
shrine=[[0,-1],[1,-1],[2,-1],[0,0],[1,0],[2,0]];
// Intentionally authored masks, NOT inferred from visual dimensions/alpha.
const occupancy={well:single,building_inn:inn,building_shop:shop,building_tea:house,building_west_home:house,building_southwest_home:house,building_south_home:house,building_shrine:shrine,bridge:[],bridge_vertical:[],auto_road:[],auto_river:single,ground_grass:[],bench:single,pot:single,crate:single,tree_conifer:tree,tree_broadleaf:tree,shrub:single,grass_tuft:[],flowers_orange:single,flowers_white:single,rocks:single,fence:single,garden_crop:single,terrain_grass:[],terrain_dirt:[],terrain_river:[]};
const doors={building_inn:[[2,0],[2,1]],building_shop:[[2,0],[2,1]],building_tea:[[1,0],[1,1]],building_west_home:[[1,0],[1,1]],building_southwest_home:[[1,0],[1,1]],building_south_home:[[1,0],[1,1]],building_shrine:[[1,0],[1,1]]};
// Verified transparent margins of the approved PNGs; display only, never collision input.
const visible={well:[5,2,22,28],building_inn:[9,2,142,92],building_shop:[9,2,142,92],building_tea:[2,15,92,65],building_west_home:[2,17,92,62],building_southwest_home:[2,16,92,63],building_south_home:[2,18,92,60],building_shrine:[8,2,80,92],bridge:[0,0,64,32],bridge_vertical:[0,0,32,64],bench:[2,11,28,10],pot:[2,2,27,28],crate:[3,2,25,28],tree_conifer:[2,10,28,43],tree_broadleaf:[2,17,28,30],shrub:[2,4,26,24],grass_tuft:[2,4,28,23],flowers_orange:[2,6,28,18],flowers_white:[2,2,28,27],rocks:[2,5,28,22],fence:[2,8,28,15],garden_crop:[0,0,32,32]};
const templates=[{"id":"well","name":"井戸","src":"assets/settlement-editor/chips/well.png","displayCells":[1,1],"kind":"object"},{"id":"building_inn","name":"宿","src":"assets/settlement-editor/chips/building_inn.png","displayCells":[5,3],"kind":"object"},{"id":"building_shop","name":"店","src":"assets/settlement-editor/chips/building_shop_inn.png","displayCells":[5,3],"kind":"object"},{"id":"building_tea","name":"茶屋","src":"assets/settlement-editor/chips/building_tea.png","displayCells":[3,3],"kind":"object"},{"id":"building_west_home","name":"西の民家","src":"assets/settlement-editor/chips/building_west_home.png","displayCells":[3,3],"kind":"object"},{"id":"building_southwest_home","name":"南西の民家","src":"assets/settlement-editor/chips/building_southwest_home.png","displayCells":[3,3],"kind":"object"},{"id":"building_south_home","name":"南の民家","src":"assets/settlement-editor/chips/building_south_home.png","displayCells":[3,3],"kind":"object"},{"id":"building_shrine","name":"祠","src":"assets/settlement-editor/chips/building_shrine.png","displayCells":[3,3],"kind":"object"},{"id":"bridge","name":"木の橋","src":"assets/settlement-editor/terrain-v1/bridge-h.png","displayCells":[2,1],"kind":"object"},{"id":"bench","name":"ベンチ","src":"assets/settlement-editor/chips/bench.png","displayCells":[1,1],"kind":"object"},{"id":"pot","name":"壺","src":"assets/settlement-editor/chips/pot.png","displayCells":[1,1],"kind":"object"},{"id":"crate","name":"木箱","src":"assets/settlement-editor/chips/crate.png","displayCells":[1,1],"kind":"object"},{"id":"tree_conifer","name":"針葉樹","src":"assets/settlement-editor/chips/tree_conifer.png","displayCells":[1,2],"kind":"object"},{"id":"tree_broadleaf","name":"広葉樹","src":"assets/settlement-editor/chips/tree_broadleaf.png","displayCells":[1,2],"kind":"object"},{"id":"shrub","name":"低木","src":"assets/settlement-editor/chips/shrub.png","displayCells":[1,1],"kind":"object"},{"id":"grass_tuft","name":"草むら","src":"assets/settlement-editor/chips/grass_tuft.png","displayCells":[1,1],"kind":"terrain"},{"id":"flowers_orange","name":"赤橙の花","src":"assets/settlement-editor/chips/flowers_orange.png","displayCells":[1,1],"kind":"object"},{"id":"flowers_white","name":"白い花","src":"assets/settlement-editor/chips/flowers_white.png","displayCells":[1,1],"kind":"object"},{"id":"rocks","name":"岩","src":"assets/settlement-editor/chips/rocks.png","displayCells":[1,1],"kind":"object"},{"id":"fence","name":"木柵","src":"assets/settlement-editor/chips/fence.png","displayCells":[1,1],"kind":"object"},{"id":"garden_crop","name":"畑","src":"assets/settlement-editor/terrain-v1/farm-source.png","displayCells":[1,1],"kind":"terrain"},{"id":"terrain_grass","name":"草地の断片","src":"assets/settlement-editor/chips/terrain_grass.png","displayCells":[1,1],"kind":"terrain"},{"id":"terrain_dirt","name":"土道の断片","src":"assets/settlement-editor/chips/terrain_dirt.png","displayCells":[1,1],"kind":"terrain"},{"id":"terrain_river","name":"川の断片","src":"assets/settlement-editor/chips/terrain_river.png","displayCells":[1,4],"kind":"terrain"},{"id":"bridge_vertical","name":"木の橋（縦）","src":"assets/settlement-editor/terrain-v1/bridge-v.png","displayCells":[1,2],"kind":"object"},{"id":"auto_road","name":"道（自動接続）","src":"assets/settlement-editor/terrain-v1/road-47.png","displayCells":[1,1],"kind":"terrain"},{"id":"auto_river","name":"川（自動接続）","src":"assets/settlement-editor/terrain-v1/river-47.png","displayCells":[1,1],"kind":"terrain"},{"id":"ground_grass","name":"草地（全面）","src":"assets/settlement-editor/terrain-v1/grass-source.png","displayCells":[1,1],"kind":"terrain"}].map(t=>({...t,occupiedTiles:occupancy[t.id],entranceLocal:doors[t.id]?.[0]||null,approachLocal:doors[t.id]?.[1]||null}));
for(const t of templates){t.sourceRect=t.kind==='object'?visible[t.id]:[0,0,t.displayCells[0]*32,t.displayCells[1]*32];t.layer=t.kind==='terrain'||t.id==='bridge'||t.id==='bridge_vertical'?'ground':'object';}
const byId=Object.fromEntries(templates.map(t=>[t.id,t]));
// Explicit two-row building masks: the rear row is blocked; the central door is open.
for(const t of templates.filter(t=>t.id.startsWith('building_'))){t.legacyOccupiedTiles=t.occupiedTiles;t.occupiedTiles=[];for(const dy of [-1,0])for(let dx=0;dx<t.displayCells[0];dx++)if(dy!==0||dx!==t.entranceLocal[0])t.occupiedTiles.push([dx,dy]);}
byId.garden_crop.legacyOccupiedTiles=single;byId.garden_crop.occupiedTiles=[];
for(const id of ['auto_road','auto_river']){byId[id].autotile=true;byId[id].paintable=true;byId[id].paintGroup='surface';byId[id].preview='assets/settlement-editor/terrain-v1/'+(id==='auto_road'?'road':'river')+'-preview.png';}
byId.auto_river.animation={frames:2,frameHeight:192,frameMs:360};byId.auto_river.src='assets/animation/fluid-v1/river-47.png';byId.auto_river.water=true;byId.ground_grass.paintable=true;byId.ground_grass.paintGroup='base';
byId.garden_crop.paintable=true;byId.garden_crop.paintGroup='farm';
byId.bridge.name='木の橋（横・旧2マス）';byId.bridge.bridgePassages=[[0,0],[1,0]];byId.bridge_vertical.bridgePassages=[[0,-1],[0,0]];
byId.bridge.hidden=true;byId.bridge_vertical.hidden=true;
const bridgeTile={id:'auto_bridge',name:'橋（1マス・自動接続）',src:'assets/settlement-editor/terrain-v1/bridge-v2-17.png',preview:'assets/settlement-editor/terrain-v1/bridge-v2-preview.png',displayCells:[1,1],kind:'terrain',sourceRect:[0,0,32,32],layer:'ground',occupiedTiles:[],entranceLocal:null,approachLocal:null,autotile:true,bridgeAuto:true,paintable:true,paintGroup:'bridge',bridgePassages:[[0,0]]};templates.push(bridgeTile);byId.auto_bridge=bridgeTile;
for(const id of ['terrain_grass','terrain_dirt','terrain_river'])byId[id].hidden=true;

// Reusable village pack: static authored sizes, layers and occupancy.
const packDir='assets/settlement-editor/pack-v1/';
function packAsset(id,name,size=[1,1],blocked=true,ground=false,extra={}){const t={id,name,src:packDir+id+'.png',displayCells:size,kind:ground?'terrain':'object',sourceRect:[0,0,size[0]*32,size[1]*32],occupiedTiles:blocked?[[0,0]]:[],layer:ground?'ground':'object',entranceLocal:null,approachLocal:null,pack:'v1',...extra};templates.push(t);byId[id]=t;}
for(const [key,name]of [['shop','小型店舗'],['inn','小型宿'],['medicine','薬屋'],['weapon','武器屋'],['armor','防具屋'],['tools','道具屋']]){packAsset('small_'+key,name,[3,2],false,false,{entranceLocal:[1,0],approachLocal:[1,1],occupiedTiles:[[0,-1],[1,-1],[2,-1],[0,0],[2,0]]});packAsset('sign_'+key,name+'の看板',[1,1],false,false,{wallSign:true});}
packAsset('building_barn','物置・納屋',[3,2],false,false,{src:packDir+'barn.png',entranceLocal:[1,0],approachLocal:[1,1],occupiedTiles:[[0,-1],[1,-1],[2,-1],[0,0],[2,0]]});
for(const [id,name]of [['barrel','樽'],['rice_bale','米俵'],['firewood','薪'],['basket','籠'],['signpost','立て札']])packAsset(id,name);
for(const [id,name,file]of [['stairs_stone','石の階段','stairs'],['stepping_stone','踏み石','stepping_stone'],['decor_leaves','落ち葉','leaves'],['decor_pebbles','小石','pebbles']])packAsset(id,name,[1,1],false,true,{src:packDir+file+'.png'});
for(const [key,name]of [['cobble','石畳'],['gravel','砂利'],['soil','裸土']])packAsset('ground_'+key,name+'（自動接続）',[1,1],false,true,{src:packDir+key+'-47.png',preview:packDir+key+'-preview.png',autotile:true,paintable:true,paintGroup:'surface'});
for(const [key,name]of [['fence','木柵'],['hedge','生垣']])packAsset('auto_'+key,name+'（自動接続）',[1,1],true,true,{src:packDir+key+'-16.png',preview:packDir+key+'-preview.png',autotile:true,cardinalAuto:true,paintable:true,paintGroup:'boundary'});

for(const [id,name]of [['building_belltower','鐘撞堂'],['building_jinja','神社']])packAsset(id,name,[3,2],false,false,{src:'assets/settlement-editor/religious-v1/'+id+'.png',pack:'religious-v1',entranceLocal:[1,0],approachLocal:[1,1],occupiedTiles:[[0,-1],[1,-1],[2,-1],[0,0],[2,0]]});
for(const [id,name]of [['komainu_left','狛犬（左）'],['komainu_right','狛犬（右）']])packAsset(id,name,[1,1],true,false,{src:'assets/settlement-editor/religious-v1/'+id+'.png',pack:'religious-v1'});
// Seasonal variants reuse approved silhouettes. Keep contact independent of PNG size:
// both tall broadleaf and the 1-cell paired trees block only their authored base cell.
for(const [key,name]of [['sakura_pale','桜（淡桃）'],['sakura_pink','桜（濃桃）'],['autumn_red','紅葉（赤）'],['autumn_orange','紅葉（橙）'],['autumn_yellow','紅葉（黄）']]){
 for(const [prefix,size,rect,label]of [['tree',[1,2],[2,17,28,30],'広葉樹'],['trees_1cell',[1,1],[0,7,32,25],'1マスの木']]){
  const id=prefix+'_'+key;
  packAsset(id,label+'・'+name,size,true,false,{src:'assets/settlement-editor/seasonal-trees-v1/'+id+'.png',sourceRect:rect,pack:'seasonal-trees-v1'});
 }
}
// Reuse the approved 64px torii without resampling the source PNG. Its 2x
// nearest-neighbour draw spans four 32px cells in both directions.
// x,y is the leftmost cell on the bottom contact row: only the two posts
// block walking; the central two cells and every upper cell remain open.
packAsset('torii_gate','鳥居（中央通行可・4マス幅）',[4,4],false,false,{
 src:'assets/terrain/places-v1/torii.png',sourceRect:[0,0,64,64],
 renderCells:[4,4],occupiedTiles:[[0,0],[3,0]],pack:'field-torii-reuse'
});
// Approved B Jizo is shared with the field; contact is authored independently.
packAsset('jizo','地蔵',[1,1],true,false,{src:'assets/settlement-editor/chips/jizo.png',pack:'jizo-approved-v1'});
// Tenyou water-sanctuary gate: 6x4 visual, explicit left/right contact cells,
// center two cells reserved for event-gated future passage.
packAsset('tenyo_water_gate','天妖の社・水上門',[6,4],false,false,{
 src:'assets/settlement-editor/tenyo-gate-v1/tenyo_gate_6x4.png',
 sourceRect:[0,0,192,128],pack:'tenyo-gate-v1',
 occupiedTiles:[[0,0],[1,0],[4,0],[5,0]],
 entranceLocal:[2,0],approachLocal:[2,1]
});
return {templates,byId};
});

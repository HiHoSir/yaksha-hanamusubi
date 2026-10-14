// Pure field prompt selection. No canvas access or game-state mutation.
window.YK_FIELD_HINT=(()=>{
 function entry(nearby,places,guide){
  if(guide)return 'A：地蔵に道を聞く';
  if(nearby)return 'A：'+places[nearby].name+'へ入る';
  return 'A：行動 ／ 地図で目的地を確認';
 }
 function village(inspectable){
  return inspectable?'A：話す・調べる ／ 行動からも選べます':'A：話す・入る ／ 行動：コマンド';
 }
 return {entry,village};
})();

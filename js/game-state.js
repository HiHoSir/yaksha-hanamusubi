// Centralized runtime state publication. No rendering, timers, or storage writes.
window.YK_GAME_STATE=(()=>{
 function publish(value){window.gameState=value;return value;}
 function fresh(){return publish(YK_SAVE.fresh());}
 function restore(raw){return publish(YK_SAVE.migrate(raw));}
 function copy(raw){return publish(JSON.parse(JSON.stringify(raw)));}
 return {fresh,restore,copy};
})();

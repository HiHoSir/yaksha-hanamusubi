const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={};ctx.window=ctx;vm.runInNewContext(fs.readFileSync('js/dialogue.js','utf8'),ctx);
const norm=x=>JSON.parse(JSON.stringify(ctx.YK_DIALOGUE.normalize(x)));
assert.deepEqual(norm(null),[]);
assert.deepEqual(norm({n:'長老',t:['おはよう',{speaker:'緋月',text:'はい'},'']}),[{speaker:'長老',text:'おはよう'},{speaker:'緋月',text:'はい'}]);
assert.deepEqual(norm({name:'旅人',talk:'道は北'}),[{speaker:'旅人',text:'道は北'}]);
assert.deepEqual(norm({t:[42]}),[{speaker:'',text:'42'}]);
console.log('Dialogue normalization contract OK');

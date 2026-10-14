const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope={};scope.window=scope;vm.runInNewContext(fs.readFileSync('js/field-hint.js','utf8'),scope);
const entry=scope.YK_FIELD_HINT.entry;
const places={shrine:{name:'天妖の社'}};
assert.equal(entry('shrine',places,false),'A：天妖の社へ入る');
assert.equal(entry('shrine',places,true),'A：地蔵に道を聞く');
assert.equal(entry(null,places,true),'A：地蔵に道を聞く');
assert.equal(entry(null,places,false),'A：行動 ／ 地図で目的地を確認');
console.log('Field interaction message priority contracts OK');

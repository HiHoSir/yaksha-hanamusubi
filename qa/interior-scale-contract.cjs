// Non-visual contract: protect approved interior art while reconstructing scale.
// Run: node qa/interior-scale-contract.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const text=file=>fs.readFileSync(path.join(root,file),'utf8');
const interior=text('js/interior-base.js');
const game=text('js/game.js');
const source=text('design-reference/interiors/base-v1/README.md');
assert.match(interior,/heroReference=\{height:58,footOffset:9\*\.56,stride:32\}/);
assert.match(interior,/assets\/interiors\/base-v1\/['"]?\+name/);
assert.doesNotMatch(interior,/teaRect\(|teaStructureEnabled|drawTeaTable\(/,'Rejected flat-color prototype must not return');
assert.match(game,/YK_INTERIOR_BASE\.draw\(g,S\);drawActors\(frameTime\)/,'Painted background and actors must share a camera transform');
assert.match(game,/const heroY=fieldMotion\?/,'Depth sorting must use interpolated actor foot');
assert.match(source,/土間/);
assert.match(source,/踏み石/);
assert.match(source,/4卓/);
console.log('Interior scale contract: approved art and shared actor transform protected.');
console.log('NOT a visual-scale certification: concept furniture dimensions still require artwork reconstruction and image QA.');

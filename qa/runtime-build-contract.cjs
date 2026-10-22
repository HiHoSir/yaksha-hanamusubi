// Protect the independent game.js build fingerprint from drifting behind
// the public HTML title and every HTML asset cache-busting version.
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const game=fs.readFileSync('js/game.js','utf8');
const title=html.match(/<title>[^<]*β(\d+\.\d+\.\d+)<\/title>/)?.[1];
const htmlBuild=html.match(/const loadedBuild="([^"]+)"/)?.[1];
const jsBuild=game.match(/const GAME_JS_BUILD="([^"]+)"/)?.[1];
assert(title,'missing public BETA title build');
assert(htmlBuild,'missing inline HTML build identity');
assert(jsBuild,'missing independent runtime JS build fingerprint');
assert.equal(htmlBuild,title,'HTML build identity disagrees with title');
assert.equal(jsBuild,title,'game.js runtime fingerprint disagrees with title');
// Check each versioned script/stylesheet actually loaded at runtime.
// Other unrelated assets may have their own content revisions.
const assets=[...html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="((?:js|css)\/[^"]+\?v=([^"&]+))"[^>]*>/g)];
assert(assets.length>=15,'versioned game resources missing from HTML');
for(const [,uri,version] of assets)assert.equal(version,title,'stale cache-busting version: '+uri);
console.log('PASS build identity: HTML, runtime game.js, and '+assets.length+' versioned resources = '+title);

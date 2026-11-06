/* Yaksha mapchip editor project model and deterministic AI command engine.
 * One source shared by the browser and the Node CLI. No runtime dependencies. */
(function(root, factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.YakshaMapchip=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const N=32, BYTES=N*N*4, FORMAT='yaksha-mapchip-v1';
  const SIDES=['top','right','bottom','left'];
  function rgba(input){
    if(input===null||input==='transparent')return [0,0,0,0];
    if(typeof input!=='string'||!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(input))throw Error('Invalid color: use #RRGGBB or #RRGGBBAA');
    return [1,3,5,7].map((i,k)=>k===3&&input.length===7?255:parseInt(input.slice(i,i+2),16));
  }
  function hex(c){return '#'+Array.from(c).map(x=>x.toString(16).padStart(2,'0')).join('');}
  function b64encode(bytes){
    if(typeof Buffer!=='undefined')return Buffer.from(bytes).toString('base64');
    let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);
  }
  function b64decode(str){
    if(!str)return new Uint8ClampedArray(BYTES);
    const bytes=typeof Buffer!=='undefined'?Buffer.from(str,'base64'):Uint8Array.from(atob(str),ch=>ch.charCodeAt(0));
    if(bytes.length!==BYTES)throw Error('Tile pixel data must decode to 4096 RGBA bytes');
    return new Uint8ClampedArray(bytes);
  }
  function newProject(cols=4,rows=4){
    if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<1||rows<1||cols*rows>256)throw Error('Atlas size out of range');
    return {format:FORMAT,tileSize:N,cols,rows,tiles:Array.from({length:cols*rows},(_,i)=>({id:'tile-'+String(i).padStart(3,'0'),label:'タイル '+(i+1),connections:{top:false,right:false,bottom:false,left:false},passable:true,pixels:''})),map:{width:9,height:9,cells:Array(81).fill(null)}};
  }
  function verify(p){
    if(!p||p.format!==FORMAT||p.tileSize!==N||!Number.isInteger(p.cols)||!Number.isInteger(p.rows)||p.cols<1||p.rows<1||p.cols*p.rows>256||!Array.isArray(p.tiles)||p.tiles.length!==p.cols*p.rows)throw Error('Not a supported 32px mapchip project');
    p.tiles.forEach((t,i)=>{if(!t||typeof t.id!=='string'||typeof t.label!=='string'||typeof t.pixels!=='string')throw Error('Bad tile '+i);b64decode(t.pixels);if(!t.connections||!SIDES.every(k=>typeof t.connections[k]==='boolean')||typeof t.passable!=='boolean')throw Error('Bad metadata '+i);});
    const m=p.map;if(!m||!Number.isInteger(m.width)||!Number.isInteger(m.height)||m.width<1||m.height<1||m.width*m.height>4096||!Array.isArray(m.cells)||m.cells.length!==m.width*m.height)throw Error('Invalid map');
    m.cells.forEach((v,i)=>{if(v!==null&&(!Number.isInteger(v)||v<0||v>=p.tiles.length))throw Error('Invalid map cell '+i);});
    return p;
  }
  function data(p,index){const i=indexInt(index,p.tiles.length,'tile');return b64decode(p.tiles[i].pixels);}
  function saveData(p,index,bytes){const i=indexInt(index,p.tiles.length,'tile');if(bytes.length!==BYTES)throw Error('Invalid RGBA length');p.tiles[i].pixels=bytes.some(v=>v!==0)?b64encode(bytes):'';}
  function indexInt(v,max,name){if(!Number.isInteger(v)||v<0||v>=max)throw Error(name+' out of range: '+v);return v;}
  function point(x,y){indexInt(x,N,'x');indexInt(y,N,'y');return (y*N+x)*4;}
  function put(a,x,y,c){const j=point(x,y);for(let k=0;k<4;k++)a[j+k]=c[k];}
  function get(a,x,y){return Array.from(a.slice(point(x,y),point(x,y)+4));}
  function line(a,x0,y0,x1,y1,c){point(x0,y0);point(x1,y1);let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;while(true){put(a,x0,y0,c);if(x0===x1&&y0===y1)break;const twice=2*err;if(twice>=dy){err+=dy;x0+=sx;}if(twice<=dx){err+=dx;y0+=sy;}}}
  function flood(a,x,y,c){const start=point(x,y),old=Array.from(a.slice(start,start+4));if(old.every((v,i)=>v===c[i]))return;const q=[y*N+x],seen=new Uint8Array(N*N);for(let pos=0;pos<q.length;pos++){let v=q[pos];if(seen[v])continue;seen[v]=1;const o=v*4;if(!old.every((ch,i)=>a[o+i]===ch))continue;a.set(c,o);const cx=v%N,cy=(v/N)|0;if(cx>0)q.push(v-1);if(cx<N-1)q.push(v+1);if(cy>0)q.push(v-N);if(cy<N-1)q.push(v+N);}}
  function apply(p,cmd){
    verifyShape(p);if(!cmd||typeof cmd.op!=='string')throw Error('Command op required');
    const op=cmd.op;
    if(op==='mapCell'){const m=p.map;indexInt(cmd.x,m.width,'map x');indexInt(cmd.y,m.height,'map y');if(cmd.tile!==null)indexInt(cmd.tile,p.tiles.length,'tile');m.cells[cmd.y*m.width+cmd.x]=cmd.tile;return;}
    if(op==='mapResize'){const w=cmd.width,h=cmd.height; if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>4096)throw Error('Invalid map dimensions');const old=p.map;const cells=Array(w*h).fill(null);for(let y=0;y<Math.min(h,old.height);y++)for(let x=0;x<Math.min(w,old.width);x++)cells[y*w+x]=old.cells[y*old.width+x];p.map={width:w,height:h,cells};return;}
    const i=indexInt(cmd.tile,p.tiles.length,'tile'), t=p.tiles[i];
    if(op==='label'){if(typeof cmd.value!=='string'||cmd.value.length>120)throw Error('Invalid label');t.label=cmd.value;return;}
    if(op==='passable'){if(typeof cmd.value!=='boolean')throw Error('passable requires boolean');t.passable=cmd.value;return;}
    if(op==='connections'){for(const key of SIDES)if(Object.hasOwn(cmd,key)){if(typeof cmd[key]!=='boolean')throw Error('Connection must be boolean');t.connections[key]=cmd[key];}return;}
    if(op==='copy'){const other=indexInt(cmd.from,p.tiles.length,'from');if(other===i)return;t.pixels=p.tiles[other].pixels;return;}
    if(op==='clear'){t.pixels='';return;}
    const a=data(p,i), c=op==='flip'||op==='rotate'?null:rgba(cmd.color);
    switch(op){
    case 'paint':put(a,cmd.x,cmd.y,c);break;
    case 'line':line(a,cmd.x1,cmd.y1,cmd.x2,cmd.y2,c);break;
    case 'fill':flood(a,cmd.x,cmd.y,c);break;
    case 'rect':{
      const x=cmd.x,y=cmd.y,w=cmd.width,h=cmd.height;if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1)throw Error('Invalid rectangle');point(x,y);point(x+w-1,y+h-1);
      for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(cmd.filled||xx===x||yy===y||xx===x+w-1||yy===y+h-1)put(a,xx,yy,c);break;}
    case 'replace':{const old=rgba(cmd.from);for(let j=0;j<BYTES;j+=4)if(old.every((v,k)=>a[j+k]===v))a.set(c,j);break;}
    case 'flip':{const copy=a.slice();if(cmd.axis!=='x'&&cmd.axis!=='y')throw Error('axis must be x or y');for(let y=0;y<N;y++)for(let x=0;x<N;x++)a.set(get(copy,cmd.axis==='x'?N-1-x:x,cmd.axis==='y'?N-1-y:y),point(x,y));break;}
    case 'rotate':{const copy=a.slice();if(cmd.direction!=='cw'&&cmd.direction!=='ccw')throw Error('direction must be cw or ccw');for(let y=0;y<N;y++)for(let x=0;x<N;x++)a.set(get(copy,cmd.direction==='cw'?y:N-1-y,cmd.direction==='cw'?N-1-x:x),point(x,y));break;}
    default:throw Error('Unknown op: '+op);
    }
    saveData(p,i,a);
  }
  function verifyShape(p){if(!p||p.format!==FORMAT||p.tileSize!==N||!Array.isArray(p.tiles)||!p.map)throw Error('Invalid project');}
  function run(p,commands){verify(p);if(!Array.isArray(commands)||commands.length>20000)throw Error('Commands must be array of <=20000');const result=JSON.parse(JSON.stringify(p));commands.forEach((c,i)=>{try{apply(result,c)}catch(e){throw Error('Command '+(i+1)+': '+e.message)}});return verify(result);}
  function atlas(p){verify(p);const width=p.cols*N,height=p.rows*N,bytes=new Uint8ClampedArray(width*height*4);p.tiles.forEach((t,i)=>{const src=b64decode(t.pixels),ox=(i%p.cols)*N,oy=Math.floor(i/p.cols)*N;for(let y=0;y<N;y++)bytes.set(src.subarray(y*N*4,(y+1)*N*4),((oy+y)*width+ox)*4);});return {width,height,data:bytes};}
  function inspect(p){verify(p);const m=p.map, errors=[],warnings=[],roles=p.tiles.map((t,i)=>({tile:i,label:t.label,passable:t.passable,connections:t.connections}));
    const pixels=new Map();for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){
      const i=m.cells[y*m.width+x];if(i===null)continue;const a=p.tiles[i];
      for(const [dx,dy,side,opposite] of [[1,0,'right','left'],[0,1,'bottom','top']]){
        if(x+dx>=m.width||y+dy>=m.height)continue;const ni=m.cells[(y+dy)*m.width+x+dx];if(ni===null)continue;const b=p.tiles[ni];
        if(a.connections[side]!==b.connections[opposite])errors.push({x,y,neighborX:x+dx,neighborY:y+dy,type:'connection',tiles:[i,ni],side});
        if(a.connections[side]&&b.connections[opposite]){
          if(!pixels.has(i))pixels.set(i,b64decode(a.pixels));if(!pixels.has(ni))pixels.set(ni,b64decode(b.pixels));
          const aa=pixels.get(i),bb=pixels.get(ni);let differing=0;for(let n=0;n<N;n++){const p1=side==='right'?point(N-1,n):point(n,N-1),p2=side==='right'?point(0,n):point(n,0);for(let k=0;k<4;k++)if(aa[p1+k]!==bb[p2+k]){differing++;break;}}
          if(differing)warnings.push({x,y,neighborX:x+dx,neighborY:y+dy,type:'edge-pixels',differingPixels:differing,tiles:[i,ni],side});
        }
      }
    }
    return {format:FORMAT,tileSize:N,atlas:{width:p.cols*N,height:p.rows*N},tileCount:p.tiles.length,map:{width:m.width,height:m.height,usedCells:m.cells.filter(x=>x!==null).length},errors,warnings,roles};
  }
  return {N,FORMAT,SIDES,newProject,verify,rgba,hex,data,saveData,apply,run,atlas,inspect};
});
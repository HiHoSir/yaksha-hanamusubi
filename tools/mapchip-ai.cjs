#!/usr/bin/env node
/* Deterministic editing for ChatGPT/automation: node tools/mapchip-ai.cjs \
 *   source.json commands.json output.json [--png atlas.png] [--report report.json]
 * No dependencies beyond Node built-ins. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const M=require('../js/mapchip-core.js');
function crc32(bytes){let crc=0xffffffff;for(const v of bytes){crc^=v;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,bytes){const name=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([name,bytes])));return Buffer.concat([length,name,bytes,crc]);}
function pngFromAtlas(atlas){const {width:w,height:h,data}=atlas,header=Buffer.alloc(13);header.writeUInt32BE(w,0);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;const pitch=w*4,scanlines=Buffer.alloc((pitch+1)*h);for(let y=0;y<h;y++){scanlines[y*(pitch+1)]=0;Buffer.from(data.buffer,data.byteOffset+y*pitch,pitch).copy(scanlines,y*(pitch+1)+1);}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(scanlines,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
function run(args){
  if(args.length<3)throw Error('Usage: node tools/mapchip-ai.cjs source.json commands.json output.json [--png atlas.png] [--report report.json]\nUse --new as source to create an empty 4x4 project.');
  const [source,cmdfile,destination,...opts]=args;
  if(opts.length%2)throw Error('Options require output filenames');
  const options={};for(let i=0;i<opts.length;i+=2){if(!['--png','--report'].includes(opts[i])||options[opts[i]])throw Error('Invalid or duplicate option: '+opts[i]);options[opts[i]]=opts[i+1];}
  const project=source==='--new'?M.newProject():M.verify(JSON.parse(fs.readFileSync(source,'utf8')));
  const cmds=JSON.parse(fs.readFileSync(cmdfile,'utf8'));
  const edited=M.run(project,cmds),report=M.inspect(edited);
  // All commands and validation complete before writing any output.
  const data=JSON.stringify(edited,null,2)+'\n';
  for(const target of [destination,...Object.values(options)]){const dir=path.dirname(path.resolve(target));if(!fs.existsSync(dir))throw Error('Output directory does not exist: '+dir);}
  fs.writeFileSync(destination,data);
  if(options['--png'])fs.writeFileSync(options['--png'],pngFromAtlas(M.atlas(edited)));
  if(options['--report'])fs.writeFileSync(options['--report'],JSON.stringify(report,null,2)+'\n');
  return {commands:cmds.length,tiles:edited.tiles.length,png:options['--png']||null,errors:report.errors.length,warnings:report.warnings.length};
}
if(require.main===module){try{console.log(JSON.stringify(run(process.argv.slice(2))));}catch(err){console.error('Mapchip AI edit failed: '+err.message);process.exitCode=1;}}
module.exports={run,pngFromAtlas};
#!/usr/bin/env python3
"""Small dependency-free PNG structural preflight. Visual aesthetics still require scene review."""
import argparse, pathlib, struct, sys, zlib

def png(path):
    data=path.read_bytes()
    if not data.startswith(b'\x89PNG\r\n\x1a\n'): raise ValueError('not PNG')
    offset=8; width=height=mode=None; chunks=[]
    while offset+12<=len(data):
        n=struct.unpack_from('>I',data,offset)[0]
        tag=data[offset+4:offset+8];payload=data[offset+8:offset+8+n]
        if len(payload)!=n or offset+12+n>len(data): raise ValueError('truncated chunk')
        actual=zlib.crc32(tag+payload)&0xffffffff
        if actual!=struct.unpack_from('>I',data,offset+8+n)[0]: raise ValueError('chunk CRC mismatch')
        chunks.append(tag)
        if tag==b'IHDR':
            width,height,depth,mode,compression,filtering,interlace=struct.unpack('>IIBBBBB',payload)
            if width==0 or height==0: raise ValueError('invalid dimensions')
            if interlace not in (0,1): raise ValueError('invalid interlace')
        if tag==b'IEND': break
        offset+=n+12
    if b'IEND' not in chunks: raise ValueError('missing IEND')
    return width,height,mode,b'tRNS' in chunks

def main():
    ap=argparse.ArgumentParser(description='Validate dimensions and alpha metadata for game PNGs')
    ap.add_argument('file',type=pathlib.Path)
    ap.add_argument('--category',choices=['tile','sheet','object'],required=True)
    ap.add_argument('--tiles-wide',type=int,default=1)
    ap.add_argument('--tiles-high',type=int,default=1)
    ap.add_argument('--require-alpha',action='store_true')
    args=ap.parse_args()
    try:
        w,h,mode,trns=png(args.file)
        if args.tiles_wide<1 or args.tiles_high<1: raise ValueError('tile counts must be positive')
        if args.category=='tile' and (w,h)!=(32,32): raise ValueError(f'tile must be 32x32; got {w}x{h}')
        if args.category=='sheet' and (w,h)!=(32*args.tiles_wide,32*args.tiles_high):
            raise ValueError(f'sheet must be {32*args.tiles_wide}x{32*args.tiles_high}; got {w}x{h}')
        if args.require_alpha and mode not in (4,6) and not trns:
            raise ValueError('no alpha channel or tRNS transparency metadata')
        if args.category=='object' and w<1: raise ValueError('empty sprite')
        print(f'PASS: {args.file} {w}x{h}, PNG color_type={mode}; alpha_metadata={mode in (4,6) or trns}')
        print('NOTE: edge continuity, actually transparent pixels, margins, viewpoint and gameplay scale still require image/scene checks.')
    except (OSError,ValueError,struct.error) as exc:
        print(f'FAIL: {exc}',file=sys.stderr);return 1
    return 0
if __name__=='__main__': sys.exit(main())

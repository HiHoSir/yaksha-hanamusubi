"""Run with python3; Pillow is the asset preparation dependency."""
from pathlib import Path
from PIL import Image
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/settlement-editor/religious-v1'
with tempfile.TemporaryDirectory() as folder:
    work = Path(folder)
    out = work / 'assets/settlement-editor/religious-v1'
    shutil.copytree(ASSETS, out)
    (work / 'tools').mkdir()
    script = work / 'tools/prepare-religious-buildings.py'
    shutil.copy(ROOT / 'tools/prepare-religious-buildings.py', script)
    manifest = json.loads((out / 'generation.json').read_text())
    # Use repo-owned source fixtures so the regression works without original generation paths.
    for key, item in manifest['assets'].items():
        item['source'] = str(ASSETS / (key + '.png'))
    (out / 'generation.json').write_text(json.dumps(manifest))
    before = {p.name: hashlib.sha256(p.read_bytes()).digest() for p in out.glob('komainu*.png')}
    assert len(before) == 2
    subprocess.run([sys.executable, str(script)], check=True)
    for p in out.glob('komainu*.png'):
        assert Image.open(p).size == (32, 32)
        assert hashlib.sha256(p.read_bytes()).digest() == before[p.name]
    for p in out.glob('building*.png'):
        assert Image.open(p).size == (96, 64)
print('PASS building rebuild leaves both 32px komainu byte-for-byte unchanged')

#!/usr/bin/env python3
"""Builds the standalone local edition of Cambridge en Casa (one HTML file).

It runs from file:// in a desktop browser, stores data in the browser
(IndexedDB) and calls the Anthropic API with the user's own key.

Usage:
  python3 build-local.py --jspdf jspdf.umd.min.js --sdk anthropic-sdk.min.js \
      [--seed data.json] --out cambridge-en-casa-local.html

Vendor files:
  jsPDF 2.5.1:        npm pack jspdf@2.5.1  (package/dist/jspdf.umd.min.js)
  Anthropic TS SDK:   npm i @anthropic-ai/sdk esbuild, then bundle an entry
                      containing `import Anthropic from '@anthropic-ai/sdk';
                      window.Anthropic = Anthropic;` with
                      esbuild --bundle --minify --format=iife --platform=browser
  MP3 encoder:        npm pack @breezystack/lamejs  (dist/lamejs.iife.js)
--seed takes a backup exported from the app ({"docs": {...}}) to preload.
"""
import argparse, json, pathlib, re

HERE = pathlib.Path(__file__).parent
SRC = HERE / 'src'
RESET = ('<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);'
         'padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,'
         '"Segoe UI",sans-serif;background:#fafafa}img{max-width:100%}[hidden]{display:none!important}</style>')

def inline(js):
    assert '</script' not in js, 'vendor file contains </script'
    return '<script>' + js + '</script>'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--jspdf', required=True)
    ap.add_argument('--sdk', required=True)
    ap.add_argument('--lame', help='lamejs IIFE build (@breezystack/lamejs dist/lamejs.iife.js) for MP3 export')
    ap.add_argument('--seed')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    body = (SRC / '02-body.html').read_text()
    body, n = re.subn(r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/jspdf/[^"]+"></script>',
                      lambda m: inline(pathlib.Path(a.jspdf).read_text()), body)
    assert n == 1, 'jsPDF tag not found'
    seed = '<!--LOCAL_SEED-->'
    if a.seed:
        docs = json.loads(pathlib.Path(a.seed).read_text())['docs']
        seed = ('<script>window.__LOCAL_SEED=' + json.dumps(docs, ensure_ascii=False).replace('</', '<\\/')
                + ';window.__LOCAL_SEED_ID="' + pathlib.Path(a.seed).stem + '";</script>')
    parts = [
        '<!doctype html><html lang="es"><head><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">', RESET,
        (SRC / '01-head.html').read_text(), '</head><body>',
        body, inline(pathlib.Path(a.sdk).read_text()),
        inline(pathlib.Path(a.lame).read_text()) if a.lame else '', seed,
        (SRC / '00-local.js').read_text(),
        *[(SRC / f).read_text() for f in ['03-config.js', '04-ai.js', '05-pdf.js', '06-audio.js', '07-ui.js']],
        '</body></html>'
    ]
    pathlib.Path(a.out).write_text('\n'.join(parts))
    print('written', a.out)

if __name__ == '__main__':
    main()

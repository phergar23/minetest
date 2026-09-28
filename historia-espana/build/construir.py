"""Ensambla la página: plantilla + motor + escenas + datos de la línea de tiempo."""
import json, shutil, os
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(here, p), encoding="utf-8").read()
tl = json.load(open(os.path.join(here, "out/linea_tiempo.json"), encoding="utf-8"))
guion = [{k: s[k] for k in ("id", "titulo", "fecha", "capitulo", "marca")} for s in json.load(open(os.path.join(here, "guion.json"), encoding="utf-8"))]
js = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
page = (rd("plantilla.html").replace("__TL__", js(tl)).replace("__GUION__", js(guion))
        .replace("__MOTOR__", rd("motor.js")).replace("__ESCENAS__", rd("escenas.js")).replace("__APP__", rd("app.js")))
os.makedirs(os.path.join(here, "out"), exist_ok=True)
open(os.path.join(here, "out/artifact.html"), "w", encoding="utf-8").write(page)
full = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<style>html{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
        + page + '\n</body>\n</html>\n')
open(os.path.join(here, "..", "index.html"), "w", encoding="utf-8").write(full)
shutil.copyfile(os.path.join(here, "out/historia-espana.mp3"), os.path.join(here, "..", "historia-espana.mp3"))
shutil.copyfile(os.path.join(here, "out/historia-espana.mp3"), os.path.join(here, "out", "historia-espana.mp3")) if False else None
print("ok", len(page) // 1024, "KB")

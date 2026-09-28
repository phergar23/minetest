# Historia de España dibujada a mano

Animación de unos 8 minutos y medio que cuenta la historia de España, de Atapuerca a hoy, en 14 capítulos.
Una mano con lápiz traza cada dibujo, lo colorea con acuarela y el dibujo cobra vida: el bisonte de
Altamira respira, las carabelas navegan, gira el molino del Quijote, humea el tren y ondean las banderas.
Todo va sincronizado con una narración en español, música de guitarra y el sonido del lápiz.

## Verla

Abre `index.html` en el navegador (con `historia-espana.mp3` en la misma carpeta) y pulsa **Ver la historia**.

- Barra espaciadora: pausa · flechas: ±5 s · `C`: subtítulos
- Los capítulos de debajo del reproductor saltan a cada época.
- El botón del lápiz activa o desactiva el sonido del trazo, que se sintetiza en el navegador.

## Cómo está hecha

Todo el estado visual es una función pura del tiempo del audio, así que se puede pausar, saltar o
renderizar a vídeo fotograma a fotograma con idéntico resultado.

| Archivo (`build/`) | Qué hace |
| --- | --- |
| `guion.json` | Texto de la narración, dividido en escenas y bloques |
| `tts.py` | Sintetiza cada frase con Kokoro (voz `em_alex`, español de España) |
| `mezcla.py` | Monta la línea de tiempo, genera la música (Karplus-Strong) y mezcla el audio |
| `motor.js` | Motor de dibujo: trazos con temblor de mano, acuarela, animaciones «vivas» y planificación del lápiz |
| `escenas.js` | Los dibujos de las 14 escenas |
| `app.js`, `plantilla.html` | Reproductor, capítulos y subtítulos |
| `construir.py` | Ensambla `index.html` |
| `video.mjs`, `video_audio.py` | Renderizan el MP4 (con Playwright y ffmpeg) y añaden el sonido del lápiz |

Para regenerarlo todo:

```sh
cd build
pip install kokoro-onnx soundfile scipy imageio-ffmpeg
# modelos: kokoro-v1.0.onnx y voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx, releases) en build/models/
python3 tts.py && python3 mezcla.py && python3 construir.py
# vídeo (opcional): fuentes de @fontsource/caveat y @fontsource/atkinson-hyperlegible en build/fonts/
node video.mjs && python3 video_audio.py
```

Si cambias los dibujos, la página calcula cuánto tiempo extra necesita cada bloque (`window.__extra`);
guárdalo en `build/extra.json` y vuelve a ejecutar `mezcla.py` para que la narración espere al lápiz.

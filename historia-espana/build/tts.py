"""Sintetiza cada frase del guion con Kokoro (voz en español) y la guarda en caché."""
import json, hashlib, os, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

MODELS = os.environ.get("KOKORO_DIR", "models")
VOICE = os.environ.get("VOICE", "em_alex")
SPEED = float(os.environ.get("SPEED", "0.95"))
OUT = "tts_cache"
os.makedirs(OUT, exist_ok=True)

k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
guion = json.load(open("guion.json"))

def key(text):
    return hashlib.sha1(f"{VOICE}|{SPEED}|{text}".encode()).hexdigest()[:16]

def trim(x, sr, thr=0.01):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.03 * sr)); b = min(len(x), idx[-1] + int(0.08 * sr))
    return x[a:b]

for sc in guion:
    for beat in sc["beats"]:
        for s in beat:
            path = f"{OUT}/{key(s)}.wav"
            if os.path.exists(path):
                continue
            audio, sr = k.create(s, voice=VOICE, speed=SPEED, lang="es")
            audio = trim(np.asarray(audio, dtype=np.float32), sr)
            sf.write(path, audio, sr)
            print(f"{len(audio)/sr:5.2f}s  {s[:70]}", flush=True)
print("OK")

"""Añade el sonido del lápiz (sincronizado con los trazos) a la pista y monta el MP4 final."""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
import imageio_ffmpeg

x, sr = sf.read("out/historia-espana.wav", dtype="float32")
pen = json.load(open("out/lapiz.json"))
n = len(x); rng = np.random.default_rng(3)
noise = rng.normal(0, 1, n).astype(np.float32)
noise = sosfilt(butter(2, [1500, 4500], "band", fs=sr, output="sos"), noise).astype(np.float32)
env = np.zeros(n, np.float32)
ramp = int(0.012 * sr)
for t0, t1, is_text in pen:
    a, b = int(t0 * sr), min(n, int(t1 * sr))
    if b - a < 4: continue
    tt = np.arange(b - a) / sr
    mod = (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 6.5 * tt))) if is_text else (0.75 + 0.25 * np.abs(np.sin(2 * np.pi * 2.3 * tt) * np.sin(2 * np.pi * 0.7 * tt + 1)))
    e = mod.astype(np.float32)
    r = min(ramp, (b - a) // 2)
    e[:r] *= np.linspace(0, 1, r); e[len(e) - r:] *= np.linspace(1, 0, r)
    env[a:b] = np.maximum(env[a:b], e)
grain = 0.8 + 0.2 * np.abs(np.convolve(rng.normal(0, 1, n), np.ones(40) / 40, "same"))
pencil = noise * env * grain.astype(np.float32)
pencil *= 10 ** (-31 / 20) / (np.sqrt((pencil[env > 0.5] ** 2).mean()) + 1e-9)
y = x + pencil[:, None] * np.array([0.9, 1.0], np.float32)
peak = np.abs(y).max()
if peak > 0.99: y *= 0.99 / peak
sf.write("out/video_audio.wav", y, sr)
ff = imageio_ffmpeg.get_ffmpeg_exe()
out = sys.argv[1] if len(sys.argv) > 1 else "out/historia-espana.mp4"
subprocess.run([ff, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "out/segs.txt", "-i", "out/video_audio.wav",
                "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out], check=True)
print("vídeo:", out, round(os.path.getsize(out) / 1e6, 1), "MB")

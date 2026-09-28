"""Monta la línea de tiempo (voz + música + transiciones) y exporta el audio final.

Salida:
  out/linea_tiempo.json  tiempos de escenas, bloques y frases (los usa la página)
  out/historia-espana.mp3  pista de audio completa
"""
import json, hashlib, os, subprocess
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, fftconvolve, butter, sosfilt
import imageio_ffmpeg

SR = 44100
VOICE = os.environ.get("VOICE", "em_alex")
SPEED = float(os.environ.get("SPEED", "0.95"))
os.makedirs("out", exist_ok=True)
guion = json.load(open("guion.json"))
rng = np.random.default_rng(7)

def key(text):
    return hashlib.sha1(f"{VOICE}|{SPEED}|{text}".encode()).hexdigest()[:16]

def load_voice(text):
    x, sr = sf.read(f"tts_cache/{key(text)}.wav", dtype="float32")
    if sr != SR:
        x = resample_poly(x, SR, sr).astype(np.float32)
    return x

# ---------- 1. línea de tiempo de la narración ----------
GAP_SENT, GAP_BEAT = 0.34, 0.5
# segundos de silencio extra tras los bloques con mucho dibujo (los calcula la página: __extra)
EXTRA = json.load(open("extra.json")) if os.path.exists("extra.json") else {}
clips, timeline, t = [], {"escenas": []}, 0.0
for i, sc in enumerate(guion):
    esc = {"id": sc["id"], "inicio": round(t, 3), "bloques": []}
    t += 1.3 if i == 0 else 2.0            # paso de página + título
    for j, beat in enumerate(sc["beats"]):
        b = {"inicio": round(t, 3), "frases": []}
        for s in beat:
            v = load_voice(s)
            clips.append((t, v))
            d = len(v) / SR
            b["frases"].append({"t0": round(t, 3), "t1": round(t + d, 3), "texto": s})
            t += d + GAP_SENT
        t += GAP_BEAT + EXTRA.get(f"{i}-{j}", 0)
        b["fin"] = round(t, 3)
        esc["bloques"].append(b)
    t += 5.0 if i == len(guion) - 1 else 1.5   # respiro para que el dibujo «viva»
    esc["fin"] = round(t, 3)
    timeline["escenas"].append(esc)
DUR = t
timeline["duracion"] = round(DUR, 3)
N = int(DUR * SR) + SR

voice = np.zeros(N, np.float32)
for t0, v in clips:
    a = int(t0 * SR); voice[a:a + len(v)] += v
voice *= 0.82 / (np.abs(voice).max() + 1e-9)

# ---------- 2. música generativa (guitarra punteada, Karplus-Strong) ----------
NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
def midi(n):
    name, acc, octv = n[0], n[1:-1], int(n[-1])
    return 12 * (octv + 1) + NOTE[name] + {"": 0, "#": 1, "b": -1}[acc]
def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)

_cache = {}
def pluck(m, dur=2.6, t60=2.2, seed=0):
    k = (m, round(dur, 2), round(t60, 2), seed % 3)
    if k in _cache:
        return _cache[k]
    f = hz(m)
    Np = max(2, int(round(SR / f - 0.5)))
    n = int(dur * SR)
    r = np.random.default_rng(1000 + m * 7 + seed % 3)
    exc = r.uniform(-1, 1, Np)
    for _ in range(3):
        exc = 0.5 * (exc + np.roll(exc, 1))
    d = 10 ** (-3 / (f * t60))
    out = np.zeros(n + 2 * Np)
    out[Np:2 * Np] = exc
    pos = 2 * Np
    while pos < len(out):
        prev = out[pos - Np:pos]
        sh = np.concatenate(([out[pos - Np - 1]], prev[:-1]))
        cur = d * 0.5 * (prev + sh)
        e = min(len(out), pos + Np)
        out[pos:e] = cur[:e - pos]
        pos += Np
    y = out[Np:Np + n].astype(np.float32)
    env = np.ones(n, np.float32); fo = int(0.05 * SR); env[-fo:] = np.linspace(1, 0, fo)
    y *= env
    _cache[k] = y
    return y

def drum(dur=0.6, f0=110, f1=55):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-tt * 7)).astype(np.float32)

L = np.zeros(N, np.float32); R = np.zeros(N, np.float32)
def put(sig, t0, gain, pan=0.0):
    a = int(t0 * SR)
    if a < 0: sig, a = sig[-a:], 0
    if a >= N: return
    s = sig[:N - a] * gain
    L[a:a + len(s)] += s * np.sqrt(0.5 * (1 - pan)); R[a:a + len(s)] += s * np.sqrt(0.5 * (1 + pan))

def chord(names):
    return [midi(x) for x in names.split()]

# Estados de ánimo por escena: progresión, tempo y patrón
MOODS = {
 "inicio":      dict(prog=["A2 E3 A3 C4 E4", "G2 D3 G3 B3 D4", "F2 C3 F3 A3 C4", "E2 B2 E3 G#3 B3"], bpm=76, pat="arp"),
 "prehistoria": dict(prog=["D2 A2 D3 F3 A3", "D2 A2 C3 F3 A3"], bpm=60, pat="drone"),
 "pueblos":     dict(prog=["D2 A2 D3 F3 A3", "C2 G2 C3 E3 G3", "Bb1 F2 Bb2 D3 F3", "A1 E2 A2 C#3 E3"], bpm=80, pat="arp"),
 "roma":        dict(prog=["C2 G2 C3 E3 G3", "F2 C3 F3 A3 C4", "G2 D3 G3 B3 D4", "C2 G2 C3 E3 G3"], bpm=84, pat="march"),
 "visigodos":   dict(prog=["D2 A2 D3 F3 A3", "A1 E2 A2 C3 E3", "D2 A2 D3 F3 A3", "C2 G2 C3 E3 G3"], bpm=66, pat="arp"),
 "alandalus":   dict(prog=["E2 B2 E3 G#3 B3", "F2 C3 F3 A3 C4", "E2 B2 E3 G#3 B3", "D2 A2 D3 F3 A3"], bpm=72, pat="hijaz"),
 "reinos":      dict(prog=["A2 E3 A3 C4 E4", "F2 C3 F3 A3 C4", "C2 G2 C3 E3 G3", "G2 D3 G3 B3 D4"], bpm=78, pat="arp"),
 "catolicos":   dict(prog=["C2 G2 C3 E3 G3", "G2 D3 G3 B3 D4", "A2 E3 A3 C4 E4", "F2 C3 F3 A3 C4"], bpm=82, pat="arp"),
 "imperio":     dict(prog=["A2 E3 A3 C4 E4", "G2 D3 G3 B3 D4", "F2 C3 F3 A3 C4", "E2 B2 E3 G#3 B3"], bpm=88, pat="arp"),
 "borbones":    dict(prog=["G2 D3 G3 B3 D4", "D2 A2 D3 F#3 A3", "E2 B2 E3 G3 B3", "C2 G2 C3 E3 G3"], bpm=96, pat="waltz"),
 "xix":         dict(prog=["E2 B2 E3 G3 B3", "C2 G2 C3 E3 G3", "D2 A2 D3 F#3 A3", "B1 F#2 B2 D#3 F#3"], bpm=86, pat="arp"),
 "xx":          dict(prog=["D2 A2 D3 F3 A3", "Bb1 F2 Bb2 D3 F3", "G1 D2 G2 Bb2 D3", "A1 E2 A2 C#3 E3"], bpm=58, pat="somber"),
 "democracia":  dict(prog=["C2 G2 C3 E3 G3", "A2 E3 A3 C4 E4", "F2 C3 F3 A3 C4", "G2 D3 G3 B3 D4"], bpm=84, pat="arp"),
 "hoy":         dict(prog=["A2 E3 A3 C4 E4", "G2 D3 G3 B3 D4", "F2 C3 F3 A3 C4", "E2 B2 E3 G#3 B3"], bpm=76, pat="arp"),
}
HIJAZ = [midi(x) for x in "E4 F4 G#4 A4 B4 C5 D5 E5".split()]

def render_scene(mood, t0, t1, seed):
    r = np.random.default_rng(seed)
    beat = 60 / mood["bpm"]; t = t0; ci = 0
    prog = [chord(c) for c in mood["prog"]]
    pat = mood["pat"]
    while t < t1:
        c = prog[ci % len(prog)]; bass, tones = c[0], c[1:]
        up = [m + 12 for m in tones]
        if pat in ("arp", "march"):
            put(pluck(bass, 3.0, 2.6, ci), t, 0.55, -0.2)
            order = [0, 1, 2, 3, 2, 1, 2, 3] if pat == "arp" else [1, 2, 3, 2, 1, 2, 3, 2]
            for k, idx in enumerate(order):
                if pat == "march" and k % 2 == 1 and r.random() < 0.5: continue
                put(pluck(up[idx % len(up)], 2.0, 1.6, k), t + k * beat / 2 + r.normal(0, 0.006), 0.28 + 0.06 * (k == 0), 0.25)
        elif pat == "waltz":
            for bar in range(2):
                tb = t + bar * 3 * beat
                put(pluck(bass, 2.4, 2.2, bar), tb, 0.5, -0.2)
                for k in (1, 2):
                    for m in up[1:3]:
                        put(pluck(m, 1.2, 1.0, k), tb + k * beat, 0.16, 0.3)
            t += 6 * beat; ci += 1; continue
        elif pat == "drone":
            put(pluck(bass, 6.0, 4.5, ci), t, 0.6, 0.0)
            put(drum(0.7, 95, 50), t, 0.35, 0.0); put(drum(0.5, 120, 60), t + 2.5 * beat, 0.2, 0.0)
            for k in range(8):
                if r.random() < 0.3:
                    put(pluck(int(r.choice([midi(x) for x in "D4 F4 G4 A4 C5".split()])), 2.5, 2.0, k), t + k * beat / 2, 0.18, 0.4)
        elif pat == "hijaz":
            put(pluck(bass, 4.0, 3.0, ci), t, 0.5, -0.2)
            put(drum(0.4, 180, 90), t, 0.18, -0.1); put(drum(0.3, 260, 140), t + 1.5 * beat, 0.12, 0.1)
            put(drum(0.3, 260, 140), t + 2.5 * beat, 0.12, 0.1)
            j = int(r.integers(0, 4))
            for k in range(8):
                if r.random() < 0.72:
                    j = int(np.clip(j + r.choice([-1, 1, 1, -2, 2]), 0, len(HIJAZ) - 1))
                    put(pluck(HIJAZ[j], 1.8, 1.3, k), t + k * beat / 2 + r.normal(0, 0.008), 0.22, 0.3)
        elif pat == "somber":
            put(pluck(bass, 5.0, 3.5, ci), t, 0.5, -0.1)
            for k, idx in enumerate([0, 1, 2]):
                put(pluck(tones[idx], 3.5, 2.8, k), t + beat * (1 + k * 0.5), 0.2, 0.2)
        t += 4 * beat; ci += 1

esc = timeline["escenas"]
for i, e in enumerate(esc):
    a, b = e["inicio"], e["fin"] + (0.0 if i < len(esc) - 1 else 0)
    s0 = int(a * SR); s1 = min(N, int((b + 1.2) * SR))
    keepL, keepR = L[s0:s1].copy(), R[s0:s1].copy()
    L[s0:s1] = 0; R[s0:s1] = 0
    render_scene(MOODS[e["id"]], a, b + 1.0 if i < len(esc) - 1 else b - 2.5, 100 + i)
    # fundido de entrada/salida por escena y suma con lo anterior (solape suave)
    seg = np.arange(s1 - s0) / SR
    fade = np.clip(seg / 0.8, 0, 1) * np.clip((seg[-1] - seg) / 1.2, 0, 1)
    L[s0:s1] = keepL + L[s0:s1] * fade; R[s0:s1] = keepR + R[s0:s1] * fade

# acorde final
tf = esc[-1]["fin"] - 4.2
for k, m in enumerate(chord("A2 E3 A3 C#4 E4 A4")):
    put(pluck(m, 4.5, 4.0, k), tf + k * 0.07, 0.32, -0.3 + k * 0.12)

# reverberación sencilla
ir_n = int(1.6 * SR); tt = np.arange(ir_n) / SR
ir = rng.normal(0, 1, ir_n) * np.exp(-tt * 3.2); ir[0] = 0; ir /= np.sqrt((ir ** 2).sum())
sos = butter(2, 5200, "low", fs=SR, output="sos")
L = sosfilt(sos, L); R = sosfilt(sos, R)
wetL = fftconvolve(L, ir)[:N]; wetR = fftconvolve(R, np.roll(ir, 331))[:N]
music_L = 0.8 * L + 0.35 * wetL; music_R = 0.8 * R + 0.35 * wetR
music_L /= np.abs(music_L).max() + 1e-9; music_R /= np.abs(music_R).max() + 1e-9

# ---------- 3. «ducking»: la música baja cuando habla el narrador ----------
duck = np.ones(N, np.float32)
for e in esc:
    for b in e["bloques"]:
        a = int((b["frases"][0]["t0"] - 0.25) * SR); z = int((b["frases"][-1]["t1"] + 0.1) * SR)
        duck[a:z] = 0.0
k = int(0.35 * SR); ker = np.ones(k) / k
duck = np.convolve(duck, ker, mode="same")
music_gain = 0.10 + 0.17 * duck

# ---------- 4. transiciones: «pasar página» ----------
fx = np.zeros(N, np.float32)
sos_bp = butter(2, [900, 4200], "band", fs=SR, output="sos")
for i, e in enumerate(esc[1:], 1):
    n = int(0.9 * SR); tt = np.arange(n) / SR
    env = np.clip(tt / 0.18, 0, 1) * np.exp(-np.clip(tt - 0.18, 0, None) * 6)
    w = sosfilt(sos_bp, rng.normal(0, 1, n)) * env
    a = int((e["inicio"] + 0.05) * SR); fx[a:a + n] += (w / (np.abs(w).max() + 1e-9) * 0.09).astype(np.float32)

outL = voice + music_L * music_gain + fx
outR = voice + music_R * music_gain + fx
# fundido final
fo = int(2.5 * SR); end = int(DUR * SR)
env = np.ones(N); env[end - fo:end] = np.linspace(1, 0, fo); env[end:] = 0
outL *= env; outR *= env
mx = max(np.abs(outL).max(), np.abs(outR).max())
st = np.stack([outL, outR], 1)[:end] / mx * 0.95
# volumen: +4,5 dB y limitador de picos a −1 dBFS (la voz queda en torno a −19 dBFS RMS)
from scipy.ndimage import maximum_filter1d, uniform_filter1d
st *= 10 ** (4.5 / 20)
env = maximum_filter1d(np.abs(st).max(1), size=int(0.008 * SR))
g = np.minimum(1.0, 0.89 / np.maximum(env, 1e-9))
g = np.minimum(g, uniform_filter1d(g, size=int(0.012 * SR)))
st = np.clip(st * g[:, None], -0.99, 0.99)
sf.write("out/historia-espana.wav", st.astype(np.float32), SR)
json.dump(timeline, open("out/linea_tiempo.json", "w"), ensure_ascii=False, indent=1)
ff = imageio_ffmpeg.get_ffmpeg_exe()
subprocess.run([ff, "-y", "-loglevel", "error", "-i", "out/historia-espana.wav", "-codec:a", "libmp3lame", "-b:a", "96k", "out/historia-espana.mp3"], check=True)
print(f"duración {DUR/60:.2f} min · escenas {len(esc)}")

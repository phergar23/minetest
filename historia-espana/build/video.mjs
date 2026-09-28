// Renderiza la animación a vídeo, fotograma a fotograma, en varios navegadores en paralelo.
// Uso: node video.mjs   (necesita out/historia-espana.wav; después, python3 video_audio.py)
import { launch, openPage } from './navegador.mjs';
import { spawn } from 'child_process';
import fs from 'fs';
const FF = process.env.FFMPEG || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const FPS = +(process.env.FPS || 30), W = +(process.env.W || 1280), H = Math.round(W * 9 / 16), N = +(process.env.WORKERS || 4);
const LIMIT = process.env.LIMIT ? +process.env.LIMIT : null;   // segundos, para pruebas
fs.mkdirSync('out', { recursive: true });

const b0 = await launch();
const probe = await openPage(b0, { width: W, height: H });
const dur = LIMIT ?? await probe.evaluate(() => window.__dur);
fs.writeFileSync('out/lapiz.json', JSON.stringify(await probe.evaluate(() => window.__pen())));
await b0.close();

const total = Math.ceil(dur * FPS), per = Math.ceil(total / N), t0 = Date.now();
async function worker(k) {
  const browser = await launch(), page = await openPage(browser, { width: W, height: H });
  const f0 = k * per, f1 = Math.min(total, f0 + per);
  const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-tune', 'animation', '-pix_fmt', 'yuv420p', `out/seg${k}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => window.__renderAt(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (k === 0 && (f - f0) % 600 === 0) console.log(`${Math.round((f - f0) / (f1 - f0) * 100)}% · ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
}
await Promise.all([...Array(N).keys()].map(worker));
fs.writeFileSync('out/segs.txt', [...Array(N).keys()].map(k => `file 'seg${k}.mp4'`).join('\n') + '\n');
console.log(`listo: ${total} fotogramas en ${Math.round((Date.now() - t0) / 1000)} s`);

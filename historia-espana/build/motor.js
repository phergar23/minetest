/* Motor de animación «dibujado a mano».
   Todo el estado visual es una función pura del tiempo t (segundos de audio),
   así que pausar, saltar de capítulo o renderizar un vídeo fotograma a fotograma
   da siempre el mismo resultado. */
'use strict';
const TL = JSON.parse(document.getElementById('tl-data').textContent);
const GUION = JSON.parse(document.getElementById('guion-data').textContent);
const RENDER = !!window.__RENDER__;
const REDUCED = !RENDER && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const W = 1600, H = 900, TAU = Math.PI * 2, D = Math.PI / 180, PAN = 1.0;
const DUR = TL.duracion;
const NS = 'http://www.w3.org/2000/svg';

const C = {
  ink: '#262b35', red: '#b8322a', ochre: '#d9a441', sand: '#ecd6a6', rust: '#b04a2c', char: '#2e2522',
  sea: '#8dbdd3', deep: '#3f6e8c', green: '#8db36a', olive: '#6f8a4a', purple: '#9a7bb8', gold: '#e3b23c',
  stone: '#dccba8', granite: '#bdb5a5', sky: '#b9d8e6', skin: '#f0c4a0', wood: '#8a5a3b', cream: '#f6eedc',
  terra: '#c8714f', cloud: '#a3a9b1', dark: '#5d636b', flame: '#f29a38', yellow: '#f7d154', teal: '#2f7f7a',
  white: '#fdfbf6', blue: '#2f5fa7', muted: '#7a7264', rose: '#d98b8b', navy: '#27406b', lilac: '#b7a3d1'
};

/* ---------- utilidades ---------- */
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rnd = mulberry(20260928);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const lerp = (a, b, u) => a + (b - a) * u;
function mk(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

/* ---------- geometría: todo son polilíneas [[x,y],...] ---------- */
function sp(pts, closed = false, seg = 10) {
  const n = pts.length; if (n < 3) return pts.map(p => p.slice());
  const out = [], get = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push((closed ? pts[0] : pts[n - 1]).slice());
  return out;
}
const pl = (pts, closed = false) => closed ? pts.concat([pts[0]]) : pts.slice();
function ell(cx, cy, rx, ry, a0 = -90, a1 = 270) {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * D * Math.max(rx, ry) / 5)), out = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return out;
}
const ci = (cx, cy, r, a0 = -90, a1 = 270) => ell(cx, cy, r, r, a0, a1);
const rc = (x, y, w, h) => pl([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true);
const ln = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];
function bz(p0, p1, p2, p3, n = 24) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([0, 1].map(j => u * u * u * p0[j] + 3 * u * u * t * p1[j] + 3 * u * t * t * p2[j] + t * t * t * p3[j]));
  }
  return out;
}
function wav(x0, x1, y, a, wl) { const out = []; for (let x = x0; x <= x1 + 0.1; x += 3) out.push([x, y + a * Math.sin((x - x0) / wl * TAU)]); return out; }
function star(cx, cy, r1, r2, n = 5, rot = -90) {
  const out = []; for (let i = 0; i < 2 * n; i++) { const a = (rot + i * 180 / n) * D, r = i % 2 ? r2 : r1; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pl(out, true);
}
function tf(pts, at) {
  if (!at) return pts;
  const [x, y, s = 1, r = 0] = at, c = Math.cos(r * D), sn = Math.sin(r * D);
  return pts.map(([px, py]) => [x + s * (px * c - py * sn), y + s * (px * sn + py * c)]);
}
const mir = (pts, cx = 0) => pts.map(([x, y]) => [2 * cx - x, y]);
const rev = pts => pts.slice().reverse();
function capsule(x0, y0, x1, y1, r) {
  const a = Math.atan2(y1 - y0, x1 - x0) / D;
  return pl(ci(x1, y1, r, a - 90, a + 90).concat(ci(x0, y0, r, a + 90, a + 270)), true);
}
function archU(xl, xr, ySpring, yBase) {
  const cx = (xl + xr) / 2, r = (xr - xl) / 2;
  return [[xl, yBase], [xl, ySpring]].concat(ell(cx, ySpring, r, r, 180, 360).slice(1), [[xr, yBase]]);
}
function resample(pts, step) {
  const out = [pts[0].slice()]; let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
    let seg = Math.hypot(x1 - x0, y1 - y0);
    while (acc + seg >= step && seg > 0) {
      const t = (step - acc) / seg; x0 += (x1 - x0) * t; y0 += (y1 - y0) * t;
      out.push([x0, y0]); seg = Math.hypot(x1 - x0, y1 - y0); acc = 0;
    }
    acc += seg;
  }
  const L = pts[pts.length - 1], o = out[out.length - 1];
  if (Math.hypot(L[0] - o[0], L[1] - o[1]) > 0.4) out.push(L.slice());
  return out;
}
function wobble(pts, amp) {
  if (amp <= 0 || pts.length < 3) return pts;
  const f1 = TAU / (110 + rnd() * 90), f2 = TAU / (30 + rnd() * 25), p1 = rnd() * TAU, p2 = rnd() * TAU;
  let s = 0; const out = [];
  for (let i = 0; i < pts.length; i++) {
    if (i) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const o = amp * (0.65 * Math.sin(s * f1 + p1) + 0.35 * Math.sin(s * f2 + p2));
    out.push([pts[i][0] + nx * o, pts[i][1] + ny * o]);
  }
  return out;
}
function toD(pts, close) {
  let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let i = 1; i < pts.length; i++) d += 'L' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
  return close ? d + 'Z' : d;
}
function cumLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
function pointAt(pts, cum, s) {
  if (s <= 0) return pts[0]; const L = cum[cum.length - 1]; if (s >= L) return pts[pts.length - 1];
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < s) lo = m; else hi = m; }
  const u = (s - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
  return [lerp(pts[lo][0], pts[hi][0], u), lerp(pts[lo][1], pts[hi][1], u)];
}

/* ---------- mapa de la península (lon, lat) ---------- */
const COAST = [[-1.78, 43.37], [-1.98, 43.32], [-2.4, 43.43], [-2.72, 43.42], [-3.2, 43.4], [-3.8, 43.46], [-4.3, 43.4], [-4.75, 43.42], [-5.3, 43.53], [-5.66, 43.56], [-5.85, 43.66], [-6.2, 43.57], [-6.6, 43.56], [-7.04, 43.55], [-7.68, 43.78], [-8.0, 43.66], [-8.25, 43.5], [-8.4, 43.38], [-8.81, 43.32], [-9.2, 43.16], [-9.27, 42.88], [-9.0, 42.78], [-8.85, 42.55], [-8.9, 42.35], [-8.72, 42.2], [-8.87, 41.87],
  [-8.83, 41.69], [-8.67, 41.15], [-8.75, 40.64], [-8.87, 40.15], [-9.07, 39.6], [-9.38, 39.36], [-9.35, 39.0], [-9.5, 38.78], [-9.2, 38.68], [-8.95, 38.55], [-9.21, 38.41], [-8.85, 38.3], [-8.87, 37.95], [-8.8, 37.4], [-8.99, 37.02], [-8.67, 37.1], [-8.2, 37.1], [-7.93, 37.0], [-7.41, 37.18],
  [-6.95, 37.2], [-6.5, 36.95], [-6.35, 36.78], [-6.29, 36.53], [-6.1, 36.3], [-6.03, 36.18], [-5.6, 36.01], [-5.45, 36.13], [-5.35, 36.14], [-5.15, 36.43], [-4.7, 36.5], [-4.42, 36.72], [-3.9, 36.74], [-3.52, 36.72], [-3.02, 36.75], [-2.46, 36.83], [-2.19, 36.72], [-1.9, 36.99], [-1.58, 37.4], [-1.2, 37.55], [-0.98, 37.6], [-0.69, 37.63], [-0.75, 37.9], [-0.68, 37.98], [-0.48, 38.35], [-0.05, 38.6], [0.23, 38.73], [0.1, 38.84], [-0.17, 38.97], [-0.32, 39.47], [-0.03, 39.97], [0.4, 40.36], [0.87, 40.72], [0.8, 40.9], [1.25, 41.11], [1.8, 41.23], [2.17, 41.38], [2.8, 41.67], [3.13, 41.85], [3.2, 42.1], [3.32, 42.32], [3.17, 42.43],
  [2.7, 42.35], [2.2, 42.42], [1.72, 42.5], [1.4, 42.6], [0.7, 42.8], [0.2, 42.7], [-0.3, 42.8], [-0.75, 42.95], [-1.2, 43.1], [-1.45, 43.25]];
const PT_BORDER = [[-8.87, 41.87], [-8.6, 42.05], [-8.2, 42.12], [-7.9, 41.92], [-7.4, 41.85], [-6.9, 41.95], [-6.55, 41.66], [-6.2, 41.58], [-6.8, 41.05], [-6.93, 40.5], [-6.85, 40.25], [-7.02, 39.67], [-7.5, 39.66], [-7.23, 39.2], [-7.0, 38.9], [-7.3, 38.44], [-7.0, 38.0], [-7.5, 37.6], [-7.41, 37.18]];
const MALLORCA = [[2.35, 39.6], [2.55, 39.72], [2.8, 39.83], [3.1, 39.93], [3.22, 39.85], [3.12, 39.75], [3.45, 39.72], [3.3, 39.45], [3.1, 39.3], [2.95, 39.36], [2.75, 39.45], [2.6, 39.55]];
const MENORCA = [[3.82, 40.0], [4.05, 40.07], [4.3, 39.95], [4.25, 39.82], [4.0, 39.88], [3.85, 39.92]];
const IBIZA = [[1.22, 38.95], [1.4, 39.08], [1.6, 39.05], [1.58, 38.9], [1.38, 38.85], [1.25, 38.88]];
const AFRICA = [[-6.4, 34.9], [-6.2, 35.4], [-5.92, 35.79], [-5.6, 35.83], [-5.32, 35.89], [-5.3, 35.6], [-4.8, 35.3], [-3.9, 35.25], [-2.97, 35.44], [-2.2, 35.1], [-1.3, 35.3], [-0.6, 35.75], [0.5, 36.2], [1.5, 36.5], [2.6, 36.6], [3.3, 36.8]];
const iMino = COAST.findIndex(p => p[0] === -8.87 && p[1] === 41.87), iGuad = COAST.findIndex(p => p[0] === -7.41 && p[1] === 37.18);
const SPAIN = COAST.slice(0, iMino + 1).concat(PT_BORDER.slice(1, -1), COAST.slice(iGuad));
const PORTUGAL = COAST.slice(iMino, iGuad + 1).concat(PT_BORDER.slice(1, -1).reverse());
function proj(o) { const lon0 = o.lon0 ?? -9.6, lat0 = o.lat0 ?? 43.9, k = o.k, ky = o.k * (o.ky ?? 1.3); return p => [o.x + (p[0] - lon0) * k, o.y + (lat0 - p[1]) * ky]; }
const shp = (arr, P, closed = true, seg = 6) => sp(arr.map(P), closed, seg);

/* ---------- construcción de escenas ---------- */
const svg = document.getElementById('svg');
const defs = svg.querySelector('defs');
const scenesG = document.getElementById('scenes');
const SCENES = [];
let uid = 0;

function scene(id, build) {
  const idx = SCENES.length;
  const g = mk('g', { 'data-escena': id, style: 'display:none' }, scenesG);
  const sc = { id, idx, g, els: [] };
  SCENES.push(sc);
  const api = {
    el: (beat, o) => makeEl(sc, beat, o),
    tx: (beat, x, y, str, o = {}) => makeText(sc, beat, x, y, str, o),
    title: () => {
      const gi = GUION[idx];
      makeText(sc, 0, 80, 116, gi.titulo, { size: 70, weight: 700 });
      if (gi.fecha) makeText(sc, 0, 84, 164, gi.fecha, { size: 36, color: C.red, weight: 600 });
    }
  };
  build(api);
}

function baseEl(sc, beat, o) {
  const outer = mk('g', null, sc.g), inner = mk('g', null, outer);
  const el = { sc: sc.idx, beat, o, outer, inner, strokes: [], fills: [], alive: o.alive || null, pause: o.pause || 0, sync: o.sync || null, lastT: null };
  if (o.clip) {
    const id = 'clip' + (uid++), cp = mk('clipPath', { id }, defs);
    const polys = Array.isArray(o.clip[0][0]) ? o.clip : [o.clip];
    mk('path', { d: polys.map(p => toD(tf(p, o.at), true)).join(' ') }, cp);
    outer.setAttribute('clip-path', `url(#${id})`);
  }
  const org = o.o ? tf([o.o], o.at)[0] : [0, 0];
  el.ox = org[0]; el.oy = org[1];
  sc.els.push(el);
  return el;
}

function makeEl(sc, beat, o) {
  const el = baseEl(sc, beat, o);
  const fillL = mk('g', null, el.inner), strokeL = mk('g', null, el.inner);
  for (const f of (o.f || [])) {
    const polys = (Array.isArray(f.p[0][0]) ? f.p : [f.p]).map(p => wobble(resample(tf(p, o.at), 6), f.wob ?? 0.8));
    const d = polys.map(p => toD(p, true)).join(' ');
    if (f.halo) mk('path', { d, fill: 'none', stroke: f.c, 'stroke-width': f.halo, 'stroke-opacity': 0.16, 'stroke-linejoin': 'round', opacity: 0, class: 'fillnode' }, fillL);
    let fill = f.c;
    if (f.grad) {
      const gid = 'grad' + (uid++), rg = mk('radialGradient', { id: gid }, defs);
      mk('stop', { offset: '0', 'stop-color': f.grad, 'stop-opacity': f.o ?? 0.5 }, rg);
      mk('stop', { offset: '0.55', 'stop-color': f.grad, 'stop-opacity': (f.o ?? 0.5) * 0.45 }, rg);
      mk('stop', { offset: '1', 'stop-color': f.grad, 'stop-opacity': 0 }, rg);
      fill = `url(#${gid})`; f.edge = false; f.shift = false; f.o = 1;
    }
    const node = mk('path', {
      d, fill, 'fill-opacity': f.o ?? 0.88, 'fill-rule': f.rule || 'nonzero', opacity: 0,
      stroke: f.edge === false ? 'none' : f.c, 'stroke-opacity': 0.55, 'stroke-width': 2.4, 'stroke-linejoin': 'round',
      transform: f.shift === false ? '' : `translate(${(rnd() - 0.5) * 3} ${(rnd() - 0.5) * 3})`
    }, fillL);
    el.fills.push(node);
    if (f.halo) el.fills.push(node.previousSibling);
  }
  const strokes = o.s || [];
  for (const s0 of strokes) {
    const s = Array.isArray(s0) ? { p: s0 } : s0;
    let pts = tf(s.p, o.at);
    const closed = pts.length > 3 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.6;
    pts = resample(pts, 3.2);
    pts = wobble(pts, s.wob ?? o.wob ?? 1.0);
    if (closed && pts.length > 12 && !o.flag) {
      const k = Math.min(5, pts.length >> 3), dx = (rnd() - 0.5) * 2.4, dy = (rnd() - 0.5) * 2.4;
      for (let i = 1; i <= k; i++) pts.push([pts[i][0] + dx * i / k, pts[i][1] + dy * i / k]);
    }
    const cum = cumLen(pts), len = cum[cum.length - 1];
    const node = mk('path', {
      d: toD(pts), fill: 'none', stroke: s.c || o.ink || C.ink, 'stroke-width': s.w || o.w || 3.3,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-opacity': s.op ?? o.op ?? 1,
      'stroke-dasharray': `${len + 2} ${len + 2}`, 'stroke-dashoffset': len + 2, visibility: 'hidden'
    }, strokeL);
    el.strokes.push({ node, pts, cum, len, dash: s.dash || o.dash || null, k: null });
  }
  if (o.puffs) {
    const p = o.puffs; el.puffNodes = [];
    for (let i = 0; i < p.n; i++) el.puffNodes.push(mk('circle', { cx: p.x, cy: p.y, r: p.r, fill: p.c || '#e9e6e0', stroke: C.cloud, 'stroke-width': 2, opacity: 0 }, el.inner));
  }
  if (o.flag) { el.flagNodes = { s: el.strokes[0] && el.strokes[0].node, f: el.fills[0] }; }
  return el;
}

function makeText(sc, beat, x, y, str, o) {
  const el = baseEl(sc, beat, o);
  el.isText = true;
  const g = mk('g', o.rot ? { transform: `rotate(${o.rot} ${x} ${y})` } : null, el.inner);
  const id = 'tclip' + (uid++), cp = mk('clipPath', { id }, defs);
  const r = mk('rect', { x: x - 10, y: y - 200, width: 0, height: 400 }, cp);
  const t = mk('text', {
    x, y, 'font-family': o.font || 'Caveat, "Segoe Print", "Comic Sans MS", cursive', 'font-size': o.size || 34,
    'font-weight': o.weight || 600, fill: o.color || C.ink, 'text-anchor': o.anchor || 'start', 'clip-path': `url(#${id})`,
    'letter-spacing': o.ls || 0
  }, g);
  t.textContent = str;
  el.text = { node: t, rect: r, x, y, rot: o.rot || 0, size: o.size || 34, str };
  return el;
}

function measureTexts() {
  for (const sc of SCENES) {
    sc.g.style.display = '';
    for (const el of sc.els) if (el.isText) {
      const b = el.text.node.getBBox();
      Object.assign(el.text, { x0: b.x, w: b.width, top: b.y, h: b.height });
      el.text.rect.setAttribute('x', b.x - 8); el.text.rect.setAttribute('y', b.y - 14);
      el.text.rect.setAttribute('height', b.height + 28);
    }
    sc.g.style.display = 'none';
  }
}

/* ---------- partes especiales «vivas» ---------- */
function flagPts(f, ph) {
  const n = 18, top = [], bot = [], amp = f.amp ?? 7;
  if (f.dir === 'hang') {
    const left = [], right = [];
    for (let i = 0; i <= n; i++) {
      const v = i / n, y = f.y + f.h * v, dx = amp * v * Math.sin(v * 5 - ph);
      left.push([f.x + dx, y]); right.push([f.x + f.w + dx, y]);
    }
    return pl(left.concat(rev(right)), true);
  }
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = f.x + f.w * u, dy = amp * u * Math.sin(u * 5.5 - ph);
    top.push([x, f.y + dy]); bot.push([x, f.y + f.h + dy]);
  }
  return pl(top.concat(rev(bot)), true);
}
function meridianPts(g, phi) {
  const out = [];
  for (let i = 0; i <= 40; i++) { const la = -90 + 180 * i / 40; out.push([g.cx + g.r * Math.cos(la * D) * Math.sin(phi), g.cy - g.r * Math.sin(la * D)]); }
  return out;
}

const AL = {
  bob: (p, u) => ({ ty: p.a * Math.sin(TAU * u / p.T + (p.ph || 0)) }),
  drift: (p, u) => ({ tx: p.a * Math.sin(TAU * u / p.T + (p.ph || 0)) }),
  sway: (p, u) => ({ rot: p.a * Math.sin(TAU * u / p.T + (p.ph || 0)) }),
  swing: (p, u) => ({ rot: p.a * Math.sin(TAU * u / p.T) * Math.min(1, u / 1.2) }),
  spin: (p, u) => ({ rot: p.v * u }),
  breathe: (p, u) => { const s = Math.sin(TAU * u / p.T); return { sy: 1 + p.a * s, sx: 1 + p.a * 0.35 * s }; },
  pulse: (p, u) => { const s = 1 + p.a * Math.sin(TAU * u / p.T + (p.ph || 0)); return { sx: s, sy: s }; },
  flicker: (p, u) => ({ sy: 1 + p.a * (0.6 * Math.sin(u * 13.1) + 0.4 * Math.sin(u * 21.7 + 1)), sx: 1 + p.a * 0.5 * Math.sin(u * 17.3 + 2), rot: p.a * 18 * Math.sin(u * 9.7) }),
  twinkle: (p, u) => ({ op: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(TAU * u / p.T + (p.ph || 0))) }),
  glow: (p, u) => ({ op: 0.65 + 0.35 * Math.sin(TAU * u / p.T + (p.ph || 0)) }),
  move: (p, u) => { const e = ease(Math.min(1, u / p.d)); return { tx: p.dx * e, ty: (p.dy || 0) * e }; },
  sail: (p, u) => { const e = ease(Math.min(1, u / p.d)); return { tx: (p.dx || 0) * e, ty: (p.dy || 0) * e + (p.b ?? 3) * Math.sin(TAU * u / 2.4 + (p.ph || 0)), rot: (p.r ?? 1.5) * Math.sin(TAU * u / 3.1 + (p.ph || 0)) }; },
  orbit: (p, u) => { const a = (p.a0 + p.v * u) * D, a0 = p.a0 * D; return { tx: p.rx * (Math.cos(a) - Math.cos(a0)), ty: p.ry * (Math.sin(a) - Math.sin(a0)) }; },
  fall: (p, u) => { const v = ((u + (p.ph || 0)) % p.T) / p.T, w = Math.min(1, v / 0.7); return { ty: -p.dy + p.dy * w * w, op: v < 0.08 ? v / 0.08 : v > 0.72 ? Math.max(0, 1 - (v - 0.72) / 0.1) : 1 }; },
  burst: (p, u) => { const v = ((u + (p.ph || 0)) % p.T) / p.T, s = 0.15 + 1.0 * Math.sqrt(v); return { sx: s, sy: s, op: v < 0.65 ? 1 : Math.max(0, (1 - v) / 0.35) }; },
  flap: (p, u) => ({ sy: 1 - p.a * (0.5 + 0.5 * Math.sin(TAU * u / p.T)) }),
  hover: (p, u) => ({ tx: p.ax * Math.sin(TAU * u / p.T), ty: p.ay * Math.sin(2 * TAU * u / p.T) }),
  rain: (p, u) => ({ ty: (u * p.v) % p.P }),
  write: (p, u) => ({ tx: 5 * Math.sin(u * 9), ty: 3 * Math.sin(u * 13), rot: 2.5 * Math.sin(u * 7) }),
  rise: (p, u) => { const v = Math.min(1, u / p.d); return { ty: -p.dy * (1 - (1 - v) * (1 - v)) }; },
  fly: (p, u) => { const v = ((u + (p.ph || 0)) % p.T) / p.T; return { tx: p.dx * v, ty: (p.a || 8) * Math.sin(TAU * v * 3), op: v < 0.06 ? v / 0.06 : v > 0.9 ? (1 - v) / 0.1 : 1 }; },
  spinx: (p, u) => ({ sx: Math.max(0.12, Math.abs(Math.cos(TAU * u / p.T))) })
};

/* ---------- planificación del lápiz ---------- */
const SPEED = 950, ITEMS = [];
function sentenceTime(sc, beat, s) {
  const fr = TL.escenas[sc].bloques[beat].frases, k = Math.min(s[0], fr.length - 1);
  return fr[k].t0 + (s[1] || 0) * (fr[k].t1 - fr[k].t0);
}
function schedule() {
  ITEMS.length = 0;
  const EXTRA = {};
  SCENES.forEach((sc, si) => {
    const T = TL.escenas[si], nb = T.bloques.length;
    const bStart = b => b === 0 ? T.inicio + PAN + 0.05 : T.bloques[b].inicio - 0.2;
    const bDead = b => b < nb - 1 ? T.bloques[b + 1].inicio + 0.5 : T.fin - 0.9;
    // plan natural de cada elemento (trazos + desplazamientos del lápiz)
    const plans = []; let pp = null;
    for (const e of sc.els) {
      const fast = e.o.fast || 1, items = []; let total = e.pause;
      if (e.isText) {
        const st = [e.text.x0, e.text.top + e.text.h * 0.6];
        const tr = pp ? Math.min(0.32, 0.06 + Math.hypot(st[0] - pp[0], st[1] - pp[1]) / 3000) : 0;
        const dur = Math.max(0.35, (0.055 * e.text.str.length + 0.15) * (e.text.size / 40) ** 0.5) / fast;
        items.push({ tr, dur, text: true }); total += tr + dur; pp = [e.text.x0 + e.text.w, st[1]];
      } else {
        for (const s of e.strokes) {
          const st = s.pts[0];
          const tr = pp ? Math.min(0.3, 0.05 + Math.hypot(st[0] - pp[0], st[1] - pp[1]) / 3200) : 0;
          const dur = Math.max(0.09, s.len / SPEED) / fast;
          items.push({ tr, dur, s }); total += tr + dur; pp = s.pts[s.pts.length - 1];
        }
      }
      plans.push({ e, items, total, earliest: e.sync ? sentenceTime(si, e.beat, e.sync) : null });
    }
    const need = Array(nb).fill(0); plans.forEach(p => need[p.e.beat] += p.total);
    const fb = need.map((n, b) => n ? Math.min(1.3, Math.max(1, 0.75 * (bDead(b) - bStart(b)) / n)) : 1);
    const simulate = (assign) => {
      let cur = bStart(0); const endB = Array(nb).fill(null);
      for (const p of plans) {
        const b = p.e.beat, f = fb[b];
        cur = Math.max(cur, bStart(b), p.earliest ?? -1);
        if (!p.items.length) { p.e.first = p.e.first ?? cur; p.e.last = cur; endB[b] = cur; continue; }
        cur += p.e.pause * f;
        for (const it of p.items) {
          cur += it.tr * f;
          if (assign) {
            const item = { e: p.e, s: it.s, text: it.text, t0: cur, t1: cur + it.dur * f, sc: si };
            if (it.s) { it.s.t0 = item.t0; it.s.t1 = item.t1; } else { p.e.t0 = item.t0; p.e.t1 = item.t1; }
            p.e.first = p.e.first ?? item.t0; p.e.last = item.t1;
            ITEMS.push(item);
          }
          cur += it.dur * f;
        }
        endB[b] = cur;
      }
      return endB;
    };
    for (let iter = 0; iter < 40; iter++) {
      const endB = simulate(false); let ok = true;
      for (let b = 0; b < nb; b++) {
        if (endB[b] == null || endB[b] <= bDead(b) + 1e-3) continue;
        ok = false;
        const r = (bDead(b) - bStart(b)) / Math.max(0.1, endB[b] - bStart(b));
        fb[b] = Math.max(0.22, fb[b] * Math.max(0.6, Math.min(0.96, r)));
        if (b > 0 && fb[b] <= 0.22) fb[b - 1] = Math.max(0.22, fb[b - 1] * 0.93);
      }
      if (ok) break;
    }
    const endB = simulate(false);
    if (endB[nb - 1] > T.fin - 0.5) { const r = (T.fin - 0.6 - bStart(0)) / (endB[nb - 1] - bStart(0)); for (let b = 0; b < nb; b++) fb[b] *= r; }
    sc.speed = fb.map(f => +f.toFixed(2));
    fb.forEach((f, b) => { if (f < 0.6) EXTRA[`${si}-${b}`] = +Math.min(8, need[b] * (0.6 - f)).toFixed(2); });
    simulate(true);
  });
  window.__extra = EXTRA;
  for (const sc of SCENES) for (const e of sc.els) {
    if (e.last == null) e.last = TL.escenas[sc.idx].inicio + PAN;
    e.fillStart = e.last + (e.o.fillDelay || 0);
    e.aliveStart = e.fillStart + (e.o.aliveDelay ?? 0.35);
  }
}

/* ---------- mano con lápiz ---------- */
const hand = document.getElementById('hand');
function buildHand() {
  const rot = -36, sh = mk('g', { transform: 'translate(12 16)', opacity: 0.13 }, hand), body = mk('g', null, hand);
  const R = pts => tf(pts, [0, 0, 1, rot]);
  const line = (pts, fill, stroke = '#5b4034', w = 2.4, par = body) => mk('path', { d: toD(R(sp(pts, true, 8)), true), fill, stroke, 'stroke-width': w, 'stroke-linejoin': 'round' }, par);
  const poly = (pts, fill, stroke = '#5b4034', w = 2, par = body) => mk('path', { d: toD(R(pts), true), fill, stroke, 'stroke-width': w, 'stroke-linejoin': 'round' }, par);
  const palm = [[46, 6], [78, -20], [122, -26], [168, -12], [206, 18], [222, 68], [196, 116], [146, 132], [96, 118], [60, 84], [42, 46]];
  // antebrazo: sale de la muñeca hacia abajo a la derecha de la pantalla
  const d = [0.24, 0.97], A = [112, 84], B = [226, 54];
  const at = (p, k) => [p[0] + d[0] * k, p[1] + d[1] * k];
  const sleeve = [at(A, 34), at(B, 34), at(B, 1500), at(A, 1500)].map((p, i) => i > 1 ? [p[0] + (i === 2 ? 40 : -40), p[1]] : p);
  const cuff = [at(A, 16), at(B, 16), at(B, 58), at(A, 58)];
  // sombra
  line(palm, '#000', 'none', 0, sh); poly(sleeve, '#000', 'none', 0, sh);
  // lápiz
  poly([[0, 0], [10, -2.8], [10, 2.8]], '#3b3b3b', '#2a2a2a', 1);
  poly([[10, -2.8], [28, -8], [28, 8], [10, 2.8]], '#eccb9a', '#6b4a2f', 1.4);
  poly([[28, -8], [214, -8], [214, 8], [28, 8]], '#f2b632', '#6b4a2f', 1.6);
  poly([[28, -2.4], [214, -2.4], [214, 2.4], [28, 2.4]], '#e29e1c', 'none', 0);
  poly([[214, -8.5], [232, -8.5], [232, 8.5], [214, 8.5]], '#b9bcc2', '#555', 1.4);
  line([[232, -8.5], [246, -7], [248, 0], [246, 7], [232, 8.5]], '#e58b8b', '#7a3b3b', 1.4);
  // mano
  line(palm, '#f1c6a2');
  line(capsule(34, 14, 104, 42, 13).slice(0, -1), '#f4cdaa');
  line(capsule(30, -9, 104, -24, 11.5).slice(0, -1), '#f4cdaa');
  mk('path', { d: toD(R(sp([[120, 40], [140, 52], [160, 50]]))), fill: 'none', stroke: '#b98568', 'stroke-width': 2, 'stroke-linecap': 'round' }, body);
  // manga y puño
  poly(sleeve, '#35557d'); poly(cuff, '#4f73a0');
  mk('path', { d: toD(R([at([169, 69], 80), at([169, 69], 1500)])), fill: 'none', stroke: '#2b4668', 'stroke-width': 2 }, body);
  hand.style.display = 'none';
}
const OFF = [W + 260, H + 320];
function handAt(t, si) {
  let lo = -1, hi = ITEMS.length;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ITEMS[m].t0 <= t) lo = m; else hi = m; }
  const it = ITEMS[lo], nx = ITEMS[lo + 1];
  if (it && t <= it.t1 && it.sc === si) return { p: itemPos(it, clamp((t - it.t0) / (it.t1 - it.t0))), draw: true, lift: 0 };
  const endP = it && it.sc === si ? itemPos(it, 1) : null;
  const nextP = nx && nx.sc === si ? itemPos(nx, 0) : null;
  if (endP && nextP) {
    const gap = nx.t0 - it.t1;
    if (gap < 1.6) { const u = ease(clamp((t - it.t1) / gap)); return { p: [lerp(endP[0], nextP[0], u), lerp(endP[1], nextP[1], u)], draw: false, lift: Math.sin(Math.PI * u) }; }
    const rest = [clamp(endP[0] + 150, 0, W - 120), clamp(endP[1] + 170, 0, H - 60)];
    if (t - it.t1 < 0.55) { const u = ease((t - it.t1) / 0.55); return { p: [lerp(endP[0], rest[0], u), lerp(endP[1], rest[1], u)], draw: false, lift: Math.sin(Math.PI * u) }; }
    if (nx.t0 - t < 0.55) { const u = ease(1 - (nx.t0 - t) / 0.55); return { p: [lerp(rest[0], nextP[0], u), lerp(rest[1], nextP[1], u)], draw: false, lift: Math.sin(Math.PI * u) }; }
    return { p: rest, draw: false, lift: 0.2 };
  }
  if (endP && t - it.t1 < 0.9) { const u = ease((t - it.t1) / 0.9); return { p: [lerp(endP[0], OFF[0], u), lerp(endP[1], OFF[1], u)], draw: false, lift: 1 }; }
  if (nextP && nx.t0 - t < 0.75) { const u = ease(1 - (nx.t0 - t) / 0.75); return { p: [lerp(OFF[0], nextP[0], u), lerp(OFF[1], nextP[1], u)], draw: false, lift: 1 - u }; }
  return null;
}
function drawShape(p) { return p * 0.55 + ease(p) * 0.45; }
function itemPos(it, p) {
  if (it.text) {
    const x = it.e.text;
    const px = x.x0 + x.w * p, py = x.top + x.h * 0.62 + Math.sin(p * x.w / 6.5) * x.size * 0.16;
    if (!x.rot) return [px, py];
    const c = Math.cos(x.rot * D), s = Math.sin(x.rot * D), dx = px - x.x, dy = py - x.y;
    return [x.x + dx * c - dy * s, x.y + dx * s + dy * c];
  }
  const s = it.s; return pointAt(s.pts, s.cum, drawShape(p) * s.len);
}

/* ---------- render(t): función pura del tiempo ---------- */
let showHand = true, lastScene = -1, drawing = false;
function sceneAt(t) { let i = 0; while (i < TL.escenas.length - 1 && TL.escenas[i + 1].inicio <= t) i++; return i; }
function setAttr(n, k, v) { if (n.getAttribute(k) !== v) n.setAttribute(k, v); }

function updateEl(el, t) {
  const flowOn = el.o.flow && t >= el.aliveStart && !REDUCED;
  for (const s of el.strokes) {
    if (flowOn) {
      const u = t - el.aliveStart, f = el.o.flow;
      setAttr(s.node, 'visibility', 'visible'); setAttr(s.node, 'stroke-dasharray', `${f.dash[0]} ${f.dash[1]}`);
      s.node.setAttribute('stroke-dashoffset', (-u * f.v).toFixed(1)); s.k = 'flow'; continue;
    }
    const raw = s.t0 == null ? 1 : clamp((t - s.t0) / (s.t1 - s.t0));
    const p = drawShape(raw);
    const key = raw <= 0 ? -1 : raw >= 1 ? 2 : Math.round(p * 500);
    if (key === s.k) continue;
    s.k = key;
    if (raw <= 0) { setAttr(s.node, 'visibility', 'hidden'); continue; }
    setAttr(s.node, 'visibility', 'visible');
    if (s.dash) {
      const [on, off] = s.dash;
      if (raw >= 1) { setAttr(s.node, 'stroke-dasharray', `${on} ${off}`); setAttr(s.node, 'stroke-dashoffset', '0'); continue; }
      const L = s.len * p, arr = []; let acc = 0;
      while (acc + on < L) { arr.push(on, off); acc += on + off; }
      arr.push(Math.max(0.01, Math.min(on, L - acc)), s.len + on + off);
      s.node.setAttribute('stroke-dasharray', arr.map(v => v.toFixed(1)).join(' '));
      s.node.setAttribute('stroke-dashoffset', '0');
    } else {
      setAttr(s.node, 'stroke-dasharray', `${s.len + 2} ${s.len + 2}`);
      s.node.setAttribute('stroke-dashoffset', raw >= 1 ? '0' : ((1 - p) * (s.len + 2)).toFixed(1));
    }
  }
  if (el.isText) {
    const raw = el.t0 == null ? 1 : clamp((t - el.t0) / (el.t1 - el.t0));
    const w = raw >= 1 ? el.text.w + 40 : raw * (el.text.w + 16);
    const v = w.toFixed(1); if (el.text.lastW !== v) { el.text.lastW = v; el.text.rect.setAttribute('width', v); }
  }
  const fo = clamp((t - el.fillStart) / (el.o.fillDur || 0.65));
  if (el.fo !== fo) { el.fo = fo; for (const n of el.fills) n.setAttribute('opacity', fo.toFixed(3)); }
  // vida
  let tx = 0, ty = 0, rot = 0, sx = 1, sy = 1, op = 1;
  const u = t - el.aliveStart;
  if (el.alive && u > 0 && !REDUCED) {
    for (const a of el.alive) {
      const r = AL[a.t](a, u);
      tx += r.tx || 0; ty += r.ty || 0; rot += r.rot || 0;
      sx *= r.sx ?? 1; sy *= r.sy ?? 1; op *= r.op ?? 1;
    }
  }
  const tr = (tx || ty || rot || sx !== 1 || sy !== 1)
    ? `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(2)} ${el.ox} ${el.oy}) translate(${el.ox} ${el.oy}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-el.ox} ${-el.oy})` : '';
  if (el.lastTr !== tr) { el.lastTr = tr; el.inner.setAttribute('transform', tr); }
  const ops = op.toFixed(3); if (el.lastOp !== ops) { el.lastOp = ops; el.inner.setAttribute('opacity', ops); }
  // especiales
  if (el.o.flag && el.flagNodes) {
    if (u > 0 && !REDUCED) {
      const f = el.o.flag, d = toD(flagPts(f, u * TAU / (f.T || 1.6)), true);
      if (el.flagNodes.s) { el.flagNodes.s.setAttribute('d', d); setAttr(el.flagNodes.s, 'stroke-dasharray', 'none'); el.strokes[0].k = 'flag'; }
      if (el.flagNodes.f) el.flagNodes.f.setAttribute('d', d);
      el.flagLive = true;
    } else if (el.flagLive) {
      const d = toD(flagPts(el.o.flag, 0), true);
      if (el.flagNodes.s) { el.flagNodes.s.setAttribute('d', d); el.strokes[0].k = null; }
      if (el.flagNodes.f) el.flagNodes.f.setAttribute('d', d);
      el.flagLive = false;
    }
  }
  if (el.puffNodes) {
    const p = el.o.puffs;
    el.puffNodes.forEach((n, i) => {
      if (u <= 0 || REDUCED) { setAttr(n, 'opacity', '0'); return; }
      const v = ((u / p.T) + i / p.n) % 1, on = Math.min(1, u / (p.T * i / p.n + 0.01));
      n.setAttribute('cx', (p.x + p.dx * v).toFixed(1)); n.setAttribute('cy', (p.y + p.dy * v).toFixed(1));
      n.setAttribute('r', (p.r * (0.5 + 1.3 * v)).toFixed(1)); n.setAttribute('opacity', (on * 0.85 * (1 - v)).toFixed(3));
    });
  }
  if (el.o.globe) {
    const g = el.o.globe;
    if (u > 0 && !REDUCED) {
      el.strokes.forEach((s, i) => {
        if (i >= g.n) return;
        const phi = (i / g.n) * Math.PI + u * (g.v || 0.35);
        const ph = ((phi % Math.PI) + Math.PI) % Math.PI;   // meridiano completo = semicírculo visible
        s.node.setAttribute('d', toD(meridianPts(g, ph - Math.PI / 2)));
        setAttr(s.node, 'stroke-dasharray', 'none'); s.k = 'globe';
      });
      el.globeLive = true;
    } else if (el.globeLive) {
      el.strokes.forEach((s, i) => { if (i < g.n) { s.node.setAttribute('d', toD(s.pts)); s.k = null; } });
      el.globeLive = false;
    }
  }
}

function render(t) {
  t = clamp(t, 0, DUR);
  const si = sceneAt(t), T = TL.escenas[si];
  const u = si > 0 ? clamp((t - T.inicio) / PAN) : 1, e = ease(u);
  SCENES.forEach((sc, k) => {
    const vis = k === si || (k === si - 1 && u < 1);
    const disp = vis ? '' : 'none';
    if (sc.g.style.display !== disp) sc.g.style.display = disp;
    if (!vis) return;
    const x = k === si ? W * (1 - e) : -W * e;
    const trs = x ? `translate(${x.toFixed(1)} 0)` : '';
    if (sc.lastTr !== trs) { sc.lastTr = trs; sc.g.setAttribute('transform', trs); }
    for (const el of sc.els) updateEl(el, t);
  });
  // mano
  const h = showHand ? handAt(t, si) : null;
  if (h && u >= 1) {
    const lift = h.lift || 0;
    hand.setAttribute('transform', `translate(${(h.p[0] - 4 * lift).toFixed(1)} ${(h.p[1] - 11 * lift).toFixed(1)}) rotate(${(2 * Math.sin(t * 2.3)).toFixed(2)}) scale(${(1 + 0.03 * lift).toFixed(3)})`);
    if (hand.style.display) hand.style.display = '';
    drawing = !!h.draw;
  } else { if (!hand.style.display) hand.style.display = 'none'; drawing = false; }
  return si;
}

/* ---------- textura de papel ---------- */
function paperTexture() {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 384;
    const x = c.getContext('2d'), img = x.createImageData(384, 384), r = mulberry(99);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r();
      img.data[i] = 120; img.data[i + 1] = 100; img.data[i + 2] = 70; img.data[i + 3] = v < 0.5 ? v * 18 : v * 7;
    }
    x.putImageData(img, 0, 0);
    x.strokeStyle = 'rgba(120,100,70,0.05)'; x.lineWidth = 1;
    for (let i = 0; i < 140; i++) { const a = r() * TAU, px = r() * 384, py = r() * 384, l = 6 + r() * 18; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    return c.toDataURL('image/png');
  } catch (e) { return null; }
}

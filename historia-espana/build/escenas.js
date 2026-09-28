/* Escenas: cada dibujo es una lista de trazos (s) y manchas de acuarela (f).
   beat = bloque de narración en el que se dibuja; sync = [frase, fracción] para
   que aparezca justo cuando la voz lo nombra; alive = cómo «cobra vida». */

/* ---------- iconos reutilizables (coordenadas locales) ---------- */
function crown(col = C.gold, gem = C.red) {
  const pts = [[-46, 6], [-54, -34], [-27, -8], [0, -46], [27, -8], [54, -34], [46, 6]], band = rc(-46, 6, 92, 22);
  return { s: [pts, band, ci(-54, -41, 6), ci(0, -53, 6), ci(54, -41, 6), ci(0, 17, 5)], f: [{ p: pl(pts, true), c: col }, { p: band, c: col }, { p: ci(0, 17, 5), c: gem }, { p: ci(-54, -41, 6), c: col }, { p: ci(0, -53, 6), c: col }, { p: ci(54, -41, 6), c: col }] };
}
function amphora() {
  const body = sp([[-16, -92], [-20, -78], [-44, -40], [-50, 6], [-38, 54], [-16, 92], [0, 108], [16, 92], [38, 54], [50, 6], [44, -40], [20, -78], [16, -92]], false, 8);
  const hL = sp([[-18, -84], [-44, -90], [-50, -66], [-40, -46]], false, 8);
  return { s: [body, ell(0, -96, 22, 7), hL, mir(hL), sp([[-49, -4], [0, 4], [49, -4]]), wav(-44, 44, 22, 4, 22)], f: [{ p: pl(body, true), c: C.terra }, { p: ell(0, -96, 22, 7), c: C.terra }], o: [0, 108] };
}
function towerPoly(x0, x1, yTop, yb, n) {
  const out = [[x0, yb], [x0, yTop + 16]], w = (x1 - x0) / (2 * n - 1);
  for (let i = 0; i < 2 * n - 1; i++) { const xa = x0 + i * w, xb = xa + w, y = i % 2 ? yTop + 16 : yTop; out.push([xa, y], [xb, y]); }
  out.push([x1, yTop + 16], [x1, yb]);
  return pl(out, true);
}
function castle() {
  const L = towerPoly(-150, -80, -120, 120, 3), R = towerPoly(80, 150, -120, 120, 3), K = towerPoly(-55, 55, -190, -40, 4), Wl = towerPoly(-80, 80, -40, 120, 5);
  const gate = archU(-26, 26, 70, 120);
  const s = [L, R, Wl, K, gate, archU(-126, -104, -60, -30), archU(104, 126, -60, -30), archU(-10, 10, -150, -120)];
  return { s, f: [{ p: L, c: C.stone, o: 1 }, { p: R, c: C.stone, o: 1 }, { p: Wl, c: C.stone, o: 1 }, { p: K, c: C.stone, o: 1 }, { p: gate, c: '#6b5a48', o: 0.9 }] };
}
function caravel() {
  const hull = pl([[-86, -28], [-78, -6]].concat(bz([-78, -6], [-72, 20], [-40, 26], [0, 26]).slice(1), bz([0, 26], [40, 26], [70, 18], [84, -6]).slice(1), [[98, -20], [76, -12], [62, -6], [-52, -6], [-60, -28]]), true);
  const main = sp([[-28, -106], [28, -106], [32, -58], [0, -50], [-32, -58]], true, 6);
  const fore = sp([[30, -84], [64, -84], [67, -52], [48, -46], [28, -52]], true, 6);
  const miz = pl([[-50, -86], [-26, -34], [-66, -34]], true);
  return {
    s: [hull, ln(0, -6, 0, -122), ln(48, -6, 48, -94), ln(-48, -6, -48, -90), main, fore, miz, { p: ln(0, -98, 0, -62), c: C.red, w: 4 }, { p: ln(-15, -82, 15, -82), c: C.red, w: 4 }, pl([[0, -122], [24, -116], [0, -110]], true)],
    f: [{ p: hull, c: C.wood }, { p: main, c: C.cream }, { p: fore, c: C.cream }, { p: miz, c: C.cream }, { p: pl([[0, -122], [24, -116], [0, -110]], true), c: C.red }]
  };
}
function horseshoe() {
  const s = [ci(0, -10, 34, 150, 390), ci(0, -10, 48, 146, 394), ln(-40, 10, -40, 64), ln(40, 10, 40, 64), ln(-60, 64, 60, 64)];
  const f = [];
  for (let i = 0; i < 10; i++) {
    const a0 = 146 + i * 24.8, a1 = a0 + 24.8;
    f.push({ p: pl(ci(0, -10, 48, a0, a1).concat(rev(ci(0, -10, 34, a0, a1))), true), c: i % 2 ? C.cream : C.red, o: 0.9 });
  }
  return { s, f };
}
function aqIcon() {
  const s = [rc(-80, -60, 160, 16)], f = [];
  const shape = [[-80, -44], [80, -44], [80, 60], [-80, 60]];
  [-40, 40].forEach(cx => s.push(archU(cx - 26, cx + 26, -6, 60)));
  s.push(ln(-80, -44, -80, 60), ln(80, -44, 80, 60), ln(-94, 60, 94, 60));
  f.push({ p: [pl(shape, true), pl(archU(-66, -14, -6, 60), true), pl(archU(14, 66, -6, 60), true)], c: C.granite, rule: 'evenodd' }, { p: rc(-80, -60, 160, 16), c: C.granite });
  return { s, f };
}
function windmill() {
  const tower = pl([[-52, 300], [-38, 22], [38, 22], [52, 300]], true), roof = pl([[-48, 26], [0, -42], [48, 26]], true);
  return { s: [tower, roof, archU(-14, 14, 264, 300), rc(-9, 120, 18, 24)], f: [{ p: tower, c: C.white, o: 1 }, { p: roof, c: '#5a4636', o: 0.95 }, { p: archU(-14, 14, 264, 300), c: '#5a4636' }] };
}
function blades(len = 190) {
  const s = [ci(0, 0, 11)], f = [];
  for (const a of [40, 130, 220, 310]) {
    const b = tf(pl([[16, 3], [len, 3], [len, 30], [26, 22]], true), [0, 0, 1, a]);
    s.push(b);
    for (let r = 60; r < len; r += 42) s.push(tf(ln(r, 3, r, 3 + 8 + (r / len) * 18), [0, 0, 1, a]));
    f.push({ p: b, c: C.cream, o: 0.9 });
  }
  return { s, f, o: [0, 0] };
}
function waveMarks(x, y) { return [wav(x, x + 46, y, 4, 23), wav(x + 8, x + 54, y + 12, 4, 23)]; }
function cloud(cx, cy, s = 1) {
  const p = tf(sp([[-80, 20], [-92, -4], [-66, -26], [-40, -24], [-26, -48], [10, -52], [34, -30], [62, -34], [86, -12], [80, 20]], false, 8), [cx, cy, s]);
  return { s: [p.concat([p[0]])], f: [{ p: pl(p, true), c: C.white, o: 0.95 }] };
}
function sunPts(cx, cy, r, n = 10, r1 = 1.35, r2 = 1.75) {
  const s = [ci(cx, cy, r)];
  for (let i = 0; i < n; i++) { const a = i * 360 / n * D; s.push(ln(cx + Math.cos(a) * r * r1, cy + Math.sin(a) * r * r1, cx + Math.cos(a) * r * r2, cy + Math.sin(a) * r * r2)); }
  return s;
}
function bird() { return [sp([[-22, -4], [-10, -12], [0, 0]]), sp([[0, 0], [10, -12], [22, -4]])]; }
function flame(x, y, h = 70, w = 34) {
  const outer = sp([[x - w * 0.45, y], [x - w * 0.55, y - h * 0.45], [x - w * 0.1, y - h], [x + w * 0.05, y - h * 0.62], [x + w * 0.35, y - h * 0.9], [x + w * 0.55, y - h * 0.35], [x + w * 0.4, y]], true, 8);
  const inner = sp([[x - w * 0.2, y - 2], [x - w * 0.18, y - h * 0.4], [x + w * 0.05, y - h * 0.55], [x + w * 0.22, y - h * 0.3], [x + w * 0.2, y - 2]], true, 8);
  return { outer, inner };
}

/* ---------- 0 · Inicio ---------- */
scene('inicio', ({ el, tx }) => {
  const P = proj({ x: 535, y: 222, k: 41 });
  tx(0, 800, 136, 'Historia de España', { size: 108, weight: 700, anchor: 'middle' });
  el(0, { s: [sp([[590, 166], [720, 158], [880, 162], [1010, 156]])], w: 4.5, ink: C.red });
  const pen = shp(COAST, P);
  el(0, { s: [pen], f: [{ p: pen, c: C.sand, o: 0.95 }], w: 3.6 });
  el(0, { s: [PT_BORDER.map(P)], w: 2.2, ink: '#8c8272', dash: [7, 7] });
  const isl = [shp(MALLORCA, P), shp(MENORCA, P), shp(IBIZA, P), ell(...P([1.46, 38.69]), 5, 3, 0, 360)];
  el(0, { s: isl, f: isl.map(p => ({ p, c: C.sand, o: 0.95 })), w: 2.6, fast: 1.4 });
  const af = sp(AFRICA.slice(0, 14).map(P));
  const afWash = sp(AFRICA.slice(0, 14).concat([[1.2, 36.1], [0.4, 35.3], [-1.5, 34.75], [-3.8, 34.55], [-5.6, 34.6], [-6.5, 34.7]]).map(P), true, 6);
  el(0, { s: [af], f: [{ p: afWash, c: C.ochre, o: 0.4, edge: false }], w: 3.2 });
  tx(0, 830, 462, 'España', { size: 50, color: C.red, weight: 700, anchor: 'middle' });
  tx(0, 596, 476, 'Portugal', { size: 26, color: C.muted, anchor: 'middle', rot: -80 });
  tx(0, 488, 486, 'Océano Atlántico', { size: 32, color: C.deep, anchor: 'middle', rot: -82, sync: [1, 0.2] });
  tx(0, 910, 212, 'Mar Cantábrico', { size: 30, color: C.deep, anchor: 'middle' });
  tx(0, 1190, 548, 'Mar Mediterráneo', { size: 32, color: C.deep, anchor: 'middle', rot: -16 });
  tx(0, 1128, 262, 'Europa ↗', { size: 32, color: C.ink, sync: [1, 0.55] });
  tx(0, 700, 748, 'África', { size: 36, color: C.ink, anchor: 'middle', sync: [1, 0.8] });
  [[392, 312], [1210, 400], [1010, 660], [420, 690]].forEach(([x, y], i) =>
    el(0, { s: waveMarks(x, y), w: 2.4, ink: C.deep, fast: 1.6, alive: [{ t: 'drift', a: 7, T: 3 + i * 0.4, ph: i }] }));
  // cazadores, navegantes, legiones, reyes y poetas
  el(1, { at: [210, 300, 1.1], s: [ln(-55, 60, 36, -32), sp([[34, -30], [40, -56], [66, -70], [56, -44], [34, -30]]), ln(22, -34, 36, -22), ln(18, -28, 30, -16)], f: [{ p: sp([[34, -30], [40, -56], [66, -70], [56, -44]], true), c: '#a39c90' }], o: [-55, 60], alive: [{ t: 'sway', a: 4, T: 3 }], sync: [0, 0.2] });
  const boat = { s: [pl([[-62, 8], [62, 8], [44, 36], [-46, 36]], true), ln(0, 8, 0, -74), pl([[4, -70], [54, 2], [4, 2]], true), pl([[0, -74], [22, -68], [0, -62]], true), wav(-72, 72, 48, 4, 24)], f: [{ p: pl([[-62, 8], [62, 8], [44, 36], [-46, 36]], true), c: C.wood }, { p: pl([[4, -70], [54, 2], [4, 2]], true), c: C.cream }, { p: pl([[0, -74], [22, -68], [0, -62]], true), c: C.red }] };
  el(1, { ...boat, at: [215, 520, 1.1], o: [0, 30], alive: [{ t: 'bob', a: 4, T: 2.6 }, { t: 'sway', a: 3, T: 3.3 }], sync: [0, 0.38] });
  const crest = sp([[-46, -50], [-20, -80], [18, -82], [50, -58], [42, -50], [14, -64], [-14, -64], [-40, -42]], true);
  el(1, { at: [1360, 320, 1.1], s: [ci(0, 0, 44, 180, 360), ln(-44, 0, 54, 0), sp([[-44, 0], [-60, 18], [-40, 16]]), pl([[18, 2], [22, 42], [6, 46], [4, 4]]), ln(0, -44, 0, -54), crest], f: [{ p: pl(ci(0, 0, 44, 180, 360), true), c: '#c9a14a' }, { p: pl([[18, 2], [22, 42], [6, 46], [4, 4]], true), c: '#c9a14a' }, { p: crest, c: C.red }], o: [0, 40], alive: [{ t: 'sway', a: 3, T: 2.8 }], sync: [0, 0.55] });
  el(1, { ...crown(), at: [1400, 500, 1.15], o: [0, 28], alive: [{ t: 'bob', a: 4, T: 2.4 }], sync: [0, 0.72] });
  const ink = sp([[-38, 40], [-40, 12], [-26, 2], [26, 2], [40, 12], [38, 40]], true), quill = sp([[2, -6], [14, -40], [34, -80], [62, -118]]);
  const vane = sp([[10, -30], [26, -66], [58, -116], [66, -104], [52, -70], [26, -30]], true);
  el(1, { at: [1330, 690, 1.05], s: [ink, rc(-14, -10, 28, 12), quill, vane, ln(26, -60, 44, -64), ln(20, -46, 36, -50)], f: [{ p: ink, c: C.navy }, { p: vane, c: C.cream }], o: [2, -6], alive: [{ t: 'sway', a: 5, T: 3.4 }], sync: [0, 0.86] });
});

/* ---------- 1 · Prehistoria ---------- */
scene('prehistoria', ({ el, tx, title }) => {
  title();
  const hill = sp([[70, 660], [120, 580], [190, 480], [270, 410], [340, 425], [410, 500], [470, 600], [500, 660]]);
  el(0, { s: [hill, ln(50, 662, 560, 662)], f: [{ p: pl(hill, true), c: '#c9b48a', o: 0.9 }] });
  const cave = sp([[210, 662], [214, 592], [246, 546], [290, 538], [324, 570], [334, 662]]);
  el(0, { s: [cave], f: [{ p: pl(cave, true), c: '#3b302a', o: 0.92 }] });
  el(0, { s: [ln(356, 660, 424, 640), ln(360, 640, 424, 662)], w: 5, ink: C.wood });
  const fl = flame(390, 648, 62, 40);
  el(0, { s: [fl.outer], f: [{ p: fl.outer, c: C.flame, o: 0.95 }, { p: fl.inner, c: C.yellow, o: 0.95 }], ink: '#a4511c', w: 2.6, o: [390, 648], alive: [{ t: 'flicker', a: 0.1 }] });
  el(0, { puffs: { n: 5, x: 392, y: 580, r: 12, dx: 24, dy: -150, T: 4.5, c: '#dcd6cc' }, alive: [{ t: 'bob', a: 0.01, T: 9 }] });
  const axe = sp([[540, 470], [576, 530], [586, 600], [560, 650], [520, 650], [494, 600], [505, 530]], true);
  el(0, { s: [axe, sp([[526, 520], [540, 560], [530, 604]]), sp([[556, 515], [549, 560], [561, 610]]), sp([[516, 624], [540, 634], [566, 624]])], f: [{ p: axe, c: '#a89f8f' }], o: [540, 650], alive: [{ t: 'sway', a: 2, T: 4 }], sync: [1, 0.1] });
  tx(0, 110, 722, 'Atapuerca (Burgos)', { size: 36, sync: [1, 0.35] });
  tx(0, 540, 692, 'bifaz', { size: 28, anchor: 'middle', color: C.muted });
  // Altamira
  el(1, { f: [{ p: ci(700, 420, 150), grad: C.yellow, o: 0.55 }], o: [700, 420], alive: [{ t: 'glow', T: 1.3 }, { t: 'pulse', a: 0.06, T: 1.7 }] });
  el(1, { s: [ln(664, 650, 700, 470), ln(676, 530, 696, 538), ln(672, 552, 692, 560)], w: 7, ink: C.wood });
  const tf2 = flame(700, 476, 88, 46);
  el(1, { s: [tf2.outer], f: [{ p: tf2.outer, c: C.flame, o: 0.95 }, { p: tf2.inner, c: C.yellow, o: 0.95 }], ink: '#a4511c', w: 2.6, o: [700, 476], alive: [{ t: 'flicker', a: 0.12 }] });
  const ceil = sp([[770, 250], [900, 214], [1080, 230], [1250, 208], [1420, 244], [1520, 330], [1532, 470], [1480, 620], [1330, 692], [1120, 704], [930, 684], [800, 614], [752, 480], [748, 350]], true);
  el(1, { s: [ceil, sp([[800, 300], [830, 330], [826, 372]]), sp([[1400, 652], [1442, 612]])], f: [{ p: ceil, c: '#e7d6b6', o: 0.95 }], w: 3, sync: [0, 0.75] });
  const bisonAt = [912, 318, 1.45];
  const body = sp([[30, 150], [28, 128], [40, 105], [58, 85], [80, 70], [105, 48], [140, 26], [175, 20], [215, 32], [260, 50], [300, 58], [335, 68], [355, 88], [362, 120], [355, 160], [346, 200], [347, 244], [332, 252], [322, 240], [318, 200], [300, 188], [250, 192], [205, 196], [178, 200], [172, 244], [155, 253], [145, 245], [140, 205], [118, 205], [98, 222], [78, 205], [62, 182], [44, 168]], true, 6);
  const mane = sp([[30, 150], [28, 128], [40, 105], [58, 85], [80, 70], [105, 48], [140, 26], [175, 20], [188, 60], [168, 110], [152, 150], [140, 205], [118, 205], [98, 222], [78, 205], [62, 182], [44, 168]], true, 6);
  el(1, {
    at: bisonAt, s: [body, sp([[78, 72], [70, 52], [78, 36], [92, 34]]), ci(60, 108, 4), sp([[188, 198], [196, 238], [208, 246]]), sp([[330, 196], [336, 236], [348, 244]]), sp([[104, 58], [114, 92], [106, 122]]), sp([[132, 42], [140, 82]]), sp([[160, 32], [166, 72]])],
    f: [{ p: body, c: C.rust, o: 0.88 }, { p: mane, c: C.char, o: 0.72 }, { p: ci(60, 108, 5), c: C.cream, o: 1 }],
    ink: '#221a17', w: 3.4, o: [200, 250], alive: [{ t: 'breathe', a: 0.018, T: 2.6 }], sync: [1, 0.25]
  });
  const tail = sp([[352, 86], [372, 100], [384, 130], [380, 162]]), tuft = sp([[376, 158], [370, 178], [383, 192], [391, 172], [386, 156]], true);
  el(1, { at: bisonAt, s: [tail, tuft], f: [{ p: tuft, c: C.char }], ink: '#221a17', o: [352, 86], alive: [{ t: 'sway', a: 9, T: 1.9 }] });
  tx(1, 1150, 750, 'Altamira (Cantabria)', { size: 36, anchor: 'middle' });
  const handSt = sp([[-26, 70], [-32, 30], [-36, 0], [-52, -16], [-66, -40], [-58, -50], [-44, -34], [-30, -24], [-30, -62], [-24, -80], [-14, -76], [-12, -40], [-8, -86], [0, -98], [8, -88], [8, -40], [12, -80], [20, -88], [27, -78], [26, -34], [31, -58], [38, -62], [44, -52], [38, -14], [36, 30], [28, 70]], false, 6);
  el(2, { at: [835, 450, 0.85, -18], s: [handSt], f: [{ p: pl(handSt, true), c: C.rust, o: 0.55, halo: 22 }], ink: C.rust, w: 2 });
  el(2, { at: [1450, 300, 0.72, 18], s: [handSt], f: [{ p: pl(handSt, true), c: C.rust, o: 0.55, halo: 22 }], ink: C.rust, w: 2 });
  el(2, { at: [1290, 272, 0.55, -8], s: [handSt], f: [{ p: pl(handSt, true), c: C.char, o: 0.35, halo: 18 }], ink: C.char, w: 2, sync: [1, 0.2] });
});

/* ---------- 2 · Pueblos antiguos ---------- */
scene('pueblos', ({ el, tx, title }) => {
  title();
  const P = proj({ x: 90, y: 214, k: 44 });
  const pen = shp(COAST, P), isl = [shp(MALLORCA, P), shp(MENORCA, P), shp(IBIZA, P)];
  el(0, { s: [pen], f: [{ p: pen, c: C.sand, o: 0.55 }], w: 3.4 });
  el(0, { s: isl, f: isl.map(p => ({ p, c: C.sand, o: 0.55 })), w: 2.4, fast: 1.5 });
  const clip = [pen].concat(isl);
  const reg = (arr, c) => el(0, { f: [{ p: sp(arr.map(P), true, 4), c, o: 0.55, edge: false }], clip });
  reg([[4.5, 43.2], [1.0, 43.0], [0.4, 42.2], [-0.7, 41.6], [-1.3, 40.6], [-1.7, 39.5], [-2.5, 38.6], [-3.7, 38.15], [-5.4, 37.85], [-7.0, 37.55], [-7.6, 36.9], [-7.6, 35.6], [4.5, 35.6]], C.ochre);
  tx(0, P([-1.6, 38.5])[0], P([-1.6, 38.5])[1], 'íberos', { size: 34, color: '#8a5a12', weight: 700, anchor: 'middle', sync: [1, 0.05] });
  reg([[-10.5, 44.2], [-3.4, 44.2], [-3.4, 42.4], [-2.7, 41.5], [-3.2, 40.2], [-3.8, 38.9], [-5.4, 38.1], [-7.0, 37.8], [-8.3, 37.5], [-10.5, 37.5]], C.green);
  tx(0, P([-6.3, 40.9])[0], P([-6.3, 40.9])[1], 'celtas', { size: 36, color: '#3f6a2a', weight: 700, anchor: 'middle', sync: [1, 0.3] });
  reg([[-3.4, 42.4], [-1.6, 42.4], [-0.7, 41.6], [-1.3, 40.6], [-1.7, 39.5], [-2.5, 38.8], [-3.8, 38.9], [-3.2, 40.2], [-2.7, 41.5]], C.purple);
  tx(0, P([-2.3, 40.6])[0], P([-2.3, 40.6])[1], 'celtíberos', { size: 30, color: '#5b3f7c', weight: 700, anchor: 'middle', rot: -10, sync: [1, 0.62] });
  tx(0, P([-2.5, 43.0])[0], P([-2.5, 43.0])[1], 'vascones', { size: 22, color: C.muted, anchor: 'middle' });
  // barco fenicio
  for (const [y, i] of [[572, 0], [620, 1], [664, 2]]) el(1, { s: [wav(900 + i * 30, 1520 - i * 20, y, 6, 70)], w: 2.4, ink: C.deep, fast: 1.8, alive: [{ t: 'drift', a: 14, T: 4 + i, ph: i }] });
  const hullP = sp([[-182, -30], [-160, 12], [-110, 40], [110, 40], [165, 6], [190, -40], [176, -42], [150, -6], [-140, -6], [-166, -28]], true, 6);
  const sail = sp([[-105, -212], [105, -212], [116, -110], [0, -96], [-116, -110]], true, 6);
  const ship = { s: [hullP, sp([[-182, -30], [-196, -56], [-186, -76], [-166, -70], [-172, -50]]), ci(-122, 14, 7), ln(0, -6, 0, -232), ln(-112, -216, 112, -216), sail], f: [{ p: hullP, c: C.wood }, { p: sail, c: C.cream }] };
  for (let x = -60; x <= 60; x += 40) { ship.s.push({ p: ln(x, -208, x * 1.06, -102), c: C.red, w: 5 }); }
  for (let x = -90; x <= 70; x += 40) ship.s.push(ln(x, 30, x - 22, 82));
  el(1, { ...ship, at: [1160, 500, 0.92], o: [0, 40], alive: [{ t: 'sail', dx: 0, d: 1, b: 4, r: 1.8 }, { t: 'drift', a: 30, T: 9 }] });
  const city = (lon, lat, label, lx, ly, sync, anchor = 'middle') => {
    const [x, y] = P([lon, lat]);
    el(1, { s: [ci(x, y, 7)], f: [{ p: ci(x, y, 7), c: C.red, o: 1 }], ink: C.red, o: [x, y], alive: [{ t: 'pulse', a: 0.2, T: 1.4 }], sync });
    tx(1, x + lx, y + ly, label, { size: 28, color: C.ink, anchor });
  };
  city(-6.29, 36.53, 'Gadir (Cádiz)', -6, 38, [1, 0.08]);
  city(3.12, 42.13, 'Emporion', 14, 10, [1, 0.42], 'start');
  city(-0.98, 37.6, 'Cartago Nova', 10, 34, [1, 0.72], 'start');
  // monedas, escritura, cultivos... y guerras
  el(2, { ...amphora(), at: [1450, 320, 0.95], alive: [{ t: 'sway', a: 2.5, T: 3.5 }] });
  const coin = { s: [ci(0, 0, 54), ci(0, 0, 44), sp([[-22, 18], [-16, -10], [0, -24], [14, -14], [10, 4], [22, 18]]), ci(-2, -8, 3)], f: [{ p: ci(0, 0, 54), c: '#cfc9bb', o: 1 }] };
  for (let i = 0; i < 18; i++) { const a = i * 20 * D; coin.s.push(ci(Math.cos(a) * 49, Math.sin(a) * 49, 1.6)); }
  el(2, { ...coin, at: [840, 430, 1], o: [0, 0], alive: [{ t: 'spinx', T: 3.2 }], fast: 1.6 });
  const olive = { s: [sp([[-70, 40], [-20, 10], [30, -14], [80, -40]])], f: [] };
  [[-40, 22, -30], [-10, 6, 30], [10, -4, -35], [40, -22, 25], [62, -32, -30]].forEach(([x, y, r]) => { const lf = tf(ell(0, 0, 22, 7, 0, 360), [x, y, 1, r + (r > 0 ? 20 : -20)]); olive.s.push(lf); olive.f.push({ p: lf, c: C.olive }); });
  el(2, { ...olive, at: [860, 610, 1], o: [-70, 40], alive: [{ t: 'sway', a: 3, T: 3 }], fast: 1.4 });
  const sword = [pl([[0, -70], [7, -58], [7, 30], [-7, 30], [-7, -58]], true), ln(-22, 30, 22, 30), ln(0, 30, 0, 56), ci(0, 60, 5)];
  el(2, { s: sword.map(p => tf(p, [1250, 735, 0.7, 35])).concat(sword.map(p => tf(p, [1250, 735, 0.7, -35]))), f: [{ p: tf(sword[0], [1250, 735, 0.7, 35]), c: C.granite }, { p: tf(sword[0], [1250, 735, 0.7, -35]), c: C.granite }], sync: [1, 0.1], o: [1250, 735], alive: [{ t: 'pulse', a: 0.03, T: 1.2 }] });
});

/* ---------- 3 · Hispania romana ---------- */
scene('roma', ({ el, tx, title }) => {
  title();
  el(0, { s: [ln(170, 230, 170, 720), ln(114, 300, 226, 300)], w: 6, ink: C.wood });
  const wing = sp([[168, 222], [140, 196], [108, 196], [122, 212], [110, 224], [146, 230]], true);
  el(0, { s: [ell(170, 222, 14, 22, 0, 360), ci(170, 192, 10), wing, mir(wing, 170), pl([[176, 190], [188, 194], [178, 198]])], f: [{ p: ell(170, 222, 14, 22, 0, 360), c: C.gold }, { p: wing, c: C.gold }, { p: mir(wing, 170), c: C.gold }, { p: ci(170, 192, 10), c: C.gold }], o: [170, 230], alive: [{ t: 'bob', a: 2, T: 3 }] });
  const flag = { x: 118, y: 302, w: 104, h: 128, dir: 'hang', amp: 10, T: 2.2 };
  el(0, { s: [flagPts(flag, 0)], f: [{ p: flagPts(flag, 0), c: C.red, o: 0.95, shift: false }], flag, wob: 0 });
  tx(0, 170, 376, 'SPQR', { size: 34, color: C.gold, weight: 700, anchor: 'middle', alive: [{ t: 'drift', a: 3, T: 2.2 }] });
  tx(0, 250, 500, '218 a. C.', { size: 58, color: C.red, weight: 700, sync: [0, 0.1] });
  tx(0, 252, 546, 'Roma llega a Ampurias', { size: 32 });
  tx(0, 250, 640, 'HISPANIA', { size: 64, weight: 700, color: C.ink, ls: 4, sync: [1, 0.55] });
  // acueducto de Segovia
  el(1, { s: sunPts(1470, 188, 34), f: [{ p: ci(1470, 188, 34), c: C.yellow, o: 0.9 }], ink: '#b98a1d', w: 2.6, o: [1470, 188], alive: [{ t: 'spin', v: 12 }] });
  const hills = sp([[600, 560], [700, 470], [820, 500], [940, 440], [1080, 470], [1200, 430], [1340, 470], [1450, 440], [1560, 500]]);
  el(1, { s: [hills], f: [{ p: pl(hills.concat([[1560, 620], [600, 620]]), true), c: C.green, o: 0.35, edge: false }], w: 2.4, ink: C.olive, op: 0.8 });
  const X0 = 630, X1 = 1530, piers = 8, step = (X1 - X0) / (piers - 1), pw = 34;
  const shape = [pl([[X0 - pw / 2, 292], [X1 + pw / 2, 292], [X1 + pw / 2, 622], [X0 - pw / 2, 622]], true)];
  const s = [rc(X0 - pw / 2 - 6, 262, X1 - X0 + pw + 12, 30)];
  for (let i = 0; i < piers - 1; i++) {
    const xl = X0 + i * step + pw / 2, xr = X0 + (i + 1) * step - pw / 2;
    s.push(archU(xl, xr, 490, 622)); shape.push(pl(archU(xl, xr, 490, 622), true));
    s.push(archU(xl, xr, 362, 424)); shape.push(pl(archU(xl, xr, 362, 424), true));
  }
  s.push(ln(X0 - pw / 2, 292, X0 - pw / 2, 622), ln(X1 + pw / 2, 292, X1 + pw / 2, 622), ln(X0 - pw / 2, 424, X1 + pw / 2, 424), ln(X0 - pw / 2, 436, X1 + pw / 2, 436), ln(606, 624, 1580, 624));
  for (let i = 0; i < piers; i++) { const x = X0 + i * step; for (const y of [470, 520, 570]) s.push({ p: ln(x - pw / 2 + 4, y, x + pw / 2 - 4, y), w: 2, op: 0.6 }); }
  el(1, { s, f: [{ p: shape, c: C.granite, rule: 'evenodd', o: 0.95 }, { p: rc(X0 - pw / 2 - 6, 262, X1 - X0 + pw + 12, 30), c: C.granite }], sync: [1, 0.05] });
  el(1, { s: [ln(X0 - 10, 276, X1 + 10, 276)], w: 5, ink: '#4e93c2', flow: { dash: [18, 12], v: 60 } });
  tx(1, 1080, 680, 'Acueducto de Segovia', { size: 36, anchor: 'middle' });
  tx(2, 250, 752, 'latín → castellano, catalán, gallego…', { size: 38, color: C.deep });
  const laurel = { s: [ci(0, 0, 30, 110, 250), ci(0, 0, 30, -70, 70)], f: [] };
  for (let a = 120; a <= 240; a += 24) { const lf = tf(ell(0, 0, 10, 4, 0, 360), [Math.cos(a * D) * 30, Math.sin(a * D) * 30, 1, a + 60]); laurel.s.push(lf); laurel.f.push({ p: lf, c: C.olive }); }
  for (let a = -60; a <= 60; a += 24) { const lf = tf(ell(0, 0, 10, 4, 0, 360), [Math.cos(a * D) * 30, Math.sin(a * D) * 30, 1, a - 60]); laurel.s.push(lf); laurel.f.push({ p: lf, c: C.olive }); }
  el(2, { ...laurel, at: [1010, 738, 1.1], fast: 2, sync: [1, 0.2], o: [0, 0], alive: [{ t: 'pulse', a: 0.04, T: 2 }] });
  tx(2, 1060, 752, 'Trajano · Séneca', { size: 38 });
});

/* ---------- 4 · Visigodos ---------- */
scene('visigodos', ({ el, tx, title }) => {
  title();
  el(0, { ...cloud(260, 280, 0.9), alive: [{ t: 'drift', a: 40, T: 12 }], fast: 1.5 });
  const hill = sp([[120, 620], [210, 520], [320, 460], [460, 440], [590, 470], [690, 550], [760, 620]]);
  el(0, { s: [hill], f: [{ p: pl(hill, true), c: '#cdbb8e', o: 0.9 }] });
  const alc = [rc(390, 372, 130, 80), towerPoly(376, 404, 340, 452, 2), towerPoly(506, 534, 340, 452, 2)];
  el(0, { s: alc.concat([rc(420, 396, 12, 18), rc(478, 396, 12, 18)]), f: alc.map(p => ({ p, c: C.stone, o: 1 })) });
  const spire = [rc(596, 380, 30, 90), pl([[590, 382], [611, 316], [632, 382]], true)];
  el(0, { s: spire, f: spire.map(p => ({ p, c: C.stone, o: 1 })) });
  const houses = [[250, 488, 46, 40], [310, 462, 44, 38], [546, 452, 40, 34], [648, 512, 44, 36], [200, 522, 40, 34]];
  const hs = [], hf = [];
  houses.forEach(([x, y, w, h]) => { const b = rc(x, y, w, h), r = pl([[x - 5, y], [x + w / 2, y - 22], [x + w + 5, y]], true); hs.push(b, r); hf.push({ p: b, c: C.cream, o: 1 }, { p: r, c: C.terra, o: 1 }); });
  el(0, { s: hs, f: hf, fast: 1.6 });
  const outer = sp([[90, 560], [160, 660], [300, 730], [460, 745], [620, 720], [740, 650], [790, 570]]), inner = sp([[120, 540], [190, 630], [310, 692], [460, 704], [610, 684], [712, 626], [760, 556]]);
  el(0, { s: [outer, inner], f: [{ p: pl(outer.concat(rev(inner)), true), c: C.sea, o: 0.9 }], ink: C.deep, w: 3 });
  el(0, { s: [sp([[105, 550], [175, 645], [305, 712], [460, 725], [615, 702], [726, 638], [775, 563]])], w: 3, ink: '#e8f3f8', flow: { dash: [16, 22], v: 40 } });
  tx(0, 110, 380, 'Toledo', { size: 52, color: C.red, weight: 700, sync: [1, 0.55] });
  tx(0, 112, 422, 'capital visigoda', { size: 30 });
  // corona votiva
  const piv = [1240, 232], sw = { t: 'swing', a: 3, T: 3.2 }, o = piv;
  tx(1, 830, 262, '589 · Recaredo', { size: 44, color: C.red, weight: 700 });
  tx(1, 832, 306, 'se hace católico', { size: 30 });
  el(1, { s: [ci(1240, 222, 12), ci(1240, 222, 5)], f: [{ p: ci(1240, 222, 12), c: C.gold }], o, alive: [sw] });
  el(1, { s: [ln(1240, 234, 1128, 392), ln(1240, 234, 1188, 402), ln(1240, 234, 1292, 402), ln(1240, 234, 1352, 392)], w: 2, o, alive: [sw], sync: [1, 0.05] });
  const band = pl(ell(1240, 392, 115, 20, 180, 360).concat(ell(1240, 486, 115, 20, 0, 180)), true);
  const gs = [ell(1240, 392, 115, 20, 0, 360), ell(1240, 486, 115, 20, 0, 180), ln(1125, 392, 1125, 486), ln(1355, 392, 1355, 486)], gf = [{ p: band, c: C.gold, o: 0.95 }];
  const cols = [C.blue, C.red, C.teal, C.white];
  for (let i = 0; i < 7; i++) { const x = 1150 + i * 30; for (const [y, k] of [[428, 0], [458, 1]]) { const g = ci(x + (k ? 15 : 0), y, 6); gs.push(g); gf.push({ p: g, c: cols[(i + k) % 4], o: 1 }); } }
  el(1, { s: gs, f: gf, o, alive: [sw] });
  const letters = 'RECCESVINTHVS'.split(''), ls = [];
  letters.forEach((ch, i) => { const x = 1140 + i * (200 / (letters.length - 1)); ls.push(ln(x, 506 - Math.sin((i / 12) * Math.PI) * 18 + 18, x, 530)); });
  el(1, { s: ls, w: 1.6, o, alive: [sw], fast: 2 });
  tx(1, 1240, 556, 'R E C C E S V I N T H V S', { size: 24, color: '#9a7616', weight: 700, anchor: 'middle', o, alive: [sw] });
  const cross = pl([[-8, -26], [8, -26], [8, -8], [26, -8], [26, 8], [8, 8], [8, 40], [-8, 40], [-8, 8], [-26, 8], [-26, -8], [-8, -8]], true);
  el(1, { s: [ln(1240, 566, 1240, 582), tf(cross, [1240, 606])], f: [{ p: tf(cross, [1240, 606]), c: C.gold }], o, alive: [sw] });
  tx(1, 1240, 720, 'Tesoro de Guarrazar', { size: 36, anchor: 'middle', sync: [1, 0.7] });
});

/* ---------- 5 · Al-Ándalus ---------- */
scene('alandalus', ({ el, tx, title }) => {
  title();
  const P = proj({ x: 80, y: 215, k: 104, lon0: -7.4, lat0: 37.35, ky: 1.24 });
  const frame = rc(80, 215, 460, 316);
  const es = COAST.slice(iGuad - 1, COAST.findIndex(p => p[0] === -2.46) + 1).map(P);
  const esL = sp(es), afL = sp(AFRICA.slice(0, 10).map(P));
  el(0, { s: [frame], f: [{ p: frame, c: C.sky, o: 0.55 }], w: 2.4, fast: 1.5 });
  el(0, { s: [esL], f: [{ p: pl(esL.concat([[600, 150], [40, 150]]), true), c: C.sand, o: 0.95 }], clip: frame });
  el(0, { s: [afL], f: [{ p: pl(afL.concat([[600, 600], [40, 600]]), true), c: C.ochre, o: 0.7 }], clip: frame });
  const gib = P([-5.35, 36.14]);
  tx(0, gib[0] + 14, gib[1] - 18, 'Gibraltar', { size: 26 });
  const bt = { s: [pl([[-18, 0], [18, 0], [12, 8], [-12, 8]], true), ln(0, 0, 0, -26), pl([[0, -26], [16, -4], [0, -4]], true)], f: [{ p: pl([[-18, 0], [18, 0], [12, 8], [-12, 8]], true), c: C.wood }, { p: pl([[0, -26], [16, -4], [0, -4]], true), c: C.cream }] };
  [[-5.55, 35.86, 0], [-5.4, 35.7, 0.4], [-5.2, 35.8, 0.8]].forEach(([lo, la, ph]) => { const [x, y] = P([lo, la]); el(0, { ...bt, at: [x, y + 24, 1.1], w: 2.4, fast: 2, alive: [{ t: 'sail', dy: -52, dx: 8, d: 5, b: 2, ph }] }); });
  const a0 = P([-5.45, 35.72]), a1 = P([-5.33, 36.2]);
  el(0, { s: [sp([a0, [a0[0] + 34, (a0[1] + a1[1]) / 2], a1]), pl([[a1[0] - 12, a1[1] + 14], a1, [a1[0] + 14, a1[1] + 10]])], ink: C.red, w: 3.6, dash: [10, 8] });
  tx(0, 470, 440, '711', { size: 64, color: C.red, weight: 700, anchor: 'middle' });
  tx(0, 400, 262, 'al-Ándalus', { size: 46, color: C.teal, weight: 700, anchor: 'middle', sync: [1, 0.6] });
  // Mezquita de Córdoba
  el(1, { s: [sp([[1470, 150], [1452, 176], [1462, 208], [1494, 214], [1476, 196], [1470, 172], [1470, 150]])], f: [{ p: sp([[1470, 150], [1452, 176], [1462, 208], [1494, 214], [1476, 196], [1470, 172]], true), c: C.yellow }], ink: '#b98a1d', w: 2.4, o: [1470, 184], alive: [{ t: 'bob', a: 3, T: 4 }] });
  [[1380, 170, 0], [1540, 250, 1], [1300, 214, 2], [1420, 238, 0.5]].forEach(([x, y, ph]) => el(1, { s: [star(x, y, 9, 4)], f: [{ p: star(x, y, 9, 4), c: C.gold }], ink: '#b98a1d', w: 1.8, fast: 2, o: [x, y], alive: [{ t: 'twinkle', T: 1.6, ph }] }));
  const cols = [700, 900, 1100, 1300, 1500];
  const colS = [], colF = [];
  cols.forEach(x => { colS.push(rc(x - 9, 522, 18, 172), pl([[x - 20, 506], [x + 20, 506], [x + 10, 522], [x - 10, 522]], true), rc(x - 13, 330, 26, 176), rc(x - 16, 694, 32, 10)); colF.push({ p: rc(x - 9, 522, 18, 172), c: '#9d8f7e', o: 1 }, { p: rc(x - 13, 330, 26, 176), c: C.cream, o: 1 }); });
  el(1, { s: colS, f: colF, fast: 1.3, sync: [0, 0.1] });
  for (let i = 0; i < 4; i++) {
    const cx = (cols[i] + cols[i + 1]) / 2, s = [], f = [];
    s.push(ci(cx, 470, 78, 150, 390), ci(cx, 470, 94, 146, 394));
    for (let k = 0; k < 12; k++) { const aa = 146 + k * 248 / 12, ab = aa + 248 / 12; f.push({ p: pl(ci(cx, 470, 94, aa, ab).concat(rev(ci(cx, 470, 78, aa, ab))), true), c: k % 2 ? C.cream : C.red, o: 0.92, edge: false }); }
    s.push(ci(cx, 330, 87, 180, 360), ci(cx, 330, 100, 180, 360));
    for (let k = 0; k < 9; k++) { const aa = 180 + k * 20, ab = aa + 20; f.push({ p: pl(ci(cx, 330, 100, aa, ab).concat(rev(ci(cx, 330, 87, aa, ab))), true), c: k % 2 ? C.red : C.cream, o: 0.92, edge: false }); }
    el(1, { s, f, fast: 1.2 });
  }
  const lx = (cols[1] + cols[2]) / 2;
  el(1, { s: [ln(lx, 392, lx, 440), sp([[lx - 22, 440], [lx - 16, 462], [lx + 16, 462], [lx + 22, 440]]), ln(lx - 24, 440, lx + 24, 440)], f: [{ p: sp([[lx - 22, 440], [lx - 16, 462], [lx + 16, 462], [lx + 22, 440]], true), c: '#c79a3a' }], w: 2.4, o: [lx, 392], alive: [{ t: 'swing', a: 4, T: 2.6 }] });
  const lf = flame(lx, 440, 26, 14);
  el(1, { f: [{ p: lf.outer, c: C.flame, o: 1 }, { p: lf.inner, c: C.yellow, o: 1 }], o: [lx, 392], alive: [{ t: 'swing', a: 4, T: 2.6 }, { t: 'flicker', a: 0.08 }] });
  tx(1, 1100, 752, 'Córdoba · califato (929)', { size: 36, anchor: 'middle', sync: [1, 0.2] });
  tx(2, 96, 596, 'Palabras de origen árabe:', { size: 30, color: C.muted });
  [['aceite', 100, 656, 0.05], ['azúcar', 300, 656, 0.3], ['almohada', 100, 722, 0.55], ['ojalá', 330, 722, 0.85]].forEach(([w, x, y, f]) => tx(2, x, y, w, { size: 48, color: C.teal, weight: 700, sync: [1, f] }));
});

/* ---------- 6 · Reinos cristianos ---------- */
scene('reinos', ({ el, tx, title }) => {
  title();
  const mts = pl([[70, 640], [170, 440], [220, 500], [320, 300], [410, 470], [470, 400], [620, 640]]);
  el(0, { s: [mts, ln(40, 642, 650, 642)], f: [{ p: pl(mts, true), c: '#9aa78a', o: 0.9 }] });
  const snow = [pl([[320, 300], [293, 354], [310, 346], [322, 360], [338, 344], [350, 356]], true), pl([[170, 440], [155, 470], [168, 466], [178, 476], [188, 464]], true), pl([[470, 400], [455, 424], [468, 420], [478, 430], [486, 420]], true)];
  el(0, { s: snow, f: snow.map(p => ({ p, c: C.white, o: 1 })), w: 2.4, fast: 1.5 });
  el(0, { ...cloud(170, 300, 0.7), alive: [{ t: 'drift', a: 40, T: 14 }], fast: 1.6 });
  const cr = pl([[-9, -48], [9, -48], [7, -14], [30, -18], [30, -2], [7, -6], [9, 50], [-9, 50], [-7, -6], [-30, -2], [-30, -18], [-7, -14]], true);
  el(0, { s: [tf(cr, [540, 280, 1.1])], f: [{ p: tf(cr, [540, 280, 1.1]), c: C.gold }], o: [540, 280], alive: [{ t: 'bob', a: 4, T: 3 }], sync: [1, 0.2] });
  tx(0, 100, 712, 'Covadonga, hacia el 722', { size: 38, color: C.red, weight: 700, sync: [1, 0.45] });
  // castillo
  el(1, { ...castle(), at: [960, 530, 1], fast: 1.1 });
  const fl = { x: 962, y: 236, w: 96, h: 58, amp: 8, T: 1.5 };
  el(1, { s: [ln(960, 340, 960, 230)], w: 3.4 });
  el(1, { s: [flagPts(fl, 0)], f: [{ p: flagPts(fl, 0), c: C.red, o: 0.95, shift: false }], flag: fl, wob: 0 });
  [['León', C.purple, 0.02], ['Castilla', C.red, 0.2], ['Navarra', '#a8322a', 0.4], ['Aragón', '#c8961a', 0.58], ['condados catalanes', '#c8961a', 0.72]].forEach(([n, c, f], i) =>
    tx(1, 1230, 300 + i * 62, n, { size: 38, color: c, weight: 700, sync: [0, f] }));
  el(1, { s: [ln(1530, 290, 1530, 640), pl([[1508, 612], [1530, 646], [1552, 612]])], w: 5, ink: C.red, sync: [1, 0.3] });
  tx(1, 1530, 690, 'sur', { size: 34, color: C.red, anchor: 'middle' });
  // convivencia y Camino de Santiago
  el(2, { s: [ln(720, 692, 720, 748), ln(704, 708, 736, 708)], w: 3.4, sync: [0, 0.6], fast: 1.5 });
  el(2, { s: [ci(800, 720, 26, 60, 300), ci(812, 720, 21, 70, 290)], w: 3.4, fast: 1.5 });
  el(2, { s: [pl([[880, 694], [904, 736], [856, 736]], true), pl([[880, 748], [856, 706], [904, 706]], true)], w: 3, fast: 1.5 });
  const shell = sp([[-50, 12], [-56, -20], [-36, -46], [0, -56], [36, -46], [56, -20], [50, 12], [14, 32], [-14, 32]], true);
  const sh = { s: [shell, rc(-16, 30, 32, 12)], f: [{ p: shell, c: '#f2d39c' }, { p: rc(-16, 30, 32, 12), c: '#f2d39c' }] };
  for (let a = -150; a <= -30; a += 20) sh.s.push(ln(0, 30, Math.cos(a * D) * 50, 8 + Math.sin(a * D) * 56));
  el(2, { ...sh, at: [1080, 718, 1], o: [0, 0], alive: [{ t: 'pulse', a: 0.05, T: 1.8 }], sync: [1, 0.05] });
  tx(2, 1150, 736, 'Camino de Santiago', { size: 40, color: C.deep, weight: 700 });
});

/* ---------- 7 · Reyes Católicos ---------- */
scene('catolicos', ({ el, tx, title }) => {
  title();
  el(0, { ...crown(), at: [220, 290, 1.3], o: [0, 28], alive: [{ t: 'bob', a: 4, T: 2.5 }] });
  tx(0, 220, 380, 'Isabel', { size: 42, anchor: 'middle', weight: 700 });
  tx(0, 220, 414, 'de Castilla', { size: 28, anchor: 'middle', color: C.muted });
  el(0, { ...crown(C.gold, C.blue), at: [470, 290, 1.3], o: [0, 28], alive: [{ t: 'bob', a: 4, T: 2.5, ph: 1.4 }], sync: [0, 0.45] });
  tx(0, 470, 380, 'Fernando', { size: 42, anchor: 'middle', weight: 700 });
  tx(0, 470, 414, 'de Aragón', { size: 28, anchor: 'middle', color: C.muted });
  el(0, { s: [sp([[230, 440], [290, 456], [345, 440], [400, 456], [460, 440]]), sp([[345, 440], [326, 426], [334, 450], [345, 440], [356, 450], [364, 426], [345, 440]])], ink: C.red, w: 3 });
  tx(0, 345, 506, '1469', { size: 52, color: C.red, weight: 700, anchor: 'middle' });
  tx(1, 640, 330, '1492', { size: 120, color: C.red, weight: 700 });
  const pom = sp([[0, -58], [34, -50], [58, -20], [60, 20], [36, 54], [0, 64], [-36, 54], [-60, 20], [-58, -20], [-34, -50]], true);
  const calyx = pl([[-16, -54], [-18, -76], [-8, -64], [0, -80], [8, -64], [18, -76], [16, -54]]);
  el(1, { at: [1080, 300, 1], s: [pom, calyx, sp([[-30, -16], [-36, 10], [-26, 30]])], f: [{ p: pom, c: C.red }, { p: pl(calyx, true), c: '#7d2a22' }], o: [0, 64], alive: [{ t: 'sway', a: 3, T: 3 }], sync: [1, 0.2] });
  tx(1, 1080, 420, 'Granada', { size: 36, anchor: 'middle', weight: 700 });
  const pgL = pl([[0, -60], [-40, -70], [-110, -62], [-110, 50], [-40, 42], [0, 52]], true), pgR = mir(pgL);
  const book = { s: [pgL, pgR], f: [{ p: pgL, c: C.cream, o: 1 }, { p: pgR, c: C.cream, o: 1 }] };
  for (let i = 0; i < 5; i++) { book.s.push({ p: ln(-96, -36 + i * 16, -18, -40 + i * 16), w: 1.8, op: 0.6 }, { p: ln(18, -40 + i * 16, 96, -36 + i * 16), w: 1.8, op: 0.6 }); }
  el(1, { ...book, at: [1370, 300, 1], fast: 1.3, o: [0, 52], alive: [{ t: 'bob', a: 2, T: 3.6 }], sync: [2, 0.45] });
  tx(1, 1370, 420, 'Gramática · Nebrija', { size: 32, anchor: 'middle' });
  // océano y carabelas
  for (const [y, i] of [[600, 0], [668, 1], [734, 2]]) el(2, { s: [wav(60 + i * 20, 1320, y, 7, 80 - i * 6)], w: 2.4, ink: C.deep, fast: 2.2, alive: [{ t: 'drift', a: 16, T: 4 + i, ph: i }] });
  const mound = ell(1450, 700, 120, 34, 180, 360), trunk = sp([[1440, 690], [1448, 620], [1462, 560], [1478, 520]]);
  const leaves = [[1478, 520, -150], [1478, 520, -110], [1478, 520, -60], [1478, 520, -20], [1478, 520, 20]].map(([x, y, a]) => sp([[x, y], [x + Math.cos(a * D) * 45, y + Math.sin(a * D) * 45 - 14], [x + Math.cos(a * D) * 86, y + Math.sin(a * D) * 86 + 10]]));
  el(2, { s: [mound, trunk].concat(leaves), f: [{ p: pl(mound, true), c: C.sand }].concat(leaves.map(l => ({ p: pl(l.concat(rev(l).map(([x, y]) => [x, y + 10])), true), c: C.green }))), o: [1440, 690], alive: [{ t: 'sway', a: 1.5, T: 3.5 }], sync: [0, 0.8] });
  tx(2, 1300, 560, 'América', { size: 40, anchor: 'end', weight: 700, color: C.teal });
  [[480, 660, 1, 0], [300, 684, 0.8, 0.7], [140, 656, 0.78, 1.4]].forEach(([x, y, s, ph], i) =>
    el(2, { ...caravel(), at: [x, y, s], o: [0, 20], alive: [{ t: 'sail', dx: 560, d: 11, b: 4, r: 2, ph }], sync: [0, 0.05 + i * 0.1], fast: 1.2 }));
});

/* ---------- 8 · Imperio y Siglo de Oro ---------- */
scene('imperio', ({ el, tx, title }) => {
  title();
  const G = { cx: 380, cy: 470, r: 160 };
  const globe = { s: [], f: [{ p: ci(G.cx, G.cy, G.r), c: C.sky, o: 0.9 }], globe: { ...G, n: 6, v: 0.35 } };
  for (let i = 0; i < 6; i++) globe.s.push(meridianPts(G, (i / 6) * Math.PI - Math.PI / 2));
  globe.s.push(ci(G.cx, G.cy, G.r), ln(G.cx - G.r, G.cy, G.cx + G.r, G.cy), ell(G.cx, G.cy - 80, 139, 18, 0, 180), ell(G.cx, G.cy + 80, 139, 18, 0, 180));
  el(0, { ...globe, w: 2.6 });
  tx(0, 640, 290, 'Carlos I · Felipe II', { size: 40, weight: 700, sync: [0, 0.05] });
  tx(0, 642, 336, '«donde nunca se ponía el sol»', { size: 30, color: C.muted, sync: [1, 0.1] });
  el(0, { s: sunPts(G.cx + 240, G.cy - 90, 30, 10), f: [{ p: ci(G.cx + 240, G.cy - 90, 30), c: C.yellow, o: 1 }], ink: '#b98a1d', w: 2.6, o: [G.cx, G.cy], alive: [{ t: 'spin', v: 26 }] });
  el(1, { s: [tf(ell(0, 0, 215, 58, 0, 360), [G.cx, G.cy, 1, -14])], ink: C.red, w: 2.6, dash: [10, 9] });
  const ship = { s: [pl([[-18, 0], [18, 0], [12, 9], [-12, 9]], true), ln(0, 0, 0, -26), pl([[-11, -24], [11, -24], [12, -6], [-12, -6]], true)], f: [{ p: pl([[-18, 0], [18, 0], [12, 9], [-12, 9]], true), c: C.wood }, { p: pl([[-11, -24], [11, -24], [12, -6], [-12, -6]], true), c: C.cream }] };
  const orb = (a) => { const x = Math.cos(a * D) * 215, y = Math.sin(a * D) * 58, r = -14 * D; return [G.cx + x * Math.cos(r) - y * Math.sin(r), G.cy + x * Math.sin(r) + y * Math.cos(r)]; };
  const sp0 = orb(90);
  el(1, { ...ship, at: [sp0[0], sp0[1] - 4, 1.3], w: 2.4, alive: [{ t: 'orbit', a0: 90, v: 40, rx: 215, ry: 58 }] });
  tx(1, 640, 440, '1522 · Elcano', { size: 44, color: C.red, weight: 700 });
  tx(1, 642, 484, 'primera vuelta al mundo', { size: 30 });
  el(2, { ...windmill(), at: [1330, 360, 1], fast: 1.2 });
  el(2, { ...blades(), at: [1330, 360, 1], o: [0, 0], alive: [{ t: 'spin', v: 40 }] });
  const horse = sp([[-56, 60], [-54, 26], [-24, 14], [24, 14], [44, 20], [56, 40], [50, 62], [10, 66], [-30, 66]], true);
  const head = sp([[36, 22], [50, -6], [64, -30], [84, -34], [96, -24], [86, -14], [70, -6], [58, 32]], true);
  const basin = pl(ell(-2, -64, 14, 8, 180, 360), true);
  const q = { s: [horse, head, pl([[66, -30], [70, -44], [76, -32]]), sp([[-54, 30], [-70, 50], [-66, 80]]), ln(-44, 62, -50, 106), ln(-30, 64, -26, 106), ln(30, 64, 26, 106), ln(44, 60, 52, 106), ln(0, 14, -2, -40), ci(-2, -52, 11), basin, ln(-2, -26, 30, -12), ln(-12, -34, 200, -118), ln(0, 14, 14, 46), sp([[-8, -46], [-14, -30], [-6, -24]])], f: [{ p: horse, c: '#b99a74' }, { p: head, c: '#b99a74' }, { p: basin, c: C.gold }, { p: ci(-2, -52, 11), c: C.skin }] };
  el(2, { ...q, at: [1030, 610, 1], w: 3, o: [0, 60], alive: [{ t: 'bob', a: 2, T: 1.2 }], sync: [1, 0.05] });
  tx(2, 1180, 752, 'Cervantes · Velázquez · Lope', { size: 36, anchor: 'middle' });
  const hg = { s: [rc(-50, -90, 100, 12), rc(-50, 78, 100, 12), sp([[-38, -78], [-34, -30], [-6, -4], [-34, 26], [-38, 78]]), sp([[38, -78], [34, -30], [6, -4], [34, 26], [38, 78]])], f: [{ p: sp([[-30, -40], [30, -40], [6, -8], [-6, -8]], true), c: C.ochre, o: 0.95 }, { p: sp([[-34, 76], [0, 44], [34, 76]], true), c: C.ochre, o: 0.95 }, { p: rc(-50, -90, 100, 12), c: C.wood }, { p: rc(-50, 78, 100, 12), c: C.wood }] };
  el(3, { ...hg, at: [760, 640, 1], sync: [0, 0.2] });
  el(3, { s: [ln(760, 636, 760, 700)], w: 2.4, ink: '#a47a22', flow: { dash: [5, 7], v: 30 } });
});

/* ---------- 9 · Borbones e Ilustración ---------- */
scene('borbones', ({ el, tx, title }) => {
  title();
  const pet = sp([[0, -110], [22, -80], [28, -40], [14, -6], [0, 6], [-14, -6], [-28, -40], [-22, -80]], true);
  const side = sp([[-14, 0], [-40, -20], [-70, -30], [-90, -8], [-80, 24], [-56, 40], [-60, 20], [-50, 10], [-30, 16], [-14, 24]], true);
  const lis = { s: [pet, side, mir(side), rc(-40, 20, 80, 16), sp([[-10, 36], [-22, 70], [-8, 84], [0, 60], [8, 84], [22, 70], [10, 36]])], f: [{ p: pet, c: C.gold }, { p: side, c: C.gold }, { p: mir(side), c: C.gold }, { p: rc(-40, 20, 80, 16), c: C.gold }, { p: sp([[-10, 36], [-22, 70], [-8, 84], [0, 60], [8, 84], [22, 70], [10, 36]], true), c: C.gold }] };
  el(0, { ...lis, at: [200, 400, 0.95], o: [0, 80], alive: [{ t: 'bob', a: 4, T: 3 }] });
  tx(0, 100, 590, '1700 · muere Carlos II', { size: 36, sync: [0, 0.05] });
  tx(0, 100, 640, 'Guerra de Sucesión (1701–1714)', { size: 30, color: C.muted, sync: [1, 0.05] });
  tx(0, 100, 694, 'Felipe V, primer Borbón', { size: 40, color: C.red, weight: 700, sync: [1, 0.45] });
  const lamp = { s: [sp([[-40, 10], [-30, 30], [30, 30], [44, 14], [60, 0], [40, 6], [-40, 10]]), ln(-8, 30, -12, 46), ln(8, 30, 12, 46), ln(-22, 46, 22, 46)], f: [{ p: sp([[-40, 10], [-30, 30], [30, 30], [44, 14], [60, 0], [40, 6]], true), c: '#c79a3a' }] };
  el(1, { ...lamp, at: [430, 330, 1], sync: [0, 0.05] });
  const lf = flame(490, 328, 34, 16);
  el(1, { f: [{ p: lf.outer, c: C.flame, o: 1 }, { p: lf.inner, c: C.yellow, o: 1 }], o: [490, 328], alive: [{ t: 'flicker', a: 0.1 }] });
  const rays = []; for (let i = 0; i < 7; i++) { const a = (-160 + i * 23) * D; rays.push(ln(490 + Math.cos(a) * 34, 300 + Math.sin(a) * 34, 490 + Math.cos(a) * 62, 300 + Math.sin(a) * 62)); }
  el(1, { s: rays, ink: '#d49a1d', w: 2.6, fast: 2, o: [490, 300], alive: [{ t: 'glow', T: 1.5 }] });
  tx(1, 440, 440, 'razón · ciencia · reformas', { size: 28, color: C.deep, anchor: 'middle' });
  // Puerta de Alcalá
  const ops = [[640, 730, 'r'], [790, 900, 'a', 470], [990, 1110, 'a', 450], [1200, 1310, 'a', 470], [1370, 1460, 'r']];
  const s = [], holes = [];
  const facade = pl([[600, 340], [1500, 340], [1500, 690], [600, 690]], true);
  s.push(facade, rc(585, 318, 930, 24), rc(870, 232, 360, 86), pl([[600, 318], [725, 272], [850, 318]]), pl([[1250, 318], [1375, 272], [1500, 318]]));
  ops.forEach(([a, b, k, sy]) => { const p = k === 'r' ? pl([[a, 690], [a, 520], [b, 520], [b, 690]]) : archU(a, b, sy, 690); s.push(p); holes.push(pl(p, true)); });
  [760, 770, 950, 960, 1140, 1150, 1330, 1340].forEach(x => s.push({ p: ln(x, 350, x, 684), w: 2.2, op: 0.7 }));
  s.push(ln(560, 692, 1540, 692), sp([[1020, 250], [1080, 250], [1084, 290], [1050, 306], [1016, 290]], true));
  el(1, { s, f: [{ p: [facade].concat(holes), c: '#e6d8bb', rule: 'evenodd', o: 1 }, { p: rc(585, 318, 930, 24), c: '#e6d8bb', o: 1 }, { p: rc(870, 232, 360, 86), c: '#e6d8bb', o: 1 }, { p: pl([[600, 318], [725, 272], [850, 318]], true), c: '#e6d8bb', o: 1 }, { p: pl([[1250, 318], [1375, 272], [1500, 318]], true), c: '#e6d8bb', o: 1 }], sync: [1, 0.25] });
  tx(1, 1050, 752, 'Puerta de Alcalá (1778)', { size: 36, anchor: 'middle' });
  [[720, 212, 0], [800, 178, 1.3], [1380, 190, 0.6]].forEach(([x, y, ph]) => el(1, { s: bird().map(p => tf(p, [x, y, 1.2])), w: 2.6, fast: 2, o: [x, y], alive: [{ t: 'flap', a: 0.6, T: 0.5 }, { t: 'hover', ax: 30, ay: 8, T: 7 + ph }] }));
});

/* ---------- 10 · Siglo XIX ---------- */
scene('xix', ({ el, tx, title }) => {
  title();
  el(0, { f: [{ p: ci(340, 520, 190), grad: C.yellow, o: 0.6 }], o: [340, 520], alive: [{ t: 'glow', T: 1.4 }] });
  const torso = pl([[190, 380], [236, 380], [244, 488], [184, 488]], true);
  const legs = pl([[184, 486], [244, 486], [262, 552], [292, 560], [292, 578], [230, 574], [214, 520], [200, 572], [150, 574], [150, 556], [178, 548]], true);
  el(0, { s: [ci(213, 352, 22), torso, legs, sp([[190, 384], [160, 330], [138, 262]]), sp([[236, 384], [262, 330], [290, 262]]), ci(136, 254, 8), ci(292, 254, 8)], f: [{ p: torso, c: C.white, o: 1 }, { p: legs, c: '#e8c14a', o: 1 }, { p: ci(213, 352, 22), c: C.skin, o: 1 }], o: [213, 574], alive: [{ t: 'breathe', a: 0.012, T: 1.8 }] });
  const lan = pl([[330, 520], [390, 520], [400, 590], [320, 590]], true);
  el(0, { s: [lan, pl([[326, 520], [360, 496], [394, 520]]), ln(360, 520, 360, 590)], f: [{ p: lan, c: C.yellow, o: 0.95 }], ink: C.ink, o: [360, 555], alive: [{ t: 'pulse', a: 0.02, T: 1.4 }], sync: [1, 0.55] });
  tx(0, 90, 650, '2 de mayo de 1808', { size: 44, color: C.red, weight: 700, sync: [0, 0.05] });
  tx(0, 92, 696, 'Guerra de la Independencia · Goya', { size: 30, sync: [1, 0.1] });
  const paper = rc(600, 260, 340, 240);
  el(1, { s: [paper, ell(770, 260, 176, 14, 0, 360), ell(770, 500, 176, 14, 0, 360)], f: [{ p: paper, c: C.cream, o: 1 }, { p: ell(770, 260, 176, 14, 0, 360), c: '#e2d3b2', o: 1 }, { p: ell(770, 500, 176, 14, 0, 360), c: '#e2d3b2', o: 1 }] });
  tx(1, 770, 330, 'Constitución', { size: 46, anchor: 'middle', weight: 700 });
  tx(1, 770, 376, 'Cádiz, 1812', { size: 34, anchor: 'middle', color: C.red });
  el(1, { s: [0, 1, 2].map(i => ({ p: wav(640, 900 - i * 30, 412 + i * 22, 2, 18), w: 2, op: 0.6 })), fast: 1.5 });
  const quill = sp([[0, 0], [30, -50], [70, -110], [96, -150]]), vane = sp([[20, -36], [40, -84], [92, -154], [100, -140], [74, -90], [40, -40]], true);
  el(1, { s: [quill, vane], f: [{ p: vane, c: C.white }], at: [900, 470, 1], o: [0, 0], alive: [{ t: 'write' }] });
  tx(1, 770, 560, '«la Pepa»', { size: 44, anchor: 'middle', color: C.red, weight: 700, sync: [0, 0.75] });
  [['independencias americanas', 0.1], ['guerras carlistas', 0.35], ['I República (1873)', 0.55], ['Restauración (1874)', 0.75]].forEach(([w, f], i) => tx(2, 1080, 272 + i * 46, '· ' + w, { size: 32, sync: [0, f] }));
  el(2, { s: [ln(40, 742, 1560, 742), ln(40, 754, 1560, 754)], w: 2.6, fast: 2, sync: [1, 0] });
  const ties = []; for (let x = 60; x < 1560; x += 40) ties.push({ p: ln(x, 738, x - 6, 760), w: 2, op: 0.7 });
  el(2, { s: ties, fast: 6 });
  const mv = { t: 'move', dx: 470, d: 14 };
  const boiler = rc(160, 620, 170, 70), cab = rc(330, 580, 80, 110), chim = pl([[190, 620], [184, 574], [214, 574], [208, 620]], true), wag = rc(430, 620, 150, 66);
  el(2, { s: [boiler, cab, chim, rc(346, 596, 48, 30), wag, ln(410, 668, 430, 668), pl([[160, 690], [132, 720], [160, 720]])], f: [{ p: boiler, c: '#3d4a5c', o: 0.9 }, { p: cab, c: C.red, o: 0.9 }, { p: chim, c: '#3d4a5c', o: 0.9 }, { p: wag, c: C.wood, o: 0.9 }], o: [300, 690], alive: [mv], sync: [1, 0] });
  [[190, 716, 22], [262, 716, 22], [370, 712, 26], [470, 718, 18], [540, 718, 18]].forEach(([x, y, r]) =>
    el(2, { s: [ci(x, y, r), ln(x - r, y, x + r, y), ln(x, y - r, x, y + r)], f: [{ p: ci(x, y, r), c: '#6d6860', o: 0.8 }], w: 2.6, fast: 2.5, o: [x, y], alive: [mv, { t: 'spin', v: 200 }] }));
  el(2, { puffs: { n: 6, x: 199, y: 566, r: 15, dx: -110, dy: -90, T: 3.2, c: '#eeeae3' }, alive: [mv] });
  tx(3, 1080, 520, '1898', { size: 72, color: C.red, weight: 700 });
  tx(3, 1082, 572, 'Cuba · Puerto Rico · Filipinas', { size: 32, sync: [0, 0.35] });
  tx(3, 1082, 616, '«el Desastre del 98»', { size: 30, color: C.muted, sync: [1, 0.3] });
});

/* ---------- 11 · Siglo XX ---------- */
scene('xx', ({ el, tx, title }) => {
  title();
  const front = rc(130, 330, 200, 150), top = pl([[130, 330], [176, 294], [376, 294], [330, 330]], true), side = pl([[330, 330], [376, 294], [376, 444], [330, 480]], true);
  el(0, { s: [front, top, side, pl([[210, 316], [230, 302], [290, 302], [270, 316]], true)], f: [{ p: front, c: C.sky, o: 0.55 }, { p: top, c: C.sky, o: 0.7 }, { p: side, c: C.sky, o: 0.4 }] });
  el(0, { s: [rc(222, 270, 56, 38), ln(222, 270, 250, 292), ln(250, 292, 278, 270)], f: [{ p: rc(222, 270, 56, 38), c: C.white, o: 1 }], w: 2.4, o: [250, 290], clip: rc(100, 180, 400, 130), alive: [{ t: 'fall', dy: 80, T: 2.2 }] });
  tx(0, 110, 560, '1931 · II República', { size: 42, color: C.red, weight: 700, sync: [0, 0.05] });
  tx(0, 112, 606, 'voto de las mujeres', { size: 32, sync: [0, 0.6] });
  const c1 = cloud(760, 260, 1.4), c2 = cloud(1010, 240, 1.6), c3 = cloud(1240, 280, 1.2);
  for (const [c, i] of [[c1, 0], [c2, 1], [c3, 2]]) el(1, { s: c.s, f: [{ p: c.f[0].p, c: '#6f757d', o: 0.92 }], alive: [{ t: 'drift', a: 12, T: 6 + i, ph: i }], fast: 1.5 });
  const bolt = pl([[1000, 290], [970, 380], [1000, 376], [976, 460], [1040, 350], [1008, 356], [1030, 290]], true);
  el(1, { s: [bolt], f: [{ p: bolt, c: C.yellow, o: 1 }], ink: '#8b6d10', w: 2.4, o: [1000, 380], alive: [{ t: 'twinkle', T: 0.9 }], sync: [1, 0.1] });
  const rain = []; for (let x = 640; x < 1330; x += 34) for (let y = 300; y < 640; y += 70) rain.push(ln(x + (y % 140 ? 16 : 0), y, x - 8 + (y % 140 ? 16 : 0), y + 24));
  el(1, { s: rain, w: 2, ink: C.deep, op: 0.7, fast: 8, clip: rc(600, 320, 690, 270), alive: [{ t: 'rain', v: 180, P: 140 }] });
  tx(1, 640, 700, 'Guerra Civil · 1936–1939', { size: 44, color: C.ink, weight: 700, sync: [1, 0.15] });
  const eye = sp([[-80, 0], [-40, -34], [0, -42], [40, -34], [80, 0], [40, 34], [0, 42], [-40, 34]], true);
  const ez = { s: [eye], f: [] };
  for (let i = 0; i < 18; i++) { const a = i * 20 * D, r1 = 50 + (i % 2) * 6; ez.s.push(ln(Math.cos(a) * r1 * 1.6, Math.sin(a) * r1 * 0.9, Math.cos(a) * (r1 + 22) * 1.6, Math.sin(a) * (r1 + 22) * 0.9)); }
  ez.s.push(sp([[-10, 22], [-18, -2], [-10, -20], [10, -20], [18, -2], [10, 22]]), rc(-8, 22, 16, 10));
  ez.f.push({ p: eye, c: '#dcdcd6', o: 1 }, { p: sp([[-10, 22], [-18, -2], [-10, -20], [10, -20], [18, -2], [10, 22]], true), c: C.white, o: 1 });
  el(1, { ...ez, at: [1430, 420, 0.9], w: 2.6, fast: 1.6, o: [0, 0], alive: [{ t: 'glow', T: 0.8 }], sync: [2, 0.1] });
  tx(1, 1430, 540, 'Guernica (1937)', { size: 32, anchor: 'middle', color: C.dark });
  tx(2, 100, 690, '1939–1975 · dictadura', { size: 38, color: C.dark, weight: 700, sync: [0, 0.05] });
  const tally = [];
  for (let g = 0; g < 7; g++) { const x0 = 104 + g * 72; for (let i = 0; i < 4; i++) tally.push(ln(x0 + i * 12, 712, x0 + i * 12 + 2, 758)); tally.push(ln(x0 - 6, 748, x0 + 46, 718)); }
  tally.push(ln(612, 712, 614, 758));
  el(2, { s: tally, ink: C.dark, w: 3, fast: 3.5, sync: [0, 0.4] });
  el(2, { s: sunPts(1300, 628, 30, 10), f: [{ p: ci(1300, 628, 30), c: C.yellow, o: 1 }], ink: '#b98a1d', w: 2.4, o: [1300, 628], alive: [{ t: 'spin', v: 20 }], sync: [1, 0.5] });
  const umb = pl(ci(1460, 690, 70, 180, 360), true);
  el(2, { s: [umb, ln(1460, 690, 1450, 770), wav(1100, 1560, 772, 3, 40)], f: [{ p: umb, c: '#e57b5a' }], o: [1450, 770], alive: [{ t: 'sway', a: 2, T: 3 }], sync: [1, 0.75] });
  tx(2, 1090, 726, 'años 60: turismo', { size: 32, color: C.deep });
});

/* ---------- 12 · Democracia ---------- */
scene('democracia', ({ el, tx, title }) => {
  title();
  el(0, { s: sunPts(270, 470, 60, 12, 1.25, 1.6), f: [{ p: ci(270, 470, 60), c: C.yellow, o: 1 }], ink: '#c0901c', w: 2.8, o: [270, 470], alive: [{ t: 'spin', v: 10 }, { t: 'rise', dy: 30, d: 6 }] });
  el(0, { f: [{ p: rc(80, 472, 440, 90), c: '#f7f1e3', o: 1, edge: false, shift: false }] });
  el(0, { s: [ln(80, 472, 520, 472), wav(120, 470, 500, 3, 40), wav(160, 420, 526, 3, 40)], w: 2.6 });
  const dove = sp([[-60, 10], [-30, 0], [0, -6], [30, -2], [50, -14], [62, -10], [58, 0], [40, 10], [10, 22], [-30, 24]], true);
  const wingU = sp([[-10, -4], [-20, -46], [10, -60], [24, -10]], true);
  const dv = { t: 'hover', ax: 40, ay: 12, T: 6 };
  el(0, { s: [dove, ci(46, -8, 2), pl([[62, -10], [74, -6], [60, -4]])], f: [{ p: dove, c: C.white, o: 1 }], at: [300, 300, 1.2], o: [0, 0], alive: [dv], sync: [1, 0.05] });
  el(0, { s: [wingU], f: [{ p: wingU, c: C.white, o: 1 }], at: [300, 300, 1.2], o: [0, -6], alive: [dv, { t: 'flap', a: 0.7, T: 0.6 }] });
  tx(0, 90, 620, '1975 · la Transición', { size: 42, color: C.red, weight: 700, sync: [1, 0.02] });
  tx(0, 92, 666, '1977: elecciones libres', { size: 32, sync: [1, 0.45] });
  const cover = rc(640, 230, 280, 330);
  el(1, { s: [cover, ln(660, 230, 660, 560), rc(690, 280, 200, 120)], f: [{ p: cover, c: '#b8322a', o: 0.92 }, { p: rc(690, 280, 200, 120), c: C.cream, o: 1 }], o: [780, 560], alive: [{ t: 'bob', a: 3, T: 3 }] });
  tx(1, 790, 330, 'CONSTITUCIÓN', { size: 30, anchor: 'middle', weight: 700, ls: 1, alive: [{ t: 'bob', a: 3, T: 3 }], o: [780, 560] });
  tx(1, 790, 380, '1978', { size: 44, anchor: 'middle', weight: 700, color: C.red, alive: [{ t: 'bob', a: 3, T: 3 }], o: [780, 560] });
  tx(1, 600, 620, '23-F (1981): la democracia resiste', { size: 32, sync: [1, 0.3] });
  const flagR = rc(1080, 220, 300, 200);
  el(2, { s: [flagR], f: [{ p: flagR, c: C.blue, o: 0.95 }], sync: [0, 0.1] });
  for (let i = 0; i < 12; i++) { const a = i * 30 * D, x = 1230 + Math.cos(a) * 66, y = 320 + Math.sin(a) * 66; el(2, { s: [star(x, y, 12, 5)], f: [{ p: star(x, y, 12, 5), c: C.yellow, o: 1, shift: false }], ink: '#c9a227', w: 1.4, fast: 4, o: [x, y], alive: [{ t: 'pulse', a: 0.18, T: 2, ph: i * 0.52 }] }); }
  tx(2, 1230, 470, '1986 · Comunidad Europea', { size: 32, anchor: 'middle' });
  [[1120, 600, 0, C.red], [1300, 560, 0.6, C.gold], [1470, 610, 1.2, C.teal]].forEach(([x, y, ph, c]) => {
    const rays = []; for (let i = 0; i < 12; i++) { const a = i * 30 * D; rays.push(ln(x + Math.cos(a) * 14, y + Math.sin(a) * 14, x + Math.cos(a) * 64, y + Math.sin(a) * 64)); rays.push(ci(x + Math.cos(a + 0.26) * 74, y + Math.sin(a + 0.26) * 74, 2.5)); }
    el(2, { s: rays, ink: c, w: 3, fast: 3, o: [x, y], alive: [{ t: 'burst', T: 1.8, ph }], sync: [1, 0.1] });
  });
  tx(2, 1290, 706, '1992 · Barcelona y Sevilla', { size: 36, anchor: 'middle', weight: 700, color: C.red });
  el(3, { s: [ci(150, 728, 42), ci(150, 728, 32)], f: [{ p: ci(150, 728, 42), c: C.gold }, { p: ci(150, 728, 32), c: '#cfc9bb', o: 1 }], o: [150, 728], alive: [{ t: 'spinx', T: 4 }] });
  tx(3, 150, 744, '€', { size: 44, anchor: 'middle', weight: 700, o: [150, 728], alive: [{ t: 'spinx', T: 4 }] });
  tx(3, 212, 742, '2002 · euro   ·   2014 · Felipe VI', { size: 34, sync: [0, 0.5] });
});

/* ---------- 13 · Hoy ---------- */
scene('hoy', ({ el, tx, title }) => {
  title();
  const P = proj({ x: 470, y: 196, k: 48 });
  const es = shp(SPAIN, P), pt = shp(PORTUGAL, P), isl = [shp(MALLORCA, P), shp(MENORCA, P), shp(IBIZA, P)];
  el(0, { s: [pt], f: [{ p: pt, c: '#e7e2d6', o: 0.8 }], w: 2.4, ink: C.muted, fast: 1.5 });
  el(0, { s: [es], f: [{ p: es, c: '#f0d9a6', o: 0.95 }], w: 3.6 });
  el(0, { s: isl, f: isl.map(p => ({ p, c: '#e6b98f', o: 0.95 })), w: 2.4, fast: 1.5 });
  const reg = (arr, c) => el(0, { f: [{ p: sp(arr.map(P), true, 4), c, o: 0.6, edge: false }], clip: es });
  reg([[-9.9, 44.2], [-6.8, 44.2], [-6.8, 43.0], [-7.0, 42.5], [-6.8, 42.0], [-7.2, 41.6], [-9.9, 41.6]], '#8fbfa8');
  tx(0, P([-8.0, 42.7])[0], P([-8.0, 42.7])[1], 'galego', { size: 30, weight: 700, color: '#2f6b55', anchor: 'middle', sync: [0, 0.45] });
  reg([[-3.45, 43.6], [-1.2, 43.6], [-1.0, 42.8], [-1.8, 42.5], [-2.8, 42.6], [-3.3, 43.1]], '#9fb86a');
  tx(0, P([-2.4, 43.05])[0], P([-2.4, 43.05])[1], 'euskara', { size: 28, weight: 700, color: '#4d6a1c', anchor: 'middle' });
  reg([[0.65, 43.0], [3.6, 43.0], [3.6, 37.8], [-0.9, 37.8], [-0.9, 38.9], [-0.6, 39.6], [-0.4, 40.3], [0.15, 40.75], [0.35, 41.3], [0.3, 42.0]], '#e0a86f');
  tx(0, P([1.4, 41.75])[0], P([1.4, 41.75])[1], 'català', { size: 30, weight: 700, color: '#8a4d17', anchor: 'middle' });
  tx(0, P([-3.9, 40.0])[0], P([-3.9, 40.0])[1], 'castellano', { size: 36, weight: 700, color: '#8a5a12', anchor: 'middle', sync: [0, 0.35] });
  const cf = rc(130, 590, 250, 120);
  el(0, { s: [cf], w: 2.2, ink: C.muted, fast: 2 });
  const can = [[-18.0, 27.75, 6], [-17.85, 28.65, 7], [-17.2, 28.1, 6], [-16.6, 28.25, 12], [-15.6, 27.95, 11], [-14.0, 28.4, 14], [-13.6, 29.0, 10]];
  const cs = can.map(([lo, la, r]) => ell(150 + (lo + 18.3) * 42, 600 + (29.4 - la) * 50, r, r * 0.6, 0, 360));
  el(0, { s: cs, f: cs.map(p => ({ p, c: '#f0d9a6', o: 1 })), w: 2, fast: 3 });
  tx(0, 255, 740, 'Canarias', { size: 26, anchor: 'middle', color: C.muted });
  // cada época dejó su trazo
  const ic = [[amphora(), [1250, 290, 0.55], 0.02], [aqIcon(), [1430, 300, 0.7], 0.12], [crown(), [1250, 470, 0.8], 0.25], [horseshoe(), [1430, 470, 0.85], 0.4], [castle(), [1250, 640, 0.42], 0.55], [caravel(), [1430, 650, 0.7], 0.7]];
  ic.forEach(([spec, at, f], i) => el(1, { ...spec, at, fast: 2.2, o: spec.o || [0, 0], alive: [{ t: 'bob', a: 3, T: 2.6 + i * 0.3, ph: i }], sync: [0, f] }));
  tx(2, 1110, 770, 'continuará…', { size: 76, color: C.red, weight: 700, rot: -4, sync: [1, 0.1] });
});

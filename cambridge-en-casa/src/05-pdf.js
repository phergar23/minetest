<script>
/* =========================================================
   PDF engine (jsPDF, Helvetica — the typeface of exam papers)
   ========================================================= */
const PC = {
  ink: [26, 31, 43], grey: [105, 111, 124], light: [196, 200, 208], omr: [184, 51, 106], omrSoft: [251, 236, 242],
  ok: [24, 120, 78], bad: [184, 58, 36], fill: [244, 245, 248], pencil: [70, 74, 84]
};

function pdfSafe(s) {
  return String(s ?? '')
    .replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"')
    .replace(/[–—−]/g, '-').replace(/…/g, '...').replace(/•/g, '-').replace(/ /g, ' ')
    .replace(/→/g, '->').replace(/\t/g, ' ')
    .replace(/[^\x00-\xFF]/g, '');
}
const styleOf = s => (s.b && s.i ? 'bolditalic' : s.b ? 'bold' : s.i ? 'italic' : 'normal');

class Pdf {
  constructor(meta) {
    const { jsPDF } = window.jspdf;
    this.d = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    this.W = 210; this.H = 297; this.ML = 18; this.MR = 18; this.MT = 21; this.MB = 17;
    this.CW = this.W - this.ML - this.MR;
    this.meta = meta; this.y = this.MT;
    this.d.setProperties({ title: pdfSafe(meta.title || 'Cambridge en Casa'), creator: 'Cambridge en Casa' });
    this.head();
  }
  set(style = 'normal', size = 10.5, color = PC.ink) { this.d.setFont('helvetica', style); this.d.setFontSize(size); this.d.setTextColor(...color); }
  lh(size) { return size * 0.3528 * 1.4; }
  head() {
    const d = this.d;
    this.set('bold', 8, PC.omr); d.text(pdfSafe(this.meta.left || ''), this.ML, 11.5);
    this.set('normal', 8, PC.grey); d.text(pdfSafe(this.meta.right || ''), this.W - this.MR, 11.5, { align: 'right' });
    d.setDrawColor(...PC.omr); d.setLineWidth(0.35); d.line(this.ML, 13.6, this.W - this.MR, 13.6);
    this.y = this.MT;
  }
  page() { this.d.addPage(); this.head(); }
  need(h) { if (this.y + h > this.H - this.MB) { this.page(); return true; } return false; }
  sp(mm) { this.y += mm; }
  blob() {
    const n = this.d.getNumberOfPages();
    for (let i = 1; i <= n; i++) { this.d.setPage(i); this.set('normal', 7.5, PC.grey); this.d.text(`${i} / ${n}`, this.W / 2, this.H - 8, { align: 'center' }); }
    return this.d.output('blob');
  }

  /* Rich text: segments [{t, b, i, color, strike, size}] or gap tokens {gapW, stem} */
  layout(segs, o = {}) {
    const d = this.d, size = o.size || 10.5, x0 = o.x ?? this.ML, width = o.width ?? (this.CW - (x0 - this.ML));
    const lh = this.lh(size) * (o.lh || 1);
    const toks = [];
    for (const s of segs) {
      if (!s) continue;
      if (s.gapW) { toks.push({ gapW: s.gapW, s }); continue; }
      const parts = pdfSafe(s.t).split(/(\s+)/);
      for (const p of parts) {
        if (!p) continue;
        if (/^\s+$/.test(p)) { const nl = (p.match(/\n/g) || []).length; toks.push(nl ? { br: nl } : { sp: true }); }
        else toks.push({ w: p, s });
      }
    }
    this.set('normal', size); const SPW = d.getTextWidth(' ');
    const lines = []; let line = [], lw = 0, pend = false;
    const push = () => { lines.push({ items: line, gapAfter: 0 }); line = []; lw = 0; pend = false; };
    for (const t of toks) {
      if (t.sp) { pend = line.length > 0; continue; }
      if (t.br) { if (line.length) push(); else if (!lines.length) continue; if (t.br > 1 && lines.length) lines[lines.length - 1].gapAfter = lh * 0.5; continue; }
      let w;
      if (t.gapW) w = t.gapW; else { this.set(styleOf(t.s), t.s.size || size); w = d.getTextWidth(t.w); }
      const add = (pend ? SPW : 0) + w;
      if (lw + add > width && line.length) { push(); line.push({ ...t, x: 0, width: w }); lw = w; continue; }
      line.push({ ...t, x: lw + (pend ? SPW : 0), width: w }); lw += add; pend = false;
    }
    if (line.length) push();
    return { lines, lh, size, x0 };
  }
  height(segs, o = {}) { const L = this.layout(segs, o); return L.lines.reduce((t, l) => t + L.lh + l.gapAfter, 0); }
  rich(segs, o = {}) {
    const d = this.d, L = this.layout(segs, o), { lh, size, x0 } = L;
    for (const ln of L.lines) {
      this.need(lh);
      const base = this.y + size * 0.3528 * 0.8;
      for (const it of ln.items) {
        const s = it.s, col = s.color || o.color || PC.ink;
        if (it.gapW) { d.setDrawColor(...PC.ink); d.setLineWidth(0.3); d.line(x0 + it.x, base + 0.9, x0 + it.x + it.gapW, base + 0.9); continue; }
        this.set(styleOf(s), s.size || size, col);
        d.text(it.w, x0 + it.x, base);
        if (s.strike) { d.setDrawColor(...col); d.setLineWidth(0.3); const yy = base - size * 0.3528 * 0.3; d.line(x0 + it.x, yy, x0 + it.x + it.width, yy); }
      }
      if (o.onLine) o.onLine(ln.items, base);
      this.y += lh + ln.gapAfter;
    }
  }
  text(t, o = {}) { this.rich([{ t, b: o.b, i: o.i, color: o.color }], o); }

  title(t, sub) {
    this.need(18);
    this.rich([{ t, b: true }], { size: 17 });
    if (sub) { this.sp(0.5); this.rich([{ t: sub, color: PC.grey }], { size: 10 }); }
    this.sp(3);
  }
  partHead(label, right) {
    this.need(22); this.sp(2);
    const d = this.d, y = this.y;
    d.setFillColor(...PC.ink); d.roundedRect(this.ML, y, 22, 7.2, 1.2, 1.2, 'F');
    this.set('bold', 10.5, [255, 255, 255]); d.text(pdfSafe(label), this.ML + 11, y + 5, { align: 'center' });
    if (right) { this.set('normal', 8.5, PC.grey); d.text(pdfSafe(right), this.W - this.MR, y + 4.8, { align: 'right' }); }
    this.y = y + 10;
  }
  h3(t, color = PC.ink) { this.need(12); this.sp(1.5); this.rich([{ t, b: true, color }], { size: 12 }); this.sp(1); }
  small(t, o = {}) { this.rich([{ t, color: o.color || PC.grey, i: o.i }], { size: o.size || 9, x: o.x }); }
  box(segsOrText, o = {}) {
    const segs = typeof segsOrText === 'string' ? [{ t: segsOrText }] : segsOrText;
    const pad = 3, size = o.size || 9.5, x = this.ML + pad, width = this.CW - 2 * pad;
    const h = this.height(segs, { size, x, width }) + 2 * pad - 1;
    this.need(h + 2);
    const d = this.d;
    d.setFillColor(...(o.fill || PC.omrSoft)); d.setDrawColor(...(o.stroke || o.fill || PC.omrSoft));
    d.roundedRect(this.ML, this.y, this.CW, h, 2, 2, o.stroke ? 'FD' : 'F');
    this.y += pad;
    this.rich(segs, { size, x, width });
    this.y += pad + 1;
  }
  rule(color = PC.light) { this.need(4); this.d.setDrawColor(...color); this.d.setLineWidth(0.25); this.d.line(this.ML, this.y + 1, this.W - this.MR, this.y + 1); this.sp(3); }
  lozenge(x, y, L, filled, color = PC.omr) {
    const d = this.d, w = 8, h = 4.4;
    d.setLineWidth(0.3); d.setDrawColor(...color);
    if (filled) { d.setFillColor(...PC.pencil); d.roundedRect(x, y, w, h, 2.2, 2.2, 'FD'); this.set('bold', 6.8, [255, 255, 255]); }
    else { d.roundedRect(x, y, w, h, 2.2, 2.2, 'S'); this.set('bold', 6.8, color); }
    d.text(L, x + w / 2, y + 3.15, { align: 'center' });
  }
  boxes(x, y, n, bw = 4.7, bh = 6.2) {
    const d = this.d; d.setDrawColor(...PC.omr); d.setLineWidth(0.25);
    for (let i = 0; i < n; i++) d.rect(x + i * bw, y, bw, bh);
  }
}

/* ---------- helpers for exam content ---------- */
function gapSplit(text, fn) {
  const segs = []; let last = 0;
  String(text || '').replace(/\[\[(\d+)\]\]/g, (m, k, off) => { segs.push({ t: text.slice(last, off) }); segs.push(...fn(+k)); last = off + m.length; return m; });
  segs.push({ t: String(text || '').slice(last) });
  return segs;
}
function scriptLines(script) {
  if (!script) return [];
  if (typeof script === 'string') return [{ speaker: '', text: script }];
  if (Array.isArray(script)) return script.map(l => (typeof l === 'string' ? { speaker: '', text: l } : { speaker: str(l.speaker), gender: l.gender, text: str(l.text) }));
  return [];
}

/* mode: {corr: bool, sess, marks, answers, errors} */
function markOf(mode, pid, n) { return mode && mode.corr ? (mode.marks[`${pid}:${n}`] || { status: 'blank', points: 0 }) : null; }
function givenOf(mode, pid, n) { return mode && mode.corr ? String(mode.answers[`${pid}:${n}`] || '').trim() : ''; }

function corrGapSegs(mode, pid, n, keyShown, givenShown) {
  const m = markOf(mode, pid, n);
  if (m.status === 'correct') return [{ t: `(${n}) `, b: true, color: PC.ok }, { t: givenShown || keyShown, b: true, color: PC.ok }];
  const out = [{ t: `(${n}) `, b: true, color: PC.bad }];
  if (givenShown) out.push({ t: givenShown, strike: true, color: PC.bad }); else out.push({ t: '(en blanco)', i: true, color: PC.bad });
  out.push({ t: ' ' }, { t: keyShown, b: true, color: PC.ok });
  return out;
}

function optGrid(pdf, n, options, letters, o = {}) {
  const d = pdf.d, size = 10, labelW = 9, colsW = pdf.CW - labelW;
  pdf.set('normal', size);
  const widths = letters.map(L => d.getTextWidth(pdfSafe(options[L] || '')) + 8);
  let cols = 4; if (widths.some(w => w > colsW / 4)) cols = 2; if (widths.some(w => w > colsW / 2)) cols = 1;
  if (cols === 1) return mcqBlock(pdf, n, '', options, letters, o);
  const rows = Math.ceil(letters.length / cols), rowH = pdf.lh(size) + 1;
  pdf.need(rows * rowH + 1);
  const base0 = pdf.y + size * 0.3528 * 0.8;
  pdf.set('bold', size, o.key ? (o.given === o.key ? PC.ok : PC.bad) : PC.ink); d.text(String(n), pdf.ML, base0);
  letters.forEach((L, i) => {
    const r = Math.floor(i / cols), c = i % cols, x = pdf.ML + labelW + c * (colsW / cols), y = base0 + r * rowH;
    let col = PC.ink, strike = false, bold = false;
    if (o.key) { if (L === o.key) { col = PC.ok; bold = true; } else if (L === o.given) { col = PC.bad; strike = true; } else col = PC.grey; }
    pdf.set('bold', size, col); d.text(L, x, y);
    const t = pdfSafe(options[L] || '');
    pdf.set(bold ? 'bold' : 'normal', size, col); d.text(t, x + 5, y);
    if (strike) { d.setDrawColor(...col); d.setLineWidth(0.3); d.line(x + 5, y - 1.1, x + 5 + d.getTextWidth(t), y - 1.1); }
  });
  pdf.y += rows * rowH + 1.2;
}

function mcqBlock(pdf, n, stem, options, letters, o = {}) {
  const d = pdf.d, size = 10.5, xs = pdf.ML + 8, xo = pdf.ML + 15;
  const stemSegs = Array.isArray(stem) ? stem : [{ t: stem }];
  const hStem = stem ? pdf.height(stemSegs, { x: xs, size }) : 0;
  const hOpts = letters.reduce((t, L) => t + pdf.height([{ t: options[L] || '' }], { x: xo, size }), 0);
  pdf.need(Math.min(hStem + hOpts + 3, 110));
  const nCol = o.key ? (o.given === o.key ? PC.ok : PC.bad) : PC.ink;
  pdf.need(pdf.lh(size));
  pdf.set('bold', size, nCol); d.text(String(n), pdf.ML, pdf.y + size * 0.3528 * 0.8);
  if (stem) pdf.rich(stemSegs, { x: xs, size });
  for (const L of letters) {
    let col = PC.ink, strike = false, bold = false;
    if (o.key) { if (L === o.key) { col = PC.ok; bold = true; } else if (L === o.given) { col = PC.bad; strike = true; } else col = PC.grey; }
    pdf.need(pdf.lh(size));
    pdf.set('bold', size, col); d.text(L, xs, pdf.y + size * 0.3528 * 0.8);
    pdf.rich([{ t: options[L] || '', color: col, b: bold, strike }], { x: xo, size });
  }
  pdf.sp(2.2);
}

function numBoxRow(pdf, stemSegs, n, o = {}) {
  // statement on the left, numbered answer box on the right (matching tasks)
  const d = pdf.d, size = 10.5, boxW = o.corr ? 26 : 16, width = pdf.CW - boxW - 12;
  const h = pdf.height(stemSegs, { size, width });
  pdf.need(Math.max(h, 7) + 1.5);
  const y0 = pdf.y;
  pdf.rich(stemSegs, { size, width });
  const bx = pdf.W - pdf.MR - boxW, by = y0 - 0.4;
  pdf.set('bold', 9.5, PC.ink); d.text(String(n), bx - 2, by + 4.3, { align: 'right' });
  d.setDrawColor(...PC.ink); d.setLineWidth(0.3); d.rect(bx, by, boxW, 6);
  if (o.corr) {
    const m = o.mark;
    if (m.status === 'correct') { pdf.set('bold', 10, PC.ok); d.text(o.key, bx + boxW / 2, by + 4.3, { align: 'center' }); }
    else {
      pdf.set('normal', 10, PC.bad); const g = o.given || '-'; d.text(g, bx + 5, by + 4.3, { align: 'center' });
      d.setDrawColor(...PC.bad); d.line(bx + 3, by + 3, bx + 7, by + 3);
      pdf.set('bold', 10, PC.ok); d.text(o.key, bx + boxW - 7, by + 4.3, { align: 'center' });
    }
  }
  pdf.y = Math.max(pdf.y, y0 + 7) + 1;
}

/* ---------- render one part (exam paper or corrected copy) ---------- */
function renderPart(pdf, sess, part, mode) {
  const ex = EXAMS[sess.level], P = ex.parts[part.id], L = plainLetters(P), corr = !!(mode && mode.corr);
  const a = P.first, b = P.first + P.count - 1;
  let right = `${P.paper} · ${P.title}`;
  if (corr && mode.results?.byPart?.[part.id]) { const bp = mode.results.byPart[part.id]; right += `   ·   ${bp.score}/${bp.max}`; }
  pdf.partHead(P.label, right);
  if (part.intro && !['l-extracts'].includes(P.kind)) pdf.rich([{ t: part.intro, b: true }], { size: 10.5 });
  pdf.rich([{ t: fill(P.ins, P) }], { size: 10.5 });
  pdf.sp(2.5);
  const qBy = n => part.questions.find(q => q.n === n);
  const exGap = () => {
    const e = part.example || {};
    if (P.kind === 'mcq-cloze') return [{ t: '(0) ', b: true }, { gapW: 20 }];
    return [{ t: '(0) ', b: true }, { t: str(e.answer).toUpperCase(), b: true }];
  };

  switch (P.kind) {
    case 'mcq-cloze': case 'open-cloze': case 'word-formation': {
      if (P.example && part.example && P.kind === 'mcq-cloze') {
        pdf.rich([{ t: 'Example:', b: true }], { size: 10 });
        optGrid(pdf, 0, part.example.options || {}, L, {});
        const y = pdf.y; pdf.set('bold', 9, PC.ink); pdf.d.text('0', pdf.ML, y + 3.2);
        L.forEach((l, i) => pdf.lozenge(pdf.ML + 9 + i * 10, y, l, l === str(part.example.answer).toUpperCase(), PC.grey));
        pdf.y = y + 8;
      } else if (P.example && part.example && P.kind === 'open-cloze') {
        pdf.rich([{ t: 'Example: ', b: true }, { t: '(0) ' }, { t: str(part.example.answer).toUpperCase(), b: true }], { size: 10 }); pdf.sp(2);
      } else if (P.example && part.example && P.kind === 'word-formation') {
        pdf.rich([{ t: 'Example: ', b: true }, { t: '(0) ' }, { t: str(part.example.answer).toUpperCase(), b: true }], { size: 10 }); pdf.sp(2);
      }
      if (part.title) { pdf.need(12); pdf.rich([{ t: part.title, b: true }], { size: 12 }); pdf.sp(1.5); }
      const wf = P.kind === 'word-formation';
      const segs = gapSplit(part.text, n => {
        if (n === 0) return wf ? [...exGap(), { gapW: 0.01, stem: part.example?.stem }] : exGap();
        const q = qBy(n); if (!q) return [{ t: `(${n})` }];
        if (corr) {
          const g = givenOf(mode, part.id, n);
          const key = P.letters ? `${q.answer} ${q.options?.[q.answer] || ''}`.trim() : String(q.answer).toUpperCase();
          const gv = P.letters ? (g ? `${g} ${q.options?.[g] || ''}`.trim() : '') : g.toUpperCase();
          const s = corrGapSegs(mode, part.id, n, key, gv);
          if (wf) s.push({ gapW: 0.01, stem: q.stem });
          return s;
        }
        return wf ? [{ t: `(${n})`, b: true }, { t: ' ' }, { gapW: 24, stem: q.stem }] : [{ t: `(${n})`, b: true }, { t: ' ' }, { gapW: 22 }];
      });
      const opts = wf ? {
        width: pdf.CW - 36, lh: 1.25,
        onLine: (items, base) => {
          const stems = items.filter(i => i.s && i.s.stem).map(i => i.s.stem);
          if (stems.length) { pdf.set('bold', 10.5, PC.ink); pdf.d.text(pdfSafe(stems.join(' / ').toUpperCase()), pdf.W - pdf.MR, base, { align: 'right' }); }
        }
      } : { lh: 1.25 };
      pdf.rich(segs, opts);
      pdf.sp(3);
      if (P.kind === 'mcq-cloze') for (const q of part.questions) {
        optGrid(pdf, q.n, q.options || {}, L, corr ? { key: q.answer, given: givenOf(mode, part.id, q.n) } : {});
      }
      break;
    }
    case 'transformation': {
      const e = part.example;
      const item = (n, q, isEx) => {
        const h = pdf.lh(10.5) * 4 + 6; pdf.need(h);
        const y0 = pdf.y;
        pdf.set('bold', 10.5, isEx ? PC.grey : PC.ink); pdf.d.text(isEx ? '0' : String(n), pdf.ML, y0 + 3.7);
        pdf.rich([{ t: q.first }], { x: pdf.ML + 9 });
        pdf.sp(0.8);
        pdf.rich([{ t: str(q.keyword).toUpperCase(), b: true }], { x: pdf.ML + 20 });
        pdf.sp(0.8);
        let segs;
        const parts = str(q.second).split(/_{2,}/);
        if (isEx) segs = [{ t: parts[0] }, { t: ' ' + str(q.answer).toUpperCase() + ' ', b: true, i: true }, { t: parts.slice(1).join(' ') }];
        else if (corr) {
          const m = markOf(mode, part.id, n), g = givenOf(mode, part.id, n).toUpperCase();
          const mid = m.status === 'correct'
            ? [{ t: ' ' + g + ' ', b: true, color: PC.ok }]
            : [{ t: ' ' }, g ? { t: g, strike: true, color: PC.bad } : { t: '(en blanco)', i: true, color: PC.bad }, { t: ' ' }, { t: str(q.answer).toUpperCase(), b: true, color: PC.ok }, { t: ` [${m.points}/2] `, b: true, color: m.points ? PC.omr : PC.bad }];
          segs = [{ t: parts[0] }, ...mid, { t: parts.slice(1).join(' ') }];
        } else segs = [{ t: parts[0] }, { t: ' ' }, { gapW: 48 }, { t: ' ' }, { t: parts.slice(1).join(' ') }];
        pdf.rich(segs, { x: pdf.ML + 9 });
        pdf.sp(4);
      };
      if (e && e.first) { pdf.rich([{ t: 'Example:', b: true }], { size: 10 }); pdf.sp(1); item(0, e, true); pdf.rule(); }
      for (const q of part.questions) item(q.n, q, false);
      break;
    }
    case 'reading-mc': {
      if (part.title) { pdf.need(12); pdf.rich([{ t: part.title, b: true }], { size: 12.5 }); pdf.sp(1.5); }
      pdf.rich([{ t: part.text }], { size: 10.5, lh: 1.08 });
      pdf.sp(4);
      for (const q of part.questions) mcqBlock(pdf, q.n, q.stem, q.options || {}, L, corr ? { key: q.answer, given: givenOf(mode, part.id, q.n) } : {});
      break;
    }
    case 'gapped': {
      if (part.title) { pdf.need(12); pdf.rich([{ t: part.title, b: true }], { size: 12.5 }); pdf.sp(1.5); }
      const segs = gapSplit(part.text, n => {
        const q = qBy(n); if (!q) return [{ t: `(${n})` }];
        if (corr) {
          const m = markOf(mode, part.id, n), g = givenOf(mode, part.id, n), sent = part.options?.[q.answer] || '';
          if (m.status === 'correct') return [{ t: `(${n}) ${q.answer}: `, b: true, color: PC.ok }, { t: sent, i: true, color: PC.ok }];
          return [{ t: `(${n}) `, b: true, color: PC.bad }, g ? { t: g, strike: true, color: PC.bad } : { t: '(en blanco)', i: true, color: PC.bad }, { t: ` ${q.answer}: `, b: true, color: PC.ok }, { t: sent, i: true, color: PC.ok }];
        }
        return [{ t: `(${n})`, b: true }, { t: ' ' }, { gapW: 36 }];
      });
      pdf.rich(segs, { size: 10.5, lh: 1.12 });
      pdf.sp(4);
      pdf.need(20);
      for (const l of L) {
        const sent = part.options?.[l] || '';
        const used = corr && part.questions.some(q => q.answer === l);
        pdf.need(pdf.lh(10.5));
        pdf.set('bold', 10.5, corr && !used ? PC.grey : PC.ink); pdf.d.text(l, pdf.ML, pdf.y + 3.7);
        pdf.rich([{ t: sent, color: corr && !used ? PC.grey : PC.ink }], { x: pdf.ML + 8 });
        pdf.sp(1.5);
      }
      if (corr) pdf.small('En gris: la frase que sobraba.');
      break;
    }
    case 'matching': {
      pdf.rich([{ t: 'Which person', b: true }], { size: 10.5 }); pdf.sp(1.5);
      for (const q of part.questions) {
        const g = givenOf(mode, part.id, q.n);
        numBoxRow(pdf, [{ t: q.stem }], q.n, corr ? { corr, mark: markOf(mode, part.id, q.n), key: q.answer, given: g } : {});
      }
      pdf.sp(4);
      if (part.title) { pdf.need(12); pdf.rich([{ t: part.title, b: true }], { size: 12.5 }); pdf.sp(1.5); }
      for (const s of part.sections || []) {
        pdf.need(16);
        pdf.rich([{ t: `${s.id}   `, b: true, size: 12 }, { t: s.heading || '', b: true }], { size: 10.5 });
        pdf.sp(0.8);
        pdf.rich([{ t: s.text || '' }], { size: 10.5, lh: 1.05 });
        pdf.sp(3);
      }
      break;
    }
    case 'notices': {
      for (const q of part.questions) {
        const pad = 3, bx = pdf.ML + 9, bw = 88;
        const segs = [{ t: (q.textType ? q.textType + '\n' : ''), b: true, size: 8.5, color: PC.grey }, { t: q.text || '' }];
        const hBox = pdf.height(segs, { x: bx + pad, width: bw - 2 * pad, size: 10 }) + 2 * pad;
        const hOpt = L.reduce((t, l) => t + pdf.height([{ t: q.options?.[l] || '' }], { x: bx + bw + 12, size: 10 }), 0);
        pdf.need(Math.max(hBox, hOpt) + 5);
        const y0 = pdf.y;
        pdf.set('bold', 10.5, corr ? (markOf(mode, part.id, q.n).status === 'correct' ? PC.ok : PC.bad) : PC.ink); pdf.d.text(String(q.n), pdf.ML, y0 + 4);
        pdf.d.setDrawColor(...PC.ink); pdf.d.setLineWidth(0.35); pdf.d.roundedRect(bx, y0, bw, hBox, 1.5, 1.5, 'S');
        pdf.y = y0 + pad; pdf.rich(segs, { x: bx + pad, width: bw - 2 * pad, size: 10 });
        const yEndBox = y0 + hBox;
        pdf.y = y0;
        const g = givenOf(mode, part.id, q.n);
        for (const l of L) {
          let col = PC.ink, strike = false, bold = false;
          if (corr) { if (l === q.answer) { col = PC.ok; bold = true; } else if (l === g) { col = PC.bad; strike = true; } else col = PC.grey; }
          pdf.set('bold', 10, col); pdf.d.text(l, bx + bw + 6, pdf.y + 3.5);
          pdf.rich([{ t: q.options?.[l] || '', color: col, b: bold, strike }], { x: bx + bw + 12, size: 10 });
          pdf.sp(1);
        }
        pdf.y = Math.max(pdf.y, yEndBox) + 5;
      }
      break;
    }
    case 'people-match': {
      if (part.intro) { /* intro already printed */ }
      for (const q of part.questions) {
        const g = givenOf(mode, part.id, q.n);
        numBoxRow(pdf, [{ t: (q.name || '') + '  ', b: true }, { t: q.text || '' }], q.n, corr ? { corr, mark: markOf(mode, part.id, q.n), key: q.answer, given: g } : {});
        pdf.sp(1);
      }
      pdf.sp(3);
      if (part.title) { pdf.need(12); pdf.rich([{ t: part.title, b: true }], { size: 12.5 }); pdf.sp(1.5); }
      for (const s of part.sections || []) {
        pdf.need(16);
        pdf.rich([{ t: `${s.id}   `, b: true, size: 12 }, { t: s.heading || '', b: true }], { size: 10.5 });
        pdf.sp(0.5); pdf.rich([{ t: s.text || '' }], { size: 10 }); pdf.sp(2.5);
      }
      break;
    }
    case 'l-extracts': case 'l-interview': {
      if (P.kind === 'l-interview' && part.intro) { /* printed above */ }
      for (const q of part.questions) {
        const stem = P.kind === 'l-extracts' ? [{ t: (q.context ? q.context + ' ' : ''), i: true }, { t: q.stem || '' }] : [{ t: q.stem || '' }];
        mcqBlock(pdf, q.n, stem, q.options || {}, L, corr ? { key: q.answer, given: givenOf(mode, part.id, q.n) } : {});
      }
      break;
    }
    case 'l-gap': {
      if (part.title) { pdf.rich([{ t: part.title, b: true }], { size: 12.5 }); pdf.sp(1.5); }
      for (const q of part.questions) {
        const segs = gapSplit(q.sentence || '', n => {
          if (corr) { const g = givenOf(mode, part.id, n); return corrGapSegs(mode, part.id, n, String(q.answer).toUpperCase(), g.toUpperCase()); }
          return [{ t: `(${n})`, b: true }, { t: ' ' }, { gapW: 38 }];
        });
        pdf.need(12); pdf.rich(segs, { size: 10.5 }); pdf.sp(4);
      }
      break;
    }
    case 'l-speakers': {
      for (const l of L) { pdf.need(pdf.lh(10.5)); pdf.set('bold', 10.5, PC.ink); pdf.d.text(l, pdf.ML, pdf.y + 3.7); pdf.rich([{ t: part.options?.[l] || '' }], { x: pdf.ML + 8 }); pdf.sp(1); }
      pdf.sp(3);
      for (const q of part.questions) {
        const g = givenOf(mode, part.id, q.n);
        numBoxRow(pdf, [{ t: q.speaker || '', b: true }], q.n, corr ? { corr, mark: markOf(mode, part.id, q.n), key: q.answer, given: g } : {});
        pdf.sp(1);
      }
      break;
    }
  }
  pdf.sp(3);
}

function renderTranscript(pdf, part) {
  const lines = [];
  const add = (label, script) => { if (label) lines.push({ t: label + '\n', b: true, color: PC.omr, size: 9 }); for (const l of scriptLines(script)) { if (l.speaker) lines.push({ t: l.speaker + ': ', b: true, size: 9 }); lines.push({ t: l.text + '\n', size: 9 }); } lines.push({ t: '\n' }); };
  if (part.script) {
    if (typeof part.script === 'string') add('', [{ speaker: part.speaker?.name || '', text: part.script }]);
    else add('', part.script);
  }
  for (const q of part.questions) if (q.script) add(q.speaker || `Question ${q.n}`, typeof q.script === 'string' ? [{ speaker: '', text: q.script }] : q.script);
  if (!lines.length) return;
  pdf.h3('Transcripción (audioscript)', PC.omr);
  pdf.rich(lines, { size: 9 });
  pdf.sp(3);
}

function renderQuickItems(pdf, items, prefix, mode) {
  for (const r of items) {
    const key = `${prefix}:${r.n}`, m = mode?.corr ? (mode.marks[key] || { status: 'blank' }) : null, g = mode?.corr ? String(mode.answers[key] || '') : '';
    const prompt = str(r.prompt);
    if (r.type === 'choice') {
      mcqBlock(pdf, r.n, prompt, r.options || {}, Object.keys(r.options || {}), mode?.corr ? { key: r.answer, given: g } : {});
    } else {
      pdf.need(mode?.corr ? 14 : 16);
      const y0 = pdf.y;
      pdf.set('bold', 10.5, m ? (m.status === 'correct' ? PC.ok : PC.bad) : PC.ink); pdf.d.text(r.n, pdf.ML, y0 + 3.7);
      pdf.rich([{ t: prompt }], { x: pdf.ML + 9 });
      if (m) {
        pdf.rich(m.status === 'correct'
          ? [{ t: 'Tu respuesta: ', color: PC.grey }, { t: g, b: true, color: PC.ok }]
          : [{ t: 'Tu respuesta: ', color: PC.grey }, g ? { t: g, strike: true, color: PC.bad } : { t: '(en blanco)', i: true, color: PC.bad }, { t: '   Correcta: ', color: PC.grey }, { t: r.answer, b: true, color: PC.ok }], { x: pdf.ML + 9, size: 10 });
      } else if (r.type === 'rewrite') {
        pdf.need(8); pdf.d.setDrawColor(...PC.light); pdf.d.setLineWidth(0.3); pdf.d.line(pdf.ML + 9, pdf.y + 5, pdf.W - pdf.MR, pdf.y + 5); pdf.sp(6);
      }
      pdf.sp(2.5);
    }
    if (m && m.status !== 'correct' && r.explanation) { pdf.small(r.explanation, { x: pdf.ML + 9 }); pdf.sp(1.5); }
  }
}

function renderReview(pdf, review, mode) {
  if (!review || !review.items?.length) return;
  pdf.partHead('Warm-up', 'Repaso de errores anteriores');
  pdf.sp(2);
  renderQuickItems(pdf, review.items, 'RV', mode);
  pdf.sp(3);
}

function renderGrammar(pdf, g, mode) {
  if (!g) return;
  const corr = !!(mode && mode.corr);
  let right = corr ? 'Gramática del día' : 'Gramática del día · 5 min';
  if (corr && mode.results?.grammar) right += `   ·   ${mode.results.grammar.score}/${mode.results.grammar.max}`;
  pdf.partHead('Grammar', right);
  pdf.rich([{ t: g.title || g.topic, b: true }], { size: 15 });
  if (g.title && g.topic && g.title !== g.topic) pdf.rich([{ t: g.topic, color: PC.grey, i: true }], { size: 9.5 });
  pdf.sp(2);
  if (!corr) {
    if (g.explanation) { pdf.rich([{ t: g.explanation }], { size: 10.5 }); pdf.sp(2.5); }
    if (g.forms?.length) {
      const rows = g.forms.filter(f => f.form || f.example);
      const pad = 3, colA = 62, h = rows.reduce((t, f) => t + Math.max(pdf.height([{ t: f.form, b: true }], { size: 10, width: colA - 4 }), pdf.height([{ t: f.example, i: true }], { size: 10, x: pdf.ML + pad + colA, width: pdf.CW - colA - 2 * pad })) + 1.2, 0) + 2 * pad;
      pdf.need(h + 2);
      const y0 = pdf.y; pdf.d.setFillColor(...PC.fill); pdf.d.roundedRect(pdf.ML, y0, pdf.CW, h, 2, 2, 'F');
      pdf.y = y0 + pad;
      for (const f of rows) {
        const yy = pdf.y;
        pdf.rich([{ t: f.form, b: true }], { size: 10, x: pdf.ML + pad, width: colA - 4 });
        const ya = pdf.y; pdf.y = yy;
        pdf.rich([{ t: f.example, i: true }], { size: 10, x: pdf.ML + pad + colA, width: pdf.CW - colA - 2 * pad });
        pdf.y = Math.max(pdf.y, ya) + 1.2;
      }
      pdf.y = y0 + h + 3;
    }
    if (g.examples?.length) { g.examples.forEach(e => pdf.rich([{ t: '- ' + e }], { size: 10, x: pdf.ML + 2 })); pdf.sp(2); }
    if (g.tip) { pdf.box([{ t: 'Ojo: ', b: true }, { t: g.tip }], { size: 9.8 }); pdf.sp(1); }
    pdf.h3('Practice');
    pdf.rich([{ t: g.instruction || 'Complete the sentences.', b: true }], { size: 10 });
    pdf.rich([{ t: g.onPage ? 'Escribe tus respuestas en esta hoja.' : 'Escribe tus respuestas en la hoja de respuestas (sección Grammar).', i: true, color: PC.grey }], { size: 9 });
    pdf.sp(2);
  }
  renderQuickItems(pdf, g.items || [], 'GR', mode);
  if (corr && g.tip) pdf.box([{ t: 'Recuerda: ', b: true }, { t: g.tip }], { size: 9.5 });
  pdf.sp(3);
}

function pdfMeta(sess, what) {
  const st = S.students[sess.studentId] || { name: '' };
  const ex = EXAMS[sess.level];
  return { title: `${st.name} · ${what}`, left: `${ex.name.toUpperCase()} · PRÁCTICA`, right: `${st.name} · ${niceDate(sess.dateKey)}` };
}
function fileName(sess, what) {
  const st = S.students[sess.studentId] || { name: 'alumno' };
  const sk = (SKILLS[sess.skill]?.es || sess.skill).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]+/g, '');
  return `${st.name}_${sess.dateKey}_${sk}_${what}.pdf`.replace(/\s+/g, '');
}

function buildExamPdf(sess, o = {}) {
  const st = S.students[sess.studentId] || {};
  const pdf = new Pdf(pdfMeta(sess, 'Ejercicios'));
  const ex = EXAMS[sess.level];
  if (sess.skill === 'writing') return buildWritingPdf(sess, pdf);
  if (sess.skill === 'speaking') return buildSpeakingStudentPdf(sess, pdf);
  const listening = (sess.parts || []).some(p => p.id.startsWith('L'));
  pdf.title(`${sess.theme || SKILLS[sess.skill]?.es || ''} · ${st.name}`, `${ex.name} · ${niceDate(sess.dateKey)} · ${sess.parts.map(p => ex.parts[p.id].paper.split(' ')[0] + ' ' + ex.parts[p.id].label).join(', ')}`);
  const examMin = sessionMinutes(sess.level, sess.parts.map(p => p.id));
  pdf.box([
    { t: 'Instrucciones: ', b: true },
    { t: `${sess.grammar ? `${GRAMMAR_MIN} minutos de gramática y luego ${examMin} de práctica de examen (total ${GRAMMAR_MIN + examMin})` : `tiempo recomendado ${examMin} minutos`}. Lápiz y goma, sin diccionario ni ayuda. Escribe tus respuestas en la hoja de respuestas, como en el examen real${listening ? '. Listening: escucharás cada grabación dos veces' : ''}.` }
  ], { size: 9.5 });
  pdf.sp(2);
  if (sess.grammar) renderGrammar(pdf, sess.grammar, null);
  if (sess.review) renderReview(pdf, sess.review, null);
  sess.parts.forEach((part, i) => { if (i > 0 || sess.grammar || sess.review) pdf.page(); renderPart(pdf, sess, part, null); });
  if (sess.vocab && !o.noVocab) renderVocab(pdf, sess.vocab);
  return pdf;
}

/* Topic vocabulary list (sessions built from a textbook unit) */
function renderVocab(pdf, v) {
  if (!v || !(v.groups || []).length) return;
  pdf.page();
  pdf.title(v.title || 'Vocabulario del tema', v.sub || 'Inglés · Español');
  const colA = 64, pad = 2.4;
  for (const g of v.groups) {
    pdf.need(24);
    pdf.h3(g.name, PC.omr);
    if (g.note) { pdf.small(g.note); pdf.sp(1); }
    (g.items || []).forEach((it, i) => {
      const en = Array.isArray(it) ? it[0] : it.en, es = Array.isArray(it) ? it[1] : it.es;
      const hA = pdf.height([{ t: en, b: true }], { size: 10, x: pdf.ML + pad, width: colA - 2 * pad });
      const hB = pdf.height([{ t: es }], { size: 10, x: pdf.ML + colA, width: pdf.CW - colA - pad });
      const h = Math.max(hA, hB) + 1.6;
      pdf.need(h);
      const y0 = pdf.y;
      if (i % 2 === 0) { pdf.d.setFillColor(...PC.fill); pdf.d.rect(pdf.ML, y0, pdf.CW, h, 'F'); }
      pdf.y = y0 + 0.8; pdf.rich([{ t: en, b: true }], { size: 10, x: pdf.ML + pad, width: colA - 2 * pad });
      pdf.y = y0 + 0.8; pdf.rich([{ t: es }], { size: 10, x: pdf.ML + colA, width: pdf.CW - colA - pad });
      pdf.y = y0 + h;
    });
    pdf.sp(4);
  }
}

function buildAnswerSheetPdf(sess, into) {
  const st = S.students[sess.studentId] || {};
  const ex = EXAMS[sess.level];
  const pdf = into || new Pdf(pdfMeta(sess, 'Hoja de respuestas'));
  if (into) pdf.page();
  const d = pdf.d;
  pdf.rich([{ t: 'Candidate Answer Sheet', b: true }], { size: 16 });
  pdf.rich([{ t: `${ex.name} · practice sheet (not official)`, color: PC.grey }], { size: 9.5 });
  pdf.sp(3);
  // candidate box
  const y0 = pdf.y; d.setDrawColor(...PC.omr); d.setLineWidth(0.35); d.rect(pdf.ML, y0, pdf.CW, 14);
  pdf.set('normal', 8, PC.omr); d.text('Candidate name', pdf.ML + 2, y0 + 3.6); d.text('Date', pdf.ML + 112, y0 + 3.6); d.text('Session', pdf.ML + 142, y0 + 3.6);
  pdf.set('bold', 11, PC.ink); d.text(pdfSafe(st.name || ''), pdf.ML + 2, y0 + 10.5); d.text(pdfSafe(shortDate(sess.dateKey)), pdf.ML + 112, y0 + 10.5);
  { const sk = pdfSafe(SKILLS[sess.skill]?.es || ''); pdf.set('bold', sk.length > 12 ? 9 : 11, PC.ink); d.text(sk, pdf.ML + 142, y0 + 10.5); }
  d.line(pdf.ML + 110, y0, pdf.ML + 110, y0 + 14); d.line(pdf.ML + 140, y0, pdf.ML + 140, y0 + 14);
  pdf.y = y0 + 18;
  // instructions
  const yi = pdf.y; d.setFillColor(...PC.omrSoft); d.roundedRect(pdf.ML, yi, pdf.CW, 17, 2, 2, 'F');
  pdf.set('bold', 8.5, PC.omr); d.text('Instructions', pdf.ML + 3, yi + 4.5);
  pdf.set('normal', 8.5, PC.ink);
  d.text('Use a PENCIL (B or HB). Rub out any answer you want to change with an eraser.', pdf.ML + 3, yi + 8.6);
  d.text('Mark ONE letter for each question. For written answers, write clearly in CAPITAL LETTERS.', pdf.ML + 3, yi + 12.6);
  pdf.set('normal', 8, PC.omr); d.text('Example:', pdf.ML + 139, yi + 7.6); pdf.set('bold', 8, PC.ink); d.text('0', pdf.ML + 135, yi + 12.6);
  ['A', 'B', 'C', 'D'].forEach((l, i) => pdf.lozenge(pdf.ML + 139 + i * 8.6, yi + 9.6, l, l === 'B'));
  pdf.y = yi + 21;

  const colW = pdf.CW / 2;
  const section = (title, sub, rows) => {
    // rows: [{n, kind:'loz'|'boxes'|'long', letters}]
    const twoCol = rows.every(r => r.kind !== 'long');
    const rowH = r => r.kind === 'loz' ? 7.4 : 8.6;
    const perCol = twoCol ? Math.ceil(rows.length / 2) : rows.length;
    const h = 9 + (twoCol ? Math.max(...[rows.slice(0, perCol), rows.slice(perCol)].map(c => c.reduce((t, r) => t + rowH(r), 0))) : rows.reduce((t, r) => t + rowH(r), 0));
    pdf.need(Math.min(h, 240));
    const top = pdf.y;
    d.setFillColor(...PC.omr); d.rect(pdf.ML, top, pdf.CW, 6.2, 'F');
    pdf.set('bold', 9.5, [255, 255, 255]); d.text(pdfSafe(title), pdf.ML + 2.5, top + 4.4);
    pdf.set('normal', 8, [255, 255, 255]); d.text(pdfSafe(sub), pdf.W - pdf.MR - 2.5, top + 4.4, { align: 'right' });
    let y = top + 8.8, col = 0, yCol0 = y;
    rows.forEach((r, i) => {
      if (twoCol && i === perCol) { col = 1; y = yCol0; }
      if (y + rowH(r) > pdf.H - pdf.MB) { pdf.page(); y = pdf.y; yCol0 = y; }
      const x = pdf.ML + col * colW;
      pdf.set('bold', 9.5, PC.ink); d.text(String(r.n), x + 7, y + 3.4, { align: 'right' });
      if (r.kind === 'loz') r.letters.forEach((l, k) => pdf.lozenge(x + 10 + k * 9.2, y + 0.2, l, false));
      else if (r.kind === 'boxes') pdf.boxes(x + 10, y - 1.2, 15, 4.7, 6.4);
      else { d.setDrawColor(...PC.omr); d.setLineWidth(0.3); d.rect(x + 10, y - 1.4, pdf.CW - 12, 7); }
      y += rowH(r);
      pdf.y = Math.max(pdf.y, y);
    });
    pdf.y += 3;
  };
  if (sess.grammar) {
    section('Grammar', 'Gramática del día', sess.grammar.items.map(r => r.type === 'choice' ? { n: r.n, kind: 'loz', letters: Object.keys(r.options || {}) } : { n: r.n, kind: 'long' }));
  }
  if (sess.review) {
    section('Warm-up', 'Repaso', sess.review.items.map(r => r.type === 'choice' ? { n: r.n, kind: 'loz', letters: Object.keys(r.options || {}) } : { n: r.n, kind: 'long' }));
  }
  for (const part of sess.parts || []) {
    const P = ex.parts[part.id];
    const rows = part.questions.map(q => {
      if (P.letters) return { n: q.n, kind: 'loz', letters: plainLetters(P) };
      if (P.kind === 'transformation' || P.kind === 'l-gap') return { n: q.n, kind: 'long' };
      return { n: q.n, kind: 'boxes' };
    });
    section(`${P.paper === 'Listening' ? 'Listening' : 'Reading' + (P.paper.includes('Use') ? ' & Use of English' : '')} · ${P.label}`, P.title, rows);
  }
  return pdf;
}

function buildSolutionsPdf(sess) {
  const st = S.students[sess.studentId] || {};
  const ex = EXAMS[sess.level];
  const pdf = new Pdf(pdfMeta(sess, 'Soluciones'));
  pdf.title(`Soluciones · ${sess.theme || SKILLS[sess.skill]?.es || ''}`, `Para corregir · ${st.name} · ${niceDate(sess.dateKey)}`);
  if (sess.skill === 'writing') {
    const w = sess.writing || {};
    pdf.h3('Tarea'); pdf.rich([{ t: writingTaskText(w, 0) }], { size: 10 }); pdf.sp(2);
    if (w.plan?.length) { pdf.h3('Plan sugerido'); w.plan.forEach(p => pdf.rich([{ t: '- ' + p }], { size: 10 })); pdf.sp(2); }
    if (w.model) { pdf.h3('Respuesta modelo'); pdf.rich([{ t: w.model }], { size: 10.5 }); pdf.small(`${wordCount(w.model)} palabras`); }
    if (sess.grammar) renderReviewKey(pdf, sess.grammar, 'Grammar', sess.grammar.title || 'Gramática');
    if (sess.review) renderReviewKey(pdf, sess.review);
    return pdf;
  }
  if (sess.grammar) renderReviewKey(pdf, sess.grammar, 'Grammar', sess.grammar.title || 'Gramática');
  if (sess.review) renderReviewKey(pdf, sess.review);
  for (const part of sess.parts || []) {
    const P = ex.parts[part.id];
    pdf.partHead(P.label, `${P.paper} · ${P.title}`);
    for (const q of part.questions) {
      const it = { q, part, P, type: P.letters ? 'letter' : 'text' };
      let key = keyText(it);
      if (P.kind === 'transformation' && q.chunks) key += `   (1 punto: ${q.chunks.map(c => c.toUpperCase()).join(' | ')})`;
      if (!P.letters && q.accept && q.accept.length > 1) key += `   · también: ${q.accept.filter(a => a !== normAns(q.answer)).join(', ')}`;
      pdf.need(12);
      pdf.rich([{ t: `${q.n}  `, b: true }, { t: key, b: true, color: PC.ok }], { size: 10.5 });
      if (q.explanation) pdf.small(q.explanation, { x: pdf.ML + 7 });
      pdf.sp(1.2);
    }
    if (part.id.startsWith('L')) renderTranscript(pdf, part);
    pdf.sp(2);
  }
  return pdf;
}

function renderReviewKey(pdf, review, label = 'Warm-up', sub = 'Repaso') {
  pdf.partHead(label, sub);
  for (const r of review.items) {
    const key = r.type === 'choice' ? `${r.answer} (${r.options?.[r.answer] || ''})` : r.answer;
    pdf.need(10); pdf.rich([{ t: `${r.n}  `, b: true }, { t: key, b: true, color: PC.ok }, (r.accept || []).length > 1 ? { t: `   · también: ${r.accept.filter(a => a !== normAns(r.answer)).join(', ')}`, color: PC.grey } : null].filter(Boolean), { size: 10.5 });
    if (r.explanation) pdf.small(r.explanation, { x: pdf.ML + 7 });
    pdf.sp(1);
  }
  pdf.sp(3);
}

function renderRefuerzo(pdf, fb) {
  const lessons = fb?.lessons || [], practice = fb?.practice || [];
  if (!lessons.length && !practice.length) return;
  pdf.page();
  pdf.title('Refuerzo', 'Lo que conviene afianzar antes de la próxima sesión');
  for (const l of lessons) {
    pdf.h3(str(l.title), PC.omr);
    if (l.explanation) pdf.rich([{ t: str(l.explanation) }], { size: 10.5 });
    (l.examples || []).forEach(e => pdf.rich([{ t: '- ' + str(e), i: true }], { size: 10, x: pdf.ML + 4 }));
    pdf.sp(3);
  }
  if (practice.length) {
    pdf.h3('Practica');
    practice.forEach((p, i) => {
      const n = str(p.id || 'E' + (i + 1));
      if (p.type === 'choice' && p.options) { mcqBlock(pdf, n, str(p.prompt), p.options, Object.keys(p.options), {}); }
      else {
        pdf.need(16); const y0 = pdf.y;
        pdf.set('bold', 10.5, PC.ink); pdf.d.text(n, pdf.ML, y0 + 3.7);
        pdf.rich([{ t: str(p.prompt) }], { x: pdf.ML + 9 });
        pdf.sp(1.5); pdf.need(7); pdf.d.setDrawColor(...PC.light); pdf.d.setLineWidth(0.3); pdf.d.line(pdf.ML + 9, pdf.y + 4, pdf.W - pdf.MR, pdf.y + 4); pdf.sp(8);
      }
    });
    pdf.page();
    pdf.h3('Soluciones del refuerzo');
    practice.forEach((p, i) => {
      const n = str(p.id || 'E' + (i + 1));
      const ans = p.type === 'choice' && p.options ? `${str(p.answer)} (${str(p.options[str(p.answer).toUpperCase()] || '')})` : str(p.answer);
      pdf.need(10); pdf.rich([{ t: `${n}  `, b: true }, { t: ans, b: true, color: PC.ok }], { size: 10.5 });
      if (p.explanation) pdf.small(str(p.explanation), { x: pdf.ML + 9 });
      pdf.sp(1);
    });
  }
}

function buildCorrectionPdf(sess) {
  if (sess.skill === 'writing') return buildWritingCorrectionPdf(sess);
  if (sess.skill === 'speaking') return buildSpeakingCorrectionPdf(sess);
  const st = S.students[sess.studentId] || {};
  const ex = EXAMS[sess.level];
  const r = sess.results || {}, fb = sess.feedback || {};
  const pdf = new Pdf(pdfMeta(sess, 'Corrección'));
  pdf.title(`Corrección · ${SKILLS[sess.skill]?.es || ''}`, `${st.name} · ${niceDate(sess.dateKey)}`);
  // score strip
  const y0 = pdf.y, d = pdf.d;
  d.setFillColor(...PC.fill); d.roundedRect(pdf.ML, y0, pdf.CW, 20, 2, 2, 'F');
  pdf.set('bold', 22, PC.ink); d.text(`${r.score}/${r.max}`, pdf.ML + 5, y0 + 12.5);
  pdf.set('bold', 11, r.pct >= 60 ? PC.ok : PC.bad); d.text(`${r.pct}%`, pdf.ML + 5, y0 + 17.5);
  let x = pdf.ML + 48;
  for (const [pid, b] of Object.entries(r.byPart || {})) {
    const P = ex.parts[pid];
    pdf.set('normal', 8, PC.grey); d.text(pdfSafe(`${P.paper === 'Listening' ? 'List.' : 'Read.'} ${P.label}`), x, y0 + 7);
    pdf.set('bold', 12, PC.ink); d.text(`${b.score}/${b.max}`, x, y0 + 13.5);
    x += 30; if (x > pdf.W - pdf.MR - 20) break;
  }
  if (r.grammar) { pdf.set('normal', 8, PC.grey); d.text('Grammar', Math.min(x, pdf.W - pdf.MR - 22), y0 + 7); pdf.set('bold', 12, PC.ink); d.text(`${r.grammar.score}/${r.grammar.max}`, Math.min(x, pdf.W - pdf.MR - 22), y0 + 13.5); x += 30; }
  if (r.review) { pdf.set('normal', 8, PC.grey); d.text('Warm-up', Math.min(x, pdf.W - pdf.MR - 22), y0 + 7); pdf.set('bold', 12, PC.ink); d.text(`${r.review.score}/${r.review.max}`, Math.min(x, pdf.W - pdf.MR - 22), y0 + 13.5); }
  pdf.y = y0 + 24;
  if (fb.summary) { pdf.box([{ t: 'Comentario: ', b: true }, { t: fb.summary }], { size: 10 }); pdf.sp(2); }
  pdf.rich([{ t: 'Cómo leer esta corrección: ', b: true, color: PC.grey }, { t: 'en verde lo correcto; en rojo tachado tu respuesta cuando no era correcta, seguida de la buena.', color: PC.grey }], { size: 9 });
  pdf.sp(2);
  const mode = { corr: true, marks: r.marks || {}, answers: sess.answers || {}, results: r };
  if (sess.grammar) renderGrammar(pdf, sess.grammar, mode);
  if (sess.review) renderReview(pdf, sess.review, mode);
  (sess.parts || []).forEach((part, idx) => {
    if (idx > 0 || pdf.y > 110) pdf.page();
    renderPart(pdf, sess, part, mode);
    // explanations for the misses
    const P = ex.parts[part.id];
    const misses = part.questions.filter(q => (mode.marks[`${part.id}:${q.n}`] || {}).status !== 'correct');
    if (misses.length) {
      pdf.h3(`Por qué (${misses.length} ${misses.length === 1 ? 'fallo' : 'fallos'})`, PC.omr);
      for (const q of misses) {
        const k = `${part.id}:${q.n}`, m = mode.marks[k] || {}, e = (fb.errors || {})[k] || {};
        const it = { q, part, P, type: P.letters ? 'letter' : 'text' };
        const g = String(mode.answers[k] || '');
        pdf.need(16);
        pdf.rich([
          { t: `${q.n}  `, b: true, color: PC.bad },
          { t: 'Tu respuesta: ', color: PC.grey }, { t: g ? givenText(it, g) : '(en blanco)', b: true, color: PC.bad },
          { t: '   Correcta: ', color: PC.grey }, { t: keyText(it), b: true, color: PC.ok },
          m.status === 'partial' ? { t: `   (${m.points}/${it.P.marks || 1} puntos)`, color: PC.omr } : null
        ].filter(Boolean), { size: 10 });
        const expl = e.explanation || q.explanation;
        if (expl) pdf.rich([{ t: expl }], { size: 9.8, x: pdf.ML + 7 });
        if (m.note) pdf.small(m.note, { x: pdf.ML + 7 });
        const tagLine = [e.category, tagEs(e.tag || q.tag), e.point || q.point].filter(Boolean).join(' · ');
        if (tagLine) pdf.small(tagLine, { x: pdf.ML + 7, size: 8 });
        pdf.sp(1.5);
      }
    } else { pdf.box([{ t: '¡Parte perfecta! ', b: true }, { t: 'No hay nada que corregir aquí.' }], { fill: [226, 242, 234], size: 10 }); }
    if (part.id.startsWith('L')) renderTranscript(pdf, part);
  });
  renderRefuerzo(pdf, fb);
  return pdf;
}

/* ---------- writing ---------- */
function writingTaskSegs(w) {
  const out = [];
  if (w.type === 'essay') {
    out.push({ t: (w.context || '') + '\n\n' }, { t: (w.instruction || '') + '\n\n' }, { t: (w.question || '') + '\n\n', b: true }, { t: 'Notes\nWrite about:\n', b: true });
    (w.notes || []).forEach((n, i) => out.push({ t: `${i + 1}. ${n}\n` }));
  } else if (w.type === 'email') {
    out.push({ t: (w.context || '') + '\n\n' });
    out.push({ t: `From: ${w.email?.from || ''}\nSubject: ${w.email?.subject || ''}\n\n`, b: true });
    let body = w.email?.body || '';
    out.push({ t: body + '\n\n', i: true });
    out.push({ t: 'Your notes:\n', b: true });
    (w.notes || []).forEach(n => out.push({ t: `"${n.after}" -> `, i: true }, { t: `${n.note}\n`, b: true }));
    out.push({ t: '\n' + (w.instruction || '') });
  }
  return out;
}

function buildWritingPdf(sess, pdf) {
  const st = S.students[sess.studentId] || {};
  const ex = EXAMS[sess.level], w = sess.writing || {};
  pdf.title(`Writing · ${st.name}`, `${ex.name} · ${niceDate(sess.dateKey)} · Part ${w.part}`);
  pdf.box([{ t: 'Instrucciones: ', b: true }, { t: `${sess.grammar ? `${GRAMMAR_MIN} minutos de gramática y luego ` : ''}15 minutos de writing: 3 para planificar en el recuadro y 12 para escribir a lápiz en las líneas. Cuenta las palabras al final (${w.words}).` }], { size: 9.5 });
  pdf.sp(2);
  if (sess.grammar) { renderGrammar(pdf, Object.assign({}, sess.grammar, { onPage: true }), null); pdf.page(); }
  if (sess.review) { renderReview(pdf, sess.review, null); pdf.page(); }
  pdf.partHead(`Part ${w.part}`, w.part === 1 ? `Writing · ${w.type === 'email' ? 'Email' : 'Essay'}` : 'Writing · choose ONE task');
  if (w.type === 'choice') {
    pdf.rich([{ t: `Write an answer to one of the questions in this part. Write your answer in ${w.words} words in an appropriate style.`, b: true }], { size: 10.5 }); pdf.sp(3);
    (w.options || []).forEach((o, i) => {
      pdf.need(20);
      pdf.rich([{ t: `${i + 2}   `, b: true, size: 13 }, { t: `(${o.type})`, color: PC.grey }], { size: 10.5 }); pdf.sp(1);
      pdf.rich([{ t: o.text || '' }], { size: 10.5, x: pdf.ML + 8 }); pdf.sp(4);
    });
  } else {
    pdf.rich(writingTaskSegs(w), { size: 10.5 }); pdf.sp(2);
    pdf.rich([{ t: `Write your ${w.type} in ${w.words} words.`, b: true }], { size: 10.5 });
    pdf.sp(3);
  }
  if ((w.tips || []).length || (w.usefulLanguage || []).length) {
    pdf.box([{ t: 'Consejos: ', b: true }, { t: (w.tips || []).join('  ·  ') }, { t: '\nExpresiones útiles: ', b: true }, { t: (w.usefulLanguage || []).join('  ·  '), i: true }], { size: 9, fill: PC.fill });
  }
  // planning box
  pdf.need(52); pdf.sp(2);
  pdf.set('bold', 9, PC.grey); pdf.d.text('PLAN (no cuenta para la nota)', pdf.ML, pdf.y + 3);
  pdf.d.setDrawColor(...PC.light); pdf.d.setLineWidth(0.3); pdf.d.roundedRect(pdf.ML, pdf.y + 5, pdf.CW, 44, 2, 2, 'S');
  pdf.y += 52;
  // lined answer pages
  for (let pg = 0; pg < 2; pg++) {
    pdf.page();
    pdf.set('bold', 10, PC.ink); pdf.d.text(pg === 0 ? `Write your answer here (Question ${w.type === 'choice' ? '___' : w.part})` : 'Continue here', pdf.ML, pdf.y + 3);
    let y = pdf.y + 12;
    let i = 0;
    pdf.d.setDrawColor(...PC.light); pdf.d.setLineWidth(0.25);
    while (y < pdf.H - pdf.MB - (pg === 1 ? 14 : 4)) { pdf.d.line(pdf.ML, y, pdf.W - pdf.MR, y); i++; if (i % 5 === 0) { pdf.set('normal', 6.5, PC.light); pdf.d.text(String(i + pg * 29), pdf.ML - 5, y - 0.5); } y += 8.4; }
    if (pg === 1) { pdf.set('bold', 9, PC.ink); pdf.d.text('Number of words:', pdf.W - pdf.MR - 48, pdf.H - pdf.MB - 5); pdf.d.setDrawColor(...PC.omr); pdf.d.rect(pdf.W - pdf.MR - 18, pdf.H - pdf.MB - 10, 18, 7); }
  }
  return pdf;
}

function buildWritingCorrectionPdf(sess) {
  const st = S.students[sess.studentId] || {};
  const r = sess.results || {}, fb = sess.feedback || {}, w = sess.writing || {};
  const pdf = new Pdf(pdfMeta(sess, 'Corrección writing'));
  pdf.title('Corrección · Writing', `${st.name} · ${niceDate(sess.dateKey)} · ${fb.wordCount || '?'} palabras (${w.words})`);
  const sc = r.writingScores || {};
  const y0 = pdf.y, d = pdf.d;
  d.setFillColor(...PC.fill); d.roundedRect(pdf.ML, y0, pdf.CW, 20, 2, 2, 'F');
  pdf.set('bold', 22, PC.ink); d.text(`${r.score}/20`, pdf.ML + 5, y0 + 13);
  [['Content', sc.content], ['Communicative', sc.communicative], ['Organisation', sc.organisation], ['Language', sc.language]].forEach(([k, v], i) => {
    const x = pdf.ML + 48 + i * 32; pdf.set('normal', 8, PC.grey); d.text(k, x, y0 + 7); pdf.set('bold', 13, PC.ink); d.text(`${v ?? '-'}/5`, x, y0 + 14);
  });
  pdf.y = y0 + 24;
  if (fb.summary) pdf.box([{ t: 'Comentario: ', b: true }, { t: fb.summary }], { size: 10 });
  if (fb.strengths?.length) { pdf.h3('Lo que has hecho bien', PC.ok); fb.strengths.forEach(s => pdf.rich([{ t: '+ ' + s }], { size: 10 })); }
  if (fb.improvements?.length) { pdf.h3('Para mejorar', PC.bad); fb.improvements.forEach(s => pdf.rich([{ t: '- ' + s }], { size: 10 })); }
  if (fb.corrections?.length) {
    pdf.h3('Correcciones');
    fb.corrections.forEach((c, i) => {
      pdf.need(14);
      pdf.rich([{ t: `${i + 1}  `, b: true }, { t: str(c.original), strike: true, color: PC.bad }, { t: '  ->  ' }, { t: str(c.corrected), b: true, color: PC.ok }], { size: 10 });
      if (c.why) pdf.small(str(c.why), { x: pdf.ML + 7 });
      pdf.sp(1);
    });
  }
  if (fb.transcript) { pdf.h3('Tu texto'); pdf.rich([{ t: fb.transcript }], { size: 10, color: PC.grey }); }
  if (fb.improved) { pdf.h3('Tu texto mejorado', PC.omr); pdf.rich([{ t: fb.improved }], { size: 10.5 }); }
  if (w.model) { pdf.h3('Respuesta modelo'); pdf.rich([{ t: w.model }], { size: 10 }); }
  const qm = { corr: true, marks: sess.results?.marks || reviewMarksObj(sess), answers: sess.answers || {}, results: sess.results };
  if (sess.grammar) renderGrammar(pdf, sess.grammar, qm);
  if (sess.review) renderReview(pdf, sess.review, qm);
  renderRefuerzo(pdf, fb);
  return pdf;
}
function reviewMarksObj(sess) {
  const out = {}; const rm = sess.results?.reviewMarks || {};
  for (const [n, s] of Object.entries(rm)) out['RV:' + n] = { status: s };
  return out;
}

/* ---------- speaking ---------- */
function buildSpeakingStudentPdf(sess, pdf) {
  const st = S.students[sess.studentId] || {};
  const sp = sess.speaking || {}, ex = EXAMS[sess.level];
  pdf.title(`Speaking · ${st.name}`, `${ex.name} · ${niceDate(sess.dateKey)} · hoja del alumno`);
  if (sess.grammar) { pdf.box([{ t: 'Primero: ', b: true }, { t: `${GRAMMAR_MIN} minutos de gramática. Después, el examen oral.` }], { size: 9.5 }); pdf.sp(2); renderGrammar(pdf, Object.assign({}, sess.grammar, { onPage: true }), null); pdf.page(); }
  pdf.partHead('Part 2', ex.id === 'B2' ? 'Long turn · compare the photos' : 'Describe the photo');
  pdf.rich([{ t: sp.part2?.question || '', b: true }], { size: 13 }); pdf.sp(3);
  const y = pdf.y, w = (pdf.CW - 6) / 2;
  (sp.part2?.photos || []).slice(0, 2).forEach((ph, i) => {
    const x = pdf.ML + i * (w + 6);
    pdf.d.setDrawColor(...PC.light); pdf.d.setLineWidth(0.4); pdf.d.roundedRect(x, y, w, 62, 2, 2, 'S');
    pdf.set('bold', 22, PC.light); pdf.d.text(ph.label || String.fromCharCode(65 + i), x + w / 2, y + 30, { align: 'center' });
    pdf.set('normal', 8, PC.grey); pdf.d.text(pdf.d.splitTextToSize(pdfSafe('Pega aquí la foto o mírala en la pantalla'), w - 8), x + w / 2, y + 38, { align: 'center' });
  });
  pdf.y = y + 68;
  pdf.partHead('Part 3', 'Collaborative task');
  const p3 = sp.part3 || {};
  const cx = pdf.W / 2, cy = pdf.y + 48, rx = 60, ry = 36;
  pdf.need(100);
  const prompts = (p3.prompts || []).slice(0, 6);
  const d = pdf.d;
  prompts.forEach((p, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / prompts.length;
    const bx = cx + rx * Math.cos(ang), by = cy + ry * Math.sin(ang);
    d.setDrawColor(...PC.light); d.setLineWidth(0.4); d.line(cx, cy, bx, by);
  });
  const cw = 62, chh = 22;
  d.setFillColor(...PC.omrSoft); d.setDrawColor(...PC.omr); d.roundedRect(cx - cw / 2, cy - chh / 2, cw, chh, 3, 3, 'FD');
  pdf.set('bold', 9.5, PC.ink);
  const ql = d.splitTextToSize(pdfSafe(p3.question || ''), cw - 6);
  d.text(ql, cx, cy - (ql.length - 1) * 2 + 1, { align: 'center' });
  prompts.forEach((p, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / prompts.length;
    const bx = cx + rx * Math.cos(ang), by = cy + ry * Math.sin(ang), bw = 44, bh = 14;
    d.setFillColor(255, 255, 255); d.setDrawColor(...PC.ink); d.roundedRect(bx - bw / 2, by - bh / 2, bw, bh, 2, 2, 'FD');
    pdf.set('normal', 9, PC.ink); const l = d.splitTextToSize(pdfSafe(p), bw - 4); d.text(l.slice(0, 3), bx, by - (Math.min(l.length, 3) - 1) * 1.8 + 1, { align: 'center' });
  });
  pdf.y = cy + ry + 14;
  if (sp.phrases?.length) {
    pdf.page();
    pdf.h3('Useful language', PC.omr);
    sp.phrases.forEach(g => { pdf.rich([{ t: str(g.function), b: true }], { size: 10.5 }); (g.items || []).forEach(it => pdf.rich([{ t: '- ' + str(it), i: true }], { size: 10, x: pdf.ML + 4 })); pdf.sp(2); });
  }
  return pdf;
}

function buildSpeakingExaminerPdf(sess) {
  const st = S.students[sess.studentId] || {};
  const sp = sess.speaking || {}, ex = EXAMS[sess.level], B2 = sess.level === 'B2';
  const pdf = new Pdf(pdfMeta(sess, 'Guion del examinador'));
  pdf.title('Guion del examinador', `${st.name} · ${ex.name} · ${B2 ? 'unos 14 minutos' : 'unos 12 minutos'}`);
  pdf.box([{ t: 'Cómo hacerlo: ', b: true }, { t: 'lee en inglés lo que va en negrita, cronometra cada parte y haz también de compañero. Muestra las fotos de la Parte 2 en el móvil (usa las búsquedas sugeridas). Al terminar puntúa del 0 al 5 cada criterio en la app.' }], { size: 9.5 });
  pdf.partHead('Part 1', B2 ? 'Interview · 2 min' : 'Interview · 2-3 min');
  pdf.rich([{ t: 'Good morning. Can I have your mark sheets, please? ... First, we\'d like to know something about you.', b: true }], { size: 10 }); pdf.sp(1);
  (sp.part1?.questions || []).forEach(q => pdf.rich([{ t: '- ' + q }], { size: 10.5, x: pdf.ML + 4 }));
  pdf.partHead('Part 2', B2 ? 'Long turn · 1 min each + 30 s' : 'Photo description · 1 min each');
  pdf.rich([{ t: B2 ? 'In this part of the test, I\'m going to give each of you two photographs. I\'d like you to talk about your photographs on your own for about a minute, and also to answer a question about your partner\'s photographs.' : 'Now, I\'d like each of you to talk on your own about something. I\'m going to give each of you a photograph and I\'d like you to talk about it.', b: true }], { size: 10 }); pdf.sp(1);
  pdf.rich([{ t: 'Pregunta impresa: ', color: PC.grey }, { t: sp.part2?.question || '', b: true }], { size: 10.5 });
  (sp.part2?.photos || []).forEach(ph => { pdf.rich([{ t: `Foto ${ph.label}: `, b: true }, { t: ph.description || '' }], { size: 10 }); pdf.small(`Búsqueda de imágenes: "${ph.search || ''}"`, { x: pdf.ML + 4 }); });
  if (sp.part2?.followUp) pdf.rich([{ t: 'Pregunta al compañero: ', color: PC.grey }, { t: sp.part2.followUp, b: true }], { size: 10 });
  pdf.partHead('Part 3', B2 ? 'Collaborative task · 2 min + 1 min' : 'Collaborative task · 2-3 min');
  if (sp.part3?.situation) pdf.rich([{ t: sp.part3.situation, b: true }], { size: 10 });
  pdf.rich([{ t: 'Pregunta central: ', color: PC.grey }, { t: sp.part3?.question || '', b: true }], { size: 10.5 });
  (sp.part3?.prompts || []).forEach(p => pdf.rich([{ t: '- ' + p }], { size: 10, x: pdf.ML + 4 }));
  if (sp.part3?.decision) pdf.rich([{ t: 'Decisión (último minuto): ', color: PC.grey }, { t: sp.part3.decision, b: true }], { size: 10.5 });
  pdf.partHead('Part 4', 'Discussion · 4 min');
  (sp.part4?.questions || []).forEach(q => pdf.rich([{ t: '- ' + q }], { size: 10.5, x: pdf.ML + 4 }));
  if (sp.listenFor?.length) { pdf.h3('En qué fijarte al puntuar', PC.omr); sp.listenFor.forEach(l => pdf.rich([{ t: '- ' + l }], { size: 10 })); }
  pdf.h3('Criterios (0-5)');
  [['Grammar & Vocabulary', 'variedad y corrección de estructuras y palabras'], ['Discourse Management', 'respuestas largas, organizadas y con conectores'], ['Pronunciation', 'se entiende sin esfuerzo, entonación y acentos'], ['Interactive Communication', 'inicia, responde, pregunta al compañero, negocia']].forEach(([k, v]) => pdf.rich([{ t: k + ': ', b: true }, { t: v }], { size: 10 }));
  if (sess.grammar) { pdf.page(); renderReviewKey(pdf, sess.grammar, 'Grammar', 'Soluciones de la gramática del día'); }
  return pdf;
}

function buildSpeakingCorrectionPdf(sess) {
  const st = S.students[sess.studentId] || {};
  const r = sess.results || {}, fb = sess.feedback || {}, m = r.speakingMarks || {};
  const pdf = new Pdf(pdfMeta(sess, 'Corrección speaking'));
  pdf.title('Corrección · Speaking', `${st.name} · ${niceDate(sess.dateKey)}`);
  const y0 = pdf.y, d = pdf.d;
  d.setFillColor(...PC.fill); d.roundedRect(pdf.ML, y0, pdf.CW, 20, 2, 2, 'F');
  pdf.set('bold', 22, PC.ink); d.text(`${r.score}/20`, pdf.ML + 5, y0 + 13);
  [['Grammar/Vocab', m.gv], ['Discourse', m.dm], ['Pronunciation', m.pr], ['Interaction', m.ic]].forEach(([k, v], i) => {
    const x = pdf.ML + 48 + i * 32; pdf.set('normal', 8, PC.grey); d.text(k, x, y0 + 7); pdf.set('bold', 13, PC.ink); d.text(`${v ?? '-'}/5`, x, y0 + 14);
  });
  pdf.y = y0 + 24;
  if (fb.summary) pdf.box([{ t: 'Comentario: ', b: true }, { t: fb.summary }], { size: 10 });
  if (fb.strengths?.length) { pdf.h3('Lo que has hecho bien', PC.ok); fb.strengths.forEach(s => pdf.rich([{ t: '+ ' + s }], { size: 10 })); }
  if (fb.improvements?.length) { pdf.h3('Para mejorar', PC.bad); fb.improvements.forEach(s => pdf.rich([{ t: '- ' + s }], { size: 10 })); }
  if (fb.corrections?.length) {
    pdf.h3('Errores que se oyeron');
    fb.corrections.forEach((c, i) => { pdf.need(12); pdf.rich([{ t: `${i + 1}  `, b: true }, { t: str(c.original), strike: true, color: PC.bad }, { t: '  ->  ' }, { t: str(c.corrected), b: true, color: PC.ok }], { size: 10 }); if (c.why) pdf.small(str(c.why), { x: pdf.ML + 7 }); });
  }
  if (fb.phrases?.length) { pdf.h3('Frases para la próxima vez', PC.omr); fb.phrases.forEach(p => pdf.rich([{ t: '- ' + p, i: true }], { size: 10 })); }
  if (sess.grammar && r.marks) renderGrammar(pdf, sess.grammar, { corr: true, marks: r.marks, answers: sess.answers || {}, results: r });
  renderRefuerzo(pdf, fb);
  return pdf;
}

/* ---------- error notebook ---------- */
function buildNotebookPdf(stId) {
  const st = S.students[stId] || {}; const nb = S.notebooks[stId] || emptyNotebook();
  const ex = EXAMS[st.level] || EXAMS.B2;
  const pdf = new Pdf({ title: `${st.name} · Cuaderno de errores`, left: `${ex.name.toUpperCase()} · CUADERNO DE ERRORES`, right: `${st.name} · ${niceDate(dateKey())}` });
  pdf.title(`Cuaderno de errores · ${st.name}`, `${nb.queue?.length || 0} errores en repaso · ${nb.mastered || 0} ya dominados`);
  const groups = {};
  for (const q of nb.queue || []) (groups[q.tag] = groups[q.tag] || []).push(q);
  const order = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
  if (!order.length) pdf.text('Todavía no hay errores registrados. Aparecerán aquí al corregir las sesiones.');
  for (const tag of order) {
    pdf.h3(`${tagEs(tag)} (${groups[tag].length})`, PC.omr);
    for (const q of groups[tag]) {
      pdf.need(16);
      pdf.rich([{ t: q.point ? q.point + '   ' : '', b: true }, { t: `${q.category || ''} · ${q.date ? shortDate(q.date) : ''}`, color: PC.grey, size: 8.5 }], { size: 10 });
      if (q.context) pdf.rich([{ t: q.context, i: true }], { size: 9.5, x: pdf.ML + 4 });
      pdf.rich([{ t: 'Pusiste: ', color: PC.grey }, { t: q.wrong || '', strike: true, color: PC.bad }, { t: '   Correcto: ', color: PC.grey }, { t: q.correct || '', b: true, color: PC.ok }], { size: 9.5, x: pdf.ML + 4 });
      if (q.explanation) pdf.small(q.explanation, { x: pdf.ML + 4 });
      pdf.sp(1.5);
    }
  }
  return pdf;
}
</script>

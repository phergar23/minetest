<script>
/* =========================================================
   Listening audio
   - Live playback with the device's English voices (both editions)
   - MP3 rendering with Kokoro neural voices (local edition only)
   ========================================================= */
const VP = (() => { try { return Object.assign({ rate: 0.92, pitch: 1, gap: 450 }, JSON.parse(localStorage.getItem('cec-voice-prefs') || '{}')); } catch (e) { return { rate: 0.92, pitch: 1, gap: 450 }; } })();
function saveVP() { try { localStorage.setItem('cec-voice-prefs', JSON.stringify(VP)); } catch (e) {} }

const TTS = {
  ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
  voices: [],
  init() {
    if (!this.ok) return;
    const load = () => {
      try { this.voices = speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang) && this.rank(v) > -50); } catch (e) { this.voices = []; }
      if (S.view === 'session' && S.sessTab === 'audio') paintPlayer();
    };
    load();
    try { speechSynthesis.addEventListener('voiceschanged', load); } catch (e) { speechSynthesis.onvoiceschanged = load; }
  },
  gender(v) {
    const n = v.name.toLowerCase();
    if (/female|woman|samantha|karen|kate|serena|moira|tessa|victoria|susan|zira|hazel|libby|sonia|jenny|aria|fiona|martha|stephanie|catherine|nicky|allison|ava|emma|olivia|amy|salli|joanna|kimberly|natasha|clara|maisie|abbie|bella|hollie|sienna|isla|heather/.test(n)) return 'f';
    if (/\bmale|daniel|alex|fred|oliver|arthur|george|ryan|guy|david|mark|thomas|lee|rishi|aaron|james|brian|matthew|justin|joey|tom|william|liam|noah|elliot|ethan|alfie|jack|harry|connor/.test(n)) return 'm';
    return '?';
  },
  rank(v) {
    let r = 0;
    if (/en[-_]GB/i.test(v.lang)) r += 30; else if (/en[-_](IE|AU|NZ|ZA)/i.test(v.lang)) r += 16; else if (/en[-_]US/i.test(v.lang)) r += 10;
    if (/enhanced|premium|natural|neural|online/i.test(v.name)) r += 12;
    if (/google/i.test(v.name)) r += 3;
    if (/compact/i.test(v.name)) r -= 4;
    if (/bad news|bells|boing|bubbles|cellos|wobble|whisper|zarvox|trinoids|organ|jester|superstar|bahh|albert|hysterical|good news|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley|ralph|kathy|junior|princess|deranged|pipe organ/i.test(v.name)) r -= 100;
    return r;
  },
  ranked(g) { return this.voices.filter(v => g === '?' || this.gender(v) === g).sort((a, b) => this.rank(b) - this.rank(a)); },
  byName(n) { return n ? this.voices.find(v => v.name === n) || null : null; },
  cast(speakers) {
    const map = {};
    const all = this.ranked('?');
    const narrator = this.byName(VP.narrator) || this.ranked('f')[0] || all[0] || null;
    map.__narrator = narrator;
    const pref = { f: this.byName(VP.female), m: this.byName(VP.male) };
    const used = { f: 0, m: 0, '?': 0 };
    for (const sp of speakers) {
      if (map[sp.name] !== undefined) continue;
      const g = sp.gender === 'm' || sp.gender === 'f' ? sp.gender : '?';
      if (used[g] === 0 && pref[g]) { map[sp.name] = pref[g]; used[g]++; continue; }
      let pool = this.ranked(g).filter(v => v !== narrator && v !== pref[g]);
      if (!pool.length) pool = this.ranked(g);
      if (!pool.length) pool = all;
      map[sp.name] = pool.length ? pool[(used[g] - (pref[g] ? 1 : 0) + pool.length) % pool.length] : null;
      used[g]++;
    }
    return map;
  }
};

/* One sentence per utterance so every sentence ends with a real pause. */
function splitSentences(t) {
  const clean = String(t || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sents = clean.match(/[^.!?]+(?:[.!?]+["')\]]*|$)/g) || [clean];
  const out = [];
  for (let s of sents.map(x => x.trim()).filter(Boolean)) {
    while (s.length > 240) {
      const cut = Math.max(s.lastIndexOf(', ', 220), s.lastIndexOf('; ', 220));
      if (cut < 60) break;
      out.push(s.slice(0, cut + 1)); s = s.slice(cut + 2);
    }
    out.push(s);
  }
  return out;
}

function listeningProgram(sess, part, short) {
  const ex = EXAMS[sess.level], P = ex.parts[part.id], B2 = sess.level === 'B2';
  const steps = [];
  const gap = Math.max(150, +VP.gap || 450);
  const speak = (text, who, gender, label, line) => {
    const ss = splitSentences(text);
    ss.forEach((s, i) => { steps.push({ say: s, who, gender, label, line }); steps.push({ gap: i < ss.length - 1 ? gap : Math.round(gap * 1.6) }); });
  };
  const N = (t, label) => t && speak(t, '__narrator', 'f', label || 'Instrucciones');
  const pause = (s, label) => steps.push({ pause: short ? Math.max(3, Math.round(s / 3)) : s, label });
  const lines = (script, label, fallback) => {
    for (const l of scriptLines(script)) speak(l.text, l.speaker || fallback?.name || 'Speaker', l.gender || fallback?.gender, label, l);
  };
  const readTime = { 'l-gap': B2 ? 45 : 20, 'l-speakers': 30, 'l-interview': B2 ? 60 : 45 }[P.kind] || 10;
  N(`${P.label}.`, P.label);
  N(fill(P.ins, P).replace(/(\d+)–(\d+)/g, '$1 to $2').replace(/\(A, B or C\)/g, 'A, B or C').replace(/\(A–H\)/g, 'A to H'));
  if (P.kind === 'l-extracts') {
    for (const q of part.questions) {
      N(`Question ${q.n}. ${q.context || ''} ${q.stem || ''}`, `Pregunta ${q.n}`);
      pause(5, `Pregunta ${q.n}: lee las opciones`);
      lines(q.script, `Pregunta ${q.n} · primera vez`);
      pause(3, 'Pausa');
      N('Now listen again.', `Pregunta ${q.n}`);
      lines(q.script, `Pregunta ${q.n} · segunda vez`);
      pause(5, 'Marca tu respuesta');
    }
  } else if (P.kind === 'l-speakers') {
    N(part.intro);
    pause(readTime, 'Tiempo para leer las opciones');
    for (const pass of [1, 2]) {
      if (pass === 2) N('Now you will hear the five extracts again.');
      for (const q of part.questions) {
        const lab = `${q.speaker} · ${pass === 1 ? 'primera' : 'segunda'} vez`;
        N(q.speaker || `Speaker ${q.n - part.questions[0].n + 1}`, lab);
        lines([{ speaker: q.speaker, gender: q.gender, text: typeof q.script === 'string' ? q.script : scriptLines(q.script).map(l => l.text).join(' ') }], lab);
        pause(2, 'Pausa');
      }
    }
  } else {
    N(part.intro);
    pause(readTime, 'Tiempo para leer las preguntas');
    const fb = part.speaker || null;
    const scr = typeof part.script === 'string' ? [{ speaker: fb?.name || 'Speaker', gender: fb?.gender, text: part.script }] : part.script;
    lines(scr, 'Primera escucha', fb);
    pause(5, 'Pausa');
    N('Now listen again.');
    lines(scr, 'Segunda escucha', fb);
    pause(5, 'Revisa tus respuestas');
  }
  N(`That is the end of ${P.label}.`, 'Fin');
  const speakers = [];
  steps.forEach(s => { if (s.say && s.who !== '__narrator') speakers.push({ name: s.who, gender: s.gender }); });
  return { steps, speakers };
}

/* ---------- live playback ---------- */
const PL = { sessId: null, pid: null, run: 0, i: 0, state: 'idle', label: '', count: 0, short: false, showScript: false, skip: false };

function speakOnce(text, voice) {
  return new Promise(res => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-GB';
    u.rate = +VP.rate || 0.92; u.pitch = +VP.pitch || 1;
    u.onend = () => res();
    u.onerror = () => res();
    speechSynthesis.speak(u);
  });
}

async function playPart(sessId, pid) {
  if (!TTS.ok) return;
  const sess = S.sessions[sessId]; const part = sess && (sess.parts || []).find(p => p.id === pid);
  if (!part) return;
  stopAudio();
  const run = ++PL.run;
  const prog = listeningProgram(sess, part, PL.short);
  const cast = TTS.cast(prog.speakers);
  Object.assign(PL, { sessId, pid, i: 0, state: 'playing', steps: prog.steps });
  paintPlayer();
  const wait = async ms => { let w = 0; while (w < ms) { await sleep(50); if (run !== PL.run) return false; if (PL.state !== 'paused') w += 50; } return true; };
  for (let i = 0; i < prog.steps.length; i++) {
    if (run !== PL.run) return;
    PL.i = i; const st = prog.steps[i]; PL.label = st.label || PL.label;
    if (st.gap) { if (!(await wait(st.gap))) return; continue; }
    if (st.pause) {
      PL.skip = false;
      for (let s = st.pause; s > 0; s--) {
        PL.count = s; paintPlayerStatus();
        let waited = 0;
        while (waited < 1000) { await sleep(100); if (run !== PL.run) return; if (PL.state !== 'paused') waited += 100; if (PL.skip) break; }
        if (PL.skip) break;
      }
      PL.count = 0; continue;
    }
    paintPlayerStatus();
    while (PL.state === 'paused') { await sleep(150); if (run !== PL.run) return; }
    await speakOnce(st.say, cast[st.who] || cast.__narrator);
  }
  if (run === PL.run) { PL.state = 'idle'; PL.label = 'Terminado'; paintPlayer(); }
}
function pauseAudio() {
  if (PL.state === 'playing') { PL.state = 'paused'; try { speechSynthesis.pause(); } catch (e) {} }
  else if (PL.state === 'paused') { PL.state = 'playing'; try { speechSynthesis.resume(); } catch (e) {} }
  paintPlayer();
}
function stopAudio() { PL.run++; PL.state = 'idle'; PL.count = 0; try { speechSynthesis.cancel(); } catch (e) {} }
function testVoices() {
  if (!TTS.ok) return;
  stopAudio();
  const c = TTS.cast([{ name: 'A', gender: 'f' }, { name: 'B', gender: 'm' }]);
  const run = ++PL.run;
  (async () => {
    for (const [who, txt] of [['__narrator', 'This is the narrator. You will hear each recording twice.'], ['A', "Hi! I've just got back from the trip. It was amazing, honestly."], ['B', 'Really? I thought you were worried about the weather.']]) {
      if (run !== PL.run) return;
      await speakOnce(txt, c[who]); await sleep(+VP.gap || 450);
    }
  })();
}

/* ---------- MP3 with Kokoro (local edition) ---------- */
const KOKORO_URL = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';
const KOKORO_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const KVOICES = { narrator: 'bf_emma', f: ['af_heart', 'bf_isabella', 'af_bella', 'af_nicole'], m: ['am_michael', 'bm_george', 'am_puck', 'bm_fable'] };
const AU = { busy: false, msg: '', pct: 0, ctl: null, results: {}, err: '' };
let kokoroP = null;

function loadKokoro(onMsg) {
  if (!kokoroP) {
    kokoroP = (async () => {
      onMsg('Cargando el motor de voz…');
      const mod = await import(KOKORO_URL);
      const gpu = !!(window.LOCAL_CFG && window.LOCAL_CFG.gpu && navigator.gpu);
      const files = {};
      return mod.KokoroTTS.from_pretrained(KOKORO_MODEL, {
        dtype: gpu ? 'fp32' : 'q8', device: gpu ? 'webgpu' : 'wasm',
        progress_callback: p => {
          if (p && p.status === 'progress' && p.file) {
            files[p.file] = { loaded: p.loaded || 0, total: p.total || 0 };
            const t = Object.values(files).reduce((a, f) => [a[0] + f.loaded, a[1] + f.total], [0, 0]);
            if (t[1] > 2e6) onMsg(`Descargando las voces (solo la primera vez): ${Math.round(t[0] / 1e6)} de ${Math.round(t[1] / 1e6)} MB`);
          }
        }
      });
    })().catch(e => { kokoroP = null; throw e; });
  }
  return kokoroP;
}

async function renderPartPcm(tts, sess, part, signal, onStep) {
  const prog = listeningProgram(sess, part, PL.short);
  const voiceOf = {}; let fi = 0, mi = 0;
  for (const s of prog.steps) {
    if (!s.say || voiceOf[s.who]) continue;
    if (s.who === '__narrator') voiceOf[s.who] = KVOICES.narrator;
    else if (s.gender === 'm') voiceOf[s.who] = KVOICES.m[mi++ % KVOICES.m.length];
    else voiceOf[s.who] = KVOICES.f[fi++ % KVOICES.f.length];
  }
  const rate = 24000, cache = new Map(), chunks = [];
  const speechSteps = prog.steps.filter(s => s.say);
  const unique = new Set(speechSteps.map(s => s.who + '|' + s.say)).size;
  let done = 0;
  for (const s of prog.steps) {
    if (signal.aborted) throw Object.assign(new Error('cancelled'), { code: 'cancelled' });
    if (s.say) {
      const key = s.who + '|' + s.say;
      if (!cache.has(key)) {
        const a = await tts.generate(s.say, { voice: voiceOf[s.who], speed: Math.min(1.1, Math.max(0.8, +VP.rate || 0.92) + 0.03) });
        cache.set(key, a.audio); done++; onStep(done, unique);
        await sleep(0);
      }
      chunks.push(cache.get(key));
    } else {
      const sec = s.gap ? s.gap / 1000 : s.pause;
      chunks.push(new Float32Array(Math.round(sec * rate)));
    }
  }
  return { chunks, rate };
}

function encodeMp3(chunks, rate) {
  const total = chunks.reduce((t, c) => t + c.length, 0);
  const i16 = new Int16Array(total); let o = 0, peak = 0;
  for (const c of chunks) for (let i = 0; i < c.length; i++) { const v = Math.abs(c[i]); if (v > peak) peak = v; }
  const gain = peak > 0 ? Math.min(3, 0.95 / peak) : 1;
  for (const c of chunks) for (let i = 0; i < c.length; i++) { const v = Math.max(-1, Math.min(1, c[i] * gain)); i16[o++] = v < 0 ? v * 32768 : v * 32767; }
  const secs = total / rate;
  if (window.lamejs && window.lamejs.Mp3Encoder) {
    const enc = new window.lamejs.Mp3Encoder(1, rate, 64), out = [];
    for (let i = 0; i < i16.length; i += 1152) { const b = enc.encodeBuffer(i16.subarray(i, i + 1152)); if (b.length) out.push(b); }
    const f = enc.flush(); if (f.length) out.push(f);
    return { blob: new Blob(out, { type: 'audio/mpeg' }), ext: 'mp3', secs };
  }
  const buf = new ArrayBuffer(44 + i16.length * 2), dv = new DataView(buf);
  const w = (p, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(p + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + i16.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, i16.length * 2, true);
  new Int16Array(buf, 44).set(i16);
  return { blob: new Blob([buf], { type: 'audio/wav' }), ext: 'wav', secs };
}

async function makeListeningAudio(sessId, which) {
  if (AU.busy) return;
  const sess = S.sessions[sessId]; if (!sess) return;
  const parts = (sess.parts || []).filter(p => p.id.startsWith('L') && (which === 'all' || p.id === which));
  if (!parts.length) return;
  const ctl = new AbortController();
  Object.assign(AU, { busy: true, ctl, msg: 'Preparando…', pct: 0, err: '' });
  paintPlayer();
  const say = m => { AU.msg = m; paintAudioStatus(); };
  try {
    const tts = await loadKokoro(say);
    let all = [], rate = 24000;
    for (let k = 0; k < parts.length; k++) {
      const P = EXAMS[sess.level].parts[parts[k].id];
      const r = await renderPartPcm(tts, sess, parts[k], ctl.signal, (d, n) => { AU.pct = Math.round(100 * (k + d / n) / parts.length); say(`Generando ${P.label}: frase ${d} de ${n}`); });
      rate = r.rate; all = all.concat(r.chunks);
      if (k < parts.length - 1) all.push(new Float32Array(rate * 3));
    }
    say('Codificando el MP3…'); await sleep(30);
    const { blob, ext, secs } = encodeMp3(all, rate);
    const st = S.students[sess.studentId] || { name: 'alumno' };
    const label = which === 'all' ? 'Listening' : `Listening_${EXAMS[sess.level].parts[which].label.replace(' ', '')}`;
    const key = sessId + ':' + which;
    if (AU.results[key]) URL.revokeObjectURL(AU.results[key].url);
    AU.results[key] = { url: URL.createObjectURL(blob), blob, name: `${st.name}_${sess.dateKey}_${label}.${ext}`, secs, which };
    toast('Audio listo');
  } catch (e) {
    AU.err = e && e.code === 'cancelled' ? '' : 'No se pudo generar el audio: ' + ((e && e.message) || e) + '. Comprueba la conexión a internet (la primera vez hay que descargar las voces) y vuelve a intentarlo.';
  } finally {
    AU.busy = false; AU.ctl = null; AU.msg = ''; paintPlayer();
  }
}

function paintAudioStatus() { const n = $('#au-msg'); if (n) n.textContent = AU.msg + (AU.pct ? ` · ${AU.pct}%` : ''); }

function audioDownloadHtml(sess) {
  const parts = (sess.parts || []).filter(p => p.id.startsWith('L'));
  if (!window.__LOCAL__) {
    return `<div class="notice small"><b>Audio en MP3 para descargar:</b> esta página no puede grabar las voces del dispositivo. Usa la versión local (Ajustes › «Descargar versión local»): allí cada parte se convierte en un MP3 con voces neuronales más naturales, para pasárselo a tus hijos.</div>`;
  }
  const ex = EXAMS[sess.level];
  const res = Object.entries(AU.results).filter(([k]) => k.startsWith(sess.id + ':'));
  return `<div class="part-block"><h4>Audio en MP3 para descargar</h4>
    <p class="small muted">Se genera en este ordenador con voces neuronales (Kokoro), cada grabación dos veces y con las pausas del examen${PL.short ? ' (cortas)' : ''}. La primera vez descarga las voces (unos 90 MB); después tarda unos minutos por parte. No cuesta nada.</p>
    <div class="row">${parts.map(p => btn('MP3 ' + ex.parts[p.id].label, `data-mp3="${p.id}" ${AU.busy ? 'disabled' : ''}`, '', 'play')).join('')}${parts.length > 1 ? btn('Todo en un MP3', `data-mp3="all" ${AU.busy ? 'disabled' : ''}`, 'primary', 'play') : ''}${AU.busy ? btn('Cancelar', 'data-mp3-cancel="1"', 'ghost') : ''}</div>
    ${AU.busy ? `<p class="now" id="au-msg">${esc(AU.msg)}${AU.pct ? ` · ${AU.pct}%` : ''}</p>` : ''}
    ${AU.err ? `<div class="notice err">${esc(AU.err)}</div>` : ''}
    ${res.map(([k, r]) => `<div class="stack" style="gap:6px"><span class="small"><b>${esc(r.name)}</b> · ${Math.floor(r.secs / 60)}:${z2(Math.round(r.secs % 60))} min</span><audio controls preload="metadata" src="${r.url}" style="width:100%"></audio><div class="row">${btn('Descargar', `data-mp3-save="${esc(k)}"`, 'primary', 'pdf')}</div></div>`).join('')}
  </div>`;
}

/* ---------- player UI ---------- */
function voiceSelect(id, role, label) {
  const g = role === 'male' ? 'm' : role === 'female' ? 'f' : '?';
  const list = TTS.ranked('?').sort((a, b) => (TTS.gender(b) === g) - (TTS.gender(a) === g) || TTS.rank(b) - TTS.rank(a));
  return `<label class="field"><span>${label}</span><select id="${id}" data-vp="${role}"><option value="">Automática</option>${list.map(v => `<option value="${esc(v.name)}" ${VP[role] === v.name ? 'selected' : ''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select></label>`;
}

function paintPlayer() {
  const box = $('#player'); if (!box) return;
  const sess = S.sessions[S.openId]; if (!sess) return;
  const parts = (sess.parts || []).filter(p => p.id.startsWith('L'));
  const ex = EXAMS[sess.level];
  if (!PL.pid || !parts.some(p => p.id === PL.pid)) PL.pid = parts[0]?.id;
  const part = parts.find(p => p.id === PL.pid);
  let live = '';
  if (!TTS.ok) live = '<div class="notice warn">Este navegador no puede leer en voz alta. Lee tú la transcripción (está en «Soluciones»).</div>';
  else {
    const noVoices = !TTS.voices.length;
    const playing = PL.sessId === sess.id && PL.state !== 'idle';
    const prog = part ? listeningProgram(sess, part, PL.short) : { steps: [], speakers: [] };
    const scr = prog.steps.filter(s => s.say);
    const curStep = playing ? PL.steps?.[PL.i] : null;
    const cast = TTS.cast(prog.speakers);
    live = `${noVoices ? '<div class="notice warn">No encuentro voces en inglés en este dispositivo. En iPhone/Mac: Ajustes › Accesibilidad › Contenido leído › Voces › Inglés (Reino Unido) y descarga una voz «mejorada» o «premium». Mientras tanto, lee tú la transcripción.</div>' : ''}
    <div class="row">
      ${playing ? btn(PL.state === 'paused' ? 'Continuar' : 'Pausa', 'data-audio="pause"', '', PL.state === 'paused' ? 'play' : 'pause') + btn('Parar', 'data-audio="stop"', '', 'stop') + (PL.count ? btn('Saltar espera', 'data-audio="skip"', 'ghost') : '') : btn('Reproducir como en el examen', 'data-audio="play"', 'primary big', 'play')}
    </div>
    <p class="now" id="pl-now" aria-live="polite">${playing ? esc(PL.label) + (PL.count ? ` · ${PL.count} s` : '') : 'Cada grabación suena dos veces, con pausas para leer y responder.'}</p>
    <details class="more" id="vp-box" ${PL.vpOpen ? 'open' : ''}><summary>Voces y pausas</summary>
      <div class="stack" style="gap:10px;margin-top:10px">
        <p class="small muted">Si una voz suena muy siseante, elige otra (las «mejoradas» o «premium» suenan mejor) o baja un poco el tono.</p>
        <div class="form-grid">${voiceSelect('vp-n', 'narrator', 'Narrador')}${voiceSelect('vp-f', 'female', 'Voz femenina')}${voiceSelect('vp-m', 'male', 'Voz masculina')}</div>
        <div class="form-grid">
          <label class="field"><span>Velocidad</span><select id="vp-rate" data-vp="rate">${[0.8, 0.85, 0.9, 0.92, 0.95, 1, 1.05].map(r => `<option value="${r}" ${+VP.rate === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
          <label class="field"><span>Tono</span><select id="vp-pitch" data-vp="pitch">${[0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1].map(r => `<option value="${r}" ${+VP.pitch === r ? 'selected' : ''}>${r === 1 ? '1 (normal)' : r}</option>`).join('')}</select></label>
          <label class="field"><span>Pausa entre frases</span><select id="vp-gap" data-vp="gap">${[[300, 'Corta (0,3 s)'], [450, 'Normal (0,45 s)'], [700, 'Larga (0,7 s)'], [1000, 'Muy larga (1 s)']].map(([v, l]) => `<option value="${v}" ${+VP.gap === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <div class="row">${btn('Probar las voces', 'data-audio="test"', '', 'play')}</div>
      </div>
    </details>
    ${PL.showScript ? `<div class="transcript" id="pl-tr">${scr.filter((s, i, a) => i === 0 || s.line !== a[i - 1].line || !s.line).map(s => `<p class="${curStep && (curStep === s || (curStep.line && curStep.line === s.line)) ? 'cur' : ''}"><b>${esc(s.who === '__narrator' ? 'Narrator' : s.who)}:</b> ${esc(s.line ? s.line.text : s.say)}</p>`).join('')}</div>` : ''}
    <p class="small muted">Voces en uso: ${esc(Array.from(new Set(Object.values(cast).filter(Boolean).map(v => v.name))).slice(0, 4).join(', ') || '—')}.</p>`;
  }
  box.innerHTML = `<div class="player">
    <div class="chips">${parts.map(p => `<button type="button" class="chip" data-lpart="${p.id}" aria-pressed="${p.id === PL.pid}">${esc(ex.parts[p.id].label)} · ${esc(ex.parts[p.id].title)}</button>`).join('')}</div>
    ${live}
    <div class="row small">
      <label class="row"><input type="checkbox" id="pl-short" ${PL.short ? 'checked' : ''}> Pausas de lectura cortas</label>
      <label class="row"><input type="checkbox" id="pl-script" ${PL.showScript ? 'checked' : ''}> Mostrar transcripción (para ti)</label>
    </div>
    ${audioDownloadHtml(sess)}
  </div>`;
}

function paintPlayerStatus() {
  const n = $('#pl-now'); if (!n) return;
  if (S.view !== 'session' || S.sessTab !== 'audio') return;
  const needsFull = !!$('#player .btn.primary.big') || ($('[data-audio="skip"]') ? 0 : 1) !== (PL.count ? 0 : 1) || PL.showScript;
  if (needsFull) { paintPlayer(); return; }
  n.textContent = PL.label + (PL.count ? ` · ${PL.count} s` : '');
}
</script>

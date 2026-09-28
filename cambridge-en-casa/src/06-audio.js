<script>
/* =========================================================
   Listening audio with the device's English voices
   ========================================================= */
const TTS = {
  ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
  voices: [],
  init() {
    if (!this.ok) return;
    const load = () => {
      try { this.voices = speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang)); } catch (e) { this.voices = []; }
      if (S.view === 'session' && S.sessTab === 'audio') paintPlayer();
    };
    load();
    try { speechSynthesis.addEventListener('voiceschanged', load); } catch (e) { speechSynthesis.onvoiceschanged = load; }
  },
  gender(v) {
    const n = v.name.toLowerCase();
    if (/female|woman|samantha|karen|kate|serena|moira|tessa|victoria|susan|zira|hazel|libby|sonia|jenny|aria|fiona|martha|stephanie|catherine|nicky|allison|ava|emma|olivia|amy|salli|joanna|kimberly|shelley|sandy|flo|natasha|clara|maisie|abbie|bella|hollie|sienna|isla|heather/.test(n)) return 'f';
    if (/\bmale|daniel|alex|fred|oliver|arthur|george|ryan|guy|david|mark|thomas|lee|rishi|aaron|james|brian|matthew|justin|joey|tom|reed|rocko|eddy|ralph|william|liam|noah|elliot|ethan|alfie|jack|harry|connor/.test(n)) return 'm';
    return '?';
  },
  rank(v) {
    let r = 0;
    if (/en[-_]GB/i.test(v.lang)) r += 30; else if (/en[-_](IE|AU|NZ|ZA)/i.test(v.lang)) r += 16; else if (/en[-_]US/i.test(v.lang)) r += 10;
    if (/enhanced|premium|natural|neural|online/i.test(v.name)) r += 8;
    if (/google/i.test(v.name)) r += 3;
    if (/bad news|bells|boing|bubbles|cellos|wobble|whisper|zarvox|trinoids|organ|jester|superstar|bahh|albert|hysterical|good news|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i.test(v.name)) r -= 100;
    return r;
  },
  ranked(g) { return this.voices.filter(v => g === '?' || this.gender(v) === g).sort((a, b) => this.rank(b) - this.rank(a)); },
  cast(speakers) {
    const map = {};
    const all = this.ranked('?');
    const narrator = this.ranked('f')[0] || all[0] || null;
    map.__narrator = narrator;
    const used = { f: 0, m: 0, '?': 0 };
    for (const sp of speakers) {
      if (map[sp.name] !== undefined) continue;
      const g = sp.gender === 'm' || sp.gender === 'f' ? sp.gender : '?';
      let pool = this.ranked(g).filter(v => v !== narrator);
      if (!pool.length) pool = this.ranked(g);
      if (!pool.length) pool = all;
      map[sp.name] = pool.length ? pool[used[g] % pool.length] : null;
      used[g]++;
    }
    return map;
  }
};

function chunkText(t) {
  const sents = String(t || '').replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [];
  const out = []; let cur = '';
  for (const s of sents) { if ((cur + s).length > 220 && cur) { out.push(cur.trim()); cur = ''; } cur += s; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function listeningProgram(sess, part, short) {
  const ex = EXAMS[sess.level], P = ex.parts[part.id], B2 = sess.level === 'B2';
  const steps = [];
  const N = (t, label) => t && steps.push({ say: t, who: '__narrator', label: label || 'Instrucciones' });
  const pause = (s, label) => steps.push({ pause: short ? Math.max(3, Math.round(s / 3)) : s, label });
  const lines = (script, label, fallback) => {
    for (const l of scriptLines(script)) {
      const who = l.speaker || fallback?.name || 'Speaker';
      const gender = l.gender || fallback?.gender;
      for (const c of chunkText(l.text)) steps.push({ say: c, who, gender, label, line: l });
    }
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
        N(q.speaker || `Speaker ${q.n - part.questions[0].n + 1}`, `${q.speaker} · ${pass === 1 ? 'primera' : 'segunda'} vez`);
        lines([{ speaker: q.speaker, gender: q.gender, text: typeof q.script === 'string' ? q.script : scriptLines(q.script).map(l => l.text).join(' ') }], `${q.speaker} · ${pass === 1 ? 'primera' : 'segunda'} vez`);
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
  return { steps, cast: TTS.cast(speakers) };
}

const PL = { sessId: null, pid: null, run: 0, i: 0, state: 'idle', label: '', count: 0, short: false, rate: 0.95, showScript: false, skip: false };

function speakOnce(text, voice, rate) {
  return new Promise(res => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-GB';
    u.rate = rate;
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
  Object.assign(PL, { sessId, pid, i: 0, state: 'playing', steps: prog.steps, cast: prog.cast });
  paintPlayer();
  for (let i = 0; i < prog.steps.length; i++) {
    if (run !== PL.run) return;
    PL.i = i; const st = prog.steps[i]; PL.label = st.label || PL.label;
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
    await speakOnce(st.say, prog.cast[st.who] || prog.cast.__narrator, PL.rate);
  }
  if (run === PL.run) { PL.state = 'idle'; PL.label = 'Terminado'; paintPlayer(); }
}
function pauseAudio() {
  if (PL.state === 'playing') { PL.state = 'paused'; try { speechSynthesis.pause(); } catch (e) {} }
  else if (PL.state === 'paused') { PL.state = 'playing'; try { speechSynthesis.resume(); } catch (e) {} }
  paintPlayer();
}
function stopAudio() { PL.run++; PL.state = 'idle'; PL.count = 0; try { speechSynthesis.cancel(); } catch (e) {} }
</script>

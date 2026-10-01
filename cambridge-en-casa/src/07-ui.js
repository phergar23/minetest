<script>
/* =========================================================
   State
   ========================================================= */
const S = {
  db: null, sample: undefined, dl: null, imagesOk: false, imgMax: 4, dbState: 'loading',
  students: {}, sessions: {}, notebooks: {},
  cur: null, view: 'today', openId: null, sessTab: 'preview', listFilter: 'all',
  gen: {}, pick: {}, drafts: {}, busy: {}, errors: {}, confirmDel: null, filled: {}
};

/* =========================================================
   Persistence
   ========================================================= */
function handleWriteErr(e) {
  console.warn('db write', e);
  if (e && e.code === 'quota_exceeded') toast('El almacenamiento está lleno: borra sesiones antiguas en «Sesiones».');
  else if (e && e.code === 'invalid_argument') toast('No tienes permiso para guardar cambios en esta app.');
  else toast('No se pudo guardar. Revisa la conexión.');
}
async function writeDoc(path, body) { if (!S.db) return; try { await S.db.doc(path).set(clone(body)); } catch (e) { handleWriteErr(e); } }
async function saveSession(id, data) { const b = stripId(data); S.sessions[id] = Object.assign({ id }, b); await writeDoc('sessions/' + id, b); }
async function saveNotebook(stId, nb) { S.notebooks[stId] = nb; await writeDoc('notebooks/' + stId, nb); }
async function saveStudent(id, data) { const b = stripId(data); S.students[id] = Object.assign({ id }, b); await writeDoc('students/' + id, b); }
async function deleteSession(id) {
  delete S.sessions[id];
  if (S.db) { try { await S.db.doc('sessions/' + id).delete(); } catch (e) { handleWriteErr(e); } }
}
function saveDraftLocal(id, val) { try { if (val) localStorage.setItem('cec-draft-' + id, JSON.stringify(val)); else localStorage.removeItem('cec-draft-' + id); } catch (e) {} }
function loadDraftLocal(id) { try { const v = localStorage.getItem('cec-draft-' + id); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function draftOf(id) { if (!S.drafts[id]) S.drafts[id] = loadDraftLocal(id) || Object.assign({}, S.sessions[id]?.answers || {}); return S.drafts[id]; }
let draftTimer = null;
function touchDraft(id) { clearTimeout(draftTimer); draftTimer = setTimeout(() => saveDraftLocal(id, S.drafts[id]), 400); }

/* =========================================================
   Small UI helpers
   ========================================================= */
let toastTimer = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200); }
const ICON = {
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 14h6M9 18h4"/></svg>',
  sheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><rect x="7" y="7" width="4" height="2.5" rx="1.2"/><rect x="13" y="7" width="4" height="2.5" rx="1.2"/><rect x="7" y="12" width="4" height="2.5" rx="1.2"/><rect x="13" y="12" width="4" height="2.5" rx="1.2"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-5a3 3 0 00-3 3"/><path d="M20 4v14h-6"/></svg>'
};
function btn(label, attrs = '', cls = '', icon = '') { return `<button type="button" class="btn ${cls}" ${attrs}>${icon ? ICON[icon] : ''}${esc(label)}</button>`; }
function partShort(id, P) { return `${P.paper === 'Listening' ? 'Listening' : id.startsWith('U') ? 'UoE' : 'Reading'} ${P.label.replace('Part ', 'P')}`; }
function exportDocs() {
  const docs = {};
  for (const [id, v] of Object.entries(S.students)) docs['students/' + id] = stripId(v);
  for (const [id, v] of Object.entries(S.sessions)) docs['sessions/' + id] = stripId(v);
  for (const [id, v] of Object.entries(S.notebooks)) docs['notebooks/' + id] = v;
  return docs;
}
function studentList() { return Object.values(S.students).sort((a, b) => (a.order || 99) - (b.order || 99) || String(a.name).localeCompare(b.name)); }
function curStudent() { return S.students[S.cur] || null; }
function todayKey() { return dateKey(); }
function todaySkill(st) { return planOf(st)[new Date().getDay()]; }
function statusPill(sess) {
  if (sess.status === 'corrected') return `<span class="pill done">${ICON.check.replace('<svg', '<svg width="12" height="12"')} ${sess.results?.pct ?? 0}%</span>`;
  return `<span class="pill todo">Por corregir</span>`;
}
function sessTitle(sess) {
  const ex = EXAMS[sess.level];
  if (sess.skill === 'writing') return `Writing · Part ${sess.writing?.part || ''} ${sess.writing?.type === 'choice' ? '(a elegir)' : sess.writing?.type ? '· ' + sess.writing.type : ''}`;
  if (sess.skill === 'speaking') return 'Speaking · 4 partes';
  return (sess.parts || []).map(p => `${ex.parts[p.id].paper === 'Listening' ? 'L' : 'P'}${ex.parts[p.id].label.replace('Part ', '')}`).join(' · ');
}
function sessTopics(sess) {
  return [...(sess.parts || []).map(p => p.topic || p.title), sess.writing?.topic, sess.speaking?.topic].filter(Boolean).join(' · ');
}
function pendingFor(stId) { return studentSessions(stId).filter(s => s.status !== 'corrected' && s.dateKey < todayKey()); }
function todaysFor(stId) { return studentSessions(stId).filter(s => s.dateKey === todayKey()); }

/* =========================================================
   Render: students + nav
   ========================================================= */
function renderStudents() {
  const box = $('#students'); const list = studentList();
  if (!list.length) { box.innerHTML = ''; return; }
  box.innerHTML = list.map(st => {
    const ex = EXAMS[st.level] || EXAMS.B2;
    const pend = pendingFor(st.id).length, today = todaysFor(st.id);
    const g = S.gen[st.id];
    let state = '';
    if (g && g.running) state = '<span class="pill info">Generando…</span>';
    else if (pend) state = `<span class="pill todo">${pend} por corregir</span>`;
    else if (today.length) state = today.some(s => s.status === 'corrected') ? '<span class="pill done">Hoy: hecha</span>' : '<span class="pill plain">Hoy: lista</span>';
    return `<button type="button" class="cand" data-student="${esc(st.id)}" aria-pressed="${st.id === S.cur}">
      <span class="av" aria-hidden="true">${esc((st.name || '?').charAt(0).toUpperCase())}</span>
      <span class="who"><b>${esc(st.name)}</b><span>${esc(ex.name)} · ${esc(SKILLS[todaySkill(st)]?.es || '')} hoy</span></span>
      <span class="state">${state}</span>
    </button>`;
  }).join('');
}
function renderNav() {
  $$('#nav button').forEach(b => b.setAttribute('aria-current', (b.dataset.view === S.view || (S.view === 'session' && b.dataset.view === 'sessions')) ? 'page' : 'false'));
  const t = new Date();
  $('#today-label').textContent = `${DOW_ES[t.getDay()].replace(/^./, c => c.toUpperCase())} ${t.getDate()} de ${MONTHS_ES[t.getMonth()]} · entrenamiento diario B1 · B2`;
}
function renderBanner() {
  const b = $('#banner'); const msgs = [];
  if (S.dbState === 'none' && !window.__LOCAL__) msgs.push('<div class="notice warn">No hay almacenamiento en esta vista: lo que hagas no se guardará. Abre la app desde claude.ai para conservar sesiones y progreso.</div>');
  if (window.__LOCAL__ && !window.LOCAL_CFG.key) msgs.push('<div class="notice">Versión local sin clave de API: puedes abrir e imprimir las sesiones y crear los <b>MP3 del listening</b> (pestaña Audio de cada sesión). Para generar o corregir sesiones usa la versión web con tu suscripción, o pon una clave de API en Ajustes (se paga aparte).</div>');
  if (S.dbState === 'revoked') msgs.push('<div class="notice err">Se ha perdido el acceso a los datos. Recarga la página.</div>');
  b.innerHTML = msgs.join('');
  b.hidden = !msgs.length;
  if (msgs.length) b.style.marginBottom = '14px';
}
function renderAll() { renderNav(); renderBanner(); renderStudents(); renderMain(); renderSide(); }

/* =========================================================
   Render: main
   ========================================================= */
function renderMain(force) {
  const m = $('#main');
  const sess = S.openId && S.sessions[S.openId];
  const ae = document.activeElement;
  const typing = S.view === 'settings' || (S.view === 'session' && sess && S.sessTab === 'correct' && sess.status !== 'corrected' && !S.busy[S.openId]) || (S.view === 'today' && ae && (ae.id === 'g-custom' || ae.id === 's-note'));
  if (!force && typing && m.dataset.sig === `${S.view}|${S.openId}|${S.sessTab}`) return;
  m.dataset.sig = `${S.view}|${S.openId}|${S.sessTab}`;
  if (S.dbState === 'loading') { m.innerHTML = '<div class="card empty">Cargando…</div>'; return; }
  if (!studentList().length && S.view !== 'settings') { m.innerHTML = setupHtml(); return; }
  if (S.view === 'today') m.innerHTML = todayHtml();
  else if (S.view === 'sessions') m.innerHTML = sessionsHtml();
  else if (S.view === 'session') m.innerHTML = sess ? sessionHtml(sess) : '<div class="card empty">Esta sesión ya no existe.</div>';
  else if (S.view === 'progress') m.innerHTML = progressHtml();
  else if (S.view === 'settings') m.innerHTML = settingsHtml();
  if (S.view === 'session' && S.sessTab === 'audio') paintPlayer();
}

function setupHtml() {
  return `<section class="card stack">
    <div><p class="eyebrow">Primer paso</p><h2 class="h2">Añade a tus alumnos</h2></div>
    <p class="muted">Cada alumno tiene su nivel (B1 Preliminary o B2 First for Schools), su plan semanal y su cuaderno de errores.</p>
    <form id="add-student" class="form-grid">
      <label class="field"><span>Nombre</span><input id="new-name" required placeholder="Nombre"></label>
      <label class="field"><span>Nivel</span><select id="new-level"><option value="B2">B2 First for Schools</option><option value="B1">B1 Preliminary for Schools</option></select></label>
      <div class="field"><span>&nbsp;</span><button class="btn primary" type="submit">Añadir alumno</button></div>
    </form>
  </section>`;
}

function chosenTopic(st, pick) {
  if (!pick || !pick.grammar) return null;
  if (pick.grammar === 'custom') {
    const t = String(pick.grammarText || '').trim();
    return t ? { id: 'custom-' + tagKey(t).slice(0, 40), en: t, es: t, tag: 'accuracy', custom: true } : null;
  }
  return allGrammar().find(t => t.id === pick.grammar) || null;
}

function grammarPickerHtml(st, pick, autoTopic) {
  const done = new Set(st.grammarDone || []);
  const order = st.level === 'B2' ? ['B2', 'C1', 'B1'] : ['B1', 'B2', 'C1'];
  const groups = order.map(lv => `<optgroup label="${lv}">${GRAMMAR[lv].map(t => `<option value="${t.id}" ${pick.grammar === t.id ? 'selected' : ''}>${done.has(t.id) ? '✓ ' : ''}${esc(t.es)}</option>`).join('')}</optgroup>`).join('');
  return `<div class="form-grid">
      <label class="field"><span>Gramática de hoy</span><select id="g-topic" data-gpick="1">
        <option value="" ${!pick.grammar ? 'selected' : ''}>Automática · toca: ${esc(autoTopic.es)}</option>
        <option value="custom" ${pick.grammar === 'custom' ? 'selected' : ''}>Otro tema (lo escribo yo)…</option>
        ${groups}
      </select></label>
      ${pick.grammar === 'custom' ? `<label class="field"><span>Tema de gramática</span><input id="g-custom" data-gtext="1" value="${esc(pick.grammarText || '')}" placeholder="p. ej. past perfect y narrative tenses" autocomplete="off"></label>` : ''}
    </div>
    <label class="field"><span>Indicaciones para esta sesión (opcional)</span><input id="s-note" data-snote="1" value="${esc(pick.note || '')}" placeholder="p. ej. examen del colegio el viernes: unidad 3, viajes y transporte" autocomplete="off"></label>
    <p class="small muted" style="margin-top:-6px">Los temas con ✓ ya los ha trabajado. Elegir uno a mano no rompe la secuencia: al día siguiente sigue con el siguiente pendiente.</p>`;
}

function genPick(st) {
  const k = st.id;
  if (!S.pick[k] || S.pick[k].day !== todayKey()) {
    let skill = todaySkill(st); if (skill === 'rest') skill = 'use';
    S.pick[k] = { day: todayKey(), skill, parts: autoParts(st, skill) };
  }
  return S.pick[k];
}

function todayHtml() {
  const st = curStudent(); if (!st) return '';
  const ex = EXAMS[st.level] || EXAMS.B2;
  const now = new Date(), planned = todaySkill(st), rest = planned === 'rest';
  const pick = genPick(st), g = S.gen[st.id];
  const pend = pendingFor(st.id), today = todaysFor(st.id);
  const examMin = pick.skill === 'writing' ? 15 : pick.skill === 'speaking' ? (st.level === 'B2' ? 14 : 12) : sessionMinutes(st.level, pick.parts);
  const mins = GRAMMAR_MIN + examMin, maxMin = +st.minutes || 20;
  const autoTopic = pickGrammarTopic(st), manual = chosenTopic(st, pick);
  const topic = manual || autoTopic;
  const pools = POOLS[st.level];
  const candidates = pick.skill === 'mock' ? examOrder(st.level, Array.from(new Set([...pools.use, ...pools.reading, ...pools.listening]))) : (pools[pick.skill] || []);
  const others = studentList().filter(s => s.id !== st.id);

  let html = `<section class="card stack">
    <div class="today-head">
      <div class="stack" style="gap:6px">
        <p class="eyebrow">Hoy · ${esc(niceDate(todayKey()))} · ${esc(st.name)}</p>
        <h2 class="today-skill">${rest ? 'Día de descanso' : esc(SKILLS[planned].es)}</h2>
        <p class="muted">${rest ? 'Toca inglés suave: una serie, un vídeo o una lectura. Si aun así quieres una sesión, elige la destreza abajo.' : esc(SKILLS[planned].desc) + ' · ' + esc(ex.name)}</p>
      </div>
    </div>
    <div class="routine">
      <div><b>Corrige la de ayer</b>Foto de la hoja de respuestas o márcalas tú. La app corrige y explica.</div>
      <div><b>Imprime la corrección</b>Original corregido, por qué falló y ejercicios de refuerzo.</div>
      <div><b>Genera la de hoy</b>5 min de gramática + práctica de examen (máx. ${maxMin} min). Imprime ejercicios + hoja.</div>
    </div>`;
  if (pend.length) {
    html += `<div class="notice warn stack" style="gap:8px"><b>Pendiente de corregir</b>${pend.slice(0, 3).map(s => `<div class="spread"><span>${esc(SKILLS[s.skill]?.es)} · ${esc(niceDate(s.dateKey))}</span>${btn('Corregir', `data-open="${s.id}" data-tab="correct"`, '', 'check')}</div>`).join('')}</div>`;
  }
  html += `</section>`;

  if (today.length) {
    html += `<section class="card stack"><div class="spread"><h3 class="h3">Sesión de hoy</h3></div>`;
    for (const s of today) html += sessionQuick(s);
    html += `</section>`;
  }

  html += `<section class="card stack" id="gen-box">
    <div class="spread"><h3 class="h3">${today.length ? 'Generar otra sesión' : 'Generar la sesión de hoy'}</h3><span class="pill ${mins > maxMin ? 'todo' : 'plain'}">≈ ${mins} min · ${GRAMMAR_MIN} de gramática + ${examMin}${mins > maxMin ? ` · pasa de ${maxMin}` : ''}</span></div>
    <div class="stack" style="gap:8px">
      <span class="small muted">Destreza</span>
      <div class="chips" role="group" aria-label="Destreza">${SKILL_KEYS.map(k => `<button type="button" class="chip" data-skill="${k}" aria-pressed="${pick.skill === k}">${esc(SKILLS[k].es)}${k === planned ? ' <small>plan</small>' : ''}</button>`).join('')}</div>
    </div>`;
  if (candidates.length) {
    const last = lastDoneMap(st.id);
    html += `<div class="stack" style="gap:8px">
      <span class="small muted">Partes del examen (elegidas automáticamente entre las menos practicadas para no pasar de ${maxMin} min; puedes cambiarlas)</span>
      <div class="chips" role="group" aria-label="Partes">${candidates.map(id => { const P = ex.parts[id]; return `<button type="button" class="chip" data-part="${id}" aria-pressed="${pick.parts.includes(id)}" title="${esc(P.es)}${last[id] ? ' · última vez ' + esc(shortDate(dateKey(new Date(last[id])))) : ' · nunca'}">${partShort(id, P)} · ${esc(P.title)}<small>${P.minutes}′</small></button>`; }).join('')}</div>
    </div>`;
  }
  html += grammarPickerHtml(st, pick, autoTopic);
  const dlist = pick.skill === 'writing' ? [`W${nextWritingPart(st)}`] : pick.parts;
  const dtxt = dlist.length ? Array.from(new Set(dlist.map(id => DIFF_ES[diffOf(st, id)]))).join(' / ') : DIFF_ES[2];
  html += `<div class="meta-line"><span>Dificultad: <b>${esc(dtxt)}</b></span><span>Gramática de hoy: <b>${esc(topic.es)}</b>${manual ? ' (elegida a mano)' : ''}</span>${pick.skill === 'writing' ? `<span>Toca: <b>Writing Part ${nextWritingPart(st)}</b></span>` : ''}</div>`;
  if (g && (g.running || g.error)) {
    html += `<div class="stack" style="gap:8px"><div class="steps">${g.steps.map(s => `<div class="step ${s.state}"><span class="dot" aria-hidden="true"></span><span>${esc(s.label)}${s.state === 'error' ? ` — <span class="muted">${esc(s.msg || '')}</span>` : ''}</span></div>`).join('')}</div>
      ${g.running ? `<p class="small muted">Claude está escribiendo textos originales y comprobando cada respuesta. Suele tardar 1–3 minutos; puedes seguir usando la app.</p>` : ''}
      ${g.error ? `<div class="notice err">${esc(g.error)}</div>` : ''}</div>`;
  }
  const canGen = !(g && g.running) && (pick.skill === 'writing' || pick.skill === 'speaking' || pick.parts.length > 0);
  html += `<div class="row">
      ${g && g.running ? btn('Cancelar', `data-cancel-gen="${st.id}"`, '') : btn(`Generar sesión de ${st.name}`, `data-generate="${st.id}" ${canGen ? '' : 'disabled'}`, 'primary big', 'spark')}
      ${others.length && !(g && g.running) ? btn(`Generar la de hoy para ${[st, ...others].map(s => s.name).join(' y ')}`, 'data-generate-all="1"', '') : ''}
    </div>
    ${S.sample === null ? '<p class="small muted">Para generar y corregir, abre la app dentro de claude.ai (la primera vez te pedirá permiso para usar Claude).</p>' : ''}
  </section>`;
  return html;
}

function sessionQuick(s) {
  const pdfs = s.skill === 'speaking'
    ? btn('Guion examinador', `data-pdf="examiner" data-id="${s.id}"`, '', 'pdf') + btn('Hoja del alumno', `data-pdf="exam" data-id="${s.id}"`, '', 'pdf')
    : btn(s.skill === 'writing' ? 'Imprimir tarea + hojas' : 'Imprimir ejercicios + hoja', `data-pdf="pack" data-id="${s.id}"`, 'primary', 'pdf') + btn('Soluciones (para ti)', `data-pdf="solutions" data-id="${s.id}"`, '', 'key');
  return `<div class="stack" style="gap:10px;border-top:1px dashed var(--line);padding-top:12px">
    <div class="spread"><div><b>${esc(SKILLS[s.skill]?.es)}</b> · <span class="muted">${esc(sessTitle(s))}</span><div class="small muted">${esc(sessTopics(s))}</div></div>${statusPill(s)}</div>
    <div class="row">${pdfs}${(s.parts || []).some(p => p.id.startsWith('L')) ? btn('Audio', `data-open="${s.id}" data-tab="audio"`, '', 'play') : ''}${s.status === 'corrected' ? btn('PDF corrección', `data-pdf="correction" data-id="${s.id}"`, '', 'pdf') : ''}${btn('Abrir', `data-open="${s.id}"`, 'ghost')}</div>
  </div>`;
}

function sessionsHtml() {
  const st = curStudent(); if (!st) return '';
  let list = studentSessions(st.id);
  if (S.listFilter === 'todo') list = list.filter(s => s.status !== 'corrected');
  if (S.listFilter === 'done') list = list.filter(s => s.status === 'corrected');
  const chip = (k, l) => `<button type="button" class="chip" data-filter="${k}" aria-pressed="${S.listFilter === k}">${l}</button>`;
  return `<section class="card stack">
    <div class="spread"><h2 class="h2">Sesiones de ${esc(st.name)}</h2><div class="chips">${chip('all', 'Todas')}${chip('todo', 'Por corregir')}${chip('done', 'Corregidas')}</div></div>
    ${list.length ? `<div class="slist">${list.map(s => { const d = fromKey(s.dateKey); return `<button type="button" class="sitem" data-open="${s.id}">
      <span class="date"><b>${d.getDate()}</b>${esc(MONTHS_ES[d.getMonth()].slice(0, 3))} · ${esc(DOW_ES[d.getDay()].slice(0, 3))}</span>
      <span style="min-width:0"><span class="t">${esc(SKILLS[s.skill]?.es)} · ${esc(sessTitle(s))}</span><span class="d" style="display:block">${esc(sessTopics(s))}</span></span>
      <span>${s.status === 'corrected' ? `<span class="score">${s.results?.score}/${s.results?.max}</span>` : ''} ${statusPill(s)}</span>
    </button>`; }).join('')}</div>` : '<p class="empty">Aún no hay sesiones. Genera la primera desde «Hoy».</p>'}
  </section>`;
}

/* ---------- Session view ---------- */
function sessionHtml(sess) {
  const st = S.students[sess.studentId] || { name: '' };
  const ex = EXAMS[sess.level];
  const isL = (sess.parts || []).some(p => p.id.startsWith('L'));
  const tabs = [['preview', 'Vista previa']];
  if (isL) tabs.push(['audio', 'Audio']);
  tabs.push(['correct', sess.status === 'corrected' ? 'Resultados' : 'Corregir']);
  if (!tabs.some(t => t[0] === S.sessTab)) S.sessTab = 'preview';
  const busy = S.busy[sess.id], err = S.errors[sess.id];
  let actions = '';
  if (sess.skill === 'speaking') actions = btn('Guion examinador', `data-pdf="examiner" data-id="${sess.id}"`, 'primary', 'pdf') + btn('Hoja del alumno', `data-pdf="exam" data-id="${sess.id}"`, '', 'pdf');
  else if (sess.skill === 'writing') actions = btn('Imprimir tarea + hojas', `data-pdf="pack" data-id="${sess.id}"`, 'primary', 'pdf') + btn('Modelo (para ti)', `data-pdf="solutions" data-id="${sess.id}"`, '', 'key');
  else actions = btn('Imprimir ejercicios + hoja', `data-pdf="pack" data-id="${sess.id}"`, 'primary', 'pdf') + btn('Solo hoja de respuestas', `data-pdf="sheet" data-id="${sess.id}"`, '', 'sheet') + btn('Soluciones (para ti)', `data-pdf="solutions" data-id="${sess.id}"`, '', 'key');
  if (sess.status === 'corrected') actions += btn('PDF corrección', `data-pdf="correction" data-id="${sess.id}"`, 'primary', 'pdf');
  let html = `<section class="card stack">
    <div class="row">${btn('Sesiones', 'data-view-go="sessions"', 'ghost', 'back')}</div>
    <div class="spread"><div class="stack" style="gap:4px"><p class="eyebrow">${esc(st.name)} · ${esc(niceDate(sess.dateKey))} · ${esc(ex.name)}</p><h2 class="h2">${esc(SKILLS[sess.skill]?.es)} · ${esc(sessTitle(sess))}</h2><p class="muted small">${esc(sessTopics(sess))}${sess.minutes ? ' · ≈ ' + sess.minutes + ' min' : ''}</p></div>
      <div class="stack" style="gap:6px;justify-items:end">${statusPill(sess)}${sess.status === 'corrected' ? `<span class="score" style="font-size:22px">${sess.results?.score}/${sess.results?.max}</span>` : ''}</div></div>
    <div class="row">${actions}</div>`;
  if ((sess.failed || []).length) html += `<div class="notice err stack" style="gap:6px"><b>No se pudo generar ${sess.failed.length === 1 ? 'una parte' : 'algunas partes'}</b><div class="row">${sess.failed.map(pid => btn('Reintentar ' + ex.parts[pid].label + ' · ' + ex.parts[pid].title, `data-retry="${pid}" data-id="${sess.id}" ${busy ? 'disabled' : ''}`)).join('')}</div></div>`;
  if (busy) html += `<div class="notice"><span class="step running" style="display:inline-flex"><span class="dot"></span> ${esc(busy)}</span></div>`;
  if (err) html += `<div class="notice err">${esc(err)}</div>`;
  html += `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab-go="${k}" aria-current="${S.sessTab === k}">${l}</button>`).join('')}</div>`;
  if (S.sessTab === 'preview') html += previewHtml(sess);
  else if (S.sessTab === 'audio') html += '<div id="player"></div>';
  else html += sess.status === 'corrected' ? resultsHtml(sess) : correctHtml(sess);
  html += `<div class="row" style="justify-content:flex-end">${S.confirmDel === sess.id
    ? `<div class="confirm">¿Borrar esta sesión y sus resultados? ${btn('Sí, borrar', `data-del-yes="${sess.id}"`, 'danger')}${btn('No', 'data-del-no="1"', 'ghost')}</div>`
    : btn('Borrar sesión', `data-del="${sess.id}"`, 'ghost danger')}</div>`;
  html += `</section>`;
  return html;
}

function paraHtml(t, gapFn) {
  return String(t || '').split(/\n{2,}/).map(p => `<p>${gapFn ? gapFn(esc(p)) : esc(p)}</p>`).join('');
}
const gapMark = s => s.replace(/\[\[(\d+)\]\]/g, (m, n) => `<span class="gap">(${n}) ______</span>`);

function previewHtml(sess) {
  const ex = EXAMS[sess.level];
  let h = '<div class="paper">';
  if (sess.grammar) { const g = sess.grammar; h += `<h5>Gramática del día · ${esc(g.title)}</h5>${paraHtml(g.explanation)}${(g.forms || []).length ? `<ul>${g.forms.map(f => `<li><b>${esc(f.form)}</b> · <i>${esc(f.example)}</i></li>`).join('')}</ul>` : ''}${g.tip ? `<p class="ins">Ojo: ${esc(g.tip)}</p>` : ''}<ol>${g.items.map(r => `<li>${esc(r.prompt)}${r.options ? ` <span class="opt">${Object.entries(r.options).map(([k, v]) => `${k} ${esc(v)}`).join(' · ')}</span>` : ''}</li>`).join('')}</ol><hr class="sep">`; }
  if (sess.review) h += `<h5>Warm-up · repaso</h5><ol>${sess.review.items.map(r => `<li>${esc(r.prompt)}${r.options ? ` <span class="opt">${Object.entries(r.options).map(([k, v]) => `${k} ${esc(v)}`).join(' · ')}</span>` : ''}</li>`).join('')}</ol><hr class="sep">`;
  if (sess.skill === 'writing') {
    const w = sess.writing || {};
    h += `<h5>Writing Part ${w.part} · ${esc(w.words)} words</h5>`;
    if (w.type === 'choice') h += (w.options || []).map((o, i) => `<p><b>${i + 2} (${esc(o.type)})</b> ${esc(o.text)}</p>`).join('');
    else if (w.type === 'email') h += `<p class="ins">${esc(w.context)}</p><p><b>${esc(w.email?.subject)}</b></p>${paraHtml(w.email?.body)}<ul>${(w.notes || []).map(n => `<li>“${esc(n.after)}” → <b>${esc(n.note)}</b></li>`).join('')}</ul><p>${esc(w.instruction)}</p>`;
    else h += `<p class="ins">${esc(w.context)}</p><p>${esc(w.instruction)}</p><p><b>${esc(w.question)}</b></p><ol>${(w.notes || []).map(n => `<li>${esc(n)}</li>`).join('')}</ol>`;
    return h + '</div>';
  }
  if (sess.skill === 'speaking') {
    const sp = sess.speaking || {};
    h += `<h5>Part 1 · Interview</h5><ul>${(sp.part1?.questions || []).map(q => `<li>${esc(q)}</li>`).join('')}</ul>
      <h5>Part 2</h5><p><b>${esc(sp.part2?.question)}</b></p>${(sp.part2?.photos || []).map(p => `<p>Foto ${esc(p.label)}: ${esc(p.description)} · <a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(p.search || p.description || '')}" target="_blank" rel="noopener">buscar imagen</a></p>`).join('')}
      <h5>Part 3</h5><p>${esc(sp.part3?.situation)}</p><p><b>${esc(sp.part3?.question)}</b></p><ul>${(sp.part3?.prompts || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul><p><i>${esc(sp.part3?.decision)}</i></p>
      <h5>Part 4</h5><ul>${(sp.part4?.questions || []).map(q => `<li>${esc(q)}</li>`).join('')}</ul>`;
    return h + '</div>';
  }
  for (const part of sess.parts || []) {
    const P = ex.parts[part.id];
    h += `<h5>${esc(P.paper)} · ${esc(P.label)}: ${esc(P.title)}</h5><p class="ins">${esc(part.intro || '')} ${esc(fill(P.ins, P))}</p>`;
    if (part.title) h += `<p><b>${esc(part.title)}</b></p>`;
    if (part.text) h += paraHtml(part.text, gapMark);
    const qs = part.questions;
    switch (P.kind) {
      case 'mcq-cloze': h += `<ol start="${P.first}">${qs.map(q => `<li value="${q.n}"><span class="opt">${plainLetters(P).map(l => `${l} ${esc(q.options?.[l])}`).join(' · ')}</span></li>`).join('')}</ol>`; break;
      case 'word-formation': h += `<p class="opt">${qs.map(q => `(${q.n}) ${esc(q.stem)}`).join(' · ')}</p>`; break;
      case 'transformation': h += `<ol>${qs.map(q => `<li value="${q.n}">${esc(q.first)}<br><b>${esc(q.keyword)}</b><br>${esc(q.second)}</li>`).join('')}</ol>`; break;
      case 'reading-mc': case 'l-interview': case 'l-extracts': case 'notices':
        h += `<ol>${qs.map(q => `<li value="${q.n}">${q.text ? `<i>${esc(q.textType || '')}</i>: ${esc(q.text)}<br>` : ''}${q.context ? `<i>${esc(q.context)}</i> ` : ''}${esc(q.stem || '')}<br><span class="opt">${plainLetters(P).map(l => `${l} ${esc(q.options?.[l])}`).join(' · ')}</span></li>`).join('')}</ol>`; break;
      case 'gapped': h += `<ul>${plainLetters(P).map(l => `<li><b>${l}</b> ${esc(part.options?.[l])}</li>`).join('')}</ul>`; break;
      case 'matching': case 'people-match':
        h += `<ol>${qs.map(q => `<li value="${q.n}">${q.name ? `<b>${esc(q.name)}</b> ` : ''}${esc(q.stem || q.text || '')}</li>`).join('')}</ol>${(part.sections || []).map(s => `<p><b>${esc(s.id)} ${esc(s.heading || '')}</b> ${esc(s.text)}</p>`).join('')}`; break;
      case 'l-gap': h += `<ol>${qs.map(q => `<li value="${q.n}">${gapMark(esc(q.sentence))}</li>`).join('')}</ol>`; break;
      case 'l-speakers': h += `<ul>${plainLetters(P).map(l => `<li><b>${l}</b> ${esc(part.options?.[l])}</li>`).join('')}</ul><p class="opt">${qs.map(q => `${esc(q.speaker)} (${q.n})`).join(' · ')}</p>`; break;
    }
    h += '<hr class="sep">';
  }
  return h + '</div>';
}

/* ---------- Correction form ---------- */
function answerRows(sess, items) {
  const d = draftOf(sess.id);
  return items.map(it => {
    const v = d[it.key] || '';
    const fl = S.filled[sess.id]?.has(it.key) ? ' filled' : '';
    if (it.type === 'letter') {
      return `<div class="ans-row${fl}"><span class="n">${esc(it.n)}</span><span class="opts" role="group" aria-label="Pregunta ${esc(it.n)}">${it.letters.split('').map(l => `<button type="button" class="loz" data-k="${esc(it.key)}" data-v="${l}" aria-pressed="${v === l}">${l}</button>`).join('')}</span></div>`;
    }
    const wide = it.P?.kind === 'transformation' || it.P?.kind === 'l-gap' || it.review;
    return `<div class="ans-row${wide ? ' wide' : ''}${fl}"><label class="n" for="a-${esc(it.key.replace(':', '-'))}">${esc(it.n)}</label><input id="a-${esc(it.key.replace(':', '-'))}" data-k="${esc(it.key)}" value="${esc(v)}" autocomplete="off" autocapitalize="characters" spellcheck="false"></div>`;
  }).join('');
}

function photoBox(sess, busy) {
  if (S.imagesOk) return `<div class="file-drop">${ICON.cam.replace('<svg', '<svg width="20" height="20"')}<span><b>Foto de la hoja de respuestas</b>: Claude lee las respuestas y rellena la plantilla. Revísala antes de corregir.</span><input type="file" id="sheet-photo" accept="image/jpeg,image/png,image/webp" multiple>${btn('Leer foto', `data-read-photo="${sess.id}" ${busy ? 'disabled' : ''}`, '')}</div>`;
  return `<div class="notice small"><b>Leer desde foto no está disponible aquí.</b> En esta vista de Claude la página no puede enviar imágenes a Claude. Si abres la app en un dispositivo o app de Claude que lo permita, el botón de la foto aparecerá solo en este recuadro. Mientras tanto, usa la <b>entrada rápida</b>: escribe las letras seguidas de cada parte (p. ej. <span class="score">BCADBBAC</span>) y pulsa Intro para pasar al siguiente hueco.</div>`;
}

function answerGroups(sess, groups) {
  let h = '';
  for (const [title, its, pid] of groups) {
    if (!its.length) continue;
    const letters = its.filter(i => i.type === 'letter');
    const quick = letters.length >= 3 ? `<label class="field" style="max-width:420px"><span>Entrada rápida: letras seguidas (${letters.length}; usa - para una en blanco)</span><input data-quick="${esc(pid)}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="p. ej. ${'BCADBBACDA'.slice(0, letters.length)}"></label>` : '';
    h += `<div class="part-block"><h4>${esc(title)}</h4>${quick}<div class="ans-grid">${answerRows(sess, its)}</div></div>`;
  }
  return h;
}

function itemGroups(sess, items) {
  const ex = EXAMS[sess.level], groups = [];
  if (sess.grammar) groups.push([`Grammar · ${sess.grammar.title || sess.grammar.topic}`, items.filter(i => i.grammar), 'GR']);
  if (sess.review) groups.push(['Warm-up · repaso', items.filter(i => i.review), 'RV']);
  for (const part of sess.parts || []) { const P = ex.parts[part.id]; groups.push([`${partShort(part.id, P)} · ${P.title}`, items.filter(i => i.pid === part.id), part.id]); }
  return groups;
}

function correctHtml(sess) {
  const items = sessionItems(sess), busy = S.busy[sess.id];
  const quickItems = answerGroups(sess, itemGroups(sess, items.filter(i => i.grammar || i.review)));
  if (sess.skill === 'speaking') {
    const d = draftOf(sess.id);
    const r = (k, l, h) => `<label class="range"><span><b>${l}</b> <span class="muted small">${h}</span></span><b class="score" id="v-${k}">${d['sp_' + k] ?? 3}</b><input type="range" min="0" max="5" step="1" id="r-${k}" data-sp="${k}" value="${d['sp_' + k] ?? 3}"></label>`;
    return `<div class="stack">
      ${quickItems ? `<p class="muted small">Primero las respuestas de la gramática del día (las escribió en su hoja):</p>${quickItems}<hr class="sep">` : ''}
      <p class="muted">Después del oral, puntúa del 0 al 5 y apunta los errores que oíste (en español o inglés, tal cual). Claude lo convierte en feedback, errores del cuaderno y ejercicios.</p>
      <div class="wr-crit">${r('gv', 'Grammar & Vocabulary', 'variedad y corrección')}${r('dm', 'Discourse', 'respuestas largas y organizadas')}${r('pr', 'Pronunciation', 'se entiende bien')}${r('ic', 'Interaction', 'pregunta, responde, negocia')}</div>
      <label class="field"><span>Notas: errores que has oído, frases que le faltaron, cosas que hizo bien</span><textarea id="sp-notes" data-spnotes="1" placeholder="Ej.: dijo «I am agree», «people is»; en la parte 2 describió pero no comparó; buena fluidez en la 4.">${esc(d.sp_notes || '')}</textarea></label>
      <div class="row">${btn(busy ? 'Generando feedback…' : 'Guardar y generar feedback', `data-grade-speaking="${sess.id}" ${busy ? 'disabled' : ''}`, 'primary big', 'check')}</div>
    </div>`;
  }
  if (sess.skill === 'writing') {
    const w = sess.writing || {}, d = draftOf(sess.id);
    const choice = w.type === 'choice' ? `<div class="stack" style="gap:6px"><span class="small muted">¿Qué tarea eligió?</span><div class="chips">${(w.options || []).map((o, i) => `<button type="button" class="chip" data-wchoice="${i}" aria-pressed="${(+d.w_choice || 0) === i}">Pregunta ${i + 2} · ${esc(o.type)}</button>`).join('')}</div></div>` : '';
    return `<div class="stack">
      ${quickItems ? `<p class="muted small">Respuestas de la gramática del día (las escribió en su hoja):</p>${quickItems}<hr class="sep">` : ''}
      ${choice}
      ${S.imagesOk ? `<div class="file-drop">${ICON.cam.replace('<svg', '<svg width="20" height="20"')}<span><b>Fotos de la redacción</b> (hasta ${S.imgMax}): Claude transcribe el texto a mano y lo corrige.</span><input type="file" id="wr-photo" accept="image/jpeg,image/png,image/webp" multiple></div><p class="small muted">O, si lo prefieres, escríbelo o pégalo aquí:</p>` : '<p class="small muted">Leer la redacción desde una foto no está disponible en esta vista de Claude. Cópiala aquí tal cual, con sus errores (o que la teclee el propio alumno).</p>'}
      <label class="field"><span>Texto de ${esc(S.students[sess.studentId]?.name || '')}</span><textarea id="wr-text" data-wrtext="1" placeholder="Copia aquí la redacción tal cual, con sus errores.">${esc(d.w_text || '')}</textarea></label>
      <div class="row">${btn(busy ? 'Corrigiendo…' : 'Corregir redacción', `data-grade-writing="${sess.id}" ${busy ? 'disabled' : ''}`, 'primary big', 'check')}</div>
    </div>`;
  }
  let h = `<div class="stack">${photoBox(sess, busy)}<p class="small muted">Toca la letra marcada o escribe la palabra; lo que dejes vacío cuenta como «en blanco». También puede rellenarlo el propio alumno al terminar, igual que pasa las respuestas a la hoja en el examen.</p>`;
  h += answerGroups(sess, itemGroups(sess, items));
  h += `<div class="row">${btn(busy ? 'Corrigiendo…' : 'Corregir y generar refuerzo', `data-grade="${sess.id}" ${busy ? 'disabled' : ''}`, 'primary big', 'check')}</div></div>`;
  return h;
}

function resultsHtml(sess) {
  const r = sess.results || {}, fb = sess.feedback || {}, ex = EXAMS[sess.level];
  let h = '<div class="stack">';
  if (r.warn) h += `<div class="notice warn">Corrección automática sin Claude (${esc(r.warn)}). Las explicaciones vienen de la sesión original.</div>`;
  if (fb.parentNote) h += `<div class="notice"><b>Para ti:</b> ${esc(fb.parentNote)}</div>`;
  if (fb.summary) h += `<p>${esc(fb.summary)}</p>`;
  if (sess.skill === 'writing' || sess.skill === 'speaking') {
    const sc = sess.skill === 'writing' ? r.writingScores || {} : r.speakingMarks || {};
    const labels = sess.skill === 'writing' ? [['content', 'Content'], ['communicative', 'Communicative'], ['organisation', 'Organisation'], ['language', 'Language']] : [['gv', 'Grammar & Vocab'], ['dm', 'Discourse'], ['pr', 'Pronunciation'], ['ic', 'Interaction']];
    h += `<div class="tiles">${labels.map(([k, l]) => `<div class="tile"><b>${esc(sc[k] ?? '–')}/5</b><span>${l}</span></div>`).join('')}</div>`;
    if (fb.strengths?.length) h += `<div><b>Bien:</b><ul>${fb.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>`;
    if (fb.improvements?.length) h += `<div><b>Mejorar:</b><ul>${fb.improvements.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>`;
    if (fb.corrections?.length) h += `<div class="part-block"><h4>Correcciones</h4>${fb.corrections.map((c, i) => `<div class="res ko"><span class="n">${i + 1}</span><span><span class="given"><s>${esc(c.original)}</s></span> → <span class="key">${esc(c.corrected)}</span><br><span class="muted small">${esc(c.why)}</span></span></div>`).join('')}</div>`;
    if (r.grammar && sess.grammar) h += `<div class="part-block"><h4>Gramática · ${esc(sess.grammar.title)} · ${r.grammar.score}/${r.grammar.max}</h4>${sessionItems(sess).filter(i => i.grammar).map(it => { const m = r.marks?.[it.key] || { status: 'blank' }, g = sess.answers?.[it.key] || '', ok = m.status === 'correct'; return `<div class="res ${ok ? 'ok' : 'ko'}"><span class="n">${esc(it.n)}</span><span>${ok ? `<span class="given">${esc(givenText(it, g))}</span>` : `<span class="given">${g ? `<s>${esc(givenText(it, g))}</s>` : '<i class="muted">en blanco</i>'}</span> → <span class="key">${esc(keyText(it))}</span><br><span class="muted small">${esc(it.q.explanation || '')}</span>`}</span></div>`; }).join('')}</div>`;
    if (fb.improved) h += `<details class="more"><summary>Texto mejorado</summary><div class="paper" style="margin-top:8px">${paraHtml(fb.improved)}</div></details>`;
  } else {
    h += `<div class="tiles">${Object.entries(r.byPart || {}).map(([pid, b]) => `<div class="tile"><b>${b.score}/${b.max}</b><span>${esc(ex.parts[pid].paper === 'Listening' ? 'Listening' : 'Reading')} ${esc(ex.parts[pid].label)} · ${pct(b.score, b.max)}%</span></div>`).join('')}${r.grammar ? `<div class="tile"><b>${r.grammar.score}/${r.grammar.max}</b><span>Gramática del día</span></div>` : ''}${r.review ? `<div class="tile"><b>${r.review.score}/${r.review.max}</b><span>Warm-up (repaso)</span></div>` : ''}</div>`;
    const items = sessionItems(sess);
    const groups = {};
    for (const it of items) (groups[it.pid] = groups[it.pid] || []).push(it);
    for (const [pid, its] of Object.entries(groups)) {
      const title = pid === 'RV' ? 'Warm-up · repaso' : pid === 'GR' ? `Gramática · ${sess.grammar?.title || ''}` : `${partShort(pid, ex.parts[pid])} · ${ex.parts[pid].title}`;
      h += `<div class="part-block"><h4>${esc(title)}</h4>${its.map(it => {
        const m = r.marks?.[it.key] || { status: 'blank' }, g = sess.answers?.[it.key] || '', ok = m.status === 'correct';
        const e = fb.errors?.[it.key] || {};
        return `<div class="res ${ok ? 'ok' : 'ko'}"><span class="n">${esc(it.n)}</span><span>${ok ? `<span class="given">${esc(givenText(it, g))}</span>` : `<span class="given">${g ? `<s>${esc(givenText(it, g))}</s>` : '<i class="muted">en blanco</i>'}</span> → <span class="key">${esc(keyText(it))}</span>${m.status === 'partial' ? ` <span class="pill info">${m.points}/${it.max}</span>` : ''}<br><span class="muted small">${esc(e.explanation || it.q.explanation || '')}</span>${e.category ? ` <span class="pill plain">${esc(e.category)}</span>` : ''}`}</span></div>`;
      }).join('')}</div>`;
    }
  }
  if (fb.lessons?.length) h += `<div class="part-block"><h4>Mini-lecciones de refuerzo</h4>${fb.lessons.map(l => `<div><b>${esc(l.title)}</b><p class="small">${esc(l.explanation)}</p><p class="small muted"><i>${(l.examples || []).map(esc).join(' · ')}</i></p></div>`).join('')}</div>`;
  if (fb.practice?.length) h += `<div class="part-block"><h4>Ejercicios de refuerzo (${fb.practice.length})</h4><p class="small muted">Van en el PDF de corrección, con las soluciones al final.</p></div>`;
  h += `<div class="row">${btn('PDF corrección para imprimir', `data-pdf="correction" data-id="${sess.id}"`, 'primary big', 'pdf')}${sess.skill !== 'speaking' ? btn('Editar respuestas y recorregir', `data-regrade="${sess.id}"`, 'ghost') : ''}</div>`;
  return h + '</div>';
}

/* ---------- Progress ---------- */
function progressHtml() {
  const st = curStudent(); if (!st) return '';
  const done = studentSessions(st.id).filter(s => s.status === 'corrected');
  const nb = S.notebooks[st.id] || emptyNotebook();
  const last5 = done.slice(0, 5);
  const avg = last5.length ? Math.round(last5.reduce((t, s) => t + (s.results?.pct || 0), 0) / last5.length) : null;
  let h = `<section class="card stack"><div class="spread"><h2 class="h2">Progreso de ${esc(st.name)}</h2>${btn('Cuaderno de errores (PDF)', `data-pdf="notebook" data-id="${st.id}"`, '', 'book')}</div>
    <div class="tiles">
      <div class="tile"><b>${done.length}</b><span>sesiones corregidas</span></div>
      <div class="tile"><b>${avg == null ? '–' : avg + '%'}</b><span>media últimas 5</span></div>
      <div class="tile"><b>${nb.queue?.length || 0}</b><span>errores en repaso</span></div>
      <div class="tile"><b>${nb.mastered || 0}</b><span>errores dominados</span></div>
    </div>`;
  const series = done.slice(0, 20).reverse();
  if (series.length) {
    const W = Math.max(320, series.length * 34 + 40), H = 170, top = 12, bot = 28, left = 30, bw = 20;
    const y = v => top + (H - top - bot) * (1 - v / 100);
    h += `<div><h3 class="h3" style="margin-bottom:6px">Resultado por sesión (%)</h3><div class="chart-wrap"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Porcentaje de aciertos por sesión">
      ${[0, 50, 100].map(v => `<line class="grid-l" x1="${left}" x2="${W - 6}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${left - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      ${series.map((s, i) => { const x = left + 10 + i * 34, v = s.results?.pct || 0, yy = y(v), hh = Math.max(2, y(0) - yy); return `<g><rect class="bar" x="${x}" y="${yy}" width="${bw}" height="${hh}" rx="4"><title>${esc(niceDate(s.dateKey))} · ${esc(SKILLS[s.skill]?.es)} · ${v}%</title></rect><text class="ax" x="${x + bw / 2}" y="${H - 10}" text-anchor="middle">${esc(DOW_SHORT[fromKey(s.dateKey).getDay()])}${fromKey(s.dateKey).getDate()}</text></g>`; }).join('')}
    </svg></div></div>`;
    const bySkill = {};
    for (const s of done) { const k = s.skill === 'mock' ? 'mock' : s.skill; (bySkill[k] = bySkill[k] || []).push(s.results?.pct || 0); }
    h += `<div><h3 class="h3" style="margin-bottom:8px">Media por destreza (últimas 4)</h3><div class="skill-bars">${SKILL_KEYS.filter(k => bySkill[k]).map(k => { const a = bySkill[k].slice(0, 4); const v = Math.round(a.reduce((t, x) => t + x, 0) / a.length); return `<div class="sb"><span>${esc(SKILLS[k].es)}</span><span class="track"><span style="width:${v}%"></span></span><span class="score">${v}%</span></div>`; }).join('')}</div></div>`;
  } else h += '<p class="empty">Cuando corrijas la primera sesión verás aquí su evolución.</p>';
  const allG = allGrammar();
  const doneG = (st.grammarDone || []).map(id => allG.find(t => t.id === id) || (() => { const s2 = studentSessions(st.id).find(x => x.grammar && x.grammar.topicId === id); return s2 ? { id, es: s2.grammar.title || s2.grammar.topic } : null; })()).filter(Boolean);
  h += `<div><h3 class="h3" style="margin-bottom:6px">Gramática vista (${doneG.length})</h3>${doneG.length ? `<div class="chips">${doneG.map(t => `<span class="pill plain">${esc(t.es)}</span>`).join('')}</div>` : '<p class="small muted">Cada sesión trae un punto de gramática nuevo; aquí verás los que ya ha trabajado.</p>'}<p class="small muted" style="margin-top:6px">Próximo: <b>${esc(pickGrammarTopic(st).es)}</b></p></div>`;
  const diffs = Object.entries(st.difficulty || {});
  if (diffs.length) h += `<div><h3 class="h3" style="margin-bottom:6px">Dificultad actual por parte</h3><div class="chips">${diffs.map(([k, v]) => `<span class="pill plain">${esc(k.startsWith('W') ? 'Writing P' + k.slice(1) : (EXAMS[st.level].parts[k] ? (EXAMS[st.level].parts[k].paper === 'Listening' ? 'Listening ' : 'Reading ') + EXAMS[st.level].parts[k].label : k))} · ${esc(DIFF_ES[v])}</span>`).join('')}</div><p class="small muted" style="margin-top:6px">Sube un nivel cuando saca 85 % o más en esa parte y baja si saca menos del 50 %.</p></div>`;
  return h + '</section>';
}

/* ---------- Settings ---------- */
function settingsHtml() {
  const list = studentList();
  let h = `<section class="card stack"><h2 class="h2">Ajustes</h2><p class="muted">Cambia el nivel, el tiempo diario y el plan de cada alumno. Los intereses ayudan a que los textos le motiven.</p></section>`;
  for (const st of list) {
    const plan = planOf(st);
    h += `<section class="card stack" data-st-form="${esc(st.id)}">
      <h3 class="h3">${esc(st.name)}</h3>
      <div class="form-grid">
        <label class="field"><span>Nombre</span><input id="f-name-${esc(st.id)}" value="${esc(st.name)}"></label>
        <label class="field"><span>Nivel</span><select id="f-level-${esc(st.id)}"><option value="B2" ${st.level === 'B2' ? 'selected' : ''}>B2 First for Schools</option><option value="B1" ${st.level === 'B1' ? 'selected' : ''}>B1 Preliminary for Schools</option></select></label>
        <label class="field"><span>Duración máxima (min, incluye 5 de gramática)</span><input id="f-min-${esc(st.id)}" type="number" min="15" max="60" step="5" value="${esc(st.minutes || 20)}"></label>
        <label class="field"><span>Edad</span><input id="f-age-${esc(st.id)}" type="number" min="8" max="20" value="${esc(st.age || '')}"></label>
      </div>
      <label class="field"><span>Intereses (opcional)</span><input id="f-int-${esc(st.id)}" value="${esc(st.interests || '')}" placeholder="fútbol, videojuegos, dibujo, animales…"></label>
      <div class="stack" style="gap:6px"><span class="small muted"><b>Plan semanal</b></span><div class="plan-grid">${[1, 2, 3, 4, 5, 6, 0].map(dw => `<label class="field"><span>${esc(DOW_ES[dw])}</span><select id="f-plan-${esc(st.id)}-${dw}">${[...SKILL_KEYS, 'rest'].map(k => `<option value="${k}" ${plan[dw] === k ? 'selected' : ''}>${esc(SKILLS[k].es)}</option>`).join('')}</select></label>`).join('')}</div></div>
      <div class="row">${btn('Guardar cambios', `data-save-st="${esc(st.id)}"`, 'primary')}</div>
    </section>`;
  }
  if (window.__LOCAL__) {
    const C = window.LOCAL_CFG;
    h += `<section class="card stack"><h3 class="h3">Conexión con Claude</h3>
      <p class="muted small">Esta copia funciona en tu ordenador y habla directamente con la API de Anthropic con tu clave (se crea en console.anthropic.com). El uso se paga en tu cuenta de la API, aparte de la suscripción de Claude. La clave solo se guarda en este navegador.</p>
      <div class="form-grid">
        <label class="field"><span>Clave de API</span><input id="loc-key" type="password" autocomplete="off" spellcheck="false" placeholder="${C.key ? 'Guardada · escribe otra para cambiarla' : 'sk-ant-…'}"></label>
        <label class="field"><span>Modelo</span><select id="loc-model">${Object.entries(C.models).map(([id, n]) => `<option value="${id}" ${C.model === id ? 'selected' : ''}>${esc(n)}${id === 'claude-opus-5-5' ? ' (recomendado)' : ' (más barato)'}</option>`).join('')}</select></label>
      </div>
      <div class="row">${btn('Guardar y probar la conexión', 'data-loc-save="1"', 'primary')}${C.key ? btn('Borrar la clave', 'data-loc-clear="1"', 'ghost danger') : ''}</div>
      <label class="row small"><input type="checkbox" id="loc-gpu" ${C.gpu ? 'checked' : ''} ${navigator.gpu ? '' : 'disabled'}> Audio MP3 más rápido con la tarjeta gráfica (WebGPU; la primera vez descarga unos 330 MB en lugar de 90)${navigator.gpu ? '' : ' · no disponible en este navegador'}</label>
      <p class="small muted">Los datos se guardan en este navegador (${window.__LOCAL_STORE === 'idb' ? 'IndexedDB' : 'almacenamiento local'}). Si cambias de navegador u ordenador, pásalos con la copia de seguridad.</p>
    </section>`;
  }
  if (!window.__LOCAL__) h += `<section class="card stack"><h3 class="h3">Versión local para el ordenador</h3>
    <p class="muted small">Un solo archivo HTML que se abre con doble clic en el Mac (Chrome o Safari) y lleva dentro tus alumnos y sesiones tal como están ahora. <b>Sin clave de API</b> sirve para crear los MP3 del listening: descárgalo de nuevo cada vez que generes un listening aquí y se añadirán las sesiones nuevas. Con una clave de API (se paga aparte de la suscripción) también genera y corrige, y lee las hojas desde una foto.</p>
    <div class="row">${btn('Descargar versión local', 'data-dl-local="1"', 'primary', 'pdf')}</div>
  </section>`;
  h += `<section class="card stack"><h3 class="h3">Copia de seguridad</h3>
    <p class="muted small">Guarda todos los alumnos, sesiones y cuadernos de errores en un archivo, o cárgalos desde otra copia (por ejemplo, para pasar de la versión web a la local). Al importar se sustituyen los elementos con el mismo nombre.</p>
    <div class="row">${btn('Exportar copia', 'data-export="1"', '', 'pdf')}<input type="file" id="imp-file" accept="application/json,.json">${btn('Importar copia', 'data-import="1"', '')}</div>
  </section>`;
  h += `<section class="card stack"><h3 class="h3">Añadir alumno</h3>
    <form id="add-student" class="form-grid">
      <label class="field"><span>Nombre</span><input id="new-name" required placeholder="Nombre"></label>
      <label class="field"><span>Nivel</span><select id="new-level"><option value="B2">B2 First for Schools</option><option value="B1">B1 Preliminary for Schools</option></select></label>
      <div class="field"><span>&nbsp;</span><button class="btn" type="submit">Añadir</button></div>
    </form></section>`;
  return h;
}

/* =========================================================
   Render: side
   ========================================================= */
function renderSide() {
  const side = $('#side'); const list = studentList();
  if (!list.length) { side.innerHTML = ''; return; }
  const now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  let h = `<section class="card stack"><h3 class="h3">Esta semana</h3><div class="week">
    <span></span>${days.map(d => `<span class="dh ${dateKey(d) === todayKey() ? 'today' : ''}">${DOW_SHORT[d.getDay()]}${d.getDate()}</span>`).join('')}`;
  for (const st of list) {
    const plan = planOf(st);
    h += `<span class="nm">${esc(st.name)}</span>`;
    h += days.map(d => {
      const k = dateKey(d), ss = studentSessions(st.id).filter(s => s.dateKey === k), sk = plan[d.getDay()];
      const cls = ss.some(s => s.status === 'corrected') ? 'done' : ss.length ? 'gen' : sk === 'rest' ? 'rest' : '';
      const lbl = `${DOW_ES[d.getDay()]}: ${SKILLS[sk]?.es}${cls === 'done' ? ' · corregida' : cls === 'gen' ? ' · generada' : ''}`;
      return `<span class="cell" title="${esc(lbl)}" aria-label="${esc(lbl)}"><i class="${cls}"></i></span>`;
    }).join('');
  }
  h += `<span></span>${days.map(d => { const sk = planOf(list[0])[d.getDay()]; return `<span class="sk">${esc({ use: 'UoE', reading: 'Read', listening: 'List', writing: 'Writ', speaking: 'Speak', mock: 'Sim', rest: '—' }[sk] || '')}</span>`; }).join('')}
  </div><p class="legend-cat">Relleno: corregida · medio: generada · discontinuo: descanso</p></section>`;
  const st = curStudent();
  if (st) {
    const weak = weakTags(S.notebooks[st.id]).slice(0, 6);
    h += `<section class="card stack"><div class="spread"><h3 class="h3">Puntos débiles de ${esc(st.name)}</h3></div>`;
    if (weak.length) {
      h += `<div class="weak">${weak.map(t => { const tot = (t.misses || 0) + (t.hits || 0), rate = tot ? Math.round(100 * (t.misses || 0) / tot) : 0; return `<div class="weak-row"><span>${esc(tagEs(t.tag))}${t.examples?.[0]?.point ? ` <span class="muted small">· ${esc(t.examples[0].point)}</span>` : ''}</span><span class="legend-cat">${t.misses} fallos · ${t.hits || 0} ok</span><span class="bar"><span style="width:${rate}%"></span></span></div>`; }).join('')}</div>
        <p class="small muted">Las próximas sesiones meten preguntas sobre estos puntos y el PDF de corrección trae ejercicios de refuerzo. Un error se da por dominado cuando acierta dos veces ese tipo de pregunta en sesiones posteriores.</p>`;
    } else h += '<p class="small muted">Aparecerán al corregir. Cada fallo se clasifica (vocabulario, gramática, comprensión, despiste, formato o tiempo) y vuelve en las sesiones siguientes hasta que lo domine.</p>';
    h += `</section>`;
  }
  side.innerHTML = h;
}

/* =========================================================
   Actions
   ========================================================= */
function openSession(id, tab) {
  S.openId = id; S.view = 'session'; S.sessTab = tab || 'preview'; S.confirmDel = null;
  if (S.sessions[id]) S.cur = S.sessions[id].studentId;
  renderAll(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function paintGen(stId) { if (S.view === 'today' && S.cur === stId) renderMain(true); renderStudents(); }

async function downloadPdf(kind, id, button) {
  if (!window.jspdf) { toast('No se pudo cargar el generador de PDF. Recarga la página.'); return; }
  let blob, name;
  try {
    if (kind === 'notebook') { const st = S.students[id]; blob = buildNotebookPdf(id).blob(); name = `${st.name}_cuaderno_errores_${todayKey()}.pdf`; }
    else {
      const sess = S.sessions[id]; if (!sess) return;
      if (kind === 'pack') {
        const pdf = buildExamPdf(sess);
        if (sess.skill !== 'writing' && sess.skill !== 'speaking') buildAnswerSheetPdf(sess, pdf);
        blob = pdf.blob(); name = fileName(sess, 'ejercicios');
      } else if (kind === 'exam') { blob = buildExamPdf(sess).blob(); name = fileName(sess, sess.skill === 'speaking' ? 'alumno' : 'ejercicios'); }
      else if (kind === 'sheet') { blob = buildAnswerSheetPdf(sess).blob(); name = fileName(sess, 'hoja_respuestas'); }
      else if (kind === 'solutions') { blob = buildSolutionsPdf(sess).blob(); name = fileName(sess, 'soluciones'); }
      else if (kind === 'correction') { blob = buildCorrectionPdf(sess).blob(); name = fileName(sess, 'correccion'); }
      else if (kind === 'examiner') { blob = buildSpeakingExaminerPdf(sess).blob(); name = fileName(sess, 'examinador'); }
    }
  } catch (e) { console.error(e); toast('No se pudo crear el PDF.'); return; }
  if (!S.dl) { toast('Esta vista no permite guardar archivos. Abre la app en claude.ai.'); return; }
  try { await S.dl.save({ filename: name, data: blob }); toast('PDF listo: ' + name); }
  catch (e) {
    if (e && e.code === 'declined') return;
    if (e && e.code === 'rate_limited') toast('Hay otra descarga pendiente de confirmar.');
    else toast('No se pudo guardar el PDF.');
  }
}

async function runGrade(id, fn) {
  S.busy[id] = 'Corrigiendo con Claude… (30–90 s)'; delete S.errors[id]; renderMain(true);
  try { const warn = await fn(); delete S.busy[id]; S.sessTab = 'correct'; renderAll(); toast(warn ? 'Corregida (sin feedback de Claude)' : 'Sesión corregida'); }
  catch (e) { delete S.busy[id]; S.errors[id] = errMsg(e); renderMain(true); }
}

function setPick(st, patch) {
  const p = genPick(st); Object.assign(p, patch);
  if (patch.skill) p.parts = autoParts(st, patch.skill);
  renderMain(true);
}

document.addEventListener('click', async ev => {
  const t = ev.target.closest('button, [data-open]'); if (!t) return;
  const d = t.dataset;
  if (d.view) { S.view = d.view; S.confirmDel = null; renderAll(); return; }
  if (d.viewGo) { S.view = d.viewGo; renderAll(); return; }
  if (d.student) { S.cur = d.student; if (S.view === 'session') S.view = 'today'; renderAll(); return; }
  if (d.open) { openSession(d.open, d.tab); return; }
  if (d.tabGo) { if (d.tabGo !== 'audio') stopAudio(); S.sessTab = d.tabGo; renderMain(true); return; }
  if (d.filter) { S.listFilter = d.filter; renderMain(true); return; }
  if (d.skill) { const st = curStudent(); if (st) setPick(st, { skill: d.skill }); return; }
  if (d.part) {
    const st = curStudent(); if (!st) return; const p = genPick(st);
    p.parts = p.parts.includes(d.part) ? p.parts.filter(x => x !== d.part) : examOrder(st.level, [...p.parts, d.part]);
    renderMain(true); return;
  }
  if (d.generate) {
    const st = S.students[d.generate]; if (!st) return; const p = genPick(st);
    if (p.grammar === 'custom' && !String(p.grammarText || '').trim()) { toast('Escribe el tema de gramática o elige «Automática».'); $('#g-custom')?.focus(); return; }
    generateFor(st.id, p.skill, p.parts.slice(), { grammar: chosenTopic(st, p), note: p.note }); return;
  }
  if (d.generateAll) {
    for (const st of studentList()) {
      if (S.gen[st.id]?.running) continue;
      const p = genPick(st);
      generateFor(st.id, p.skill, p.parts.slice(), { open: false, grammar: chosenTopic(st, p), note: p.note });
    }
    toast('Generando las sesiones de hoy…'); return;
  }
  if (d.cancelGen) { S.gen[d.cancelGen]?.ctl.abort(); return; }
  if (d.pdf) { t.disabled = true; try { await downloadPdf(d.pdf, d.id, t); } finally { t.disabled = false; } return; }
  if (d.retry) { retryPart(d.id, d.retry); return; }
  if (d.del) { S.confirmDel = d.del; renderMain(true); return; }
  if (d.delNo) { S.confirmDel = null; renderMain(true); return; }
  if (d.delYes) { const s = S.sessions[d.delYes]; await deleteSession(d.delYes); S.confirmDel = null; S.view = 'sessions'; S.openId = null; renderAll(); toast('Sesión borrada'); return; }
  if (d.k && d.v) {
    const id = S.openId, dr = draftOf(id);
    dr[d.k] = dr[d.k] === d.v ? '' : d.v;
    $$(`.loz[data-k="${CSS.escape(d.k)}"]`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === dr[d.k])));
    touchDraft(id); return;
  }
  if (d.wchoice != null) { const dr = draftOf(S.openId); dr.w_choice = +d.wchoice; touchDraft(S.openId); $$('[data-wchoice]').forEach(b => b.setAttribute('aria-pressed', String(b === t))); return; }
  if (d.readPhoto) {
    const inp = $('#sheet-photo'); const files = inp && inp.files;
    if (!files || !files.length) { toast('Elige primero una o varias fotos.'); return; }
    if (files.length > S.imgMax) { toast(`Máximo ${S.imgMax} fotos por lectura.`); return; }
    const id = d.readPhoto;
    S.busy[id] = 'Leyendo la foto…'; delete S.errors[id]; renderMain(true);
    try {
      const got = await readSheetPhoto(id, files);
      const dr = draftOf(id); Object.assign(dr, got); touchDraft(id);
      S.filled[id] = new Set(Object.keys(got));
      delete S.busy[id]; renderMain(true);
      toast(`${Object.keys(got).length} respuestas leídas. Revísalas y pulsa «Corregir».`);
    } catch (e) { delete S.busy[id]; S.errors[id] = errMsg(e); renderMain(true); }
    return;
  }
  if (d.grade) { runGrade(d.grade, () => gradeSession(d.grade)); return; }
  if (d.gradeWriting) {
    const id = d.gradeWriting, dr = draftOf(id), files = $('#wr-photo')?.files;
    const text = String(dr.w_text || '').trim();
    if (!text && !(files && files.length)) { toast('Sube una foto de la redacción o escribe el texto.'); return; }
    if (files && files.length > S.imgMax) { toast(`Máximo ${S.imgMax} fotos.`); return; }
    runGrade(id, async () => { await gradeWriting(id, text, text ? null : files, +dr.w_choice || 0); return ''; });
    return;
  }
  if (d.gradeSpeaking) {
    const id = d.gradeSpeaking, dr = draftOf(id);
    const marks = { gv: +(dr.sp_gv ?? 3), dm: +(dr.sp_dm ?? 3), pr: +(dr.sp_pr ?? 3), ic: +(dr.sp_ic ?? 3) };
    runGrade(id, async () => { await gradeSpeaking(id, marks, dr.sp_notes || ''); return S.sessions[id]?.results?.warn || ''; });
    return;
  }
  if (d.regrade) {
    const s = clone(S.sessions[d.regrade]); S.drafts[d.regrade] = Object.assign({}, s.answers || {});
    s.status = 'ready'; await saveSession(d.regrade, s); S.sessTab = 'correct'; renderMain(true); return;
  }
  if (d.audio) {
    if (d.audio === 'play') { try { speechSynthesis.cancel(); } catch (e) {} playPart(S.openId, PL.pid); }
    else if (d.audio === 'pause') pauseAudio();
    else if (d.audio === 'stop') { stopAudio(); paintPlayer(); }
    else if (d.audio === 'skip') PL.skip = true;
    else if (d.audio === 'test') testVoices();
    return;
  }
  if (d.mp3) { makeListeningAudio(S.openId, d.mp3); return; }
  if (d.mp3Cancel) { AU.ctl?.abort(); return; }
  if (d.mp3Save) {
    const r = AU.results[d.mp3Save]; if (!r) return;
    try { await S.dl.save({ filename: r.name, data: r.blob }); } catch (e) { if (!e || e.code !== 'declined') toast('No se pudo guardar el audio.'); }
    return;
  }
  if (d.lpart) { stopAudio(); PL.pid = d.lpart; paintPlayer(); return; }
  if (d.locSave) {
    const C = window.LOCAL_CFG, k = ($('#loc-key')?.value || '').trim();
    if (k) C.key = k;
    C.model = $('#loc-model')?.value;
    if (!C.key) { toast('Escribe tu clave de API.'); return; }
    t.disabled = true; toast('Probando la conexión…');
    try { const r = await S.sample.json('Reply with ONLY this JSON: {"ok": true}', { modelTier: 'quick' }); toast(r && r.ok ? 'Conexión correcta con ' + C.models[C.model] : 'Conectado, pero la respuesta fue rara.'); }
    catch (e) { toast(errMsg(e)); }
    finally { t.disabled = false; renderBanner(); renderMain(true); }
    return;
  }
  if (d.locClear) { window.LOCAL_CFG.key = ''; toast('Clave borrada'); renderBanner(); renderMain(true); return; }
  if (d.dlLocal) {
    if (!S.dl) { toast('Esta vista no permite guardar archivos.'); return; }
    t.disabled = true; toast('Preparando la versión local…');
    try {
      const r = await fetch('local.html'); if (!r.ok) throw new Error('http ' + r.status);
      const tpl = await r.text();
      const seed = '<script>window.__LOCAL_SEED=' + JSON.stringify(exportDocs()).replace(/</g, '\\u003c') + ';window.__LOCAL_SEED_ID="' + Date.now() + '";<' + '/script>';
      const mark = '<!-' + '-LOCAL_SEED-->';
      if (!tpl.includes(mark)) throw new Error('template');
      await S.dl.save({ filename: 'CambridgeEnCasa-local.html', data: new Blob([tpl.replace(mark, () => seed)], { type: 'text/html' }) });
      toast('Versión local descargada');
    } catch (e) { if (!e || e.code !== 'declined') toast(e && e.code === 'extension_not_enabled' ? 'Esta vista no permite descargar archivos HTML.' : 'No se pudo preparar la descarga.'); }
    finally { t.disabled = false; }
    return;
  }
  if (d.export) {
    const docs = exportDocs();
    const data = JSON.stringify({ app: 'cambridge-en-casa', version: 1, exportedAt: new Date().toISOString(), docs });
    if (!S.dl) { toast('Esta vista no permite guardar archivos.'); return; }
    try { await S.dl.save({ filename: `cambridge-en-casa-copia-${todayKey()}.json`, data }); toast('Copia guardada'); } catch (e) { if (e && e.code !== 'declined') toast('No se pudo guardar la copia.'); }
    return;
  }
  if (d.import) {
    const f = $('#imp-file')?.files?.[0];
    if (!f) { toast('Elige primero el archivo de copia (.json).'); return; }
    let obj; try { obj = JSON.parse(await f.text()); } catch (e) { toast('Ese archivo no es una copia válida.'); return; }
    const docs = obj && obj.app === 'cambridge-en-casa' && obj.docs;
    if (!docs) { toast('Ese archivo no es una copia de Cambridge en Casa.'); return; }
    let n = 0;
    for (const [path, body] of Object.entries(docs)) {
      const [col, id] = path.split('/');
      if (!id || !body || typeof body !== 'object') continue;
      if (col === 'students') await saveStudent(id, body);
      else if (col === 'sessions') await saveSession(id, body);
      else if (col === 'notebooks') await saveNotebook(id, body);
      else continue;
      n++;
    }
    if (!S.cur || !S.students[S.cur]) S.cur = studentList()[0]?.id || null;
    toast(`${n} elementos importados`); renderAll(); renderMain(true); return;
  }
  if (d.saveSt) {
    const id = d.saveSt, st = S.students[id]; if (!st) return;
    const v = k => $(`#f-${k}-${CSS.escape(id)}`)?.value;
    const plan = {}; [0, 1, 2, 3, 4, 5, 6].forEach(dw => { plan[dw] = $(`#f-plan-${CSS.escape(id)}-${dw}`)?.value || DEFAULT_PLAN[dw]; });
    const body = Object.assign(clone(stripId(st)), { name: (v('name') || st.name).trim(), level: v('level') || st.level, minutes: Math.max(15, Math.min(60, +v('min') || 20)), age: +v('age') || null, interests: (v('int') || '').trim(), plan });
    if (body.level !== st.level) body.difficulty = {};
    await saveStudent(id, body); delete S.pick[id]; toast('Guardado'); renderAll(); return;
  }
});

document.addEventListener('input', ev => {
  const t = ev.target, d = t.dataset;
  if (d.gtext || d.snote) { const st = curStudent(); if (!st) return; const p = genPick(st); if (d.gtext) p.grammarText = t.value; else p.note = t.value; return; }
  if (d.quick != null) {
    const sess = S.sessions[S.openId]; if (!sess) return;
    const dr = draftOf(S.openId);
    const letters = sessionItems(sess).filter(i => i.pid === d.quick && i.type === 'letter');
    const chars = t.value.toUpperCase().replace(/\s+/g, '').split('');
    letters.forEach((it, k) => {
      const c = chars[k];
      if (c === undefined) return;
      dr[it.key] = it.letters.includes(c) ? c : '';
      $$(`.loz[data-k="${CSS.escape(it.key)}"]`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === dr[it.key])));
    });
    touchDraft(S.openId); return;
  }
  if (d.k && t.tagName === 'INPUT') { const dr = draftOf(S.openId); dr[d.k] = t.value; touchDraft(S.openId); return; }
  if (d.wrtext) { const dr = draftOf(S.openId); dr.w_text = t.value; touchDraft(S.openId); return; }
  if (d.spnotes) { const dr = draftOf(S.openId); dr.sp_notes = t.value; touchDraft(S.openId); return; }
  if (d.sp) { const dr = draftOf(S.openId); dr['sp_' + d.sp] = +t.value; const o = $('#v-' + d.sp); if (o) o.textContent = t.value; touchDraft(S.openId); return; }
});
document.addEventListener('toggle', ev => { if (ev.target && ev.target.id === 'vp-box') PL.vpOpen = ev.target.open; }, true);
document.addEventListener('keydown', ev => {
  const t = ev.target;
  if (ev.key !== 'Enter' || t.tagName !== 'INPUT' || !(t.dataset.k || t.dataset.quick != null)) return;
  ev.preventDefault();
  const all = $$('#main input[data-k], #main input[data-quick]');
  const i = all.indexOf(t);
  if (all[i + 1]) all[i + 1].focus(); else t.blur();
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset && t.dataset.gpick) { const st = curStudent(); if (st) { genPick(st).grammar = t.value; renderMain(true); if (t.value === 'custom') $('#g-custom')?.focus(); } return; }
  if (t.id === 'pl-short') { PL.short = t.checked; paintPlayer(); }
  if (t.id === 'loc-gpu') { window.LOCAL_CFG.gpu = t.checked; kokoroP = null; toast(t.checked ? 'Usaré la tarjeta gráfica para el audio' : 'Usaré el procesador para el audio'); return; }
  if (t.dataset && t.dataset.vp) { const k = t.dataset.vp; VP[k] = ['rate', 'pitch', 'gap'].includes(k) ? +t.value : t.value; saveVP(); paintPlayer(); return; }
  if (t.id === 'pl-script') { PL.showScript = t.checked; paintPlayer(); }
});
document.addEventListener('submit', async ev => {
  if (ev.target.id !== 'add-student') return;
  ev.preventDefault();
  const name = $('#new-name').value.trim(), level = $('#new-level').value;
  if (!name) return;
  const id = tagKey(name) + '-' + Math.random().toString(36).slice(2, 5);
  await saveStudent(id, { name, level, minutes: 20, age: null, interests: '', plan: Object.assign({}, DEFAULT_PLAN), difficulty: {}, grammarDone: [], order: studentList().length + 1, createdAt: Date.now() });
  S.cur = id; S.view = 'today'; renderAll(); toast(`${name} añadido`);
});

/* =========================================================
   Boot
   ========================================================= */
function subscribe(db) {
  const onErr = e => { console.warn('db', e); if (e && (e.code === 'revoked' || e.code === 'not_granted')) { S.dbState = 'revoked'; renderAll(); } };
  let got = { st: false, se: false, nb: false };
  const ready = () => { if (got.st && got.se && got.nb && S.dbState === 'loading') S.dbState = 'ok'; };
  db.collection('students').onSnapshot(snap => {
    S.students = {}; snap.docs.forEach(d => { S.students[d.id] = Object.assign({ id: d.id }, d.data()); });
    if (!S.cur || !S.students[S.cur]) S.cur = studentList()[0]?.id || null;
    got.st = true; ready(); renderAll();
  }, onErr);
  db.collection('sessions').orderBy('createdAt', 'desc').limit(300).onSnapshot(snap => {
    const keep = {}; snap.docs.forEach(d => { keep[d.id] = Object.assign({ id: d.id }, d.data()); });
    S.sessions = keep; got.se = true; ready(); renderAll();
  }, onErr);
  db.collection('notebooks').onSnapshot(snap => {
    S.notebooks = {}; snap.docs.forEach(d => { S.notebooks[d.id] = d.data(); });
    got.nb = true; ready(); renderAll();
  }, onErr);
}

async function boot() {
  renderAll();
  TTS.init();
  const c = window.claude;
  if (!c || typeof c.use !== 'function') { S.dbState = 'none'; S.sample = null; renderAll(); return; }
  c.use('sample').then(s => {
    S.sample = s || null;
    if (s && s.limits) s.limits().then(l => { S.imagesOk = !!(l && l.images); S.imgMax = l?.images?.maxCount || 4; renderMain(true); }).catch(() => {});
    renderMain(true);
  });
  c.use('downloads').then(dl => { S.dl = dl || null; });
  const db = await c.use('db');
  if (!db) { S.dbState = 'none'; renderAll(); return; }
  S.db = db;
  subscribe(db);
  setTimeout(() => { if (S.dbState === 'loading') { S.dbState = 'ok'; renderAll(); } }, 8000);
}
boot();
</script>

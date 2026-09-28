/* Interfaz: reproducción sincronizada con el audio, capítulos, subtítulos y sonido del lápiz. */
(function () {
  const $ = id => document.getElementById(id);
  const stage = $('stage'), audio = $('audio'), subs = $('subs'), big = $('big');
  const FR = [];
  TL.escenas.forEach(e => e.bloques.forEach(b => b.frases.forEach(f => FR.push(f))));
  const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  const tex = paperTexture();
  if (tex) stage.style.setProperty('--paper-img', `url(${tex})`);
  buildHand();

  let playing = false, pausedT = 0, base = 0, baseNow = 0, useAudio = true, started = false, ccOn = true, pencilOn = true;
  let actx = null, pencilGain = null, lastSub = null, lastCap = -1;

  function subAt(t) {
    for (const f of FR) if (t >= f.t0 - 0.05 && t <= f.t1 + 0.35) return f.texto;
    return '';
  }
  function frame(t) {
    const si = render(t);
    const s = ccOn ? subAt(t) : '';
    if (s !== lastSub) { lastSub = s; subs.firstElementChild.textContent = s; subs.hidden = !s; }
    return si;
  }

  if (RENDER) {
    document.documentElement.classList.add('render');
    const go = () => { measureTexts(); schedule(); window.__renderAt = t => { frame(t); }; window.__pen = () => ITEMS.map(i => [i.t0, i.t1, i.text ? 1 : 0]); window.__dur = DUR; window.__ready = true; };
    fontsReady().then(go);
    return;
  }

  function fontsReady() {
    const load = document.fonts && document.fonts.load
      ? Promise.all(['700 40px Caveat', '600 40px Caveat'].map(f => document.fonts.load(f))).then(() => document.fonts.ready)
      : Promise.resolve();
    return Promise.race([load.catch(() => { }), new Promise(r => setTimeout(r, 3000))]);
  }

  /* ----- barra de progreso y capítulos ----- */
  const segs = $('segs'), caps = $('caps'), track = $('track'), fill = $('fill');
  TL.escenas.forEach((e, i) => {
    const g = GUION[i];
    const sEl = document.createElement('div');
    sEl.className = 'seg'; sEl.style.flexGrow = (e.fin - e.inicio).toFixed(2); sEl.title = g.capitulo;
    sEl.innerHTML = `<span>${g.marca || ''}</span>`;
    segs.appendChild(sEl);
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" id="cap-${e.id}"><span class="yr">${g.marca || '▸'}</span><span class="nm">${g.capitulo}</span><span class="tm">${fmt(e.inicio)}</span></button>`;
    li.firstElementChild.addEventListener('click', () => { seek(e.inicio + 0.01); play(); stage.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    caps.appendChild(li);
  });
  $('time').textContent = `0:00 / ${fmt(DUR)}`;
  track.setAttribute('aria-valuemax', Math.round(DUR));

  function ui(t, si) {
    fill.style.width = (100 * t / DUR).toFixed(3) + '%';
    $('time').textContent = `${fmt(t)} / ${fmt(DUR)}`;
    track.setAttribute('aria-valuenow', Math.round(t));
    track.setAttribute('aria-valuetext', `${fmt(t)} · ${GUION[si].capitulo}`);
    if (si !== lastCap) {
      lastCap = si;
      caps.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === si));
    }
  }

  /* ----- reloj maestro: el audio ----- */
  const now = () => performance.now() / 1000;
  function clock() {
    if (!playing) return pausedT;
    let t = base + (now() - baseNow);
    if (useAudio && !audio.paused && audio.readyState >= 2) {
      const at = audio.currentTime;
      if (Math.abs(at - t) > 0.1) { base = at; baseNow = now(); t = at; }
    }
    return Math.min(t, DUR);
  }
  function play() {
    if (!started) { started = true; showHand = true; }
    if (pausedT >= DUR - 0.1) pausedT = 0;
    initPencil();
    if (actx && actx.state === 'suspended') actx.resume();
    playing = true; base = pausedT; baseNow = now();
    big.hidden = true;
    setBtn();
    if (useAudio) {
      try { audio.currentTime = pausedT; } catch (e) { }
      const p = audio.play();
      if (p && p.catch) p.catch(() => { useAudio = false; note('No se pudo reproducir el audio: la animación sigue con subtítulos.'); });
    }
    requestAnimationFrame(loop);
  }
  function pause() {
    pausedT = clock(); playing = false; audio.pause(); setBtn();
    if (pencilGain) pencilGain.gain.setTargetAtTime(0, actx.currentTime, 0.02);
  }
  function seek(t) {
    pausedT = clamp(t, 0, DUR); base = pausedT; baseNow = now();
    if (useAudio) { try { audio.currentTime = pausedT; } catch (e) { } }
    if (!started) { started = true; showHand = true; }
    const si = frame(pausedT); ui(pausedT, si);
  }
  function setBtn() {
    const b = $('play');
    b.innerHTML = playing ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
    b.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir');
  }
  function loop() {
    if (!playing) return;
    const t = clock(), si = frame(t);
    ui(t, si);
    if (pencilGain) {
      const g = drawing && pencilOn ? 0.045 * (0.7 + 0.3 * Math.abs(Math.sin(t * 23) * Math.sin(t * 5.1))) : 0;
      pencilGain.gain.setTargetAtTime(g, actx.currentTime, 0.02);
    }
    if (t >= DUR - 0.02) { pause(); pausedT = DUR; big.hidden = false; big.querySelector('.big-txt').textContent = 'Ver otra vez'; return; }
    requestAnimationFrame(loop);
  }
  function note(msg) { const n = $('msg'); n.textContent = msg; n.hidden = false; }

  /* ----- sonido del lápiz (ruido filtrado, sintetizado en el navegador) ----- */
  function initPencil() {
    if (actx) return;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const n = actx.sampleRate * 2, buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
      let b = 0; for (let i = 0; i < n; i++) { b = 0.55 * b + 0.45 * (Math.random() * 2 - 1); d[i] = b * (0.7 + 0.3 * Math.sin(i / 90)); }
      const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1100;
      const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2800; bp.Q.value = 0.8;
      pencilGain = actx.createGain(); pencilGain.gain.value = 0;
      src.connect(hp).connect(bp).connect(pencilGain).connect(actx.destination); src.start();
    } catch (e) { actx = null; pencilGain = null; }
  }

  /* ----- controles ----- */
  $('play').addEventListener('click', () => playing ? pause() : play());
  big.addEventListener('click', play);
  stage.addEventListener('click', e => { if (e.target.closest('#big')) return; if (started) (playing ? pause() : play()); });
  const toggle = (id, get, set) => $(id).addEventListener('click', () => { set(!get()); $(id).classList.toggle('on', get()); $(id).setAttribute('aria-pressed', get()); });
  toggle('cc', () => ccOn, v => { ccOn = v; frame(clock()); });
  toggle('snd', () => pencilOn, v => { pencilOn = v; });
  $('fs').addEventListener('click', () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stage.requestFullscreen) stage.requestFullscreen().catch(() => { });
    } catch (e) { }
  });
  function seekFromEvent(e) {
    const r = track.getBoundingClientRect();
    seek(clamp((e.clientX - r.left) / r.width) * DUR);
  }
  let dragging = false, wasPlaying = false;
  track.addEventListener('pointerdown', e => { dragging = true; wasPlaying = playing; if (playing) pause(); track.setPointerCapture(e.pointerId); seekFromEvent(e); });
  track.addEventListener('pointermove', e => { if (dragging) seekFromEvent(e); });
  track.addEventListener('pointerup', () => { if (dragging) { dragging = false; if (wasPlaying) play(); } });
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); seek(clock() + (e.key === 'ArrowRight' ? 5 : -5)); if (playing) play(); }
  });
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (e.key === ' ' || e.key === 'k') { if (e.target.tagName === 'BUTTON' && e.key === ' ') return; e.preventDefault(); playing ? pause() : play(); }
    if (e.key === 'c') $('cc').click();
  });
  audio.addEventListener('error', () => { useAudio = false; note('No se pudo cargar el audio: la animación se reproduce en silencio, con subtítulos.'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });

  setBtn();
  fontsReady().then(() => {
    measureTexts(); schedule();
    showHand = false;
    const poster = TL.escenas[0].fin - 0.4;
    const si = frame(poster); ui(0, 0);
    subs.hidden = true; lastSub = null;
    stage.classList.add('ready');
  });
})();

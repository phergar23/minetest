<script>
/* =========================================================
   Local edition: replaces the claude.ai runtime (window.claude)
   with browser storage, the Anthropic API (your own key) and
   plain file downloads. Only included by build-local.sh.
   ========================================================= */
window.__LOCAL__ = true;
(function () {
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  };
  const MODELS = { 'claude-opus-5-5': 'Claude Opus 5.5', 'claude-sonnet-5-5': 'Claude Sonnet 5.5' };
  window.LOCAL_CFG = {
    models: MODELS,
    get key() { return LS.get('cec-api-key') || ''; },
    set key(v) { LS.set('cec-api-key', v || null); },
    get model() { const m = LS.get('cec-model'); return MODELS[m] ? m : 'claude-opus-5-5'; },
    set model(v) { LS.set('cec-model', MODELS[v] ? v : null); },
    get gpu() { return LS.get('cec-gpu') === '1'; },
    set gpu(v) { LS.set('cec-gpu', v ? '1' : null); }
  };
  const fail = (code, userMsg, text) => { const e = new Error(userMsg || code); e.code = code; if (userMsg) e.userMsg = userMsg; if (text) e.text = text; return e; };

  /* ---------- storage: IndexedDB, falling back to localStorage ---------- */
  const store = new Map();
  let persist = async () => {};
  const DBN = 'cambridge-en-casa', OS = 'docs';
  const openIdb = () => new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('no indexedDB'));
    const r = indexedDB.open(DBN, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(OS);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  async function initStore() {
    try {
      const idb = await openIdb();
      await new Promise((res, rej) => {
        const rq = idb.transaction(OS, 'readonly').objectStore(OS).openCursor();
        rq.onsuccess = () => { const c = rq.result; if (c) { store.set(String(c.key), c.value); c.continue(); } else res(); };
        rq.onerror = () => rej(rq.error);
      });
      persist = (path, body) => new Promise((res, rej) => {
        const tx = idb.transaction(OS, 'readwrite'), os = tx.objectStore(OS);
        if (body == null) os.delete(path); else os.put(body, path);
        tx.oncomplete = () => res(); tx.onerror = () => rej(fail('quota_exceeded')); tx.onabort = () => rej(fail('quota_exceeded'));
      });
      window.__LOCAL_STORE = 'idb';
    } catch (e) {
      try { const raw = LS.get('cec-store'); if (raw) Object.entries(JSON.parse(raw)).forEach(([k, v]) => store.set(k, v)); } catch (e2) {}
      persist = async () => { try { localStorage.setItem('cec-store', JSON.stringify(Object.fromEntries(store))); } catch (e3) { throw fail('quota_exceeded'); } };
      window.__LOCAL_STORE = 'ls';
    }
    if (!store.size && window.__LOCAL_SEED) {
      for (const [k, v] of Object.entries(window.__LOCAL_SEED)) { store.set(k, v); await persist(k, v).catch(() => {}); }
    }
  }
  const ready = initStore();

  const subs = new Set();
  const meta = { fromCache: false, hasPendingWrites: false };
  const colOf = path => path.slice(0, path.lastIndexOf('/'));
  function snap(col, order, lim) {
    let docs = [];
    for (const [k, v] of store) if (colOf(k) === col) docs.push({ id: k.slice(k.lastIndexOf('/') + 1), exists: true, data: () => v, metadata: meta });
    if (order) docs.sort((a, b) => {
      const x = a.data()[order.f], y = b.data()[order.f];
      const c = x === y ? 0 : x == null ? 1 : y == null ? -1 : x < y ? -1 : 1;
      return order.dir === 'desc' && x != null && y != null ? -c : c;
    });
    if (lim) docs = docs.slice(0, lim);
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: meta };
  }
  function notify(path) { const col = colOf(path); for (const s of subs) if (s.col === col) setTimeout(() => s.next(snap(s.col, s.order, s.lim)), 0); }
  const docRef = path => ({
    id: path.slice(path.lastIndexOf('/') + 1), path,
    get: async () => { const v = store.get(path); return { id: path.slice(path.lastIndexOf('/') + 1), exists: !!v, data: () => v, metadata: meta }; },
    set: async body => { const v = JSON.parse(JSON.stringify(body)); store.set(path, v); notify(path); await persist(path, v); },
    update: async body => { const cur = store.get(path); if (!cur) throw fail('invalid_argument'); const v = Object.assign({}, cur, JSON.parse(JSON.stringify(body))); store.set(path, v); notify(path); await persist(path, v); },
    delete: async () => { store.delete(path); notify(path); await persist(path, null); }
  });
  const query = (col, order, lim) => ({
    path: col,
    orderBy: (f, dir) => query(col, { f, dir: dir || 'asc' }, lim),
    limit: n => query(col, order, n),
    where: () => query(col, order, lim),
    get: async () => snap(col, order, lim),
    onSnapshot: next => { const s = { col, order, lim, next }; subs.add(s); setTimeout(() => next(snap(col, order, lim)), 0); return () => subs.delete(s); },
    doc: id => docRef(col + '/' + (id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7))),
    add: async data => { const r = docRef(col + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)); await r.set(data); return r; }
  });
  const db = { collection: c => query(c), doc: p => docRef(p) };
  window.__localExport = () => Object.fromEntries(store);

  /* ---------- Claude through the Anthropic API ---------- */
  const EFFORT = { quick: 'low', default: 'medium', complex: 'high' };
  let client = null, clientKey = '';
  function getClient() {
    const key = window.LOCAL_CFG.key;
    if (!key) throw fail('no_key', 'Falta tu clave de API de Anthropic: ponla en Ajustes › Conexión con Claude.');
    if (!window.Anthropic) throw fail('upstream_error', 'No se ha cargado el cliente de Claude. Recarga la página.');
    if (!client || clientKey !== key) { client = new window.Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 2 }); clientKey = key; }
    return client;
  }
  async function imageBlock(file) {
    let bmp;
    try { bmp = await createImageBitmap(file); } catch (e) { throw fail('image_rejected'); }
    const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * scale); cv.height = Math.round(bmp.height * scale);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const data = cv.toDataURL('image/jpeg', 0.85).split(',')[1];
    return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } };
  }
  function mapError(e, signal) {
    const A = window.Anthropic || {};
    if ((signal && signal.aborted) || (A.APIUserAbortError && e instanceof A.APIUserAbortError)) return fail('cancelled');
    if (e && e.code && !(A.APIError && e instanceof A.APIError)) return e;
    if (A.AuthenticationError && e instanceof A.AuthenticationError) return fail('bad_key', 'La clave de API no es válida. Revísala en Ajustes.');
    if (A.PermissionDeniedError && e instanceof A.PermissionDeniedError) return fail('bad_key', 'Tu clave de API no tiene permiso para usar este modelo.');
    if (A.RateLimitError && e instanceof A.RateLimitError) return fail('rate_limited');
    if (A.BadRequestError && e instanceof A.BadRequestError) {
      const m = String(e.message || '');
      if (/credit balance/i.test(m)) return fail('upstream_error', 'Tu cuenta de la API no tiene saldo. Añade crédito en console.anthropic.com › Billing.');
      return fail('upstream_error', 'La API rechazó la petición: ' + m.slice(0, 180));
    }
    if (A.APIConnectionError && e instanceof A.APIConnectionError) return fail('upstream_error', 'No hay conexión con la API de Anthropic. Revisa internet y vuelve a intentarlo.');
    if (A.APIError && e instanceof A.APIError) return fail('upstream_error', `Error de la API de Anthropic (${e.status || '?'}). Vuelve a intentarlo en un momento.`);
    return fail('upstream_error', String((e && e.message) || e));
  }
  async function ask(input, opts = {}) {
    const c = getClient();
    const content = [];
    if (opts.images) for (const f of Array.from(opts.images)) content.push(await imageBlock(f));
    const text = typeof input === 'string' ? input : input.map(t => t.content).join('\n\n');
    content.push({ type: 'text', text });
    const model = window.LOCAL_CFG.model;
    const params = {
      model, max_tokens: 64000,
      output_config: { effort: EFFORT[opts.modelTier] || 'medium' },
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      messages: [{ role: 'user', content }]
    };
    let msg;
    try { msg = await c.beta.messages.stream(params, opts.signal ? { signal: opts.signal } : undefined).finalMessage(); }
    catch (e) { throw mapError(e, opts.signal); }
    if (msg.stop_reason === 'refusal') throw fail('refused');
    const out = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
    if (!out.trim()) throw fail('empty_completion');
    return { text: out, truncated: msg.stop_reason === 'max_tokens', modelTierApplied: opts.modelTier || 'default' };
  }
  function parseJson(t) {
    const tries = [t];
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) tries.push(fence[1]);
    const a = t.search(/[\[{]/), b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if (a >= 0 && b > a) tries.push(t.slice(a, b + 1));
    for (const s of tries) { try { return JSON.parse(s); } catch (e) {} }
    return undefined;
  }
  const sample = (input, opts) => ask(input, opts);
  sample.json = async (input, opts) => {
    const r = await ask(input, opts);
    if (r.truncated) throw fail('invalid_json', 'La respuesta salió demasiado larga y se cortó. Pulsa «Reintentar».', r.text);
    const v = parseJson(r.text);
    if (v === undefined) throw fail('invalid_json', null, r.text);
    return v;
  };
  sample.limits = async () => ({ maxPromptBytes: 900000, images: { maxCount: 4, maxInputBytes: 40e6, mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'] } });

  /* ---------- downloads ---------- */
  const downloads = {
    save: async ({ filename, data }) => {
      const blob = data instanceof Blob ? data : new Blob([data], { type: /\.json$/.test(filename) ? 'application/json' : 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return { status: 'saved' };
    }
  };

  window.claude = {
    use: async name => {
      if (name === 'db') { try { await ready; return db; } catch (e) { return null; } }
      if (name === 'sample') return sample;
      if (name === 'downloads') return downloads;
      return null;
    }
  };
})();
</script>

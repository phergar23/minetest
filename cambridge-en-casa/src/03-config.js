<script>
/* =========================================================
   Cambridge en Casa — configuration
   ========================================================= */
const EXAMS = {
  B2: {
    id: 'B2', cefr: 'B2', name: 'B2 First for Schools', next: 'C1',
    order: ['U1', 'U2', 'U3', 'U4', 'R5', 'R6', 'R7', 'L1', 'L2', 'L3', 'L4'],
    parts: {
      U1: { paper: 'Reading and Use of English', label: 'Part 1', title: 'Multiple-choice cloze', es: 'Opción múltiple (huecos)', kind: 'mcq-cloze', first: 1, count: 8, letters: 'ABCD', minutes: 7, example: true,
        ins: 'For questions {a}–{b}, read the text below and decide which answer (A, B, C or D) best fits each gap. There is an example at the beginning (0). Mark your answers on the separate answer sheet.' },
      U2: { paper: 'Reading and Use of English', label: 'Part 2', title: 'Open cloze', es: 'Huecos abiertos (1 palabra)', kind: 'open-cloze', first: 9, count: 8, minutes: 7, example: true,
        ins: 'For questions {a}–{b}, read the text below and think of the word which best fits each gap. Use only one word in each gap. There is an example at the beginning (0). Write your answers IN CAPITAL LETTERS on the separate answer sheet.' },
      U3: { paper: 'Reading and Use of English', label: 'Part 3', title: 'Word formation', es: 'Formación de palabras', kind: 'word-formation', first: 17, count: 8, minutes: 7, example: true,
        ins: 'For questions {a}–{b}, read the text below. Use the word given in capitals at the end of some of the lines to form a word that fits in the gap in the same line. There is an example at the beginning (0). Write your answers IN CAPITAL LETTERS on the separate answer sheet.' },
      U4: { paper: 'Reading and Use of English', label: 'Part 4', title: 'Key word transformations', es: 'Transformaciones', kind: 'transformation', first: 25, count: 6, minutes: 10, marks: 2, example: true,
        ins: 'For questions {a}–{b}, complete the second sentence so that it has a similar meaning to the first sentence, using the word given. Do not change the word given. You must use between two and five words, including the word given. Here is an example (0). Write only the missing words IN CAPITAL LETTERS on the separate answer sheet.' },
      R5: { paper: 'Reading and Use of English', label: 'Part 5', title: 'Multiple choice', es: 'Comprensión (opción múltiple)', kind: 'reading-mc', first: 31, count: 6, letters: 'ABCD', minutes: 15,
        ins: 'For questions {a}–{b}, choose the answer (A, B, C or D) which you think fits best according to the text. Mark your answers on the separate answer sheet.' },
      R6: { paper: 'Reading and Use of English', label: 'Part 6', title: 'Gapped text', es: 'Texto con frases eliminadas', kind: 'gapped', first: 37, count: 6, letters: 'ABCDEFG', minutes: 13,
        ins: 'Six sentences have been removed from the text. Choose from the sentences A–G the one which fits each gap ({a}–{b}). There is one extra sentence which you do not need to use. Mark your answers on the separate answer sheet.' },
      R7: { paper: 'Reading and Use of English', label: 'Part 7', title: 'Multiple matching', es: 'Emparejar información', kind: 'matching', first: 43, count: 10, letters: 'ABCD', minutes: 14,
        ins: 'For questions {a}–{b}, choose from the people (A–D). The people may be chosen more than once. Mark your answers on the separate answer sheet.' },
      L1: { paper: 'Listening', label: 'Part 1', title: 'Short extracts', es: 'Fragmentos cortos', kind: 'l-extracts', first: 1, count: 8, letters: 'ABC', minutes: 10,
        ins: 'You will hear people talking in eight different situations. For questions {a}–{b}, choose the best answer (A, B or C).' },
      L2: { paper: 'Listening', label: 'Part 2', title: 'Sentence completion', es: 'Completar frases', kind: 'l-gap', first: 9, count: 10, minutes: 8,
        ins: 'For questions {a}–{b}, complete the sentences with a word or short phrase.' },
      L3: { paper: 'Listening', label: 'Part 3', title: 'Multiple matching', es: 'Emparejar hablantes', kind: 'l-speakers', first: 19, count: 5, letters: 'ABCDEFGH', minutes: 7,
        ins: 'For questions {a}–{b}, choose from the list (A–H) what each speaker says. Use the letters only once. There are three extra letters which you do not need to use.' },
      L4: { paper: 'Listening', label: 'Part 4', title: 'Multiple choice', es: 'Entrevista (opción múltiple)', kind: 'l-interview', first: 24, count: 7, letters: 'ABC', minutes: 8,
        ins: 'For questions {a}–{b}, choose the best answer (A, B or C).' }
    },
    writing: {
      p1: { words: '140–190', type: 'essay' },
      p2types: ['article', 'email', 'review', 'story', 'letter']
    }
  },
  B1: {
    id: 'B1', cefr: 'B1', name: 'B1 Preliminary for Schools', next: 'B2',
    order: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'L1', 'L2', 'L3', 'L4'],
    parts: {
      R1: { paper: 'Reading', label: 'Part 1', title: 'Short texts', es: 'Textos cortos (avisos, mensajes)', kind: 'notices', first: 1, count: 5, letters: 'ABC', minutes: 5,
        ins: 'For each question, choose the correct answer.' },
      R2: { paper: 'Reading', label: 'Part 2', title: 'Matching', es: 'Emparejar personas y textos', kind: 'people-match', first: 6, count: 5, letters: 'ABCDEFGH', minutes: 8,
        ins: 'For each question, choose the correct answer.' },
      R3: { paper: 'Reading', label: 'Part 3', title: 'Long text', es: 'Texto largo (opción múltiple)', kind: 'reading-mc', first: 11, count: 5, letters: 'ABCD', minutes: 10,
        ins: 'For each question, choose the correct answer.' },
      R4: { paper: 'Reading', label: 'Part 4', title: 'Gapped text', es: 'Texto con frases eliminadas', kind: 'gapped', first: 16, count: 5, letters: 'ABCDEFGH', minutes: 9,
        ins: 'Five sentences have been removed from the text below. For each question, choose the correct answer. There are three extra sentences which you do not need to use.' },
      R5: { paper: 'Reading', label: 'Part 5', title: 'Multiple-choice cloze', es: 'Opción múltiple (huecos)', kind: 'mcq-cloze', first: 21, count: 6, letters: 'ABCD', minutes: 6,
        ins: 'For each question, choose the correct answer.' },
      R6: { paper: 'Reading', label: 'Part 6', title: 'Open cloze', es: 'Huecos abiertos (1 palabra)', kind: 'open-cloze', first: 27, count: 6, minutes: 6,
        ins: 'For each question, write the correct answer. Write one word for each gap.' },
      L1: { paper: 'Listening', label: 'Part 1', title: 'Short extracts', es: 'Siete grabaciones cortas', kind: 'l-extracts', first: 1, count: 7, letters: 'ABC', minutes: 8,
        ins: 'For each question, choose the correct answer. There are seven short recordings.' },
      L2: { paper: 'Listening', label: 'Part 2', title: 'Short conversations', es: 'Seis conversaciones', kind: 'l-extracts', first: 8, count: 6, letters: 'ABC', minutes: 8,
        ins: 'For each question, choose the correct answer.' },
      L3: { paper: 'Listening', label: 'Part 3', title: 'Gap fill', es: 'Completar huecos', kind: 'l-gap', first: 14, count: 6, minutes: 6,
        ins: 'For each question, write the correct answer in the gap. Write one or two words or a number or a date or a time.' },
      L4: { paper: 'Listening', label: 'Part 4', title: 'Interview', es: 'Entrevista (opción múltiple)', kind: 'l-interview', first: 20, count: 6, letters: 'ABC', minutes: 7,
        ins: 'For each question, choose the correct answer.' }
    },
    writing: {
      p1: { words: 'about 100', type: 'email' },
      p2types: ['article', 'story']
    }
  }
};

const SKILLS = {
  use:       { es: 'Use of English', desc: 'Vocabulario y gramática en contexto' },
  reading:   { es: 'Reading', desc: 'Comprensión lectora' },
  listening: { es: 'Listening', desc: 'Comprensión auditiva con audio' },
  writing:   { es: 'Writing', desc: 'Redacción cronometrada' },
  speaking:  { es: 'Speaking', desc: 'Examen oral contigo' },
  mock:      { es: 'Mini-simulacro', desc: 'Una parte de cada destreza' },
  mix:       { es: 'Sesión combinada', desc: 'Partes de varias destrezas elegidas a mano' },
  rest:      { es: 'Descanso', desc: 'Inglés suave: serie, vídeo o lectura' }
};
const SKILL_KEYS = ['use', 'reading', 'listening', 'writing', 'speaking', 'mock'];
const DEFAULT_PLAN = { 1: 'use', 2: 'reading', 3: 'listening', 4: 'writing', 5: 'speaking', 6: 'mock', 0: 'rest' };
const POOLS = {
  B2: { use: ['U1', 'U2', 'U3', 'U4'], reading: ['R5', 'R6', 'R7'], listening: ['L1', 'L2', 'L3', 'L4'] },
  B1: { use: ['R5', 'R6', 'R1'], reading: ['R3', 'R4', 'R2', 'R1'], listening: ['L1', 'L2', 'L3', 'L4'] }
};
const DOW_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DOW_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const DIFF = {
  1: 'accessible: lower end of the level, frequent vocabulary, distractors clearly different',
  2: 'standard exam difficulty for the level',
  3: 'standard exam difficulty with finer distractors and slightly less frequent vocabulary',
  4: 'demanding: upper end of the level, less common vocabulary, very close distractors',
  5: 'very demanding: bordering on the next level, sophisticated vocabulary and subtle distractors'
};
const DIFF_ES = { 1: 'Suave', 2: 'Estándar', 3: 'Estándar+', 4: 'Exigente', 5: 'Muy exigente' };

const TAGS = ['collocation', 'phrasal verb', 'fixed phrase', 'word meaning', 'dependent preposition', 'linking word',
  'word formation: noun', 'word formation: adjective', 'word formation: adverb', 'word formation: verb', 'word formation: prefix/negative',
  'spelling', 'verb tenses', 'passive', 'conditionals', 'reported speech', 'modal verbs', 'relative clauses', 'articles & determiners',
  'quantifiers', 'comparison', 'gerund/infinitive', 'prepositions', 'pronouns & reference', 'auxiliary verbs', 'wish/regret', 'causative',
  'detail', 'gist', 'inference', 'attitude/opinion', 'text cohesion', 'paraphrase', 'purpose', 'listening for specific words',
  'task achievement', 'register', 'organisation', 'range', 'accuracy', 'fluency', 'pronunciation', 'interaction'];
const TAG_ES = {
  'collocation': 'Colocaciones', 'phrasal verb': 'Phrasal verbs', 'fixed phrase': 'Expresiones fijas', 'word meaning': 'Significado de palabras',
  'dependent preposition': 'Preposiciones dependientes', 'linking word': 'Conectores', 'word formation: noun': 'Formación: sustantivos',
  'word formation: adjective': 'Formación: adjetivos', 'word formation: adverb': 'Formación: adverbios', 'word formation: verb': 'Formación: verbos',
  'word formation: prefix/negative': 'Formación: prefijos/negativos', 'spelling': 'Ortografía', 'verb tenses': 'Tiempos verbales', 'passive': 'Pasiva',
  'conditionals': 'Condicionales', 'reported speech': 'Estilo indirecto', 'modal verbs': 'Verbos modales', 'relative clauses': 'Oraciones de relativo',
  'articles & determiners': 'Artículos y determinantes', 'quantifiers': 'Cuantificadores', 'comparison': 'Comparativos', 'gerund/infinitive': 'Gerundio / infinitivo',
  'prepositions': 'Preposiciones', 'pronouns & reference': 'Pronombres y referencias', 'auxiliary verbs': 'Auxiliares', 'wish/regret': 'Wish / if only',
  'causative': 'Causativa (have sth done)', 'detail': 'Comprensión de detalle', 'gist': 'Idea general', 'inference': 'Inferencia',
  'attitude/opinion': 'Actitud y opinión', 'text cohesion': 'Cohesión del texto', 'paraphrase': 'Paráfrasis', 'purpose': 'Propósito del texto',
  'listening for specific words': 'Captar datos exactos', 'task achievement': 'Cumplir la tarea', 'register': 'Registro', 'organisation': 'Organización',
  'range': 'Variedad de lenguaje', 'accuracy': 'Corrección gramatical', 'fluency': 'Fluidez', 'pronunciation': 'Pronunciación', 'interaction': 'Interacción'
};
const CATEGORIES = ['vocabulario', 'gramática', 'comprensión', 'despiste', 'formato', 'tiempo'];

/* =========================================================
   Utilities
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const z2 = n => String(n).padStart(2, '0');
const dateKey = (d = new Date()) => `${d.getFullYear()}-${z2(d.getMonth() + 1)}-${z2(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const niceDate = k => { const d = fromKey(k); return `${DOW_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`; };
const shortDate = k => { const d = fromKey(k); return `${d.getDate()} ${MONTHS_ES[d.getMonth()].slice(0, 3)}`; };
const tagKey = t => String(t || 'otros').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'otros';
const tagEs = t => TAG_ES[t] || (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Otros');
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const fill = (s, P) => s.replace('{a}', P.first).replace('{b}', P.first + P.count - 1);
const normAns = s => String(s ?? '').trim().toLowerCase()
  .replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/[.!?,;:]+$/, '').trim();
const plainLetters = P => (P.letters || '').split('');
const isLetterPart = P => !!P.letters;

function partSpec(level, pid) { return EXAMS[level] && EXAMS[level].parts[pid]; }
function planOf(st) { return Object.assign({}, DEFAULT_PLAN, st && st.plan || {}); }
function sessionMinutes(level, pids) { return pids.reduce((t, id) => t + (partSpec(level, id)?.minutes || 0), 0); }
function examOrder(level, pids) { const o = EXAMS[level].order; return pids.slice().sort((a, b) => o.indexOf(a) - o.indexOf(b)); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runPool(tasks, n) {
  const out = new Array(tasks.length); let i = 0;
  async function worker() { while (i < tasks.length) { const k = i++; try { out[k] = { ok: true, v: await tasks[k]() }; } catch (e) { out[k] = { ok: false, e }; } } }
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, worker));
  return out;
}

const SAMPLE_ERR = {
  not_granted: 'No has permitido que la app use Claude. Recarga la página y acepta el permiso para generar y corregir.',
  sampling_disabled: 'Claude no está disponible para esta cuenta.',
  rate_limited: 'Has llegado al límite de uso por ahora. Espera un rato y vuelve a intentarlo.',
  session_expired: 'Tu sesión ha caducado. Vuelve a iniciar sesión en claude.ai.',
  invalid_json: 'La respuesta llegó incompleta o mal formada. Pulsa «Reintentar».',
  refused: 'Claude no ha podido generar este contenido. Prueba otra vez con otro tema.',
  empty_completion: 'La respuesta llegó vacía. Pulsa «Reintentar».',
  image_rejected: 'No he podido leer esa imagen. Prueba con otra foto (JPG o PNG, bien iluminada).',
  images_unavailable: 'Esta vista no permite enviar fotos. Escribe las respuestas a mano.',
  prompt_too_large: 'Hay demasiado texto para una sola petición.',
  cancelled: 'Cancelado.',
  upstream_error: 'Fallo de conexión con Claude. Pulsa «Reintentar».'
};
const errMsg = e => (e && (SAMPLE_ERR[e.code] || e.userMsg || e.message)) || 'Error inesperado.';
/* Grammar mini-lesson syllabus (one new point per session) */
const GRAMMAR_MIN = 5;
const G = (id, en, es, tag) => ({ id, en, es, tag });
const GRAMMAR = {
  B1: [
    G('b1-01', 'Present simple vs present continuous', 'Presente simple vs continuo', 'verb tenses'),
    G('b1-02', 'Past simple vs past continuous', 'Pasado simple vs continuo', 'verb tenses'),
    G('b1-03', 'Present perfect vs past simple', 'Present perfect vs pasado simple', 'verb tenses'),
    G('b1-04', 'Present perfect with for, since, already, yet and just', 'Present perfect con for, since, already, yet y just', 'verb tenses'),
    G('b1-05', 'Used to for past habits', 'Used to (hábitos del pasado)', 'verb tenses'),
    G('b1-06', 'Future: will vs be going to', 'Futuro: will vs going to', 'verb tenses'),
    G('b1-07', 'Present continuous for future arrangements', 'Presente continuo para planes', 'verb tenses'),
    G('b1-08', 'Comparatives and superlatives', 'Comparativos y superlativos', 'comparison'),
    G('b1-09', '(not) as ... as, too and enough', '(not) as…as, too y enough', 'comparison'),
    G('b1-10', 'Countable and uncountable nouns: some, any, much, many, a lot of', 'Contables e incontables: some, any, much, many', 'quantifiers'),
    G('b1-11', 'A few, a little, few, little', 'A few / a little / few / little', 'quantifiers'),
    G('b1-12', 'Articles: a/an, the and no article', 'Artículos: a/an, the o nada', 'articles & determiners'),
    G('b1-13', "Obligation: must, have to, don't have to, mustn't", "Obligación: must, have to, don't have to", 'modal verbs'),
    G('b1-14', 'Ability: can, could, be able to', 'Capacidad: can, could, be able to', 'modal verbs'),
    G('b1-15', 'Possibility: may, might, could', 'Posibilidad: may, might, could', 'modal verbs'),
    G('b1-16', 'Advice: should and ought to', 'Consejos: should y ought to', 'modal verbs'),
    G('b1-17', 'Zero and first conditional', 'Condicional cero y primer condicional', 'conditionals'),
    G('b1-18', 'Second conditional', 'Segundo condicional', 'conditionals'),
    G('b1-19', 'Relative clauses: who, which, that, where, whose', 'Oraciones de relativo: who, which, that, where, whose', 'relative clauses'),
    G('b1-20', 'Verb + -ing or verb + to-infinitive', 'Verbo + -ing o verbo + to', 'gerund/infinitive'),
    G('b1-21', 'The passive: present and past simple', 'La pasiva: presente y pasado', 'passive'),
    G('b1-22', 'Reported speech: statements', 'Estilo indirecto: afirmaciones', 'reported speech'),
    G('b1-23', 'Reported questions and requests (ask/tell someone to)', 'Estilo indirecto: preguntas y peticiones', 'reported speech'),
    G('b1-24', 'Question tags', 'Question tags', 'auxiliary verbs'),
    G('b1-25', 'Indirect questions (Can you tell me where...?)', 'Preguntas indirectas', 'auxiliary verbs'),
    G('b1-26', 'Prepositions of time: in, on, at', 'Preposiciones de tiempo: in, on, at', 'prepositions'),
    G('b1-27', 'Prepositions of place and movement', 'Preposiciones de lugar y movimiento', 'prepositions'),
    G('b1-28', 'Adjectives ending in -ed and -ing', 'Adjetivos en -ed y en -ing', 'word formation: adjective'),
    G('b1-29', 'Adverbs of frequency and manner: form and position', 'Adverbios: forma y posición', 'word formation: adverb'),
    G('b1-30', 'Linkers: although, however, because, so, in order to', 'Conectores: although, however, because, so', 'linking word'),
    G('b1-31', 'Past perfect simple', 'Past perfect', 'verb tenses'),
    G('b1-32', 'So and such', 'So y such', 'fixed phrase'),
    G('b1-33', 'Object and reflexive pronouns', 'Pronombres de objeto y reflexivos', 'pronouns & reference'),
    G('b1-34', 'Common phrasal verbs', 'Phrasal verbs frecuentes', 'phrasal verb'),
    G('b1-35', 'Verbs and adjectives followed by a preposition', 'Verbos y adjetivos + preposición', 'dependent preposition'),
    G('b1-36', 'Present perfect continuous', 'Present perfect continuous', 'verb tenses'),
    G('b1-37', 'Question forms: subject and object questions', 'Preguntas: de sujeto y de objeto', 'auxiliary verbs'),
    G('b1-38', 'Present simple for timetables and future time clauses (when, as soon as, until)', 'Futuro con when, as soon as, until y horarios', 'verb tenses'),
    G('b1-39', 'Irregular past simple and past participles', 'Verbos irregulares (pasado y participio)', 'verb tenses'),
    G('b1-40', 'Possessives: \'s, of, whose, mine/yours', "Posesivos: 's, of, whose, mine", 'pronouns & reference'),
    G('b1-41', 'Something, anything, nothing, everyone (indefinite pronouns)', 'Something, anything, nobody, everyone', 'pronouns & reference'),
    G('b1-42', 'Adjectives vs adverbs and the order of adjectives', 'Adjetivo o adverbio y orden de los adjetivos', 'word formation: adverb'),
    G('b1-43', 'Like: be like, look like, would like, like doing', 'Like: be like, look like, would like', 'word meaning'),
    G('b1-44', "Suggestions and offers: let's, why don't we, how about, shall I", "Sugerencias: let's, why don't we, how about", 'fixed phrase'),
    G('b1-45', 'Uses of get (get home, get better, get a present)', 'Usos de get', 'word meaning'),
    G('b1-46', 'Make, let and allow', 'Make, let y allow', 'gerund/infinitive'),
    G('b1-47', 'Both, either, neither', 'Both, either, neither', 'quantifiers'),
    G('b1-48', 'Infinitive of purpose (to, in order to, so that)', 'Finalidad: to, in order to, so that', 'linking word'),
    G('b1-49', 'Wish + past simple (introduction)', 'Wish + pasado (introducción)', 'wish/regret'),
    G('b1-50', 'Third conditional (introduction)', 'Tercer condicional (introducción)', 'conditionals'),
    G('b1-51', 'The passive with modal verbs and the present perfect', 'Pasiva con modales y present perfect', 'passive'),
    G('b1-52', 'State verbs (know, believe, want) and the continuous', 'Verbos de estado y formas continuas', 'verb tenses'),
    G('b1-53', 'Make and do collocations', 'Colocaciones con make y do', 'collocation'),
    G('b1-54', 'Prefixes and suffixes to form adjectives and nouns', 'Prefijos y sufijos (formación de palabras)', 'word formation: noun')
  ],
  B2: [
    G('b2-01', 'Narrative tenses', 'Tiempos narrativos', 'verb tenses'),
    G('b2-02', 'Present perfect simple vs present perfect continuous', 'Present perfect simple vs continuo', 'verb tenses'),
    G('b2-03', 'Future continuous and future perfect', 'Futuro continuo y futuro perfecto', 'verb tenses'),
    G('b2-04', 'Used to, would, be used to, get used to', 'Used to, would, be used to, get used to', 'verb tenses'),
    G('b2-05', 'Stative verbs', 'Verbos de estado', 'verb tenses'),
    G('b2-06', "Modals of deduction in the present: must, might, can't", 'Deducción en presente: must, might, can\'t', 'modal verbs'),
    G('b2-07', "Modals of deduction in the past: must have, might have, can't have", 'Deducción en pasado: must have, can\'t have', 'modal verbs'),
    G('b2-08', "Needn't, didn't need to, needn't have", "Needn't, didn't need to, needn't have", 'modal verbs'),
    G('b2-09', 'Should have and ought to have for criticism and regret', 'Should have: críticas y lamentos', 'modal verbs'),
    G('b2-10', 'Conditionals with unless, as long as, provided that', 'Condicionales con unless, as long as, provided', 'conditionals'),
    G('b2-11', 'Third conditional', 'Tercer condicional', 'conditionals'),
    G('b2-12', 'Mixed conditionals', 'Condicionales mixtos', 'conditionals'),
    G('b2-13', 'Wish and if only', 'Wish e if only', 'wish/regret'),
    G('b2-14', "I'd rather, it's time, had better", "I'd rather, it's time, had better", 'modal verbs'),
    G('b2-15', 'The passive in all tenses', 'La pasiva en todos los tiempos', 'passive'),
    G('b2-16', 'Impersonal passive: it is said that / he is said to', 'Pasiva impersonal: it is said that…', 'passive'),
    G('b2-17', 'Causative: have/get something done', 'Causativa: have/get something done', 'causative'),
    G('b2-18', 'Reported speech: tense and time changes', 'Estilo indirecto: cambios de tiempo', 'reported speech'),
    G('b2-19', 'Reporting verbs and their patterns (suggest, deny, admit, accuse, warn)', 'Verbos introductorios: suggest, deny, admit…', 'reported speech'),
    G('b2-20', 'Defining and non-defining relative clauses', 'Relativos especificativos y explicativos', 'relative clauses'),
    G('b2-21', 'Participle clauses', 'Oraciones de participio', 'relative clauses'),
    G('b2-22', 'Gerund or infinitive with a change of meaning (stop, remember, try, regret)', '-ing o infinitivo con cambio de significado', 'gerund/infinitive'),
    G('b2-23', 'Advanced comparison: the more..., the more; far/much/slightly + comparative', 'Comparación avanzada: the more…, the more', 'comparison'),
    G('b2-24', 'So, such, too, enough', 'So, such, too, enough', 'fixed phrase'),
    G('b2-25', 'Articles: special uses', 'Artículos: usos especiales', 'articles & determiners'),
    G('b2-26', 'Each, every, both, either, neither, none', 'Each, every, both, either, neither', 'quantifiers'),
    G('b2-27', 'Contrast: despite, in spite of, although, even though, whereas', 'Contraste: despite, although, whereas', 'linking word'),
    G('b2-28', 'Purpose: so that, in order to, so as to', 'Finalidad: so that, in order to, so as to', 'linking word'),
    G('b2-29', 'Negative inversion: never have I, not only... but also', 'Inversión: never have I, not only…', 'auxiliary verbs'),
    G('b2-30', 'Cleft sentences for emphasis (What I need is...)', 'Frases de énfasis: What I need is…', 'fixed phrase'),
    G('b2-31', 'Phrasal verbs with several meanings', 'Phrasal verbs con varios significados', 'phrasal verb'),
    G('b2-32', 'Adjective + preposition and verb + preposition', 'Adjetivo/verbo + preposición', 'dependent preposition'),
    G('b2-33', 'Future in the past: was going to, would', 'Futuro en el pasado: was going to, would', 'verb tenses'),
    G('b2-34', 'Question tags and indirect questions', 'Question tags y preguntas indirectas', 'auxiliary verbs'),
    G('b2-35', 'Permission and obligation: let, make, be allowed to', 'Let, make, be allowed to', 'modal verbs'),
    G('b2-36', 'As and like', 'As y like', 'word meaning'),
    G('b2-37', 'Hardly... when, no sooner... than', 'Hardly…when, no sooner…than', 'auxiliary verbs'),
    G('b2-38', "Preparatory it: it's worth, it's no use, it's no good", "It preparatorio: it's worth, it's no use", 'pronouns & reference'),
    G('b2-39', 'Future forms: be about to, be due to, be on the point of', 'Futuro: be about to, be due to', 'verb tenses'),
    G('b2-40', 'Past perfect continuous', 'Past perfect continuous', 'verb tenses'),
    G('b2-41', 'Ability in the past: could, was able to, managed to, succeeded in', 'Capacidad en pasado: could, was able to, managed to', 'modal verbs'),
    G('b2-42', 'Obligation: must, have to, be supposed to, be required to', 'Obligación: must, have to, be supposed to', 'modal verbs'),
    G('b2-43', 'Uncountable and abstract nouns (advice, information, news, knowledge)', 'Incontables y abstractos (advice, news…)', 'quantifiers'),
    G('b2-44', 'Quantity: a great deal of, plenty of, a large number of, hardly any', 'Cantidad: plenty of, a great deal of, hardly any', 'quantifiers'),
    G('b2-45', 'Adverbs of degree: quite, rather, fairly, pretty, extremely', 'Grado: quite, rather, fairly, pretty', 'word meaning'),
    G('b2-46', 'Verb + object + infinitive or -ing (want sb to, avoid doing, suggest doing)', 'Patrones verbales: want sb to, avoid doing', 'gerund/infinitive'),
    G('b2-47', 'Infinitive and -ing after adjectives and nouns', 'Infinitivo o -ing tras adjetivos y nombres', 'gerund/infinitive'),
    G('b2-48', 'Relative clauses with prepositions and whose, whom, which (referring to a clause)', 'Relativos con preposición, whom y which', 'relative clauses'),
    G('b2-49', 'Habits: tend to, will, would, keep (on) doing, be always -ing', 'Hábitos: tend to, will, would, keep doing', 'verb tenses'),
    G('b2-50', 'Time linkers: as soon as, once, by the time, until, while', 'Conectores de tiempo: once, by the time, until', 'linking word'),
    G('b2-51', 'In case, otherwise, or else, whether', 'In case, otherwise, whether', 'linking word'),
    G('b2-52', 'Compound adjectives (well-known, two-hour, open-minded)', 'Adjetivos compuestos', 'word formation: adjective'),
    G('b2-53', 'Word order: position of adverbs and adverbials', 'Orden de palabras y posición de adverbios', 'word formation: adverb'),
    G('b2-54', 'The get passive and get + adjective/participle', 'Get + participio (get married, get lost)', 'passive'),
    G('b2-55', 'Reported questions, requests and commands', 'Estilo indirecto: preguntas y órdenes', 'reported speech'),
    G('b2-56', 'Prefixes and suffixes: negative prefixes and noun/adjective suffixes', 'Prefijos negativos y sufijos', 'word formation: prefix/negative'),
    G('b2-57', 'Expressions with make, do, take, have, give', 'Expresiones con make, do, take, have, give', 'collocation'),
    G('b2-58', 'Fixed prepositional phrases (in charge of, on purpose, by mistake)', 'Expresiones fijas con preposición', 'fixed phrase')
  ],
  C1: [
    G('c1-01', 'Inverted conditionals: Should you need..., Had I known...', 'Condicionales con inversión', 'conditionals'),
    G('c1-02', "The subjunctive: It's essential that he be...", 'El subjuntivo en inglés', 'modal verbs'),
    G('c1-03', 'Ellipsis and substitution: so, not, do so, one', 'Elipsis y sustitución', 'pronouns & reference'),
    G('c1-04', 'Modal perfect continuous: must have been doing', 'Modales perfectos continuos', 'modal verbs'),
    G('c1-05', 'Advanced passive forms: having been done, to have been done', 'Pasiva avanzada', 'passive'),
    G('c1-06', 'Discourse markers: admittedly, nevertheless, as a matter of fact', 'Marcadores del discurso', 'linking word'),
    G('c1-07', 'Whatever, whoever, however, wherever', 'Whatever, whoever, however, wherever', 'pronouns & reference'),
    G('c1-08', 'Nominalisation in formal writing', 'Nominalización en textos formales', 'word formation: noun'),
    G('c1-09', 'Inversion after restrictive adverbials: rarely, little, only then, not until', 'Inversión: rarely, little, only then, not until', 'auxiliary verbs'),
    G('c1-10', 'Inversion with so and such: So great was..., Such was...', 'Inversión con so y such', 'auxiliary verbs'),
    G('c1-11', 'Cleft sentences: It was... that, All I..., The thing is...', 'Frases hendidas: It was… that, All I…', 'fixed phrase'),
    G('c1-12', 'Fronting and emphasis', 'Anteposición y énfasis', 'text cohesion'),
    G('c1-13', 'Advanced participle clauses: Having finished..., Not knowing..., Given that...', 'Participio avanzado: Having finished…', 'relative clauses'),
    G('c1-14', 'Reduced relative clauses', 'Relativos reducidos', 'relative clauses'),
    G('c1-15', 'Implied and alternative conditionals: but for, otherwise, supposing, were it not for', 'Condicionales: but for, supposing, were it not for', 'conditionals'),
    G('c1-16', "Unreal past: wish, if only, would rather, it's high time, as if", "Pasado irreal: wish, would rather, as if", 'wish/regret'),
    G('c1-17', 'Distancing and hedging: it would seem that, appear to, is thought to', 'Distanciamiento: it would seem, appear to', 'passive'),
    G('c1-18', 'Probability: be bound to, be likely to, be set to, there is every chance', 'Probabilidad: be bound to, be likely to', 'modal verbs'),
    G('c1-19', 'Future: be to, be on the verge of, future perfect continuous', 'Futuro avanzado: be to, future perfect continuous', 'verb tenses'),
    G('c1-20', 'Advanced comparison: nowhere near as, by far, every bit as, all the more', 'Comparación: nowhere near, by far, all the more', 'comparison'),
    G('c1-21', 'Advanced quantifiers: few if any, neither of whom, the vast majority', 'Cuantificadores avanzados', 'quantifiers'),
    G('c1-22', 'Concession and contrast: albeit, much as, even so, notwithstanding', 'Concesión: albeit, much as, notwithstanding', 'linking word'),
    G('c1-23', 'Formal linkers: whereby, insofar as, in that, inasmuch as', 'Conectores formales: whereby, in that', 'linking word'),
    G('c1-24', 'Three-part phrasal verbs (put up with, come up against, face up to)', 'Phrasal verbs de tres partes', 'phrasal verb'),
    G('c1-25', 'Annoying habits and past habits: will, would, be forever -ing', 'Hábitos molestos: be forever -ing', 'verb tenses'),
    G('c1-26', 'Complex verb patterns and the perfect infinitive (seem to have done)', 'Infinitivo perfecto: seem to have done', 'gerund/infinitive'),
    G('c1-27', 'Articles with abstract and generic nouns', 'Artículos con nombres abstractos y genéricos', 'articles & determiners'),
    G('c1-28', 'Prepositional phrases: in the wake of, on the verge of, with a view to', 'Expresiones: in the wake of, with a view to', 'dependent preposition'),
    G('c1-29', 'Collocations and fixed expressions for formal writing', 'Colocaciones para textos formales', 'collocation'),
    G('c1-30', 'Substitution and reference across a text (the former, the latter, such, this)', 'Referencias: the former, the latter, such', 'text cohesion')
  ]
};
const allGrammar = () => [...GRAMMAR.B1, ...GRAMMAR.B2, ...GRAMMAR.C1];
const examBudget = st => Math.max(8, (+(st && st.minutes) || 20) - GRAMMAR_MIN);
</script>

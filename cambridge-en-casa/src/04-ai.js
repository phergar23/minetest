<script>
/* =========================================================
   Prompts: generation
   ========================================================= */
function kindSpec(level, P) {
  const a = P.first, b = P.first + P.count - 1, B2 = level === 'B2';
  const ex0 = P.example ? 'Put the example gap [[0]] in the first sentence, then put' : 'Put';
  const Q = (extra) => `{"n":${a},${extra}"explanation":"...","tag":"...","point":"..."}`;
  switch (P.kind) {
    case 'mcq-cloze': return {
      rules: `One text of ${B2 ? '170–210' : '120–150'} words with a short title. ${ex0} gaps [[${a}]] to [[${b}]] in order through the text (write every gap exactly like [[${a}]]). Each gap has four options A–D of the same word class and form; only one fits by meaning, collocation or grammar. Test ${B2 ? 'collocations, fixed phrases, phrasal verbs, dependent prepositions, linking words and words with close meanings' : 'words with similar meanings, collocations, phrasal verbs, prepositions and linking words'}. Spread the correct letters across A–D.`,
      shape: `{"topic":"2-4 words","title":"...","text":"... [[${P.example ? 0 : a}]] ... [[${a}]] ...",${P.example ? '"example":{"options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"B"},' : ''}"questions":[${Q('"options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"C",')}]}`
    };
    case 'open-cloze': return {
      rules: `One text of ${B2 ? '170–210' : '120–150'} words with a short title. ${ex0} gaps [[${a}]] to [[${b}]] in order (write every gap exactly like [[${a}]]). Each gap takes ONE word only, mostly grammar words (articles, prepositions, auxiliaries, pronouns, relatives, quantifiers, linkers, parts of phrasal verbs or fixed phrases). "accept" lists every acceptable answer in lower case.`,
      shape: `{"topic":"2-4 words","title":"...","text":"...",${P.example ? '"example":{"answer":"which"},' : ''}"questions":[${Q('"answer":"which","accept":["which","that"],')}]}`
    };
    case 'word-formation': return {
      rules: `One text of 170–210 words with a short title. Put the example gap [[0]] in the first sentence, then gaps [[${a}]] to [[${b}]] in order, never two gaps in the same sentence. Each gap has a stem word in CAPITALS that must be changed to fit (suffixes, prefixes, negative forms, plurals, internal changes; at least three items need two changes, e.g. prefix + suffix). "accept" lists acceptable spellings in lower case.`,
      shape: `{"topic":"2-4 words","title":"...","text":"...","example":{"stem":"ACHIEVE","answer":"achievement"},"questions":[${Q('"stem":"COMPETE","answer":"competition","accept":["competition"],')}]}`
    };
    case 'transformation': return {
      rules: `Six unrelated items plus an example. Each has a first sentence, a KEY WORD in capitals and a second sentence containing exactly one gap written as ____ . The answer (2–5 words including the key word, key word unchanged) makes the second sentence mean the same as the first. Test typical B2 structures (passive, reported speech, conditionals, wish, comparison, modals, phrasal verbs, fixed expressions). "chunks" splits the answer into the two parts that earn one mark each. "accept" lists full alternative answers in lower case.`,
      shape: `{"topic":"mixed grammar","example":{"first":"...","keyword":"...","second":"... ____ ...","answer":"..."},"questions":[${Q('"first":"...","keyword":"UNLESS","second":"You won\'t get fit ____ more exercise.","answer":"unless you do","accept":["unless you do","unless you take"],"chunks":["unless","you do"],')}]}`
    };
    case 'reading-mc': return {
      rules: B2
        ? `An article or novel extract of 550–650 words in 5–7 paragraphs (separate paragraphs with \\n\\n), a title, and an "intro" sentence like "You are going to read an article about a teenage inventor." ${P.count} questions in text order with four options A–D; test detail, opinion and attitude, purpose, reference, meaning from context, and (last question) the text as a whole.`
        : `A text of 300–350 words in 4–5 paragraphs (separate with \\n\\n), a title and an "intro" sentence. ${P.count} questions in text order with options A–D; the last one tests the whole text (e.g. the writer's purpose).`,
      shape: `{"topic":"2-4 words","intro":"You are going to read ...","title":"...","text":"Paragraph...\\n\\nParagraph...","questions":[${Q('"stem":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"B","evidence":"short quote from the text",')}]}`
    };
    case 'gapped': return {
      rules: B2
        ? `An article of 500–600 words with a title and an "intro" sentence. Remove six sentences to create gaps [[${a}]] to [[${b}]] (write each gap exactly like [[${a}]] where the sentence was). "options" has seven sentences A–G: the six removed ones in shuffled order plus one extra that does not fit anywhere. Each letter is the answer only once. Use reference words (this, they, such, however...) so that cohesion decides the answers.`
        : `A text of 280–330 words with a title and an "intro" sentence. Remove five sentences to create gaps [[${a}]] to [[${b}]]. "options" has eight sentences A–H: the five removed ones shuffled plus three extra ones. Each letter is the answer only once.`,
      shape: `{"topic":"2-4 words","intro":"You are going to read ...","title":"...","text":"... [[${a}]] ...","options":{${P.letters.split('').map(l => `"${l}":"..."`).join(',')}},"questions":[${Q('"answer":"D",')}]}`
    };
    case 'matching': return {
      rules: `Four texts A–D (130–170 words each), each by or about a different teenager (use their name as "heading"), on one shared theme, and an "intro" sentence. Ten statements (questions ${a}–${b}) that paraphrase information from ONE text each, never word for word; each letter is the answer two or three times. Each statement completes "Which person ...", starting with a verb phrase in lower case, e.g. "admits feeling nervous at first".`,
      shape: `{"topic":"2-4 words","intro":"You are going to read about four teenagers who ...","title":"...","sections":[{"id":"A","heading":"Name","text":"..."}],"questions":[${Q('"stem":"admits feeling nervous at first","answer":"C",')}]}`
    };
    case 'notices': return {
      rules: `Five different short real-life texts (a notice, a text message, an email or note, a sign or label, a post on a school noticeboard), 15–40 words each. Each has three options A–C; exactly one says the same as the text in different words.`,
      shape: `{"topic":"everyday messages","questions":[${Q('"textType":"Text message","text":"...","options":{"A":"...","B":"...","C":"..."},"answer":"A",')}]}`
    };
    case 'people-match': return {
      rules: `Five young people (questions ${a}–${b}), each described in 2–3 sentences with three specific requirements, and eight short texts A–H (45–60 words each, with a heading) about ONE theme (e.g. summer courses, books, apps, museums). For each person exactly one text meets all three requirements; other texts meet only one or two. Give a short "title" for the theme and an "intro" such as "The young people below all want to join a summer course."`,
      shape: `{"topic":"2-4 words","title":"...","intro":"...","questions":[${Q('"name":"Luca","text":"...","answer":"C",')}],"sections":[{"id":"A","heading":"...","text":"..."}]}`
    };
    case 'l-extracts': return {
      rules: B2
        ? `Eight unrelated short recordings (80–110 words each; monologues or dialogues of two speakers). Each has a "context" sentence read to the student (e.g. "You hear two friends talking about a film."), a question and three options A–C. Every option is mentioned or suggested in the script but only one is correct, and it is expressed with different words (paraphrase).`
        : (P.first === 1
          ? `Seven short recordings (50–80 words each). Each has a "context" sentence, a question (e.g. "What time will the match start?") and three SHORT options A–C (a few words each; they replace the pictures of the real exam). All three options are mentioned in the script; only one is correct.`
          : `Six short conversations between two people (70–100 words each). Each has a "context" sentence, a question about opinion, feeling, purpose or agreement, and three options A–C.`),
      shape: `{"topic":"mixed situations","questions":[${Q('"context":"You hear two friends talking about a film.","stem":"What does the girl think about it?","options":{"A":"...","B":"...","C":"..."},"answer":"B","script":[{"speaker":"Girl","gender":"f","text":"..."},{"speaker":"Boy","gender":"m","text":"..."}],')}]}`
    };
    case 'l-gap': return {
      rules: B2
        ? `A monologue of 550–650 words by one speaker, with an "intro" like "You will hear a girl called Emma talking about volunteering at a wildlife park." ${P.count} sentences (${a}–${b}) in the same order as the recording; each has one gap [[n]] completed with 1–3 words the speaker says EXACTLY. Put a distracting detail near several answers. "accept" lists acceptable variants in lower case.`
        : `A monologue of 300–380 words with an "intro" like "You will hear a boy called Leo talking about a cooking course." ${P.count} sentences or notes (${a}–${b}), each with a gap [[n]] completed with one or two words, a number, a date or a time heard exactly. "accept" lists acceptable variants in lower case.`,
      shape: `{"topic":"2-4 words","intro":"You will hear ...","speaker":{"name":"Emma","gender":"f"},"script":"The whole monologue...","questions":[${Q(`"sentence":"Emma first visited the park when she was [[${a}]].","answer":"eleven","accept":["eleven","11"],`)}]}`
    };
    case 'l-speakers': return {
      rules: `Five speakers (questions ${a}–${b}), 90–120 words each, all talking about the same topic, and an "intro" like "You will hear five short extracts in which teenagers are talking about learning a musical instrument." Eight statements A–H: each speaker matches exactly one, three are extra. The matching idea is expressed indirectly, and each speaker also mentions something related to another option.`,
      shape: `{"topic":"2-4 words","intro":"You will hear five short extracts in which ...","options":{"A":"...","B":"...","C":"...","D":"...","E":"...","F":"...","G":"...","H":"..."},"questions":[${Q('"speaker":"Speaker 1","gender":"f","script":"...","answer":"D",')}]}`
    };
    case 'l-interview': return {
      rules: B2
        ? `An interview of 650–750 words between an Interviewer and one guest, with an "intro" like "You will hear an interview with a young chef called Tom Price." ${P.count} questions (${a}–${b}) in recording order with options A–C, testing opinion, attitude, detail and gist.`
        : `An interview of 380–450 words between an Interviewer and one young guest, with an "intro" sentence. ${P.count} questions (${a}–${b}) in recording order with options A–C.`,
      shape: `{"topic":"2-4 words","intro":"You will hear an interview with ...","script":[{"speaker":"Interviewer","gender":"f","text":"..."},{"speaker":"Tom","gender":"m","text":"..."}],"questions":[${Q('"stem":"...","options":{"A":"...","B":"...","C":"..."},"answer":"A",')}]}`
    };
  }
  return { rules: '', shape: '{}' };
}

function studentLine(st) {
  return `Student: ${st.name}${st.age ? `, ${st.age} years old` : ''}, a Spanish teenager.${st.interests ? ` Interests: ${st.interests}.` : ''}`;
}

function genPartPrompt(st, pid, ctx) {
  const ex = EXAMS[st.level], P = ex.parts[pid], sp = kindSpec(st.level, P), d = diffOf(st, pid);
  return [
    `You are an experienced Cambridge English item writer. Write ONE original practice task that mirrors ${ex.name} (CEFR ${ex.cefr}), ${P.paper} ${P.label}: ${P.title}.`,
    studentLine(st),
    `Difficulty ${d}/5 within ${ex.cefr}: ${DIFF[d]}.`,
    `Topic: something engaging for teenagers. Do NOT reuse these recent topics: ${ctx.recentTopics.join('; ') || 'none'}.`,
    ctx.weak.length ? `Where it fits naturally, include items that practise the student's weak points: ${ctx.weak.join('; ')}.` : '',
    ctx.note ? `The parent adds this request for today's session (follow it as long as it fits the task format): "${ctx.note}".` : '',
    'Rules:',
    '- 100% original content: never copy or adapt published exam material. British English.',
    '- Exactly one defensible correct answer per item. Distractors must be plausible but wrong for a reason a teacher can explain.',
    `- Question numbers go from ${P.first} to ${P.first + P.count - 1}.`,
    '- "explanation": Spanish, 1–2 short sentences addressed to the student (tú): why the answer is right and, if useful, why the trap is wrong.',
    `- "tag": exactly one of: ${TAGS.join(' | ')}.`,
    '- "point": the specific language point in English, max 6 words.',
    `- ${sp.rules}`,
    'Before replying, silently check every item: one correct answer only, the key is right, the numbering is right.',
    `Reply with ONLY a JSON object with this shape (the questions array has all ${P.count} items):`,
    sp.shape
  ].filter(Boolean).join('\n');
}

function genGrammarPrompt(st, topic, note) {
  const ex = EXAMS[st.level];
  return [
    `You are an experienced English teacher of Spanish teenagers preparing ${ex.name} (${ex.cefr}). Write a 5-minute grammar mini-lesson and a short exercise on ONE grammar point.`,
    studentLine(st),
    `Grammar point: ${topic.en}.${topic.custom ? ' (Chosen by the parent, possibly written in Spanish; interpret it as a grammar point and teach it at the right level.)' : ''}`,
    note ? `The parent adds this request for today (use it to choose the examples and context): "${note}".` : '',
    'The student reads the lesson alone in about 2 minutes, then does the exercise in about 3 minutes. Be clear, concrete and friendly. Write in Spanish (tú) with English examples.',
    '"explanation": 80–140 words in Spanish: what it is, when we use it and how it is formed. No jargon without an example.',
    '"forms": 2–5 rows {"form": short pattern, "example": English example}.',
    '"examples": 3 English sentences, each followed by " — " and the Spanish translation.',
    '"tip": one sentence in Spanish about the typical mistake Spanish speakers make with this point.',
    `"exercise": exactly 6 short items (one sentence each) practising ONLY this point, from easy to harder, mixing "gap" (write 1–3 words; give the base verb in brackets when useful), "choice" (options A–C) and "rewrite" (rewrite or complete a sentence). Each item has "answer", "accept" (every acceptable answer, lower case), "explanation" (Spanish, one short sentence) and "tag" (one of: ${TAGS.join(' | ')}).`,
    'Check silently that each item has only one correct answer (or list all correct ones in "accept").',
    `Reply with ONLY JSON: {"topic":"${topic.en.replace(/"/g, "'")}","title":"Spanish title","explanation":"...","forms":[{"form":"have/has + past participle","example":"I have finished."}],"examples":["... — ..."],"tip":"...","exercise":{"instruction":"English instruction","items":[{"type":"gap","prompt":"She ___ (live) here since 2019.","answer":"has lived","accept":["has lived","'s lived"],"explanation":"...","tag":"verb tenses"},{"type":"choice","prompt":"...","options":{"A":"...","B":"...","C":"..."},"answer":"B","accept":[],"explanation":"...","tag":"verb tenses"}]}}`
  ].join('\n');
}

function pickGrammarTopic(st) {
  const done = new Set(st.grammarDone || []);
  const lists = st.level === 'B2' ? [GRAMMAR.B2, GRAMMAR.C1] : [GRAMMAR.B1, GRAMMAR.B2];
  const weak = new Set(weakTags(S.notebooks[st.id]).slice(0, 6).map(t => tagKey(t.tag)));
  for (const list of lists) {
    const left = list.filter(t => !done.has(t.id));
    if (left.length) return left.find(t => weak.has(tagKey(t.tag))) || left[0];
  }
  const all = lists[0];
  return all[(st.grammarDone || []).length % all.length];
}

function genWritingPrompt(st, part, ctx) {
  const ex = EXAMS[st.level], B2 = st.level === 'B2', d = diffOf(st, 'W' + part);
  const words = B2 ? '120–150' : 'about 100';
  let task;
  if (part === 1 && B2) {
    task = `Writing Part 1: an essay. Give a "context" ("In your English class you have been talking about ... Now, your English teacher has asked you to write an essay."), an "instruction" ("Write an essay using all the notes and giving reasons for your point of view."), a debatable "question" and "notes" with two ideas plus "(your own idea)". Length ${words} words.
Shape: {"topic":"2-4 words","part":1,"type":"essay","context":"...","instruction":"...","question":"...?","notes":["...","...","(your own idea)"],"words":"${words}","tips":[],"usefulLanguage":[],"plan":[],"model":"..."}`;
  } else if (part === 1) {
    task = `Writing Part 1: an email. Write an email from an English-speaking friend (60–90 words) and four short notes the student has made on it (each note is attached to an exact phrase of the email, e.g. "Great!", "Tell Sam", "Suggest ...", "Explain ..."). Length of the student's answer: ${words} words.
Shape: {"topic":"2-4 words","part":1,"type":"email","context":"Read this email from your English friend Sam and the notes you have made.","email":{"from":"Sam","subject":"...","body":"..."},"notes":[{"after":"exact phrase from the email","note":"Tell Sam"}],"instruction":"Write your email to Sam using all the notes.","words":"${words}","tips":[],"usefulLanguage":[],"plan":[],"model":"..."}`;
  } else {
    const types = ex.writing.p2types;
    const pick = types.slice().sort(() => Math.random() - .5).slice(0, 2);
    task = `Writing Part 2: give TWO options for the student to choose from, types "${pick[0]}" and "${pick[1]}". Each option is a complete task as printed in the exam (situation, what to write, points to include; a story gives the first sentence${B2 ? ' or the words it must include' : ''}). Length ${words} words. "model" answers option 1.
Shape: {"topic":"2-4 words","part":2,"type":"choice","words":"${words}","options":[{"type":"${pick[0]}","text":"..."},{"type":"${pick[1]}","text":"..."}],"tips":[],"usefulLanguage":[],"plan":[],"model":"..."}`;
  }
  return [
    `You are an experienced Cambridge English item writer. Write ONE original ${ex.name} (${ex.cefr}) Writing task.`,
    studentLine(st),
    `Difficulty ${d}/5 within ${ex.cefr}: ${DIFF[d]}.`,
    `This is a 15-minute training task (3 minutes planning, 12 minutes writing), so keep the task focused and the word range at ${words} words${B2 ? ' (the real exam asks for 140–190)' : ''}.`,
    `Avoid these recent topics: ${ctx.recentTopics.join('; ') || 'none'}.`,
    ctx.weak.length ? `The student's weak points (you may reflect them in the tips): ${ctx.weak.join('; ')}.` : '',
    ctx.note ? `The parent adds this request for today's session (follow it as long as it fits the task format): "${ctx.note}".` : '',
    task,
    '"tips": 3 short tips in Spanish for this task type. "usefulLanguage": 8 useful English phrases for it. "plan": a paragraph-by-paragraph plan in Spanish (3–5 short lines). "model": a model answer at a solid level for the exam, within the word range.',
    'Reply with ONLY the JSON object.'
  ].filter(Boolean).join('\n');
}

function genSpeakingPrompt(st, ctx) {
  const ex = EXAMS[st.level], B2 = st.level === 'B2';
  const note = ctx.note ? `The parent adds this request for today: "${ctx.note}".` : '';
  const p2 = B2
    ? '"part2": the student compares two photographs (describe each photo in detail for the parent in "description", and give English image-search keywords in "search"), a printed "question" (e.g. "Why have the people decided to spend their free time in these ways?"), and a "followUp" question for the partner.'
    : '"part2": each candidate describes one photograph for about one minute (photo A for the student, photo B for the parent-partner). Describe each photo in "description" and give English image-search keywords in "search". "question" is "Describe your photograph."';
  const p3 = B2
    ? '"part3": a collaborative task: "situation" (read by the examiner), a central "question", five "prompts" around it, and a "decision" question for the final minute.'
    : '"part3": a collaborative task: "situation" (read by the examiner, e.g. "A young man is going to university next month. Talk together about the things he could take with him..."), five or six "prompts" (short ideas that replace the pictures) and a "decision" question.';
  return [
    `Write ONE original ${ex.name} (${ex.cefr}) Speaking test to practise at home. A parent plays both the examiner and the partner.`,
    studentLine(st),
    `Avoid these recent topics: ${ctx.recentTopics.join('; ') || 'none'}.`,
    note,
    `"part1": 6 personal interview questions. ${p2} ${p3} "part4": 5 discussion questions on the Part 3 topic.`,
    '"phrases": 4 groups of useful phrases for the student ({"function":"Comparing","items":[5 phrases]}). "listenFor": 4 things in Spanish the parent should listen for when marking.',
    'Reply with ONLY JSON: {"topic":"2-4 words","part1":{"questions":[]},"part2":{"question":"...","photos":[{"label":"A","description":"...","search":"..."},{"label":"B","description":"...","search":"..."}],"followUp":"..."},"part3":{"situation":"...","question":"...","prompts":[],"decision":"..."},"part4":{"questions":[]},"phrases":[{"function":"...","items":[]}],"listenFor":[]}'
  ].join('\n');
}

/* =========================================================
   Prompts: correction
   ========================================================= */
const PRACTICE_SHAPE = '"practice":[{"id":"E1","type":"choice","prompt":"We need to ___ a decision.","options":{"A":"do","B":"make","C":"take"},"answer":"B","explanation":"..."},{"id":"E2","type":"gap","prompt":"...","answer":"..."},{"id":"E3","type":"rewrite","prompt":"...","answer":"..."}]';
const LESSONS_SHAPE = '"lessons":[{"title":"...","explanation":"...","examples":["...","..."]}]';

function gradePrompt(st, sess, items, answers, marks) {
  const ex = EXAMS[st.level];
  const byPart = {};
  items.filter(i => !i.review && !i.grammar).forEach(i => { const b = byPart[i.pid] || (byPart[i.pid] = { s: 0, m: 0 }); b.m += i.max; b.s += marks[i.key].status === 'correct' ? i.max : 0; });
  const scoreLines = Object.entries(byPart).map(([pid, b]) => `${ex.parts[pid].label} ${ex.parts[pid].title}: ${b.s}/${b.m} so far`);
  const bad = items.filter(i => marks[i.key].status !== 'correct');
  const rows = bad.map(i => JSON.stringify({
    id: i.key,
    part: i.review ? 'warm-up review' : i.grammar ? `grammar mini-lesson exercise (${sess.grammar?.topic || ''})` : `${ex.parts[i.pid].label} ${ex.parts[i.pid].title}`,
    context: itemContext(i).slice(0, 420),
    key: keyText(i),
    accepted: i.type === 'text' ? (i.q.accept || []).slice(0, 6) : undefined,
    chunks: i.q.chunks,
    given: answers[i.key] ? String(answers[i.key]) : '',
    status: marks[i.key].status,
    max: i.max,
    tag: i.q.tag, point: i.q.point
  }));
  return [
    `You are marking a ${ex.name} (${ex.cefr}) practice session for ${st.name}, a Spanish teenager.`,
    `Scores: ${scoreLines.join(' · ') || 'n/a'}.`,
    bad.length ? 'Items that are not automatically correct (JSON lines):' : 'The student got every item right.',
    ...rows,
    'Tasks:',
    '1. For every item with status "check", decide whether the answer is acceptable in the real exam (spelling must be correct; for items with "chunks" award 0, 1 or 2 points, one per chunk). Put the result in "judgments".',
    `2. For EVERY item that is wrong, blank or not fully correct after your judgement, add an entry to "errors": "category" (one of ${CATEGORIES.join(', ')}; blank items at the end of a part usually mean "tiempo", a correct idea with a spelling slip means "despiste", ignoring the instructions means "formato"), "tag" (one of: ${TAGS.join(' | ')}), "point" (English, max 6 words) and "explanation" (Spanish, 1–2 sentences to the student, tú: why their answer is wrong and why the key is right).`,
    '3. "summary": 2–3 encouraging, specific sentences in Spanish to the student. "parentNote": 1–2 sentences in Spanish for the parent: what to reinforce this week.',
    `4. "lessons": 1–3 mini-lessons in Spanish for the most important patterns in the errors (title, short explanation, 2–3 English examples). If there are no errors, one lesson that stretches the student towards ${ex.next}.`,
    '5. "practice": 6–8 NEW short reinforcement items targeting those errors (same level; mix "choice", "gap" and "rewrite"; explanation in Spanish). If there are no errors, 4 challenge items.',
    `Reply with ONLY JSON: {"judgments":[{"id":"U2:12","points":1,"note":"Spanish, short"}],"errors":[{"id":"U1:3","category":"vocabulario","tag":"collocation","point":"make a decision","explanation":"..."}],"summary":"...","parentNote":"...",${LESSONS_SHAPE},${PRACTICE_SHAPE}}`
  ].join('\n');
}

function writingTaskText(w, choice) {
  if (!w) return '';
  if (w.type === 'choice') {
    const o = (w.options || [])[choice || 0] || {};
    return `${o.type || ''}: ${o.text || ''}`;
  }
  if (w.type === 'email') {
    return `${w.context}\nEmail from ${w.email?.from}: ${w.email?.body}\nNotes: ${(w.notes || []).map(n => `"${n.after}" → ${n.note}`).join('; ')}\n${w.instruction}`;
  }
  return `${w.context}\n${w.instruction}\nQuestion: ${w.question}\nNotes: ${(w.notes || []).join('; ')}`;
}

function writingGradePrompt(st, sess, text, hasImages, choice) {
  const ex = EXAMS[st.level], w = sess.writing;
  return [
    `You are an experienced Cambridge English examiner for ${ex.name} Writing. Assess the student's answer with the four official subscales (Content, Communicative Achievement, Organisation, Language), each 0–5 and calibrated to ${ex.cefr} (3 = solid pass at ${ex.cefr}, 5 = excellent for the level).`,
    studentLine(st),
    `Task (${w.words} words):\n${writingTaskText(w, choice)}`,
    'This was a 15-minute training task, so judge length against the word range given in the task, not the full exam length.',
    hasImages
      ? 'The student\'s handwritten answer is in the attached photo(s). First transcribe it exactly as written, keeping every mistake.'
      : `Student's answer:\n"""\n${text}\n"""`,
    `"corrections": up to 12, most important first; "original" copies the student's exact words. "tag" is one of: ${TAGS.join(' | ')}. "category" is one of: ${CATEGORIES.join(', ')}.`,
    `"improved": the student's text rewritten at a strong ${ex.cefr} level keeping their ideas and length. "lessons": 1–2 mini-lessons in Spanish on the main weaknesses. "practice": 6 short items on those weaknesses.`,
    `Reply with ONLY JSON: {"transcript":"...","wordCount":0,"scores":{"content":0,"communicative":0,"organisation":0,"language":0},"summary":"Spanish, 2–3 sentences to the student","strengths":["Spanish"],"improvements":["Spanish, concrete"],"corrections":[{"original":"...","corrected":"...","why":"Spanish","tag":"...","category":"..."}],"improved":"...","parentNote":"Spanish",${LESSONS_SHAPE},${PRACTICE_SHAPE}}`
  ].join('\n');
}

function speakingFeedbackPrompt(st, sess, marks, notes) {
  const ex = EXAMS[st.level];
  return [
    `You coach Cambridge English Speaking. A parent ran a ${ex.name} (${ex.cefr}) Speaking practice at home with ${st.name} (Spanish teenager) on the topic "${sess.speaking?.topic || ''}". Turn the parent's marks and notes into feedback.`,
    `Marks (0–5): Grammar and Vocabulary ${marks.gv}, Discourse Management ${marks.dm}, Pronunciation ${marks.pr}, Interactive Communication ${marks.ic}.`,
    `Parent's notes:\n"""\n${notes || '(no notes)'}\n"""`,
    `"corrections": the errors mentioned in the notes with a corrected version (tag one of: ${TAGS.join(' | ')}; category one of: ${CATEGORIES.join(', ')}). "phrases": 8 useful phrases to use next time.`,
    `Reply with ONLY JSON: {"summary":"Spanish, to the student","strengths":["Spanish"],"improvements":["Spanish"],"corrections":[{"original":"...","corrected":"...","why":"Spanish","tag":"...","category":"..."}],"phrases":["..."],"parentNote":"Spanish",${PRACTICE_SHAPE}}`
  ].join('\n');
}

function sheetReadPrompt(sess) {
  const ex = EXAMS[sess.level];
  const lines = [];
  if (sess.grammar) lines.push(`- Grammar → keys ${sess.grammar.items.map(r => `"GR:${r.n}"`).join(', ')}: letters or words`);
  if (sess.review) lines.push(`- Warm-up → keys ${sess.review.items.map(r => `"RV:${r.n}"`).join(', ')}: letters or words`);
  for (const p of sess.parts || []) {
    const P = ex.parts[p.id];
    lines.push(`- ${P.paper} ${P.label} → keys "${p.id}:${P.first}" … "${p.id}:${P.first + P.count - 1}" (questions ${P.first}–${P.first + P.count - 1}): ${P.letters ? `one letter (${P.letters.split('').join('/')})` : 'written word(s)'}`);
  }
  return [
    'The photo(s) show a student\'s filled-in practice answer sheet (or exercise pages). Read the student\'s answers.',
    ...lines,
    'Transcribe exactly what the student wrote or marked, including spelling mistakes; never correct anything. Blank, unreadable or ambiguous (two marks) answers are null. For lozenge rows, the answer is the shaded lozenge.',
    'Reply with ONLY JSON: {"answers":{"GR:G1":"A","U1:1":"B","U2:9":"WHICH"}} using keys exactly as listed above.'
  ].join('\n');
}

/* =========================================================
   Claude calls
   ========================================================= */
async function ask(prompt, o = {}) {
  if (!S.sample) { const e = new Error('no sample'); e.code = 'no_sample'; e.userMsg = 'Claude no está disponible en esta vista. Abre la app dentro de claude.ai (web o app) para generar y corregir.'; throw e; }
  const opts = { modelTier: o.tier || 'default', cache: false };
  if (o.signal) opts.signal = o.signal;
  if (o.images && o.images.length) opts.images = o.images;
  if (o.onText) opts.onText = o.onText;
  return S.sample.json(prompt, opts);
}

function badGen(msg) { const e = new Error(msg); e.userMsg = 'Contenido incompleto (' + msg + '). Pulsa «Reintentar».'; return e; }
const str = v => (v == null ? '' : String(v));

function normalizePart(level, pid, raw) {
  const P = partSpec(level, pid);
  if (!raw || typeof raw !== 'object') throw badGen('respuesta vacía');
  let qs = Array.isArray(raw.questions) ? raw.questions.filter(q => q && typeof q === 'object') : [];
  if (qs.length < P.count) throw badGen(`${qs.length} de ${P.count} preguntas`);
  qs = qs.slice(0, P.count);
  const map = {};
  qs.forEach((q, i) => { const n = P.first + i; if (q.n != null && String(q.n) !== String(n)) map[String(q.n)] = n; q.n = n; });
  const remap = s => typeof s === 'string' ? s.replace(/\[\[\s*(\d+)\s*\]\]/g, (m, k) => `[[${map[k] ?? k}]]`) : s;
  const part = {
    id: pid, kind: P.kind, topic: str(raw.topic), title: str(raw.title), intro: str(raw.intro),
    text: remap(str(raw.text)), example: raw.example || null, options: raw.options || null,
    sections: Array.isArray(raw.sections) ? raw.sections : null,
    script: raw.script || null, speaker: raw.speaker || null
  };
  part.questions = qs.map(q => {
    const o = { n: q.n, explanation: str(q.explanation), tag: str(q.tag), point: str(q.point) };
    for (const k of ['stem', 'context', 'textType', 'text', 'name', 'speaker', 'gender', 'first', 'keyword', 'second', 'evidence', 'from']) if (q[k] != null) o[k] = str(q[k]);
    if (q.sentence != null) o.sentence = remap(str(q.sentence));
    if (q.options && typeof q.options === 'object') o.options = q.options;
    if (Array.isArray(q.script)) o.script = q.script;
    else if (q.script != null) o.script = str(q.script);
    if (Array.isArray(q.chunks)) o.chunks = q.chunks.map(str);
    if (P.letters) {
      o.answer = str(q.answer).trim().toUpperCase().charAt(0);
      if (!P.letters.includes(o.answer)) throw badGen(`clave inválida en la pregunta ${q.n}`);
    } else {
      o.answer = str(q.answer).trim();
      if (!o.answer) throw badGen(`falta la respuesta de la ${q.n}`);
      const acc = new Set([normAns(o.answer)]);
      (Array.isArray(q.accept) ? q.accept : []).forEach(a => { const v = normAns(a); if (v) acc.add(v); });
      o.accept = Array.from(acc);
    }
    return o;
  });
  if (['mcq-cloze', 'open-cloze', 'word-formation', 'gapped'].includes(P.kind)) {
    for (const q of part.questions) if (!part.text.includes(`[[${q.n}]]`)) throw badGen(`falta el hueco ${q.n} en el texto`);
  }
  if (P.kind === 'l-gap') for (const q of part.questions) if (!str(q.sentence).includes(`[[${q.n}]]`)) q.sentence = str(q.sentence) + ` [[${q.n}]]`;
  if (['gapped', 'l-speakers'].includes(P.kind)) {
    if (!part.options) throw badGen('faltan las opciones');
    const seen = new Set(part.questions.map(q => q.answer));
    if (seen.size !== part.questions.length) throw badGen('respuestas repetidas');
  }
  if (['matching', 'people-match'].includes(P.kind) && !(part.sections && part.sections.length)) throw badGen('faltan los textos');
  if (['mcq-cloze', 'reading-mc', 'notices', 'l-extracts', 'l-interview'].includes(P.kind)) {
    for (const q of part.questions) if (!q.options || plainLetters(P).some(l => !q.options[l])) throw badGen(`faltan opciones en la ${q.n}`);
  }
  return part;
}

function normalizeGrammar(raw, topic) {
  if (!raw || typeof raw !== 'object') throw badGen('lección vacía');
  const items = (raw.exercise && Array.isArray(raw.exercise.items) ? raw.exercise.items : []).filter(x => x && x.prompt && x.answer != null).slice(0, 6);
  if (items.length < 4) throw badGen('ejercicio de gramática incompleto');
  return {
    topicId: topic.id, topic: str(raw.topic || topic.en), title: str(raw.title || topic.es), tag: topic.tag,
    explanation: str(raw.explanation), tip: str(raw.tip),
    forms: (Array.isArray(raw.forms) ? raw.forms : []).slice(0, 5).map(f => ({ form: str(f && f.form), example: str(f && f.example) })),
    examples: (Array.isArray(raw.examples) ? raw.examples : []).slice(0, 4).map(str),
    instruction: str(raw.exercise?.instruction || 'Complete the sentences.'),
    items: items.map((x, i) => {
      const o = { n: 'G' + (i + 1), type: ['choice', 'gap', 'rewrite'].includes(x.type) ? x.type : 'gap', prompt: str(x.prompt), explanation: str(x.explanation), tag: str(x.tag || topic.tag), point: topic.en };
      if (o.type === 'choice' && x.options && typeof x.options === 'object') {
        o.options = x.options; o.answer = str(x.answer).trim().toUpperCase().charAt(0);
        if (!o.options[o.answer]) throw badGen('clave inválida en gramática');
      } else {
        if (o.type === 'choice') o.type = 'gap';
        o.answer = str(x.answer);
        o.accept = Array.from(new Set([o.answer, ...(Array.isArray(x.accept) ? x.accept : [])].map(normAns).filter(Boolean)));
      }
      return o;
    })
  };
}

/* =========================================================
   Context for adaptive generation
   ========================================================= */
function diffOf(st, key) { const d = st && st.difficulty && st.difficulty[key]; return d >= 1 && d <= 5 ? d : 2; }

function studentSessions(stId) {
  return Object.values(S.sessions).filter(s => s.studentId === stId).sort((a, b) => b.createdAt - a.createdAt);
}

function genContext(st) {
  const sess = studentSessions(st.id).slice(0, 14);
  const recentTopics = [];
  for (const s of sess) {
    (s.parts || []).forEach(p => p.topic && recentTopics.push(p.topic));
    if (s.writing?.topic) recentTopics.push(s.writing.topic);
    if (s.speaking?.topic) recentTopics.push(s.speaking.topic);
  }
  const nb = S.notebooks[st.id];
  const weak = weakTags(nb).slice(0, 5).map(t => `${t.tag}${t.examples?.[0]?.point ? ` (e.g. ${t.examples[0].point})` : ''}`);
  return { recentTopics: Array.from(new Set(recentTopics)).slice(0, 16), weak };
}

function weakTags(nb) {
  if (!nb || !nb.tags) return [];
  const now = Date.now();
  return Object.values(nb.tags)
    .map(t => ({ ...t, score: (t.misses || 0) - 0.5 * (t.hits || 0) + (now - (t.last || 0) < 14 * 864e5 ? 1 : 0) }))
    .filter(t => (t.misses || 0) > 0 && t.score > 0)
    .sort((a, b) => b.score - a.score);
}

function lastDoneMap(stId) {
  const m = {};
  for (const s of studentSessions(stId)) for (const p of (s.parts || [])) if (!m[p.id] || m[p.id] < s.createdAt) m[p.id] = s.createdAt;
  return m;
}

function autoParts(st, skill) {
  if (!['use', 'reading', 'listening', 'mock'].includes(skill)) return [];
  const pools = POOLS[st.level], ex = EXAMS[st.level], last = lastDoneMap(st.id);
  const byRecency = ids => ids.slice().sort((a, b) => (last[a] || 0) - (last[b] || 0) || ex.order.indexOf(a) - ex.order.indexOf(b));
  const budget = examBudget(st);
  let tot = 0; const out = [];
  if (skill === 'mock') {
    for (const k of ['use', 'listening', 'reading']) {
      const c = byRecency(pools[k]).find(id => !out.includes(id) && tot + ex.parts[id].minutes <= budget);
      if (c) { out.push(c); tot += ex.parts[c].minutes; }
    }
    if (!out.length) out.push(byRecency(pools.use)[0]);
    return examOrder(st.level, out);
  }
  for (const id of byRecency(pools[skill])) { const m = ex.parts[id].minutes; if (out.length && tot + m > budget) continue; out.push(id); tot += m; }
  return examOrder(st.level, out);
}

const OBJ_SKILLS = ['use', 'reading', 'listening', 'mock'];
const speakMin = st => (st.level === 'B2' ? 14 : 12);

/* Parts for one or several skills chosen for the same day. */
function autoPartsFor(st, skills) {
  const obj = skills.filter(k => OBJ_SKILLS.includes(k));
  if (!obj.length) return [];
  const extra = (skills.includes('writing') ? 15 : 0) + (skills.includes('speaking') ? speakMin(st) : 0);
  if (obj.length === 1 && !extra) return autoParts(st, obj[0]);
  const pools = POOLS[st.level], ex = EXAMS[st.level], last = lastDoneMap(st.id);
  const byRecency = ids => ids.slice().sort((a, b) => (last[a] || 0) - (last[b] || 0) || ex.order.indexOf(a) - ex.order.indexOf(b));
  const budget = examBudget(st) - extra;
  const cats = Array.from(new Set(obj.flatMap(k => (k === 'mock' ? ['use', 'listening', 'reading'] : [k]))));
  const out = []; let tot = 0;
  for (const k of cats) {
    const cand = byRecency(pools[k]).filter(id => !out.includes(id));
    if (!cand.length) continue;
    let c = cand.find(id => tot + ex.parts[id].minutes <= budget);
    if (!c && (obj.includes(k) || !out.length)) c = cand.slice().sort((a, b) => ex.parts[a].minutes - ex.parts[b].minutes)[0];
    if (c) { out.push(c); tot += ex.parts[c].minutes; }
  }
  for (const id of byRecency(Array.from(new Set(cats.flatMap(k => pools[k]))))) {
    if (out.includes(id)) continue;
    if (tot + ex.parts[id].minutes <= budget) { out.push(id); tot += ex.parts[id].minutes; }
  }
  return examOrder(st.level, out);
}

/* What one click generates: an exam-parts session and/or a writing and/or a speaking session. */
function planFromPick(st, pick) {
  const skills = pick.skills || [];
  const obj = skills.filter(k => OBJ_SKILLS.includes(k));
  const objSkill = obj.length === 1 ? obj[0] : 'mix';
  return { objSkill, parts: obj.length ? (pick.parts || []).slice() : [], writing: skills.includes('writing'), speaking: skills.includes('speaking') };
}

function nextWritingPart(st) {
  const last = studentSessions(st.id).find(s => s.skill === 'writing' && s.writing);
  return last && last.writing.part === 1 ? 2 : 1;
}

/* =========================================================
   Generation
   ========================================================= */
async function generateFor(stId, plan, opts = {}) {
  const st = S.students[stId];
  if (!st || S.gen[stId]?.running) return;
  const ctl = new AbortController();
  const g = S.gen[stId] = { running: true, ctl, steps: [], error: null, sessionId: null };
  const ctx = genContext(st);
  ctx.note = String(opts.note || '').trim().slice(0, 400);
  const topic = opts.grammar || pickGrammarTopic(st);
  const now = Date.now(), sessions = [];
  const mk = skill => {
    const s = {
      studentId: stId, level: st.level, createdAt: now + sessions.length, dateKey: dateKey(), skill,
      status: 'ready', parts: [], review: null, grammar: null, writing: null, speaking: null, failed: [], note: ctx.note || '',
      minutes: 0, difficulty: {}
    };
    sessions.push(s); return s;
  };
  const pids = plan.parts || [];
  const so = pids.length ? mk(plan.objSkill) : null;
  const sw = plan.writing ? mk('writing') : null;
  const ss = plan.speaking ? mk('speaking') : null;
  if (!sessions.length) return;
  const host = sessions[0];
  const tasks = [];
  const addStep = (key, label, fn) => { const s = { key, label, state: 'pending' }; g.steps.push(s); tasks.push(async () => { s.state = 'running'; paintGen(stId); try { const v = await fn(); s.state = 'done'; paintGen(stId); return v; } catch (e) { s.state = 'error'; s.msg = errMsg(e); paintGen(stId); throw e; } }); };

  if (so) {
    for (const pid of pids) {
      const P = partSpec(st.level, pid);
      addStep(pid, `${P.paper === 'Listening' ? 'Listening' : pid.startsWith('U') ? 'Use of English' : 'Reading'} ${P.label} · ${P.title}`, async () => {
        const raw = await ask(genPartPrompt(st, pid, ctx), { tier: 'complex', signal: ctl.signal });
        const part = normalizePart(st.level, pid, raw);
        so.parts.push(part); so.difficulty[pid] = diffOf(st, pid);
      });
    }
    so.minutes = sessionMinutes(st.level, pids);
  }
  if (sw) {
    const part = nextWritingPart(st);
    addStep('W', `Writing Part ${part}`, async () => {
      const raw = await ask(genWritingPrompt(st, part, ctx), { tier: 'complex', signal: ctl.signal });
      if (!raw || (!raw.question && !raw.options && !raw.email)) throw badGen('tarea incompleta');
      raw.part = part; raw.words = raw.words || (st.level === 'B2' ? '120–150' : 'about 100');
      sw.writing = raw; sw.difficulty['W' + part] = diffOf(st, 'W' + part);
    });
    sw.minutes = 15;
  }
  if (ss) {
    addStep('S', 'Speaking (4 partes)', async () => {
      const raw = await ask(genSpeakingPrompt(st, ctx), { tier: 'default', signal: ctl.signal });
      if (!raw || !raw.part1 || !raw.part3) throw badGen('guion incompleto');
      ss.speaking = raw;
    });
    ss.minutes = speakMin(st);
  }
  addStep('GR', `Gramática: ${topic.es}`, async () => {
    const raw = await ask(genGrammarPrompt(st, topic, ctx.note), { tier: 'default', signal: ctl.signal });
    host.grammar = normalizeGrammar(raw, topic);
  });
  host.minutes += GRAMMAR_MIN;
  paintGen(stId);
  const res = await runPool(tasks, 4);
  g.running = false;
  const cancelled = res.some(r => !r.ok && r.e && r.e.code === 'cancelled');
  if (cancelled) { g.error = 'Generación cancelada.'; paintGen(stId); renderAll(); return; }
  const fatal = res.find(r => !r.ok && r.e && ['not_granted', 'sampling_disabled', 'no_sample', 'rate_limited', 'session_expired'].includes(r.e.code));
  if (fatal) { g.error = errMsg(fatal.e); paintGen(stId); renderAll(); return; }
  const ok = s => (s === so ? s.parts.length > 0 : s === sw ? !!s.writing : !!s.speaking);
  const good = sessions.filter(ok);
  const firstErr = res.find(r => !r.ok)?.e;
  if (!good.length) { g.error = 'No se ha podido generar la sesión. ' + (firstErr ? errMsg(firstErr) : ''); paintGen(stId); renderAll(); return; }
  if (so) {
    so.parts = examOrder(st.level, so.parts.map(p => p.id)).map(id => so.parts.find(p => p.id === id));
    so.failed = pids.filter(id => !so.parts.some(p => p.id === id));
  }
  if (host.grammar && !ok(host)) { good[0].grammar = host.grammar; good[0].minutes += GRAMMAR_MIN; }
  const ids = [];
  for (const s of good) { const id = uid('s'); ids.push(id); await saveSession(id, s); }
  g.sessionId = ids[0];
  const gram = good.find(s => s.grammar);
  if (gram) await saveStudent(st.id, Object.assign(clone(stripId(S.students[st.id] || st)), { grammarDone: [...(S.students[st.id]?.grammarDone || []), gram.grammar.topicId] }));
  S.gen[stId] = null;
  if (S.pick[stId]) Object.assign(S.pick[stId], { grammar: '', grammarText: '', note: '' });
  const missing = sessions.length - good.length;
  toast(good.length > 1 ? `${good.length} sesiones de ${st.name} listas` : `Sesión de ${st.name} lista` + (missing ? ' (una parte falló; vuelve a generarla)' : ''));
  if (good.length === 1 && opts.open !== false && S.view === 'today' && S.cur === stId) openSession(ids[0]); else renderAll();
}

async function retryPart(sessId, pid) {
  const sess = clone(S.sessions[sessId]); const st = S.students[sess.studentId];
  S.busy[sessId] = 'Rehaciendo ' + pid + '…'; renderMain(true);
  try {
    const raw = await ask(genPartPrompt(st, pid, genContext(st)), { tier: 'complex' });
    const part = normalizePart(st.level, pid, raw);
    sess.parts = sess.parts.filter(p => p.id !== pid); sess.parts.push(part);
    sess.parts = examOrder(st.level, sess.parts.map(p => p.id)).map(id => sess.parts.find(p => p.id === id));
    sess.failed = (sess.failed || []).filter(x => x !== pid);
    sess.minutes = (sess.grammar ? GRAMMAR_MIN : 0) + sessionMinutes(st.level, sess.parts.map(p => p.id));
    delete S.busy[sessId];
    await saveSession(sessId, sess);
    toast('Parte regenerada');
  } catch (e) { delete S.busy[sessId]; S.errors[sessId] = errMsg(e); }
  renderMain(true);
}

/* =========================================================
   Correction
   ========================================================= */
function sessionItems(sess) {
  const out = [];
  if (sess.grammar) for (const r of sess.grammar.items) out.push({ key: `GR:${r.n}`, pid: 'GR', grammar: true, q: r, n: r.n, type: r.type === 'choice' ? 'letter' : 'text', letters: Object.keys(r.options || {}).join(''), max: 1 });
  if (sess.review) for (const r of sess.review.items) out.push({ key: `RV:${r.n}`, pid: 'RV', review: true, q: r, n: r.n, type: r.type === 'choice' ? 'letter' : 'text', letters: Object.keys(r.options || {}).join(''), max: 1 });
  for (const part of sess.parts || []) {
    const P = partSpec(sess.level, part.id);
    for (const q of part.questions) out.push({ key: `${part.id}:${q.n}`, pid: part.id, P, part, q, n: q.n, type: P.letters ? 'letter' : 'text', letters: P.letters || '', max: P.marks || 1 });
  }
  return out;
}

function sentenceAround(text, n) {
  const tok = `[[${n}]]`, idx = text.indexOf(tok);
  if (idx < 0) return '';
  let s = idx; while (s > 0 && !/[.!?\n]/.test(text[s - 1])) s--;
  let e = idx + tok.length; while (e < text.length && !/[.!?\n]/.test(text[e])) e++;
  return text.slice(s, Math.min(text.length, e + 1)).trim().replace(/\[\[(\d+)\]\]/g, (m, k) => (k === String(n) ? '[GAP]' : '___'));
}

function itemContext(it) {
  const q = it.q, part = it.part;
  if (it.review || it.grammar) return q.prompt;
  switch (it.P.kind) {
    case 'mcq-cloze': case 'open-cloze': case 'gapped': return sentenceAround(part.text, q.n);
    case 'word-formation': return `${sentenceAround(part.text, q.n)} (${q.stem})`;
    case 'transformation': return `${q.first} | KEY WORD: ${q.keyword} | ${q.second}`;
    case 'reading-mc': case 'l-interview': return q.stem || '';
    case 'notices': return `${q.textType || ''}: ${q.text || ''}`;
    case 'l-extracts': return `${q.context || ''} ${q.stem || ''}`.trim();
    case 'matching': return `Which person ${q.stem}?`;
    case 'people-match': return `${q.name}: ${q.text}`;
    case 'l-gap': return (q.sentence || '').replace(/\[\[\d+\]\]/, '[GAP]');
    case 'l-speakers': return q.speaker || '';
  }
  return '';
}

function optionText(it, L) {
  if (!L) return '';
  const q = it.q, part = it.part;
  if (q.options && q.options[L]) return q.options[L];
  if (part && part.options && part.options[L]) return part.options[L];
  if (part && part.sections) { const s = part.sections.find(x => x.id === L); if (s) return s.heading || ''; }
  return '';
}
function keyText(it) {
  if (it.type === 'letter') { const t = optionText(it, it.q.answer); return t ? `${it.q.answer} (${t})` : it.q.answer; }
  return it.q.answer;
}
function givenText(it, g) {
  if (!g) return '';
  if (it.type === 'letter') { const t = optionText(it, g); return t ? `${g} (${t})` : g; }
  return g;
}

function autoMark(it, given) {
  const g = String(given ?? '').trim();
  if (!g) return { status: 'blank', points: 0 };
  if (it.type === 'letter') { const ok = g.toUpperCase() === String(it.q.answer).toUpperCase(); return { status: ok ? 'correct' : 'wrong', points: ok ? it.max : 0 }; }
  const acc = (it.q.accept && it.q.accept.length ? it.q.accept : [it.q.answer]).map(normAns);
  if (acc.includes(normAns(g))) return { status: 'correct', points: it.max };
  return { status: 'check', points: 0 };
}

function fallbackMark(it, given, m) {
  if (it.max > 1 && it.q.chunks) {
    const ng = ' ' + normAns(given) + ' ';
    const pts = it.q.chunks.filter(c => c && ng.includes(' ' + normAns(c) + ' ')).length;
    m.points = Math.min(pts, it.max);
  } else m.points = 0;
  m.status = m.points >= it.max ? 'correct' : m.points > 0 ? 'partial' : 'wrong';
}

async function gradeSession(sessId) {
  const sess = clone(S.sessions[sessId]); const st = S.students[sess.studentId];
  const answers = Object.assign({}, sess.answers || {}, S.drafts[sessId] || {});
  const items = sessionItems(sess);
  const marks = {}; items.forEach(it => { marks[it.key] = autoMark(it, answers[it.key]); });
  let fb = null, warn = '';
  try {
    fb = await ask(gradePrompt(st, sess, items, answers, marks), { tier: 'default' });
  } catch (e) {
    if (e.code === 'cancelled') throw e;
    warn = errMsg(e);
  }
  const judg = {}; (fb?.judgments || []).forEach(j => { if (j && j.id) judg[j.id] = j; });
  for (const it of items) {
    const m = marks[it.key];
    if (m.status !== 'check') continue;
    const j = judg[it.key];
    if (j && j.points != null && !isNaN(+j.points)) {
      m.points = Math.max(0, Math.min(it.max, Math.round(+j.points)));
      m.status = m.points >= it.max ? 'correct' : m.points > 0 ? 'partial' : 'wrong';
      if (j.note) m.note = str(j.note);
    } else fallbackMark(it, answers[it.key], m);
  }
  const errors = {}; (fb?.errors || []).forEach(e => { if (e && e.id && marks[e.id] && marks[e.id].status !== 'correct') errors[e.id] = e; });
  const byPart = {}; let score = 0, max = 0; const rv = { score: 0, max: 0 }, gr = { score: 0, max: 0 };
  for (const it of items) {
    const m = marks[it.key];
    if (it.review) { rv.max += 1; rv.score += m.status === 'correct' ? 1 : 0; continue; }
    if (it.grammar) { gr.max += 1; gr.score += m.status === 'correct' ? 1 : 0; continue; }
    const b = byPart[it.pid] || (byPart[it.pid] = { score: 0, max: 0 });
    b.max += it.max; b.score += m.points; max += it.max; score += m.points;
  }
  sess.answers = answers;
  sess.results = { marks, byPart, score, max, pct: pct(score, max), review: sess.review ? rv : null, grammar: sess.grammar ? gr : null, warn };
  sess.feedback = {
    summary: str(fb?.summary), parentNote: str(fb?.parentNote), errors,
    lessons: Array.isArray(fb?.lessons) ? fb.lessons.slice(0, 3) : [],
    practice: Array.isArray(fb?.practice) ? fb.practice.slice(0, 8) : []
  };
  sess.status = 'corrected'; sess.correctedAt = Date.now();
  const first = !sess.nbApplied; sess.nbApplied = true;
  await saveSession(sessId, sess);
  if (first) {
    const nb = notebookAfterObjective(st, sessId, sess, items, marks, errors, answers);
    const diff = Object.assign({}, st.difficulty || {});
    for (const [pid, b] of Object.entries(byPart)) {
      const p = pct(b.score, b.max), d = diffOf(st, pid);
      diff[pid] = p >= 85 ? Math.min(5, d + 1) : p < 50 ? Math.max(1, d - 1) : d;
    }
    await saveNotebook(st.id, nb);
    await saveStudent(st.id, Object.assign(clone(stripId(S.students[st.id] || st)), { difficulty: diff }));
  }
  delete S.drafts[sessId]; saveDraftLocal(sessId, null);
  return warn;
}

function emptyNotebook() { return { tags: {}, queue: [], mastered: 0 }; }
function bumpTag(nb, tag, hit, example) {
  const k = tagKey(tag);
  const T = nb.tags[k] || (nb.tags[k] = { tag: tag || 'otros', hits: 0, misses: 0, last: 0, examples: [] });
  if (hit) T.hits = (T.hits || 0) + 1;
  else { T.misses = (T.misses || 0) + 1; T.last = Date.now(); if (example) T.examples = [example, ...(T.examples || [])].slice(0, 3); }
}
function queuePush(nb, entry) {
  nb.queue.push(Object.assign({ id: uid('q'), streak: 0, misses: 1 }, entry));
  if (nb.queue.length > 80) nb.queue = nb.queue.slice(-80);
}

function masteryHit(nb, tag, sessId, seen) {
  const k = tagKey(tag);
  const i = nb.queue.findIndex(x => tagKey(x.tag) === k && x.sessionId !== sessId && !seen.has(x.id));
  if (i < 0) return;
  const x = nb.queue[i]; seen.add(x.id);
  x.streak = (x.streak || 0) + 1; x.lastReview = Date.now();
  if (x.streak >= 2) { nb.queue.splice(i, 1); nb.mastered = (nb.mastered || 0) + 1; }
}

function notebookAfterObjective(st, sessId, sess, items, marks, errors, answers, base) {
  const nb = base || clone(S.notebooks[st.id]) || emptyNotebook();
  nb.tags = nb.tags || {}; nb.queue = nb.queue || []; nb.mastered = nb.mastered || 0;
  const seen = new Set();
  for (const it of items) {
    const m = marks[it.key]; if (!m) continue;
    if (it.review) {
      const qi = nb.queue.findIndex(x => x.id === it.q.src);
      if (qi < 0) continue;
      const x = nb.queue[qi]; x.lastReview = Date.now();
      if (m.status === 'correct') { x.streak = (x.streak || 0) + 1; bumpTag(nb, x.tag, true); if (x.streak >= 2) { nb.queue.splice(qi, 1); nb.mastered++; } }
      else { x.streak = 0; x.misses = (x.misses || 1) + 1; bumpTag(nb, x.tag, false); }
      continue;
    }
    const fe = (errors || {})[it.key] || {};
    const tag = str(fe.tag || it.q.tag || 'otros');
    if (m.status === 'correct') { bumpTag(nb, tag, true); masteryHit(nb, tag, sessId, seen); continue; }
    const point = str(fe.point || it.q.point);
    bumpTag(nb, tag, false, { point, wrong: answers[it.key] || '', correct: keyText(it) });
    queuePush(nb, {
      tag, point, category: str(fe.category) || (m.status === 'blank' ? 'tiempo' : it.grammar ? 'gramática' : 'vocabulario'),
      context: itemContext(it).slice(0, 240), wrong: givenText(it, answers[it.key]) || '(en blanco)', correct: keyText(it),
      explanation: str(fe.explanation || it.q.explanation), sessionId: sessId, date: sess.dateKey
    });
  }
  return nb;
}

function notebookAfterCorrections(st, sessId, sess, corrections, base) {
  const nb = base || clone(S.notebooks[st.id]) || emptyNotebook();
  nb.tags = nb.tags || {}; nb.queue = nb.queue || []; nb.mastered = nb.mastered || 0;
  for (const c of (corrections || []).slice(0, 8)) {
    const tag = str(c.tag || 'accuracy');
    bumpTag(nb, tag, false, { point: str(c.corrected).slice(0, 60), wrong: str(c.original), correct: str(c.corrected) });
    queuePush(nb, { tag, point: '', category: str(c.category) || 'gramática', context: str(c.original).slice(0, 240), wrong: str(c.original), correct: str(c.corrected), explanation: str(c.why), sessionId: sessId, date: sess.dateKey });
  }
  return nb;
}

async function markQuickItems(st, sess, answers) {
  // Grammar (and old warm-up) items of writing/speaking sessions: auto-mark, ask Claude only about doubtful text answers.
  const items = sessionItems(sess).filter(i => i.grammar || i.review);
  const marks = {};
  items.forEach(it => { marks[it.key] = autoMark(it, answers[it.key]); });
  const doubt = items.filter(it => marks[it.key].status === 'check');
  if (doubt.length) {
    try {
      const rows = doubt.map(it => JSON.stringify({ id: it.key, prompt: it.q.prompt, key: it.q.answer, accepted: it.q.accept || [], given: answers[it.key] }));
      const r = await ask(['Decide whether each student answer to these short English grammar items is acceptable (spelling must be correct). JSON lines:', ...rows, 'Reply with ONLY JSON: {"judgments":[{"id":"GR:G2","correct":true}]}'].join('\n'), { tier: 'quick' });
      const j = {}; (r?.judgments || []).forEach(x => { if (x && x.id) j[x.id] = x; });
      for (const it of doubt) { const m = marks[it.key]; if (j[it.key]) { m.status = j[it.key].correct ? 'correct' : 'wrong'; m.points = j[it.key].correct ? 1 : 0; } else fallbackMark(it, answers[it.key], m); }
    } catch (e) { for (const it of doubt) fallbackMark(it, answers[it.key], marks[it.key]); }
  }
  const sc = kind => { const its = items.filter(i => i[kind]); return its.length ? { score: its.filter(i => marks[i.key].status === 'correct').length, max: its.length } : null; };
  return { items, marks, grammar: sc('grammar'), review: sc('review') };
}

async function gradeWriting(sessId, text, files, choice) {
  const sess = clone(S.sessions[sessId]); const st = S.students[sess.studentId];
  const hasImages = !!(files && files.length);
  const answers = Object.assign({}, sess.answers || {}, S.drafts[sessId] || {});
  const quick = await markQuickItems(st, sess, answers);
  const fb = await ask(writingGradePrompt(st, sess, text, hasImages, choice), { tier: 'complex', images: hasImages ? Array.from(files) : undefined });
  const sc = fb?.scores || {};
  const clamp = v => Math.max(0, Math.min(5, Math.round(+v || 0)));
  const scores = { content: clamp(sc.content), communicative: clamp(sc.communicative), organisation: clamp(sc.organisation), language: clamp(sc.language) };
  const total = scores.content + scores.communicative + scores.organisation + scores.language;
  sess.answers = answers;
  sess.results = { score: total, max: 20, pct: pct(total, 20), writingScores: scores, marks: quick.marks, grammar: quick.grammar, review: quick.review };
  sess.feedback = {
    transcript: str(fb?.transcript || text), wordCount: +fb?.wordCount || wordCount(fb?.transcript || text), choice: choice || 0,
    summary: str(fb?.summary), parentNote: str(fb?.parentNote), strengths: fb?.strengths || [], improvements: fb?.improvements || [],
    corrections: (fb?.corrections || []).slice(0, 12), improved: str(fb?.improved),
    lessons: (fb?.lessons || []).slice(0, 2), practice: (fb?.practice || []).slice(0, 8)
  };
  sess.status = 'corrected'; sess.correctedAt = Date.now();
  const first = !sess.nbApplied; sess.nbApplied = true;
  await saveSession(sessId, sess);
  if (first) {
    let nb = notebookAfterObjective(st, sessId, sess, quick.items, quick.marks, {}, answers);
    nb = notebookAfterCorrections(st, sessId, sess, sess.feedback.corrections, nb);
    const key = 'W' + (sess.writing?.part || 1), d = diffOf(st, key);
    const diff = Object.assign({}, st.difficulty || {}, { [key]: total >= 17 ? Math.min(5, d + 1) : total < 10 ? Math.max(1, d - 1) : d });
    await saveNotebook(st.id, nb);
    await saveStudent(st.id, Object.assign(clone(stripId(S.students[st.id] || st)), { difficulty: diff }));
  }
  delete S.drafts[sessId]; saveDraftLocal(sessId, null);
}

async function gradeSpeaking(sessId, marks, notes) {
  const sess = clone(S.sessions[sessId]); const st = S.students[sess.studentId];
  const answers = Object.assign({}, sess.answers || {}, S.drafts[sessId] || {});
  const quick = await markQuickItems(st, sess, answers);
  let fb = null, warn = '';
  try { fb = await ask(speakingFeedbackPrompt(st, sess, marks, notes), { tier: 'default' }); } catch (e) { warn = errMsg(e); }
  const total = ['gv', 'dm', 'pr', 'ic'].reduce((t, k) => t + (+marks[k] || 0), 0);
  sess.answers = answers;
  sess.results = { score: total, max: 20, pct: pct(total, 20), speakingMarks: marks, marks: quick.marks, grammar: quick.grammar, review: quick.review, warn };
  sess.feedback = {
    notes, summary: str(fb?.summary), parentNote: str(fb?.parentNote), strengths: fb?.strengths || [], improvements: fb?.improvements || [],
    corrections: (fb?.corrections || []).slice(0, 10), phrases: fb?.phrases || [], practice: (fb?.practice || []).slice(0, 8), lessons: []
  };
  sess.status = 'corrected'; sess.correctedAt = Date.now();
  const first = !sess.nbApplied; sess.nbApplied = true;
  await saveSession(sessId, sess);
  if (first) {
    let nb = notebookAfterObjective(st, sessId, sess, quick.items, quick.marks, {}, answers);
    nb = notebookAfterCorrections(st, sessId, sess, sess.feedback.corrections, nb);
    await saveNotebook(st.id, nb);
  }
  delete S.drafts[sessId]; saveDraftLocal(sessId, null);
}

async function readSheetPhoto(sessId, files) {
  const sess = S.sessions[sessId];
  const raw = await ask(sheetReadPrompt(sess), { tier: 'default', images: Array.from(files) });
  const ans = raw && raw.answers && typeof raw.answers === 'object' ? raw.answers : {};
  const items = sessionItems(sess); const out = {};
  for (const it of items) {
    let v = ans[it.key]; if (v == null) continue; v = String(v).trim(); if (!v || v.toLowerCase() === 'null') continue;
    if (it.type === 'letter') { v = v.toUpperCase().charAt(0); if (!it.letters.includes(v)) continue; }
    out[it.key] = v;
  }
  return out;
}

function wordCount(t) { return String(t || '').trim().split(/\s+/).filter(Boolean).length; }
function stripId(o) { const c = Object.assign({}, o); delete c.id; return c; }
</script>

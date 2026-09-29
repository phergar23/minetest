# Cambridge en Casa

Single-page app (published as a claude.ai artifact) to run daily Cambridge English
practice at home for B1 Preliminary for Schools and B2 First for Schools.

- Generates original exam-format sessions with Claude, adapted to each student's
  error notebook and difficulty level (per exam part).
- Produces printable PDFs: exercises + answer sheet, solutions, examiner script,
  corrected copy with explanations and reinforcement exercises, error notebook.
- Correction from a photo of the answer sheet (or tapping answers), writing
  marked on the four Cambridge subscales, speaking feedback from parent notes.
- Listening audio read by the device's English voices, each recording twice.

`src/` holds the parts; `./build.sh` concatenates them into `index.html`.
Runtime capabilities used: `db`, `sample`, `downloads`.

## Local edition

`build-local.py` produces a single HTML file that runs from disk in a desktop
browser: data lives in the browser (IndexedDB, with backup export/import in
Ajustes) and Claude is called through the Anthropic API with the user's own
key (TypeScript SDK bundled for the browser, `claude-opus-5-5` by default,
server-side refusal fallback enabled). See the script header for the vendor
files it needs.

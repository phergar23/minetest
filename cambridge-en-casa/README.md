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

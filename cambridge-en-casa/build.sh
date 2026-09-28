#!/bin/sh
# Assembles the single-page app published as a claude.ai artifact.
cd "$(dirname "$0")" && cat src/01-head.html src/02-body.html src/03-config.js src/04-ai.js src/05-pdf.js src/06-audio.js src/07-ui.js > index.html

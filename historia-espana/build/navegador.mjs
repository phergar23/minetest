// Abre la página en modo render con las fuentes servidas desde disco
// (el Chromium del contenedor no confía en el proxy para fonts.googleapis.com).
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
export const { chromium } = require('playwright');
const F = new URL('./fonts/', import.meta.url).pathname;
const faces = [
  ['Caveat', 500, 'fontsource-caveat/files/caveat-latin-500-normal.woff2'],
  ['Caveat', 600, 'fontsource-caveat/files/caveat-latin-600-normal.woff2'],
  ['Caveat', 700, 'fontsource-caveat/files/caveat-latin-700-normal.woff2'],
  ['Atkinson Hyperlegible', 400, 'fontsource-atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2'],
  ['Atkinson Hyperlegible', 700, 'fontsource-atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2'],
];
const css = faces.map(([f, w, p]) => `@font-face{font-family:'${f}';font-weight:${w};font-style:normal;src:url(https://fonts.gstatic.com/local/${p}) format('woff2');}`).join('\n');
export async function openPage(browser, { width = 1600, height = 900 } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: css }));
  await page.route('https://fonts.gstatic.com/local/**', r => {
    const p = new URL(r.request().url()).pathname.replace('/local/', '');
    r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(F + p) });
  });
  await page.addInitScript(() => { window.__RENDER__ = true; });
  await page.goto('file://' + new URL('../index.html', import.meta.url).pathname);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  return page;
}
export const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

// Captura fotogramas concretos para revisar el dibujo: node captura.mjs prefijo t1 t2 ...
import { launch, openPage } from './navegador.mjs';
const [,, out, ...times] = process.argv;
const browser = await launch();
const page = await openPage(browser);
for (const t of times) {
  await page.evaluate(t => window.__renderAt(t), parseFloat(t));
  await page.screenshot({ path: `${out}_${t}.png` });
}
await browser.close();

// Übernimmt freigegebene Fotos aus dem Originalordner als Webkopie.
//
//   npm run media:import                 # Originale im Projektordner (Wurzel)
//   npm run media:import -- "C:\…\Website Florian\Freigegeben"
//
// - liest media/manifest.json und validiert jeden Eintrag
// - kopiert NUR Einträge mit status "approved" nach src/assets/photos/<id>.jpg
//   (gedreht nach EXIF, optional retuschiert und zugeschnitten, max. 2400 px,
//   ohne Metadaten – also auch ohne GPS)
// - schreibt src/data/media.json mit ausschließlich öffentlichen Feldern
// - entfernt Webkopien, deren Eintrag nicht (mehr) freigegeben ist
// Originale werden nur gelesen, nie verändert.

import { readFile, writeFile, readdir, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.resolve(process.argv[2] ?? root);
const outDir = path.join(root, 'src/assets/photos');
const dataFile = path.join(root, 'src/data/media.json');

const STATUSES = new Set(['approved', 'pending', 'rejected']);
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FOCUS = /^\d{1,3}% \d{1,3}%$/;
const MAX_TEXT = 400;

const manifest = JSON.parse(await readFile(path.join(root, 'media/manifest.json'), 'utf8'));
const errors = [];
const seen = new Set();

for (const [i, m] of manifest.media.entries()) {
  const where = `media[${i}] (${m.id ?? '?'})`;
  if (typeof m.id !== 'string' || !ID.test(m.id)) errors.push(`${where}: id muss kebab-case sein`);
  if (seen.has(m.id)) errors.push(`${where}: id doppelt`);
  seen.add(m.id);
  if (!STATUSES.has(m.status)) errors.push(`${where}: status muss approved, pending oder rejected sein`);
  if (typeof m.source !== 'string' || m.source.includes('..') || path.isAbsolute(m.source)) {
    errors.push(`${where}: source muss ein Dateiname im Originalordner sein`);
  }
  for (const key of ['alt', 'credit', 'caption']) {
    if (typeof m[key] !== 'string' || m[key].length > MAX_TEXT) errors.push(`${where}: ${key} fehlt oder ist zu lang`);
  }
  if (m.status === 'approved') {
    if (!m.alt?.trim()) errors.push(`${where}: freigegebene Bilder brauchen einen Alttext`);
    if (!FOCUS.test(m.focus ?? '')) errors.push(`${where}: focus im Format "50% 40%" angeben`);
  }
  if (m.crop !== undefined) {
    const ok = Array.isArray(m.crop) && m.crop.length === 4 && m.crop.every((n) => Number.isInteger(n) && n >= 0);
    if (!ok || m.crop[2] === 0 || m.crop[3] === 0) errors.push(`${where}: crop als [links, oben, breite, höhe] in Pixeln angeben`);
  }
  if (m.retouch !== undefined) {
    const isInts = (a, n) => Array.isArray(a) && a.length === n && a.every((v) => Number.isInteger(v) && v >= 0);
    const ok = Array.isArray(m.retouch) && m.retouch.every((r) => isInts(r.from, 4) && isInts(r.to, 2) && r.from[2] > 0 && r.from[3] > 0);
    if (!ok) errors.push(`${where}: retouch als Liste von { from: [x, y, breite, höhe], to: [x, y] } angeben`);
  }
}
if (errors.length) {
  console.error('Manifest ungültig:\n- ' + errors.join('\n- '));
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const approved = manifest.media.filter((m) => m.status === 'approved');
const publicData = {};

for (const m of approved) {
  const src = path.join(sourceDir, m.source);
  if (!existsSync(src)) {
    console.warn(`! ${m.id}: Original fehlt (${m.source}) – übersprungen`);
    continue;
  }
  const out = path.join(outDir, `${m.id}.jpg`);
  // Erst nach EXIF drehen, dann retuschieren, dann zuschneiden – alle Koordinaten
  // beziehen sich auf das aufrecht stehende Original.
  let image = sharp(await sharp(src).rotate().toBuffer());
  if (m.retouch) {
    // Überdeckt einen Bildbereich (z. B. einen Schriftzug) mit einem Ausschnitt aus dem Bild selbst.
    const patches = await Promise.all(
      m.retouch.map(async ({ from: [x, y, w, h], to: [left, top] }) => ({
        input: await image.clone().extract({ left: x, top: y, width: w, height: h }).toBuffer(),
        left,
        top,
      })),
    );
    image = sharp(await image.composite(patches).toBuffer());
  }
  if (m.crop) {
    const { width = 0, height = 0 } = await image.metadata();
    const [left, top, w, h] = m.crop;
    if (left + w > width || top + h > height) {
      console.error(`✗ ${m.id}: crop liegt außerhalb des Bildes (${width}×${height})`);
      process.exit(1);
    }
    image = image.extract({ left, top, width: w, height: h });
  }
  const info = await image
    .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  publicData[m.id] = { alt: m.alt, credit: m.credit, caption: m.caption, focus: m.focus };
  console.log(`✓ ${m.id}.jpg  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}

for (const file of await readdir(outDir)) {
  const id = path.basename(file, path.extname(file));
  if (!publicData[id]) {
    await unlink(path.join(outDir, file));
    console.log(`– ${file} entfernt (nicht freigegeben)`);
  }
}

await writeFile(dataFile, JSON.stringify(publicData, null, 2) + '\n');
const skipped = manifest.media.length - approved.length;
console.log(`\n${Object.keys(publicData).length} Webkopien aktuell, ${skipped} Einträge nicht freigegeben.`);

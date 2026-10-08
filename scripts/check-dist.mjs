// Prüft nach jedem Produktions-Build, dass nichts Internes im Ergebnis landet:
// keine Entwürfe (Seite, Titel, Archiv, Sitemap), keine Original-Dateinamen,
// keine internen Mediennotizen und keine Quellenziffern aus dem Konzept.

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const problems = [];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const textFiles = [];
for await (const file of walk(dist)) {
  if (/\.(html|xml|txt|js|css|json)$/.test(file)) textFiles.push([file, await readFile(file, 'utf8')]);
}
const allText = textFiles.map(([, t]) => t).join('\n');

// 1. Entwürfe
const postsDir = path.join(root, 'src/content/gedanken');
for (const file of await readdir(postsDir)) {
  const src = await readFile(path.join(postsDir, file), 'utf8');
  const fm = src.split('---')[1] ?? '';
  const isDraft = !/^draft:\s*false\s*$/m.test(fm);
  if (!isDraft) continue;
  const slug = path.basename(file, '.md');
  const title = fm.match(/^title:\s*(.+)$/m)?.[1].trim();
  if (existsSync(path.join(dist, 'gedanken', slug))) problems.push(`Entwurfsseite gebaut: /gedanken/${slug}/`);
  if (allText.includes(`/gedanken/${slug}/`)) problems.push(`Link auf Entwurf gefunden: ${slug}`);
  if (title && allText.includes(title)) problems.push(`Entwurfstitel im Build: „${title}“`);
}

// 2. Interne Mediennachweise
const manifest = JSON.parse(await readFile(path.join(root, 'media/manifest.json'), 'utf8'));
for (const m of manifest.media) {
  if (allText.includes(m.source)) problems.push(`Original-Dateiname im Build: ${m.source}`);
  if (m.note && allText.includes(m.note)) problems.push(`Interne Notiz im Build (${m.id})`);
}

// 3. Redaktionelle Reste
for (const [file, text] of textFiles) {
  if (!file.endsWith('.html')) continue;
  const rel = path.relative(dist, file);
  if (/\[\d+(?:[–-]\d+)?(?:,\s*\d+)*\]/.test(text.replace(/<script[\s\S]*?<\/script>/g, ''))) {
    problems.push(`Quellenziffer im Text: ${rel}`);
  }
  if (/Redaktioneller Hinweis|Foto fehlt:|ENTWURF/.test(text)) problems.push(`Redaktioneller Hinweis: ${rel}`);
}

if (problems.length) {
  console.error('\n✗ Build-Prüfung fehlgeschlagen:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`✓ Build-Prüfung: ${textFiles.length} Dateien, keine Entwürfe oder internen Angaben.`);

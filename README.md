# floriangloebl.de

Persönliche Website von Florian Glöbl. Statische Website mit [Astro](https://astro.build): keine Datenbank, kein Login, kein CMS. Artikel sind Markdown-Dateien, Fotos werden beim Build automatisch in passenden Größen als WebP mit JPG-Fallback erzeugt.

Gestaltung: siehe [docs/stilbriefing.md](docs/stilbriefing.md) (abgeleitet aus Malik „Wenn Grenzen keine sind“ und Löffler „Saugute Zusammenarbeit“).

## Versionen

| | |
|---|---|
| Node.js | ab 22.12 (lokal getestet mit 24.17) |
| Astro | 7.3 |
| Bildverarbeitung | sharp 0.35 |
| Tests | Playwright 1.64 mit dem installierten Microsoft Edge |
| Schrift | Source Serif 4 (selbst gehostet über @fontsource) |

## Lokal einrichten

```bash
npm install
npm run dev        # http://localhost:4321 – zeigt auch Entwürfe (mit roter Marke)
npm run build      # Produktions-Build nach dist/ + Prüfung auf Entwürfe/Interna
npm run preview    # Produktions-Build lokal ansehen (ohne Entwürfe)
npm test           # Abnahmetests (vorher npm run build)
```

## Aufbau

```
src/pages/               Startseite, /gedanken/, /gedanken/{slug}/, /impressum/, /datenschutz/, 404
src/content/gedanken/    Artikel als Markdown
src/components/          Photo (responsive Bilder), PostCard
src/layouts/Base.astro   Kopf, Navigation, Fuß, Meta-Angaben
src/styles/global.css    gesamte Gestaltung
src/data/site.ts         Kontaktdaten, Menü, Datumsformat (Europe/Berlin)
src/assets/photos/       Webkopien der freigegebenen Fotos (erzeugt)
src/data/media.json      öffentliche Bildangaben: Alttext, Credit, Bildunterschrift (erzeugt)
media/manifest.json      interne Mediennachweise inkl. Herkunft und Freigabestatus
scripts/import-media.mjs Foto-Import
scripts/check-dist.mjs   Build-Prüfung
tests/abnahme.spec.ts    Abnahmetests
```

## Einen Artikel schreiben

1. Neue Datei `src/content/gedanken/mein-titel.md` anlegen. Der Dateiname wird zur Adresse `/gedanken/mein-titel/`.
2. Kopf ausfüllen:

   ```yaml
   ---
   title: Mein Titel
   description: Ein bis zwei Sätze Kurztext für Archiv und Startseite.
   category: Draußen   # Führung und Zusammenarbeit · Gründen und Machen · Draußen · Persönliches
   draft: true
   cover: draussen-gipfelkreuz   # optional, ID aus media/manifest.json
   sources:                      # optional
     - label: Name der Quelle
       url: https://…
   ---
   ```

3. Text darunter in Markdown schreiben.

Die Angaben zum gemeinsamen Buch mit Benno (Titel, Erscheinungsdatum, Link) stehen in `src/data/book.ts`.
4. **Vorschau:** `npm run dev` und `http://localhost:4321/gedanken/mein-titel/` öffnen.
5. **Veröffentlichen:** `draft: false` und `pubDate: 2026-10-12` setzen (das echte Datum), committen, deployen.

**Entwürfe** existieren im Produktions-Build überhaupt nicht: keine Seite, kein Archiveintrag, kein Sitemap-Eintrag, keine Vorschau-URL. Ohne `draft: false` ist ein Beitrag automatisch Entwurf. `npm run build` bricht ab, wenn trotzdem etwas durchrutscht. Weil die Entwurfstexte im Repository liegen, muss das Repository **privat** bleiben.

Die Startseite zeigt automatisch die zwei neuesten Beiträge. Ohne veröffentlichte Beiträge wird der Bereich ausgeblendet.

## Fotos hinzufügen

1. Original in den freigegebenen Ordner legen (aktuell: Projektordner-Wurzel; später z. B. OneDrive `Website Florian/Freigegeben`, dort „Immer auf diesem Gerät behalten“).
2. Eintrag in `media/manifest.json` ergänzen: `id`, `source` (Dateiname), `status`, `alt`, `credit`, `caption`, `focus` (Bildausschnitt, z. B. `"50% 40%"`), `note` (intern).
3. `npm run media:import` (oder mit Ordner: `npm run media:import -- "C:\Pfad\zum\Ordner"`).

Nur `status: "approved"` wird übernommen. Das Skript dreht Bilder richtig, verkleinert auf max. 2400 px und entfernt alle Metadaten (auch GPS). Originale werden nur gelesen. `source` und `note` landen nie auf der Website; die Build-Prüfung kontrolliert das. Originalfotos und Buch-PDFs sind per `.gitignore` vom Repository ausgeschlossen.

## Veröffentlichen (GitHub Pages)

Der Workflow `.github/workflows/deploy-pages.yml` läuft **nur manuell** (Actions → „Deploy to GitHub Pages“ → Run workflow). Bis zum offiziellen Start bleibt die Indexierung gesperrt (`noindex` + `robots.txt: Disallow`). Zum Start im Workflow „indexing“ anhaken.

Einmalig vor dem ersten Deploy:

1. **GitHub Pages:** Repository → Settings → Pages → Source „GitHub Actions“. Für private Repositories braucht Pages einen kostenpflichtigen GitHub-Plan (Pro/Team). Alternativ: Repository öffentlich machen, dann aber vorher Entwürfe aus dem Repo nehmen.
2. **Domain:** In Settings → Pages „Custom domain“ `floriangloebl.de` eintragen, danach „Enforce HTTPS“.
3. **DNS bei united-domains** (erst zum Start ändern):
   - `A` für `floriangloebl.de`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` für `www`: `floriangloebl.github.io`

   GitHub leitet `www.floriangloebl.de` dann automatisch auf `https://floriangloebl.de` um.

Ein Webhosting-Tarif ist für diese Lösung nicht nötig. Alternativ lässt sich `dist/` auf jeden beliebigen Webspace hochladen (dann www-Weiterleitung beim Hoster einrichten).

## Datensicherung

Alles, was die Website ausmacht (Code, Texte, Webkopien der Fotos, Mediennachweise), liegt im Git-Repository auf GitHub und lokal. Es gibt keine Datenbank und keine Uploads auf einem Server. Sicherung = regelmäßig `git push`. Die Originalfotos sichert OneDrive. Wiederherstellung: `git clone`, `npm install`, `npm run build`.

## Abnahme (09.10.2026)

`npm run build && npm test` – alle 12 Tests bestanden (Microsoft Edge, lokal):

| Kriterium | Ergebnis |
|---|---|
| Kein horizontales Scrollen bei 360, 768, 1440 px (Start, Gedanken, Impressum, Datenschutz) | bestanden |
| Coaching im Menü und als erstes Angebot, Reihenfolge der Abschnitte | bestanden |
| Telefon `tel:+491721718875`, E-Mail-Link, „Coaching anfragen“ mit Betreff „Anfrage Coaching“ | bestanden |
| Mobile Navigation: öffnen, Abschnitt anspringen, schließt danach; Escape schließt | bestanden |
| Entwürfe: 404 im Produktions-Build, nicht in Sitemap, Titel nicht auf der Startseite | bestanden |
| Erster Beitrag veröffentlicht: Startseite → Artikel, Bildcredit, Quellenlinks, keine Entwurfsmarke | bestanden |
| Buch: Hero-Buch führt zu #buch (360 und 1440 px), Link zur Buch-Website | bestanden |
| Bilder: Alttexte, feste Maße, WebP, nur erstes Bild priorisiert, max. 8 Startbilder, Bildunterschrift | bestanden |
| Canonical `https://floriangloebl.de/`, noindex vor dem Start, 404-Seite | bestanden |
| Tastatur: Skip-Link, sichtbarer Fokus | bestanden |
| Build-Prüfung: keine Entwürfe, Original-Dateinamen, internen Notizen, Quellenziffern | bestanden |

Zusätzlich per Screenshot geprüft: Startseite, Hero mit Buch, Buchabschnitt und Benno-Foto bei 1440 und 360 px.

Noch nicht geprüft, weil noch nicht möglich: Live-Betrieb unter der Domain, HTTPS, www-Weiterleitung.

## Offen – vor dem Start klären

Geklärt am 09.10.2026: Anbieter ist Flo als Privatperson, E-Mail f.gloebl@gmx.de · Benno ist mit dem Eisbade-Foto einverstanden (Schriftzug „MANLY“ per `retouch` mit Teppichmuster überdeckt) · Nutzungsrecht für das Klinikfoto liegt vor, der Beitrag ist veröffentlicht · Werte in Flos eigenen Worten · Trolltunga- und Wasserfallfoto für Skandinavien freigegeben.

- [ ] **Erscheinungstermin des Buchs:** Die Buch-Website nennt den 1.12.2026, Flos LinkedIn-Beiträge (Okt. 2026) „Frühjahr 2027“. Auf dieser Seite steht „voraussichtlich im Frühjahr 2027“ (`src/data/book.ts`). Buch-Website angleichen.
- [ ] **Mentorenfotos:** Ausschnitte aus Flos LinkedIn-Beitrag „Wegbereiter“. Einverständnis von Josef Heitzer, Arnold Hauk und Peter Prinz einholen.
- [ ] **Entwürfe fertigstellen:** „Warum Mentoren so wichtig im Leben sind“ braucht Flos Geschichten zu Josef, Arnold und Peter (Platzhalter im Text). „Warum ich gern draußen bin“ gegenlesen – einige Sätze sind von Claude in Flos Stil formuliert. Danach `draft: false` und `pubDate` setzen.
- [ ] **werkskante.de** ist derzeit nicht erreichbar (GitHub Pages „Site not found“). Sobald die neue Plattform läuft, auf der Startseite verlinken.
- [ ] Texte gegenlesen: Skandinavien-Abschnitt, Angebot 04 „Von der Idee zum Prototyp“, Buchempfehlungen.
- [ ] Impressum und Datenschutz kurz rechtlich gegenlesen lassen.
- [ ] Optional: Fußball-Mannschaftsfoto (steht im Manifest auf `pending`). Vereinsrollen erst nach Bestätigung nennen.

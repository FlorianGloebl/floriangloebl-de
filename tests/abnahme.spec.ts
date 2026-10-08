import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';

const widths = [360, 768, 1440];
const pages = ['/', '/gedanken/', '/impressum/', '/datenschutz/'];

for (const width of widths) {
  test(`kein horizontales Scrollen bei ${width}px`, async ({ page }) => {
    mkdirSync('test-results/screens', { recursive: true });
    await page.setViewportSize({ width, height: 900 });
    for (const path of pages) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} bei ${width}px`).toBeLessThanOrEqual(0);
    }
    await page.goto('/');
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 40)); }
      window.scrollTo({ top: 0, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300));
    });
    await page.screenshot({ path: `test-results/screens/start-${width}.png`, fullPage: true });
  });
}

test('Coaching ist im Menü und erstes Angebot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Hauptmenü' }).getByRole('link', { name: 'Coaching' })).toHaveAttribute('href', '/#coaching');
  const firstOffer = page.locator('#coaching h3').first();
  await expect(firstOffer).toHaveText('Persönliches Coaching und Führungskräftecoaching');
  const order = await page.locator('main > section[id], main > div.statement').evaluateAll((els) => els.map((e) => e.id || 'statement'));
  expect(order.slice(0, 4)).toEqual(['ueber-mich', 'coaching', 'weitere-angebote', 'draussen']);
});

test('Kontakt-Links und Coaching-Button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="tel:+491721718875"]').first()).toBeVisible();
  await expect(page.locator('a[href="mailto:f.gloebl@werkskante.de"]').first()).toBeAttached();
  const btn = page.getByRole('link', { name: 'Coaching anfragen' }).first();
  await expect(btn).toHaveAttribute('href', 'mailto:f.gloebl@werkskante.de?subject=Anfrage%20Coaching');
});

test('mobile Navigation öffnet, schließt und führt zu Abschnitten', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Menü' });
  await expect(page.locator('#hauptmenue')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.screenshot({ path: 'test-results/screens/menu-360.png' });
  await page.locator('#hauptmenue').getByRole('link', { name: 'Kontakt' }).click();
  await expect(page).toHaveURL(/#kontakt$/);
  await expect(page.locator('#hauptmenue')).toBeHidden();
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#hauptmenue')).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('Entwürfe sind für Besucher unsichtbar', async ({ page, request }) => {
  const drafts = readdirSync('src/content/gedanken')
    .filter((f) => !/^draft:\s*false\s*$/m.test(readFileSync(`src/content/gedanken/${f}`, 'utf8')))
    .map((f) => f.replace(/\.md$/, ''));
  expect(drafts.length).toBeGreaterThan(0);
  for (const slug of drafts) {
    const res = await request.get(`/gedanken/${slug}/`);
    expect(res.status(), slug).toBe(404);
  }
  await page.goto('/');
  await expect(page.locator('#gedanken')).toHaveCount(0); // leerer Journalbereich ausgeblendet
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  for (const slug of drafts) expect(sitemap).not.toContain(slug);
});

test('Bilder: Alttexte, feste Maße, nur erstes Bild priorisiert, Bildcredit sichtbar', async ({ page }) => {
  await page.goto('/');
  const imgs = page.locator('main img');
  const n = await imgs.count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThanOrEqual(8);
  for (let i = 0; i < n; i++) {
    const img = imgs.nth(i);
    expect((await img.getAttribute('alt'))?.length).toBeGreaterThan(10);
    expect(await img.getAttribute('width')).toBeTruthy();
    expect(await img.getAttribute('height')).toBeTruthy();
    expect(await img.getAttribute('loading')).toBe(i === 0 ? 'eager' : 'lazy');
  }
  await expect(page.locator('picture source[type="image/webp"]').first()).toBeAttached();
  await expect(page.getByText('Gute Ideen haben nicht immer Wohlfühltemperatur.')).toBeVisible();
});

test('SEO-Grundlagen und Sperre vor dem Start', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://floriangloebl.de/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  const res = await request.get('/gibt-es-nicht/');
  expect(res.status()).toBe(404);
});

test('Tastatur: Skip-Link und sichtbarer Fokus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Zum Inhalt springen' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
});

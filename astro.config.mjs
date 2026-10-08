// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Hauptadresse ist https://floriangloebl.de (ohne www). Die www-Variante
// leitet GitHub Pages automatisch hierher um, sobald beide DNS-Einträge stehen.
export default defineConfig({
  site: 'https://floriangloebl.de',
  trailingSlash: 'always',
  integrations: [sitemap()],
  image: {
    responsiveStyles: false,
  },
});

import { defineConfig } from '@playwright/test';

// Testet den Produktions-Build (npm run build) über astro preview.
// Nutzt den installierten Microsoft Edge (PW_CHANNEL=chrome für Chrome) – kein separater Browser-Download nötig.
export default defineConfig({
  testDir: 'tests',
  reporter: 'list',
  use: { baseURL: 'http://localhost:4329', channel: process.env.PW_CHANNEL ?? 'msedge' },
  webServer: {
    command: 'npx astro preview --port 4329',
    url: 'http://localhost:4329',
    reuseExistingServer: false,
  },
});

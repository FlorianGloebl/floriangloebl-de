import type { APIRoute } from 'astro';
import { site } from '../data/site';

// Bis zum Start (PUBLIC_INDEXING=true) bleibt die Seite für Suchmaschinen gesperrt.
export const GET: APIRoute = () => {
  const body = site.indexing
    ? `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap-index.xml\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

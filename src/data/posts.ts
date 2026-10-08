import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'gedanken'>;

// Im Produktions-Build existieren Entwürfe nicht: keine Seite, kein Archiv-
// eintrag, kein Sitemap-Eintrag. Im lokalen Dev-Server (npm run dev) werden
// sie zur Vorschau mit Entwurfsmarke angezeigt.
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('gedanken', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => sortDate(b) - sortDate(a));
}

const sortDate = (p: Post) => p.data.pubDate?.getTime() ?? Number.MAX_SAFE_INTEGER;

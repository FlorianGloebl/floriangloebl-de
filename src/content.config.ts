import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import media from './data/media.json';

export const CATEGORIES = [
  'Führung und Zusammenarbeit',
  'Gründen und Machen',
  'Draußen',
  'Persönliches',
] as const;

const photoIds = Object.keys(media) as [string, ...string[]];

const gedanken = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gedanken' }),
  schema: z
    .object({
      title: z.string().min(3).max(120),
      // Kurztext für Archiv, Startseite und Meta-Beschreibung
      description: z.string().min(20).max(300),
      category: z.enum(CATEGORIES),
      // Sicherer Standard: Ohne ausdrückliches "draft: false" bleibt ein Beitrag Entwurf.
      draft: z.boolean().default(true),
      // Veröffentlichungsdatum (Europe/Berlin). Erst beim Veröffentlichen setzen.
      pubDate: z.coerce.date().optional(),
      updatedDate: z.coerce.date().optional(),
      cover: z.enum(photoIds).optional(),
      sources: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    })
    .refine((p) => p.draft || p.pubDate, {
      message: 'Veröffentlichte Beiträge brauchen ein pubDate.',
      path: ['pubDate'],
    }),
});

export const collections = { gedanken };

import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const baseFields = z.object({
  title: z.string(),
  date: z.coerce.date(),
  author: z.enum(['Gianna Yim', 'Stephen Underwood']),
  excerpt: z.string().optional(),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  coverAspect: z
    .enum(['natural', '16-9', '9-16', '4-3', '3-4', '1-1'])
    .optional(),
  tags: z.array(z.string()).optional(),
  gallery: z
    .array(
      z.union([
        z.string(),
        z.object({ src: z.string(), alt: z.string().optional() }),
      ])
    )
    .optional(),
  flickrPhotos: z
    .array(
      z.object({
        id: z.string(),
        caption: z.string().optional(),
        size: z.enum(['large', 'large1600']).optional(),
      })
    )
    .optional(),
  draft: z.boolean().default(false),
});

const writingPost = baseFields.extend({
  kind: z.literal('writing'),
});

const videoPost = baseFields.extend({
  kind: z.literal('video'),
  youtubeId: z.string().optional(),
});

const gamingPost = baseFields.extend({
  kind: z.literal('gaming'),
  game: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  platform: z.string().optional(),
  hours: z.number().min(0).optional(),
});

const journalSchema = z.discriminatedUnion('kind', [writingPost, videoPost, gamingPost]);

const projectsSchema = z.object({
  title: z.string(),
  year: z.number().int(),
  kind: z.enum(['Guide', 'Experiment', 'Tool']),
  status: z.enum(['Live', 'In progress', 'Proof of concept', 'Archived']),
  blurb: z.string(),
  tech: z.array(z.string()).optional(),
  cover: z.string().optional(),
  link: z.string(),
  accent: z.string().optional(),
  draft: z.boolean().default(false),
});

const pagesSchema = z.object({
  title: z.string().optional(),
  hero: z.string().optional(),
  heroAlt: z.string().optional(),
  heroImage: z.string().optional(),
  heroCaption: z.string().optional(),
  eyebrow: z.string().optional(),
  greeting: z.string().optional(),
  intro: z.string().optional(),
  latelyLabel: z.string().optional(),
  nowMonth: z.string().optional(),
  nowBody: z.string().optional(),
});

const postImage = z.union([
  z.string(),
  z.object({ src: z.string(), alt: z.string().optional() }),
]);

const postBase = z.object({
  author: z.enum(['gianna', 'stephen', 'kilo', 'kujo']),
  date: z.coerce.date(),
  caption: z.string(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().default(false),
});

const photoPost = postBase.extend({
  kind: z.literal('photo'),
  images: z.array(postImage).min(1),
});

const videoFeedPost = postBase.extend({
  kind: z.literal('video'),
  images: z.array(postImage).min(1).max(1),
  youtubeId: z.string().optional(),
  duration: z.string().optional(),
});

const postsSchema = z.discriminatedUnion('kind', [photoPost, videoFeedPost]);

export const collections = {
  journal:  defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/journal' }),  schema: journalSchema }),
  projects: defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }), schema: projectsSchema }),
  pages:    defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),    schema: pagesSchema }),
  posts:    defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),    schema: postsSchema }),
};

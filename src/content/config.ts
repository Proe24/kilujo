import { defineCollection, z } from 'astro:content';

const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string().optional(),
  draft: z.boolean().default(false),
  author: z.string().optional(),
  // Optional hero image, rendered above the post body. Path under /public.
  cover: z.string().optional(),
  // Optional caption / alt text for the hero.
  coverAlt: z.string().optional(),
  // Optional gallery rendered as a responsive grid below the post body.
  // Each item is either a path string or { src, alt? }.
  gallery: z
    .array(
      z.union([
        z.string(),
        z.object({ src: z.string(), alt: z.string().optional() }),
      ])
    )
    .optional(),
});

const journalSchema = postSchema.extend({
  // Free-form tags. The journal index links to /journal/tag/<tag>.
  tags: z.array(z.string()).optional(),
});

const vlogSchema = postSchema.extend({
  video: z.string().url().optional(),
});

const gameSchema = postSchema.extend({
  game: z.string().optional(),
  rating: z.string().optional(),
});

export const collections = {
  journal: defineCollection({ type: 'content', schema: journalSchema }),
  vlogs: defineCollection({ type: 'content', schema: vlogSchema }),
  gaming: defineCollection({ type: 'content', schema: gameSchema }),
};

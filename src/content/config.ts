import { defineCollection, z } from 'astro:content';

const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string().optional(),
  draft: z.boolean().default(false),
});

const vlogSchema = postSchema.extend({
  video: z.string().url().optional(),
});

const gameSchema = postSchema.extend({
  game: z.string().optional(),
  rating: z.string().optional(),
});

export const collections = {
  journal: defineCollection({ type: 'content', schema: postSchema }),
  vlogs: defineCollection({ type: 'content', schema: vlogSchema }),
  gaming: defineCollection({ type: 'content', schema: gameSchema }),
};

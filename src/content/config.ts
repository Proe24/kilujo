import { defineCollection, z } from 'astro:content';

/**
 * Shared frontmatter fields used by every authorable post.
 * Matches the `.pages.yml` field list at the repo root.
 */
const baseFields = z.object({
  title: z.string(),
  date: z.coerce.date(),
  author: z.enum(['Gianna Yim', 'Stephen Underwood']),
  excerpt: z.string().optional(),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  gallery: z
    .array(
      z.union([
        z.string(),
        z.object({ src: z.string(), alt: z.string().optional() }),
      ])
    )
    .optional(),
  draft: z.boolean().default(false),
});

/**
 * The journal is one unified feed. The `kind` field discriminates between
 * three shapes: regular writing, a YouTube vlog, or a gaming post.
 *
 * Pages CMS doesn't enforce conditional visibility, so the CMS sends all
 * fields as optional and we use a Zod discriminated union here to keep
 * the rendering side type-safe.
 */
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

/**
 * Projects — small things we've made (guides, experiments, tools).
 * The cards on /projects render from this collection.
 */
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

/**
 * Pages — single-file content (home + about).
 *
 * Most fields are optional because different singletons use different shapes:
 *   - about.md uses { title, hero, heroAlt }
 *   - home.md  uses { nowMonth?, nowBody }
 */
const pagesSchema = z.object({
  title: z.string().optional(),
  hero: z.string().optional(),
  heroAlt: z.string().optional(),
  nowMonth: z.string().optional(),
  nowBody: z.string().optional(),
});

export const collections = {
  journal:  defineCollection({ type: 'content', schema: journalSchema }),
  projects: defineCollection({ type: 'content', schema: projectsSchema }),
  pages:    defineCollection({ type: 'content', schema: pagesSchema }),
};

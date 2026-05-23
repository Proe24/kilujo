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
  /* How to crop the cover image. Default is "natural" — no crop. */
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
 *   - about.md uses { title, hero, heroAlt, body }
 *   - home.md  uses { heroImage, heroAlt, heroCaption, eyebrow, greeting,
 *                     intro, latelyLabel, nowMonth?, nowBody? }
 */
const pagesSchema = z.object({
  title: z.string().optional(),
  // About + (legacy) home hero
  hero: z.string().optional(),
  heroAlt: z.string().optional(),
  // Home page
  heroImage: z.string().optional(),
  heroCaption: z.string().optional(),
  eyebrow: z.string().optional(),
  greeting: z.string().optional(),
  intro: z.string().optional(),
  latelyLabel: z.string().optional(),
  nowMonth: z.string().optional(),
  nowBody: z.string().optional(),
});

/**
 * Posts — short-form, instagram-style feed.
 *
 * Four "accounts": gianna, stephen, kilo, kujo. The dogs are first-class
 * authors with their own avatars (see PostAvatar.astro). All four share one
 * unified feed; the page filters by author client-side.
 *
 * Discriminated on `kind` so video posts can demand a YouTube id and photo
 * posts can demand at least one image. Pages CMS sends everything as
 * optional; the Zod union enforces shape at build time.
 */
const postImage = z.union([
  z.string(),
  z.object({ src: z.string(), alt: z.string().optional() }),
]);

const postBase = z.object({
  /** Author handle — drives the avatar, byline, and filter chip. */
  author: z.enum(['gianna', 'stephen', 'kilo', 'kujo']),
  /** Post date — used for relative time display + sort order. */
  date: z.coerce.date(),
  /** The post body. Short — instagram-caption length. Markdown ok. */
  caption: z.string(),
  /** Optional location pin. Free text — "Uruma, Okinawa", "Couch", whatever. */
  location: z.string().optional(),
  /** Optional hashtag list. Authors can write them with or without the leading #. */
  tags: z.array(z.string()).optional(),
  /** Hide from the public feed. */
  draft: z.boolean().default(false),
});

const photoPost = postBase.extend({
  kind: z.literal('photo'),
  /** At least one image. Carousel kicks in automatically for length > 1. */
  images: z.array(postImage).min(1),
});

const videoFeedPost = postBase.extend({
  kind: z.literal('video'),
  /** Poster image (single — used as the still frame in feed + grid). */
  images: z.array(postImage).min(1).max(1),
  /** YouTube id (no URL, just the id — e.g. `wpQQxUeekks`). */
  youtubeId: z.string().optional(),
  /** Display label like "0:36". Purely cosmetic. */
  duration: z.string().optional(),
});

const postsSchema = z.discriminatedUnion('kind', [photoPost, videoFeedPost]);

export const collections = {
  journal:  defineCollection({ type: 'content', schema: journalSchema }),
  projects: defineCollection({ type: 'content', schema: projectsSchema }),
  pages:    defineCollection({ type: 'content', schema: pagesSchema }),
  posts:    defineCollection({ type: 'content', schema: postsSchema }),
};

# Kilujo — Personal Website

A small Astro-built personal site for Gianna, Stephen, Kilo and Kujo. Live at **kilujo.com**.

Sections: Home, Journal, Posts, Photos, Projects, About.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static build to dist/
npm run preview  # serve the build locally
```

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable          | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `FLICKR_API_KEY`  | Flickr API key. Used to fetch albums at build.  |
| `FLICKR_USER_ID`  | Flickr NSID (e.g. `57829806@N07`).              |

Both are also required as Vercel project environment variables.

## Adding content

### Journal / Vlogs / Gaming posts

Drop a new `.md` file in `src/content/<collection>/`. Required frontmatter:

```yaml
---
title: "Your title"
date: 2024-08-12
---
```

Optional frontmatter (all collections):

| Field         | Notes |
| ------------- | ----- |
| `description` | Short blurb shown on the index. |
| `author`      | Renders a byline ("By Gianna Yim"). |
| `draft`       | `true` hides the post from the build. |
| `cover`       | Path to a hero image (e.g. `/uploads/<slug>/01.jpg`). Rendered above the post body. |
| `coverAlt`    | Alt text for the cover image. |
| `gallery`     | Array of image paths or `{ src, alt }` objects. Rendered as a responsive grid below the post body. |

Per-collection extras:

| Collection | Extra fields |
| ---------- | ------------ |
| `journal`  | `tags: ["coffee", "okinawa"]` — used by `/journal/tag/<tag>` pages and the filter row on the journal index. |
| `vlogs`    | `video: "https://www.youtube.com/watch?v=..."` — auto-embeds inline at the top of the post (uses `youtube-nocookie.com`). |
| `gaming`   | `game: "Title"`, `rating: "★★★★½"`. |

### Posts (instagram-style short form)

Short updates with one or more photos and a caption. Authors include both
of us **and** the dogs. Manage them via Pages CMS (recommended) or by
dropping a markdown file into `src/content/posts/`. Required frontmatter:

```yaml
---
author: gianna            # gianna | stephen | kilo | kujo
date:   2026-05-22T15:40
kind:   photo             # photo | video
caption: "Two-sentence caption. Plain text."
images:
  - { src: "/uploads/posts/01.jpg", alt: "What the photo shows" }
---
```

Optional fields: `location` (free text), `tags` (array), `draft` (boolean).
Video posts add `duration` ("0:36") and optional `youtubeId`. Multiple
`images` automatically become a swipeable carousel.

Images upload via the CMS into `public/uploads/posts/` (flat folder —
Pages CMS doesn't support per-entry subfolders).

### Projects

Cards on `/projects` come from `src/content/projects/*.md` (or the Projects surface in Pages CMS). `link` is either an internal route or an external URL; external links open in a new tab. Current entries: **Yiju** (readyiju.com), **Custom Zhongwen** (GitHub), and the **YouTube transcript** tool below.

### Tools

- **`/tools/shrink-photo`** — client-side photo resizer used before uploading to the CMS. Plain HTML in `public/tools/`.
- **`/tools/transcript`** — YouTube transcript extractor. Paste a link, pick one of the caption languages the video offers, copy or download as `.txt`/`.srt`. The page is static; it calls `/api/transcript`, a small Vercel function (`src/pages/api/transcript.ts` + `src/lib/youtube.ts`) that asks YouTube for the caption tracks and returns the chosen one. No API key, nothing stored. If YouTube rate-limits the server the page shows the error and you can just retry.

### Photos

Managed entirely on Flickr — rebuild the site to refresh the album list and per-album pages.

### About page

Edit `src/pages/about.astro` directly. It's a standalone page, not a markdown collection.

### Post images

Drop images into `public/uploads/<post-slug>/` (any image format). Reference them in the post frontmatter via the `cover` and `gallery` fields. Filenames sort lexicographically, so prefer zero-padded names (`01.jpg`, `02.jpg`, …) if you want a specific order.

## Project layout

```
.
├── astro.config.mjs
├── package.json
├── public/
│   ├── favicon.svg
│   ├── tools/shrink-photo.html
│   └── uploads/             # per-post images (uploads/<slug>/*.jpg)
├── src/
│   ├── components/          # Nav, Footer, Gallery, DogAvatars
│   ├── content/
│   ├── content.config.ts    # zod schemas + glob loaders
│   │   ├── journal/         # *.md
│   │   ├── vlogs/           # *.md
│   │   └── gaming/          # *.md
│   ├── data/guides.ts       # guide cards
│   ├── layouts/Layout.astro
│   ├── lib/flickr.ts        # build-time Flickr fetcher
│   ├── pages/
│   │   ├── about.astro
│   │   ├── index.astro
│   │   ├── journal/{index,[...slug],tag/[tag]}.astro
│   │   ├── vlogs/{index,[...slug]}.astro
│   │   ├── gaming/{index,[...slug]}.astro
│   │   ├── photos/{index,[albumId]}.astro
│   │   ├── projects/index.astro
│   │   ├── tools/transcript.astro   # static page
│   │   └── api/transcript.ts        # on-demand Vercel function
│   ├── lib/youtube.ts               # YouTube caption fetcher (server only)
│   └── styles/global.css
└── tsconfig.json
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. On Vercel, **New Project → Import** the repo. Vercel auto-detects Astro.
3. Add `FLICKR_API_KEY` and `FLICKR_USER_ID` under Project → Settings → Environment Variables.
4. Deploy. Every push to `main` triggers a rebuild.

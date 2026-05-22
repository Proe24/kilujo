# Kilujo — Personal Website

A small Astro-built personal site for Gianna, Stephen, Kilo and Kujo. Live at **kilujo.com**.

Sections: Home, Journal, Vlogs, Gaming, Photos, Guides, About.

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

### Guides

Drop a self-contained static guide into `public/guides/<slug>/`, then add a card to `src/data/guides.ts`. The guide keeps its own styles — the landing page wraps it with the main site palette.

**The Barotrauma guide** at `public/guides/barotrauma/` has its own global nav (sticky topbar + responsive sidebar + auto prev/next) handled by `baro_nav.js`. The sidebar is pinned open on viewports ≥ 1280 px and slides in from the right below that. To add or rename a mod page, edit the `PAGES` array at the top of that file — every page picks it up automatically. Any new HTML page in that folder just needs `<script defer src="baro_nav.js"></script>` before `</body>`.

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
│   ├── guides/
│   │   └── barotrauma/      # static Barotrauma guide
│   └── uploads/             # per-post images (uploads/<slug>/*.jpg)
├── src/
│   ├── components/          # Nav, Footer, Gallery, DogAvatars
│   ├── content/
│   │   ├── config.ts        # zod schemas
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
│   │   └── guides/index.astro
│   └── styles/global.css
└── tsconfig.json
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. On Vercel, **New Project → Import** the repo. Vercel auto-detects Astro.
3. Add `FLICKR_API_KEY` and `FLICKR_USER_ID` under Project → Settings → Environment Variables.
4. Deploy. Every push to `main` triggers a rebuild.

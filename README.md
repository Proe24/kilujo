# A Quiet Corner — Personal Website

A small Astro-built personal site with Home, Journal, Vlogs, Gaming, Photos, and Guides.

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

- **Journal / Vlogs / Gaming** — drop a new `.md` file in `src/content/<collection>/`. Frontmatter requires `title` and `date`; see existing posts for examples.
- **Guides** — drop a self-contained static guide into `public/guides/<slug>/`, then add a card in `src/data/guides.ts`.
- **Photos** — managed entirely on Flickr; rebuild the site to refresh the albums list.

## Project layout

```
.
├── astro.config.mjs
├── package.json
├── public/
│   ├── favicon.svg
│   └── guides/
│       └── barotrauma/      # static Barotrauma guide (untouched)
├── src/
│   ├── components/          # Nav, Footer
│   ├── content/             # markdown posts (journal/vlogs/gaming)
│   ├── data/guides.ts       # guide cards
│   ├── layouts/Layout.astro
│   ├── lib/flickr.ts        # build-time Flickr fetcher
│   ├── pages/               # routes
│   └── styles/global.css
└── tsconfig.json
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. On Vercel, **New Project → Import** the repo. Vercel auto-detects Astro.
3. Add `FLICKR_API_KEY` and `FLICKR_USER_ID` under Project → Settings → Environment Variables.
4. Deploy.

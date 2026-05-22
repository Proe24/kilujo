# kilujo — Project Notes for Claude

Personal Astro site. Live at **kilujo.com** (and `www.kilujo.com`).
GitHub: **github.com/Proe24/kilujo** · Hosting: **Vercel** (auto-deploys on push to `main`).

## Workflow

The owner handles git. Claude edits files locally; the owner runs:

```powershell
git add .
git commit -m "..."
git push
```

Vercel rebuilds on every push to `main`.

## Ground rules

1. **No secrets in the repo, ever.** API keys, tokens, and credentials come from environment variables only. Never inline them in code, never commit `.env`, never log them.
2. **New env vars must be announced.** If a change introduces a new env var, tell the owner clearly *before* the next push so they can add it to Vercel's project settings first. Otherwise the deploy will break.
3. **Keep notes up to date.** When adding features, pages, env vars, or non-obvious behavior, update `README.md` (and this file if it's about how the project is operated) so there's a written record.
4. **Privacy by default.** No analytics scripts, no third-party trackers, no external CDNs, no embedded social widgets — unless the owner explicitly asks. Self-host anything that can be self-hosted.
5. **Barotrauma guide lives at `public/guides/barotrauma/`.** Treat those files as a self-contained static drop. Don't rewrite their styling to match the main site — the dark submarine theme is intentional once you click into the guide.

## Current env vars (set in Vercel)

| Variable          | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `FLICKR_API_KEY`  | Build-time Flickr fetch for the Photos page. |
| `FLICKR_USER_ID`  | Flickr NSID for the same.                    |

The local `.env` mirrors these for `npm run dev` / `npm run build` on the owner's machine; it is gitignored.

## Adding things

- **Journal / Vlogs / Gaming post:** drop a new `.md` file in `src/content/<collection>/` with `title` + `date` frontmatter. Optional: `author` (renders a byline), `description`, `draft`. See README for per-collection extras.
- **A new guide:** put its static files in `public/guides/<slug>/` and add a card entry to `src/data/guides.ts`.
- **A new section in the top nav:** edit the `links` array in `src/components/Nav.astro` and create the matching page under `src/pages/`.
- **The About page** lives at `src/pages/about.astro` — standalone, not a markdown collection. Edit the HTML directly.

## Content conventions

- **Bylines:** Gianna's posts → `author: "Gianna Yim"`. Stephen's → `author: "Stephen Underwood"`. Renders as "By {name}" on post pages.
- **Tags (journal only):** array under `tags:` in frontmatter. Each tag generates a page at `/journal/tag/<tag>`. The journal index shows a tag-filter row when any tags exist. Coffee posts use `["coffee", "okinawa"]` so far.
- **Vlog embeds:** put the YouTube URL in `video:` frontmatter. The post template auto-extracts the ID and embeds via `youtube-nocookie.com` (privacy-friendlier than `youtube.com`).

## Third-party embeds in use

- **YouTube (youtube-nocookie.com)** — inline iframe on vlog post pages. The owner has been informed; this is the lowest-tracking variant of a YouTube embed.

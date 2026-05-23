# kilujo — Project Notes for Claude

A small personal Astro site for **Gianna Yim**, **Stephen Underwood**, and their dogs **Kilo** (Shiba Inu) and **Kujo** (Jindo/Border Collie mix). Quiet, slow-paced, not a brand. Currently in Okinawa.

- **Live:** kilujo.com (and `www.kilujo.com`)
- **Repo:** github.com/Proe24/kilujo
- **Hosting:** Vercel — auto-deploys on every push to `main`.

---

## Workflow

The owner handles git. **Claude edits files locally; the owner runs `git add . && git commit && git push`.** Do not create commits unless explicitly asked.

```powershell
npm install        # one-time
npm run dev        # http://localhost:4321
npm run build      # static build → dist/
npm run preview    # serve the build locally
```

---

## Ground rules

1. **No secrets in the repo, ever.** API keys come from env vars only. Never inline, never commit `.env`, never log.
2. **Announce new env vars before push.** If a change introduces one, tell the owner clearly so it gets added to Vercel first — otherwise the next deploy breaks.
3. **Privacy by default.** No analytics, no third-party trackers, no external CDNs, no embedded social widgets unless the owner explicitly asks. Self-host anything that can be self-hosted (fonts via `@fontsource/*`, images via `public/uploads/`).
4. **Update docs when behavior changes.** Touch `README.md` for user-facing things; this file for how the project is operated.
5. **Tell the owner clearly when you change existing Astro files** — they want to know what to expect before pushing.
6. **The Barotrauma guide is a self-contained drop.** See the dedicated section below; don't restyle it to match the main site.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Astro 5** (static output) |
| Language | TypeScript |
| Styling | Hand-written CSS in `src/styles/global.css` (design tokens + utilities) |
| Fonts | **Self-hosted Newsreader** via `@fontsource/newsreader` (no Google CDN) |
| Content | Astro content collections + markdown |
| External data | **Flickr API** at build time (only for `/photos`) |
| CMS | **Pages CMS** (`.pages.yml` at root, free, GitHub-OAuth) |
| Deploy | Vercel, auto on push to `main` |

---

## Repo layout

```
.
├── .pages.yml                  # Pages CMS configuration
├── astro.config.mjs
├── package.json                # deps: astro, @fontsource/newsreader
├── docs/
│   └── adding-photos.md        # plain-English guide for Gianna on the two photo paths
├── public/
│   ├── favicon.svg
│   ├── guides/
│   │   └── barotrauma/         # self-contained dark-theme guide (see below)
│   ├── tools/
│   │   └── shrink-photo.html   # client-side photo resizer for Path A uploads
│   └── uploads/                # self-hosted media
│       ├── about/
│       ├── journal/<post-slug>/
│       ├── posts/               # flat — CMS doesn't support per-entry subfolders
│       └── projects/<project-slug>/
└── src/
    ├── components/             # Nav, Footer, Gallery, DogAvatars, FlickrPhoto
    ├── content/
    │   ├── config.ts           # zod schemas (journal/posts/projects/pages)
    │   ├── journal/            # unified feed
    │   ├── posts/              # short-form, instagram-style feed
    │   ├── projects/           # cards on /projects
    │   └── pages/              # singletons: about.md, home.md
    ├── layouts/Layout.astro
    ├── lib/flickr.ts           # build-time Flickr fetcher
    ├── pages/
    │   ├── index.astro         # home
    │   ├── about.astro         # renders src/content/pages/about.md
    │   ├── journal/{index,[...slug],tag/[tag]}.astro
    │   ├── posts/index.astro    # one-page feed (no per-post route)
    │   ├── photos/{index,[albumId]}.astro
    │   └── projects/index.astro
    └── styles/global.css
```

---

## Content model

Five editable surfaces, all defined in `.pages.yml` and `src/content/config.ts`:

### Journal (`src/content/journal/`)
Unified feed of **writing / video / gaming**. The `kind` field discriminates which extra fields apply:

| Field | Notes |
| --- | --- |
| `title`, `date`, `author`, `kind` | Required. `author` is `"Gianna Yim"` or `"Stephen Underwood"`. |
| `excerpt`, `cover`, `coverAlt`, `tags`, `gallery`, `flickrPhotos` | Optional, all kinds. |
| `flickrPhotos` | Array of `{ id, caption?, size? }`. Full-quality photos fetched from Flickr at build time. See [Adding photos](#adding-photos-to-journal-posts) below. |
| `youtubeId` | Only when `kind: video`. Just the ID (e.g. `wpQQxUeekks`), not the URL. |
| `game`, `rating` (1–5), `platform`, `hours` | Only when `kind: gaming`. |

The Astro schema (`src/content/config.ts`) uses a **Zod discriminated union** so invalid combinations fail at build time. Pages CMS sends them all as optional and we narrow on the kind.

### Posts (`src/content/posts/`)
Instagram-style short-form feed at `/posts`. Four "accounts" share one
feed; the dogs are first-class authors with their own avatars.

| Field | Notes |
| --- | --- |
| `author` | Required. One of `gianna` \| `stephen` \| `kilo` \| `kujo` (handles, not display names — those are looked up in `PostAvatar.astro`). |
| `date` | Required. ISO datetime — drives both relative-time display and sort order. |
| `kind` | Required. `photo` or `video`. Zod discriminated union enforces shape. |
| `caption` | Required. Short plain text. |
| `images` | Required, array of `{ src, alt }` or strings. ≥1 image; for video, exactly one (the poster). >1 → carousel. |
| `location`, `tags`, `draft` | Optional, all kinds. |
| `youtubeId`, `duration` | Only for `kind: video`. |

The page (`src/pages/posts/index.astro`) server-renders all three layouts (feed/grid/masonry) into one DOM, and an inline JS island switches between them via a `data-layout` attribute on the page root. State persists to `localStorage` and mirrors to `?author=`/`?layout=`/`?tag=` URL params.

No per-post detail page (no `[slug].astro`). Instagram-style feeds don't usually have permalinks; grid tiles deep-link to `#post-<slug>` anchors so in-page scroll-to works. Add `src/pages/posts/[...slug].astro` later if that changes.

The schema lives in `src/content/config.ts` next to `journalSchema`. The CMS surface is configured in `.pages.yml` under `content[name=posts]`, with its own media store (`posts`) pointing at `public/uploads/posts/`.

### Projects (`src/content/projects/`)
Small things we've made — guides, experiments, tools. Drives `/projects`.

| Field | Notes |
| --- | --- |
| `title`, `year`, `kind`, `status`, `blurb`, `link` | Required. `kind` ∈ {Guide, Experiment, Tool}. `status` ∈ {Live, In progress, Proof of concept, Archived}. |
| `tech`, `cover`, `accent`, `body` | Optional. `accent` is a hex string for the card's top stripe (default `#c08a6f`). |

`link` is either an internal path (e.g. `/guides/barotrauma/baro_index.html`) or an external URL. The Barotrauma guide is one project entry; its static files still live under `public/guides/barotrauma/`.

### Pages (`src/content/pages/`)
Single-file content. Two singletons today:

- **`about.md`** — rendered by `src/pages/about.astro` via `getEntry('pages', 'about')`. Fields: `title`, `hero`, `heroAlt`, body.
- **`home.md`** — drives the **entire home page** (`src/pages/index.astro` is a thin renderer). Fields:
  - `heroImage`, `heroAlt`, `heroCaption` — the photo at the top and its italic caption.
  - `eyebrow` — small caps line above the greeting.
  - `greeting` — the big italic intro. Newlines render as `<br>`; any `&` is auto-styled with `.amp`.
  - `intro` — paragraph under the greeting.
  - `latelyLabel` — eyebrow above the latest entries (e.g. `"From the journal · Lately"`).
  - `nowMonth` — optional override for the "Now · …" eyebrow on the status card. Blank → uses the current month.
  - `nowBody` — the status paragraph. Blank → the whole status card is hidden.

### Photos — *not* managed
Albums are pulled from **Flickr at build time** via `src/lib/flickr.ts` and rendered by `src/pages/photos/`. The CMS does not touch this — leave it alone.

---

## Authoring conventions

- **Bylines:** `author: "Gianna Yim"` (coffee posts so far) or `author: "Stephen Underwood"` (vlogs so far). Renders as "By {name}" on post pages.
- **Tags:** array on journal posts. The journal index has **client-side filter chips** for kind and tag, with state mirrored to URL params (`/journal?kind=video&tag=coffee`). Tag chips on individual posts deep-link into the filter. There is no `/journal/tag/<tag>` route — the filter is the single way to slice the list.
- **YouTube:** `kind: video` + `youtubeId: "..."`. Rendered inline via `youtube-nocookie.com` (lowest-tracking variant — owner approved).
- **Images:**
  - Existing hand-migrated content: `public/uploads/journal/<post-slug>/01.jpg` (zero-padded for sort order).
  - New CMS uploads: flat in `public/uploads/journal/` (Pages CMS doesn't support per-entry subfolders).
  - Reference via `cover` (single string) and `gallery` (array of strings *or* `{ src, alt }` objects).
- **Markdown:** use straight ASCII apostrophes/quotes when writing or migrating content — easier round-tripping through CMS edits.

---

## Adding photos to journal posts

Two paths, designed to coexist in a single post:

**Path A — Upload (for casual phone snaps).** Run the photo through `public/tools/shrink-photo.html` first (resizes to 2000px long side, JPEG q=0.85, strips EXIF), then drag the result into the CMS **Gallery** field. The 4.5 MB Vercel request-body limit makes pre-shrinking mandatory for full-resolution phone photos. HEIC isn't handled by the tool — falls back to documenting [Squoosh.app](https://squoosh.app).

**Path B — Flickr embed (for full-quality camera shots).** Upload to Flickr, copy the numeric photo ID from the URL, paste it into the **Flickr photos** list field on a journal post. The site fetches title/dimensions/URLs at build time via `getPhotoInfo()` in `src/lib/flickr.ts` and renders each one as a full-width figure with caption via `src/components/FlickrPhoto.astro`.

**Cache.** Flickr per-photo metadata is cached to `node_modules/.cache/kilujo-flickr.json` so repeated builds don't re-hit the API. To force a refresh (e.g. after editing a photo's Flickr title), delete that file. The cache is outside the repo — `node_modules` lifecycle handles cleanup.

**Missing photos.** If a Flickr photo is deleted, made private, or the API call fails, the build still succeeds. The component renders a small "(Flickr photo {id} unavailable)" placeholder in the post and logs a `[flickr]` warning. Build never breaks on a single bad ID.

**Where they render in the layout.** In `src/pages/journal/[...slug].astro` the order is: header → cover → (video embed if applicable) → gaming meta → body `<Content />` → Flickr embeds (big) → Gallery (small thumbs).

**Scope note.** Currently journal-only. The `/posts` short-form feed still uses uploaded `images` since its instagram-style UI is built around a fixed image array; extending Flickr support there is a larger UX change.

Long-form workflow doc for Gianna lives at [docs/adding-photos.md](docs/adding-photos.md) — keep that in sync if you change anything about the workflow.

---

## Design system

The site uses the warm **"kilujo"** design (Claude Design handoff, May 2026):

- **Palette:** soft warm neutrals + terracotta accent. Tokens in `src/styles/global.css`:
  `--bg: #faf7f2`, `--bg-alt: #f1ece4`, `--text: #2f2a26`, `--muted: #76695f`, `--accent: #c08a6f`, `--border: #e6ddd1`.
- **Type:** italic **Newsreader** for display headings, **Iowan Old Style / Georgia** for body. Sans only for UI chrome (eyebrow labels, post meta, nav links).
- **Texture:** subtle SVG paper-grain + warm vignette on `body::before` / `body::after`.
- **Nav:** fixed at top, 64px tall, italic wordmark "kilujo." with terracotta dot. Six items: Home · Journal · Posts · Photos · Projects · About.
- **Shapes:** 14px corner radius on cards, soft drop shadows, rounded pill tags.
- **Dark mode:** CSS tokens defined under `[data-theme="dark"]`. No UI toggle wired yet — to test, set `data-theme="dark"` on `<html>`.
- **Wrappers:** pages provide their own `<div class="page"><div class="wrap">…</div></div>`. Three widths: `.wrap` (820px), `.wrap-wide` (1080px), `.wrap-narrow` (640px).

---

## Pages CMS

Config: **`.pages.yml`** at repo root. Four editable surfaces (Journal, Projects, Home — Now status, About), three named media stores (one per surface, all under `public/uploads/`).

- **Log in:** https://app.pagescms.org/ → Sign in with GitHub → authorize the `Proe24/kilujo` repo → click into it.
- Commits land on `main`. Vercel auto-rebuilds.
- **Pages CMS doesn't support conditional fields or dynamic per-entry image paths.** The kind-specific fields all show; the Zod schema is the actual guard. New CMS image uploads land flat (not in per-post subfolders).

---

## Env vars (set in Vercel)

| Variable | Purpose |
| --- | --- |
| `FLICKR_API_KEY` | Build-time Flickr fetch for the Photos page **and** inline `<FlickrPhoto>` embeds in journal posts. |
| `FLICKR_USER_ID` | Flickr NSID (e.g. `57829806@N07`). |

Local `.env` mirrors these for `npm run dev`/`build`. Gitignored.

---

## Barotrauma guide (`public/guides/barotrauma/`)

A self-contained static site living under `public/guides/`. **Treat as a sealed drop** — don't restyle it to match the main site. The dark "submarine" theme is intentional once you click in.

- **Single source of truth: `baro_nav.js`.** The `PAGES` array at the top of that file lists the hub, the playbook, and all 17 mod pages with their categories. Edit there and every page updates automatically.
- **Nav UX:** sticky topbar on every page with a back link to `/projects`, breadcrumb, position chip ("6 / 17"), and an "All mods" menu. The mod list is a **persistent right sidebar on viewports ≥ 1280 px**, and a **slide-in drawer below that breakpoint** (Esc / `/` / J / K shortcuts wired). Auto-injected prev/next at the bottom of every mod page.
- **To add a new page** in `public/guides/barotrauma/`: add the entry to the `PAGES` array in `baro_nav.js`, and include `<script defer src="baro_nav.js"></script>` before `</body>` in the new HTML file.

---

## Third-party embeds in use

| Embed | Where | Notes |
| --- | --- | --- |
| **YouTube (youtube-nocookie.com)** | `/journal/<slug>` when `kind: video` | Lowest-tracking variant. Approved. |
| **Flickr static URLs** | `/photos` and inline `<FlickrPhoto>` embeds in journal posts | Owner's own account; images served directly from `live.staticflickr.com`. |

Nothing else. No analytics, no fonts CDN, no widgets.

---

## Working preferences (carry these forward)

Inferred from the work to date — these will save back-and-forth:

- **Ask before structural changes.** Renaming nav items, restructuring collections, deleting routes — surface the choice first. Recommended option with one-line trade-off is welcomed.
- **State explicitly what existing files you're touching.** A table at the end of changes works well.
- **Default to recommendations marked clearly.** Use `AskUserQuestion` with a "(Recommended)" option when the answer matters.
- **Run a build after non-trivial changes** and confirm the page count + key routes generated. Spin up the preview server for visual changes; screenshots are welcome.
- **Keep commits batched.** The owner pushes after a logical chunk of work, not every small change.
- **Flag privacy implications.** If something introduces a third-party network call, call it out and offer a self-hosted alternative.
- **Don't fabricate content.** No placeholder posts under Gianna/Stephen's name — leave the section empty or use obviously-non-real demo data clearly labelled.
- **No emojis unless asked.** Plain prose, occasional `→` or `·` for typography.
- **Migrate dates carefully.** When a post date is ambiguous from source (e.g. `.docx` says "Aug 12" with no year), pick a reasonable default and flag it for the owner to confirm.

---

## Quick deploy steps (first push or domain changes)

1. Push to GitHub (`main`).
2. On Vercel: **New Project → Import** the repo. Astro is auto-detected.
3. Set `FLICKR_API_KEY` and `FLICKR_USER_ID` under Project Settings → Environment Variables.
4. Deploy. Every push to `main` triggers a rebuild.

import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'ignore',
  // Astro 7 defaults to JSX-style whitespace collapsing between inline
  // elements; keep the older HTML-aware behaviour so prose spacing is stable.
  compressHTML: true,
  // Static site; the adapter exists only so `src/pages/api/*` routes marked
  // `prerender = false` can run as Vercel functions (YouTube transcript tool).
  adapter: vercel(),
});

import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'ignore',
  // Static site; the adapter exists only so `src/pages/api/*` routes marked
  // `prerender = false` can run as Vercel functions (YouTube transcript tool).
  adapter: vercel(),
});

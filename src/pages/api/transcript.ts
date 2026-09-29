/**
 * GET /api/transcript?v=<id or url>                  → video info + caption tracks
 * GET /api/transcript?v=<id>&lang=<code>&kind=<auto|manual> → timed segments
 *
 * On-demand (not prerendered): runs as a Vercel function. Responses are
 * cached at the CDN edge for an hour so repeated requests for the same video
 * don't re-hit YouTube.
 */
import type { APIRoute } from 'astro';
import { getTranscript, getVideoInfo, parseVideoId, YouTubeError } from '../../lib/youtube';

export const prerender = false;

const json = (body: unknown, status = 200, cache = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache ? 'public, s-maxage=3600, stale-while-revalidate=86400' : 'no-store',
    },
  });

export const GET: APIRoute = async ({ request, url }) => {
  // Light same-site guard: the page sets this header on its fetches. Keeps
  // the route from being casually used as a free proxy by other sites.
  if (request.headers.get('x-requested-with') !== 'kilujo') {
    return json({ error: 'Forbidden' }, 403);
  }

  const v = url.searchParams.get('v') ?? '';
  const videoId = parseVideoId(v);
  if (!videoId) {
    return json({ error: 'That does not look like a YouTube link or video ID.' }, 400);
  }

  const lang = url.searchParams.get('lang');
  const kind = url.searchParams.get('kind') === 'auto' ? 'auto' : 'manual';

  try {
    if (!lang) {
      const info = await getVideoInfo(videoId);
      return json(info, 200, true);
    }
    const result = await getTranscript(videoId, lang, kind);
    return json({ videoId, ...result }, 200, true);
  } catch (err) {
    if (err instanceof YouTubeError) return json({ error: err.message }, err.status);
    console.error('[transcript]', err);
    return json({ error: 'Could not reach YouTube. Try again in a moment.' }, 502);
  }
};

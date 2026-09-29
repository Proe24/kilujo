// TEMPORARY diagnostic: which InnerTube client identities work from Vercel's IPs?
import type { APIRoute } from 'astro';
export const prerender = false;

const VIDEO = '8jPQjjsBbIc';

const CLIENTS: Record<string, { ua: string; client: Record<string, unknown>; extra?: Record<string, unknown> }> = {
  ANDROID: {
    ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip',
    client: { clientName: 'ANDROID', clientVersion: '20.10.38', androidSdkVersion: 30, hl: 'en' },
  },
  ANDROID_VR: {
    ua: 'com.google.android.apps.youtube.vr.oculus/1.62.27 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
    client: { clientName: 'ANDROID_VR', clientVersion: '1.62.27', deviceMake: 'Oculus', deviceModel: 'Quest 3', androidSdkVersion: 32, osName: 'Android', osVersion: '12L', hl: 'en' },
  },
  IOS: {
    ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    client: { clientName: 'IOS', clientVersion: '20.10.4', deviceMake: 'Apple', deviceModel: 'iPhone16,2', osName: 'iPhone', osVersion: '18.3.2.22D82', hl: 'en' },
  },
  WEB: {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    client: { clientName: 'WEB', clientVersion: '2.20250312.04.00', hl: 'en' },
  },
  MWEB: {
    ua: 'Mozilla/5.0 (iPad; CPU OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1,gzip(gfe)',
    client: { clientName: 'MWEB', clientVersion: '2.20250311.03.00', hl: 'en' },
  },
  TVHTML5: {
    ua: 'Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version',
    client: { clientName: 'TVHTML5', clientVersion: '7.20250312.16.00', hl: 'en' },
  },
  TV_EMBEDDED: {
    ua: 'Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version',
    client: { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0', hl: 'en' },
    extra: { thirdParty: { embedUrl: 'https://www.youtube.com/' } },
  },
  WEB_EMBEDDED: {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    client: { clientName: 'WEB_EMBEDDED_PLAYER', clientVersion: '1.20250310.01.00', hl: 'en' },
    extra: { thirdParty: { embedUrl: 'https://www.youtube.com/' } },
  },
  WEB_CREATOR: {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    client: { clientName: 'WEB_CREATOR', clientVersion: '1.20250312.03.01', hl: 'en' },
  },
};

async function probe(name: string, videoId: string) {
  const { ua, client, extra } = CLIENTS[name];
  const t0 = Date.now();
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': ua, 'x-youtube-client-name': '0' },
      body: JSON.stringify({ context: { client, ...(extra ?? {}) }, videoId, contentCheckOk: true, racyCheckOk: true }),
    });
    const j: any = await res.json().catch(() => ({}));
    const tracks = j.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    let caption = 'n/a';
    if (tracks[0]) {
      const c = await fetch(tracks[0].baseUrl + '&fmt=json3', { headers: { 'user-agent': ua } });
      const t = await c.text();
      caption = `${c.status} ${t.length}b ${t.includes('"events"') ? 'ok' : 'empty/blocked'}`;
    }
    return { name, http: res.status, status: j.playabilityStatus?.status, reason: j.playabilityStatus?.reason, tracks: tracks.length, caption, ms: Date.now() - t0 };
  } catch (e) {
    return { name, error: String(e), ms: Date.now() - t0 };
  }
}

async function watchPage(videoId: string) {
  const t0 = Date.now();
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'accept-language': 'en-US,en;q=0.9' },
    });
    const html = await res.text();
    const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;\s*(?:var\s|<\/script>)/s);
    let status = 'no-player-response', tracks = -1;
    if (m) {
      try { const j = JSON.parse(m[1]); status = j.playabilityStatus?.status + ' ' + (j.playabilityStatus?.reason ?? ''); tracks = j.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length ?? 0; } catch { status = 'parse-fail'; }
    }
    return { name: 'WATCH_PAGE', http: res.status, bytes: html.length, bot: html.includes('confirm you’re not a bot') || html.includes("confirm you're not a bot"), status, tracks, ms: Date.now() - t0 };
  } catch (e) {
    return { name: 'WATCH_PAGE', error: String(e), ms: Date.now() - t0 };
  }
}

export const GET: APIRoute = async ({ url }) => {
  const v = url.searchParams.get('v') || VIDEO;
  const only = url.searchParams.get('c');
  const names = only ? only.split(',') : Object.keys(CLIENTS);
  const results = [];
  for (const n of names) if (CLIENTS[n]) results.push(await probe(n, v));
  results.push(await watchPage(v));
  return new Response(JSON.stringify({ region: process.env.VERCEL_REGION, results }, null, 1), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};

/**
 * YouTube caption fetcher (server-side only).
 *
 * Used by the on-demand route at src/pages/api/transcript.ts. Talks to
 * YouTube's InnerTube "player" endpoint with a mobile client identity
 * (that is the only variant that still returns caption tracks without a
 * proof-of-origin token), then downloads the chosen track in json3 form.
 *
 * Nothing here touches the browser: the caption URLs carry no CORS headers,
 * so the page cannot fetch them directly. No API key is required.
 */

export interface CaptionTrack {
  /** BCP-47 language code as YouTube reports it (e.g. "en", "zh-TW"). */
  lang: string;
  /** Human-readable name, e.g. "English (auto-generated)". */
  name: string;
  /** "auto" for ASR tracks, "manual" for uploaded/reviewed ones. */
  kind: 'auto' | 'manual';
}

export interface VideoInfo {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  tracks: CaptionTrack[];
}

export interface TranscriptSegment {
  /** Start time in seconds. */
  start: number;
  /** Duration in seconds. */
  dur: number;
  text: string;
}

export class YouTubeError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Accepts a bare 11-char ID or any common YouTube URL shape. */
export function parseVideoId(input: string): string | null {
  const s = input.trim();
  if (ID_RE.test(s)) return s;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\.|^music\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return ID_RE.test(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v');
    if (v && ID_RE.test(v)) return v;
    const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

// ─── InnerTube ──────────────────────────────────────────────────────────────

interface RawTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  name?: { simpleText?: string; runs?: { text: string }[] };
}

interface PlayerResponse {
  playabilityStatus?: { status?: string; reason?: string };
  videoDetails?: { title?: string; author?: string; lengthSeconds?: string };
  captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: RawTrack[] } };
}

const CLIENTS = [
  {
    ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip',
    client: { clientName: 'ANDROID', clientVersion: '20.10.38', androidSdkVersion: 30, hl: 'en' },
  },
  {
    ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    client: {
      clientName: 'IOS',
      clientVersion: '20.10.4',
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      osName: 'iPhone',
      osVersion: '18.3.2.22D82',
      hl: 'en',
    },
  },
];

async function fetchPlayer(videoId: string): Promise<PlayerResponse> {
  let lastReason = 'YouTube did not return a usable response.';
  for (const { ua, client } of CLIENTS) {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': ua },
      body: JSON.stringify({ context: { client }, videoId, contentCheckOk: true, racyCheckOk: true }),
    });
    if (!res.ok) {
      lastReason = `YouTube answered ${res.status}.`;
      continue;
    }
    const json = (await res.json()) as PlayerResponse;
    const status = json.playabilityStatus?.status;
    if (status === 'OK') return json;
    if (status === 'ERROR') {
      throw new YouTubeError(json.playabilityStatus?.reason || 'Video not found.', 404);
    }
    if (status === 'LOGIN_REQUIRED') {
      lastReason =
        json.playabilityStatus?.reason ||
        'YouTube asked the server to sign in (bot check). Try again in a little while.';
      continue;
    }
    lastReason = json.playabilityStatus?.reason || `Video is ${String(status).toLowerCase()}.`;
  }
  throw new YouTubeError(lastReason, 502);
}

// Small in-memory cache so "list tracks" then "fetch transcript" only hits
// the player endpoint once per video while the function instance is warm.
const playerCache = new Map<string, { at: number; data: PlayerResponse }>();
const PLAYER_TTL_MS = 5 * 60 * 1000;

async function getPlayer(videoId: string): Promise<PlayerResponse> {
  const hit = playerCache.get(videoId);
  if (hit && Date.now() - hit.at < PLAYER_TTL_MS) return hit.data;
  const data = await fetchPlayer(videoId);
  playerCache.set(videoId, { at: Date.now(), data });
  if (playerCache.size > 200) {
    const oldest = playerCache.keys().next().value;
    if (oldest) playerCache.delete(oldest);
  }
  return data;
}

function trackName(t: RawTrack): string {
  return t.name?.simpleText ?? t.name?.runs?.map((r) => r.text).join('') ?? t.languageCode;
}

function rawTracks(p: PlayerResponse): RawTrack[] {
  return p.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
}

/** Video metadata plus the list of caption tracks, manual ones first. */
export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const p = await getPlayer(videoId);
  const tracks: CaptionTrack[] = rawTracks(p)
    .map((t) => ({
      lang: t.languageCode,
      name: trackName(t),
      kind: t.kind === 'asr' ? ('auto' as const) : ('manual' as const),
    }))
    .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'manual' ? -1 : 1));
  return {
    videoId,
    title: p.videoDetails?.title ?? '',
    author: p.videoDetails?.author ?? '',
    lengthSeconds: Number(p.videoDetails?.lengthSeconds ?? 0),
    tracks,
  };
}

interface Json3 {
  events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }[];
}

/** Download one caption track as timed segments. */
export async function getTranscript(
  videoId: string,
  lang: string,
  kind: 'auto' | 'manual',
): Promise<{ track: CaptionTrack; segments: TranscriptSegment[] }> {
  const p = await getPlayer(videoId);
  const raw = rawTracks(p).find(
    (t) => t.languageCode === lang && (t.kind === 'asr') === (kind === 'auto'),
  );
  if (!raw) throw new YouTubeError('That caption track is not available for this video.', 404);

  const url = new URL(raw.baseUrl);
  url.searchParams.set('fmt', 'json3');
  const res = await fetch(url);
  if (!res.ok) throw new YouTubeError(`YouTube refused the caption download (${res.status}).`, 502);
  const json = (await res.json()) as Json3;

  const segments: TranscriptSegment[] = [];
  for (const ev of json.events ?? []) {
    if (!ev.segs) continue;
    const text = ev.segs
      .map((s) => s.utf8 ?? '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    segments.push({
      start: (ev.tStartMs ?? 0) / 1000,
      dur: (ev.dDurationMs ?? 0) / 1000,
      text,
    });
  }
  return {
    track: { lang: raw.languageCode, name: trackName(raw), kind },
    segments,
  };
}

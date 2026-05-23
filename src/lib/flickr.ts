// Build-time Flickr fetcher. Used by /photos and /photos/[albumId], plus the
// <FlickrPhoto> embed component used inside journal posts.
//
// Auth: API key is enough for public photos. We never call from the browser —
// these helpers are only invoked from Astro frontmatter at build time, so the
// key stays in the build environment.
//
// Per-photo lookups (getPhotoInfo) are cached to
// node_modules/.cache/kilujo-flickr.json so repeated builds don't re-fetch.
// Cache invalidation: delete that file, or `rm -rf node_modules/.cache`.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const ENDPOINT = 'https://api.flickr.com/services/rest/';
const CACHE_PATH = 'node_modules/.cache/kilujo-flickr.json';

const API_KEY = import.meta.env.FLICKR_API_KEY ?? process.env.FLICKR_API_KEY ?? '';
const USER_ID = import.meta.env.FLICKR_USER_ID ?? process.env.FLICKR_USER_ID ?? '';

export interface FlickrAlbum {
  id: string;
  title: string;
  description: string;
  photoCount: number;
  coverUrl: string;
  date: Date;
}

export interface FlickrPhoto {
  id: string;
  title: string;
  thumbUrl: string;
  largeUrl: string;
  pageUrl: string;
  width?: number;
  height?: number;
}

export interface FlickrPhotoInfo {
  id: string;
  title: string;
  description: string;
  pageUrl: string;
  /** Display URL — Flickr "Large 1024" (longest side ~1024px). */
  largeUrl: string;
  /** Larger variant — Flickr "Large 1600" (longest side ~1600px). May be absent on small originals. */
  large1600Url?: string;
  /** Original-size URL — only present if the photo's owner allows it; usually undefined. */
  originalUrl?: string;
  width?: number;
  height?: number;
}

interface RawPhotoset {
  id: string;
  title: { _content: string };
  description: { _content: string };
  photos: number | string;
  date_create: string;
  primary: string;
  server: string;
  secret: string;
  farm: number;
}

interface PhotosetsResponse {
  stat: string;
  photosets?: { photoset: RawPhotoset[] };
  message?: string;
}

interface RawPhoto {
  id: string;
  title: string;
  server: string;
  secret: string;
  farm: number;
  width_m?: string | number;
  height_m?: string | number;
}

interface PhotosResponse {
  stat: string;
  photoset?: { photo: RawPhoto[]; title?: string; id?: string };
  message?: string;
}

function staticUrl(p: { farm: number; server: string; id: string; secret: string }, size: string) {
  return `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_${size}.jpg`;
}

function pageUrl(photoId: string, albumId?: string) {
  return albumId
    ? `https://www.flickr.com/photos/${USER_ID}/${photoId}/in/album-${albumId}/`
    : `https://www.flickr.com/photos/${USER_ID}/${photoId}/`;
}

async function callFlickr<T>(method: string, params: Record<string, string>): Promise<T> {
  if (!API_KEY || !USER_ID) {
    throw new Error('FLICKR_API_KEY or FLICKR_USER_ID is not set. See .env.example.');
  }
  const url = new URL(ENDPOINT);
  url.searchParams.set('method', method);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('format', 'json');
  url.searchParams.set('nojsoncallback', '1');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Flickr ${method} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function getAlbums(): Promise<FlickrAlbum[]> {
  try {
    const data = await callFlickr<PhotosetsResponse>('flickr.photosets.getList', {
      user_id: USER_ID,
      per_page: '200',
    });
    if (data.stat !== 'ok' || !data.photosets) {
      console.warn('[flickr] getList non-ok:', data.message ?? data.stat);
      return [];
    }
    return data.photosets.photoset.map((ps) => ({
      id: ps.id,
      title: ps.title._content,
      description: ps.description._content,
      photoCount: Number(ps.photos),
      coverUrl: staticUrl({ farm: ps.farm, server: ps.server, id: ps.primary, secret: ps.secret }, 'z'),
      date: new Date(Number(ps.date_create) * 1000),
    }));
  } catch (err) {
    console.warn('[flickr] getAlbums failed:', err);
    return [];
  }
}

// ─── Per-photo info (for <FlickrPhoto> embeds in journal posts) ──────────
//
// Two API calls per photo (getInfo + getSizes), then we cache the merged
// result. Cache lives in node_modules/.cache so it's outside the repo and
// dies with `node_modules`.

interface PhotoInfoResponse {
  stat: string;
  photo?: {
    id: string;
    title: { _content: string };
    description: { _content: string };
    owner: { nsid: string };
    urls?: { url: Array<{ type: string; _content: string }> };
  };
  message?: string;
}

interface PhotoSizesResponse {
  stat: string;
  sizes?: { size: Array<{ label: string; source: string; width: number; height: number }> };
  message?: string;
}

type Cache = Record<string, FlickrPhotoInfo | null>;
let cacheMemo: Cache | null = null;

async function loadCache(): Promise<Cache> {
  if (cacheMemo) return cacheMemo;
  try {
    const raw = await readFile(CACHE_PATH, 'utf8');
    cacheMemo = JSON.parse(raw) as Cache;
  } catch {
    cacheMemo = {};
  }
  return cacheMemo;
}

async function saveCache(cache: Cache): Promise<void> {
  try {
    await mkdir(dirname(CACHE_PATH), { recursive: true });
    await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    console.warn('[flickr] could not write cache:', err);
  }
}

/**
 * Look up a single Flickr photo by ID. Returns null if the photo can't be
 * fetched (missing env vars, network error, deleted photo, private photo).
 * Build-time only — never call from the browser.
 *
 * Results are cached in node_modules/.cache/kilujo-flickr.json so subsequent
 * builds don't re-hit the API. Delete that file to refresh.
 */
export async function getPhotoInfo(id: string): Promise<FlickrPhotoInfo | null> {
  if (!id) return null;
  const cache = await loadCache();
  if (Object.prototype.hasOwnProperty.call(cache, id)) return cache[id];

  if (!API_KEY || !USER_ID) {
    console.warn(`[flickr] cannot fetch photo ${id}: FLICKR_API_KEY or FLICKR_USER_ID not set`);
    return null;
  }

  try {
    const [info, sizes] = await Promise.all([
      callFlickr<PhotoInfoResponse>('flickr.photos.getInfo', { photo_id: id }),
      callFlickr<PhotoSizesResponse>('flickr.photos.getSizes', { photo_id: id }),
    ]);

    if (info.stat !== 'ok' || !info.photo) {
      console.warn(`[flickr] photo ${id} info non-ok:`, info.message ?? info.stat);
      cache[id] = null;
      await saveCache(cache);
      return null;
    }
    if (sizes.stat !== 'ok' || !sizes.sizes) {
      console.warn(`[flickr] photo ${id} sizes non-ok:`, sizes.message ?? sizes.stat);
      cache[id] = null;
      await saveCache(cache);
      return null;
    }

    const sizeBy = (label: string) => sizes.sizes!.size.find((s) => s.label === label);
    const large = sizeBy('Large') ?? sizeBy('Medium 800') ?? sizeBy('Medium');
    const large1600 = sizeBy('Large 1600');
    const original = sizeBy('Original');
    const pageUrl = info.photo.urls?.url?.find((u) => u.type === 'photopage')?._content
      ?? `https://www.flickr.com/photos/${info.photo.owner.nsid}/${id}/`;

    if (!large) {
      console.warn(`[flickr] photo ${id} has no usable size`);
      cache[id] = null;
      await saveCache(cache);
      return null;
    }

    const out: FlickrPhotoInfo = {
      id,
      title: info.photo.title._content || 'Untitled',
      description: info.photo.description._content || '',
      pageUrl,
      largeUrl: large.source,
      large1600Url: large1600?.source,
      originalUrl: original?.source,
      width: large.width,
      height: large.height,
    };

    cache[id] = out;
    await saveCache(cache);
    return out;
  } catch (err) {
    console.warn(`[flickr] getPhotoInfo(${id}) failed:`, err);
    return null;
  }
}

export async function getAlbumPhotos(albumId: string): Promise<FlickrPhoto[]> {
  try {
    const data = await callFlickr<PhotosResponse>('flickr.photosets.getPhotos', {
      user_id: USER_ID,
      photoset_id: albumId,
      extras: 'url_m,url_z,url_b',
      per_page: '500',
    });
    if (data.stat !== 'ok' || !data.photoset) {
      console.warn('[flickr] getPhotos non-ok:', data.message ?? data.stat);
      return [];
    }
    return data.photoset.photo.map((p) => ({
      id: p.id,
      title: p.title || 'Untitled',
      thumbUrl: staticUrl(p, 'z'),
      largeUrl: staticUrl(p, 'b'),
      pageUrl: pageUrl(p.id, albumId),
      width: p.width_m ? Number(p.width_m) : undefined,
      height: p.height_m ? Number(p.height_m) : undefined,
    }));
  } catch (err) {
    console.warn('[flickr] getAlbumPhotos failed:', err);
    return [];
  }
}

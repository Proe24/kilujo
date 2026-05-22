// Build-time Flickr fetcher. Used by /photos and /photos/[albumId].
//
// Auth: API key is enough for public photos. We never call from the browser —
// these helpers are only invoked from Astro frontmatter at build time, so the
// key stays in the build environment.

const ENDPOINT = 'https://api.flickr.com/services/rest/';

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

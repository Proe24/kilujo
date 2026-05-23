# Adding photos to a journal post

There are two ways to put a photo into a post. Pick the one that fits the photo — you can mix and match in the same post.

> **Rule of thumb**
> - **Phone snap?** → Path A (upload to the site)
> - **Real camera shot, or a photo-focused post?** → Path B (Flickr)

---

## Path A — Upload to the site (for casual photos)

Use this for quick phone photos that you just want to drop into a post inline. Each photo gets shrunk first and then committed to the website's repo.

### Why we shrink first

The CMS can only upload files smaller than about **4 MB** per file — that's a limit from Vercel, not something we can change. Phone photos are usually 6–12 MB, so the upload will fail without shrinking.

### Steps

1. **Open the shrinker.**
   Go to **[kilujo.com/tools/shrink-photo](https://kilujo.com/tools/shrink-photo)**
   *(Screenshot: the shrink-photo page with a drop area in the middle.)*

2. **Drop one or more photos onto the page.**
   Or click the box to pick from the file picker. The page resizes each one to **2000 px on the longest side** and saves it as JPEG at 85% quality. Location data (EXIF GPS) is stripped automatically.
   *(Screenshot: after dropping a photo, a row appears showing "5.4 MB → 580 KB".)*

3. **Click "Save" on each photo (or "Save all").**
   The shrunk version downloads to your computer.

4. **Open Pages CMS** at [app.pagescms.org](https://app.pagescms.org/) → kilujo → **Journal** → edit a post.

5. **Drag the shrunk file into the "Gallery" field** (or the "Cover image" field if it's the lead photo).

6. **Save.** Done.

### iPhone HEIC photos?

The shrinker can't read HEIC files. Two options:

- **Use [Squoosh.app](https://squoosh.app) instead.** Squoosh handles HEIC and also runs entirely in your browser — nothing is uploaded anywhere. Drop the photo in, choose **MozJPEG** on the right side, set quality to 85, resize to 2000 px, and download.
- **Or change your iPhone setting** so it shoots JPEG by default: *Settings → Camera → Formats → Most Compatible.* New photos taken after this will be JPEG and work with the kilujo shrinker.

---

## Path B — Flickr embed (for full-quality photos)

Use this when the photo is the point of the post — a real camera shot, a portrait, anything you'd want viewers to see at full resolution.

Photos stay on Flickr (free, unlimited storage on your account). The site fetches them from Flickr each time it rebuilds.

### Steps

1. **Upload the photo to Flickr.**
   Go to your account at flickr.com → **Upload**. Drop the photo in. Set the title — that becomes the alt text on the website if you don't write a custom caption.
   *(Screenshot: Flickr's upload page with one photo queued.)*

2. **Grab the photo's ID.**
   Once it's uploaded, click the photo. Look at the URL bar:
   `https://www.flickr.com/photos/yourname/`**`54321678901`**`/`
   The bolded number is the **photo ID**. Copy just that part.

3. **Open Pages CMS** → kilujo → **Journal** → edit (or create) a post.

4. **Scroll down to the "Flickr photos" field.**
   Click **Add** to create a new entry. Three fields:
   - **Flickr photo ID** — paste the number you copied.
   - **Caption** *(optional)* — what shows under the photo on the site. If blank, the photo's Flickr title is used.
   - **Display size** — **Large (~1024px)** is right for most posts. Use **Large 1600** only for hero shots that really need the extra detail.

5. **Save the post.**
   The next site rebuild (a minute or two) will fetch the photo from Flickr and render it in the post.

### Adding more than one

Each entry in the **Flickr photos** list becomes one big photo in the post, in the order they appear. To rearrange, drag the rows in the CMS. To add more, click **Add** again.

---

## What if a Flickr photo gets deleted?

Nothing breaks. The website will show a small dashed-border placeholder where the photo used to be, with a note like "(Flickr photo 54321 unavailable)". The rest of the post is unaffected.

If you see one of these placeholders, either:
- **Re-upload the photo** to Flickr (you'll get a new ID — paste that into the same CMS field), or
- **Delete the entry** from the Flickr photos list in the CMS.

---

## Mixing both in one post

A single post can use both paths. Common pattern:

- A few inline phone snaps in the **Gallery** field (Path A) — these render as a small responsive grid at the bottom of the post.
- One or two full-quality Flickr shots in the **Flickr photos** field (Path B) — these render as large figures with captions, above the gallery.

The Flickr photos appear **between the body text and the small gallery**, so the order on the page is:

1. Cover photo
2. Body / words
3. Flickr photos (big, with captions)
4. Gallery (small, square thumbs)

---

## When something goes wrong

- **The CMS says "upload failed" or hangs.** The file is probably too big. Run it through the shrinker first.
- **A Flickr photo isn't appearing.** Confirm you pasted just the numeric ID, not the whole URL. Also check the photo isn't set to **Private** on Flickr — the site can only fetch public photos.
- **The shrinker says "Unsupported format."** It's a HEIC file (or another exotic format). Use Squoosh.app, or change your iPhone setting (above).
- **Anything else.** Ask Stephen.

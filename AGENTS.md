# subooru

Proxy booru client for Gelbooru — Express backend + React (Vite) frontend.

## Dev commands

```sh
# Root (Express server)
node server/index.js          # serves API + built client on :3000

# Client (separate terminal)
cd client && yarn dev          # Vite dev server on :5173, proxies /api -> :3000
cd client && yarn build        # output -> client/dist/
```

Production: `yarn build && node server/index.js` — Express serves both.

## Architecture

- **No caching server, no database, no auth** — settings/favorites/blacklist in localStorage
- **FullscreenView proxies media through the server** (`/api/media?url=...`) with `Referer: https://gelbooru.com/` to bypass CDN hotlink protection. Grid thumbnails are still loaded directly (no hotlink protection on `gelbooru.com/thumbnails/`).
- Bootstrap 5 + Tailwind CSS for layout; minimal custom CSS (`App.css`)

## Backend (`server/`)

| Route | Gelbooru mapping |
|---|---|
| `GET /api/posts?page=&q=` | `dapi&s=post&q=index&json=1` (100 per page) |
| `GET /api/tags?t=` | `dapi&s=tag&q=index&json=1` |
| `GET /api/tags/search?q=` | `autocomplete2&term=` |
| `GET /api/media?url=` | Proxies CDN media with `Referer: https://gelbooru.com/` |

Gelbooru tag type mapping: `0=general, 1=artist, 3=copyright, 4=character, 5=metadata, 6=deprecated`.

Gelbooru uses 0-indexed pages; the proxy exposes 1-indexed. Max page is 200 (Gelbooru limit).

**`.env`** — `GELBOORU_USER_ID`, `GELBOORU_API_KEY`, `HOST`, `PORT`. Credentials required for dapi endpoints (posts, tags). Autocomplete2 works without auth.

Post field mapping in `server/gelbooru.js`:
- `file_url` → `image_url` (with `video-cdn3` → `video-cdn4` rewrite)
- `sample_url` → `sample_url`
- `preview_url` → `thumbnail_url`

## Frontend (`client/`)

### Components
- `Sidebar.jsx` — tag search input, autocomplete dropdown, active tag chips, settings, blacklist
- `PostGrid.jsx` — dynamic masonry layout (ResizeObserver, auto-columns based on `columnWidth` setting)
- `PostCard.jsx` — thumbnail with fallback chain (`thumbnail_url` → `sample_url` → `image_url`), video play icon overlay, fav/blacklist buttons
- `FullscreenView.jsx` — overlay viewer with fallback chain (`image_url` → `sample_url` → `thumbnail_url`), escape to close
- `Pagination.jsx` — prev/next with page info
- `FavoritesModal.jsx` — Bootstrap modal with saved posts grid

### Key gotchas
- PostCard and FullscreenView cycle through fallback URLs on `onError`. Media elements have `referrerPolicy="no-referrer"`.
- SearchPage parses URL params directly (`useMemo`) for search, not React state — avoids stale closure on initial navigation.
- Video detection: regex `/\.(mp4|webm|mov)$/i` on `post.image_url`. PostCard shows thumbnail + play icon overlay. FullscreenView renders `<video>` with `poster` attribute for preview, no fallback to thumbnail on error.
- Image fallback chain (`FullscreenView`): `image_url` → `sample_url` → `thumbnail_url`. Videos use only `image_url` — if it fails, `Failed to load media` is shown (matching booruview behavior).
- Gelbooru's `preview_url` is always a static image even for videos — used as `poster` attribute on `<video>` elements.

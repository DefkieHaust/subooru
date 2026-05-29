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

- **In-memory or Redis caching** — Gelbooru API responses cached with per-endpoint TTL from `conf.json.server.cache.endpoints`. Falls back to in-memory Map if `REDIS_URL` is unset.
- **Per-IP rate limiting** — Applied per-route via `express-rate-limit`, backed by Redis (or memory). Config in `conf.json.server.rate_limit`.
- **No accounts, no database** — settings/favorites/blacklist in localStorage.
- **Media proxy** — `/api/media` streams from Gelbooru CDN with `Referer: https://gelbooru.com/`. Client can optionally use a Cloudflare Worker (set via `conf.json.client.worker_base`) with server fallback.

## Backend (`server/`)

| Route | Gelbooru mapping | Rate limit (default) |
|---|---|---|
| `GET /api/posts?page=&q=` | `dapi&s=post&q=index&json=1` (100 per page) | 30/min |
| `GET /api/tags?t=` | `dapi&s=tag&q=index&json=1` | 15/min |
| `GET /api/tags/search?q=` | `autocomplete2&term=` | 30/min |
| `GET /api/media?url=` | Proxies CDN media with `Referer: https://gelbooru.com/` | 60/min |
| `GET /api/config` | Returns client config from conf.json | 10/min |

Gelbooru API calls are cached in Redis (or in-memory if `REDIS_URL` unset) with per-endpoint TTL from `conf.json.server.cache`.

**`.env`** — `GELBOORU_USER_ID`, `GELBOORU_API_KEY`, `HOST`, `PORT`, `REDIS_URL` (optional). Credentials required for dapi endpoints (posts, tags). Autocomplete2 works without auth.

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

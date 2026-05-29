# subooru

Proxy booru client for Gelbooru — Express backend + React (Vite) frontend.

## Dev commands

```sh
# Terminal 1 — Express server (API + built client on :3000)
node server/index.js

# Terminal 2 — Vite dev server (hot reload on :5173, proxies /api -> :3000)
cd client && yarn dev

# Production build
cd client && yarn build && cd .. && node server/index.js
```

No test, lint, or typecheck tooling exists. Node 22+ required.

## Key gotchas

### Config & env
- `conf.json` — read once at startup via `readFileSync`. Server **must restart** for changes.
- `dotenv/config` loaded at top of `server/index.js` — `.env` for local dev, `.env.prod` for Docker.
- Both `conf.json` and `.env*` are gitignored (`.env.example` and `.env.prod.example` exceptions tracked).
- S3 env vars (`S3_*`) go in `.env`/`.env.prod`, not `conf.json`.
- Gelbooru API credentials required for `dapi` endpoints (posts, tags); autocomplete2 works without auth.

### Rate limiting
- `tags_search` must NOT have a separate `app.use('/api/tags/search', ...)` limiter. Express prefix-mounts `/api/tags` and `/api/tags/search` — same request hits both, causing `ERR_ERL_DOUBLE_COUNT`. Single `/api/tags` limiter covers both routes.
- Redis store uses slot-based INCR + PEXPIRE. Falls back to `express-rate-limit` memory store if `REDIS_URL` unset.

### Logging (pino v10)
- `transport.targets` array mode **silently drops debug messages** regardless of top-level `level`. Use `pino.transport({ targets: [...] })` function API with `level` on each target.
- `getLogger()` function (not a proxy/wrapper) returns current `_instance` — avoids stale reference across ES module boundaries.

### Server-side include/blacklist
- `conf.json.server.include` — tags silently appended (prepended) to every Gelbooru query in `posts.js:21`.
- `conf.json.server.blacklist` — tags silently excluded as `-tag` entries; strips `-` and `~` prefixes before matching in `posts.js:17`.

### Client-side include/blacklist toggles
- `conf.json.client.include` — tags prepended to search URL when "Default tags" setting is ON (visible as chips, removable).
- `conf.json.client.blacklist` — merged into `settings.blacklist` when "Default blacklist" setting is ON.
- Both settings default to `true`; toggling OFF does not remove existing tags.

### Media proxy
- Gelbooru CDN (`.gelbooru.com`) requires `Referer: https://gelbooru.com/` — enforced in `media.js:28` and the Cloudflare Worker.
- `wsrv.nl` blocks gelbooru.com by policy — unusable.
- Fallback chain: Worker URL -> `/api/media` (if `client.server_proxy` is true). Controlled by `setProxyConfig()` and `mediaProxyUrls()` in `api.js`.
- `/api/media` returns `503` when `conf.json.server.server_proxy` is `false`.

### S3 media cache
- Key: `media/{md5[0..2]}/{md5[2..4]}/{md5}` (MD5 of URL).
- `response.body.tee()` splits Web ReadableStream — one to client, one to S3 (fire-and-forget `putObject`).
- Auto-creates bucket + sets lifecycle rule on init. Silently disabled if `S3_*` env vars are missing.
- TTL managed by S3 lifecycle (`Expiration.Days`), not app config.

### Frontend quirks
- Gelbooru `preview_url` is always a static image, even for videos — used as `<video poster>`.
- Video detection: `/\.(mp4|webm|mov)$/i` on `post.image_url`.
- Post field mapping in `gelbooru.js`: `file_url` -> `image_url` (with `video-cdn3` -> `video-cdn4` rewrite), `sample_url` -> `sample_url`, `preview_url` -> `thumbnail_url`.
- autocomplete2 returns `category` as string (`"tag"`, `"artist"`, etc.), not number.
- Page max is 200 (hard Gelbooru limit).
- FullscreenView `z-index: 1060` (above Bootstrap modal at 1055).
- `dvh` unit accounts for mobile browser chrome.
- SearchPage parses URL params via `useMemo` (not state) — avoids stale closure on initial nav.

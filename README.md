# subooru

Proxy booru client for [Gelbooru](https://gelbooru.com/) — Express backend + React (Vite) frontend. Features configurable API caching, rate limiting, and S3-backed media proxy.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Yarn](https://yarnpkg.com/) 1.x
- (Optional) [Docker](https://docker.com/) + [Docker Compose](https://docs.docker.com/compose/) for deployment
- (Optional) A Gelbooru account for API credentials (required for `dapi` endpoints)

## Quick Start

### 1. Configuration

```sh
cp conf.json.example conf.json        # edit with your preferences
cp .env.example .env                  # add API keys
```

**`conf.json`** — all settings in one file (gitignored). See [Configuration reference](#configuration-reference) below.

**`.env`** — secrets and deployment-specific values:

| Variable | Required | Default | Description |
|---|---|---|---|
| `GELBOORU_USER_ID` | Yes (for dapi) | — | Gelbooru account ID |
| `GELBOORU_API_KEY` | Yes (for dapi) | — | Gelbooru API key |
| `HOST` | No | `0.0.0.0` | Server bind address |
| `PORT` | No | `3000` | Server port |
| `REDIS_URL` | No | — | Redis connection string (`redis://...`). Falls back to in-memory cache/rate-limiting if unset |
| `S3_ENDPOINT`, `S3_PORT`, etc. | No | — | See [S3 media cache](#s3-media-cache) |

### 2. Run

**Development** (two terminals):

```sh
# Terminal 1 — Express server (serves API on :3000)
node server/index.js

# Terminal 2 — Vite dev server (hot reload on :5173, proxies /api to :3000)
cd client && yarn dev
```

**Production** (local):

```sh
cd client && yarn build && cd ..
node server/index.js
```

Express serves both the API and the built client from `client/dist/`.

## Docker Deployment

### 1. Configuration

```sh
cp conf.json.example conf.json              # edit with your preferences
cp .env.prod.example .env.prod              # add API keys
```

`.env.prod` uses Docker service hostnames (`redis://redis:6379`, `S3_ENDPOINT=minio`) that match the services in `compose.yml`. See [Environment files](#environment-files) for details.

### 2. Start

```sh
docker compose up -d
```

This starts three containers:

| Service | Image | Purpose |
|---|---|---|
| `app` | (builds from `Dockerfile`) | Express server + built frontend, exposed on port `3000` |
| `redis` | `redis:7-alpine` | API cache and rate-limiting backend, data persisted in `redis-data` volume |
| `minio` | `minio/minio` | S3-compatible media cache, data persisted in `minio-data` volume |

On first startup, the app auto-creates the S3 bucket (`subooru-media` by default) and sets a lifecycle rule to expire objects after `max_age_days` (configured in `conf.json`).

### 3. Update

```sh
docker compose build --pull   # rebuild with latest base images
docker compose up -d          # restart
```

### 4. Stop

```sh
docker compose down           # stops containers, preserves volumes
docker compose down -v        # stops and deletes volumes (cache wiped)
```

---

## Environment Files

Two environment files serve different purposes:

| File | Tracked | Used by | Purpose |
|---|---|---|---|
| `.env.example` | Yes | Reference | Template for local development |
| `.env` | **No** (gitignored) | `node server/index.js` | Local dev — uses `localhost` service addresses |
| `.env.prod.example` | Yes | Reference | Template for Docker deployment |
| `.env.prod` | **No** (gitignored) | `docker compose up` | Docker — uses Docker service names (`redis`, `minio`) |

### `.env` (local dev)

```
GELBOORU_USER_ID=12345
GELBOORU_API_KEY=your-api-key
HOST=0.0.0.0
PORT=3000

# Optional — Redis (local or remote)
REDIS_URL=redis://localhost:6379

# Optional — S3-compatible storage (MinIO, AWS S3, etc.)
S3_ENDPOINT=localhost
S3_PORT=9000
S3_USE_SSL=false
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=subooru-media
```

### `.env.prod` (Docker)

```
GELBOORU_USER_ID=12345
GELBOORU_API_KEY=your-api-key
REDIS_URL=redis://redis:6379
S3_ENDPOINT=minio
S3_PORT=9000
S3_USE_SSL=false
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=subooru-media
```

The only difference from `.env` is the service hostnames — `redis` and `minio` instead of `localhost`. Gelbooru credentials are the same. If you're using AWS S3 or another provider, set `S3_ENDPOINT` to your provider's endpoint.

---

## Configuration Reference

All configuration lives in `conf.json` (gitignored). `conf.json.example` is the reference template.

### `log`

```json
"log": {
  "level": "info",
  "console": true,
  "file": "logs/subooru.log"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `level` | string | `"info"` | Pino log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal` |
| `console` | boolean | `true` | Log to stdout (pino-pretty formatted) |
| `file` | string | — | Path to log file. Omit or set `null` to disable file logging |

### `server.rate_limit`

```json
"rate_limit": {
  "enabled": true,
  "window_ms": 60000,
  "endpoints": {
    "posts": 30,
    "tags": 15,
    "media": 60,
    "config": 10
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Set `false` to disable all rate limiting |
| `window_ms` | number | `60000` | Rate limit window in milliseconds |
| `endpoints.*` | number | — | Max requests per `window_ms` per IP for each route |

### `server.cache`

```json
"cache": {
  "enabled": true,
  "default_ttl_ms": 300000,
  "endpoints": {
    "posts": 300000,
    "tags": 3600000,
    "tags_search": 3600000
  }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Set `false` to disable API response caching |
| `default_ttl_ms` | number | `300000` | Default TTL (5 min) for endpoints not listed in `endpoints` |
| `endpoints.*` | number | — | Per-endpoint TTL in milliseconds |

Backend: Redis if `REDIS_URL` is set, otherwise in-memory `Map`.

### `server.media_cache`

```json
"media_cache": {
  "enabled": true,
  "max_age_days": 1
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Set `false` to disable S3 media caching (always fetches from Gelbooru) |
| `max_age_days` | number | `1` | S3 lifecycle expiration in days. Set `0` to disable auto-expiry. Objects are deleted by MinIO/S3 after this many days |

S3 credentials (`S3_ENDPOINT`, `S3_ACCESS_KEY`, etc.) are set in `.env` / `.env.prod`, not in `conf.json`. If env vars are missing, the cache logs a warning and media is always fetched directly from Gelbooru.

### `server.server_proxy`

```json
"server_proxy": true
```

Controls the `/api/media` endpoint. When `false`, the route returns `503 Service Unavailable`. The separate `client.server_proxy` flag (returned via `/api/config`) controls the frontend's media fallback chain.

### `server.include`, `server.blacklist`

```json
"include": ["rating:safe"],
"blacklist": ["guro", "scat"]
```

- `include` — tags silently appended to every Gelbooru query (server-side, client cannot circumvent)
- `blacklist` — tags silently excluded from results (server-side, strips `-` and `~` prefixes before matching)

### `server.metatags`

```json
"metatags": [
  { "prefix": "rating:", "tags": ["rating:general", "rating:safe", "rating:questionable", "rating:explicit"] },
  { "prefix": "sort:", "tags": ["sort:random", "sort:score", "sort:mpixels", ...] },
  { "prefix": "score:", "tags": ["score:>=100", "score:>50", ...] }
]
```

Autocomplete suggestions for prefix-based tags. When the user types `rating:`, the dropdown shows the listed options.

### `client`

```json
"client": {
  "blacklist": [],
  "worker_base": null,
  "server_proxy": true
}
```

| Field | Type | Description |
|---|---|---|
| `blacklist` | string[] | Client-side tag blacklist (applied in addition to server blacklist) |
| `worker_base` | string \| null | Cloudflare Worker URL for media proxying. `null` disables worker |
| `server_proxy` | boolean | Tells the frontend whether to fall back to `/api/media` when the worker fails |

These values are returned to the frontend via `GET /api/config`.

---

## API Routes

| Route | Description | Rate limit (default) |
|---|---|---|
| `GET /api/posts?page=&q=` | Search posts (100 per page) | 30/min |
| `GET /api/tags?t=` | Lookup tags by name | 15/min |
| `GET /api/tags/search?q=` | Autocomplete tags | 30/min |
| `GET /api/media?url=` | Proxy media from Gelbooru CDN (with S3 caching) | 60/min |
| `GET /api/config` | Returns client-side config | 10/min |
| `GET /api/version` | Returns `{ "version": "0.1.0" }` | — |

Gelbooru API responses (`posts`, `tags`) are cached in Redis/memory per `server.cache`. Media files are cached in S3 per `server.media_cache`.

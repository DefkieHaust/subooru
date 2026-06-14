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
- `conf.yml` — read once at startup via `readFileSync`. Server **must restart** for changes.
- `dotenv/config` loaded at top of `server/index.js` — `.env` for local dev, `.env.prod` for Docker.
- Both `conf.yml` and `.env*` are gitignored (`.env.example` and `.env.prod.example` exceptions tracked).
- S3 env vars (`S3_*`) go in `.env`/`.env.prod`, not `conf.yml`.
- Gelbooru API credentials required for `dapi` endpoints (posts, tags); autocomplete2 works without auth.

### Rate limiting
- `tags_search` must NOT have a separate `app.use('/api/tags/search', ...)` limiter. Express prefix-mounts `/api/tags` and `/api/tags/search` — same request hits both, causing `ERR_ERL_DOUBLE_COUNT`. Single `/api/tags` limiter covers both routes.
- Redis store uses slot-based INCR + PEXPIRE. Falls back to `express-rate-limit` memory store if `REDIS_URL` unset.

### Logging (pino v10)
- `transport.targets` array mode **silently drops debug messages** regardless of top-level `level`. Use `pino.transport({ targets: [...] })` function API with `level` on each target.
- `getLogger()` function (not a proxy/wrapper) returns current `_instance` — avoids stale reference across ES module boundaries.

### Server-side include/blacklist
- `conf.yml.server.include` — tags silently appended (prepended) to every Gelbooru query in `posts.js:21`.
- `conf.yml.server.blacklist` — tags silently excluded as `-tag` entries; strips `-` and `~` prefixes before matching in `posts.js:17`.

### Client-side include/blacklist toggles
- `conf.yml.client.include` — tags prepended to search URL when "Default tags" setting is ON (visible as chips, removable).
- `conf.yml.client.blacklist` — merged into `settings.blacklist` when "Default blacklist" setting is ON.
- Both settings default to `true`; toggling OFF does not remove existing tags.

### Media proxy
- Gelbooru CDN (`.gelbooru.com`) requires `Referer: https://gelbooru.com/` — enforced in `media.js:28` and the Cloudflare Worker.
- `wsrv.nl` blocks gelbooru.com by policy — unusable.
- Fallback chain: Worker URL -> `/api/media` (if `client.server_proxy` is true). Controlled by `setProxyConfig()` and `mediaProxyUrls()` in `api.js`.
- `/api/media` returns `503` when `conf.yml.server.server_proxy` is `false`.

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
- SearchPage Effect B (`useEffect` that runs search) must include `pageParam` in its dependency array. If excluded, navigating from `/` to `/search/1/` (empty search) leaves `queryParam` and `currentPage` unchanged, so the effect is skipped and no API call is made — infinite spinner.

# CRITICAL RULES - MUST FOLLOW

## RESPONSES

- Keep responses concise and to the point - unless the user asks otherwise

## PLANNING MODE

- Always ask clarifying questions
- Never assume design, tech stack or features
- Use deep-dive sub-agents to assist with research
- Use deep-dive sub-agents to review the different aspects of your plan before presenting to the user

## CHANGE / EDIT MODE

- Never implement features yourself when possible - use sub-agents!
- Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features efficiently
- When using sub-agents to implement features, act as a coordinator only
- Use the best model for the task - premium models for complex tasks (like coding) and mid-tier models for simpler tasks, like documentation
- After completing features (large or small), always run commands like lint, type check and next build to check code quality

## TESTING

- Use any testing tools, libraries available to the project for testing your changes
- Never assume your changes simply work, always test!
- If the project does not have any testing tools, scripts, MCP tools, skills, etc. available for testing, ask the user whether testing should be skipped.

## UI DESIGN

- Always follow the UI design system when creating or reviewing components or pages.
- Design System: @DESIGN.md

## Documentation

- Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.
- If changes are made to the project configuration or deployment then properly document them in @README.md

## Danbooru API support

### Source selection
- `conf.yml.server.sources` — ordered array `["gelbooru", "danbooru"]`. First entry is primary; subsequent entries are fallbacks in order. Remove entries to disable sources.
- Client setting in sidebar → localStorage → passed as `?source=` query param on every API call.
- Both sources share the same `include`/`blacklist` config.

### Fallback mechanism
- `server/source-fallback.js` provides `withSourceFallback(primarySource, fetchFn)`.
- If the targeted source returns a non-2xx status or throws, the other source is tried automatically.
- The response includes a `source` field indicating which source actually served the data.

### Danbooru client (`server/danbooru.js`)
- Mirrors `gelbooru.js` exports: `listPosts`, `listTags`, `searchTags`.
- API base: `https://danbooru.donmai.us`.
- Auth: HTTP Basic via `DANBOORU_USERNAME`/`DANBOORU_API_KEY` env vars (optional).
- Field mapping documented inline and in the `feat/danbooru` PR description.

### Key differences from Gelbooru
| Aspect | Gelbooru | Danbooru |
|---|---|---|
| API endpoint | `index.php?page=dapi&s=post&q=index&json=1` | `/posts.json` |
| Post list response | `{ "@attributes": { count }, "post": [...] }` | `[...]` JSON array + `X-Total-Count` header |
| Tag autocomplete | `page=autocomplete2&term=...` | `/autocomplete.json?search[query]=...` |
| Auth method | URL params (`user_id` + `api_key`) | HTTP Basic (`username` + `api_key`) |
| HTML entities in tags | Yes (`&amp;`, `&gt;`, etc.) | No |
| CDN rewrite needed | `video-cdn3` → `video-cdn4` | No |
| Media Referer | `https://gelbooru.com/` | `https://danbooru.donmai.us/` |

### Backward compatibility
- `?source=gelbooru` is the default when param is omitted.
- New `source` field in responses is ignored by old clients.
- All existing routes, config keys, and env vars remain unchanged.
- `DANBOORU_USERNAME`/`DANBOORU_API_KEY` are optional.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

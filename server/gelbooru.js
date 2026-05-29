import { cacheGet, cacheSet } from './cache.js'
import { logger } from './logger.js'

const GELBOORU_API = 'https://gelbooru.com/index.php'

const TAG_TYPE_MAP = {
  0: 'general',
  1: 'artist',
  3: 'copyright',
  4: 'character',
  5: 'metadata',
  6: 'deprecated'
}

let _cacheConf = { enabled: true }

export function initGelbooruClient(cacheConf) {
  _cacheConf = cacheConf || _cacheConf
}

function endpointForParams(params) {
  if (params.s === 'post') return 'posts'
  if (params.s === 'tag') return 'tags'
  if (params.page === 'autocomplete2') return 'tags_search'
  return 'default'
}

export async function fetchGelbooru(params) {
  const cacheKey = JSON.stringify(Object.entries(params).sort())
  const endpoint = endpointForParams(params)

  if (_cacheConf.enabled !== false) {
    const ttl = _cacheConf.endpoints?.[endpoint] || _cacheConf.default_ttl_ms
    if (ttl) {
      const cached = await cacheGet(cacheKey)
      if (cached) {
        logger.debug({ endpoint, cache: 'hit' }, `CACHE HIT — ${endpoint}`)
        return cached
      }
      logger.debug({ endpoint, cache: 'miss' }, `CACHE MISS — ${endpoint}`)
    }
  }

  const query = new URLSearchParams(params)
  if (process.env.GELBOORU_USER_ID && process.env.GELBOORU_API_KEY) {
    query.set('user_id', process.env.GELBOORU_USER_ID)
    query.set('api_key', process.env.GELBOORU_API_KEY)
  }
  const url = `${GELBOORU_API}?${query}`
  const res = await fetch(url)
  if (!res.ok) {
    logger.error({ endpoint, status: res.status }, `Gelbooru API error — ${endpoint}`)
    throw new Error(`Gelbooru API error: ${res.status}`)
  }
  const data = await res.json()
  logger.info({ endpoint }, `FETCHED — ${endpoint}`)

  if (_cacheConf.enabled !== false) {
    const ttl = _cacheConf.endpoints?.[endpoint] || _cacheConf.default_ttl_ms
    if (ttl) {
      cacheSet(cacheKey, data, ttl).catch(() => {})
    }
  }

  return data
}

export async function listPosts(tags, page) {
  const data = await fetchGelbooru({
    page: 'dapi',
    s: 'post',
    q: 'index',
    json: '1',
    limit: '100',
    tags,
    pid: String(page - 1)
  })

  const posts = (data.post || []).map(p => ({
    id: p.id,
    created_at: p.created_at,
    score: p.score,
    rating: p.rating,
    source_url: p.source,
    uploader: p.owner,
    uploader_id: p.creator_id,
    tags: (p.tags || '').split(' ').map(t => t.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#039;/g, "'")),
    thumbnail_url: p.preview_url,
    thumbnail_width: p.preview_width,
    thumbnail_height: p.preview_height,
    sample_url: p.sample_url,
    sample_width: p.sample_width,
    sample_height: p.sample_height,
    image_url: p.file_url?.replace('video-cdn3.gelbooru.com', 'video-cdn4.gelbooru.com'),
    width: p.width,
    height: p.height
  }))

  return {
    count_per_page: 100,
    total_count: data['@attributes']?.count || 0,
    results: posts
  }
}

export async function listTags(names) {
  const data = await fetchGelbooru({
    page: 'dapi',
    s: 'tag',
    q: 'index',
    json: '1',
    names
  })

  return (data.tag || []).filter(t => t.name).map(t => ({
    name: t.name.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
    type: TAG_TYPE_MAP[t.type] || 'unknown',
    count: t.count
  }))
}

export async function searchTags(query, metatags = []) {
  const data = await fetchGelbooru({
    page: 'autocomplete2',
    term: query
  })

  const results = (data || []).map(t => ({
    name: t.value,
    type: t.category === 'tag' ? 'general' : t.category,
    count: parseInt(t.post_count, 10) || 0
  }))

  const lower = query.toLowerCase()
  for (const { prefix, tags } of metatags) {
    if (lower.startsWith(prefix)) {
      const suffix = lower.slice(prefix.length)
      for (const tag of tags) {
        if (tag.toLowerCase().includes(suffix)) {
          results.push({ name: tag, type: 'metadata', count: 0 })
        }
      }
    }
  }

  return results
}

import { cacheGet, cacheSet } from './cache.js'
import { getLogger } from './logger.js'

const DANBOORU_API = 'https://danbooru.donmai.us'

const TAG_TYPE_MAP = {
  0: 'general',
  1: 'artist',
  3: 'copyright',
  4: 'character',
  5: 'metadata',
  6: 'deprecated'
}

let _cacheConf = { enabled: true }

export function initDanbooruClient(cacheConf) {
  _cacheConf = cacheConf || _cacheConf
}

function endpointForPathname(pathname) {
  if (pathname === '/posts.json') return 'posts'
  if (pathname === '/tags.json') return 'tags'
  if (pathname === '/autocomplete.json') return 'tags_search'
  return 'default'
}

function authHeaders() {
  const username = process.env.DANBOORU_USERNAME
  const apiKey = process.env.DANBOORU_API_KEY
  if (username && apiKey) {
    const encoded = Buffer.from(`${username}:${apiKey}`).toString('base64')
    return { Authorization: `Basic ${encoded}` }
  }
  return {}
}

export async function fetchDanbooru(pathname, params) {
  const cacheKey = JSON.stringify([pathname, Object.entries(params).sort()])
  const endpoint = endpointForPathname(pathname)

  if (_cacheConf.enabled !== false) {
    const ttl = _cacheConf.endpoints?.[endpoint] || _cacheConf.default_ttl_ms
    if (ttl) {
      const cached = await cacheGet(cacheKey)
      if (cached) {
        getLogger().debug({ endpoint, cache: 'hit' }, `CACHE HIT — ${endpoint}`)
        return { data: cached, headers: null }
      }
      getLogger().debug({ endpoint, cache: 'miss' }, `CACHE MISS — ${endpoint}`)
    }
  }

  const query = new URLSearchParams(params)
  const url = `${DANBOORU_API}${pathname}?${query}`
  const headers = {
    'User-Agent': 'subooru/0.1.0',
    ...authHeaders(),
    ...(pathname === '/autocomplete.json' ? { Accept: 'application/json' } : {})
  }
  const res = await fetch(url, { headers })
  if (!res.ok) {
    getLogger().error({ endpoint, status: res.status }, `Danbooru API error — ${endpoint}`)
    throw new Error(`Danbooru API error: ${res.status}`)
  }
  const data = await res.json()
  getLogger().info({ endpoint }, `FETCHED — ${endpoint}`)

  if (_cacheConf.enabled !== false) {
    const ttl = _cacheConf.endpoints?.[endpoint] || _cacheConf.default_ttl_ms
    if (ttl) {
      cacheSet(cacheKey, data, ttl).catch(() => {})
    }
  }

  return { data, headers: res.headers }
}

export async function listPosts(tags, page) {
  const allTags = tags.split(' ').filter(Boolean)
  const positiveTags = allTags.filter(t => !t.startsWith('-'))
  const excludeTags = allTags.filter(t => t.startsWith('-')).map(t => t.slice(1))

  const nonMetaTags = positiveTags.filter(t => !t.includes(':'))
  const queryTags = nonMetaTags.length > 2
    ? [...positiveTags.filter(t => t.includes(':')), ...nonMetaTags.slice(0, 2)]
    : positiveTags

  const { data } = await fetchDanbooru('/posts.json', {
    tags: queryTags.join(' '),
    ...(excludeTags.length ? { 'exclude_tags': excludeTags.join(',') } : {}),
    page: String(page),
    limit: '100'
  })

  const countTags = queryTags.join(' ')
  let totalCount
  try {
    const { data: countData } = await fetchDanbooru('/counts/posts.json', { tags: countTags })
    totalCount = countData?.counts?.posts
  } catch {}

  const posts = (data || []).map(p => ({
    id: p.id,
    created_at: p.created_at,
    score: p.score,
    rating: p.rating,
    source_url: p.source,
    uploader: p.uploader_name,
    tags: (p.tag_string || '').split(' '),
    thumbnail_url: p.preview_file_url,
    thumbnail_width: p.preview_file_width,
    thumbnail_height: p.preview_file_height,
    sample_url: p.large_file_url || '',
    sample_width: p.large_file_width,
    sample_height: p.large_file_height,
    image_url: p.file_url,
    width: p.image_width,
    height: p.image_height
  }))

  return {
    count_per_page: 100,
    total_count: totalCount ?? data.length,
    results: posts
  }
}

export async function listTags(names) {
  const { data } = await fetchDanbooru('/tags.json', {
    'search[name_matches]': names
  })

  return (data || []).filter(t => t.name).map(t => ({
    name: t.name,
    type: TAG_TYPE_MAP[t.category] || 'general',
    count: t.post_count || 0
  }))
}

export async function searchTags(query) {
  const { data } = await fetchDanbooru('/autocomplete.json', {
    'search[query]': query,
    'search[type]': 'tag'
  })

  return (data || []).map(t => ({
    name: t.value,
    type: TAG_TYPE_MAP[t.category] || 'general',
    count: t.post_count || 0
  }))
}

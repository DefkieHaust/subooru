let _redis = null
const memCache = new Map()

export function initCache(redis) {
  _redis = redis
}

export async function cacheGet(key) {
  if (_redis) {
    try {
      const val = await _redis.get(key)
      return val ? JSON.parse(val) : null
    } catch {
      return null
    }
  }
  const entry = memCache.get(key)
  if (!entry || Date.now() > entry.expires) {
    memCache.delete(key)
    return null
  }
  return entry.data
}

export async function cacheSet(key, data, ttl) {
  if (_redis) {
    try {
      await _redis.set(key, JSON.stringify(data), 'PX', ttl)
    } catch {}
    return
  }
  memCache.set(key, { data, expires: Date.now() + ttl })
}

import { getLogger } from './logger.js'

let _redis = null
const memCache = new Map()

export function initCache(redis) {
  _redis = redis
  getLogger().info({ backend: redis ? 'redis' : 'memory' }, 'Cache initialized')
}

export async function cacheGet(key) {
  const log = getLogger()
  if (_redis) {
    try {
      const val = await _redis.get(key)
      if (val) {
        log.debug({ key, backend: 'redis' }, 'CACHE HIT')
        return JSON.parse(val)
      }
      log.debug({ key, backend: 'redis' }, 'CACHE MISS')
      return null
    } catch {
      return null
    }
  }
  const entry = memCache.get(key)
  if (!entry || Date.now() > entry.expires) {
    memCache.delete(key)
    log.debug({ key, backend: 'memory' }, 'CACHE MISS')
    return null
  }
  log.debug({ key, backend: 'memory' }, 'CACHE HIT')
  return entry.data
}

export async function cacheSet(key, data, ttl) {
  const log = getLogger()
  if (_redis) {
    try {
      await _redis.set(key, JSON.stringify(data), 'PX', ttl)
      log.debug({ key, backend: 'redis', ttl }, 'CACHE SET')
    } catch {}
    return
  }
  memCache.set(key, { data, expires: Date.now() + ttl })
  log.debug({ key, backend: 'memory', ttl }, 'CACHE SET')
}

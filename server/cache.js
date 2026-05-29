import { logger } from './logger.js'

let _redis = null
const memCache = new Map()

export function initCache(redis) {
  _redis = redis
  logger.info({ backend: redis ? 'redis' : 'memory' }, 'Cache initialized')
}

export async function cacheGet(key) {
  if (_redis) {
    try {
      const val = await _redis.get(key)
      if (val) {
        logger.debug({ key, backend: 'redis' }, 'CACHE HIT')
        return JSON.parse(val)
      }
      logger.debug({ key, backend: 'redis' }, 'CACHE MISS')
      return null
    } catch {
      return null
    }
  }
  const entry = memCache.get(key)
  if (!entry || Date.now() > entry.expires) {
    memCache.delete(key)
    logger.debug({ key, backend: 'memory' }, 'CACHE MISS')
    return null
  }
  logger.debug({ key, backend: 'memory' }, 'CACHE HIT')
  return entry.data
}

export async function cacheSet(key, data, ttl) {
  if (_redis) {
    try {
      await _redis.set(key, JSON.stringify(data), 'PX', ttl)
      logger.debug({ key, backend: 'redis', ttl }, 'CACHE SET')
    } catch {}
    return
  }
  memCache.set(key, { data, expires: Date.now() + ttl })
  logger.debug({ key, backend: 'memory', ttl }, 'CACHE SET')
}

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

let cacheGet, cacheSet, initCache

beforeEach(async () => {
  const mod = await import('../cache.js')
  cacheGet = mod.cacheGet
  cacheSet = mod.cacheSet
  initCache = mod.initCache
  initCache(null)
})

describe('cache', () => {
  it('stores and retrieves a value', async () => {
    await cacheSet('key1', { foo: 'bar' }, 60000)
    const result = await cacheGet('key1')
    expect(result).toEqual({ foo: 'bar' })
  })

  it('returns null for missing keys', async () => {
    const result = await cacheGet('nonexistent')
    expect(result).toBeNull()
  })

  it('honours TTL', async () => {
    await cacheSet('ttl-key', 'data', 10)
    await new Promise(r => setTimeout(r, 20))
    const result = await cacheGet('ttl-key')
    expect(result).toBeNull()
  })

  it('overwrites existing keys', async () => {
    await cacheSet('key', 'old', 60000)
    await cacheSet('key', 'new', 60000)
    const result = await cacheGet('key')
    expect(result).toBe('new')
  })
})

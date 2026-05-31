import { describe, it, expect, beforeEach } from 'vitest'
import { mediaProxyUrls, setProxyConfig, getProxyThumbnails } from '../api.js'

describe('api.js', () => {
  beforeEach(() => {
    setProxyConfig(null, true, false)
  })

  describe('mediaProxyUrls', () => {
    it('returns server URL when no worker base', () => {
      setProxyConfig(null, true, false)
      const urls = mediaProxyUrls('https://gelbooru.com/img.jpg')
      expect(urls).toEqual(['/api/media?url=' + encodeURIComponent('https://gelbooru.com/img.jpg')])
    })

    it('returns worker URL when worker base is set', () => {
      setProxyConfig('https://worker.dev', true, false)
      const urls = mediaProxyUrls('https://gelbooru.com/img.jpg')
      expect(urls[0]).toContain('https://worker.dev')
      expect(urls[1]).toContain('/api/media')
    })

    it('returns empty array when no proxy is available', () => {
      setProxyConfig(null, false, false)
      const urls = mediaProxyUrls('https://gelbooru.com/img.jpg')
      expect(urls).toEqual([])
    })

    it('returns worker-only when server_proxy is false', () => {
      setProxyConfig('https://worker.dev', false, false)
      const urls = mediaProxyUrls('https://gelbooru.com/img.jpg')
      expect(urls).toHaveLength(1)
      expect(urls[0]).toContain('https://worker.dev')
    })

    it('encodes URL parameter', () => {
      setProxyConfig(null, true, false)
      const urls = mediaProxyUrls('https://gelbooru.com/img.jpg?size=large')
      expect(urls[0]).toContain(encodeURIComponent('https://gelbooru.com/img.jpg?size=large'))
    })
  })

  describe('getProxyThumbnails', () => {
    it('returns false by default', () => {
      expect(getProxyThumbnails()).toBe(false)
    })

    it('returns true when set to true', () => {
      setProxyConfig(null, true, true)
      expect(getProxyThumbnails()).toBe(true)
    })
  })
})

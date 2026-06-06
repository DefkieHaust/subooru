import { Router } from 'express'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { mediaCacheGet, mediaCacheSave } from '../media-cache.js'

const router = Router()

router.get('/', async (req, res) => {
  const { url } = req.query
  if (!url) {
    return res.status(400).json({ error: 'url parameter required' })
  }

  if (req.app.locals.conf.server.server_proxy === false) {
    return res.status(503).json({ error: 'Server media proxy is disabled' })
  }

  const cached = await mediaCacheGet(url)
  if (cached) {
    res.set('Content-Type', cached.contentType)
    res.set('Cache-Control', 'public, max-age=86400')
    res.set('X-Cache', 'hit')
    return pipeline(cached.stream, res)
  }

  try {
    const source = req.query.source || 'gelbooru'
    const referer = source === 'danbooru' ? 'https://danbooru.donmai.us/' : 'https://gelbooru.com/'

    const response = await fetch(url, {
      headers: {
        'Referer': referer
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch media' })
    }

    const contentType = response.headers.get('content-type')
    if (contentType) {
      res.set('Content-Type', contentType)
    }
    res.set('Cache-Control', 'public, max-age=86400')
    res.set('X-Cache', 'miss')

    const [webCache, webClient] = response.body.tee()
    const cacheStream = Readable.fromWeb(webCache)
    const clientStream = Readable.fromWeb(webClient)
    mediaCacheSave(url, contentType, cacheStream)
    await pipeline(clientStream, res)
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message })
    }
  }
})

export default router

import { Router } from 'express'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

const router = Router()

router.get('/', async (req, res) => {
  const { url } = req.query
  if (!url) {
    return res.status(400).json({ error: 'url parameter required' })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://gelbooru.com/'
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

    await pipeline(Readable.fromWeb(response.body), res)
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message })
    }
  }
})

export default router

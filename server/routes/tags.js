import { Router } from 'express'
import { listTags, searchTags } from '../gelbooru.js'

const router = Router()

const META_FILTERS = /^(fav|height|id|pool|score|sort|source|updated|user|width|rating):/

router.get('/', async (req, res) => {
  try {
    let names = [].concat(req.query.t || []).filter(Boolean)
    names = names.map(n => n.startsWith('-') ? n.slice(1) : n)
    names = names.filter(n => !META_FILTERS.test(n))
    names = [...new Set(names)]

    if (names.length === 0) {
      return res.json({ results: [] })
    }

    const results = await listTags(names.join(' '))
    res.json({ results })
  } catch (err) {
    console.error('Failed to fetch tags:', err)
    res.status(502).json({ error: 'failed to fetch tags from gelbooru' })
  }
})

router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q || '').replace(/ /g, '_')
    if (!query) {
      return res.status(400).json({ error: 'required GET param `q` is missing' })
    }

    const conf = req.app.locals.conf
    const results = await searchTags(query, conf.server.metatags)
    res.json({ results })
  } catch (err) {
    console.error('Failed to search tags:', err)
    res.status(502).json({ error: 'failed to search tags from gelbooru' })
  }
})

export default router

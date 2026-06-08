import { Router } from 'express'
import { listTags as gelbooruListTags, searchTags as gelbooruSearchTags } from '../gelbooru.js'
import { listTags as danbooruListTags, searchTags as danbooruSearchTags } from '../danbooru.js'
import { withSourceFallback } from '../source-fallback.js'

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

    const conf = req.app.locals.conf.server
    const sources = conf.sources && conf.sources.length ? conf.sources : ['gelbooru', 'danbooru']
    if (sources.length === 0) {
      return res.status(503).json({ error: 'no sources enabled' })
    }

    const explicitSource = req.query.source
    const orderedSources = explicitSource && sources.includes(explicitSource)
      ? [explicitSource, ...sources.filter(s => s !== explicitSource)]
      : sources

    const { data } = await withSourceFallback(orderedSources, (src) => {
      if (src === 'danbooru') return danbooruListTags(names.join(' '))
      return gelbooruListTags(names.join(' '))
    })
    res.json({ results: data })
  } catch (err) {
    console.error('Failed to fetch tags:', err)
    res.status(502).json({ error: 'failed to fetch tags' })
  }
})

router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q || '').replace(/ /g, '_')
    if (!query) {
      return res.status(400).json({ error: 'required GET param `q` is missing' })
    }

    const conf = req.app.locals.conf.server
    const sources = conf.sources && conf.sources.length ? conf.sources : ['gelbooru', 'danbooru']
    if (sources.length === 0) {
      return res.status(503).json({ error: 'no sources enabled' })
    }

    const explicitSource = req.query.source
    const orderedSources = explicitSource && sources.includes(explicitSource)
      ? [explicitSource, ...sources.filter(s => s !== explicitSource)]
      : sources

    const { data } = await withSourceFallback(orderedSources, (src) => {
      if (src === 'danbooru') return danbooruSearchTags(query)
      return gelbooruSearchTags(query, conf.metatags)
    })
    res.json({ results: data })
  } catch (err) {
    console.error('Failed to search tags:', err)
    res.status(502).json({ error: 'failed to search tags' })
  }
})

export default router

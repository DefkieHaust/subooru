import { Router } from 'express'
import { listPosts as gelbooruListPosts } from '../gelbooru.js'
import { listPosts as danbooruListPosts } from '../danbooru.js'
import { withSourceFallback } from '../source-fallback.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    if (page > 200) {
      return res.status(400).json({ error: 'results past page 200 are blocked by gelbooru' })
    }

    const conf = req.app.locals.conf.server
    const sources = conf.sources && conf.sources.length ? conf.sources : ['gelbooru', 'danbooru']
    if (sources.length === 0) {
      return res.status(503).json({ error: 'no sources enabled' })
    }

    const userTags = [].concat(req.query.q || []).filter(Boolean)

    const filteredTags = userTags.filter(t => {
      const name = t.startsWith('-') || t.startsWith('~') ? t.slice(1) : t
      return !conf.blacklist.includes(name)
    })

    const allTags = [
      ...conf.include,
      ...filteredTags,
      ...conf.blacklist.map(t => `-${t}`)
    ]
    const tags = allTags.join(' ')

    const explicitSource = req.query.source
    const orderedSources = explicitSource && sources.includes(explicitSource)
      ? [explicitSource, ...sources.filter(s => s !== explicitSource)]
      : sources

    const { data, source } = await withSourceFallback(orderedSources, (source) => {
      if (source === 'danbooru') return danbooruListPosts(tags, page)
      return gelbooruListPosts(tags, page)
    })
    res.json({
      ...data,
      results: data.results.map(p => ({ ...p, source })),
      source
    })
  } catch (err) {
    console.error('Failed to fetch posts:', err)
    res.status(502).json({ error: 'failed to fetch posts' })
  }
})

export default router

import { Router } from 'express'
import { listPosts } from '../gelbooru.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    if (page > 200) {
      return res.status(400).json({ error: 'results past page 200 are blocked by gelbooru' })
    }

    const tags = [].concat(req.query.q || []).filter(Boolean).join(' ')
    const result = await listPosts(tags, page)
    res.json(result)
  } catch (err) {
    console.error('Failed to fetch posts:', err)
    res.status(502).json({ error: 'failed to fetch posts from gelbooru' })
  }
})

export default router

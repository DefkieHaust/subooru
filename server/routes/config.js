import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  const c = req.app.locals.conf.client
  const s = req.app.locals.conf.server
  res.json({
    sources: s.sources && s.sources.length ? s.sources : ['gelbooru', 'danbooru'],
    include: c.include || [],
    blacklist: c.blacklist,
    worker_base: c.worker_base || null,
    server_proxy: c.server_proxy !== false,
    proxy_thumbnails: c.proxy_thumbnails === true,
    git_commit: process.env.GIT_COMMIT || null
  })
})

export default router

import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  const c = req.app.locals.conf.client
  const s = req.app.locals.conf.server
  res.json({
    primary_source: s.primary_source || 'gelbooru',
    include: c.include || [],
    blacklist: c.blacklist,
    worker_base: c.worker_base || null,
    server_proxy: c.server_proxy !== false,
    proxy_thumbnails: c.proxy_thumbnails === true
  })
})

export default router

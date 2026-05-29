import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  const c = req.app.locals.conf.client
  res.json({
    include: c.include || [],
    blacklist: c.blacklist,
    worker_base: c.worker_base || null,
    server_proxy: c.server_proxy !== false
  })
})

export default router

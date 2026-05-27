import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({ blacklist: req.app.locals.conf.client.blacklist })
})

export default router

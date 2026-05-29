import 'dotenv/config'
import express from 'express'
import { Redis } from 'ioredis'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import postsRouter from './routes/posts.js'
import tagsRouter from './routes/tags.js'
import mediaRouter from './routes/media.js'
import configRouter from './routes/config.js'
import { initCache } from './cache.js'
import { createRateLimiter } from './rate-limit.js'
import { initGelbooruClient } from './gelbooru.js'
import { initMediaCache } from './media-cache.js'
import { initLogger, getLogger } from './logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'

const conf = JSON.parse(readFileSync(join(__dirname, '..', 'conf.json'), 'utf-8'))
app.locals.conf = conf

if (conf.server.trust_proxy) {
  app.set('trust proxy', 1)
}

initLogger(conf.log)

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null
initCache(redis)
initGelbooruClient(conf.server.cache)
initMediaCache(conf.server.media_cache)

getLogger().info({ port: PORT, host: HOST, redis: !!redis, node: process.version }, 'Starting subooru')

app.use(express.json())

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    getLogger().info({ method: req.method, path: req.originalUrl, status: res.statusCode, duration: Date.now() - start })
  })
  next()
})

const rl = conf.server.rate_limit
if (rl?.enabled !== false) {
  app.use('/api/posts', createRateLimiter({ ...rl, max: rl.endpoints.posts }, redis))
  app.use('/api/tags', createRateLimiter({ ...rl, max: rl.endpoints.tags }, redis))
  app.use('/api/media', createRateLimiter({ ...rl, max: rl.endpoints.media }, redis))
  app.use('/api/config', createRateLimiter({ ...rl, max: rl.endpoints.config }, redis))
}

app.use('/api/posts', postsRouter)
app.use('/api/tags', tagsRouter)
app.use('/api/media', mediaRouter)
app.use('/api/config', configRouter)

app.get('/api/version', (req, res) => {
  res.json({ version: '0.1.0' })
})

const distPath = join(__dirname, '..', 'client', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

app.listen(PORT, HOST, () => {
  getLogger().info({ port: PORT, host: HOST }, `subooru running on http://${HOST}:${PORT}`)
})

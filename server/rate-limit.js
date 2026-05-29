import rateLimit from 'express-rate-limit'
import { getLogger } from './logger.js'

export function createRateLimiter(config, redis) {
  if (!config || config.enabled === false) {
    return (req, res, next) => next()
  }

  const opts = {
    windowMs: config.window_ms || 60000,
    max: config.max || config.default_max || 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      getLogger().warn({ ip: req.ip, path: req.path, max: opts.max, windowMs: opts.windowMs }, 'RATE LIMITED')
      res.status(429).json({ error: 'Too many requests' })
    }
  }

  if (redis) {
    opts.store = createRedisStore(redis, opts.windowMs)
  }

  return rateLimit(opts)
}

function createRedisStore(redis, windowMs) {
  return {
    prefix: 'subooru:rl:',
    async increment(key) {
      const slot = Math.floor(Date.now() / windowMs)
      const rk = `${this.prefix}${key}:${slot}`
      const totalHits = await redis.incr(rk)
      if (totalHits === 1) await redis.pexpire(rk, windowMs)
      return {
        totalHits,
        resetTime: new Date(Math.ceil((slot + 1) * windowMs))
      }
    },
    async decrement() {},
    async resetKey(key) {
      const keys = await redis.keys(`${this.prefix}${key}:*`)
      if (keys.length) await redis.del(keys)
    }
  }
}

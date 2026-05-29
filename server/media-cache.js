import crypto from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import { getLogger } from './logger.js'

let _config = null

export function initMediaCache(config) {
  _config = config
  if (!config || config.enabled === false) return
  fs.mkdirSync(config.dir, { recursive: true })
  cleanupTempFiles()
  sweepExpired()
}

function cachePath(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex')
  return path.join(_config.dir, hash.slice(0, 2), hash.slice(2, 4), hash)
}

function metaPath(file) {
  return file + '.meta'
}

export async function mediaCacheGet(url) {
  if (!_config || !_config.enabled) return null

  const file = cachePath(url)
  const meta = metaPath(file)

  try {
    const m = JSON.parse(await fsp.readFile(meta, 'utf-8'))
    if (Date.now() - m.cached_at > _config.max_age_ms) {
      await fsp.unlink(file).catch(() => {})
      await fsp.unlink(meta).catch(() => {})
      getLogger().debug({ url }, 'MEDIA CACHE EXPIRED')
      return null
    }
    return {
      stream: fs.createReadStream(file),
      contentType: m.content_type
    }
  } catch {
    return null
  }
}

export function mediaCacheSave(url, contentType, stream) {
  if (!_config || !_config.enabled) return

  const file = cachePath(url)
  const tmp = file + '.tmp.' + process.pid

  fsp.mkdir(path.dirname(file), { recursive: true })
    .then(() => {
      const ws = fs.createWriteStream(tmp)
      stream.pipe(ws)

      ws.on('finish', () => {
        fsp.rename(tmp, file)
          .then(() => fsp.writeFile(metaPath(file), JSON.stringify({
            url,
            content_type: contentType,
            cached_at: Date.now()
          })))
          .then(() => getLogger().debug({ url }, 'MEDIA CACHED'))
          .catch(err => {
            getLogger().warn({ err: err.message, url }, 'MEDIA CACHE SAVE FAILED')
            fsp.unlink(tmp).catch(() => {})
          })
      })

      ws.on('error', err => {
        getLogger().warn({ err: err.message, url }, 'MEDIA CACHE WRITE FAILED')
        fsp.unlink(tmp).catch(() => {})
      })
    })
    .catch(err => {
      getLogger().warn({ err: err.message, url }, 'MEDIA CACHE MKDIR FAILED')
      stream.resume()
    })
}

function cleanupTempFiles() {
  const dir = _config.dir
  function walk(d) {
    let entries
    try { entries = fs.readdirSync(d, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.includes('.tmp.')) {
        fs.unlinkSync(p)
      }
    }
  }
  walk(dir)
}

function sweepExpired() {
  if (!_config || _config.enabled === false) return
  let total = 0
  let expired = 0
  function walk(d) {
    let entries
    try { entries = fs.readdirSync(d, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.meta')) {
        total++
        try {
          const m = JSON.parse(fs.readFileSync(p, 'utf-8'))
          if (Date.now() - m.cached_at > _config.max_age_ms) {
            fs.unlinkSync(p.replace(/\.meta$/, ''))
            fs.unlinkSync(p)
            expired++
          }
        } catch {}
      }
    }
  }
  walk(_config.dir)
  if (total > 0) {
    getLogger().info({ total, expired }, 'Media cache sweep')
  }
}

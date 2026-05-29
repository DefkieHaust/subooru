import crypto from 'node:crypto'
import { Client } from 'minio'
import { getLogger } from './logger.js'

let _client = null
let _bucket = null
let _enabled = false

export function initMediaCache(config) {
  if (!config || config.enabled === false) {
    _enabled = false
    return
  }

  const endPoint = process.env.S3_ENDPOINT
  const port = parseInt(process.env.S3_PORT, 10) || 443
  const useSSL = process.env.S3_USE_SSL !== 'false'
  const region = process.env.S3_REGION || 'us-east-1'
  const accessKey = process.env.S3_ACCESS_KEY
  const secretKey = process.env.S3_SECRET_KEY
  _bucket = process.env.S3_BUCKET

  if (!endPoint || !accessKey || !secretKey || !_bucket) {
    getLogger().warn('Media cache disabled: missing S3_* environment variables')
    _enabled = false
    return
  }

  try {
    _client = new Client({ endPoint, port, useSSL, region, accessKey, secretKey })
    _enabled = true
    getLogger().info({ endPoint, bucket: _bucket }, 'S3 media cache initialized')
  } catch (err) {
    getLogger().warn({ err: err.message }, 'S3 media cache init failed')
    _enabled = false
  }
}

function objectKey(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex')
  return `media/${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash}`
}

export async function mediaCacheGet(url) {
  if (!_enabled) return null

  const key = objectKey(url)
  try {
    const stat = await _client.statObject(_bucket, key)
    const stream = await _client.getObject(_bucket, key)
    return {
      stream,
      contentType: stat.metaData?.['content-type'] || 'application/octet-stream'
    }
  } catch (err) {
    if (err.code === 'NotFound') return null
    getLogger().warn({ err: err.message, url }, 'S3 GET failed')
    return null
  }
}

export async function mediaCacheSave(url, contentType, stream) {
  if (!_enabled) return

  const key = objectKey(url)
  try {
    await _client.putObject(_bucket, key, stream, null, { 'Content-Type': contentType })
    getLogger().debug({ url }, 'MEDIA CACHED to S3')
  } catch (err) {
    getLogger().warn({ err: err.message, url }, 'S3 PUT failed')
  }
}

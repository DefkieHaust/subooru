import { getLogger } from './logger.js'

export async function withSourceFallback(primarySource, fetchFn) {
  const sources = [
    primarySource,
    primarySource === 'gelbooru' ? 'danbooru' : 'gelbooru'
  ]
  let lastError
  for (const source of sources) {
    try {
      const data = await fetchFn(source)
      return { data, source }
    } catch (err) {
      lastError = err
      getLogger().warn({ source, err: err.message }, 'Source failed, trying fallback')
    }
  }
  throw lastError
}

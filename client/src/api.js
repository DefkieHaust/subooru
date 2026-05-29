export async function fetchPosts({ tags, page }) {
  const params = new URLSearchParams()
  params.set('page', page)
  tags.include.forEach(t => params.append('q', t))
  tags.exclude.forEach(t => params.append('q', `-${t}`))

  const res = await fetch(`/api/posts?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'failed to fetch posts')
  }
  return res.json()
}

export async function fetchTags(names) {
  if (names.length === 0) return { results: [] }

  const params = new URLSearchParams()
  names.forEach(n => params.append('t', n))

  const res = await fetch(`/api/tags?${params}`)
  if (!res.ok) throw new Error('failed to fetch tags')
  return res.json()
}

export async function tagAutocomplete(query) {
  const res = await fetch(`/api/tags/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('failed to autocomplete tags')
  return res.json()
}

export async function fetchConfig() {
  const res = await fetch('/api/config')
  return res.json()
}

let _workerBase = null
let _serverProxy = true

export function setProxyConfig(workerBase, serverProxy) {
  _workerBase = workerBase || null
  _serverProxy = serverProxy !== false
}

export function mediaProxyUrls(url) {
  const server = `/api/media?url=${encodeURIComponent(url)}`
  if (_workerBase) {
    const worker = `${_workerBase}?url=${encodeURIComponent(url)}`
    return _serverProxy ? [worker, server] : [worker]
  }
  return _serverProxy ? [server] : []
}

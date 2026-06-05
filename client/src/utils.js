const TAG_TYPE_CACHE_KEY = 'subooru-tag-types'

function getTagTypeCache() {
  try {
    const raw = localStorage.getItem(TAG_TYPE_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveTagTypeCache(cache) {
  localStorage.setItem(TAG_TYPE_CACHE_KEY, JSON.stringify(cache))
}

export function getCachedTagType(name) {
  if (name.includes(':')) return 'metadata'
  const cache = getTagTypeCache()
  return cache[name] || null
}

export function updateTagTypeCache(name, type) {
  if (name.includes(':') || type === 'general') return
  const cache = getTagTypeCache()
  if (cache[name] !== type) {
    cache[name] = type
    saveTagTypeCache(cache)
  }
}

export function getUncachedTagNames(names) {
  const cache = getTagTypeCache()
  return names.filter(n => !n.includes(':') && !cache[n])
}

export function resolveTagType(tag) {
  if (tag.name && tag.name.includes(':')) return 'metadata'
  return tag.type
}

export function tagBadgeColor(type, name) {
  const t = name && name.includes(':') ? 'metadata' : type
  switch (t) {
    case 'artist': return 'bg-info text-light'
    case 'character': return 'bg-success'
    case 'copyright': return 'bg-warning text-light'
    case 'metadata': return 'bg-secondary'
    default: return 'bg-primary'
  }
}

export function tagTextColor(type, name) {
  const t = name && name.includes(':') ? 'metadata' : type
  switch (t) {
    case 'artist': return 'text-info'
    case 'character': return 'text-success'
    case 'copyright': return 'text-warning'
    case 'metadata': return 'text-secondary'
    default: return ''
  }
}
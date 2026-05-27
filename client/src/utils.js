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
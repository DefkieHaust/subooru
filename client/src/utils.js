export function tagBadgeColor(type) {
  switch (type) {
    case 'artist': return 'bg-info text-light'
    case 'character': return 'bg-success'
    case 'copyright': return 'bg-warning text-light'
    case 'metadata': return 'bg-secondary'
    default: return 'bg-primary'
  }
}

export function tagTextColor(type) {
  switch (type) {
    case 'artist': return 'text-info'
    case 'character': return 'text-success'
    case 'copyright': return 'text-warning'
    case 'metadata': return 'text-info'
    default: return ''
  }
}
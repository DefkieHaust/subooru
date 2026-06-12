import { useRef, useState, useEffect, useMemo } from 'react'
import PostCard from './PostCard.jsx'

export default function PostGrid({ posts, settings, onToggleBlacklist, onToggleFavorite, onOpenFullscreen, blacklistedTags }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const colGap = 5
  const postGap = 5

  const columns = useMemo(() => {
    if (containerWidth === 0) return []
    const colWidth = settings.columnWidth
    const colWithGap = colWidth + colGap
    const count = Math.max(1, Math.floor((containerWidth - colWidth) / colWithGap) + 1)
    const width = (containerWidth - (count - 1) * colGap) / count

    const filtered = posts.filter(p => !p.tags.some(t => blacklistedTags.includes(t)))
    const maxHeight = settings.maxPostHeight

    const cropped = filtered.map(p => {
      const zoom = width / p.width
      const renderHeight = p.height * zoom
      const cropped = renderHeight > maxHeight
      return { ...p, renderHeight: cropped ? maxHeight : renderHeight, cropped }
    })

    const cols = Array.from({ length: count }, () => ({ posts: [], height: 0 }))
    for (const p of cropped) {
      let shortest = 0
      for (let i = 1; i < count; i++) {
        if (cols[i].height < cols[shortest].height) shortest = i
      }
      cols[shortest].posts.push(p)
      cols[shortest].height += p.renderHeight + postGap
    }
    return cols
  }, [posts, containerWidth, settings, blacklistedTags])

  return (
    <div className="d-flex gap-1" ref={containerRef}>
      {columns.map((col, i) => (
        <div className="d-flex flex-column flex-grow-1 gap-1" key={i}>
          {col.posts.map(p => (
            <PostCard
              key={p.id}
              post={p}
              settings={settings}
              onToggleBlacklist={onToggleBlacklist}
              onToggleFavorite={onToggleFavorite}
              onOpenFullscreen={onOpenFullscreen}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

import { useState, useCallback } from 'react'

function isVideo(url) {
  return /\.(mp4|webm|mov)$/i.test(url)
}

export default function PostCard({ post, settings, onToggleBlacklist, onToggleFavorite, onOpenFullscreen }) {
  const sources = [post.thumbnail_url, post.sample_url, post.image_url].filter(Boolean)
  const [srcIndex, setSrcIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const isFav = settings.favorites.some(p => p.id === post.id)
  const video = isVideo(post.image_url)

  const handleError = useCallback(() => {
    setSrcIndex(i => Math.min(i + 1, sources.length - 1))
  }, [sources.length])

  const currentSrc = sources[srcIndex] || sources[0]

  return (
    <div className="position-relative overflow-hidden rounded bg-dark" style={{ height: post.renderHeight, cursor: 'pointer' }}>
      <div className="w-100 h-100 position-relative" onClick={() => onOpenFullscreen(post)}>
        <div className="w-100 h-100 position-absolute top-0 start-0" style={{ background: '#0f3460', opacity: loaded ? 0 : 1, transition: 'opacity 0.3s' }} />
        <img
          src={currentSrc}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className="w-100 h-100 position-absolute top-0 start-0"
          style={{ objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
          referrerPolicy="no-referrer"
        />
        {video && loaded && (
          <div className="position-absolute top-50 start-50 translate-middle" style={{ opacity: 0.8, zIndex: 2 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="white" viewBox="0 0 16 16">
              <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
            </svg>
          </div>
        )}
      </div>

      <div className="position-absolute top-0 start-0 d-flex gap-1 m-1" style={{ pointerEvents: 'none' }}>
        <span className={`badge bg-${ratingColor(post.rating)}`} style={{ fontSize: '0.6rem' }}>{post.rating}</span>
        <span className="badge bg-dark bg-opacity-75" style={{ fontSize: '0.6rem' }}>{post.score}</span>
      </div>

      <div className="position-absolute top-0 end-0 d-flex gap-1 m-1" style={{ opacity: 0, transition: 'opacity 0.15s' }}
        onMouseOver={e => e.currentTarget.style.opacity = '1'}
        onMouseOut={e => e.currentTarget.style.opacity = '0'}
      >
        <button
          className={`btn btn-sm ${isFav ? 'btn-warning' : 'btn-dark'}`}
          style={{ fontSize: '0.7rem', padding: '1px 5px' }}
          onClick={e => { e.stopPropagation(); onToggleFavorite(post) }}
          title={isFav ? 'Unfavorite' : 'Favorite'}
        >
          {isFav ? '\u2605' : '\u2606'}
        </button>
        <button
          className="btn btn-sm btn-dark"
          style={{ fontSize: '0.7rem', padding: '1px 5px' }}
          onClick={e => {
            e.stopPropagation()
            onToggleBlacklist({ name: post.tags[0] || `post:${post.id}`, type: 'general', count: 0 })
          }}
          title="Blacklist"
        >
          &#x2297;
        </button>
      </div>

      {post.cropped && (
        <div className="position-absolute bottom-0 start-0 end-0 text-center text-white pb-1"
          style={{ fontSize: '0.7rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', pointerEvents: 'none' }}>
          {post.height} x {post.width}
        </div>
      )}

      <div className="position-absolute bottom-0 start-0 end-0 d-flex flex-wrap gap-1 p-1"
        style={{ background: 'rgba(0,0,0,0.7)', opacity: 0, transition: 'opacity 0.15s' }}
        onMouseOver={e => e.currentTarget.style.opacity = '1'}
        onMouseOut={e => e.currentTarget.style.opacity = '0'}
      >
        {post.tags.slice(0, 8).map(t => (
          <span key={t} className="text-truncate" style={{ fontSize: '0.6rem', color: '#ccc', maxWidth: '100px' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function ratingColor(r) {
  switch (r) {
    case 'e': return 'danger'
    case 'q': return 'warning'
    case 's': return 'success'
    default: return 'secondary'
  }
}

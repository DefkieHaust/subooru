import { useEffect, useCallback, useState } from 'react'

function isVideo(url) {
  return /\.(mp4|webm|mov)$/i.test(url)
}

export default function FullscreenView({ post, onClose, settings, onToggleFavorite }) {
  const isFav = settings.favorites.some(p => p.id === post.id)
  const [imgError, setImgError] = useState(false)
  const video = isVideo(post.image_url)
  const imgSrc = post.sample_url || post.image_url

  const handleKey = useCallback(e => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.95)', zIndex: 1055 }}
      onClick={onClose}
    >
      <div
        className="d-flex flex-column"
        style={{ maxWidth: '95vw', maxHeight: '99vh', width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted small">
            {post.uploader ? `by ${post.uploader}` : ''}
          </span>
          <button className="btn btn-sm btn-outline-light" onClick={onClose}>
            Close
          </button>
        </div>

        <div
          className="d-flex align-items-center justify-content-center flex-grow-1 min-h-0"
          style={{ maxHeight: '85vh', minHeight: '200px', background: '#000' }}
        >
          {video ? (
            <video
              src={post.image_url}
              controls
              autoPlay={settings.autoplayVideo}
              muted={settings.muteVideo}
              className="mw-100"
              style={{ maxHeight: '85vh', width: 'auto', height: 'auto', maxWidth: '100%' }}
            />
          ) : (
            <img
              src={imgError ? post.image_url : imgSrc}
              alt=""
              onError={() => {
                if (!imgError && imgSrc !== post.image_url) {
                  setImgError(true)
                }
              }}
              className="mw-100"
              style={{
                maxHeight: '85vh',
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          )}
        </div>

        <div className="mt-2">
          <div className="d-flex gap-3 align-items-center text-muted small mb-2 flex-wrap">
            <span className={`badge bg-${ratingColor(post.rating)}`}>{post.rating}</span>
            <span>Score: {post.score}</span>
            <span>{post.width} x {post.height}</span>
            <span>{post.thumbnail_url ? '' : 'no thumbnail'}</span>
          </div>

          <div className="d-flex gap-2 mb-2 flex-wrap">
            <button
              className={`btn btn-sm ${isFav ? 'btn-warning' : 'btn-outline-light'}`}
              onClick={() => onToggleFavorite(post)}
            >
              {isFav ? '\u2605 Favorited' : '\u2606 Favorite'}
            </button>
            <a
              href={`https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-light"
            >
              Open on Gelbooru
            </a>
          </div>

          <div className="d-flex flex-wrap gap-1" style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {post.tags.map(t => (
              <span key={t} className="badge bg-secondary" style={{ fontSize: '0.75rem' }}>{t}</span>
            ))}
          </div>
        </div>
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

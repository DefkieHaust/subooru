import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mediaProxyUrls } from '../api.js'

export default function FullscreenView({ post, onClose, settings, onToggleFavorite }) {
  const navigate = useNavigate()
  const isFav = settings.favorites.some(p => p.id === post.id)
  const video = /\.(mp4|webm|mov)$/i.test(post.image_url)

  const handleTagClick = useCallback((tag) => {
    onClose()
    navigate(`/search/1/${encodeURIComponent(tag)}`)
  }, [onClose, navigate])

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

  const sourceUrls = (video ? [post.image_url] : [post.image_url, post.sample_url, post.thumbnail_url])
    .filter(Boolean)
    .flatMap(u => mediaProxyUrls(u))

  const [fallbackIndex, setFallbackIndex] = useState(0)
  const [imgReady, setImgReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const currentSrc = sourceUrls[fallbackIndex]

  const tryNext = useCallback(() => {
    if (fallbackIndex < sourceUrls.length - 1) {
      setFallbackIndex(i => i + 1)
      setImgReady(false)
    } else {
      setLoadFailed(true)
    }
  }, [fallbackIndex, sourceUrls.length])

  if (loadFailed) {
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ background: 'rgba(0,0,0,0.95)', zIndex: 1060 }}
        onClick={onClose}
      >
        <div className="text-center text-light" onClick={e => e.stopPropagation()}>
          <p>Failed to load media</p>
          <button className="btn btn-sm btn-outline-light" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  const posterUrl = video ? (post.thumbnail_url || '') : undefined

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.95)', zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="d-flex flex-column"
        style={{ maxWidth: '95vw', height: '99dvh', width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-2 flex-shrink-0">
          <span className="text-muted small">
            {post.uploader ? `by ${post.uploader}` : ''}
          </span>
          <button className="btn btn-sm btn-outline-light" onClick={onClose}>
            Close
          </button>
        </div>

        <div
          className="d-flex align-items-center justify-content-center flex-grow-1 min-h-0"
          style={{ background: '#000' }}
        >
          {video ? (
            <video
              key={currentSrc}
              src={currentSrc}
              poster={posterUrl}
              controls
              autoPlay={settings.autoplayVideo}
              muted={settings.muteVideo}
              style={{ maxHeight: '100%', width: 'auto', height: 'auto', maxWidth: '100%' }}
              onError={tryNext}
            />
          ) : (
            <>
              {!imgReady && (
                <div className="spinner-border text-light" role="status" />
              )}
              <img
                key={currentSrc}
                src={currentSrc}
                alt=""
                className="mw-100"
                style={{
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  display: imgReady ? 'block' : 'none'
                }}
                onLoad={() => setImgReady(true)}
                onError={tryNext}
              />
            </>
          )}
        </div>

        <div className="flex-shrink-0 pt-1">
          <div className="d-flex gap-3 align-items-center text-muted small mb-2 flex-wrap">
            <span className={`badge bg-${ratingColor(post.rating)}`}>{post.rating}</span>
            <span>Score: {post.score}</span>
            <span>{post.width} x {post.height}</span>
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
              <span
                key={t}
                className="badge bg-secondary"
                role="button"
                tabIndex={0}
                style={{ fontSize: '0.75rem', cursor: 'pointer' }}
                onClick={() => handleTagClick(t)}
                onKeyDown={e => { if (e.key === 'Enter') handleTagClick(t) }}
              >{t}</span>
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

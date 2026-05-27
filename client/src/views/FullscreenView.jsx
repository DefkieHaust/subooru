import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mediaProxyUrl } from '../api.js'

function isVideo(url) {
  return /\.(mp4|webm|mov)$/i.test(url)
}

export default function FullscreenView({ post, onClose, settings, onToggleFavorite }) {
  const navigate = useNavigate()
  const isFav = settings.favorites.some(p => p.id === post.id)
  const video = isVideo(post.image_url)

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

  const imageSources = [post.image_url, post.sample_url, post.thumbnail_url].filter(Boolean)
  const [srcIndex, setSrcIndex] = useState(0)
  const [imgReady, setImgReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const currentSrc = imageSources[srcIndex]

  const tryNextSrc = useCallback(() => {
    if (srcIndex < imageSources.length - 1) {
      setSrcIndex(i => i + 1)
      setImgReady(false)
    } else {
      setLoadFailed(true)
    }
  }, [srcIndex, imageSources.length])

  const handleVideoError = useCallback(() => {
    setLoadFailed(true)
  }, [])

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

  const proxiedSrc = video ? mediaProxyUrl(post.image_url) : mediaProxyUrl(currentSrc)
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
              src={proxiedSrc}
              poster={posterUrl}
              controls
              autoPlay={settings.autoplayVideo}
              muted={settings.muteVideo}
              className="mw-100"
              style={{ maxHeight: '100%', width: 'auto', height: 'auto', maxWidth: '100%' }}
              onError={handleVideoError}
            />
          ) : (
            <>
              {!imgReady && (
                <div className="spinner-border text-light" role="status" />
              )}
              <img
                key={proxiedSrc}
                src={proxiedSrc}
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
                onError={tryNextSrc}
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

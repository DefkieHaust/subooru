import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mediaProxyUrls, getProxyThumbnails } from '../api.js'

export default function FullscreenView({ post, onClose, settings, onToggleFavorite }) {
  const navigate = useNavigate()
  const isFav = settings.favorites.some(p => p.id === post.id)
  const video = /\.(mp4|webm|mov)$/i.test(post.image_url)
  const postSource = post.source || 'gelbooru'
  const sourceUrl = postSource === 'danbooru'
    ? `https://danbooru.donmai.us/posts/${post.id}`
    : `https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`
  const sourceLabel = postSource === 'danbooru' ? 'Danbooru' : 'Gelbooru'

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

  const videoSources = video ? mediaProxyUrls(post.image_url) : []
  const imageSources = video
    ? []
    : [post.image_url, post.sample_url, post.thumbnail_url]
        .filter(Boolean)
        .flatMap(u => mediaProxyUrls(u))

  const [videoSrcIndex, setVideoSrcIndex] = useState(0)
  const [fallbackIndex, setFallbackIndex] = useState(0)
  const [imgReady, setImgReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const currentImgSrc = imageSources[fallbackIndex]
  const currentVideoSrc = videoSources[videoSrcIndex]

  const tryNext = useCallback(() => {
    if (imageSources.length > 0 && fallbackIndex < imageSources.length - 1) {
      setFallbackIndex(i => i + 1)
      setImgReady(false)
    } else {
      setLoadFailed(true)
    }
  }, [fallbackIndex, imageSources.length])

  const handleVideoError = useCallback(() => {
    if (videoSrcIndex < videoSources.length - 1) {
      setVideoSrcIndex(i => i + 1)
    } else {
      setLoadFailed(true)
    }
  }, [videoSrcIndex, videoSources.length])

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

  const posterRaw = post.thumbnail_url || ''
  const posterUrl = video ? (getProxyThumbnails() && posterRaw ? mediaProxyUrls(posterRaw)[0] : posterRaw) : undefined

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
              key={currentVideoSrc}
              src={currentVideoSrc}
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
                key={currentImgSrc}
                src={currentImgSrc}
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
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-light"
            >
              Open on {sourceLabel}
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

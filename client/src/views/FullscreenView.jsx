import { useEffect, useCallback } from 'react'

function isVideo(url) {
  return /\.(mp4|webm|mov)$/i.test(url)
}

export default function FullscreenView({ post, onClose, settings, onToggleFavorite }) {
  const isFav = settings.favorites.some(p => p.id === post.id)

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
    <div className="fullscreen-overlay" onClick={onClose}>
      <div className="fullscreen-content" onClick={e => e.stopPropagation()}>
        <button className="fullscreen-close" onClick={onClose}>&times;</button>

        <div className="fullscreen-media">
          {isVideo(post.image_url) ? (
            <video
              src={post.sample_url || post.image_url}
              controls
              autoPlay={settings.autoplayVideo}
              muted={settings.muteVideo}
              className="fullscreen-video"
            />
          ) : (
            <img
              src={post.sample_url || post.image_url}
              alt=""
              className="fullscreen-image"
            />
          )}
        </div>

        <div className="fullscreen-info">
          <div className="fullscreen-meta">
            <span className={`post-rating rating-${post.rating}`}>{post.rating}</span>
            <span className="post-score">Score: {post.score}</span>
            <span>{post.width} x {post.height}</span>
            {post.uploader && <span>by {post.uploader}</span>}
          </div>

          <div className="fullscreen-actions">
            <button
              className={`action-btn ${isFav ? 'fav-active' : ''}`}
              onClick={() => onToggleFavorite(post)}
            >
              {isFav ? '\u2605 Favorited' : '\u2606 Favorite'}
            </button>
            <a
              href={`https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn"
            >
              Open on Gelbooru
            </a>
          </div>

          <div className="fullscreen-tags">
            {post.tags.map(t => (
              <span key={t} className="post-tag">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'

function isVideo(url) {
  return /\.(mp4|webm|mov)$/i.test(url)
}

export default function PostCard({ post, settings, onToggleBlacklist, onToggleFavorite, onOpenFullscreen }) {
  const [loaded, setLoaded] = useState(false)
  const isFav = settings.favorites.some(p => p.id === post.id)

  const tagTypes = ['artist', 'character', 'copyright', 'general', 'metadata', 'deprecated', 'unknown']

  return (
    <div className="post-card" style={{ height: post.renderHeight }}>
      <div
        className={`post-thumb ${loaded ? 'loaded' : ''}`}
        onClick={() => onOpenFullscreen(post)}
      >
        {!loaded && <div className="post-placeholder" />}
        {isVideo(post.image_url) ? (
          <video
            src={post.thumbnail_url}
            poster={post.thumbnail_url}
            muted={settings.muteVideo}
            autoPlay={settings.autoplayVideo}
            loop
            playsInline
            onCanPlay={() => setLoaded(true)}
            className="post-media"
          />
        ) : (
          <img
            src={post.thumbnail_url}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className="post-media"
          />
        )}
      </div>

      <div className="post-overlay">
        <span className={`post-rating rating-${post.rating}`}>{post.rating}</span>
        <span className="post-score">{post.score}</span>
      </div>

      <div className="post-actions">
        <button
          className={`action-btn ${isFav ? 'fav-active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleFavorite(post) }}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFav ? '\u2605' : '\u2606'}
        </button>
        <button
          className="action-btn"
          onClick={e => {
            e.stopPropagation()
            const tag = { name: post.tags[0] || `post:${post.id}`, type: 'general', count: 0 }
            onToggleBlacklist(tag)
          }}
          title="Blacklist"
        >
          \u2297
        </button>
      </div>

      {post.cropped && (
        <div className="post-expand" onClick={() => onOpenFullscreen(post)}>
          {post.height} x {post.width}
        </div>
      )}

      <div className="post-tags">
        {post.tags.slice(0, 8).map(t => (
          <span key={t} className="post-tag">{t}</span>
        ))}
      </div>
    </div>
  )
}

import { mediaProxyUrls, getProxyThumbnails } from '../api.js'

export default function FavoritesModal({ show, onClose, favorites, onToggleFavorite, onOpenFullscreen }) {
  if (!show) return null

  return (
    <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content bg-dark text-light">
          <div className="modal-header border-secondary">
            <h5 className="modal-title">Favorites ({favorites.length})</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>
          <div className="modal-body">
            {favorites.length === 0 && (
              <p className="text-muted text-center py-4">No favorites yet. Click the star on any post to add it.</p>
            )}
            <div className="row g-2">
              {favorites.map(p => (
                <div key={p.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                  <div className="card bg-secondary border-0 h-100" style={{ cursor: 'pointer' }} onClick={() => onOpenFullscreen(p)}>
                    <div className="position-relative">
                      <img
                        src={getProxyThumbnails() ? mediaProxyUrls(p.thumbnail_url)[0] : p.thumbnail_url}
                        alt=""
                        className="card-img-top"
                        style={{ objectFit: 'cover', height: '120px', width: '100%' }}
                      />
                      <span className={`position-absolute top-0 start-0 badge bg-${ratingColor(p.rating)}`} style={{ fontSize: '0.6rem' }}>
                        {p.rating}
                      </span>
                    </div>
                    <div className="card-body p-1 d-flex align-items-center justify-content-between">
                      <small className="text-light">{p.width}&times;{p.height}</small>
                      <button
                        className="btn btn-sm btn-warning py-0 px-1"
                        onClick={e => { e.stopPropagation(); onToggleFavorite(p) }}
                        title="Remove from favorites"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

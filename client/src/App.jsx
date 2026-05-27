import { useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import SearchPage from './views/SearchPage.jsx'
import FullscreenView from './views/FullscreenView.jsx'
import FavoritesModal from './components/FavoritesModal.jsx'

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const [query, setQuery] = useState({ include: [], exclude: [] })
  const [showSidebar, setShowSidebar] = useState(true)
  const [showFavorites, setShowFavorites] = useState(false)
  const [settings, setSettings] = useState(() => loadJSON('subooru-settings', {
    columnWidth: 300,
    maxPostHeight: 600,
    blacklist: [],
    favorites: [],
    autoplayVideo: true,
    muteVideo: true
  }))

  const [fullscreenPost, setFullscreenPost] = useState(null)

  const saveSettings = useCallback((next) => {
    setSettings(prev => {
      const updated = typeof next === 'function' ? next(prev) : next
      localStorage.setItem('subooru-settings', JSON.stringify(updated))
      return updated
    })
  }, [])

  const toggleBlacklist = useCallback((tag) => {
    saveSettings(s => {
      const exists = s.blacklist.some(t => t.name === tag.name)
      return {
        ...s,
        blacklist: exists
          ? s.blacklist.filter(t => t.name !== tag.name)
          : [...s.blacklist, tag]
      }
    })
  }, [saveSettings])

  const toggleFavorite = useCallback((post) => {
    saveSettings(s => {
      const exists = s.favorites.some(p => p.id === post.id)
      return {
        ...s,
        favorites: exists
          ? s.favorites.filter(p => p.id !== post.id)
          : [post, ...s.favorites]
      }
    })
  }, [saveSettings])

  return (
    <div className="d-flex flex-column vh-100">
      <nav className="navbar navbar-dark bg-dark border-bottom border-secondary px-3 flex-shrink-0" style={{ zIndex: 1030 }}>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-light d-md-none"
            onClick={() => setShowSidebar(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
            </svg>
          </button>
          <span className="navbar-brand mb-0 h1" style={{ color: '#e94560' }}>subooru</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-light position-relative"
            onClick={() => setShowFavorites(true)}
          >
            Favorites
            {settings.favorites.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                {settings.favorites.length}
              </span>
            )}
          </button>
          <div className="dropdown">
            <button className="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
              Blacklist ({settings.blacklist.length})
            </button>
            <ul className="dropdown-menu dropdown-menu-dark p-2" style={{ minWidth: '250px' }}>
              {settings.blacklist.length === 0 && (
                <li className="dropdown-item-text text-muted small">No blacklisted tags</li>
              )}
              {settings.blacklist.map(t => (
                <li key={t.name} className="d-flex align-items-center gap-2 mb-1">
                  <span className={`badge ${tagBadgeColor(t.type)}`}>{t.name}</span>
                  <button
                    className="btn btn-sm btn-outline-danger ms-auto py-0 px-1"
                    onClick={() => toggleBlacklist(t)}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <button
            className={`btn btn-sm ${showSidebar ? 'btn-secondary' : 'btn-outline-light'} d-none d-md-inline-block`}
            onClick={() => setShowSidebar(!showSidebar)}
            title="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
            </svg>
          </button>
        </div>
      </nav>

      <div className="position-relative flex-grow-1 min-h-0 d-flex flex-column">
        {showSidebar && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-md-none"
            style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
            onClick={() => setShowSidebar(false)}
          />
        )}

        <Sidebar
          query={query}
          onQueryChange={setQuery}
          settings={settings}
          onSettingsChange={saveSettings}
          onCloseMobile={() => setShowSidebar(false)}
          show={showSidebar}
        />

        <Routes>
          <Route
            path="/"
            element={
              <SearchPage
                query={query}
                onQueryChange={setQuery}
                settings={settings}
                onToggleBlacklist={toggleBlacklist}
                onToggleFavorite={toggleFavorite}
                onOpenFullscreen={setFullscreenPost}
              />
            }
          />
          <Route
            path="/search/:page/:query?"
            element={
              <SearchPage
                query={query}
                onQueryChange={setQuery}
                settings={settings}
                onToggleBlacklist={toggleBlacklist}
                onToggleFavorite={toggleFavorite}
                onOpenFullscreen={setFullscreenPost}
              />
            }
          />
        </Routes>
      </div>

      {fullscreenPost && (
        <FullscreenView
          post={fullscreenPost}
          onClose={() => setFullscreenPost(null)}
          settings={settings}
          onToggleFavorite={toggleFavorite}
        />
      )}

      <FavoritesModal
        show={showFavorites}
        onClose={() => setShowFavorites(false)}
        favorites={settings.favorites}
        onToggleFavorite={toggleFavorite}
        onOpenFullscreen={setFullscreenPost}
      />
    </div>
  )
}

function tagBadgeColor(type) {
  switch (type) {
    case 'artist': return 'bg-info'
    case 'character': return 'bg-success'
    case 'copyright': return 'bg-warning text-dark'
    case 'metadata': return 'bg-secondary'
    default: return 'bg-primary'
  }
}

import { useState, useCallback, useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import SearchPage from './views/SearchPage.jsx'
import FullscreenView from './views/FullscreenView.jsx'
import FavoritesModal from './components/FavoritesModal.jsx'
import { tagAutocomplete, fetchConfig, setProxyConfig } from './api.js'
import { tagBadgeColor, tagTextColor } from './utils.js'

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
    muteVideo: true,
    defaultTags: true,
    defaultBlacklist: true,
    highResPreview: true
  }))

  const [clientConfig, setClientConfig] = useState({ include: [], blacklist: [] })
  const [fullscreenPost, setFullscreenPost] = useState(null)
  const [blacklistInput, setBlacklistInput] = useState('')
  const [blSuggestions, setBlSuggestions] = useState([])
  const [showBlSuggestions, setShowBlSuggestions] = useState(false)
  const blInputRef = useRef(null)
  const blSuggestionRef = useRef(null)

  const saveSettings = useCallback((next) => {
    setSettings(prev => {
      const updated = typeof next === 'function' ? next(prev) : next
      localStorage.setItem('subooru-settings', JSON.stringify(updated))
      return updated
    })
  }, [])

  useEffect(() => {
    fetchConfig().then(cfg => {
      setProxyConfig(cfg.worker_base, cfg.server_proxy, cfg.proxy_thumbnails)
      setClientConfig({ include: cfg.include || [], blacklist: cfg.blacklist || [] })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (settings.defaultTags === false) return
    if (!clientConfig.include.length) return
    setQuery(q => {
      const existing = new Set(q.include.map(t => t.name))
      const toAdd = clientConfig.include.filter(name => !existing.has(name))
      if (!toAdd.length) return q
      return { ...q, include: [...q.include, ...toAdd.map(name => ({ name, type: 'general', count: 0 }))] }
    })
  }, [clientConfig.include, settings.defaultTags])

  useEffect(() => {
    if (settings.defaultBlacklist === false) return
    if (!clientConfig.blacklist.length) return
    saveSettings(s => {
      const existing = new Set(s.blacklist.map(t => t.name))
      const toAdd = clientConfig.blacklist.filter(name => !existing.has(name))
      if (!toAdd.length) return s
      return { ...s, blacklist: [...s.blacklist, ...toAdd.map(name => ({ name, type: 'general', count: 0 }))] }
    })
  }, [clientConfig.blacklist, settings.defaultBlacklist])

  useEffect(() => {
    if (!blacklistInput.trim()) {
      setBlSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const data = await tagAutocomplete(blacklistInput.trim())
        setBlSuggestions(data.results || [])
        setShowBlSuggestions(true)
      } catch {
        setBlSuggestions([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [blacklistInput])

  useEffect(() => {
    function handleClick(e) {
      if (blSuggestionRef.current && !blSuggestionRef.current.contains(e.target) &&
          blInputRef.current && !blInputRef.current.contains(e.target)) {
        setShowBlSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
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
            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark p-2" style={{ minWidth: '250px' }} data-bs-popper="static">
              <li className="dropdown-item p-0 mb-2 position-relative">
                <div className="d-flex gap-1">
                  <input
                    ref={blInputRef}
                    className="form-control form-control-sm bg-dark text-light border-secondary flex-grow-1"
                    placeholder="Type to add..."
                    value={blacklistInput}
                    onChange={e => setBlacklistInput(e.target.value)}
                    onFocus={() => blSuggestions.length > 0 && setShowBlSuggestions(true)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (blacklistInput.trim()) {
                          toggleBlacklist({ name: blacklistInput.trim(), type: 'general', count: 0 })
                          setBlacklistInput('')
                          setShowBlSuggestions(false)
                        }
                      }
                    }}
                  />
                </div>
                {showBlSuggestions && blSuggestions.length > 0 && (
                  <div
                    ref={blSuggestionRef}
                    className="position-absolute start-0 end-0 bg-dark border border-secondary rounded-bottom"
                    style={{ zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}
                  >
                    {blSuggestions.map(t => (
                      <button
                        key={t.name}
                        type="button"
                        className="d-flex justify-content-between align-items-center w-100 px-2 py-1 text-start bg-transparent border-0 text-light"
                        style={{ fontSize: '0.85rem' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0f3460'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => {
                          toggleBlacklist({ name: t.name, type: t.type, count: t.count })
                          setBlacklistInput('')
                          setShowBlSuggestions(false)
                          blInputRef.current?.focus()
                        }}
                      >
                        <span className={`${tagTextColor(t.type, t.name)}`}>{t.name}</span>
                        {t.type !== 'metadata' && <span className="text-light opacity-75 small">{t.count.toLocaleString()}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </li>
              {settings.blacklist.length === 0 && (
                <li className="dropdown-item-text text-light small opacity-75">No blacklisted tags</li>
              )}
              {settings.blacklist.length > 0 && (
                <li className="d-flex flex-wrap gap-1">
                  {settings.blacklist.map(t => (
                    <span
                      key={t.name}
                      className={`badge ${tagBadgeColor(t.type, t.name)} d-inline-flex align-items-center gap-1`}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                      onClick={() => toggleBlacklist(t)}
                      onKeyDown={e => { if (e.key === 'Enter') toggleBlacklist(t) }}
                    >
                      {t.name}
                      <span>&times;</span>
                    </span>
                  ))}
                </li>
              )}
            </ul>
          </div>
          <button
            className="btn btn-sm btn-outline-light d-none"
            onClick={() => setShowSidebar(!showSidebar)}
            title="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
            </svg>
          </button>
        </div>
      </nav>

      <div className="d-md-flex flex-grow-1 min-h-0 position-relative">
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
          clientInclude={clientConfig.include}
        />

        <main className="overflow-auto app-main" style={{ paddingBottom: '60px' }}>
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
        </main>
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



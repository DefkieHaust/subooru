import { useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import SearchPage from './views/SearchPage.jsx'
import FullscreenView from './views/FullscreenView.jsx'

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
    <div className="app">
      <Sidebar
        query={query}
        onQueryChange={setQuery}
        settings={settings}
        onSettingsChange={saveSettings}
      />
      <main id="scroll-container" tabIndex={-1}>
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
      {fullscreenPost && (
        <FullscreenView
          post={fullscreenPost}
          onClose={() => setFullscreenPost(null)}
          settings={settings}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  )
}

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { tagAutocomplete } from '../api.js'

export default function Sidebar({ query, onQueryChange, settings, onSettingsChange }) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const suggestionRef = useRef(null)

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const data = await tagAutocomplete(input.trim())
        setSuggestions(data.results || [])
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [input])

  useEffect(() => {
    function handleClick(e) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addTag = useCallback((name, exclude = false) => {
    const key = exclude ? 'exclude' : 'include'
    if (query[key].some(t => t.name === name)) return
    onQueryChange(q => ({
      ...q,
      [key]: [...q[key], { name, type: 'general', count: 0 }]
    }))
  }, [query, onQueryChange])

  const removeTag = useCallback((name) => {
    onQueryChange(q => ({
      ...q,
      include: q.include.filter(t => t.name !== name),
      exclude: q.exclude.filter(t => t.name !== name)
    }))
  }, [onQueryChange])

  const handleSearch = useCallback((e) => {
    e?.preventDefault()
    const tags = [
      ...query.include.map(t => t.name),
      ...query.exclude.map(t => `-${t.name}`)
    ]
    if (input.trim()) {
      tags.push(input.trim())
      setInput('')
    }
    navigate(`/search/1/${tags.join(',')}`)
  }, [input, query, navigate])

  function toggleSetting(key) {
    onSettingsChange(s => ({ ...s, [key]: !s[key] }))
  }

  const tagChip = (tag, type) => (
    <span key={tag.name} className={`tag-chip tag-${tag.type} ${type}`}>
      <span className="tag-name">{tag.name}</span>
      <button className="tag-remove" onClick={() => removeTag(tag.name)}>&times;</button>
    </span>
  )

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h1 className="logo">subooru</h1>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '\u2192' : '\u2190'}
        </button>
      </div>

      {!collapsed && (
        <>
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrap">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tags..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              <button type="submit" className="search-btn">Search</button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions" ref={suggestionRef}>
                {suggestions.map(t => (
                  <button
                    key={t.name}
                    type="button"
                    className={`suggestion-item tag-${t.type}`}
                    onClick={() => { addTag(t.name); setInput(''); setShowSuggestions(false) }}
                  >
                    <span className="suggestion-name">{t.name}</span>
                    <span className="suggestion-count">{t.count.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="sidebar-section">
            <h3>Tags</h3>
            <div className="tag-list">
              {query.include.map(t => tagChip(t, 'include'))}
              {query.exclude.map(t => tagChip(t, 'exclude'))}
            </div>
            {query.include.length === 0 && query.exclude.length === 0 && (
              <p className="hint">Type a tag and press Search</p>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Settings</h3>
            <label className="setting-row">
              <span>Column width</span>
              <input
                type="range"
                min="200"
                max="500"
                value={settings.columnWidth}
                onChange={e => onSettingsChange(s => ({ ...s, columnWidth: Number(e.target.value) }))}
              />
              <span className="setting-value">{settings.columnWidth}px</span>
            </label>
            <label className="setting-row">
              <span>Max post height</span>
              <input
                type="range"
                min="200"
                max="2000"
                value={settings.maxPostHeight}
                onChange={e => onSettingsChange(s => ({ ...s, maxPostHeight: Number(e.target.value) }))}
              />
              <span className="setting-value">{settings.maxPostHeight}px</span>
            </label>
            <label className="setting-row checkbox">
              <input type="checkbox" checked={settings.autoplayVideo} onChange={() => toggleSetting('autoplayVideo')} />
              <span>Autoplay videos</span>
            </label>
            <label className="setting-row checkbox">
              <input type="checkbox" checked={settings.muteVideo} onChange={() => toggleSetting('muteVideo')} />
              <span>Mute videos</span>
            </label>
          </div>

          {settings.blacklist.length > 0 && (
            <div className="sidebar-section">
              <h3>Blacklist</h3>
              <div className="tag-list">
                {settings.blacklist.map(t => (
                  <span key={t.name} className="tag-chip tag-general include">
                    {t.name}
                    <button className="tag-remove" onClick={() => onSettingsChange(s => ({
                      ...s, blacklist: s.blacklist.filter(b => b.name !== t.name)
                    }))}>&times;</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  )
}

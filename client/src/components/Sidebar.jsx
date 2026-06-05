import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { tagAutocomplete } from '../api.js'
import { tagBadgeColor, tagTextColor, updateTagTypeCache } from '../utils.js'

export default function Sidebar({ query, onQueryChange, settings, onSettingsChange, onCloseMobile, show, clientInclude }) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
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

  const handleSearch = useCallback((e) => {
    e?.preventDefault()
    const tags = [
      ...query.include.map(t => t.name),
      ...query.exclude.map(t => `-${t.name}`)
    ]
    if (settings.defaultTags !== false && clientInclude?.length) {
      const existing = new Set(tags)
      for (const name of clientInclude) {
        if (!existing.has(name) && !existing.has(`-${name}`)) {
          tags.unshift(name)
          existing.add(name)
        }
      }
    }
    if (input.trim()) {
      const parts = input.trim().split(/\s+/)
      for (const p of parts) {
        if (p && !tags.includes(p) && !tags.includes(`-${p}`)) {
          tags.push(p)
        }
      }
      setInput('')
    }
    navigate(`/search/1/${tags.join(',')}`)
    onCloseMobile?.()
  }, [input, query, navigate, onCloseMobile, settings.defaultTags, clientInclude])

  const addTag = useCallback((name, exclude = false, type) => {
    const resolvedType = type || (name.includes(':') ? 'metadata' : 'general')
    updateTagTypeCache(name, resolvedType)
    const key = exclude ? 'exclude' : 'include'
    if (query[key].some(t => t.name === name)) return
    onQueryChange(q => ({
      ...q,
      [key]: [...q[key], { name, type: resolvedType, count: 0 }]
    }))
  }, [query, onQueryChange])

  const removeTag = useCallback((name) => {
    onQueryChange(q => ({
      ...q,
      include: q.include.filter(t => t.name !== name),
      exclude: q.exclude.filter(t => t.name !== name)
    }))
  }, [onQueryChange])

  function toggleSetting(key) {
    onSettingsChange(s => ({ ...s, [key]: !s[key] }))
  }

  return (
    <aside
      className={`sidebar-overlay bg-dark border-end border-secondary d-flex flex-column position-fixed top-0 start-0 h-100 ${show ? 'sidebar-open' : 'sidebar-closed'}`}
      style={{ width: '280px', zIndex: 1045, overflowY: 'auto' }}
    >
      <div className="p-2 border-bottom border-secondary d-md-none">
        <button className="btn btn-sm btn-outline-light w-100" onClick={onCloseMobile}>
          Close sidebar
        </button>
      </div>

      <div className="p-2 position-relative">
        <div className="input-group input-group-sm">
          <input
            ref={inputRef}
            type="text"
            className="form-control form-control-sm bg-dark text-light border-secondary"
            placeholder="Search tags..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (input.trim()) {
                  addTag(input.trim())
                  setInput('')
                  setShowSuggestions(false)
                  inputRef.current?.focus()
                }
              }
            }}
          />
          <button className="btn btn-danger btn-sm" onClick={handleSearch}>Search</button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionRef}
            className="position-absolute start-2 end-2 bg-dark border border-secondary rounded-bottom"
            style={{ zIndex: 100, maxHeight: '300px', overflowY: 'auto' }}
          >
            {suggestions.map(t => (
              <button
                key={t.name}
                type="button"
                className="d-flex justify-content-between align-items-center w-100 px-2 py-1 text-start bg-transparent border-0 text-light"
                style={{ fontSize: '0.85rem' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0f3460'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => { updateTagTypeCache(t.name, t.type); addTag(t.name, false, t.type); setInput(''); setShowSuggestions(false); inputRef.current?.focus() }}
              >
                <span className={`${tagTextColor(t.type, t.name)}`}>{t.name}</span>
                {t.type !== 'metadata' && <span className="text-light opacity-75 small">{t.count.toLocaleString()}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-bottom border-secondary">
        <small className="text-light text-uppercase fw-bold opacity-75">Tags</small>
        <div className="d-flex flex-wrap gap-1 mt-1">
          {query.include.map(t => (
            <span key={t.name} className={`badge ${tagBadgeColor(t.type, t.name)} d-inline-flex align-items-center gap-1`} style={{ fontSize: '0.75rem' }}>
              {t.name}
              <button className="btn-close btn-close-white" style={{ fontSize: '0.5rem' }} onClick={() => removeTag(t.name)} />
            </span>
          ))}
          {query.exclude.map(t => (
            <span key={t.name} className="badge bg-danger d-inline-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              -{t.name}
              <button className="btn-close btn-close-white" style={{ fontSize: '0.5rem' }} onClick={() => removeTag(t.name)} />
            </span>
          ))}
        </div>
        {query.include.length === 0 && query.exclude.length === 0 && (
          <p className="text-muted small mt-1 mb-0">Type a tag and press Enter to add</p>
        )}
      </div>

      <div className="p-2 border-bottom border-secondary">
        <small className="text-light text-uppercase fw-bold opacity-75">Settings</small>
        <div className="mt-1">
          <label className="d-flex align-items-center gap-2 small mb-1">
            <span className="text-nowrap" style={{ minWidth: '85px' }}>Column width</span>
            <input
              type="range" className="form-range flex-grow-1" style={{ height: '4px' }}
              min="200" max="500"
              value={settings.columnWidth}
              onChange={e => onSettingsChange(s => ({ ...s, columnWidth: Number(e.target.value) }))}
            />
            <span className="text-muted" style={{ minWidth: '40px' }}>{settings.columnWidth}</span>
          </label>
          <label className="d-flex align-items-center gap-2 small mb-1">
            <span className="text-nowrap" style={{ minWidth: '85px' }}>Max height</span>
            <input
              type="range" className="form-range flex-grow-1" style={{ height: '4px' }}
              min="200" max="2000"
              value={settings.maxPostHeight}
              onChange={e => onSettingsChange(s => ({ ...s, maxPostHeight: Number(e.target.value) }))}
            />
            <span className="text-muted" style={{ minWidth: '40px' }}>{settings.maxPostHeight}</span>
          </label>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" id="autoplayVideo" checked={settings.autoplayVideo} onChange={() => toggleSetting('autoplayVideo')} />
            <label className="form-check-label small" htmlFor="autoplayVideo">Autoplay video</label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" id="muteVideo" checked={settings.muteVideo} onChange={() => toggleSetting('muteVideo')} />
            <label className="form-check-label small" htmlFor="muteVideo">Mute video</label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" id="defaultTags" checked={settings.defaultTags !== false} onChange={() => toggleSetting('defaultTags')} />
            <label className="form-check-label small" htmlFor="defaultTags">Default tags</label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" id="defaultBlacklist" checked={settings.defaultBlacklist !== false} onChange={() => toggleSetting('defaultBlacklist')} />
            <label className="form-check-label small" htmlFor="defaultBlacklist">Default blacklist</label>
          </div>
        </div>
      </div>
    </aside>
  )
}
